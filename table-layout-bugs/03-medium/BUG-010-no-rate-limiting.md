# BUG-010: No Rate Limiting on API Endpoints

## Severity Level
**MEDIUM**

## File Location
- `backend/src/handlers/layouts.ts` (lines 1-100)

## Description

The layouts API endpoints lack rate limiting, allowing malicious users to send unlimited requests. This can lead to server overload, database exhaustion, and denial of service attacks.

## Current Vulnerable Code

```typescript
// backend/src/handlers/layouts.ts
import { Router } from 'express';

const router = Router();

// BUG: No rate limiting on any endpoint!
router.get('/layouts', async (req, res) => {
  const layouts = await prisma.layout.findMany();
  res.json(layouts);
});

router.post('/layouts', async (req, res) => {
  const layout = await prisma.layout.create({ data: req.body });
  res.json(layout);
});

router.put('/layouts/:id', async (req, res) => {
  const layout = await prisma.layout.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(layout);
});

router.delete('/layouts/:id', async (req, res) => {
  await prisma.layout.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
```

## Attack Scenarios

```bash
# Scenario 1: Simple DoS
curl -X GET http://192.168.1.241:3000/api/layouts &
curl -X GET http://192.168.1.241:3000/api/layouts &
# ... repeat 1000 times

# Scenario 2: Database Exhaustion
for i in {1..10000}; do
  curl -X POST http://192.168.1.241:3000/api/layouts \
    -H "Content-Type: application/json" \
    -d '{"name": "spam", "config": {}}' &
done

# Scenario 3: Brute Force Layout ID Enumeration
for id in {1..100000}; do
  curl -X GET http://192.168.1.241:3000/api/layouts/$id &
done
```

## Root Cause Analysis

1. **Missing Middleware**: No rate limiting middleware applied to routes
2. **No IP Tracking**: No mechanism to track requests per IP/user
3. **Missing Configuration**: No rate limit settings in environment variables

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| DoS Attack | HIGH | Server can be overwhelmed |
| Database Overload | HIGH | Excessive queries can crash DB |
| Resource Exhaustion | MEDIUM | Memory/CPU spikes |
| Cost Impact | MEDIUM | Cloud costs from abuse |

## Suggested Fix

### Option 1: Express-Rate-Limit (Recommended)

```typescript
// backend/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP',
    retryAfter: 900,
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Optional: Use Redis for distributed rate limiting
  // store: new RedisStore({ client: redisClient }),
});

// Stricter limit for write operations
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 writes per minute
  message: {
    error: 'Too many write operations',
    retryAfter: 60,
  },
});

// Very strict for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  skipSuccessfulRequests: true,
});
```

```typescript
// backend/src/handlers/layouts.ts - Fixed
import { Router } from 'express';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiter';

const router = Router();

// Apply general rate limit to all routes
router.use(apiLimiter);

// Read operations - standard limit
router.get('/layouts', async (req, res) => {
  const layouts = await prisma.layout.findMany();
  res.json(layouts);
});

// Write operations - stricter limit
router.post('/layouts', writeLimiter, async (req, res) => {
  const layout = await prisma.layout.create({ data: req.body });
  res.json(layout);
});

router.put('/layouts/:id', writeLimiter, async (req, res) => {
  const layout = await prisma.layout.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(layout);
});

router.delete('/layouts/:id', writeLimiter, async (req, res) => {
  await prisma.layout.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
```

### Option 2: User-Based Rate Limiting

```typescript
// backend/src/middleware/userRateLimiter.ts
import rateLimit from 'express-rate-limit';

export const createUserRateLimiter = (maxRequests: number, windowMs: number) => {
  return rateLimit({
    windowMs,
    max: (req) => {
      // Different limits for different user types
      if (req.user?.role === 'admin') return maxRequests * 5;
      if (req.user?.role === 'premium') return maxRequests * 2;
      return maxRequests;
    },
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      return req.user?.id || req.ip;
    },
    handler: (req, res) => {
      res.status(429).json({
        error: 'Rate limit exceeded',
        limit: req.rateLimit?.limit,
        current: req.rateLimit?.current,
        remaining: req.rateLimit?.remaining,
        resetTime: req.rateLimit?.resetTime,
      });
    },
  });
};

// Usage
const layoutLimiter = createUserRateLimiter(50, 15 * 60 * 1000);
router.use('/layouts', layoutLimiter);
```

### Option 3: Custom Implementation

```typescript
// backend/src/middleware/customRateLimiter.ts
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export const customRateLimiter = (
  maxRequests: number,
  windowMs: number
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();
    
    // Clean up expired entries
    if (store[key] && store[key].resetTime < now) {
      delete store[key];
    }
    
    // Initialize or increment
    if (!store[key]) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
    } else {
      store[key].count++;
    }
    
    // Add headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - store[key].count));
    res.setHeader('X-RateLimit-Reset', store[key].resetTime);
    
    // Check limit
    if (store[key].count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
      });
    }
    
    next();
  };
};
```

## Testing Strategy

```typescript
// rate-limiting.test.ts
import request from 'supertest';
import { app } from '../app';

describe('Rate Limiting', () => {
  it('should allow requests under the limit', async () => {
    const response = await request(app)
      .get('/api/layouts')
      .expect(200);
    
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
  });
  
  it('should block requests over the limit', async () => {
    // Make requests up to limit
    for (let i = 0; i < 100; i++) {
      await request(app).get('/api/layouts');
    }
    
    // Next request should be blocked
    const response = await request(app)
      .get('/api/layouts')
      .expect(429);
    
    expect(response.body.error).toContain('Too many requests');
    expect(response.headers['retry-after']).toBeDefined();
  });
  
  it('should have separate limits for write operations', async () => {
    // Make 10 POST requests
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/layouts')
        .send({ name: `test-${i}` });
    }
    
    // 11th should be blocked
    await request(app)
      .post('/api/layouts')
      .send({ name: 'blocked' })
      .expect(429);
    
    // But GET should still work
    await request(app)
      .get('/api/layouts')
      .expect(200);
  });
  
  it('should reset limit after window expires', async () => {
    // Use fake timers for faster testing
    jest.useFakeTimers();
    
    // Exhaust limit
    for (let i = 0; i < 100; i++) {
      await request(app).get('/api/layouts');
    }
    
    await request(app).get('/api/layouts').expect(429);
    
    // Advance time past window
    jest.advanceTimersByTime(15 * 60 * 1000 + 1000);
    
    // Should work again
    await request(app).get('/api/layouts').expect(200);
    
    jest.useRealTimers();
  });
});
```

## Configuration

```bash
# .env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WRITE_MAX=10
RATE_LIMIT_WRITE_WINDOW_MS=60000
```

## Monitoring

```typescript
// Log rate limit hits for monitoring
const rateLimitLogger = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(body) {
    if (res.statusCode === 429) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userId: req.user?.id,
        path: req.path,
        method: req.method,
      });
    }
    return originalJson.call(this, body);
  };
  
  next();
};
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Install express-rate-limit | 15 min |
| Create rate limiter middleware | 1 hour |
| Apply to all layout endpoints | 30 min |
| Configure limits per environment | 30 min |
| Testing | 1 hour |
| **Total** | **3.25 hours** |

## Related Issues

- [BUG-001: Missing Authentication](./../01-critical/BUG-001-missing-authentication.md)
- [Security Vulnerabilities](../../docs/security-vulnerabilities.md)

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
