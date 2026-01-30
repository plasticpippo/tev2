# BUG-015: Verbose Error Messages Leak Implementation Details

## Severity Level
**LOW**

## File Location
- `backend/src/handlers/layouts.ts` (lines 90-120)
- `backend/src/middleware/errorHandler.ts` (lines 15-40)
- `backend/src/utils/errorMessages.ts` (lines 20-80)

## Description

Error messages returned by the API are overly verbose and expose internal implementation details including database schema, file paths, and stack traces. This information leakage can aid attackers in understanding the system architecture and finding additional vulnerabilities.

## Current Vulnerable Code

```typescript
// backend/src/handlers/layouts.ts - Line 90-120
router.get('/layouts/:id', async (req, res) => {
  try {
    const layout = await prisma.layout.findUnique({
      where: { id: req.params.id },
    });
    
    if (!layout) {
      return res.status(404).json({
        // BUG: Reveals database table name
        error: `Layout with ID ${req.params.id} not found in table 'layouts'`,
        query: `SELECT * FROM layouts WHERE id = '${req.params.id}'`,
        table: 'layouts',
        database: 'postgres',
      });
    }
    
    res.json(layout);
  } catch (error) {
    // BUG: Full error object exposes internals
    res.status(500).json({
      error: error.message,
      stack: error.stack, // BUG: Stack trace in production!
      code: error.code,
      meta: error.meta, // BUG: Prisma metadata
    });
  }
});
```

```typescript
// backend/src/middleware/errorHandler.ts - Line 15-40
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // BUG: Detailed database error codes
    res.status(400).json({
      error: 'Database error',
      prismaCode: err.code, // e.g., "P2025" - reveals Prisma usage
      prismaMeta: err.meta, // May contain column names
      message: err.message, // May contain table/column names
    });
  }
  
  // BUG: Generic handler still leaks info
  res.status(500).json({
    error: err.message,
    type: err.constructor.name,
    // BUG: In development, stack is included
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
```

```typescript
// backend/src/utils/errorMessages.ts - Line 20-80
export const getErrorMessage = (error: any): string => {
  // BUG: Concatenates internal details into user-facing message
  if (error.code === 'P2002') {
    return `Unique constraint violation on table ${error.meta?.target?.[0]}: ${error.message}`;
  }
  
  if (error.code === 'P2025') {
    return `Record not found in ${error.meta?.modelName}: ${error.meta?.cause}`;
  }
  
  // BUG: Falls back to raw error
  return error.message || 'An error occurred';
};

export const formatValidationError = (error: any) => {
  // BUG: Exposes validation internals
  return {
    error: 'Validation failed',
    details: error.errors,
    schema: error.schema, // BUG: Reveals validation schema
    path: error.path,
  };
};
```

## Information Leakage Examples

```json
// Current response - reveals too much
{
  "error": "Record not found in table 'layouts'",
  "query": "SELECT * FROM layouts WHERE id = 'invalid-id'",
  "table": "layouts",
  "database": "postgres",
  "prismaCode": "P2025",
  "stack": "Error: Record not found\n    at /app/node_modules/@prisma/client/runtime.js:1234:56\n    at async getLayout (/app/src/handlers/layouts.ts:95:12)"
}

// Attackers learn:
// - Using PostgreSQL
// - Using Prisma ORM
// - Table name: layouts
// - File path: /app/src/handlers/layouts.ts
// - Application structure
```

## Root Cause Analysis

1. **No Error Sanitization**: Raw errors passed directly to client
2. **Debug Mode in Production**: Stack traces enabled outside development
3. **Generic Error Handlers**: No distinction between internal and user-facing messages
4. **ORM Error Propagation**: Database errors bubble up unmodified

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Information Leakage | LOW | Exposes stack traces, paths, schema |
| Attack Surface | LOW | Helps attackers understand system |
| User Experience | LOW | Technical jargon confuses users |
| Debugging | LOW | May hide real issues in production |

## Suggested Fix

### Option 1: Centralized Error Sanitization (Recommended)

```typescript
// backend/src/types/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} not found` : `${resource} not found`,
      404,
      'NOT_FOUND'
    );
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
```

```typescript
// backend/src/utils/errorSanitizer.ts
import { Prisma } from '@prisma/client';
import { AppError } from '../types/errors';

interface SanitizedError {
  success: false;
  error: {
    message: string;
    code: string;
  };
  ...(debug info only in development)
}

export const sanitizeError = (
  error: unknown,
  isDevelopment: boolean
): SanitizedError => {
  // Log full error internally
  console.error('Internal error:', error);
  
  // Handle known application errors
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        message: error.message,
        code: error.code,
      },
      ...(isDevelopment && {
        debug: {
          stack: error.stack,
          isOperational: error.isOperational,
        },
      }),
    };
  }
  
  // Handle Prisma errors - map to generic messages
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const sanitized = sanitizePrismaError(error);
    return {
      success: false,
      error: sanitized,
      ...(isDevelopment && {
        debug: {
          prismaCode: error.code,
          meta: error.meta,
        },
      }),
    };
  }
  
  // Handle validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      success: false,
      error: {
        message: 'Invalid data provided',
        code: 'VALIDATION_ERROR',
      },
    };
  }
  
  // Generic fallback - never expose internal details
  return {
    success: false,
    error: {
      message: isDevelopment 
        ? 'Internal server error' 
        : 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_ERROR',
    },
    ...(isDevelopment && error instanceof Error && {
      debug: {
        message: error.message,
        stack: error.stack,
      },
    }),
  };
};

const sanitizePrismaError = (
  error: Prisma.PrismaClientKnownRequestError
): { message: string; code: string } => {
  switch (error.code) {
    case 'P2002':
      return {
        message: 'A record with this information already exists',
        code: 'DUPLICATE_ENTRY',
      };
    case 'P2025':
      return {
        message: 'The requested record was not found',
        code: 'NOT_FOUND',
      };
    case 'P2003':
      return {
        message: 'Referenced record does not exist',
        code: 'FOREIGN_KEY_VIOLATION',
      };
    case 'P2014':
      return {
        message: 'The change would violate data integrity',
        code: 'RELATION_VIOLATION',
      };
    default:
      return {
        message: 'Database operation failed',
        code: 'DATABASE_ERROR',
      };
  }
};
```

```typescript
// backend/src/middleware/errorHandler.ts - Fixed
import { sanitizeError } from '../utils/errorSanitizer';
import { AppError, NotFoundError, ValidationError } from '../types/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Log full error for internal debugging
  logger.error({
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  });
  
  // Sanitize before sending to client
  const sanitized = sanitizeError(err, isDevelopment);
  
  const statusCode = err instanceof AppError 
    ? err.statusCode 
    : 500;
  
  res.status(statusCode).json(sanitized);
};
```

```typescript
// backend/src/handlers/layouts.ts - Fixed
import { NotFoundError, ValidationError } from '../types/errors';

router.get('/layouts/:id', async (req, res, next) => {
  try {
    const layout = await prisma.layout.findUnique({
      where: { id: req.params.id },
    });
    
    if (!layout) {
      // Use custom error - no internal details
      throw new NotFoundError('Layout');
    }
    
    res.json(layout);
  } catch (error) {
    next(error); // Pass to error handler
  }
});

router.post('/layouts', async (req, res, next) => {
  try {
    const { name, config } = req.body;
    
    if (!name || name.trim() === '') {
      throw new ValidationError('Layout name is required', {
        name: 'Name cannot be empty',
      });
    }
    
    const layout = await prisma.layout.create({
      data: { name, config },
    });
    
    res.status(201).json(layout);
  } catch (error) {
    next(error);
  }
});
```

### Option 2: Error Code Mapping System

```typescript
// backend/src/config/errorCodes.ts
export const ErrorCodes = {
  // 400 - Bad Request
  VALIDATION_ERROR: { code: 'E001', status: 400, message: 'Invalid data provided' },
  INVALID_JSON: { code: 'E002', status: 400, message: 'Malformed request body' },
  
  // 401 - Unauthorized
  UNAUTHORIZED: { code: 'E100', status: 401, message: 'Authentication required' },
  INVALID_TOKEN: { code: 'E101', status: 401, message: 'Invalid or expired token' },
  
  // 403 - Forbidden
  FORBIDDEN: { code: 'E200', status: 403, message: 'Access denied' },
  INSUFFICIENT_PERMISSIONS: { code: 'E201', status: 403, message: 'Insufficient permissions' },
  
  // 404 - Not Found
  NOT_FOUND: { code: 'E300', status: 404, message: 'Resource not found' },
  LAYOUT_NOT_FOUND: { code: 'E301', status: 404, message: 'Layout not found' },
  TABLE_NOT_FOUND: { code: 'E302', status: 404, message: 'Table not found' },
  
  // 409 - Conflict
  DUPLICATE_ENTRY: { code: 'E400', status: 409, message: 'Resource already exists' },
  CONCURRENT_MODIFICATION: { code: 'E401', status: 409, message: 'Resource was modified' },
  
  // 500 - Server Error
  INTERNAL_ERROR: { code: 'E500', status: 500, message: 'Internal server error' },
  DATABASE_ERROR: { code: 'E501', status: 500, message: 'Database operation failed' },
  SERVICE_UNAVAILABLE: { code: 'E502', status: 503, message: 'Service temporarily unavailable' },
} as const;

export type ErrorCode = keyof typeof ErrorCodes;
```

```typescript
// backend/src/utils/createError.ts
import { ErrorCodes, ErrorCode } from '../config/errorCodes';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
  ...(development debug info)
}

export const createErrorResponse = (
  code: ErrorCode,
  customMessage?: string,
  isDevelopment: boolean = false
): ErrorResponse => {
  const errorDef = ErrorCodes[code];
  
  const response: ErrorResponse = {
    success: false,
    error: {
      code: errorDef.code,
      message: customMessage || errorDef.message,
    },
  };
  
  if (isDevelopment) {
    (response as any).debug = { errorCode: code };
  }
  
  return response;
};
```

### Option 3: Frontend Error Translation

```typescript
// frontend/utils/errorMessages.ts
const errorMessages: Record<string, string> = {
  E001: 'Please check your input and try again.',
  E100: 'Please log in to continue.',
  E200: 'You do not have permission to perform this action.',
  E300: 'The requested item could not be found.',
  E301: 'This layout does not exist or has been deleted.',
  E400: 'This item already exists. Please choose a different name.',
  E500: 'Something went wrong. Please try again later.',
  E501: 'Unable to save changes. Please try again.',
};

export const getUserFriendlyMessage = (errorCode: string): string => {
  return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
};
```

```tsx
// frontend/components/ErrorDisplay.tsx
export const ErrorDisplay: React.FC<{ error: any }> = ({ error }) => {
  const message = error?.error?.code 
    ? getUserFriendlyMessage(error.error.code)
    : 'An unexpected error occurred';
  
  return (
    <div className="error-message" role="alert">
      <p>{message}</p>
      {process.env.NODE_ENV === 'development' && error?.debug && (
        <pre className="error-debug">{JSON.stringify(error.debug, null, 2)}</pre>
      )}
    </div>
  );
};
```

## Testing Strategy

```typescript
// errorSanitizer.test.ts
describe('Error Sanitization', () => {
  it('should hide database details from Prisma errors', () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Record not found',
      { code: 'P2025', clientVersion: '4.0.0' }
    );
    
    const sanitized = sanitizeError(prismaError, false);
    
    expect(sanitized.error.message).toBe('The requested record was not found');
    expect(sanitized.error.code).toBe('NOT_FOUND');
    expect(sanitized).not.toHaveProperty('debug');
  });
  
  it('should include debug info in development', () => {
    const error = new Error('Test error');
    
    const sanitized = sanitizeError(error, true);
    
    expect(sanitized.debug).toBeDefined();
    expect(sanitized.debug.stack).toBeDefined();
  });
  
  it('should handle unknown errors gracefully', () => {
    const sanitized = sanitizeError('string error', false);
    
    expect(sanitized.error.message).toBe('An unexpected error occurred. Please try again later.');
    expect(sanitized.error.code).toBe('INTERNAL_ERROR');
  });
  
  it('should preserve AppError details', () => {
    const appError = new NotFoundError('Layout');
    
    const sanitized = sanitizeError(appError, false);
    
    expect(sanitized.error.message).toBe('Layout not found');
    expect(sanitized.error.code).toBe('NOT_FOUND');
  });
});
```

## Environment-Based Configuration

```typescript
// backend/src/config/appConfig.ts
export const appConfig = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  errorHandling: {
    exposeStackTraces: process.env.EXPOSE_STACK_TRACES === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
    includeErrorDetails: process.env.NODE_ENV === 'development',
  },
};
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Create custom error classes | 30 min |
| Implement error sanitizer | 1 hour |
| Update error handler middleware | 30 min |
| Replace all error responses | 1 hour |
| Add frontend error translations | 30 min |
| Testing | 30 min |
| **Total** | **4 hours** |

## Related Issues

- [BUG-011: Missing Input Sanitization](./../03-medium/BUG-011-missing-sanitization.md)
- [Security Best Practices](../../docs/security.md)

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
