# Frontend Auth Token Fix Plan

## Problem Summary

The [`makeApiRequest()`](frontend/services/apiBase.ts:193) function in `frontend/services/apiBase.ts` does NOT automatically include authentication headers. This causes API calls from multiple service files to fail with 401 Unauthorized errors.

### Current Behavior

```typescript
// Current code (lines 204-207):
const fetchOptions: RequestInit = {
  ...options,
  signal: controller.signal,
};
```

The function simply spreads the provided options without merging in auth headers.

### Impact Analysis

Based on code analysis, the following services are affected:

| Service | Status | Issue |
|---------|--------|-------|
| `inventoryService.ts` | ❌ Missing headers | Calls with `undefined` options |
| `productService.ts` | ❌ Missing headers | Calls with `undefined` options |
| `settingService.ts` | ❌ Missing headers | Calls with `undefined` options |
| `transactionService.ts` | ❌ Missing headers | Calls with `undefined` options |
| `dailyClosingService.ts` | ❌ Missing headers | Calls with `undefined` options |
| `tillService.ts` | ❌ Missing headers | Calls with `undefined` options |
| `orderService.ts` | ❌ Missing headers | Calls with `undefined` options |
| `consumptionService.ts` | ❌ Missing headers | Calls without auth headers |
| `analyticsService.ts` | ❌ Missing headers | Calls without auth headers |
| `tableService.ts` | ✅ Works | Manually passes `{ headers: getAuthHeaders() }` |
| `layoutService.ts` | ✅ Works | Manually passes `{ headers: getAuthHeaders() }` |
| `userService.ts` | ✅ Works | Manually passes `{ headers: getAuthHeaders() }` |

## Recommended Solution

Modify [`makeApiRequest()`](frontend/services/apiBase.ts:193) to automatically merge auth headers into all requests.

### Code Change

**File:** `frontend/services/apiBase.ts`  
**Location:** Lines 204-207

```typescript
// BEFORE:
const fetchOptions: RequestInit = {
  ...options,
  signal: controller.signal,
};

// AFTER:
const fetchOptions: RequestInit = {
  ...options,
  headers: {
    ...getAuthHeaders(),
    ...options?.headers,
  },
  signal: controller.signal,
};
```

### Why This Approach?

1. **Single point of fix** - Ensures consistency across all API calls
2. **Future-proof** - New services won't accidentally omit headers
3. **Reduces boilerplate** - No need to manually pass headers in every service
4. **Still flexible** - Allows overriding headers when needed via `options.headers`
5. **Backward compatible** - Services already passing headers will continue to work

## Edge Cases and Considerations

### 1. Unauthenticated Endpoints

**Analysis:** The login endpoint at `/api/users/login` uses a direct `fetch()` call in [`userService.login()`](frontend/services/userService.ts:61-87), NOT `makeApiRequest()`. This is correct behavior and should NOT be changed.

**Conclusion:** No special handling needed for login since it bypasses `makeApiRequest()` entirely.

### 2. Header Override Behavior

The proposed fix uses spread operator order to ensure proper precedence:

```typescript
headers: {
  ...getAuthHeaders(),    // Base headers (includes Content-Type and Authorization)
  ...options?.headers,    // Caller can override if needed
}
```

This allows callers to override headers if necessary for special cases.

### 3. Content-Type Header

The [`getAuthHeaders()`](frontend/services/apiBase.ts:96) function already includes `Content-Type: application/json`. This is appropriate for all current API calls. If a future endpoint requires different content type, it can be overridden:

```typescript
makeApiRequest(url, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
```

### 4. Token Expiration Handling

The [`getAuthHeaders()`](frontend/services/apiBase.ts:96) function already handles:
- Token expiration checking
- Automatic token cleanup
- Redirect to login for protected routes

No additional changes needed for token lifecycle management.

### 5. Services Already Passing Headers

Services like `tableService.ts`, `layoutService.ts`, and `userService.ts` that already manually pass `{ headers: getAuthHeaders() }` will continue to work correctly. The headers will be merged, resulting in the same auth headers being present.

**Optional cleanup:** After implementing this fix, the manual header passing in these services could be removed as a code cleanup task, but it's not required for functionality.

## Implementation Steps

1. **Modify `makeApiRequest()` function** in `frontend/services/apiBase.ts`
   - Add automatic header merging at lines 204-207

2. **Test the fix**
   - Use Playwright MCP to test API calls from affected services
   - Verify 401 errors are resolved
   - Confirm login still works (unauthenticated)

3. **Optional cleanup** (can be done separately)
   - Remove redundant manual header passing in services that already do it
   - This is cosmetic, not required for functionality

## Testing Plan

### Test Cases

| Test | Expected Result |
|------|-----------------|
| Login with valid credentials | Success, token stored |
| Fetch products after login | Returns products, no 401 |
| Fetch tables after login | Returns tables, no 401 |
| Fetch transactions after login | Returns transactions, no 401 |
| Create order after login | Order created successfully |
| Login with invalid credentials | 401 error handled properly |

### Verification

After implementation, use Playwright MCP to:
1. Navigate to the app at `http://192.168.1.241:80`
2. Login with admin/admin123
3. Navigate through different views to trigger API calls
4. Verify no 401 errors in network requests

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Login breaks | Low | High | Login uses direct fetch, not makeApiRequest |
| Header conflicts | Low | Low | Spread order ensures caller can override |
| Existing services break | Very Low | Medium | Headers merge correctly, no conflicts |

## Summary

This is a straightforward fix with minimal risk. The change is localized to a single function and provides immediate benefit to 9 service files that are currently missing authentication headers.
