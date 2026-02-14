import { rateLimit, Options } from 'express-rate-limit';
import i18n from '../i18n';

/**
 * Stricter rate limiter for write operations (POST, PUT, DELETE)
 * - Window: 1 minute (60000ms)
 * - Max: 30 requests per window
 */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 write requests per windowMs
  message: i18n.t('errors:rateLimiter.writeLimitExceeded'),
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Factory function that creates custom rate limiters with configurable window and max
 * @param windowMs - Time window in milliseconds
 * @param max - Maximum number of requests per window
 * @param message - Custom error message
 * @returns Configured rate limit middleware
 */
export const createStrictLimiter = (
  windowMs: number,
  max: number,
  message: string = i18n.t('errors:rateLimiter.rateLimitExceeded')
) => {
  return rateLimit({
    windowMs,
    max,
    message,
    standardHeaders: true,
    legacyHeaders: false,
  });
};
