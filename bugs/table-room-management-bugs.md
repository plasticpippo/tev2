# Table and Room Management Bugs - Test Report

**Test Date:** 2026-02-01  
**Tested By:** Playwright MCP Automated Testing  
**App URL:** http://192.168.1.241:3000  
**Login Credentials:** admin / admin123

---

## Executive Summary

Table and Room management features are **completely non-functional** due to authentication token not being sent with API requests. All `/api/rooms` and `/api/tables` endpoints return 401 Unauthorized errors, preventing any CRUD operations on rooms or tables.

---

## Critical Bug: Authentication Token Not Sent for Rooms/Tables APIs

### Issue Description
All API requests to `/api/rooms` and `/api/tables` endpoints fail with 401 Unauthorized errors, while other API endpoints work correctly. The error message "Access denied. No token provided" indicates that the authentication token is not being included in these specific API requests.

### Affected Endpoints
- `GET /api/rooms` - 401 Unauthorized
- `GET /api/tables` - 401 Unauthorized
- `POST /api/rooms` - 401 Unauthorized (room creation)
- `GET /api/layouts/till/1/category/-1` - 401 Unauthorized

### Working Endpoints (for comparison)
- `GET /api/products` - 200 OK
- `GET /api/categories` - 200 OK
- `GET /api/users` - 200 OK
- `GET /api/tills` - 200 OK
- `GET /api/settings` - 200 OK
- `GET /api/transactions` - 200 OK
- `GET /api/tabs` - 200 OK
- `GET /api/stock-items` - 200 OK
- `GET /api/stock-adjustments` - 200 OK
- `GET /api/order-activity-logs` - 200 OK

### Console Errors
```
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) @ http://192.168.1.241:3001/api/rooms
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) @ http://192.168.1.241:3001/api/tables
[ERROR] Error making request to http://192.168.1.241:3001/api/rooms: Error: Access denied. No token provided.
[ERROR] Error fetching rooms: Error: Access denied. No token provided.
[ERROR] Error making request to http://192.168.1.241:3001/api/tables: Error: Access denied. No token provided.
[ERROR] Error fetching tables: Error: Access denied. No token provided.
[ERROR] Error saving room: Error: Access denied. No token provided.
[ERROR] Error adding room: Error: Access denied. No token provided.
```

### Network Request Failures
```
[GET] http://192.168.1.241:3001/api/rooms => [401] Unauthorized (multiple calls)
[GET] http://192.168.1.241:3001/api/tables => [401] Unauthorized (multiple calls)
[POST] http://192.168.1.241:3001/api/rooms => [401] Unauthorized (room creation attempt)
[GET] http://192.168.1.241:3001/api/layouts/till/1/category/-1 => [401] Unauthorized
```

---

## UI Functionality Issues

### 1. Room Management Tab

**Status:** Non-functional

**Issues Found:**
- Room list displays "No rooms added yet" even though rooms might exist in the database
- Room dropdown is empty (shows only "Select a room" option)
- Cannot create new rooms - Save button triggers API call that fails with 401
- Error message displayed in modal: "Failed to save room: Access denied. No token provided."

**Test Steps:**
1. Navigate to Admin Panel > Tables & Layout > Rooms
2. Click "Add Room +" button
3. Fill in Room Name: "Test Room", Description: "A test room"
4. Click Save
5. **Result:** Error toast appears: "Access denied. No token provided."

### 2. Table Management Tab

**Status:** Non-functional

**Issues Found:**
- Table list displays "No tables added yet"
- Room dropdown in "Add Table" modal is empty (only shows "Select a room")
- Cannot create tables because Room field is required but no rooms are available
- Form validation blocks submission due to missing room selection

**Test Steps:**
1. Navigate to Admin Panel > Tables & Layout > Tables
2. Click "Add Table +" button
3. Fill in Table Name: "Table 1"
4. Attempt to select Room - **Result:** No rooms available in dropdown
5. Click Save - **Result:** Form validation prevents submission (required field missing)

### 3. Layout Editor Tab

**Status:** Non-functional

**Issues Found:**
- Room dropdown is empty (shows only "Select a room")
- Canvas area displays "Select a Room" and "Create a room first if none exist"
- Cannot use Edit Mode or Drag Mode because no room is selected
- Layout features are inaccessible due to dependency on rooms API

**Test Steps:**
1. Navigate to Admin Panel > Tables & Layout > Layout
2. Attempt to select room from dropdown - **Result:** No rooms available
3. Switch to "Edit Mode" - **Result:** Still shows "Select a Room" message
4. Cannot add tables to layout because no room context exists

---

## Error Messages Shown to Users

### Toast Notifications
- "Access denied. No token provided." (appears multiple times)

### Modal Error Messages
- "Failed to save room: Access denied. No token provided."

### Inline Messages
- "No rooms added yet"
- "Create your first room to organize tables by physical areas in your venue"
- "No tables added yet"
- "Add your first table to organize seating arrangements."
- "Select a room to view its layout"
- "Create a room first if none exist"

---

## Root Cause Analysis

The root cause is that the frontend API client for rooms and tables endpoints is not including the authentication token in request headers. This is evident because:

1. Other API endpoints receive the token and work correctly (200 OK)
2. Only `/api/rooms`, `/api/tables`, and `/api/layouts` endpoints are affected
3. The error message "No token provided" comes from the backend auth middleware

**Likely Location of Bug:**
- Frontend API service layer for rooms/tables (possibly `frontend/services/tableService.ts` or similar)
- The API client configuration for these specific endpoints may be missing the auth header interceptor

---

## Impact Assessment

**Severity:** CRITICAL

- Table management is completely non-functional
- Room management is completely non-functional
- Layout editor is non-functional
- Users cannot create, view, edit, or delete rooms
- Users cannot create, view, edit, or delete tables
- POS table assignment features likely broken (dependent on these APIs)

---

## Recommendations

### Immediate Fix Required
1. **Fix Authentication Header:** Ensure the API client for `/api/rooms` and `/api/tables` endpoints includes the JWT token in the Authorization header
2. **Verify API Client Configuration:** Check if rooms/tables services use a different API client instance that lacks the auth interceptor
3. **Test Token Persistence:** Verify that the auth token is properly stored and retrieved from localStorage/sessionStorage

### Code Review Suggestions
1. Review `frontend/services/tableService.ts` for proper auth header configuration
2. Compare working services (products, categories) with non-working services (rooms, tables)
3. Check for inconsistent API client instantiation

### Testing Verification
After fix, verify:
- [ ] Can view existing rooms
- [ ] Can create new rooms
- [ ] Can edit existing rooms
- [ ] Can delete rooms
- [ ] Can view existing tables
- [ ] Can create new tables
- [ ] Can edit existing tables
- [ ] Can delete tables
- [ ] Room dropdown populates correctly in all tabs
- [ ] Layout editor shows rooms and allows table placement

---

## Test Environment Details

- **Browser:** Chromium (Playwright)
- **OS:** Linux 6.12
- **Backend:** Port 3001
- **Frontend:** Port 3000
- **Database:** PostgreSQL on port 5432

---

## Attachments

- Console logs captured showing 401 errors
- Network request logs showing failed API calls
- UI screenshots (if available)
