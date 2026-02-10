# Order Sessions Test 5: Persistence After Race Condition Fix

**Test Date:** 2026-02-09  
**Test Type:** E2E Test with Playwright MCP Server  
**Test Objective:** Verify order sessions persist across logout/login after race condition fix

---

## Test Summary

**Result:** ❌ **FAILED**

The session persistence fix is **NOT working** as expected. Order sessions are not being restored after logout/login, and new sessions are being created instead.

---

## Test Steps

### 1. Navigate to Application
- **URL:** http://192.168.1.241:80
- **Status:** ✅ Success
- **Observation:** Page loaded successfully, user was already logged in as "Admin User"

### 2. Initial Login
- **Status:** ✅ Success (already logged in)
- **User:** Admin User (admin)
- **Observation:** User was already authenticated from previous session

### 3. Add Product to Order
- **Product:** Scotch Whiskey - On the Rocks
- **Price:** €10,00
- **Status:** ✅ Success
- **Observation:** Product successfully added to order with quantity 1
- **Subtotal:** €10,00

### 4. Logout
- **Status:** ✅ Success
- **Observation:** 
  - Logout button clicked successfully
  - Console message: "User logged out and data cleared"
  - Console message: "fetchData: User not authenticated, skipping API calls"
  - Login form displayed

### 5. Login Again
- **Credentials:** username=admin, password=admin123
- **Status:** ✅ Success
- **Observation:** Login successful, user authenticated as "Admin User"

### 6. Verify Session Restoration
- **Expected:** Order should contain "Scotch Whiskey - On the Rocks" (€10,00)
- **Actual:** Order contains "Mojito - Regular" (€12,00)
- **Status:** ❌ **FAILED**
- **Observation:** Session was NOT restored. A different product is displayed.

---

## Network Request Analysis

### Critical Findings

1. **Multiple POST Requests Creating New Sessions:**
   ```
   POST /api/order-sessions/current => [201] Created (Initial session)
   POST /api/order-sessions/current => [201] Created (After product addition)
   POST /api/order-sessions/current => [201] Created (After login - NEW SESSION CREATED)
   POST /api/order-sessions/current => [201] Created (Additional new session)
   ```

2. **Logout Request:**
   ```
   PUT /api/order-sessions/current/logout => [200] OK
   ```
   - Logout was properly handled by the backend

3. **GET Request After Login:**
   ```
   GET /api/order-sessions/current => [200] OK
   ```
   - This should have returned the pending_logout session, but instead a new session was created

### Issue Identified

The backend is creating **new sessions** instead of **restoring pending_logout sessions**. This indicates that the session persistence fix is not working correctly.

---

## Console Messages

No errors were found in the browser console. All messages were normal logging:

```
[LOG] Notifying subscribers of data change...
[LOG] Clearing all subscribers...
[LOG] User logged out and data cleared
[LOG] fetchData: User not authenticated, skipping API calls
[LOG] Notifying subscribers of data change...
```

---

## Root Cause Analysis

### Expected Behavior

1. When user logs out, the order session should be marked as `pending_logout`
2. When user logs back in, the `GET /api/order-sessions/current` endpoint should return the `pending_logout` session
3. The frontend should restore the session with the original order items

### Actual Behavior

1. When user logs out, the session is marked as `pending_logout` (confirmed by PUT request)
2. When user logs back in, the `GET /api/order-sessions/current` endpoint returns a session
3. However, a new session is created via POST request instead of restoring the pending_logout session
4. The frontend displays a different product ("Mojito - Regular") instead of the original product ("Scotch Whiskey - On the Rocks")

### Possible Causes

1. **Backend Issue:** The `GET /api/order-sessions/current` endpoint may not be correctly returning the `pending_logout` session
2. **Frontend Issue:** The OrderContext may be creating a new session instead of using the restored session
3. **Race Condition:** The isInitialLoad flag fix may not be working correctly
4. **Session State:** The session may not be properly saved with the `pending_logout` status

---

## Recommendations

### Immediate Actions

1. **Debug Backend GET /current Endpoint:**
   - Verify that the endpoint correctly queries for `pending_logout` sessions
   - Check if the session is being properly marked as `pending_logout` on logout
   - Add logging to trace the session restoration logic

2. **Debug Frontend OrderContext:**
   - Verify that the isInitialLoad flag is working correctly
   - Check if the frontend is correctly handling the restored session
   - Add logging to trace the session restoration flow

3. **Verify Database State:**
   - Check the order_sessions table to see if sessions are being marked as `pending_logout`
   - Verify that the session with the "Scotch Whiskey - On the Rocks" product exists

### Code Review Areas

1. **Backend:** `backend/src/handlers/orderSessions.ts`
   - Review the GET /current endpoint logic
   - Verify the session restoration logic

2. **Frontend:** `frontend/contexts/OrderContext.tsx`
   - Review the isInitialLoad flag implementation
   - Verify the session restoration logic

3. **Frontend:** `frontend/services/orderService.ts`
   - Review the session creation and restoration logic

---

## Test Environment

- **Application URL:** http://192.168.1.241:80
- **Admin Credentials:** username=admin, password=admin123
- **Test Date:** 2026-02-09
- **Test Tool:** Playwright MCP Server

---

## Conclusion

The session persistence fix is **NOT working** as expected. Order sessions are not being restored after logout/login, and new sessions are being created instead. This is a critical issue that needs to be addressed before the session persistence feature can be considered complete.

**Next Steps:**
1. Debug the backend GET /current endpoint to verify it's returning the pending_logout session
2. Debug the frontend OrderContext to verify it's correctly handling the restored session
3. Verify the database state to ensure sessions are being properly marked as pending_logout
4. Add comprehensive logging to trace the session restoration flow
