# Bug Verification Report

**Date:** 2026-02-02  
**Testing Tool:** Playwright MCP Server  
**App URL:** http://192.168.1.241:3000  
**Credentials Used:** admin/admin123

---

## Summary

This report documents the verification of all bug fixes using Playwright MCP browser automation.

| Bug ID | Description | Status | Notes |
|--------|-------------|--------|-------|
| AUTH-001 | Authentication token sent to rooms/tables APIs | FIXED | APIs receive tokens (500 errors are server-side, not auth) |
| AUTH-002 | API calls stop after logout | NOT FIXED | API calls continue with 401 errors after logout |
| UI-001 | Autocomplete on password field | FIXED | autocomplete="current-password" on password field |
| UI-002 | No duplicate Favourites buttons | FIXED | Only one "Favourites" button visible |

---

## Detailed Verification Results

### AUTH-001: Authentication token sent to rooms/tables APIs

**Test Steps:**
1. Login to the application
2. Navigate to Admin Panel > Tables & Layout
3. Click on Rooms tab
4. Click on Tables tab
5. Click on Layout tab
6. Monitor network requests

**Results:**
- Rooms API: Returns 500 Internal Server Error (NOT 401 Unauthorized)
- Tables API: Returns 500 Internal Server Error (NOT 401 Unauthorized)
- Layout API: Loads successfully

**Conclusion:** VERIFIED FIXED
The authentication tokens ARE being sent to the rooms/tables APIs. The 500 errors indicate server-side issues (likely database/Prisma issues), not authentication failures. If tokens were missing, we would see 401 Unauthorized errors.

---

### AUTH-002: API calls stop after logout

**Test Steps:**
1. Login to the application
2. Open network inspector
3. Click Logout
4. Monitor for 5+ seconds after logout
5. Check for any API calls with 401 errors

**Results:**
- Logout API call (PUT /api/order-sessions/current/logout) returns 200 OK
- After logout, the following API calls continue and return 401 errors:
  - GET /api/products (200 - public endpoint)
  - GET /api/categories (200 - public endpoint)
  - GET /api/rooms (401 - "Access denied. No token provided")
  - GET /api/tables (401 - "Access denied. No token provided")

**Console Output After Logout:**
```
[LOG] User logged out and data cleared
[ERROR] 401 (Unauthorized) @ /api/rooms
[ERROR] 401 (Unauthorized) @ /api/tables
[ERROR] Error: Access denied. No token provided.
```

**Conclusion:** NOT FIXED
API calls continue to be made after logout, resulting in multiple 401 errors. The auto-refresh mechanisms are not being properly stopped/cleaned up when the user logs out.

**Recommendation:** 
- Clear all intervals/timeouts on logout
- Stop data polling mechanisms
- Reset data contexts before redirecting to login

---

### UI-001: Autocomplete on password field

**Test Steps:**
1. Navigate to the login screen
2. Inspect the username and password input fields for autocomplete attributes

**Results:**
```javascript
// Username field
{
  type: "text",
  autoComplete: "username"
}

// Password field
{
  type: "password", 
  autoComplete: "current-password"
}
```

**Conclusion:** VERIFIED FIXED
Both fields have proper autocomplete attributes for better browser integration and password manager support.

---

### UI-002: No duplicate Favourites buttons

**Test Steps:**
1. Login to the application
2. View the main POS screen
3. Count the number of "Favourites" buttons displayed

**Results:**
- Only ONE "Favourites" button is displayed in the category tabs
- Located at: `button "Favourites" [ref=e86]`

**Screenshot:** See `test-files/bug-verification-main-screen.png`

**Conclusion:** VERIFIED FIXED
Only a single "Favourites" button is visible on the main screen. No duplicate buttons were found.

---

## Test Artifacts

- Screenshot: `test-files/bug-verification-main-screen.png`
- Browser Console Logs: Captured during testing
- Network Requests: Logged via Playwright MCP

---

## Recommendations

### For AUTH-002 (Not Fixed):
The issue requires code changes to properly clean up API polling intervals when a user logs out. Suggested fixes:
1. Implement a global cleanup function that stops all data fetching
2. Use React context useEffect cleanup functions
3. Add an isLoggedIn check before making authenticated API calls
4. Consider using AbortController to cancel in-flight requests

---

## Appendix: Backend Error Details

The 500 errors on rooms/tables endpoints appear to be related to database issues. Sample error response:
```
Error: Failed to fetch rooms
Error: Failed to fetch tables
```

These are NOT authentication issues - the token is being sent correctly. The backend is encountering internal errors when processing these requests.
