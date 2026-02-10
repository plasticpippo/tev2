# Order Sessions Test 6: Final Persistence Report

**Test Date:** 2026-02-09  
**Test Type:** Session Persistence After Logout/Login  
**Test Status:** FAILED

## Test Objective

Verify that order sessions persist across logout/login after all fixes have been applied:
- Backend GET /current endpoint to restore pending_logout sessions
- Backend POST /current endpoint to check for pending_logout sessions before creating new ones
- Frontend OrderContext with isInitialLoad flag

## Test Environment

- **Application URL:** http://192.168.1.241:80
- **Admin Credentials:** username=admin, password=admin123
- **Test Product:** Scotch Whiskey - On the Rocks (€10,00)

## Test Steps

### Step 1: Navigate to Application
- **Action:** Navigated to http://192.168.1.241:80
- **Result:** Page loaded successfully, showing "Loading POS..." message
- **Status:** PASSED

### Step 2: Initial Logout (Clear Existing Session)
- **Action:** Clicked Logout button to clear existing session
- **Result:** Successfully logged out, login form displayed
- **Console Logs:**
  - "Clearing all subscribers..."
  - "User logged out and data cleared"
  - "fetchData: User not authenticated, skipping API calls"
- **Status:** PASSED

### Step 3: First Login
- **Action:** Logged in with admin credentials
- **Result:** Successfully logged in as "Admin User"
- **Console Logs:** "Notifying subscribers of data change..."
- **Status:** PASSED

### Step 4: Clear Existing Order
- **Action:** Clicked Clear button to remove existing "Mojito - Regular" order
- **Result:** Order cleared, showing "Select products to add them here."
- **Status:** PASSED

### Step 5: Add Test Product
- **Action:** Clicked on "Scotch Whiskey - On the Rocks" product
- **Result:** Product added to order
  - Product: Scotch Whiskey - On the Rocks
  - Price: €10,00
  - Quantity: 1
  - Subtotal: €10,00
- **Status:** PASSED

### Step 6: Logout
- **Action:** Clicked Logout button
- **Result:** Successfully logged out, login form displayed
- **Console Logs:**
  - "Clearing all subscribers..."
  - "User logged out and data cleared"
  - "fetchData: User not authenticated, skipping API calls"
- **Network Request:** PUT /api/order-sessions/current/logout => [200] OK
- **Status:** PASSED

### Step 7: Second Login
- **Action:** Logged in with admin credentials again
- **Result:** Successfully logged in as "Admin User"
- **Status:** PASSED

### Step 8: Verify Session Restoration
- **Expected Result:** Order should be restored with "Scotch Whiskey - On the Rocks"
- **Actual Result:** Order shows "Mojito - Regular" (€12,00) instead
- **Status:** FAILED

## Network Request Analysis

### First Login Session
```
GET /api/order-sessions/current => [200] OK
POST /api/order-sessions/current => [201] Created
```

### After Adding Scotch Whiskey
```
POST /api/order-sessions/current => [201] Created
```

### Logout
```
PUT /api/order-sessions/current/logout => [200] OK
```

### Second Login Session (CRITICAL ISSUE)
```
GET /api/order-sessions/current => [200] OK
POST /api/order-sessions/current => [201] Created
```

## Issue Analysis

### Problem Identified
After the second login, the following sequence occurs:
1. GET /api/order-sessions/current returns [200] OK (indicating a session exists)
2. POST /api/order-sessions/current creates a NEW session [201] Created

This indicates that:
- The backend GET /current endpoint is returning a session (likely the pending_logout session)
- The frontend is still creating a new session instead of using the restored one
- The OrderContext is not properly handling the response from the GET request

### Root Cause
The frontend OrderContext is not properly checking if a session was returned from the GET request before creating a new one. The isInitialLoad flag was added, but it appears the logic is not working correctly.

## Console Logs Analysis

No errors were found in the console logs. All logs show normal operation:
- "Notifying subscribers of data change..." (multiple times)
- "Clearing all subscribers..."
- "User logged out and data cleared"
- "fetchData: User not authenticated, skipping API calls"

## Test Results Summary

| Test Step | Status | Notes |
|-----------|--------|-------|
| Navigate to Application | PASSED | Page loaded successfully |
| Initial Logout | PASSED | Session cleared successfully |
| First Login | PASSED | Logged in as Admin User |
| Clear Existing Order | PASSED | Order cleared |
| Add Test Product | PASSED | Scotch Whiskey added (€10,00) |
| Logout | PASSED | Session marked as pending_logout |
| Second Login | PASSED | Logged in as Admin User |
| Session Restoration | FAILED | Wrong order restored (Mojito instead of Scotch Whiskey) |
| Console Errors | PASSED | No errors found |
| Network Requests | FAILED | Duplicate session creation detected |

## Conclusion

**TEST FAILED:** The order session persistence is NOT working correctly after logout/login.

### Key Findings:
1. The backend GET /current endpoint returns a session (200 OK)
2. The frontend still creates a new session (201 Created) instead of using the restored one
3. The wrong order is restored (Mojito instead of Scotch Whiskey)
4. No console errors are present, indicating the issue is in the logic flow

### Recommendations:
1. Review the OrderContext initialization logic to ensure it properly handles the response from GET /api/order-sessions/current
2. Verify that the isInitialLoad flag is being used correctly to prevent duplicate session creation
3. Add logging to the OrderContext to trace the session restoration flow
4. Consider adding a check in the frontend to only create a new session if GET /current returns 404

## Next Steps

1. Debug the OrderContext initialization logic
2. Add console logging to trace session restoration
3. Verify the isInitialLoad flag implementation
4. Test again after fixing the frontend logic

---

**Test Completed:** 2026-02-09T22:26:55Z
**Test Duration:** ~10 minutes
**Tester:** Playwright MCP Server
