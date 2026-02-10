# Order Sessions Test 4: Session Persistence Across Logout/Login

## Test Objective
Verify that order sessions persist across logout/login cycles, specifically testing the fix that restores 'pending_logout' sessions back to 'active' when users log back in.

## Test Environment
- **Application URL**: http://192.168.1.241:80
- **Admin Credentials**: username=admin, password=admin123
- **Test Date**: 2026-02-09
- **Test Method**: Playwright MCP Server

## Test Steps

### Step 1: Navigate to Application
- **Action**: Navigate to http://192.168.1.241:80
- **Result**: ✅ Successfully navigated to the application
- **Observation**: User was already logged in as "Admin User" (likely from previous session)

### Step 2: Verify Login Status
- **Action**: Take snapshot to verify login status
- **Result**: ✅ User is logged in as "Admin User"
- **Observation**: Current Order section shows "Select products to add them here."

### Step 3: Add Product to Order
- **Action**: Click on "Scotch Whiskey - On the Rocks" product
- **Result**: ✅ Product successfully added to order
- **Observation**: 
  - Product: "Scotch Whiskey - On the Rocks"
  - Quantity: 1
  - Price: €10,00
  - Subtotal: €10,00

### Step 4: Verify Product in Order
- **Action**: Take snapshot to verify product was added
- **Result**: ✅ Product is visible in Current Order section
- **Observation**: Order items are displayed correctly with quantity controls

### Step 5: Logout from Application
- **Action**: Click Logout button
- **Result**: ✅ Successfully logged out
- **Observation**: 
  - Console shows: "User logged out and data cleared"
  - Console shows: "User not authenticated, skipping API calls"
  - Login form is displayed

### Step 6: Verify Logout
- **Action**: Take snapshot to verify logout was successful
- **Result**: ✅ Login form is displayed
- **Observation**: Username and Password fields are visible

### Step 7: Login Again
- **Action**: Fill in login form with admin credentials and submit
- **Result**: ✅ Successfully logged in
- **Observation**: User is logged in as "Admin User"

### Step 8: Verify Login
- **Action**: Take snapshot to verify successful login
- **Result**: ✅ User is logged in
- **Observation**: Current Order section shows "Select products to add them here."

### Step 9: Verify Order Session Restoration
- **Action**: Check if order session was restored with the product from Step 3
- **Result**: ❌ **FAILED** - Order session was NOT restored
- **Observation**: 
  - Current Order section is empty
  - Shows "Select products to add them here."
  - The "Scotch Whiskey - On the Rocks" product is NOT present

### Step 10: Check Browser Console
- **Action**: Check browser console for errors
- **Result**: ✅ No errors in console
- **Observation**: 
  - Console shows: "Notifying subscribers of data change..."
  - Console shows: "Clearing all subscribers..."
  - Console shows: "User logged out and data cleared"
  - Console shows: "User not authenticated, skipping API calls"
  - No error messages

### Step 11: Verify Order Items Display
- **Action**: Verify that order items are displayed correctly
- **Result**: ❌ **FAILED** - No order items are displayed
- **Observation**: Current Order section is empty

## Network Request Analysis

### Key Network Requests

1. **Initial Load (Before Product Addition)**
   - GET /api/order-sessions/current → 200 OK
   - POST /api/order-sessions/current → 201 Created (new session)

2. **After Product Addition**
   - POST /api/order-sessions/current → 201 Created (new session with product)

3. **Logout**
   - PUT /api/order-sessions/current/logout → 200 OK (session marked as pending_logout)

4. **Login**
   - POST /api/users/login → 200 OK
   - GET /api/order-sessions/current → 200 OK (should restore session)
   - POST /api/order-sessions/current → 201 Created (creates NEW session)

### Issue Identified

The critical issue is in the login flow:

1. **GET /api/order-sessions/current** returns 200 OK (should have restored the pending_logout session)
2. **POST /api/order-sessions/current** returns 201 Created (creates a NEW session instead of updating the restored one)

This indicates that:
- The GET request is NOT actually restoring the session to 'active' status, OR
- The POST request is being made before the GET request completes, OR
- The POST request is creating a new session because it doesn't find an active session

## Root Cause Analysis

### Backend Code Review

The backend code in [`backend/src/handlers/orderSessions.ts`](backend/src/handlers/orderSessions.ts) appears correct:

1. **GET /current endpoint (lines 10-68)**:
   - First searches for 'active' sessions
   - If no active session, searches for 'pending_logout' sessions
   - If a pending_logout session is found, it updates the status to 'active'
   - Returns the session with parsed items

2. **POST /current endpoint (lines 70-119)**:
   - Checks if user has an active session
   - If active session exists, updates it
   - If no active session, creates a new one

### Frontend Code Review

The frontend code in [`frontend/contexts/OrderContext.tsx`](frontend/contexts/OrderContext.tsx) has a potential issue:

1. **loadOrderSession useEffect (lines 34-62)**:
   - Fetches the order session when user logs in
   - Sets orderItems from the session

2. **saveOrderSession useEffect (lines 64-93)**:
   - Saves the order session whenever orderItems change
   - This is triggered when orderItems are set from the loaded session
   - This causes a POST request to create/update the session

### The Problem

The issue is a race condition or timing issue:

1. User logs in
2. `loadOrderSession` is called and fetches the session via GET
3. GET request returns the restored session with items
4. `setOrderItems(session.items)` is called
5. This triggers the `saveOrderSession` useEffect
6. POST request is made to save the session
7. POST request creates a NEW session instead of updating the existing one

The fact that the POST request returns 201 Created instead of 200 OK suggests that the POST request is not finding an active session to update, which means either:
- The GET request is not actually restoring the session to 'active' status in the database, OR
- There's a timing issue where the POST request is made before the database update from the GET request completes

## Test Results

| Test Step | Expected Result | Actual Result | Status |
|-----------|----------------|---------------|--------|
| Navigate to application | Application loads | Application loads | ✅ PASS |
| Verify login status | User is logged in | User is logged in | ✅ PASS |
| Add product to order | Product added to order | Product added to order | ✅ PASS |
| Verify product in order | Product visible in order | Product visible in order | ✅ PASS |
| Logout from application | User logged out | User logged out | ✅ PASS |
| Verify logout | Login form displayed | Login form displayed | ✅ PASS |
| Login again | User logged in | User logged in | ✅ PASS |
| Verify login | User is logged in | User is logged in | ✅ PASS |
| **Order session restoration** | **Order session restored with product** | **Order session NOT restored** | ❌ **FAIL** |
| Check browser console | No errors | No errors | ✅ PASS |
| Verify order items display | Order items displayed | No order items displayed | ❌ FAIL |

## Conclusion

**TEST FAILED**: The session persistence fix is NOT working as expected.

The order session was NOT restored after login. The "Scotch Whiskey - On the Rocks" product that was added before logout was NOT present in the order after login.

## Recommendations

1. **Debug the GET /current endpoint**: Add logging to verify that the pending_logout session is being found and updated to 'active' status.

2. **Debug the POST /current endpoint**: Add logging to verify that the active session is being found and updated instead of creating a new one.

3. **Fix the race condition**: The frontend should not trigger a POST request immediately after loading the session. Consider adding a flag to prevent saving during initial load.

4. **Use PUT instead of POST for updates**: Consider using the PUT endpoint for updating existing sessions instead of POST, which is designed for creating new sessions.

5. **Add database query logging**: Verify that the database queries are working correctly and that the session status is being updated properly.

## Next Steps

1. Review backend logs to see if the session restoration is actually happening
2. Add more detailed logging to the order session endpoints
3. Fix the race condition in the frontend OrderContext
4. Re-test the session persistence after fixes are applied
