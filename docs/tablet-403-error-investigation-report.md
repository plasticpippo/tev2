# Tablet 403 Error Investigation Report

**Document Version:** 1.1  
**Date:** March 1, 2026  
**Classification:** Technical Investigation Report  
**Status:** Updated with Root Cause Analysis

---

## 1. Executive Summary

This report documents the investigation findings for the 403 Forbidden error that occurs when tablets attempt to process payments in the Bar POS application. **The investigation has identified the actual root cause: an authorization bug where the stock level update endpoint requires Admin privileges, but cashiers need to use it during payment processing.**

**Key Findings:**

- **Actual Root Cause:** The [`/api/stock-items/update-levels`](backend/src/handlers/stockItems.ts:90) endpoint uses `requireAdmin` middleware, but cashiers (who process payments) need access to this endpoint to update inventory during sales
- **Secondary Issue:** Discount functionality also requires Admin privileges ([`backend/src/handlers/transactions.ts:236-242`](backend/src/handlers/transactions.ts:236-242)) but should be available to cashiers
- **Why It Appears Tablet-Specific:** Users typically test with different accounts on different devices - tablets are often used with cashier accounts while laptops may have cached admin sessions or be used by administrators

The issue is **NOT** a tablet-specific hardware or network issue, but rather a **role-based authorization bug** that manifests differently depending on which user account is used on each device.

---

## 2. Investigation Methodology

The investigation followed a systematic approach to identify the root causes of the 403 errors on tablets:

### 2.1 Codebase Analysis

Reviewed the following components to understand the request flow and security controls:

| Component | Files Reviewed | Purpose |
|-----------|---------------|---------|
| Stock Items Handler | [`backend/src/handlers/stockItems.ts`](backend/src/handlers/stockItems.ts:1-20853) | Analyzed stock level update endpoint authorization |
| Transactions Handler | [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:1-11716) | Reviewed discount endpoint authorization |
| Payment Context | [`frontend/contexts/PaymentContext.tsx`](frontend/contexts/PaymentContext.tsx:1-200) | Analyzed frontend API calls during payment processing |
| Authorization Middleware | [`backend/src/middleware/authorization.ts`](backend/src/middleware/authorization.ts:1-157) | Examined ownership and role checking |
| Authentication Middleware | [`backend/src/middleware/auth.ts`](backend/src/middleware/auth.ts:1-95) | Reviewed token validation |

### 2.2 Technical Analysis Approach

1. **Payment Flow Analysis:** Traced the frontend-to-backend call chain during payment processing
2. **Endpoint Authorization Review:** Examined which endpoints require which privilege levels
3. **Role Requirements Check:** Identified mismatches between required privileges and user roles
4. **Cross-Device Testing Pattern:** Analyzed why the issue appears device-specific

---

## 3. Root Cause Analysis

### 3.1 Stock Level Update Requires Admin Privileges (PRIMARY ROOT CAUSE)

#### 3.1.1 Endpoint Authorization Issue

**Location:** [`backend/src/handlers/stockItems.ts:90`](backend/src/handlers/stockItems.ts:90)

**Finding:** The stock level update endpoint uses `requireAdmin` middleware, which restricts access to users with Admin role only:

```typescript
// stockItems.ts:90 - The problematic middleware
router.post('/update-levels', requireAdmin, async (req, res) => {
  // ... handler implementation
});
```

**Issue:** Cashiers need to update stock levels when they process payments (inventory decrements with each sale), but the endpoint requires Admin privileges. This causes a 403 Forbidden error when cashiers attempt to complete transactions.

#### 3.1.2 Frontend Call Chain

**Location:** [`frontend/contexts/PaymentContext.tsx:135`](frontend/contexts/PaymentContext.tsx:135)

When a cashier processes a payment, the frontend calls:

```typescript
// PaymentContext.tsx:135
await api.updateStockLevels(itemsWithQuantities);
```

This call fails with 403 because:
1. The user is logged in as a Cashier (not Admin)
2. The endpoint `/api/stock-items/update-levels` requires Admin privileges
3. The authorization middleware rejects the request before processing

#### 3.1.3 Discount Endpoint Also Requires Admin

**Location:** [`backend/src/handlers/transactions.ts:236-242`](backend/src/handlers/transactions.ts:236-242)

**Additional Finding:** Discount application also requires Admin privileges:

```typescript
// transactions.ts:236-242
router.post('/apply-discount', requireAdmin, async (req, res) => {
  // ... handler implementation
});
```

This means cashiers cannot apply discounts during sales, which may be a required feature for customer service.

### 3.2 Why the Issue Appears Tablet-Specific

The issue manifests as "tablet-specific" due to **user account differences**, not device-specific technical issues:

| Scenario | Tablet | Laptop |
|----------|--------|--------|
| **Typical User** | Cashier account | Admin account |
| **Session State** | Fresh login as cashier | Cached admin session |
| **Testing Pattern** | Used for actual sales | Used for administration |
| **Result** | 403 on payment | Works fine |

**Possible Explanations:**

1. **Different User Accounts:** The user may test the tablet with a cashier account while using an admin account on their laptop

2. **Cached Sessions:** The laptop browser might have a cached admin session from previous testing, while tablets have fresh cashier logins

3. **Testing Workflow:** Administrators typically test on laptops (for configuration) while tablets are deployed for actual cashier operations

4. **Same User, Different Roles:** If the same person has both admin and cashier accounts, they may log in differently on each device

**Key Insight:** The 403 error occurs whenever a **non-admin user** (cashier) attempts to process a payment, regardless of the device. The "tablet-specific" perception comes from the typical usage patterns where tablets are used for point-of-sale operations while laptops are used for administration.

### 3.3 Authorization Middleware Review

**Location:** [`backend/src/middleware/authorization.ts:146`](backend/src/middleware/authorization.ts:146)

The `requireAdmin` middleware checks for admin role:

```typescript
// authorization.ts:146
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role;
  const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';
  
  if (!isAdmin) {
    return res.status(403).json({ error: i18n.t('errors.authorization.adminPrivilegesRequired') });
  }
  
  next();
};
```

**Note:** There is also a case sensitivity bug where lowercase `'admin'` is not recognized. This should be fixed for consistency:

```typescript
// Should be case-insensitive
const isAdmin = userRole?.toUpperCase() === 'ADMIN';
```

---

## 4. Why It Appears to Work on Laptops

This section explains why the 403 error seems tablet-specific when it's actually a role-based authorization issue.

### 4.1 The Real Explanation: User Accounts, Not Devices

The issue appears tablet-specific due to **how users interact with different devices**, not due to any technical difference between laptops and tablets:

| Factor | Typical Laptop Usage | Typical Tablet Usage |
|--------|---------------------|----------------------|
| **User Role** | Admin account | Cashier account |
| **Purpose** | Configuration and testing | Point-of-sale operations |
| **Session** | May have cached admin session | Fresh cashier login |
| **Payment Processing** | Rarely tested | Primary workflow |

### 4.2 Technical Flow Comparison

**Cashier Request Flow (Failing - any device):**
1. Cashier logs in and processes a payment
2. Frontend calls [`api.updateStockLevels()`](frontend/contexts/PaymentContext.tsx:135)
3. Request sent to `/api/stock-items/update-levels`
4. Backend checks user role - NOT admin
5. [`requireAdmin`](backend/src/middleware/authorization.ts:146) middleware rejects request
6. Response: 403 Forbidden

**Admin Request Flow (Working - any device):**
1. Admin logs in and processes a payment
2. Frontend calls `api.updateStockLevels()`
3. Request sent to `/api/stock-items/update-levels`
4. Backend checks user role - IS admin
5. `requireAdmin` middleware allows request
6. Stock levels updated successfully - 200 OK

### 4.3 Common Testing Scenarios

**Scenario 1: Different accounts on each device**
- Admin tests on laptop with admin account → Works
- Cashier uses tablet with cashier account → 403 error

**Scenario 2: Cached session**
- Admin previously logged in on laptop (session cached)
- Cashier logs in fresh on tablet → 403 error

**Scenario 3: Self-testing inconsistency**
- User has both admin and cashier accounts
- Tests on laptop as admin → Works
- Tests on tablet as cashier → 403 error

### 4.4 Key Insight

> **The 403 error is NOT a tablet-specific bug. It is a role-based authorization bug that affects ANY non-admin user attempting to process payments, regardless of the device used.**

The perception of tablet-specific behavior comes from the typical deployment pattern where tablets are used as point-of-sale terminals (cashier accounts) while laptops are used for administration (admin accounts).

---

## 5. Recommendations

> **Note:** These recommendations address the actual root cause of the 403 error. Implementation would require code changes and should be tested thoroughly before deployment.

### 5.1 Create Cashier-Level Stock Update Permission (PRIMARY FIX)

**Priority:** HIGH

**Current State:**
```typescript
// stockItems.ts:90
router.post('/update-levels', requireAdmin, async (req, res) => {
  // ...
});
```

**Recommended Approach:**

Create a new authorization level (e.g., `requireStockUpdate` or `requireCashier`) that allows both Admin and Cashier roles to update stock levels:

```typescript
// Option 1: Create new middleware for stock operations
const requireStockAccess = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role;
  const allowedRoles = ['ADMIN', 'Admin', 'CASHIER', 'Cashier'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ error: i18n.t('errors.authorization.insufficientPrivileges') });
  }
  
  next();
};

// Apply to stock update endpoint
router.post('/update-levels', requireStockAccess, async (req, res) => {
  // ...
});
```

**Alternative Approach:**

Create a specific permission for stock level updates that can be granted independently of admin privileges.

### 5.2 Allow Cashiers to Apply Discounts

**Priority:** HIGH

**Current State:**
```typescript
// transactions.ts:236-242
router.post('/apply-discount', requireAdmin, async (req, res) => {
  // ...
});
```

**Recommended Approach:**

Apply the same `requireStockAccess` (or new cashier permission) middleware to the discount endpoint, or create a separate `requireDiscountAccess` middleware:

```typescript
const requireDiscountAccess = (req: Request, res: Response, next: NextFunction) => {
  const userRole = req.user?.role;
  const allowedRoles = ['ADMIN', 'Admin', 'CASHIER', 'Cashier'];
  
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ error: i18n.t('errors.authorization.discountPrivilegesRequired') });
  }
  
  next();
};

router.post('/apply-discount', requireDiscountAccess, async (req, res) => {
  // ...
});
```

### 5.3 Fix Role Case Sensitivity Bug

**Priority:** MEDIUM

**Current State:**
```typescript
const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';
```

**Recommended Fix:**
```typescript
// Case-insensitive role check
const isAdmin = userRole?.toUpperCase() === 'ADMIN';
```

This change should be applied to all authorization middleware functions:
- [`authorization.ts:43`](backend/src/middleware/authorization.ts:43) - verifyTableOwnership
- [`authorization.ts:94`](backend/src/middleware/authorization.ts:94) - verifyLayoutOwnership
- [`authorization.ts:114`](backend/src/middleware/authorization.ts:114) - verifyCategoryOwnership
- [`authorization.ts:146`](backend/src/middleware/authorization.ts:146) - requireAdmin

### 5.4 Add Comprehensive Permission System

**Priority:** MEDIUM

For long-term maintainability, consider implementing a more granular permission system:

```typescript
// Example: Define permissions enum
enum Permission {
  VIEW_STOCK = 'VIEW_STOCK',
  UPDATE_STOCK = 'UPDATE_STOCK',
  APPLY_DISCOUNT = 'APPLY_DISCOUNT',
  MANAGE_USERS = 'MANAGE_USERS',
  // ... other permissions
}

// User model would have permissions array
// role-based fallbacks provide default permissions
```

This allows fine-grained control over what each role can do without modifying endpoint handlers.

### 5.5 Testing Recommendations

When testing the fix, ensure:

1. **Admin account** can process payments and update stock
2. **Cashier account** can process payments and update stock
3. **Cashier account** can apply discounts (if that feature is required)
4. **Unauthorized roles** are still prevented from stock management
5. Test on **both laptop and tablet** devices to verify consistency

---

## Appendix A: File References

| File Path | Description |
|-----------|-------------|
| [`backend/src/handlers/stockItems.ts`](backend/src/handlers/stockItems.ts:1-20853) | Stock items handler - contains the `/update-levels` endpoint with requireAdmin |
| [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:1-11716) | Transactions handler - contains discount endpoint with requireAdmin |
| [`frontend/contexts/PaymentContext.tsx`](frontend/contexts/PaymentContext.tsx:1-200) | Frontend payment context - calls api.updateStockLevels() during payment |
| [`backend/src/middleware/authorization.ts`](backend/src/middleware/authorization.ts:1-157) | Authorization middleware - contains requireAdmin and role checks |
| [`backend/src/middleware/auth.ts`](backend/src/middleware/auth.ts:1-95) | Authentication middleware |

---

## Appendix B: Key Code Locations

### Stock Level Update Endpoint
```typescript
// backend/src/handlers/stockItems.ts:90
router.post('/update-levels', requireAdmin, async (req, res) => {
```

### Payment Processing Call
```typescript
// frontend/contexts/PaymentContext.tsx:135
await api.updateStockLevels(itemsWithQuantities);
```

### Discount Endpoint
```typescript
// backend/src/handlers/transactions.ts:236-242
router.post('/apply-discount', requireAdmin, async (req, res) => {
```

---

## Appendix C: Error Message Reference

The 403 Forbidden error for authorization failures is defined in:
- [`backend/locales/en/errors.json`](backend/locales/en/errors.json)
- [`backend/locales/it/errors.json`](backend/locales/it/errors.json)

Key authorization error messages:
- `errors.authorization.adminPrivilegesRequired` - Admin role required but not found
- `errors.authorization.insufficientPrivileges` - User lacks required permissions
- `errors.authorization.discountPrivilegesRequired` - Discount privileges required

---

**End of Report**
