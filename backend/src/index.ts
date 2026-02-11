import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { router } from './router';
import { initPrisma } from './prisma';
import { validateJwtSecret } from './utils/jwtSecretValidation';
import { correlationIdMiddleware, requestLoggerMiddleware, logInfo, logError } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// CORS options based on environment variables
const corsOptions: cors.CorsOptions = {
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : [
    'http://localhost:80'
  ],
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
  max: 500, // limit each IP to 500 requests per windowMs (increased for POS system)
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

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// API routes
app.use('/api', router);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler - MUST be before error handler
app.use('*', notFoundHandler);

// Error handling middleware - MUST be LAST in the middleware chain
app.use(errorHandler);

const startServer = async () => {
  try {
    // Validate JWT_SECRET before starting the server
    validateJwtSecret();
    
    // Initialize Prisma client
    await initPrisma();
    
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

if (require.main === module) {
  startServer();
}

export { app };