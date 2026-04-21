import { rateLimit } from 'express-rate-limit';
import { Request, Response } from 'express';

export const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const t = req.t.bind(req);
    res.status(429).json({ error: t('errors:rateLimiter.writeLimitExceeded') });
  },
});

export const createStrictLimiter = (
  windowMs: number,
  max: number,
  message: string = 'Too many requests, please try again later'
) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      const t = req.t.bind(req);
      res.status(429).json({ error: t('errors:rateLimiter.rateLimitExceeded') });
    },
  });
};

export const customerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    const t = req.t.bind(req);
    res.status(429).json({ error: t('errors:rateLimiter.rateLimitExceeded') });
  },
});
