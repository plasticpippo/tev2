/**
 * Centralized Error Handler Middleware
 * 
 * This module provides comprehensive error handling following OWASP best practices:
 * - Environment-based error responses (detailed in development, generic in production)
 * - Secure server-side logging with correlation IDs
 * - No information disclosure in production
 * - Proper error classification and HTTP status codes
 * - Support for different error types
 * 
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
 */

import { Request, Response, NextFunction } from 'express';
import { logError, logSecurityAlert } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Error severity levels for classification
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error categories for classification
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  BUSINESS_LOGIC = 'business_logic',
  EXTERNAL_SERVICE = 'external_service',
  DATABASE = 'database',
  INTERNAL = 'internal',
  RATE_LIMIT = 'rate_limit'
}

/**
 * Custom error interface with additional properties
 */
export interface AppError extends Error {
  statusCode?: number;
  category?: ErrorCategory;
  severity?: ErrorSeverity;
  isOperational?: boolean;
  details?: Record<string, any>;
  correlationId?: string;
}

/**
 * HTTP Error interface
 */
export interface HttpError extends Error {
  statusCode: number;
  message: string;
}

// ============================================================================
// ERROR CLASSES
// ============================================================================

/**
 * Base application error class
 */
export class ApplicationError extends Error implements AppError {
  statusCode: number;
  category: ErrorCategory;
  severity: ErrorSeverity;
  isOperational: boolean;
  details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    category: ErrorCategory = ErrorCategory.INTERNAL,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.category = category;
    this.severity = severity;
    this.isOperational = isOperational;
    this.details = details;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends ApplicationError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      400,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      true,
      details
    );
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication failed', details?: Record<string, any>) {
    super(
      message,
      401,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.MEDIUM,
      true,
      details
    );
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Access denied', details?: Record<string, any>) {
    super(
      message,
      403,
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.MEDIUM,
      true,
      details
    );
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends ApplicationError {
  constructor(message: string = 'Resource not found', details?: Record<string, any>) {
    super(
      message,
      404,
      ErrorCategory.NOT_FOUND,
      ErrorSeverity.LOW,
      true,
      details
    );
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends ApplicationError {
  constructor(message: string, details?: Record<string, any>) {
    super(
      message,
      409,
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.LOW,
      true,
      details
    );
    this.name = 'ConflictError';
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Too many requests', details?: Record<string, any>) {
    super(
      message,
      429,
      ErrorCategory.RATE_LIMIT,
      ErrorSeverity.MEDIUM,
      true,
      details
    );
    this.name = 'RateLimitError';
  }
}

/**
 * Internal server error (500)
 */
export class InternalServerError extends ApplicationError {
  constructor(message: string = 'Internal server error', details?: Record<string, any>) {
    super(
      message,
      500,
      ErrorCategory.INTERNAL,
      ErrorSeverity.HIGH,
      false,
      details
    );
    this.name = 'InternalServerError';
  }
}

/**
 * Database error (500)
 */
export class DatabaseError extends ApplicationError {
  constructor(message: string = 'Database error', details?: Record<string, any>) {
    super(
      message,
      500,
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      false,
      details
    );
    this.name = 'DatabaseError';
  }
}

/**
 * External service error (502/503)
 */
export class ExternalServiceError extends ApplicationError {
  constructor(message: string = 'External service error', details?: Record<string, any>) {
    super(
      message,
      502,
      ErrorCategory.EXTERNAL_SERVICE,
      ErrorSeverity.HIGH,
      false,
      details
    );
    this.name = 'ExternalServiceError';
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if the current environment is production
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Check if the current environment is development
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
}

/**
 * Check if the current environment is test
 */
function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Determine if an error is operational (expected) or programming error
 */
function isOperationalError(error: Error): boolean {
  if (error instanceof ApplicationError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Get appropriate HTTP status code for an error
 */
function getStatusCode(error: Error): number {
  if (error instanceof ApplicationError) {
    return error.statusCode;
  }
  
  // Handle common Node.js/Express errors
  if ((error as any).statusCode) {
    return (error as any).statusCode;
  }
  
  // Default to 500 for unknown errors
  return 500;
}

/**
 * Get error category for classification
 */
function getErrorCategory(error: Error): ErrorCategory {
  if (error instanceof ApplicationError) {
    return error.category;
  }
  
  // Infer category from error name or message
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();
  
  if (errorName.includes('validation') || errorMessage.includes('validation')) {
    return ErrorCategory.VALIDATION;
  }
  if (errorName.includes('auth') || errorMessage.includes('unauthorized')) {
    return ErrorCategory.AUTHENTICATION;
  }
  if (errorMessage.includes('forbidden') || errorMessage.includes('access denied')) {
    return ErrorCategory.AUTHORIZATION;
  }
  if (errorName.includes('not found') || errorMessage.includes('not found')) {
    return ErrorCategory.NOT_FOUND;
  }
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
    return ErrorCategory.RATE_LIMIT;
  }
  if (errorMessage.includes('database') || errorMessage.includes('prisma')) {
    return ErrorCategory.DATABASE;
  }
  if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
    return ErrorCategory.EXTERNAL_SERVICE;
  }
  
  return ErrorCategory.INTERNAL;
}

/**
 * Get error severity for classification
 */
function getErrorSeverity(error: Error): ErrorSeverity {
  if (error instanceof ApplicationError) {
    return error.severity;
  }
  
  const statusCode = getStatusCode(error);
  
  // 5xx errors are high severity
  if (statusCode >= 500) {
    return ErrorSeverity.HIGH;
  }
  
  // 4xx errors are low to medium severity
  if (statusCode >= 400) {
    return ErrorSeverity.LOW;
  }
  
  return ErrorSeverity.MEDIUM;
}

/**
 * Get user-friendly error message based on environment
 */
function getUserMessage(error: Error, statusCode: number): string {
  // In production, return generic messages
  if (isProduction()) {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input and try again.';
      case 401:
        return 'Authentication required. Please log in and try again.';
      case 403:
        return 'Access denied. You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'The request could not be completed due to a conflict.';
      case 429:
        return 'Too many requests. Please wait and try again later.';
      case 500:
      case 502:
      case 503:
        return 'An unexpected error occurred. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
  
  // In development/test, return the actual error message
  return error.message;
}

/**
 * Extract client IP address from request
 */
function getClientIp(req: Request): string {
  return (req.ip || 
          req.socket.remoteAddress || 
          req.connection.remoteAddress || 
          'unknown') as string;
}

/**
 * Extract user agent from request
 */
function getUserAgent(req: Request): string {
  return req.get('user-agent') || 'unknown';
}

/**
 * Get correlation ID from request
 */
function getCorrelationId(req: Request): string {
  return (req as any).correlationId || 'unknown';
}

/**
 * Sanitize error details for client response
 * Removes sensitive information before sending to client
 */
function sanitizeErrorDetails(details?: Record<string, any>): Record<string, any> | undefined {
  if (!details) {
    return undefined;
  }
  
  // In production, never return details
  if (isProduction()) {
    return undefined;
  }
  
  // In development, return details as-is (for debugging)
  return details;
}

/**
 * Build error response object
 */
function buildErrorResponse(
  error: Error,
  statusCode: number,
  correlationId: string
): Record<string, any> {
  const isProd = isProduction();
  const isDev = isDevelopment();
  
  const response: Record<string, any> = {
    error: getUserMessage(error, statusCode),
    correlationId,
  };
  
  // Add status code
  response.statusCode = statusCode;
  
  // In development, include additional debugging information
  if (isDev || isTest()) {
    response.message = error.message;
    response.name = error.name;
    
    // Include stack trace in development
    if (error.stack) {
      response.stack = error.stack;
    }
    
    // Include error details if available
    if (error instanceof ApplicationError && error.details) {
      response.details = error.details;
    }
  }
  
  return response;
}

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

/**
 * Centralized error handler middleware
 * 
 * This middleware catches all errors and handles them according to OWASP best practices:
 * - Logs comprehensive error information server-side
 * - Returns generic error messages to clients in production
 * - Includes correlation IDs for debugging
 * - Never exposes stack traces or internal system details in production
 * 
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function (not used, but required for error middleware)
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Get request context
  const correlationId = getCorrelationId(req);
  const clientIp = getClientIp(req);
  const userAgent = getUserAgent(req);
  const path = req.path;
  const method = req.method;
  
  // Determine error properties
  const statusCode = getStatusCode(err);
  const category = getErrorCategory(err);
  const severity = getErrorSeverity(err);
  const isOperational = isOperationalError(err);
  
  // Log comprehensive error information server-side
  logError(err, {
    correlationId,
    path,
    method,
    ip: clientIp,
    userAgent,
    statusCode,
    category,
    severity,
    isOperational,
    ...(err instanceof ApplicationError && err.details && { details: err.details }),
  });
  
  // Log security alerts for high/critical severity errors
  if (severity === ErrorSeverity.HIGH || severity === ErrorSeverity.CRITICAL) {
    logSecurityAlert(
      'HIGH_SEVERITY_ERROR',
      `High severity error occurred: ${err.name}`,
      {
        correlationId,
        path,
        method,
        statusCode,
        category,
        isOperational,
      },
      severity
    );
  }
  
  // Build and send error response
  const errorResponse = buildErrorResponse(err, statusCode, correlationId);
  
  res.status(statusCode).json(errorResponse);
}

// ============================================================================
// 404 NOT FOUND HANDLER
// ============================================================================

/**
 * 404 Not Found handler
 * 
 * This handler is called when no route matches the request
 * 
 * @param req - Express request object
 * @param res - Express response object
 */
export function notFoundHandler(req: Request, res: Response): void {
  const correlationId = (req as any).correlationId || 'unknown';
  const clientIp = getClientIp(req);
  const userAgent = getUserAgent(req);
  
  // Log 404 error
  logError('Route not found', {
    correlationId,
    path: req.path,
    method: req.method,
    ip: clientIp,
    userAgent,
    statusCode: 404,
    category: ErrorCategory.NOT_FOUND,
    severity: ErrorSeverity.LOW,
    isOperational: true,
  });
  
  // Build error response
  const isProd = isProduction();
  const response: Record<string, any> = {
    error: isProd ? 'The requested resource was not found.' : `Route ${req.method} ${req.path} not found`,
    correlationId,
    statusCode: 404,
  };
  
  // In development, include additional information
  if (!isProd) {
    response.path = req.path;
    response.method = req.method;
  }
  
  res.status(404).json(response);
}

// ============================================================================
// ASYNC ERROR WRAPPER
// ============================================================================

/**
 * Async error wrapper for route handlers
 * 
 * This function wraps async route handlers to automatically catch and forward errors
 * to the error handler middleware
 * 
 * @param fn - Async route handler function
 * @returns Wrapped function with error handling
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  // Error classes
  ApplicationError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  DatabaseError,
  ExternalServiceError,
  // Enums
  ErrorSeverity,
  ErrorCategory,
};
