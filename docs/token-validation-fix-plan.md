# Token Validation Fix Plan

## Executive Summary

This document outlines a comprehensive fix plan for critical token validation issues identified in the authentication system. The issues pose security risks and can lead to unauthorized access, poor user experience, and potential data breaches.

### Critical Issues Identified

1. **Incomplete Token Revocation Logic** - The system only checks the `RevokedToken` table but ignores the `tokensRevokedAt` field in the `User` table, allowing tokens issued before revocation to remain valid.

2. **Incorrect HTTP Status Code Usage** - Authentication failures return 403 (Forbidden) instead of 401 (Unauthorized), violating HTTP standards and causing confusion.

3. **No Token Refresh Mechanism** - Users must re-login every 24 hours due to lack of refresh token functionality, degrading user experience.

4. **Potential JWT Secret Mismatch** - No mechanism exists to handle JWT secret rotation or verify token signing consistency.

### Impact Assessment

- **Security Risk**: High - Revoked tokens may still be accepted
- **User Experience**: Medium - Frequent re-authentication required
- **Compliance**: Medium - Non-standard HTTP status codes
- **Maintainability**: Low - No secret rotation strategy

---

## Detailed Fix Strategy

### Issue 1: Incomplete Token Revocation Logic

#### Current Implementation

The [`isTokenRevoked()`](backend/src/services/tokenBlacklistService.ts:36) function only checks the `RevokedToken` table:

```typescript
export async function isTokenRevoked(token: string): Promise<boolean> {
  const tokenDigest = hashToken(token);
  
  const revokedToken = await prisma.revokedToken.findUnique({
    where: {
      tokenDigest,
    },
  });
  
  return revokedToken !== null;
}
```

#### Problem

When [`revokeAllUserTokens()`](backend/src/services/tokenBlacklistService.ts:52) is called, it sets the `tokensRevokedAt` field on the user:

```typescript
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.user.update({
    where: {
      id: parseInt(userId, 10),
    },
    data: {
      tokensRevokedAt: new Date(),
    },
  });
}
```

However, the [`authenticateToken`](backend/src/middleware/auth.ts:19) middleware never checks this field, so tokens issued before `tokensRevokedAt` remain valid.

#### Fix Strategy

Implement dual-layer token revocation checking:

1. Check if the token exists in the `RevokedToken` table (individual revocation)
2. Check if the token was issued before the user's `tokensRevokedAt` timestamp (bulk revocation)
3. Return `true` if either condition is met

#### Implementation

Modify [`isTokenRevoked()`](backend/src/services/tokenBlacklistService.ts:36) to accept the user ID and token issued-at time:

```typescript
export async function isTokenRevoked(
  token: string,
  userId?: number,
  tokenIssuedAt?: Date
): Promise<boolean> {
  const tokenDigest = hashToken(token);
  
  // Check individual token revocation
  const revokedToken = await prisma.revokedToken.findUnique({
    where: {
      tokenDigest,
    },
  });
  
  if (revokedToken !== null) {
    return true;
  }
  
  // Check bulk token revocation via tokensRevokedAt
  if (userId && tokenIssuedAt) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokensRevokedAt: true }
    });
    
    if (user?.tokensRevokedAt && tokenIssuedAt < user.tokensRevokedAt) {
      return true;
    }
  }
  
  return false;
}
```

Update [`authenticateToken`](backend/src/middleware/auth.ts:19) to pass user ID and issued-at time:

```typescript
// After jwtVerify
const { payload } = await jwtVerify(token, secret);

// Extract issued-at time from payload
const tokenIssuedAt = payload.iat ? new Date(payload.iat * 1000) : undefined;

// Check if the token has been revoked
const revoked = await isTokenRevoked(token, payload.id as number, tokenIssuedAt);
```

---

### Issue 2: Incorrect HTTP Status Code Usage

#### Current Implementation

In [`auth.ts`](backend/src/middleware/auth.ts:89), invalid/expired tokens return 403:

```typescript
} catch (error) {
  // Log authentication failure - invalid or expired token
  logAuthEvent('FAILED_LOGIN', undefined, undefined, false, {
    correlationId: (req as any).correlationId,
    reason: 'Invalid or expired token',
    path: req.path,
    method: req.method,
    error: error instanceof Error ? error.message : 'Unknown error'
  });
  // Return 403 if token is invalid
  return res.status(403).json({ error: 'Invalid or expired token.' });
}
```

#### Problem

According to RFC 7235:
- **401 Unauthorized**: The request lacks valid authentication credentials
- **403 Forbidden**: The server understood the request but refuses to authorize it

Returning 403 for authentication failures is incorrect and can cause issues with:
- API clients that expect 401 for auth failures
- Authentication interceptors in frontend frameworks
- Security scanners and compliance tools

#### Fix Strategy

Change all authentication-related failures to return 401, reserving 403 for authorization failures (when a user is authenticated but lacks permission).

#### Implementation

Update [`auth.ts`](backend/src/middleware/auth.ts:89):

```typescript
} catch (error) {
  // Log authentication failure - invalid or expired token
  logAuthEvent('FAILED_LOGIN', undefined, undefined, false, {
    correlationId: (req as any).correlationId,
    reason: 'Invalid or expired token',
    path: req.path,
    method: req.method,
    error: error instanceof Error ? error.message : 'Unknown error'
  });
  // Return 401 for authentication failures
  return res.status(401).json({ error: 'Invalid or expired token.' });
}
```

Verify that [`authorization.ts`](backend/src/middleware/authorization.ts) correctly uses 403 for permission checks.

---

### Issue 3: No Token Refresh Mechanism

#### Current Implementation

The login endpoint in [`users.ts`](backend/src/handlers/users.ts:211) issues a single access token with 24-hour expiration:

```typescript
const token = await new SignJWT({
  id: user.id,
  username: user.username,
  role: user.role
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('24h')
  .sign(secret);
```

#### Problem

- Users must re-login every 24 hours
- No way to revoke access tokens without forcing re-login
- Cannot implement short-lived access tokens for better security
- Poor user experience on mobile devices

#### Fix Strategy

Implement a dual-token architecture:

1. **Access Token**: Short-lived (15-30 minutes), used for API requests
2. **Refresh Token**: Long-lived (7-30 days), used to obtain new access tokens
3. **Refresh Endpoint**: Exchange refresh token for new access token
4. **Refresh Token Storage**: Store refresh tokens in database with revocation support

#### Implementation

##### 1. Update Prisma Schema

Add `RefreshToken` model to [`schema.prisma`](backend/prisma/schema.prisma):

```prisma
model RefreshToken {
  id           String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  tokenDigest  String   @unique
  userId       Int
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  revokedAt    DateTime?
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([tokenDigest])
  @@index([userId])
  @@index([expiresAt])
  @@map("refresh_tokens")
}
```

Update [`User`](backend/prisma/schema.prisma:12) model:

```prisma
model User {
  id                Int                @id @default(autoincrement())
  name              String
  username          String             @unique
  password          String
  role              String
  tokensRevokedAt   DateTime?
  dailyClosings     DailyClosing[]
  orderActivityLogs OrderActivityLog[]
  orderSessions     OrderSession[]
  stockAdjustments  StockAdjustment[]
  transactions      Transaction[]
  tables            Table[]
  variantLayouts    VariantLayout[]
  sharedLayouts     SharedLayout[]
  revokedTokens     RevokedToken[]
  refreshTokens     RefreshToken[]     // Add this relation

  @@map("users")
}
```

##### 2. Create Refresh Token Service

Create new file [`backend/src/services/refreshTokenService.ts`](backend/src/services/refreshTokenService.ts):

```typescript
import { prisma } from '../prisma';
import { createHash } from 'crypto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createRefreshToken(
  token: string,
  userId: number,
  expiresAt: Date
): Promise<void> {
  const tokenDigest = hashToken(token);
  
  await prisma.refreshToken.create({
    data: {
      tokenDigest,
      userId,
      expiresAt,
    },
  });
}

export async function isRefreshTokenValid(
  token: string,
  userId: number
): Promise<boolean> {
  const tokenDigest = hashToken(token);
  
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { tokenDigest },
  });
  
  if (!refreshToken) {
    return false;
  }
  
  if (refreshToken.userId !== userId) {
    return false;
  }
  
  if (refreshToken.revokedAt) {
    return false;
  }
  
  if (refreshToken.expiresAt < new Date()) {
    return false;
  }
  
  return true;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const tokenDigest = hashToken(token);
  
  await prisma.refreshToken.updateMany({
    where: { tokenDigest },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllRefreshTokens(userId: number): Promise<void> {
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { revokedAt: new Date() },
  });
}

export async function cleanupExpiredRefreshTokens(): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { revokedAt: { not: null } },
      ],
    },
  });
  
  return result.count;
}
```

##### 3. Update Login Handler

Modify [`users.ts`](backend/src/handlers/users.ts:211) login endpoint:

```typescript
// Generate access token (short-lived)
const accessToken = await new SignJWT({
  id: user.id,
  username: user.username,
  role: user.role,
  type: 'access'
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('15m') // 15 minutes
  .sign(secret);

// Generate refresh token (long-lived)
const refreshToken = await new SignJWT({
  id: user.id,
  username: user.username,
  type: 'refresh'
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt()
  .setExpirationTime('7d') // 7 days
  .sign(secret);

// Store refresh token in database
const refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
await createRefreshToken(refreshToken, user.id, refreshTokenExpiresAt);

// Log successful login
logAuthEvent('LOGIN', user.id, user.username, true, {
  correlationId: (req as any).correlationId
});

// Transform user to DTO to exclude sensitive fields
const userDTO = toUserDTO(user);
res.json({
  ...userDTO,
  accessToken,
  refreshToken,
  tokenType: 'Bearer',
  expiresIn: 900 // 15 minutes in seconds
});
```

##### 4. Add Refresh Token Endpoint

Add to [`users.ts`](backend/src/handlers/users.ts):

```typescript
// POST /api/auth/refresh - Refresh access token
usersRouter.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    
    // Verify refresh token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(refreshToken, secret);
    
    // Verify token type
    if (payload.type !== 'refresh') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    
    const userId = payload.id as number;
    
    // Check if refresh token is valid and not revoked
    const isValid = await isRefreshTokenValid(refreshToken, userId);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    
    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Generate new access token
    const newAccessToken = await new SignJWT({
      id: user.id,
      username: user.username,
      role: user.role,
      type: 'access'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('15m')
      .sign(secret);
    
    // Log token refresh event
    logAuthEvent('TOKEN_REFRESH', user.id, user.username, true, {
      correlationId: (req as any).correlationId
    });
    
    res.json({
      accessToken: newAccessToken,
      tokenType: 'Bearer',
      expiresIn: 900
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error during token refresh', {
      correlationId: (req as any).correlationId,
    });
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

##### 5. Update Logout Handler

Modify [`users.ts`](backend/src/handlers/users.ts:243) logout endpoint:

```typescript
// POST /api/auth/logout - Logout endpoint
usersRouter.post('/auth/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const { refreshToken } = req.body;
    
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated.' });
    }

    // Revoke access token if provided
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(accessToken, secret);
      const expiresAt = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 15 * 60 * 1000);
      await revokeToken(accessToken, userId.toString(), expiresAt);
    }
    
    // Revoke refresh token if provided
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    
    // Log logout event
    logAuthEvent('LOGOUT', userId, req.user?.username, true, {
      correlationId: (req as any).correlationId
    });

    res.status(200).json({ message: 'Successfully logged out.' });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error during logout', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Logout failed due to server error. Please try again later.' });
  }
});
```

##### 6. Update Revoke All Tokens Handler

Modify [`users.ts`](backend/src/handlers/users.ts:287):

```typescript
// POST /api/auth/revoke-all - Revoke all tokens for a user (admin only)
usersRouter.post('/auth/revoke-all', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const userIdNum = parseInt(userId, 10);
    
    // Revoke all access tokens via tokensRevokedAt
    await revokeAllUserTokens(userId);
    
    // Revoke all refresh tokens
    await revokeAllRefreshTokens(userIdNum);
    
    // Log token revocation event
    logAuthEvent('TOKENS_REVOKED', userIdNum, undefined, true, {
      correlationId: (req as any).correlationId,
      revokedBy: req.user?.id,
      revokedByUsername: req.user?.username
    });
    
    res.status(200).json({ message: 'All tokens for the user have been revoked successfully.' });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error revoking all tokens', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to revoke all tokens. Please try again later.' });
  }
});
```

---

### Issue 4: JWT Secret Validation and Rotation

#### Current Implementation

The [`validateJwtSecret()`](backend/src/utils/jwtSecretValidation.ts:35) function validates the secret at module load time but provides no mechanism for rotation or consistency checking.

#### Problem

- No way to rotate JWT secrets without breaking existing tokens
- No verification that tokens were signed with the current secret
- Potential for secret mismatch between services

#### Fix Strategy

Implement JWT secret rotation support:

1. Support multiple valid JWT secrets (current + previous)
2. Always sign new tokens with the current secret
3. Verify tokens against all valid secrets
4. Provide migration path for secret rotation

#### Implementation

##### 1. Update Environment Variables

Add support for `JWT_SECRET_PREVIOUS` in `.env`:

```env
JWT_SECRET=<current-secret>
JWT_SECRET_PREVIOUS=<previous-secret> # Optional, for rotation
```

##### 2. Update JWT Secret Validation

Modify [`jwtSecretValidation.ts`](backend/src/utils/jwtSecretValidation.ts):

```typescript
/**
 * Validates the JWT_SECRET environment variable
 * 
 * @throws {Error} If validation fails with a descriptive error message
 */
export function validateJwtSecret(): void {
  const jwtSecret = process.env.JWT_SECRET;

  // Check if JWT_SECRET is set
  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET environment variable is not set. ' +
      'Please set a secure JWT_SECRET in your environment variables. ' +
      'Generate one using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }

  // Check if it's a forbidden default value
  const normalizedSecret = jwtSecret.toLowerCase().trim();
  if (FORBIDDEN_DEFAULT_VALUES.some(forbidden => normalizedSecret === forbidden.toLowerCase())) {
    throw new Error(
      'JWT_SECRET cannot be a default or placeholder value. ' +
      'The current value is a known insecure default. ' +
      'Please generate a secure secret using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }

  // Check minimum length requirement
  if (jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long. ` +
      `Current length: ${jwtSecret.length} characters. ` +
      'Generate a secure secret using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }

  // Check for common weak patterns
  if (/^[a-zA-Z]+$/.test(jwtSecret)) {
    throw new Error(
      'JWT_SECRET should contain a mix of characters (letters, numbers, and special characters). ' +
      'The current value appears to be only alphabetic characters. ' +
      'Generate a secure secret using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }

  if (/^[0-9]+$/.test(jwtSecret)) {
    throw new Error(
      'JWT_SECRET should contain a mix of characters (letters, numbers, and special characters). ' +
      'The current value appears to be only numeric characters. ' +
      'Generate a secure secret using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }

  // Validate JWT_SECRET_PREVIOUS if provided
  const jwtSecretPrevious = process.env.JWT_SECRET_PREVIOUS;
  if (jwtSecretPrevious) {
    if (jwtSecretPrevious.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET_PREVIOUS must be at least ${MIN_SECRET_LENGTH} characters long. ` +
        `Current length: ${jwtSecretPrevious.length} characters.`
      );
    }
  }
}

/**
 * Get all valid JWT secrets for token verification
 * Returns current secret first, then previous secret if available
 */
export function getValidJwtSecrets(): string[] {
  const secrets: string[] = [process.env.JWT_SECRET!];
  
  if (process.env.JWT_SECRET_PREVIOUS) {
    secrets.push(process.env.JWT_SECRET_PREVIOUS);
  }
  
  return secrets;
}
```

##### 3. Update Token Verification

Modify [`auth.ts`](backend/src/middleware/auth.ts:19) to verify against multiple secrets:

```typescript
import { getValidJwtSecrets } from '../utils/jwtSecretValidation';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header (Bearer token format)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logAuthEvent('FAILED_LOGIN', undefined, undefined, false, {
        correlationId: (req as any).correlationId,
        reason: 'Missing or invalid Authorization header',
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7);

    if (!token) {
      logAuthEvent('FAILED_LOGIN', undefined, undefined, false, {
        correlationId: (req as any).correlationId,
        reason: 'Empty token',
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Try to verify token with each valid secret
    const secrets = getValidJwtSecrets();
    let payload: any;
    let lastError: Error | null = null;
    
    for (const secret of secrets) {
      try {
        const encodedSecret = new TextEncoder().encode(secret);
        const result = await jwtVerify(token, encodedSecret);
        payload = result.payload;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
      }
    }
    
    if (!payload) {
      throw lastError || new Error('Token verification failed');
    }

    // Extract issued-at time from payload
    const tokenIssuedAt = payload.iat ? new Date(payload.iat * 1000) : undefined;

    // Check if the token has been revoked
    const revoked = await isTokenRevoked(token, payload.id as number, tokenIssuedAt);
    if (revoked) {
      logSecurityAlert(
        'REVOKED_TOKEN',
        'Attempted access with revoked token',
        {
          correlationId: (req as any).correlationId,
          userId: payload.id,
          username: payload.username,
          path: req.path,
          method: req.method
        },
        'high'
      );
      return res.status(401).json({ error: 'Token has been revoked. Please login again.' });
    }

    // Attach decoded user info to req.user
    req.user = {
      id: payload.id as number,
      username: payload.username as string,
      role: payload.role as string
    };

    next();
  } catch (error) {
    logAuthEvent('FAILED_LOGIN', undefined, undefined, false, {
      correlationId: (req as any).correlationId,
      reason: 'Invalid or expired token',
      path: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
```

##### 4. Update Token Signing

Ensure all token signing uses only the current secret:

```typescript
// In users.ts and any other file that signs tokens
const JWT_SECRET = process.env.JWT_SECRET!; // Always use current secret for signing
const secret = new TextEncoder().encode(JWT_SECRET);
```

---

## Step-by-Step Implementation Plan

### Phase 1: Critical Security Fixes (Priority: High)

1. **Fix HTTP Status Code Usage**
   - File: [`backend/src/middleware/auth.ts`](backend/src/middleware/auth.ts:89)
   - Change line 89 from `403` to `401`
   - Test: Verify authentication failures return 401

2. **Fix Token Revocation Logic**
   - File: [`backend/src/services/tokenBlacklistService.ts`](backend/src/services/tokenBlacklistService.ts:36)
   - Update `isTokenRevoked()` to check `tokensRevokedAt`
   - File: [`backend/src/middleware/auth.ts`](backend/src/middleware/auth.ts:19)
   - Update `authenticateToken()` to pass user ID and issued-at time
   - Test: Verify tokens issued before `tokensRevokedAt` are rejected

### Phase 2: Token Refresh Mechanism (Priority: Medium)

3. **Database Migration**
   - File: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
   - Add `RefreshToken` model
   - Update `User` model with `refreshTokens` relation
   - Run migration: `npx prisma migrate dev --name add_refresh_tokens`

4. **Create Refresh Token Service**
   - File: [`backend/src/services/refreshTokenService.ts`](backend/src/services/refreshTokenService.ts) (new)
   - Implement refresh token CRUD operations
   - Implement validation and revocation functions

5. **Update Login Handler**
   - File: [`backend/src/handlers/users.ts`](backend/src/handlers/users.ts:211)
   - Generate both access and refresh tokens
   - Store refresh token in database
   - Update response format

6. **Add Refresh Token Endpoint**
   - File: [`backend/src/handlers/users.ts`](backend/src/handlers/users.ts)
   - Add `POST /api/auth/refresh` endpoint
   - Implement token refresh logic

7. **Update Logout Handler**
   - File: [`backend/src/handlers/users.ts`](backend/src/handlers/users.ts:243)
   - Revoke both access and refresh tokens

8. **Update Revoke All Handler**
   - File: [`backend/src/handlers/users.ts`](backend/src/handlers/users.ts:287)
   - Revoke all refresh tokens

### Phase 3: JWT Secret Rotation (Priority: Medium)

9. **Update JWT Secret Validation**
   - File: [`backend/src/utils/jwtSecretValidation.ts`](backend/src/utils/jwtSecretValidation.ts)
   - Add `JWT_SECRET_PREVIOUS` validation
   - Add `getValidJwtSecrets()` function

10. **Update Token Verification**
    - File: [`backend/src/middleware/auth.ts`](backend/src/middleware/auth.ts:19)
    - Verify tokens against multiple secrets
    - Always sign with current secret

11. **Update Environment Configuration**
    - File: [`.env`](.env)
    - Document `JWT_SECRET_PREVIOUS` usage
    - Update `.env.example`

### Phase 4: Cleanup and Maintenance (Priority: Low)

12. **Update Cleanup Script**
    - File: [`backend/src/scripts/cleanupExpiredTokens.ts`](backend/src/scripts/cleanupExpiredTokens.ts)
    - Add refresh token cleanup
    - Schedule periodic cleanup

13. **Update Documentation**
    - Create authentication flow documentation
    - Update API documentation
    - Add token rotation guide

---

## Files to Modify

### Existing Files to Update

| File | Changes Required |
|------|------------------|
| [`backend/src/middleware/auth.ts`](backend/src/middleware/auth.ts) | Fix 403→401, update token verification, add multi-secret support |
| [`backend/src/services/tokenBlacklistService.ts`](backend/src/services/tokenBlacklistService.ts) | Update `isTokenRevoked()` to check `tokensRevokedAt` |
| [`backend/src/handlers/users.ts`](backend/src/handlers/users.ts) | Update login, logout, revoke-all handlers; add refresh endpoint |
| [`backend/src/utils/jwtSecretValidation.ts`](backend/src/utils/jwtSecretValidation.ts) | Add previous secret validation, `getValidJwtSecrets()` |
| [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) | Add `RefreshToken` model, update `User` model |
| [`.env`](.env) | Add `JWT_SECRET_PREVIOUS` documentation |
| [`.env.example`](backend/.env.example) | Add `JWT_SECRET_PREVIOUS` example |
| [`backend/src/scripts/cleanupExpiredTokens.ts`](backend/src/scripts/cleanupExpiredTokens.ts) | Add refresh token cleanup |

### New Files to Create

| File | Purpose |
|------|---------|
| [`backend/src/services/refreshTokenService.ts`](backend/src/services/refreshTokenService.ts) | Refresh token CRUD operations |
| [`docs/token-validation-fix-plan.md`](docs/token-validation-fix-plan.md) | This document |
| [`docs/authentication-flow.md`](docs/authentication-flow.md) | Authentication flow documentation |
| [`docs/token-rotation-guide.md`](docs/token-rotation-guide.md) | JWT secret rotation guide |

---

## Testing Strategy

### Unit Tests

1. **Token Revocation Tests**
   - Test individual token revocation via `RevokedToken` table
   - Test bulk token revocation via `tokensRevokedAt`
   - Test dual-layer revocation logic
   - Test edge cases (null values, future dates)

2. **HTTP Status Code Tests**
   - Test authentication failures return 401
   - Test authorization failures return 403
   - Test various error scenarios

3. **Refresh Token Tests**
   - Test refresh token creation
   - Test refresh token validation
   - Test refresh token revocation
   - Test token refresh endpoint
   - Test expired refresh tokens

4. **JWT Secret Tests**
   - Test token verification with current secret
   - Test token verification with previous secret
   - Test token signing with current secret only
   - Test secret validation

### Integration Tests

1. **Authentication Flow**
   - Test login returns both access and refresh tokens
   - Test access token works for API requests
   - Test refresh token can obtain new access token
   - Test logout revokes both tokens

2. **Token Revocation Flow**
   - Test individual token revocation
   - Test bulk token revocation
   - Test tokens issued before revocation are rejected
   - Test tokens issued after revocation are accepted

3. **Secret Rotation Flow**
   - Test tokens signed with old secret still work
   - Test new tokens are signed with new secret
   - Test both secrets are accepted during rotation period

### End-to-End Tests

1. **User Session Lifecycle**
   - Login → Use access token → Refresh → Logout
   - Verify all tokens are properly revoked

2. **Admin Token Revocation**
   - Admin revokes all user tokens
   - Verify user cannot access protected endpoints

3. **Security Scenarios**
   - Test revoked token access attempts
   - Test expired token access attempts
   - Test invalid token access attempts
   - Verify proper logging and error messages

### Manual Testing Checklist

- [ ] Login returns both access and refresh tokens
- [ ] Access token works for authenticated endpoints
- [ ] Access token expires after 15 minutes
- [ ] Refresh token can obtain new access token
- [ ] Refresh token expires after 7 days
- [ ] Logout revokes both tokens
- [ ] Revoked tokens are rejected
- [ ] Tokens issued before `tokensRevokedAt` are rejected
- [ ] Authentication failures return 401
- [ ] Authorization failures return 403
- [ ] Tokens signed with previous secret still work
- [ ] New tokens are signed with current secret

---

## Risk Assessment and Mitigation

### Risk 1: Breaking Existing Clients

**Risk Level**: Medium

**Description**: Changing token format and adding refresh tokens may break existing API clients.

**Mitigation**:
- Maintain backward compatibility during transition period
- Keep access token expiration at 24 hours initially
- Gradually reduce to 15 minutes after clients are updated
- Provide clear migration guide for client developers
- Monitor API error rates during rollout

### Risk 2: Database Migration Issues

**Risk Level**: Low

**Description**: Adding `RefreshToken` model may cause migration failures.

**Mitigation**:
- Test migration in development environment first
- Create database backup before production migration
- Use Prisma's transaction support for atomic migrations
- Have rollback plan ready

### Risk 3: Token Storage Overhead

**Risk Level**: Low

**Description**: Storing refresh tokens in database increases storage requirements.

**Mitigation**:
- Implement automatic cleanup of expired tokens
- Schedule periodic cleanup jobs
- Monitor database size growth
- Consider token rotation to limit active tokens

### Risk 4: Secret Rotation Complexity

**Risk Level**: Medium

**Description**: Managing multiple JWT secrets adds complexity.

**Mitigation**:
- Document secret rotation process clearly
- Use environment variables for secret management
- Implement automated secret rotation scripts
- Monitor for secret-related errors

### Risk 5: Performance Impact

**Risk Level**: Low

**Description**: Additional database queries for token validation may impact performance.

**Mitigation**:
- Add database indexes on frequently queried fields
- Implement query result caching where appropriate
- Monitor API response times
- Optimize queries if needed

### Risk 6: Security Regression

**Risk Level**: Low

**Description**: New code may introduce security vulnerabilities.

**Mitigation**:
- Conduct security code review
- Implement comprehensive test coverage
- Use static analysis tools
- Follow security best practices

---

## Rollback Plan

If issues arise during implementation:

1. **Phase 1 Rollback** (Critical Fixes)
   - Revert HTTP status code changes
   - Revert token revocation logic changes
   - No database changes required

2. **Phase 2 Rollback** (Token Refresh)
   - Revert login handler changes
   - Remove refresh token endpoint
   - Keep database schema (can be cleaned up later)
   - Clients can continue using access tokens only

3. **Phase 3 Rollback** (Secret Rotation)
   - Remove `JWT_SECRET_PREVIOUS` support
   - Revert multi-secret verification
   - No database changes required

4. **Database Rollback**
   - Use Prisma migration rollback: `npx prisma migrate resolve --rolled-back [migration-name]`
   - Restore from backup if needed

---

## Success Criteria

The implementation will be considered successful when:

1. **Security**
   - All revoked tokens are properly rejected
   - Tokens issued before `tokensRevokedAt` are rejected
   - Authentication failures return 401
   - Authorization failures return 403

2. **Functionality**
   - Users can login and receive both access and refresh tokens
   - Access tokens work for API requests
   - Refresh tokens can obtain new access tokens
   - Logout properly revokes both tokens

3. **Reliability**
   - Token verification works with multiple secrets
   - Database operations are atomic and consistent
   - Error handling is comprehensive
   - Logging captures all security events

4. **Performance**
   - API response times remain acceptable
   - Database queries are optimized
   - No memory leaks or resource exhaustion

5. **Maintainability**
   - Code is well-documented
   - Tests provide good coverage
   - Secret rotation process is clear
   - Monitoring and alerting are in place

---

## Timeline Estimate

| Phase | Tasks | Estimated Duration |
|-------|-------|-------------------|
| Phase 1 | Critical security fixes | 2-4 hours |
| Phase 2 | Token refresh mechanism | 6-8 hours |
| Phase 3 | JWT secret rotation | 3-4 hours |
| Phase 4 | Cleanup and documentation | 2-3 hours |
| Testing | Unit, integration, E2E tests | 4-6 hours |
| **Total** | | **17-25 hours** |

---

## References

- [RFC 7235 - Hypertext Transfer Protocol (HTTP/1.1): Authentication](https://tools.ietf.org/html/rfc7235)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Prisma Documentation](https://www.prisma.io/docs)
- [jose Library Documentation](https://github.com/panva/jose)

---

## Appendix: Code Examples

### Example: Complete Token Revocation Check

```typescript
export async function isTokenRevoked(
  token: string,
  userId?: number,
  tokenIssuedAt?: Date
): Promise<boolean> {
  const tokenDigest = hashToken(token);
  
  // Check individual token revocation
  const revokedToken = await prisma.revokedToken.findUnique({
    where: {
      tokenDigest,
    },
  });
  
  if (revokedToken !== null) {
    return true;
  }
  
  // Check bulk token revocation via tokensRevokedAt
  if (userId && tokenIssuedAt) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokensRevokedAt: true }
    });
    
    if (user?.tokensRevokedAt && tokenIssuedAt < user.tokensRevokedAt) {
      return true;
    }
  }
  
  return false;
}
```

### Example: Token Refresh Flow

```typescript
// Client-side example
async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });
  
  if (response.ok) {
    const { accessToken, expiresIn } = await response.json();
    localStorage.setItem('accessToken', accessToken);
    return accessToken;
  } else {
    // Refresh token invalid, redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
}
```

### Example: JWT Secret Rotation

```bash
# Step 1: Generate new secret
NEW_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")

# Step 2: Update environment variables
# Move current secret to JWT_SECRET_PREVIOUS
# Set new secret as JWT_SECRET

# Step 3: Restart application
docker compose restart backend

# Step 4: Wait for all old tokens to expire (7 days)
# Then remove JWT_SECRET_PREVIOUS
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-09  
**Author**: Architect Mode  
**Status**: Ready for Implementation
