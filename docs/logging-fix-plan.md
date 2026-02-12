# Logging Fixes Plan

## Overview

This document outlines the plan to fix two LOW severity logging issues identified in the code review:
1. Console.log statements should use the logger utility
2. Incorrect log action type in users.ts

---

## Issue 1: Console.log Statements in Handlers

### Problem
The file [`backend/src/handlers/orderSessions.ts`](backend/src/handlers/orderSessions.ts) contains 18 `console.log` statements that should use the project's logger utility for consistent, secure logging.

### Affected File
- [`backend/src/handlers/orderSessions.ts`](backend/src/handlers/orderSessions.ts)

### Current State
All 18 console.log statements are debug/informational messages for order session operations:

| Line | Current Code | Suggested Replacement |
|------|--------------|----------------------|
| 19 | `console.log(\`[GET /api/order-sessions/current] Fetching session for userId: ${userId}\`)` | `logDebug(\`Fetching session for userId: ${userId}\`, { correlationId })` |
| 33 | `console.log(\`[GET /api/order-sessions/current] Found active session: ${session.id}...\`)` | `logDebug(\`Found active session: ${session.id}\`, { correlationId, itemsCount })` |
| 35 | `console.log(\`[GET /api/order-sessions/current] No active session found...\`)` | `logDebug(\`No active session found, checking for pending_logout session\`, { correlationId })` |
| 49 | `console.log(\`[GET /api/order-sessions/current] Found pending_logout session...\`)` | `logDebug(\`Found pending_logout session: ${session.id}\`, { correlationId, itemsCount })` |
| 59 | `console.log(\`[GET /api/order-sessions/current] Successfully restored session...\`)` | `logDebug(\`Successfully restored session to active: ${session.id}\`, { correlationId })` |
| 61 | `console.log(\`[GET /api/order-sessions/current] No pending_logout session found\`)` | `logDebug(\`No pending_logout session found\`, { correlationId })` |
| 69 | `console.log(\`[GET /api/order-sessions/current] No session found for userId...\`)` | `logDebug(\`No session found for userId: ${userId}\`, { correlationId })` |
| 82 | `console.log(\`[GET /api/order-sessions/current] Returning session...\`)` | `logDebug(\`Returning session: ${orderSession.id}\`, { correlationId, itemsCount })` |
| 103 | `console.log(\`[POST /api/order-sessions/current] Request for userId...\`)` | `logDebug(\`Request for userId: ${userId}\`, { correlationId, itemsCount })` |
| 118 | `console.log(\`[POST /api/order-sessions/current] Found active session...\`)` | `logDebug(\`Found active session: ${orderSession.id}\`, { correlationId, itemsCount })` |
| 129 | `console.log(\`[POST /api/order-sessions/current] No active session found...\`)` | `logDebug(\`No active session found, checking for pending_logout session\`, { correlationId })` |
| 140-142 | Three console.log statements for pending_logout session details | `logDebug(\`Found pending_logout session: ${pendingLogoutSession.id}\`, { correlationId, existingItemsCount, items })` |
| 155 | `console.log(\`[POST /api/order-sessions/current] Updating items...\`)` | `logDebug(\`Updating items with ${items.length} new items\`, { correlationId })` |
| 158 | `console.log(\`[POST /api/order-sessions/current] Preserving existing...\`)` | `logDebug(\`Preserving existing ${existingItemsCount} items\`, { correlationId })` |
| 165 | `console.log(\`[POST /api/order-sessions/current] Successfully restored session...\`)` | `logDebug(\`Successfully restored session to active: ${orderSession.id}\`, { correlationId })` |
| 167 | `console.log(\`[POST /api/order-sessions/current] Final items count...\`)` | `logDebug(\`Final items count: ${finalItemsCount}\`, { correlationId })` |
| 169 | `console.log(\`[POST /api/order-sessions/current] No pending_logout session found...\`)` | `logDebug(\`No pending_logout session found, creating new session\`, { correlationId, itemsCount })` |
| 181 | `console.log(\`[POST /api/order-sessions/current] Created new session...\`)` | `logDebug(\`Created new session: ${orderSession.id}\`, { correlationId })` |
| 190 | `console.log(\`[POST /api/order-sessions/current] Returning ${statusCode}...\`)` | `logDebug(\`Returning ${statusCode} for session: ${result.orderSession.id}\`, { correlationId })` |
| 256 | `console.log(\`[PUT /api/order-sessions/current/logout] Logout request...\`)` | `logDebug(\`Logout request for userId: ${userId}\`, { correlationId })` |
| 269 | `console.log(\`[PUT /api/order-sessions/current/logout] No active session found...\`)` | `logDebug(\`No active session found for userId: ${userId}\`, { correlationId })` |
| 274-275 | Two console.log statements for session items before logout | `logDebug(\`Found active session: ${orderSession.id}, marking as pending_logout\`, { correlationId, itemsCount })` |
| 288-290 | Three console.log statements for session status after logout | `logDebug(\`Successfully marked session as pending_logout: ${updated.id}\`, { correlationId, itemsCount, status, logoutTime })` |

### Logger Utility Functions

The project has a comprehensive logger at [`backend/src/utils/logger.ts`](backend/src/utils/logger.ts) with these relevant functions:

```typescript
// For debug/informational messages (only logged when DEBUG_LOGGING=true or NODE_ENV !== 'production')
export function logDebug(message: string | object, metadata?: LoggerMetadata): void

// For general informational messages
export function logInfo(message: string | object, metadata?: LoggerMetadata): void

// For error messages
export function logError(message: string | Error | object, metadata?: LoggerMetadata): void

// For data access events (audit logging)
export function logDataAccess(
  resourceType: string,
  resourceId: string | number,
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT',
  userId?: string | number,
  username?: string
): void
```

### Fix Implementation

1. **Add import** for `logDebug` from the logger utility:
   ```typescript
   import { logDebug } from '../utils/logger';
   ```

2. **Replace all console.log statements** with `logDebug()` calls:
   - Remove the `[METHOD /path]` prefix from messages (this is handled by the request logger middleware)
   - Add correlation ID from request: `(req as any).correlationId`
   - Use appropriate metadata objects for structured logging

3. **Example transformation**:
   ```typescript
   // Before
   console.log(`[GET /api/order-sessions/current] Fetching session for userId: ${userId}`);
   
   // After
   logDebug(`Fetching session for userId: ${userId}`, {
     correlationId: (req as any).correlationId
   });
   ```

---

## Issue 2: Incorrect Log Action Type in users.ts

### Problem
In [`backend/src/handlers/users.ts`](backend/src/handlers/users.ts:89), when creating a new user, the log action uses `'LOGIN'` instead of an appropriate action type for user creation.

### Affected Code
**File:** [`backend/src/handlers/users.ts`](backend/src/handlers/users.ts:89)
**Lines:** 88-93

```typescript
// Log user creation event
logAuthEvent('LOGIN', user.id, user.username, true, {
  correlationId: (req as any).correlationId,
  action: 'USER_CREATED',
  role: user.role
});
```

### Analysis
The `logAuthEvent` function is designed for authentication events:
```typescript
export function logAuthEvent(
  eventType: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'PASSWORD_CHANGE' | 'TOKEN_REFRESH',
  userId?: string | number,
  username?: string,
  success: boolean = true,
  details?: Record<string, any>
): void
```

Using `'LOGIN'` for user creation is semantically incorrect and could cause confusion in audit logs.

### Fix Implementation

Replace the `logAuthEvent` call with `logDataAccess` which is more appropriate for CRUD operations:

```typescript
// Before
logAuthEvent('LOGIN', user.id, user.username, true, {
  correlationId: (req as any).correlationId,
  action: 'USER_CREATED',
  role: user.role
});

// After
logDataAccess('user', user.id, 'CREATE', (req as any).user?.id, (req as any).user?.username);
```

Or use `logAuditEvent` directly for more control:

```typescript
// Alternative using logAuditEvent
import { logAuditEvent } from '../utils/logger';

logAuditEvent(
  'USER_CREATED',
  'User account created',
  { role: user.role },
  'low',
  { userId: user.id, username: user.username, correlationId: (req as any).correlationId }
);
```

**Note:** The `logAuditEvent` approach is preferred as it uses the `USER_CREATED` event type which is already defined in the `AuditEventType` union.

---

## Other Console.log Statements (Out of Scope)

The following console.log statements were found but are **acceptable** and should **not** be changed:

| File | Reason |
|------|--------|
| [`backend/src/utils/jwtSecretValidation.ts`](backend/src/utils/jwtSecretValidation.ts:42-79) | Part of error message strings instructing developers how to generate secrets |
| [`backend/src/scripts/*.ts`](backend/src/scripts/) | Standalone scripts that run independently; console.log is appropriate |
| [`backend/src/index.ts`](backend/src/index.ts:92-96) | Server startup messages; already has `logInfo` alongside |
| [`backend/src/prisma.ts`](backend/src/prisma.ts:20) | Database connection message in startup script |

---

## Implementation Checklist

- [ ] **Issue 1: orderSessions.ts console.log statements**
  - [ ] Add `logDebug` import from `../utils/logger`
  - [ ] Replace all 18 console.log statements with logDebug calls
  - [ ] Add correlationId metadata to each call
  - [ ] Test that debug logging works correctly

- [ ] **Issue 2: users.ts incorrect action type**
  - [ ] Change import from `logAuthEvent` to `logAuditEvent` (or add it)
  - [ ] Replace the incorrect logAuthEvent call with logAuditEvent using 'USER_CREATED'
  - [ ] Verify audit logs show correct event type

- [ ] **Verification**
  - [ ] Run the application and verify logs are formatted correctly
  - [ ] Check that sensitive data is properly redacted
  - [ ] Verify debug logs only appear when DEBUG_LOGGING=true

---

## Severity: LOW

These issues are classified as LOW severity because:
1. They don't expose security vulnerabilities
2. They don't affect application functionality
3. They are code quality/maintainability improvements
4. The current logging works, just not optimally
