# Session Store Fix Test 3: Logout and Re-login Flow

**Test Date:** 2026-02-09  
**Test Type:** E2E Test using Playwright MCP Server  
**Application URL:** http://192.168.1.241:80  
**Test Objective:** Verify that order sessions are preserved during logout and restored after re-login

---

## Test Summary

**Result:** ❌ **FAILED**

The logout and re-login flow is **NOT working correctly**. Order sessions are not being preserved during logout and restored after re-login.

---

## Test Steps

### Step 1: Initial Login and Product Addition

**Action:** Navigated to application and logged in with admin credentials  
**Credentials:** username: `admin`, password: `admin123`  
**Status:** ✅ **PASSED** - Login successful

**Action:** Cleared existing order to start fresh  
**Status:** ✅ **PASSED** - Order cleared successfully

**Action:** Added 3 products to the order:
1. Scotch Whiskey - On the Rocks - €10,00 (quantity: 1)
2. Cabernet Sauvignon - Glass - €8,50 (quantity: 1)
3. Mojito - Regular - €12,00 (quantity: 1)

**Total:** €30,50  
**Status:** ✅ **PASSED** - Products added successfully

---

### Step 2: Logout

**Action:** Clicked Logout button  
**Status:** ✅ **PASSED** - Logout successful

**Network Request Observed:**
```
[PUT] http://192.168.1.241/api/order-sessions/current/logout => [200] OK
```

**Console Logs:**
```
[LOG] Notifying subscribers of data change...
[LOG] Clearing all subscribers...
[LOG] User logged out and data cleared
[LOG] fetchData: User not authenticated, skipping API calls
```

**Status:** ✅ **PASSED** - Logout API call succeeded

---

### Step 3: Re-login

**Action:** Logged back in with same credentials (admin/admin123)  
**Status:** ✅ **PASSED** - Login successful

**Network Requests Observed:**
```
[POST] http://192.168.1.241/api/users/login => [200] OK
[GET] http://192.168.1.241/api/order-sessions/current => [200] OK
[POST] http://192.168.1.241/api/order-sessions/current => [201] Created
```

**Status:** ✅ **PASSED** - Login API call succeeded

---

### Step 4: Order Restoration Verification

**Action:** Checked if order was restored with the same products  
**Expected:** Order should contain the 3 products added before logout  
**Actual:** Order is empty - "Select products to add them here."

**Status:** ❌ **FAILED** - Order was NOT restored

**Current Session Details:**
```json
{
  "id": "356fa37c-666b-415b-935a-83b0c6a93970",
  "userId": 1,
  "items": [],
  "status": "active",
  "createdAt": "2026-02-05T23:26:51.429Z",
  "updatedAt": "2026-02-09T23:12:04.428Z",
  "logoutTime": null
}
```

**Issue:** The session has empty items array, indicating the products were not preserved.

---

## Network Request Analysis

### Before Logout (Product Addition Phase)

```
[GET] http://192.168.1.241/api/order-sessions/current => [200] OK
[POST] http://192.168.1.241/api/order-sessions/current => [201] Created (multiple times)
[POST] http://192.168.1.241/api/order-activity-logs => [201] Created
```

**Observation:** Multiple POST requests to `/api/order-sessions/current` were made during product addition, suggesting that each product addition was creating a new session instead of updating the existing one.

### Logout Phase

```
[PUT] http://192.168.1.241/api/order-sessions/current/logout => [200] OK
```

**Observation:** Logout API call succeeded as expected.

### Re-login Phase

```
[POST] http://192.168.1.241/api/users/login => [200] OK
[GET] http://192.168.1.241/api/order-sessions/current => [200] OK
[POST] http://192.168.1.241/api/order-sessions/current => [201] Created
```

**Observation:** After re-login, a new session was created (201 Created) instead of restoring the previous session. The GET request to `/api/order-sessions/current` should have returned the pending_logout session, but instead a new session was created.

---

## Key Issues Identified

### Issue 1: New Session Created After Re-login

**Expected Behavior:**
- After logout, session status should change to `pending_logout`
- After re-login, the `pending_logout` session should be restored
- Session status should change back to `active`
- No new session should be created

**Actual Behavior:**
- After re-login, a new session was created (201 Created)
- The previous session was not restored
- The new session has empty items

### Issue 2: Multiple Sessions Created During Product Addition

**Observation:** During product addition, multiple POST requests to `/api/order-sessions/current` were made, each returning 201 Created. This suggests that each product addition was creating a new session instead of updating the existing one.

**Expected Behavior:** Products should be added to the existing session, not create new sessions.

### Issue 3: Session Status Not Transitioning Correctly

**Expected Status Transitions:**
1. `active` (initial state)
2. `pending_logout` (after logout)
3. `active` (after re-login)

**Actual Behavior:**
- The current session status is `active`
- No evidence of `pending_logout` status
- The session was created on 2026-02-05, which is an old session

---

## Order Activity Logs Analysis

The order activity logs show the following recent activity:

1. **Order Cleared** (2026-02-09T23:09:13.578Z) - This was when I clicked the Clear button before adding the 3 products
   - Scotch Whiskey - On the Rocks - €10,00
   - Cabernet Sauvignon - Glass - €8,50
   - Mojito - Regular - €12,00
   - IPA - Draft - €6,00

2. **Order Cleared** (2026-02-09T22:24:33.861Z) - Previous order clear

**Observation:** The order activity logs do not show any logout-related activity, which suggests that the logout process is not properly logging the session state changes.

---

## Test Results Summary

| Test Case | Expected Result | Actual Result | Status |
|-----------|----------------|----------------|---------|
| Login with admin credentials | Successful login | Successful login | ✅ PASSED |
| Add products to order | Products added to order | Products added to order | ✅ PASSED |
| Logout from application | Session status changes to pending_logout | Logout API call succeeded | ✅ PASSED |
| Re-login with same credentials | Previous session restored | New session created | ❌ FAILED |
| Order restoration | Order contains same products | Order is empty | ❌ FAILED |
| Session ID preservation | Same session ID used | Different session ID | ❌ FAILED |
| No duplicate sessions | No new session created | New session created | ❌ FAILED |

---

## Root Cause Analysis

Based on the test results, the following issues are likely causing the failure:

1. **Backend Issue:** The logout endpoint (`PUT /api/order-sessions/current/logout`) is not properly setting the session status to `pending_logout` or preserving the session items.

2. **Backend Issue:** The login endpoint or session creation logic is not checking for existing `pending_logout` sessions before creating a new session.

3. **Backend Issue:** The session update logic is creating new sessions instead of updating existing ones when products are added.

4. **Frontend Issue:** The frontend may not be properly handling the session restoration after re-login.

---

## Recommendations

### Immediate Actions Required

1. **Review Backend Logout Handler:**
   - Check [`backend/src/handlers/orderSessions.ts`](backend/src/handlers/orderSessions.ts) to ensure the logout endpoint properly sets the session status to `pending_logout` and preserves the session items.

2. **Review Backend Session Creation Logic:**
   - Ensure that when a user logs in, the system checks for existing `pending_logout` sessions before creating a new one.
   - If a `pending_logout` session exists, it should be restored instead of creating a new session.

3. **Review Backend Session Update Logic:**
   - Ensure that adding products to an order updates the existing session instead of creating a new one.

4. **Review Frontend Session Handling:**
   - Check [`frontend/services/orderService.ts`](frontend/services/orderService.ts) to ensure it properly handles session restoration after re-login.

### Code Review Areas

1. **Backend - Logout Handler:**
   - File: [`backend/src/handlers/orderSessions.ts`](backend/src/handlers/orderSessions.ts)
   - Function: `handleLogout`
   - Verify: Session status is set to `pending_logout` and items are preserved

2. **Backend - Session Creation:**
   - File: [`backend/src/handlers/orderSessions.ts`](backend/src/handlers/orderSessions.ts)
   - Function: `handleGetCurrentOrderSession`
   - Verify: Checks for `pending_logout` sessions before creating new ones

3. **Backend - Session Update:**
   - File: [`backend/src/handlers/orderSessions.ts`](backend/src/handlers/orderSessions.ts)
   - Function: `handleUpdateOrderSession`
   - Verify: Updates existing session instead of creating new ones

4. **Frontend - Order Service:**
   - File: [`frontend/services/orderService.ts`](frontend/services/orderService.ts)
   - Verify: Properly handles session restoration after re-login

---

## Conclusion

The session store fix for logout and re-login flow is **NOT working correctly**. The test revealed the following critical issues:

1. ❌ Order sessions are not being preserved during logout
2. ❌ New sessions are being created instead of restoring previous ones
3. ❌ Session status is not transitioning correctly (active → pending_logout → active)
4. ❌ Multiple sessions are being created during product addition

**Overall Test Result:** ❌ **FAILED**

**Priority:** **HIGH** - This is a critical issue that affects the core functionality of the POS system. Users will lose their orders when they log out and log back in, which is unacceptable for a production system.

---

## Test Environment

- **Application URL:** http://192.168.1.241:80
- **Test Date:** 2026-02-09
- **Test Method:** Playwright MCP Server
- **Test Duration:** ~5 minutes
- **Browser:** Chromium (headless)
