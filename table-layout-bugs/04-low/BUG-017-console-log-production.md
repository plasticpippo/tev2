# BUG-017: Console Logs Present in Production Code

## Severity Level
**LOW**

## File Location
- `frontend/services/gridLayoutService.ts` (lines 25-60)
- `frontend/contexts/LayoutContext.tsx` (lines 100-140)
- `backend/src/handlers/layouts.ts` (lines 70-100)
- `backend/src/middleware/logger.ts` (lines 15-45)

## Description

Development `console.log` statements are present throughout the production codebase. These logs clutter the browser console and server logs, may expose sensitive information, and negatively impact performance. There's no systematic approach to logging levels or environment-based log suppression.

## Current Vulnerable Code

```typescript
// frontend/services/gridLayoutService.ts - Line 25-60
export const fetchLayouts = async (): Promise<Layout[]> => {
  console.log('Fetching layouts...'); // BUG: Unconditional log
  
  try {
    const response = await api.get('/layouts');
    console.log('Layouts fetched:', response.data); // BUG: Logs all data
    console.log('Total layouts:', response.data.length); // BUG: Redundant log
    return response.data;
  } catch (error) {
    console.log('Error fetching layouts:', error); // BUG: Should use console.error
    throw error;
  }
};

export const saveLayout = async (layout: Layout): Promise<Layout> => {
  console.log('Saving layout:', layout); // BUG: May log sensitive data
  
  const response = await api.post('/layouts', layout);
  console.log('Layout saved successfully!'); // BUG: Debug log in production
  
  return response.data;
};
```

```tsx
// frontend/contexts/LayoutContext.tsx - Line 100-140
const LayoutProvider: React.FC = ({ children }) => {
  const [state, dispatch] = useReducer(layoutReducer, initialState);
  
  useEffect(() => {
    console.log('LayoutContext mounted'); // BUG: Component lifecycle log
    console.log('Initial state:', state); // BUG: Logs full state
  }, []);
  
  useEffect(() => {
    console.log('State changed:', state); // BUG: Logs on every state change
  }, [state]);
  
  const updateLayout = useCallback((updates: Partial<Layout>) => {
    console.log('Updating layout with:', updates); // BUG: Debug logging
    dispatch({ type: 'UPDATE_LAYOUT', payload: updates });
  }, []);
  
  const handleError = (error: Error) => {
    console.log('Layout error occurred:', error); // BUG: Wrong log level
    console.log('Error stack:', error.stack); // BUG: Exposes stack traces
    dispatch({ type: 'SET_ERROR', payload: error.message });
  };
  
  return (
    <LayoutContext.Provider value={{ state, updateLayout }}>
      {children}
    </LayoutContext.Provider>
  );
};
```

```typescript
// backend/src/handlers/layouts.ts - Line 70-100
router.post('/layouts', async (req, res) => {
  console.log('Received layout creation request'); // BUG: HTTP logging in handler
  console.log('Request body:', req.body); // BUG: May log sensitive user data
  
  try {
    const layout = await prisma.layout.create({
      data: req.body,
    });
    
    console.log('Created layout:', layout); // BUG: Logs created record
    res.status(201).json(layout);
  } catch (error) {
    console.log('Database error:', error); // BUG: Should use proper logger
    res.status(500).json({ error: 'Failed to create layout' });
  }
});
```

```typescript
// backend/src/middleware/logger.ts - Line 15-45
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`); // BUG: No timestamp, no structured format
  console.log('Headers:', req.headers); // BUG: Logs all headers including auth tokens
  console.log('Query:', req.query); // BUG: Logs query parameters
  
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`Request completed in ${duration}ms`); // BUG: No request ID correlation
    console.log(`Status: ${res.statusCode}`); // BUG: Separate log lines
  });
  
  next();
};
```

## Production Log Output Example

```
# Browser console - cluttered with debug logs
Fetching layouts...
Layouts fetched: (100) [{...}, {...}, ...]
Total layouts: 100
LayoutContext mounted
Initial state: {layouts: Array(0), loading: false, error: null}
State changed: {layouts: Array(100), loading: false, error: null}
Updating layout with: {name: "New Layout"}
State changed: {layouts: Array(100), loading: false, error: null}
...

# Server logs - unstructured and noisy
Received layout creation request
Request body: { name: "Secret Layout", config: {...} }
POST /api/layouts
Headers: { authorization: "Bearer eyJhbG...", ... }
Created layout: { id: "123", name: "Secret Layout", ... }
Request completed in 45ms
Status: 201
```

## Root Cause Analysis

1. **No Logging Framework**: Using raw console instead of proper logger
2. **No Environment Checks**: Logs not conditionally enabled
3. **Debug Leftovers**: Development logs never cleaned up
4. **No Log Levels**: Everything uses console.log
5. **No Structured Logging**: Unstructured plain text output

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Performance | LOW | Console I/O blocks main thread |
| Security | LOW | May expose sensitive data in logs |
| Debugging | LOW | Cluttered logs hide real issues |
| Storage | LOW | Excessive log volume |

## Suggested Fix

### Option 1: Winston Logger with Environment Control (Recommended)

```typescript
// backend/src/lib/logger.ts
import winston from 'winston';

const { combine, timestamp, json, errors, printf } = winston.format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Create logger instance
export const logger = winston.createLogger({
  level: isDevelopment ? 'debug' : 'info',
  defaultMeta: {
    service: 'table-layout-api',
    environment: process.env.NODE_ENV,
  },
  format: combine(
    timestamp(),
    errors({ stack: isDevelopment }),
    isDevelopment ? devFormat : json()
  ),
  transports: [
    // Console for all environments except test
    ...(isTest ? [] : [
      new winston.transports.Console({
        silent: isTest,
      }),
    ]),
    
    // File logging for production
    ...(process.env.NODE_ENV === 'production' ? [
      new winston.transports.File({ 
        filename: 'logs/error.log', 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: 'logs/combined.log' 
      }),
    ] : []),
  ],
  // Silent in test environment
  silent: isTest,
});

// Stream for Morgan HTTP logger integration
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};
```

```typescript
// frontend/src/lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// No-op function for production/test
const noop = () => {};

// Create environment-aware logger
const createLogger = (level: LogLevel): Logger => {
  // In test, completely silence logs
  if (isTest) {
    return { debug: noop, info: noop, warn: noop, error: noop };
  }
  
  // In production, only log warnings and errors to console
  if (!isDevelopment) {
    return {
      debug: noop,
      info: noop,
      warn: console.warn.bind(console),
      error: console.error.bind(console),
    };
  }
  
  // In development, use all console methods
  return {
    debug: console.log.bind(console, '[DEBUG]'),
    info: console.info.bind(console, '[INFO]'),
    warn: console.warn.bind(console, '[WARN]'),
    error: console.error.bind(console, '[ERROR]'),
  };
};

export const logger = createLogger(
  (process.env.LOG_LEVEL as LogLevel) || 'info'
);

// Specialized loggers for different domains
export const layoutLogger = {
  debug: (msg: string, meta?: any) => logger.debug(`[Layout] ${msg}`, meta),
  info: (msg: string, meta?: any) => logger.info(`[Layout] ${msg}`, meta),
  warn: (msg: string, meta?: any) => logger.warn(`[Layout] ${msg}`, meta),
  error: (msg: string, meta?: any) => logger.error(`[Layout] ${msg}`, meta),
};

export const apiLogger = {
  debug: (msg: string, meta?: any) => logger.debug(`[API] ${msg}`, meta),
  info: (msg: string, meta?: any) => logger.info(`[API] ${msg}`, meta),
  warn: (msg: string, meta?: any) => logger.warn(`[API] ${msg}`, meta),
  error: (msg: string, meta?: any) => logger.error(`[API] ${msg}`, meta),
};
```

```typescript
// backend/src/handlers/layouts.ts - Fixed
import { logger } from '../lib/logger';

router.post('/layouts', async (req, res, next) => {
  logger.debug('Processing layout creation request', {
    userId: req.user?.id,
    layoutName: req.body.name,
  });
  
  try {
    const layout = await prisma.layout.create({
      data: req.body,
    });
    
    logger.info('Layout created', {
      layoutId: layout.id,
      userId: req.user?.id,
    });
    
    res.status(201).json(layout);
  } catch (error) {
    logger.error('Failed to create layout', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    next(error);
  }
});
```

```typescript
// frontend/services/gridLayoutService.ts - Fixed
import { layoutLogger } from '../lib/logger';

export const fetchLayouts = async (): Promise<Layout[]> => {
  layoutLogger.debug('Fetching layouts');
  
  try {
    const response = await api.get('/layouts');
    layoutLogger.info('Layouts fetched', { count: response.data.length });
    return response.data;
  } catch (error) {
    layoutLogger.error('Failed to fetch layouts', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    throw error;
  }
};
```

### Option 2: ESLint Rule to Prevent Console Logs

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    // Error on console.log in production code
    'no-console': ['error', { allow: ['warn', 'error'] }],
    
    // Or use a custom rule for more control
    'no-restricted-syntax': [
      'error',
      {
        selector: 'CallExpression[callee.object.name="console"][callee.property.name="log"]',
        message: 'Use the logger utility instead of console.log',
      },
    ],
  },
};
```

```bash
# Add pre-commit hook to catch console.log
npm install --save-dev husky lint-staged

# .husky/pre-commit
npx lint-staged

# package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

### Option 3: Babel Plugin to Strip Console

```javascript
// babel.config.js (for production builds)
module.exports = {
  env: {
    production: {
      plugins: [
        ['transform-remove-console', { exclude: ['error', 'warn'] }],
      ],
    },
  },
};
```

```bash
npm install --save-dev babel-plugin-transform-remove-console
```

### Option 4: Structured HTTP Logger

```typescript
// backend/src/middleware/httpLogger.ts
import morgan from 'morgan';
import { loggerStream } from '../lib/logger';

// Custom Morgan format with structured logging
const morganFormat = process.env.NODE_ENV === 'production'
  ? ':remote-addr - :remote-user [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms'
  : 'dev';

export const httpLogger = morgan(morganFormat, {
  stream: loggerStream,
  skip: (req) => {
    // Skip health checks in production
    if (process.env.NODE_ENV === 'production') {
      return req.url === '/health' || req.url === '/ping';
    }
    return false;
  },
});
```

## Testing Strategy

```typescript
// logger.test.ts
describe('Logger', () => {
  const originalEnv = process.env.NODE_ENV;
  
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });
  
  it('should log in development', () => {
    process.env.NODE_ENV = 'development';
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { logger } = require('./logger');
    logger.debug('test message');
    
    expect(consoleSpy).toHaveBeenCalledWith('[DEBUG]', 'test message');
  });
  
  it('should not log debug in production', () => {
    process.env.NODE_ENV = 'production';
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { logger } = require('./logger');
    logger.debug('test message');
    
    expect(consoleSpy).not.toHaveBeenCalled();
  });
  
  it('should always log errors', () => {
    process.env.NODE_ENV = 'production';
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { logger } = require('./logger');
    logger.error('test error');
    
    expect(consoleSpy).toHaveBeenCalledWith('[ERROR]', 'test error');
  });
  
  it('should be silent in test environment', () => {
    process.env.NODE_ENV = 'test';
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { logger } = require('./logger');
    logger.debug('test');
    logger.error('test');
    
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
```

## Log Cleanup Script

```bash
#!/bin/bash
# scripts/remove-console-logs.sh

# Find all console.log statements
echo "Finding console.log statements..."
grep -r "console\.log" --include="*.ts" --include="*.tsx" src/

# Optional: Auto-remove (use with caution)
# find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' '/console\.log/d'

echo "Review and remove console.log statements manually or use the logger utility"
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Set up Winston logger (backend) | 30 min |
| Set up environment-aware logger (frontend) | 30 min |
| Replace all console.log statements | 1 hour |
| Add ESLint rules | 15 min |
| Add Babel plugin for production | 15 min |
| Testing | 30 min |
| **Total** | **3 hours** |

## Related Issues

- [BUG-015: Verbose Error Messages](./BUG-015-verbose-errors.md)
- [Development Guidelines](../../docs/development.md)

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
