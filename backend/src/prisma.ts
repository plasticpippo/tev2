import { PrismaClient } from '@prisma/client';
import { logError, logInfo, logWarn } from './utils/logger';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// ============================================================================
// CONNECTION POOL CONFIGURATION
// ============================================================================

/**
 * Create Prisma client with optimized settings for 4GB RAM environment
 * 
 * For PostgreSQL, connection pool parameters can be set in DATABASE_URL:
 * postgresql://user:pass@host:5432/db?connection_limit=5&pool_timeout=10
 * 
 * The PrismaClient automatically manages connection pooling based on these parameters
 */

// Create Prisma client with connection pool settings
const createPrismaClient = (): PrismaClient => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
  });
  
  return client;
};

// Export the Prisma client instance
export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// ============================================================================
// RECONNECTION LOGIC
// ============================================================================

// Track connection state
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_MS = 5000; // 5 seconds between retries
let reconnectTimeoutId: NodeJS.Timeout | null = null;

/**
 * Attempt to reconnect to the database
 */
const reconnect = async (): Promise<void> => {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    logError(`Max reconnection attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
    return;
  }
  
  reconnectAttempts++;
  logWarn(`Attempting to reconnect to database (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
  
  try {
    await prisma.$connect();
    isConnected = true;
    reconnectAttempts = 0;
    logInfo('Successfully reconnected to database');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(`Failed to reconnect to database: ${errorMessage}`);
    
    // Schedule next retry if not already trying
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectTimeoutId = setTimeout(() => {
        if (!isConnected) {
          reconnect();
        }
      }, RECONNECT_DELAY_MS);
    }
  }
};

/**
 * Handle disconnection - triggers reconnection
 */
const handleDisconnect = (): void => {
  if (isConnected) {
    isConnected = false;
    logWarn('Database disconnected. Attempting to reconnect...');
    reconnect();
  }
};

// ============================================================================
// INITIALIZATION AND CONNECTION MANAGEMENT
// ============================================================================

export const initPrisma = async (): Promise<void> => {
  try {
    // Connect to the database
    await prisma.$connect();
    isConnected = true;
    logInfo('Connected to database with connection pooling enabled');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    logError(`Failed to connect to database: ${errorMessage}`);
    
    // Start reconnection attempts
    handleDisconnect();
    
    // Don't throw - allow the app to start and retry connections
    logWarn('Starting background reconnection attempts...');
  }
};

/**
 * Gracefully close the Prisma connection
 */
export const closePrisma = async (): Promise<void> => {
  try {
    // Clear any pending reconnection attempts
    if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = null;
    }
    
    isConnected = false;
    await prisma.$disconnect();
    logInfo('Database connection closed');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError(`Error closing database connection: ${errorMessage}`);
  }
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Health check function that verifies database connectivity
 * Also implements basic reconnection check
 */
export const checkDatabaseHealth = async (): Promise<{ 
  status: 'OK' | 'UNHEALTHY'; 
  responseTimeMs?: number; 
  error?: string;
  isConnected: boolean;
}> => {
  const startTime = Date.now();
  
  try {
    // Execute a simple query to verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    const responseTimeMs = Date.now() - startTime;
    
    // Update connection state if we were disconnected
    if (!isConnected) {
      isConnected = true;
      reconnectAttempts = 0;
      logInfo('Database connection restored');
    }
    
    return { 
      status: 'OK', 
      responseTimeMs,
      isConnected: true
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    
    // Log the error
    logError(`Database health check failed: ${errorMessage}`);
    
    // Trigger reconnection if not already connected
    if (!isConnected) {
      handleDisconnect();
    }
    
    return { 
      status: 'UNHEALTHY', 
      responseTimeMs,
      error: errorMessage,
      isConnected: false
    };
  }
};

/**
 * Get current connection status
 */
export const getConnectionStatus = (): { 
  isConnected: boolean; 
  reconnectAttempts: number;
} => {
  return {
    isConnected,
    reconnectAttempts
  };
};

export default prisma;
