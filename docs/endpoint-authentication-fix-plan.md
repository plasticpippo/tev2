# Endpoint Authentication Fix Plan

## Overview

This document outlines the plan to add authentication middleware to 9 handler files that currently have NO authentication on any endpoints. This is a critical security vulnerability that exposes sensitive business data to unauthorized access.

## Current State

### Authentication Middleware
The [`authenticateToken`](backend/src/middleware/auth.ts:19) middleware is already implemented and provides:
- JWT token verification using the `jose` library
- Token blacklist checking via [`isTokenRevoked`](backend/src/services/tokenBlacklistService.ts)
- User information attachment to `req.user` (id, username, role)

### Authorization Middleware
The [`requireAdmin`](backend/src/middleware/authorization.ts:136) middleware provides admin-only access control.

### Reference Implementation Pattern
From [`users.ts`](backend/src/handlers/users.ts) and [`tables.ts`](backend/src/handlers/tables.ts):

```typescript
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';

// For authenticated routes
router.get('/', authenticateToken, async (req: Request, res: Response) => { ... });

// For admin-only routes
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => { ... });
```

---

## Files Requiring Authentication

### 1. tabs.ts - Tab Management

**File:** [`backend/src/handlers/tabs.ts`](backend/src/handlers/tabs.ts)

| Endpoint | Method | Line | Current State | Required Change | Auth Type |
|----------|--------|------|---------------|-----------------|-----------|
| `/api/tabs` | GET | 9 | No auth | Add `authenticateToken` | Authenticated |
| `/api/tabs/:id` | GET | 32 | No auth | Add `authenticateToken` | Authenticated |
| `/api/tabs` | POST | 63 | No auth | Add `authenticateToken` | Authenticated |
| `/api/tabs/:id` | PUT | 146 | No auth | Add `authenticateToken` | Authenticated |
| `/api/tabs/:id` | DELETE | 220 | No auth | Add `authenticateToken` | Authenticated |

**Changes Required:**
1. Add import: `import { authenticateToken } from '../middleware/auth';`
2. Add `authenticateToken` middleware to all 5 routes

---

### 2. transactions.ts - Transaction Records (HIGH PRIORITY)

**File:** [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts)

**⚠️ CRITICAL:** This handler exposes payment details including totals, payment methods, and item details.

| Endpoint | Method | Line | Current State | Required Change | Auth Type |
|----------|--------|------|---------------|-----------------|-----------|
| `/api/transactions` | GET | 10 | No auth | Add `authenticateToken` | Authenticated |
| `/api/transactions/:id` | GET | 31 | No auth | Add `authenticateToken` | Authenticated |
| `/api/transactions` | POST | 59 | No auth | Add `authenticateToken` | Authenticated |

**Changes Required:**
1. Add import: `import { authenticateToken } from '../middleware/auth';`
2. Add `authenticateToken` middleware to all 3 routes

---

### 3. tills.ts - Till Management

**File:** [`backend/src/handlers/tills.ts`](backend/src/handlers/tills.ts)

| Endpoint | Method | Line | Current State | Required Change | Auth Type |
|----------|--------|------|---------------|-----------------|-----------|
| `/api/tills` | GET | 10 | No auth | Add `authenticateToken` | Authenticated |
| `/api/tills/:id` | GET | 23 | No auth | Add `authenticateToken` | Authenticated |
| `/api/tills` | POST | 44 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |
| `/api/tills/:id` | PUT | 70 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |
| `/api/tills/:id` | DELETE | 100 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |

**Changes Required:**
1. Add imports:
   ```typescript
   import { authenticateToken } from '../middleware/auth';
   import { requireAdmin } from '../middleware/authorization';
   ```
2. GET routes: Add `authenticateToken`
3. POST/PUT/DELETE routes: Add `authenticateToken, requireAdmin`

---

### 4. categories.ts - Category Management

**File:** [`backend/src/handlers/categories.ts`](backend/src/handlers/categories.ts)

| Endpoint | Method | Line | Current State | Required Change | Auth Type |
|----------|--------|------|---------------|-----------------|-----------|
| `/api/categories` | GET | 10 | No auth | Add `authenticateToken` | Authenticated |
| `/api/categories/:id` | GET | 29 | No auth | Add `authenticateToken` | Authenticated |
| `/api/categories` | POST | 55 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |
| `/api/categories/:id` | PUT | 87 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |
| `/api/categories/:id` | DELETE | 123 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |

**Changes Required:**
1. Add imports:
   ```typescript
   import { authenticateToken } from '../middleware/auth';
   import { requireAdmin } from '../middleware/authorization';
   ```
2. GET routes: Add `authenticateToken`
3. POST/PUT/DELETE routes: Add `authenticateToken, requireAdmin`

---

### 5. products.ts - Product Management

**File:** [`backend/src/handlers/products.ts`](backend/src/handlers/products.ts)

| Endpoint | Method | Line | Current State | Required Change | Auth Type |
|----------|--------|------|---------------|-----------------|-----------|
| `/api/products` | GET | 10 | No auth | Add `authenticateToken` | Authenticated |
| `/api/products/:id` | GET | 31 | No auth | Add `authenticateToken` | Authenticated |
| `/api/products` | POST | 59 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |
| `/api/products/:id` | PUT | 149 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |
| `/api/products/:id` | DELETE | 312 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |

**Changes Required:**
1. Add imports:
   ```typescript
   import { authenticateToken } from '../middleware/auth';
   import { requireAdmin } from '../middleware/authorization';
   ```
2. GET routes: Add `authenticateToken`
3. POST/PUT/DELETE routes: Add `authenticateToken, requireAdmin`

---

### 6. stockItems.ts - Stock Item Management

**File:** [`backend/src/handlers/stockItems.ts`](backend/src/handlers/stockItems.ts)

| Endpoint | Method | Line | Current State | Required Change | Auth Type |
|----------|--------|------|---------------|-----------------|-----------|
| `/api/stock-items` | GET | 10 | No auth | Add `authenticateToken` | Authenticated |
| `/api/stock-items/:id` | GET | 26 | No auth | Add `authenticateToken` | Authenticated |
| `/api/stock-items` | POST | 58 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |
| `/api/stock-items/update-levels` | PUT | 86 | No auth | Add `authenticateToken` | Authenticated |
| `/api/stock-items/:id` | PUT | 210 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |
| `/api/stock-items/:id` | DELETE | 300 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |
| `/api/stock-items/orphaned-references` | GET | 333 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |
| `/api/stock-items/cleanup-orphaned` | DELETE | 381 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |
| `/api/stock-items/validate-integrity` | GET | 450 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |

**Changes Required:**
1. Add imports:
   ```typescript
   import { authenticateToken } from '../middleware/auth';
   import { requireAdmin } from '../middleware/authorization';
   ```
2. Standard GET routes: Add `authenticateToken`
3. POST/PUT/DELETE routes: Add `authenticateToken, requireAdmin`
4. Admin utility routes (orphaned-references, cleanup-orphaned, validate-integrity): Add `authenticateToken, requireAdmin`

---

### 7. stockAdjustments.ts - Stock Adjustments

**File:** [`backend/src/handlers/stockAdjustments.ts`](backend/src/handlers/stockAdjustments.ts)

| Endpoint | Method | Line | Current State | Required Change | Auth Type |
|----------|--------|------|---------------|-----------------|-----------|
| `/api/stock-adjustments` | GET | 9 | No auth | Add `authenticateToken` | Authenticated |
| `/api/stock-adjustments/:id` | GET | 24 | No auth | Add `authenticateToken` | Authenticated |
| `/api/stock-adjustments` | POST | 47 | No auth | Add `authenticateToken` | Authenticated |
| `/api/stock-adjustments/orphaned-references` | GET | 99 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |
| `/api/stock-adjustments/cleanup-orphaned` | DELETE | 140 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |
| `/api/stock-adjustments/validate-integrity` | GET | 202 | No auth | Add `authenticateToken`, `requireAdmin` | Admin Only |

**Changes Required:**
1. Add imports:
   ```typescript
   import { authenticateToken } from '../middleware/auth';
   import { requireAdmin } from '../middleware/authorization';
   ```
2. Standard routes: Add `authenticateToken`
3. Admin utility routes: Add `authenticateToken, requireAdmin`

---

### 8. dailyClosings.ts - Daily Closing Reports

**File:** [`backend/src/handlers/dailyClosings.ts`](backend/src/handlers/dailyClosings.ts)

| Endpoint | Method | Line | Current State | Required Change | Auth Type |
|----------|--------|------|---------------|-----------------|-----------|
| `/api/daily-closings` | GET | 11 | No auth | Add `authenticateToken` | Authenticated |
| `/api/daily-closings/:id` | GET | 70 | No auth | Add `authenticateToken` | Authenticated |
| `/api/daily-closings` | POST | 111 | No auth | Add `authenticateToken` | Authenticated |

**Changes Required:**
1. Add import: `import { authenticateToken } from '../middleware/auth';`
2. Add `authenticateToken` middleware to all 3 routes

---

### 9. consumptionReports.ts - Consumption Reports

**File:** [`backend/src/handlers/consumptionReports.ts`](backend/src/handlers/consumptionReports.ts)

| Endpoint | Method | Line | Current State | Required Change | Auth Type |
|----------|--------|------|---------------|-----------------|-----------|
| `/api/consumption-reports/itemised` | GET | 8 | No auth | Add `authenticateToken` | Authenticated |

**Changes Required:**
1. Add import: `import { authenticateToken } from '../middleware/auth';`
2. Add `authenticateToken` middleware to the route

---

## Summary Table

| File | Total Endpoints | Authenticated | Admin Only |
|------|-----------------|---------------|------------|
| tabs.ts | 5 | 5 | 0 |
| transactions.ts | 3 | 3 | 0 |
| tills.ts | 5 | 2 | 3 |
| categories.ts | 5 | 2 | 3 |
| products.ts | 5 | 2 | 3 |
| stockItems.ts | 9 | 3 | 6 |
| stockAdjustments.ts | 6 | 3 | 3 |
| dailyClosings.ts | 3 | 3 | 0 |
| consumptionReports.ts | 1 | 1 | 0 |
| **TOTAL** | **42** | **24** | **18** |

---

## Implementation Order

Recommended implementation order based on security risk:

1. **transactions.ts** - HIGHEST PRIORITY - Exposes payment/financial data
2. **dailyClosings.ts** - HIGH PRIORITY - Financial reports
3. **consumptionReports.ts** - HIGH PRIORITY - Business intelligence
4. **stockAdjustments.ts** - MEDIUM PRIORITY - Inventory manipulation
5. **stockItems.ts** - MEDIUM PRIORITY - Inventory management
6. **products.ts** - MEDIUM PRIORITY - Product catalog
7. **categories.ts** - MEDIUM PRIORITY - Category management
8. **tills.ts** - MEDIUM PRIORITY - Till configuration
9. **tabs.ts** - LOWER PRIORITY - Tab management (still important)

---

## Testing Requirements

After implementation, each endpoint must be tested to verify:

1. **Unauthenticated Access Denied:**
   - Request without token returns 401
   - Request with invalid token returns 401
   - Request with revoked token returns 401

2. **Authenticated Access Granted:**
   - Valid token allows access to authenticated routes

3. **Admin-Only Enforcement:**
   - Non-admin users receive 403 on admin routes
   - Admin users can access admin routes

4. **Frontend Compatibility:**
   - Frontend properly sends auth tokens
   - Error handling works correctly

---

## Code Change Template

For each file, the changes follow this pattern:

```typescript
// 1. Add imports at the top
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization'; // If admin routes exist

// 2. Modify route definitions
// Before:
router.get('/', async (req: Request, res: Response) => { ... });

// After (authenticated):
router.get('/', authenticateToken, async (req: Request, res: Response) => { ... });

// After (admin only):
router.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => { ... });
```

---

## Risk Assessment

### Current Vulnerabilities

| Vulnerability | Severity | Impact |
|---------------|----------|--------|
| Unauthorized transaction access | CRITICAL | Financial data exposure |
| Unauthorized daily closing access | HIGH | Business data exposure |
| Unauthorized stock manipulation | HIGH | Inventory fraud |
| Unauthorized product/category changes | MEDIUM | Data integrity |
| Unauthorized till configuration | MEDIUM | Operational disruption |

### Post-Fix Security

After implementing this plan:
- All 42 endpoints will require authentication
- 18 admin-only endpoints will have role-based access control
- Financial and business data will be protected from unauthorized access