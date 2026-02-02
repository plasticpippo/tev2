# Login/Authentication Flow Bug Report

**Test Date:** 2026-02-01  
**Tester:** Playwright MCP Automated Testing  
**App URL:** http://192.168.1.241:3000  
**Test Credentials:** admin / admin123

---

## Executive Summary

The login flow **partially works** but has **critical authentication bugs** affecting specific API endpoints. While the user can successfully log in and access most features, the `/api/rooms` and `/api/tables` endpoints consistently return **401 Unauthorized** errors due to missing authentication tokens in the request headers. Additionally, the application continues making authenticated API calls even after logout, resulting in further 401 errors.

---

## Critical Bugs Found

### 1. CRITICAL: Authentication Token Not Sent to Rooms/Tables API

**Severity:** HIGH  
**Status:** Confirmed

#### Description
After successful login, API calls to `/api/rooms` and `/api/tables` endpoints fail with 401 Unauthorized errors. The error message indicates "Access denied. No token provided," suggesting the authentication token is not being included in the request headers for these specific endpoints.

#### Evidence

**Failed Network Requests:**
```
[GET] http://192.168.1.241:3001/api/rooms => [401] Unauthorized
[GET] http://192.168.1.241:3001/api/tables => [401] Unauthorized
```

**Console Error Messages:**
```
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized)
[ERROR] Error making request to http://192.168.1.241:3001/api/rooms: Error: Access denied. No token provided.
[ERROR] Error fetching rooms: Error: Access denied. No token provided.
[ERROR] Error making request to http://192.168.1.241:3001/api/tables: Error: Access denied. No token provided.
[ERROR] Error fetching tables: Error: Access denied. No token provided.
```

**Stack Trace Location:**
```
at http://192.168.1.241:3000/assets/index-Cm8l3nK5.js:40:60744
at async W0 (http://192.168.1.241:3000/assets/index-Cm8l3nK5.js:40:71653)
at async Promise.all (index 10)
at async http://192.168.1.241:3000/assets/index-Cm8l3nK5.js:40:76230
```

#### Impact
- Users cannot view or manage rooms and tables
- The table assignment functionality is likely broken
- Features dependent on room/table data are inaccessible

#### Root Cause Hypothesis
The authentication token is correctly obtained during login and applied to most API calls (products, categories, users, settings, etc. all work fine). However, the API service functions for rooms and tables may not be properly configured to include the auth token in their request headers, or they may be using a different HTTP client configuration that bypasses the authentication interceptor.

---

### 2. MEDIUM: API Calls Continue After Logout

**Severity:** MEDIUM  
**Status:** Confirmed

#### Description
After clicking the Logout button and successfully calling the logout API endpoint (`PUT /api/order-sessions/current/logout`), the application continues to make periodic API calls to fetch data. Since the user is now logged out, these calls fail with 401 Unauthorized errors.

#### Evidence

**Successful Logout:**
```
[PUT] http://192.168.1.241:3001/api/order-sessions/current/logout => [200] OK
[LOG] User logged out and data cleared
```

**Post-Logout Failed Requests:**
```
[GET] http://192.168.1.241:3001/api/rooms => [401] Unauthorized
[GET] http://192.168.1.241:3001/api/tables => [401] Unauthorized
```

**Console Output After Logout:**
```
[LOG] Notifying subscribers of data change...
[LOG] User logged out and data cleared
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized)
[ERROR] Error making request to http://192.168.1.241:3001/api/rooms: Error: Access denied. No token provided.
```

#### Impact
- Unnecessary network traffic
- Console pollution with error messages
- Potential data consistency issues if any cached data is displayed

#### Root Cause Hypothesis
The data polling/subscription mechanism is not properly cleaned up when the user logs out. The `DataProvider` or similar context continues its refresh cycle even after logout, attempting to fetch data without valid credentials.

---

### 3. LOW: Missing Autocomplete Attribute on Password Field

**Severity:** LOW  
**Status:** Confirmed

#### Description
The browser reports a verbose warning that the password input field should have an autocomplete attribute for better user experience and accessibility.

#### Evidence
```
[VERBOSE] [DOM] Input elements should have autocomplete attributes (suggested: "current-password"): (More info: https://goo.gl/9p2vKq)
```

#### Impact
- Minor UX issue
- Browser password managers may not work optimally
- Accessibility concern

---

### 4. LOW: Duplicate "Favourites" Buttons in UI

**Severity:** LOW  
**Status:** Confirmed

#### Description
The main application interface displays two nearly identical buttons for filtering favorites: "⭐ Favourites" and "Favorites".

#### Evidence
From accessibility snapshot:
```yaml
- button "⭐ Favourites" [ref=e24] [cursor=pointer]
- button "Favorites" [ref=e25] [cursor=pointer]
```

#### Impact
- UI clutter
- Potential confusion for users
- Suggests either a localization issue or redundant code

---

## Successful Operations

The following operations completed successfully:

### Login Flow
- `POST /api/users/login` => [200] OK - Authentication successful
- `GET /api/order-sessions/current?userId=1` => [200] OK
- `POST /api/order-sessions/current` => [201] Created

### Working API Endpoints (with proper auth)
- `GET /api/products` => [200] OK
- `GET /api/categories` => [200] OK
- `GET /api/users` => [200] OK
- `GET /api/tills` => [200] OK
- `GET /api/settings` => [200] OK
- `GET /api/transactions` => [200] OK
- `GET /api/tabs` => [200] OK
- `GET /api/stock-items` => [200] OK
- `GET /api/stock-adjustments` => [200] OK
- `GET /api/order-activity-logs` => [200] OK

### Logout Flow
- `PUT /api/order-sessions/current/logout` => [200] OK - Logout successful

---

## Test Environment

| Component | Value |
|-----------|-------|
| Browser | Chromium (via Playwright) |
| App Server | http://192.168.1.241:3000 |
| API Server | http://192.168.1.241:3001 |
| Test User | admin |
| Test Password | admin123 |
| User Role | Admin |

---

## Recommendations

### Immediate Actions (High Priority)
1. **Fix Rooms/Tables API Authentication**: Investigate why the auth token is not being sent to `/api/rooms` and `/api/tables` endpoints. Compare the request headers of working endpoints vs. failing ones.

2. **Stop Data Polling After Logout**: Ensure all data subscriptions and polling intervals are properly cleaned up when the user logs out to prevent unnecessary 401 errors.

### Secondary Actions (Low Priority)
3. **Add Autocomplete Attribute**: Add `autoComplete="current-password"` to the password input field for better UX.

4. **Fix Duplicate Favourites Buttons**: Investigate and remove the duplicate "Favourites" button in the product filter UI.

---

## Appendix: Full Console Log

```
[VERBOSE] [DOM] Input elements should have autocomplete attributes (suggested: "current-password"): (More info: https://goo.gl/9p2vKq) %o @ http://192.168.1.241:3000/:0

[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) @ http://192.168.1.241:3001/api/rooms:0
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) @ http://192.168.1.241:3001/api/tables:0
[ERROR] Error making request to http://192.168.1.241:3001/api/rooms: Error: Access denied. No token provided.
[ERROR] Error fetching rooms: Error: Access denied. No token provided.
[ERROR] Error making request to http://192.168.1.241:3001/api/tables: Error: Access denied. No token provided.
[ERROR] Error fetching tables: Error: Access denied. No token provided.
[ERROR] Error fetching tables: Error: Access denied. No token provided.

[LOG] Notifying subscribers of data change...
[LOG] Notifying subscribers of data change...

[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) @ http://192.168.1.241:3001/api/rooms:0
[ERROR] Error making request to http://192.168.1.241:3001/api/rooms: Error: Access denied. No token provided.
[ERROR] Error fetching rooms: Error: Access denied. No token provided.

[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized) @ http://192.168.1.241:3001/api/tables:0
[ERROR] Error making request to http://192.168.1.241:3001/api/tables: Error: Access denied. No token provided.
[ERROR] Error fetching tables: Error: Access denied. No token provided.

[LOG] Notifying subscribers of data change...
[LOG] User logged out and data cleared

[VERBOSE] [DOM] Input elements should have autocomplete attributes (suggested: "current-password"):

[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized)
[ERROR] Failed to load resource: the server responded with a status of 401 (Unauthorized)
[ERROR] Error making request to http://192.168.1.241:3001/api/rooms: Error: Access denied. No token provided.
[ERROR] Error fetching rooms: Error: Access denied. No token provided.
[ERROR] Error making request to http://192.168.1.241:3001/api/tables: Error: Access denied. No token provided.
[ERROR] Error fetching tables: Error: Access denied. No token provided.
```

---

*Report generated by Playwright MCP automated testing*
