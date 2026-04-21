import express, { Request, Response } from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import i18nextMiddleware from 'i18next-http-middleware';
import { router } from './router';
import { initPrisma, checkDatabaseHealth } from './prisma';
import { validateJwtSecret } from './utils/jwtSecretValidation';
import { correlationIdMiddleware, requestLoggerMiddleware, logInfo, logError } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import i18n, { initI18n } from './i18n';
import { initializeScheduler, stopScheduler } from './services/businessDayScheduler';
import { initializeEmailWorker, stopEmailWorker } from './services/emailQueueWorker';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

/**
 * Validates a CORS origin against security requirements.
 * 
 * Security checks:
 * 1. Must be a valid URL with http:// or https:// protocol
 * 2. Must not contain special characters that could be used for malicious purposes
 * 3. Must match the expected pattern for IP addresses or domain names
 * 
 * @param origin - The origin URL to validate
 * @returns true if the origin is valid and allowed
 */
function isValidOrigin(origin: string): boolean {
  // Trim whitespace
  const trimmedOrigin = origin.trim();
  
  // Check for empty string
  if (!trimmedOrigin) {
    return false;
  }
  
  // Must start with http:// or https://
  if (!/^https?:\/\//i.test(trimmedOrigin)) {
    return false;
  }
  
  // Extract the hostname portion (after protocol)
  const urlMatch = trimmedOrigin.match(/^https?:\/\/([^\/:\?#]+)/i);
  if (!urlMatch) {
    return false;
  }
  
  const hostname = urlMatch[1];
  
  // Reject if hostname contains potentially dangerous characters
  // Allow: alphanumeric, dots, hyphens, and square brackets (for IPv6)
  if (!/^[a-zA-Z0-9\.\-\[\]:]+$/.test(hostname)) {
    return false;
  }
  
  // Reject if hostname starts or ends with a dot (common in malicious patterns)
  if (hostname.startsWith('.') || hostname.endsWith('.')) {
    return false;
  }
  
  // Reject if there are consecutive dots (could be used for bypass attempts)
  if (hostname.includes('..')) {
    return false;
  }
  
  // Validate hostname format - must be either:
  // - A valid IPv4 address (digits separated by dots)
  // - A valid IPv6 address (in brackets)
  // - A valid domain name (alphanumeric with dots and hyphens)
  
  // Check for IPv4
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    // Validate each octet is 0-255
    if (parts.every(part => part >= 0 && part <= 255)) {
      return true;
    }
    return false;
  }
  
  // Check for IPv6
  const ipv6Pattern = /^\[?([a-fA-F0-9:]+)\]?$/;
  if (ipv6Pattern.test(hostname)) {
    return true;
  }
  
  // Check for valid domain name
  // Must start and end with alphanumeric, can contain dots and hyphens in between
  const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
  if (domainPattern.test(hostname)) {
    return true;
  }
  
  // If none of the above patterns match, reject
  return false;
}

/**
 * Parses and validates CORS origins from environment variable.
 * 
 * @returns Array of validated origin URLs
 */
function getValidatedOrigins(): string[] {
  const defaultOrigins = ['http://localhost:80'];
  
  if (!process.env.CORS_ORIGIN) {
    return defaultOrigins;
  }
  
  const rawOrigins = process.env.CORS_ORIGIN.split(',');
  const validatedOrigins: string[] = [];
  
  for (const origin of rawOrigins) {
    const trimmedOrigin = origin.trim();
    
    if (isValidOrigin(trimmedOrigin)) {
      validatedOrigins.push(trimmedOrigin);
    } else {
      console.warn(`CORS: Rejected invalid origin: ${trimmedOrigin}`);
    }
  }
  
  // If no valid origins found, fall back to defaults
  if (validatedOrigins.length === 0) {
    console.warn('CORS: No valid origins found in CORS_ORIGIN, using defaults');
    return defaultOrigins;
  }
  
  return validatedOrigins;
}

// CORS options based on environment variables with validation
const corsOptions: CorsOptions = {
  origin: getValidatedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Correlation-ID'],  // Expose correlation ID header to clients
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

// Rate limiting configuration for different endpoints
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 requests per windowMs (increased for multi-user POS environments)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// More restrictive rate limit for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth requests per windowMs
  message: 'Too many authentication attempts from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Add correlation ID middleware - MUST be first to track all requests
app.use(correlationIdMiddleware);

// Enable CORS with configured options - MUST be before rate limiting
// to ensure CORS headers are present even on rate-limited responses
app.use(cors(corsOptions));

// Security middleware
app.use(helmet());

// Apply general rate limiting
app.use(generalRateLimit);

// Add request logger middleware
app.use(requestLoggerMiddleware);

// Custom body parser middleware that skips multipart/form-data
// This allows multer to handle file uploads in specific routes
app.use((req, res, next) => {
  const contentType = req.headers['content-type'];
  if (contentType && contentType.includes('multipart/form-data')) {
    // Skip body parsing for multipart requests - multer will handle these
    return next();
  }
  // For all other requests, parse as JSON
  express.json({ limit: '10mb' })(req, res, next);
});

// i18n middleware - adds req.t function for translations
app.use(i18nextMiddleware.handle(i18n));

// API routes
app.use('/api', router);

// Static file serving for uploaded logos
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath, {
  maxAge: '1d',
  setHeaders: (res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
}));

// Health check endpoint - comprehensive check including database connectivity
app.get('/health', async (req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  
  // Check database connectivity
  const dbHealth = await checkDatabaseHealth();
  
  // Check memory usage (percentage of available heap used)
  const memUsage = process.memoryUsage();
  const heapUsedPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
  const memoryStatus = heapUsedPercent < 90 ? 'OK' : 'WARNING';
  
  const checks = {
    server: { status: 'OK' },
    database: { 
      status: dbHealth.status,
      ...(dbHealth.responseTimeMs !== undefined && { responseTimeMs: dbHealth.responseTimeMs }),
      ...(dbHealth.error && { error: dbHealth.error })
    },
    memory: {
      status: memoryStatus,
      heapUsedPercent
    }
  };
  
  // Determine overall status
  const isHealthy = dbHealth.status === 'OK';
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'OK' : 'UNHEALTHY',
    timestamp,
    checks
  });
});

// 404 handler - MUST be before error handler
app.use('*', notFoundHandler);

// Error handling middleware - MUST be LAST in the middleware chain
app.use(errorHandler);

const startServer = async () => {
  try {
    // Validate JWT_SECRET before starting the server
    validateJwtSecret();
    
    // Initialize i18n for internationalization
    await initI18n();
    
    // Initialize Prisma client
    await initPrisma();
    
    // Initialize business day scheduler for automatic closing
    initializeScheduler();
    initializeEmailWorker();
    
    const HOST = process.env.HOST || '0.0.0.0';
    
    app.listen(PORT, HOST, () => {
      console.log(`Server is running on ${HOST}:${PORT}`);
      console.log(`Health check: http://${HOST}:${PORT}/health`);
      console.log(`API base: http://${HOST}:${PORT}/api`);
      logInfo(`Server started successfully on ${HOST}:${PORT}`);
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Failed to start server');
    process.exit(1);
  }
};

// Graceful shutdown handling
const gracefulShutdown = () => {
  logInfo('Received shutdown signal, stopping services...');
  stopScheduler();
  stopEmailWorker();
  logInfo('Services stopped, exiting...');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

if (require.main === module) {
  startServer();
}

export { app };