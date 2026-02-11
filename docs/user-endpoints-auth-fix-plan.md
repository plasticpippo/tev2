# User Endpoints Authentication Fix Plan

## Overview

This document outlines the mitigation plan for fixing unauthenticated user endpoints in the backend API.

## Current State

5 endpoints in `backend/src/handlers/users.ts` lack authentication:

| # | Endpoint | Method | Description | Current Auth |
|---|----------|--------|-------------|--------------|
| 1 | `/api/users` | GET | List all users | None |
| 2 | `/api/users/:id` | GET | Get specific user | None |
| 3 | `/api/users` | POST | Create user | None |
| 4 | `/api/users/:id` | PUT | Update user | None |
| 5 | `/api/users/:id` | DELETE | Delete user | None |

### Available Middleware

The middleware is already imported in the file:
- `authenticateToken` from `../middleware/auth`
- `requireAdmin` from `../middleware/authorization`

## Proposed Fix

Apply authentication middleware to each endpoint:

| Endpoint | Method | Middleware to Add | Rationale |
|----------|--------|------------------|-----------|
| GET /api/users | GET | `authenticateToken` | Any authenticated user can list users |
| GET /api/users/:id | GET | `authenticateToken` | Any authenticated user can view user details |
| POST /api/users | POST | `authenticateToken, requireAdmin` | Only admins can create new users |
| PUT /api/users/:id | PUT | `authenticateToken` | Authenticated users can update (self-check in handler) |
| DELETE /api/users/:id | DELETE | `authenticateToken, requireAdmin` | Only admins can delete users |

## Implementation Steps

### Step 1: Add Middleware to Route Definitions

Update each route in `backend/src/handlers/users.ts` to include the appropriate middleware:

```typescript
// Before (example)
router.get('/', async (req, res) => { ... });

// After (example)
router.get('/', authenticateToken, async (req, res) => { ... });
```

### Step 2: Rebuild and Test

Run the following command to rebuild the backend:

```bash
docker compose up -d --build
```

### Step 3: Verify Unauthenticated Requests Are Rejected

Test each endpoint without authentication to verify 401 responses:

| Endpoint | Expected Response |
|----------|------------------|
| GET /api/users | 401 Unauthorized |
| GET /api/users/:id | 401 Unauthorized |
| POST /api/users | 401 Unauthorized |
| PUT /api/users/:id | 401 Unauthorized |
| DELETE /api/users/:id | 401 Unauthorized |

### Step 4: Verify Authenticated Requests Work Correctly

Test each endpoint with valid authentication:

| Endpoint | Auth Level | Expected Response |
|----------|------------|------------------|
| GET /api/users | Any user | 200 OK with user list |
| GET /api/users/:id | Any user | 200 OK with user details |
| POST /api/users | Admin only | 201 Created |
| PUT /api/users/:id | Any user | 200 OK |
| DELETE /api/users/:id | Admin only | 200 OK or 204 No Content |

## Risk Assessment

| Risk Factor | Assessment |
|-------------|------------|
| **Overall Risk** | Low |
| **Change Type** | Adding middleware to existing routes |
| **Code Impact** | Minimal - no logic changes to handlers |
| **Middleware Status** | Already used by other endpoints in the same file |
| **Breaking Changes** | None for legitimate authenticated users |

### Mitigation Notes

- The middleware is already imported and used elsewhere in the codebase
- No changes to handler logic required
- Standard authentication pattern already established in the application
- Rollback is simple: remove the middleware from routes

## Testing Checklist

- [ ] GET /api/users returns 401 without token
- [ ] GET /api/users returns 200 with valid token
- [ ] GET /api/users/:id returns 401 without token
- [ ] GET /api/users/:id returns 200 with valid token
- [ ] POST /api/users returns 401 without token
- [ ] POST /api/users returns 403 with non-admin token
- [ ] POST /api/users returns 201 with admin token
- [ ] PUT /api/users/:id returns 401 without token
- [ ] PUT /api/users/:id returns 200 with valid token
- [ ] DELETE /api/users/:id returns 401 without token
- [ ] DELETE /api/users/:id returns 403 with non-admin token
- [ ] DELETE /api/users/:id returns 200/204 with admin token

## References

- [`backend/src/handlers/users.ts`](../backend/src/handlers/users.ts) - User endpoints handler
- [`backend/src/middleware/auth.ts`](../backend/src/middleware/auth.ts) - Authentication middleware
- [`backend/src/middleware/authorization.ts`](../backend/src/middleware/authorization.ts) - Authorization middleware
