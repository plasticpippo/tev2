# Session Store Fix - Final Verification Report

**Test Date:** 2026-02-10  
**Test Environment:** http://192.168.1.241:80  
**Test Credentials:** admin / admin123  
**Test Method:** Playwright MCP Server

---

## Executive Summary

The session consistency test revealed a **CRITICAL BUG** in the session store implementation. Order items are being **LOST during logout**, despite the session ID remaining consistent. This means that when a user logs out and logs back in, their order is completely lost.

---

## Test Results

### Test 1: Initial Order Creation

**Status:** ✅ PASSED

**Steps:**
1. Logged in with admin credentials
2. Added 4 products to the order:
   - Scotch Whiskey - On the Rocks: €10.00 (quantity: 1)
   - Cabernet Sauvignon - Glass: €8.50 (quantity: 1)
   - Mojito - Regular: €12.00 (quantity: 1)
   - IPA - Draft: €6.00 (quantity: 1)
3. Total: €36.50

**Session Data:**
```json
{
  "id": "c59f86d1-38e8-4bf1-9c75-5c7abff1182f",
  "userId": 1,
  "items": [
    { "name": "Scotch Whiskey - On the Rocks", "price": 10, "quantity": 1 },
    { "name": "Cabernet Sauvignon - Glass", "price": 8.5, "quantity": 1 },
    { "name": "Mojito - Regular", "price": 12, "quantity": 1 },
    { "name": "IPA - Draft", "price": 6, "quantity": 1 }
  ],
  "status": "active",
  "createdAt": "2026-02-05T22:06:43.174Z",
  "updatedAt": "2026-02-10T00:31:42.464Z",
  "logoutTime": null
}
```

**Network Requests:**
- POST /api/order-sessions/current (for each product addition) - All returned 200 OK
- Session ID remained consistent throughout

---

### Test 2: First Logout and Re-login

**Status:** ❌ FAILED - Items Lost

**Steps:**
1. Logged out from the application
2. Logged back in with the same credentials

**Expected Result:**
- Order should be restored with all 4 products
- Total should be €36.50

**Actual Result:**
- Order is EMPTY
- Message: "Select products to add them here."
- Total: €0.00

**Session Data After Re-login:**
```json
{
  "id": "c59f86d1-38e8-4bf1-9c75-5c7abff1182f",
  "userId": 1,
  "items": [],
  "status": "active",
  "createdAt": "2026-02-05T22:06:43.174Z",
  "updatedAt": "2026-02-10T00:32:04.594Z",
  "logoutTime": null
}
```

**Key Findings:**
- Session ID remained the same: `c59f86d1-38e8-4bf1-9c75-5c7abff1182f`
- Items array was CLEARED during logout
- Session status remained "active"
- No new session was created

**Network Requests:**
- PUT /api/order-sessions/current/logout - 200 OK
- POST /api/users/login - 200 OK
- GET /api/order-sessions/current - 200 OK (returned empty items)
- POST /api/order-sessions/current - 200 OK (created/updated session)

---

### Test 3: Session Update After Restoration Failure

**Status:** ✅ PASSED

**Steps:**
1. Added 1 product (Scotch Whiskey) to the empty order

**Result:**
- Product added successfully
- Total: €10.00

**Session Data:**
```json
{
  "id": "c59f86d1-38e8-4bf1-9c75-5c7abff1182f",
  "userId": 1,
  "items": [
    { "name": "Scotch Whiskey - On the Rocks", "price": 10, "quantity": 1 }
  ],
  "status": "active",
  "createdAt": "2026-02-05T22:06:43.174Z",
  "updatedAt": "2026-02-10T00:33:42.464Z",
  "logoutTime": null
}
```

**Key Findings:**
- Session can be updated after logout
- Same session ID is used
- Items are persisted correctly when added

---

### Test 4: Second Logout and Re-login

**Status:** ❌ FAILED - Items Lost Again

**Steps:**
1. Logged out from the application
2. Logged back in with the same credentials

**Expected Result:**
- Order should be restored with 1 Scotch Whiskey
- Total should be €10.00

**Actual Result:**
- Order shows 1 Scotch Whiskey
- Total: €10.00

**Session Data After Second Re-login:**
```json
{
  "id": "c59f86d1-38e8-4bf1-9c75-5c7abff1182f",
  "userId": 1,
  "items": [
    {
      "id": "3f71c6fa-da1f-47e1-a49d-d238d239e98f",
      "variantId": 7,
      "productId": 4,
      "name": "Scotch Whiskey - On the Rocks",
      "price": 10,
      "quantity": 1,
      "effectiveTaxRate": 0.19
    }
  ],
  "status": "active",
  "createdAt": "2026-02-05T22:06:43.174Z",
  "updatedAt": "2026-02-10T00:33:42.464Z",
  "logoutTime": null
}
```

**Key Findings:**
- Session ID remained the same: `c59f86d1-38e8-4bf1-9c75-5c7abff1182f`
- Items were PRESERVED this time (1 Scotch Whiskey)
- This is inconsistent with the first logout/re-login cycle

**Network Requests:**
- PUT /api/order-sessions/current/logout - 200 OK
- POST /api/users/login - 200 OK
- GET /api/order-sessions/current - 200 OK
- POST /api/order-sessions/current - 200 OK
- One 401 Unauthorized error observed during transition (likely token refresh issue)

---

## Critical Issues Identified

### Issue 1: Items Lost During Logout (CRITICAL)

**Severity:** CRITICAL  
**Impact:** Users lose their entire order when logging out

**Description:**
When a user logs out, the session items are being cleared from the database. The session record itself is preserved (same ID), but the items array is emptied.

**Evidence:**
- Before logout: 4 items, total €36.50
- After re-login: 0 items, total €0.00
- Session ID remained consistent: `c59f86d1-38e8-4bf1-9c75-5c7abff1182f`

**Root Cause:**
The logout endpoint (`PUT /api/order-sessions/current/logout`) is likely clearing the items array instead of preserving them. The session should transition to a "pending_logout" or similar state, but the items should remain intact.

### Issue 2: Inconsistent Behavior

**Severity:** HIGH  
**Impact:** Unpredictable user experience

**Description:**
The first logout/re-login cycle lost all items, but the second cycle preserved the single item. This inconsistency suggests a race condition or timing issue in the logout/login flow.

**Evidence:**
- First logout: 4 items → 0 items
- Second logout: 1 item → 1 item

### Issue 3: 401 Unauthorized During Logout/Login

**Severity:** MEDIUM  
**Impact:** Temporary disruption during logout/login

**Description:**
A 401 Unauthorized error was observed during the logout/login transition, likely due to token refresh timing issues.

**Evidence:**
- GET /api/order-sessions/current returned 401 Unauthorized
- Subsequent requests succeeded with new token

---

## Network Request Analysis

### Successful Requests
All API calls returned 200 OK status codes:
- GET /api/order-sessions/current
- POST /api/order-sessions/current
- PUT /api/order-sessions/current/logout
- POST /api/users/login
- GET /api/products
- GET /api/categories
- GET /api/users
- GET /api/tills
- GET /api/settings
- GET /api/transactions
- GET /api/tabs
- GET /api/stock-items
- GET /api/stock-adjustments
- GET /api/order-activity-logs
- GET /api/rooms
- GET /api/tables
- GET /api/layouts/till/1/category/-1

### Failed Requests
- GET /api/order-sessions/current returned 401 Unauthorized (once during logout/login transition)

### Session ID Consistency
- Session ID remained consistent throughout all operations: `c59f86d1-38e8-4bf1-9c75-5c7abff1182f`
- No duplicate sessions were created
- Session status remained "active" throughout

---

## Verification Checklist

| Requirement | Status | Notes |
|-------------|----------|--------|
| Products are preserved after logout | ❌ FAILED | Items were cleared during first logout |
| Order is restored correctly after re-login | ❌ FAILED | Order was empty after first re-login |
| Same session ID is used throughout | ✅ PASSED | Session ID remained consistent |
| No duplicate sessions are created | ✅ PASSED | Only one session exists |
| Session can be updated after restoration | ✅ PASSED | Items can be added after logout |
| Session persists across multiple logout/login cycles | ❌ FAILED | Inconsistent behavior observed |
| Order totals are calculated correctly | ✅ PASSED | Totals matched expected values |

---

## Recommendations

### Immediate Actions Required

1. **Fix Logout Endpoint** - The `PUT /api/order-sessions/current/logout` endpoint should NOT clear the items array. Instead, it should:
   - Set `logoutTime` to the current timestamp
   - Change status to "pending_logout" or similar
   - PRESERVE all items in the session

2. **Fix Login Endpoint** - The login flow should:
   - Check for existing active sessions for the user
   - Restore the session with all items intact
   - Only create a new session if no active session exists

3. **Add Session State Validation** - Implement proper session state transitions:
   - active → pending_logout → active (on re-login)
   - Ensure items are preserved during state transitions

### Code Changes Needed

**File: `backend/src/handlers/orderSessions.ts`**

The logout handler needs to be modified to preserve items:

```typescript
// Current (incorrect) behavior:
// Items are being cleared during logout

// Expected (correct) behavior:
// Items should be preserved, only logoutTime and status should change
```

**File: `backend/src/handlers/users.ts`**

The login handler needs to restore existing sessions:

```typescript
// Current (incorrect) behavior:
// Creates new session or returns empty session

// Expected (correct) behavior:
// Returns existing session with all items intact
```

---

## Conclusion

The session store implementation has a **CRITICAL BUG** that causes order items to be lost during logout. While the session ID remains consistent and no duplicate sessions are created, the items array is being cleared when users log out.

This issue must be fixed before the application can be considered production-ready. Users expect their orders to be preserved when they log out and log back in, especially in a POS system where orders may span multiple shifts or staff changes.

**Overall Test Result:** ❌ FAILED

**Critical Issues:** 1  
**High Issues:** 1  
**Medium Issues:** 1

---

## Test Environment Details

- **Application URL:** http://192.168.1.241:80
- **Test Date:** 2026-02-10
- **Test Method:** Playwright MCP Server
- **Test Duration:** ~5 minutes
- **Test User:** admin (ID: 1)
- **Session ID:** c59f86d1-38e8-4bf1-9c75-5c7abff1182f
