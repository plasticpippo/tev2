# Token Revocation Test Report

**Test Date:** 2026-02-07  
**Test Environment:** http://192.168.1.241:3000  
**Test Method:** Playwright MCP Server  
**Test Credentials:** admin / admin123

---

## Test Summary

| Test # | Test Name | Status | Result |
|--------|-----------|--------|--------|
| 1 | Login Test | ✅ PASS | JWT token successfully returned |
| 2 | Logout Test | ✅ PASS | Token successfully revoked |
| 3 | Revoked Token Test | ✅ PASS | Revoked token rejected with 401 |
| 4 | Revoke-All Test | ❌ FAIL | Token NOT rejected after revoke-all |

---

## Test Details

### Test 1: Login Test

**Objective:** Login with admin credentials and verify a JWT token is returned.

**Steps:**
1. Navigated to http://192.168.1.241:3000
2. Called POST /api/users/login with credentials:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```

**Expected Result:** JWT token returned in response

**Actual Result:**
```json
{
  "id": 1,
  "name": "Admin User",
  "username": "admin",
  "role": "Admin",
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTc3MDQ4NjMyNiwiZXhwIjoxNzcwNTcyNzI2fQ.mjOE6H8fkWlNvwIoy4rkqNNbeiKgTHQaq5YjqHQ_o5o"
}
```

**Status:** ✅ PASS

---

### Test 2: Logout Test

**Objective:** Call the logout endpoint with the JWT token and verify the token is revoked.

**Steps:**
1. Called POST /api/users/auth/logout with Authorization header:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTc3MDQ4NjMyNiwiZXhwIjoxNzcwNTcyNzI2fQ.mjOE6H8fkWlNvwIoy4rkqNNbeiKgTHQaq5YjqHQ_o5o
   ```

**Expected Result:** Token successfully revoked, success message returned

**Actual Result:**
```json
{
  "message": "Successfully logged out."
}
```

**Status:** ✅ PASS

---

### Test 3: Revoked Token Test

**Objective:** Try to access a protected endpoint with the revoked token and verify it returns 401 Unauthorized.

**Steps:**
1. Called GET /api/layouts/till/1/category/1 with the revoked token:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTc3MDQ4NjMyNiwiZXhwIjoxNzcwNTcyNzI2fQ.mjOE6H8fkWlNvwIoy4rkqNNbeiKgTHQaq5YjqHQ_o5o
   ```

**Expected Result:** 401 Unauthorized with error message

**Actual Result:**
```json
{
  "error": "Token has been revoked. Please login again."
}
```

**HTTP Status:** 401 Unauthorized

**Status:** ✅ PASS

---

### Test 4: Revoke-All Test

**Objective:** Login again, then use the revoke-all endpoint to revoke all tokens for the user, and verify the token is rejected.

**Steps:**
1. Called POST /api/users/login to get a new token:
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```
   
   **Response:**
   ```json
   {
     "id": 1,
     "name": "Admin User",
     "username": "admin",
     "role": "Admin",
     "token": "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJBZG1pbiIsImlhdCI6MTc3MDQ4NjUwMiwiZXhwIjoxNzcwNTcyOTAyfQ.0h2pOEFN-bazYzKQ3YsKzKrUTIXRRD0olKHtrwPvYT0"
   }
   ```

2. Called POST /api/users/auth/revoke-all with the new token:
   ```json
   {
     "userId": 1
   }
   ```
   
   **Response:**
   ```json
   {
     "message": "All tokens for the user have been revoked successfully."
   }
   ```

3. Called GET /api/layouts/till/1/category/1 with the same token to verify it's rejected

**Expected Result:** 401 Unauthorized with error message

**Actual Result:**
```json
[]
```

**HTTP Status:** 200 OK

**Status:** ❌ FAIL

---

## Critical Issue Found

### Revoke-All Functionality Bug

**Location:** [`backend/src/services/tokenBlacklistService.ts`](backend/src/services/tokenBlacklistService.ts:52-61)

**Issue:** The `revokeAllUserTokens` function does not work as intended. It creates a record with a special `tokenDigest` value (`user-${userId}-all-revoked-${Date.now()}`), but the `isTokenRevoked` function checks for a specific token's hash, not whether all tokens for a user have been revoked.

**Current Implementation:**
```typescript
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.revokedToken.createMany({
    data: {
      userId: parseInt(userId, 10),
      tokenDigest: `user-${userId}-all-revoked-${Date.now()}`,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
    skipDuplicates: true,
  });
}
```

**Problem:** This creates a record that will never match any actual token hash, so tokens are not actually rejected.

**Expected Behavior:** The `revokeAllUserTokens` function should either:
1. Store a flag in the database indicating all tokens for a user are revoked, OR
2. Modify the `isTokenRevoked` function to check if all tokens for a user have been revoked

**Impact:** The revoke-all endpoint is non-functional and does not provide the intended security feature.

---

## Recommendations

1. **Fix Revoke-All Functionality:** The `revokeAllUserTokens` function needs to be redesigned to properly revoke all tokens for a user.

2. **Add Integration Tests:** Add comprehensive integration tests for token revocation functionality to catch such issues early.

3. **Improve Error Messages:** Consider adding more specific error messages for different failure scenarios.

---

## Conclusion

The token revocation functionality is partially working:
- ✅ Login and logout functionality works correctly
- ✅ Individual token revocation works correctly
- ✅ Revoked tokens are properly rejected
- ❌ The revoke-all functionality is broken and does not work as intended

**Overall Status:** 3 out of 4 tests passed (75% pass rate)
