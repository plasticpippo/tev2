# Order Sessions API Security Hardening Fix Plan

## Executive Summary

This document outlines a comprehensive plan to fix a critical security vulnerability in the order-sessions API. The issue stems from using a custom insecure `authenticateUser` middleware instead of the proper JWT `authenticateToken` middleware, allowing unauthorized access to user order sessions.

## Problem Analysis

### Current State

**Backend Issue ([`backend/src/handlers/orderSessions.ts`](backend/src/handlers/orderSessions.ts:14-25)):**
- Uses custom `authenticateUser` middleware that extracts userId from query parameters or request body
- No JWT token validation
- Allows any user to access another user's order session by manipulating the userId parameter
- Returns 404 when userId is not provided in query parameters

**Frontend Issue ([`frontend/services/orderService.ts`](frontend/services/orderService.ts:6-35)):**
- Calls `/api/order-sessions/current?userId=${userId}` without Authorization header
- Extracts userId from localStorage instead of JWT token
- Does not use `getAuthHeaders()` for GET request
- Inconsistent with other services that properly use JWT authentication

### Root Cause

The orderSessions handler was implemented with a placeholder authentication mechanism that was never replaced with proper JWT authentication. This creates a security vulnerability where:
1. User sessions can be accessed by anyone who knows the userId
2. No token revocation checking
3. No proper authentication logging
4. Inconsistent with the rest of the application's security model

## Solution Overview

The fix involves three main components:

1. **Backend Changes**: Replace custom middleware with proper JWT authentication
2. **Frontend Changes**: Update API calls to include Authorization headers
3. **Testing**: Verify the fix works correctly with proper security

## Detailed Implementation Plan

### Phase 1: Backend Changes

#### File: [`backend/src/handlers/orderSessions.ts`](backend/src/handlers/orderSessions.ts)

**Change 1: Remove custom middleware and import proper authentication**

**Before (Lines 1-25):**
```typescript
import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { OrderSession } from '../types';
import { logError } from '../utils/logger';

// Define custom type for Request to include user information
interface AuthenticatedRequest extends Request {
  userId?: number;
}

export const orderSessionsRouter = express.Router();

// Middleware to extract user ID from request (to be implemented with proper auth)
const authenticateUser = (req: AuthenticatedRequest, res: Response, next: any) => {
  // For now, extract userId from request body or query params for testing
  // In a real implementation, this would come from session, JWT token, etc.
 const userId = req.body.userId || req.query.userId || (req as any).session?.userId;
  
  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  
  req.userId = Number(userId);
  next();
};
```

**After:**
```typescript
import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import type { OrderSession } from '../types';
import { logError } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';

export const orderSessionsRouter = express.Router();
```

**Change 2: Update GET /current endpoint to use req.user.id**

**Before (Lines 27-64):**
```typescript
// GET /api/order-sessions/current - Get the current user's active order session
orderSessionsRouter.get('/current', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find the user's active order session
    const orderSession = await prisma.orderSession.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });
    
    if (!orderSession) {
      return res.status(404).json({ error: 'No active order session found' });
    }
    
    // Parse the items JSON string back to array
    const orderSessionWithParsedItems = {
      ...orderSession,
      items: typeof orderSession.items === 'string' ? JSON.parse(orderSession.items) : orderSession.items,
      createdAt: orderSession.createdAt.toISOString(),
      updatedAt: orderSession.updatedAt.toISOString(),
      logoutTime: orderSession.logoutTime ? orderSession.logoutTime.toISOString() : null
    };
    
    res.json(orderSessionWithParsedItems);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching order session', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch order session' });
  }
});
```

**After:**
```typescript
// GET /api/order-sessions/current - Get the current user's active order session
orderSessionsRouter.get('/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Find the user's active order session
    const orderSession = await prisma.orderSession.findFirst({
      where: {
        userId,
        status: 'active'
      }
    });
    
    if (!orderSession) {
      return res.status(404).json({ error: 'No active order session found' });
    }
    
    // Parse the items JSON string back to array
    const orderSessionWithParsedItems = {
      ...orderSession,
      items: typeof orderSession.items === 'string' ? JSON.parse(orderSession.items) : orderSession.items,
      createdAt: orderSession.createdAt.toISOString(),
      updatedAt: orderSession.updatedAt.toISOString(),
      logoutTime: orderSession.logoutTime ? orderSession.logoutTime.toISOString() : null
    };
    
    res.json(orderSessionWithParsedItems);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching order session', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: 'Failed to fetch order session' });
  }
});
```

**Change 3: Update POST /current endpoint**

**Before (Lines 66-115):**
```typescript
// POST /api/order-sessions/current - Create or update the user's order session
orderSessionsRouter.post('/current', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { items } = req.body as { items: OrderSession['items'] };
```

**After:**
```typescript
// POST /api/order-sessions/current - Create or update the user's order session
orderSessionsRouter.post('/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { items } = req.body as { items: OrderSession['items'] };
```

**Change 4: Update PUT /current endpoint**

**Before (Lines 117-156):**
```typescript
// PUT /api/order-sessions/current - Update the user's order session
orderSessionsRouter.put('/current', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
```

**After:**
```typescript
// PUT /api/order-sessions/current - Update the user's order session
orderSessionsRouter.put('/current', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
```

**Change 5: Update PUT /current/logout endpoint**

**Before (Lines 158-196):**
```typescript
// PUT /api/order-sessions/current/logout - Mark the session as pending logout when user logs out
orderSessionsRouter.put('/current/logout', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
```

**After:**
```typescript
// PUT /api/order-sessions/current/logout - Mark the session as pending logout when user logs out
orderSessionsRouter.put('/current/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
```

**Change 6: Update PUT /current/complete endpoint**

**Before (Lines 198-235):**
```typescript
// PUT /api/order-sessions/current/complete - Mark the session as completed when payment is made
orderSessionsRouter.put('/current/complete', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
```

**After:**
```typescript
// PUT /api/order-sessions/current/complete - Mark the session as completed when payment is made
orderSessionsRouter.put('/current/complete', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
```

**Change 7: Update PUT /current/assign-tab endpoint**

**Before (Lines 237-274):**
```typescript
// PUT /api/order-sessions/current/assign-tab - Mark the session as assigned to a tab
orderSessionsRouter.put('/current/assign-tab', authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
```

**After:**
```typescript
// PUT /api/order-sessions/current/assign-tab - Mark the session as assigned to a tab
orderSessionsRouter.put('/current/assign-tab', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
```

### Phase 2: Frontend Changes

#### File: [`frontend/services/orderService.ts`](frontend/services/orderService.ts)

**Change 1: Update getOrderSession to use Authorization header**

**Before (Lines 6-35):**
```typescript
export const getOrderSession = async (): Promise<OrderSession | null> => {
  try {
    // Get userId from localStorage or wherever it's stored after login
    const storedUser = localStorage.getItem('currentUser');
    const userId = storedUser ? JSON.parse(storedUser).id : null;
    
    if (!userId) {
      console.warn('No user authenticated for order session, returning null');
      return null;
    }
    
    const response = await fetch(apiUrl(`/api/order-sessions/current?userId=${userId}`));
    if (!response.ok) {
      if (response.status === 404) {
        // Return null or empty session if no active session exists
        return null;
      } else if (response.status === 401) {
        // User not authenticated, return null instead of throwing
        console.warn('User not authenticated for order session, returning null');
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
 } catch (error) {
    console.error('Error fetching order session:', error);
    // Return null instead of throwing to prevent errors during initialization
    return null;
  }
};
```

**After:**
```typescript
export const getOrderSession = async (): Promise<OrderSession | null> => {
  try {
    const response = await fetch(apiUrl('/api/order-sessions/current'), {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        // Return null or empty session if no active session exists
        return null;
      } else if (response.status === 401) {
        // User not authenticated, return null instead of throwing
        console.warn('User not authenticated for order session, returning null');
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
 } catch (error) {
    console.error('Error fetching order session:', error);
    // Return null instead of throwing to prevent errors during initialization
    return null;
  }
};
```

**Change 2: Update saveOrderSession to remove userId from body**

**Before (Lines 37-70):**
```typescript
export const saveOrderSession = async (orderItems: OrderItem[]): Promise<OrderSession | null> => {
  try {
    // Get userId from localStorage or wherever it's stored after login
    const storedUser = localStorage.getItem('currentUser');
    const userId = storedUser ? JSON.parse(storedUser).id : null;
    
    if (!userId) {
      console.warn('No user authenticated for order session save, returning null');
      return null;
    }
    
    const response = await fetch(apiUrl('/api/order-sessions/current'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items: orderItems, userId })
    });
```

**After:**
```typescript
export const saveOrderSession = async (orderItems: OrderItem[]): Promise<OrderSession | null> => {
  try {
    const response = await fetch(apiUrl('/api/order-sessions/current'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items: orderItems })
    });
```

**Change 3: Update updateOrderSessionStatus to remove userId from body**

**Before (Lines 72-120):**
```typescript
export const updateOrderSessionStatus = async (status: 'logout' | 'complete' | 'assign-tab'): Promise<OrderSession | null> => {
  try {
    // Get userId from localStorage or wherever it's stored after login
    const storedUser = localStorage.getItem('currentUser');
    const userId = storedUser ? JSON.parse(storedUser).id : null;
    
    if (!userId) {
      console.warn(`No user authenticated for order session status update (${status}), returning null`);
      return null;
    }
    
    let endpoint = '';
    switch (status) {
      case 'logout':
        endpoint = '/api/order-sessions/current/logout';
        break;
      case 'complete':
        endpoint = '/api/order-sessions/current/complete';
        break;
      case 'assign-tab':
        endpoint = '/api/order-sessions/current/assign-tab';
        break;
      default:
        throw new Error(`Invalid status: ${status}`);
    }
    
    const response = await fetch(apiUrl(endpoint), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId })
    });
```

**After:**
```typescript
export const updateOrderSessionStatus = async (status: 'logout' | 'complete' | 'assign-tab'): Promise<OrderSession | null> => {
  try {
    let endpoint = '';
    switch (status) {
      case 'logout':
        endpoint = '/api/order-sessions/current/logout';
        break;
      case 'complete':
        endpoint = '/api/order-sessions/current/complete';
        break;
      case 'assign-tab':
        endpoint = '/api/order-sessions/current/assign-tab';
        break;
      default:
        throw new Error(`Invalid status: ${status}`);
    }
    
    const response = await fetch(apiUrl(endpoint), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({})
    });
```

### Phase 3: Testing Strategy

#### Test 1: Verify JWT Authentication Works
1. Login as admin user
2. Verify JWT token is stored in localStorage
3. Call GET /api/order-sessions/current with Authorization header
4. Verify response is successful (200 or 404 if no session exists)
5. Verify response is NOT 401 (authentication successful)

#### Test 2: Verify Unauthorized Access is Blocked
1. Call GET /api/order-sessions/current without Authorization header
2. Verify response is 401 with error message
3. Call GET /api/order-sessions/current?userId=1 without Authorization header
4. Verify response is 401 (userId parameter should be ignored)

#### Test 3: Verify User Isolation
1. Login as user A (userId=1)
2. Create an order session for user A
3. Login as user B (userId=2)
4. Call GET /api/order-sessions/current with user B's token
5. Verify user B cannot access user A's order session
6. Verify user B only sees their own order session

#### Test 4: Verify Token Revocation
1. Login as user
2. Create an order session
3. Logout (revokes token)
4. Try to access order session with revoked token
5. Verify response is 401 with "Token has been revoked" message

#### Test 5: Verify All Endpoints Work
1. Test GET /api/order-sessions/current
2. Test POST /api/order-sessions/current (create/update)
3. Test PUT /api/order-sessions/current (update)
4. Test PUT /api/order-sessions/current/logout
5. Test PUT /api/order-sessions/current/complete
6. Test PUT /api/order-sessions/current/assign-tab

All endpoints should:
- Require valid JWT token
- Extract userId from token, not from request
- Return 401 for unauthorized access
- Return 404 if no active session exists
- Return 200/201 for successful operations

## Security Benefits

### Before Fix
- ❌ No JWT token validation
- ❌ User ID extracted from query parameters (insecure)
- ❌ No token revocation checking
- ❌ No authentication logging
- ❌ Users can access each other's sessions
- ❌ Inconsistent with application security model

### After Fix
- ✅ Proper JWT token validation using [`authenticateToken`](backend/src/middleware/auth.ts:19-94) middleware
- ✅ User ID extracted from verified JWT token (`req.user.id`)
- ✅ Token revocation checking via [`isTokenRevoked`](backend/src/services/tokenBlacklistService.ts)
- ✅ Authentication logging via [`logAuthEvent`](backend/src/utils/logger.ts)
- ✅ Users can only access their own sessions
- ✅ Consistent with all other API endpoints
- ✅ Follows security best practices

## Potential Risks and Mitigations

### Risk 1: Breaking Existing Functionality
**Description**: Frontend code that relies on userId in query parameters may break.

**Mitigation**: 
- All frontend changes are included in this plan
- The frontend already has `getAuthHeaders()` function that properly handles JWT tokens
- Other services already use this pattern successfully

### Risk 2: Token Expiration Handling
**Description**: Users may experience errors if their token expires during a session.

**Mitigation**:
- The [`getAuthHeaders`](frontend/services/apiBase.ts:96-146) function already handles token expiration
- It checks if token is expired and clears it from localStorage
- It redirects to login if on a protected route

### Risk 3: Backward Compatibility
**Description**: Any external clients using the API may break.

**Mitigation**:
- This is an internal application with no known external clients
- The security fix is critical and should be implemented
- If external clients exist, they should be updated to use JWT authentication

## Implementation Checklist

### Backend Changes
- [ ] Remove custom `authenticateUser` middleware from [`orderSessions.ts`](backend/src/handlers/orderSessions.ts:14-25)
- [ ] Import `authenticateToken` from [`../middleware/auth`](backend/src/middleware/auth.ts:19-94)
- [ ] Remove `AuthenticatedRequest` interface (no longer needed)
- [ ] Update all 6 endpoints to use `authenticateToken` middleware
- [ ] Change `req.userId` to `req.user?.id` in all endpoints
- [ ] Remove userId extraction from query/body parameters

### Frontend Changes
- [ ] Update `getOrderSession` to use `getAuthHeaders()`
- [ ] Remove userId from query parameters in `getOrderSession`
- [ ] Remove userId extraction from localStorage in `getOrderSession`
- [ ] Update `saveOrderSession` to remove userId from body
- [ ] Remove userId extraction from localStorage in `saveOrderSession`
- [ ] Update `updateOrderSessionStatus` to remove userId from body
- [ ] Remove userId extraction from localStorage in `updateOrderSessionStatus`

### Testing
- [ ] Test JWT authentication works correctly
- [ ] Test unauthorized access is blocked
- [ ] Test user isolation (users can't access each other's sessions)
- [ ] Test token revocation works
- [ ] Test all 6 endpoints work correctly
- [ ] Test error handling (401, 404, 500)
- [ ] Test with Playwright MCP Server for end-to-end verification

## Summary

This plan provides a comprehensive fix for the security vulnerability in the order-sessions API. The changes are:

1. **Minimal and focused**: Only the necessary files are modified
2. **Consistent**: Follows the same pattern used by all other API endpoints
3. **Secure**: Implements proper JWT authentication with token revocation checking
4. **Testable**: Clear testing strategy to verify the fix works correctly
5. **Low risk**: Changes are straightforward and follow established patterns

The fix ensures that:
- All order session operations require valid JWT authentication
- User ID is extracted from the verified JWT token, not from request parameters
- Users can only access their own order sessions
- Token revocation is properly enforced
- Authentication events are logged for security auditing

This brings the order-sessions API in line with the security standards used throughout the rest of the application.
