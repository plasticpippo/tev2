# Test A4.5: Payment with Invalid User Reference - Security Assessment Report

**Test Date:** 2026-03-30
**Test Type:** Security Testing - User Validation in Payment Processing
**Severity:** HIGH

## Executive Summary

A critical vulnerability was identified in the payment processing endpoint. The backend **does NOT validate** that the `userId` in the payment request body matches the authenticated user from the JWT token. This allows an authenticated attacker to create transactions attributed to any existing user, enabling **user impersonation** and **audit trail manipulation**.

## Test Execution Details

### Test Environment
- **Application URL:** http://192.168.1.70
- **Test User:** admin (userId: 2, role: Admin)
- **Target Endpoint:** `/api/transactions/process-payment`

### Authentication Mechanism Analysis

The application uses JWT-based authentication:

1. **Token Storage:** `localStorage` keys: `authToken`, `currentUser`
2. **Token Structure:**
   ```json
   {
     "id": 2,
     "username": "admin",
     "role": "Admin",
     "iat": 1774821211,
     "exp": 1774907611
   }
   ```
3. **Header Algorithm:** HS256

### User Reference Determination

The user reference in payment requests is determined by:

| Source | Location | Control |
|--------|----------|---------|
| JWT Token | `Authorization: Bearer <token>` | Server-side, secure |
| Request Body | `userId` and `userName` fields | Client-side, **vulnerable** |

**Critical Finding:** The payment endpoint accepts `userId` and `userName` from the request body without validating against the JWT token's user ID.

## Test Results

### Test 1: Payment with Non-Existent User ID (99999)

**Request:**
```json
{
  "userId": 99999,
  "userName": "Fake User",
  ...
}
```

**Result:** HTTP 500 - Internal Server Error
**Error:** `Foreign key constraint violated: transactions_userId_fkey (index)`

**Analysis:** The database foreign key constraint prevented creation of a transaction with a non-existent user. However, this is a database-level constraint, not application-level validation.

### Test 2: Payment with Different Valid User ID (User Impersonation)

**Request:**
```json
{
  "userId": 1,
  "userName": "Impersonated User",
  ...
}
```

**Authenticated User:** admin (userId: 2)

**Result:** HTTP 201 - Created Successfully

**Response:**
```json
{
  "id": 472,
  "userId": 1,
  "userName": "Impersonated User",
  "status": "completed",
  ...
}
```

**Analysis:** The payment was successfully created with a different user ID than the authenticated user. The transaction is now attributed to user ID 1 instead of the actual authenticated user (ID 2).

## Security Impact

### Vulnerabilities Identified

1. **User Impersonation (High Severity)**
   - An authenticated user can create transactions attributed to any other user
   - This affects financial records and audit trails

2. **Audit Trail Manipulation (High Severity)**
   - Transaction records show the wrong user
   - Accountability is compromised
   - Fraud investigations would be misled

3. **Missing Authorization Check (Medium Severity)**
   - The backend does not verify that `req.body.userId === req.user.id`
   - Trust is placed in client-provided data

### Attack Scenario

1. Malicious employee authenticates as themselves
2. Processes payments but attributes them to other users
3. Fraudulent transactions appear in other users' records
4. Actual perpetrator cannot be traced

## Code Analysis

### Backend Code (transactions.ts:62-77)

```typescript
const {
  items, subtotal, tax, tip, paymentMethod,
  userId,    // <-- Taken from request body, NOT validated
  userName,  // <-- Taken from request body, NOT validated
  tillId, tillName, discount, discountReason,
  activeTabId, tableId, tableName
} = paymentData;
```

The `userId` is extracted directly from `req.body` without any validation against `req.user.id`.

### Authentication Middleware (auth.ts)

The middleware correctly extracts the user from the JWT:
```typescript
req.user = {
  id: payload.id as number,
  username: payload.username as string,
  role: payload.role as string
};
```

However, the payment endpoint ignores this authenticated user information.

## Recommendations

### Immediate Fix Required

1. **Validate User ID in Payment Endpoint:**
   ```typescript
   // In process-payment handler
   const authenticatedUserId = req.user.id;
   if (paymentData.userId !== authenticatedUserId) {
     return res.status(403).json({ 
       error: 'Cannot process payment for different user' 
     });
   }
   ```

2. **Remove User Fields from Request Body:**
   - The frontend should NOT send `userId` and `userName`
   - The backend should use `req.user.id` and lookup the username

3. **Apply to All Endpoints:**
   - Review all endpoints that accept user identifiers
   - Ensure they validate against the authenticated user

### Recommended Code Change

```typescript
// BEFORE (vulnerable)
const { userId, userName, ... } = paymentData;
const transaction = await tx.transaction.create({
  data: { userId, userName, ... }
});

// AFTER (secure)
const authenticatedUserId = req.user.id;
const user = await tx.user.findUnique({ 
  where: { id: authenticatedUserId } 
});
const transaction = await tx.transaction.create({
  data: { 
    userId: authenticatedUserId, 
    userName: user.name,
    ... 
  }
});
```

## Related Files

- Backend Handler: `/backend/src/handlers/transactions.ts`
- Auth Middleware: `/backend/src/middleware/auth.ts`
- Frontend Service: `/frontend/services/transactionService.ts`

## Conclusion

This is a **HIGH severity vulnerability** that allows any authenticated user to impersonate other users in payment transactions. The fix is straightforward: validate that the userId in the request matches the authenticated user's ID from the JWT token, or better yet, derive the userId exclusively from the authenticated session.

---

**Test Conducted By:** Security Testing Framework
**Report Generated:** 2026-03-30
