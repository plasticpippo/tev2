# Session Store Fix Test 2: Order Persistence Report

**Test Date:** 2026-02-09  
**Test Type:** Order Persistence Verification  
**Test Environment:** http://192.168.1.241:80  
**Test Tool:** Playwright MCP Server  

---

## Executive Summary

This test verifies that the session store fixes are working correctly for order persistence. The test focused on adding multiple products to an order and verifying that the order session is being saved and updated correctly.

**Overall Result:** PARTIAL PASS

The session persistence is working correctly - all products are stored in the same session and the session is being updated. However, there's an issue with the HTTP status codes - all POST requests return 201 Created instead of 200 OK for updates.

---

## Test Objectives

1. Navigate to the application at http://192.168.1.241:80
2. Login with admin credentials (admin/admin123)
3. Add multiple products to the order list (2-3 different products)
4. Verify the order total is calculated correctly
5. Monitor network requests to verify order session is being saved correctly
6. Verify order session persistence (POST /api/order-sessions/current)
7. Check for duplicate sessions
8. Verify HTTP status codes (201 for new session, 200 for updates)

---

## Test Results

### 1. Navigation and Login

**Status:** PASS

- Successfully navigated to http://192.168.1.241:80
- User was already logged in as "Admin User" (no login required)
- Authentication token stored in localStorage as "authToken"

---

### 2. Adding Products to Order

**Status:** PASS

Added 4 products to the order:

| Product | Variant | Price | Quantity |
|---------|----------|-------|----------|
| Scotch Whiskey | On the Rocks | €10,00 | 1 |
| Cabernet Sauvignon | Glass | €8,50 | 1 |
| Mojito | Regular | €12,00 | 1 |
| IPA | Draft | €6,00 | 1 |

All products were successfully added to the order and displayed correctly in the UI.

---

### 3. Order Total Calculation

**Status:** PASS

- Expected total: €10,00 + €8,50 + €12,00 + €6,00 = €36,50
- Actual total: €36,50
- Calculation: CORRECT

---

### 4. Order Session Persistence

**Status:** PASS

Verified the current order session via API call:

```json
{
  "id": "262fc80e-35a7-4e0d-b933-7963b23b4ab0",
  "userId": 1,
  "items": [
    {
      "id": "8092b0ee-7904-409a-b207-6133d4b1a5ea",
      "variantId": 7,
      "productId": 4,
      "name": "Scotch Whiskey - On the Rocks",
      "price": 10,
      "quantity": 1,
      "effectiveTaxRate": 0.19
    },
    {
      "id": "e9a815e0-937f-465a-bda3-8d600e60494f",
      "variantId": 10,
      "productId": 1,
      "name": "Cabernet Sauvignon - Glass",
      "price": 8.5,
      "quantity": 1,
      "effectiveTaxRate": 0.19
    },
    {
      "id": "1e604a91-3c02-4ac3-ba48-1eca48e3f3ac",
      "variantId": 12,
      "productId": 3,
      "name": "Mojito - Regular",
      "price": 12,
      "quantity": 1,
      "effectiveTaxRate": 0.19
    },
    {
      "id": "40677ce1-9d10-4812-9408-bc7d07cae9bb",
      "variantId": 15,
      "productId": 2,
      "name": "IPA - Draft",
      "price": 6,
      "quantity": 1,
      "effectiveTaxRate": 0.19
    }
  ],
  "status": "active",
  "createdAt": "2026-01-30T01:57:45.608Z",
  "updatedAt": "2026-02-09T23:03:37.498Z",
  "logoutTime": null
}
```

**Key Findings:**
- All 4 products are stored in the same session (Session ID: 262fc80e-35a7-4e0d-b933-7963b23b4ab0)
- Session status is "active"
- Session was created on 2026-01-30 (old session from previous testing)
- Session was updated on 2026-02-09T23:03:37.498Z (when we added the fourth product)
- Each product has a unique ID and correct details

---

### 5. Network Request Analysis

**Status:** PARTIAL PASS

Observed the following network requests:

| Request | Method | Status | Description |
|---------|---------|--------|-------------|
| /api/order-sessions/current | GET | 200 OK | Initial check for existing session |
| /api/order-sessions/current | POST | 201 Created | First product (Scotch Whiskey) |
| /api/order-sessions/current | POST | 201 Created | Second product (Cabernet Sauvignon) |
| /api/order-sessions/current | POST | 201 Created | Third product (Mojito) |
| /api/order-sessions/current | POST | 201 Created | Fourth product (IPA) |

**Issue Identified:**
- All POST requests return 201 Created
- Expected behavior: First POST should return 201, subsequent POSTs should return 200 OK
- This suggests the backend is not correctly distinguishing between creating a new session and updating an existing session

**However:**
- Despite the incorrect status codes, the session is being updated correctly
- All products are stored in the same session
- No duplicate sessions are created

---

### 6. Duplicate Session Check

**Status:** PASS

- Only one active session exists for the user (Session ID: 262fc80e-35a7-4e0d-b933-7963b23b4ab0)
- All 4 products are stored in this single session
- No duplicate sessions were created during the test

---

### 7. HTTP Status Code Verification

**Status:** PARTIAL FAIL

**Expected Behavior:**
- First POST request: 201 Created (new session)
- Subsequent POST requests: 200 OK (update existing session)

**Actual Behavior:**
- All POST requests: 201 Created

**Analysis:**
The backend code in [`backend/src/handlers/orderSessions.ts`](backend/src/handlers/orderSessions.ts:76-155) has the correct logic to return 201 for new sessions and 200 for updates:

```typescript
let wasCreated = false;

if (orderSession) {
  // Update existing active session
  orderSession = await tx.orderSession.update({...});
} else {
  // Create a new order session
  orderSession = await tx.orderSession.create({...});
  wasCreated = true;
}

// Return 201 for new sessions, 200 for updates
const statusCode = result.wasCreated ? 201 : 200;
res.status(statusCode).json(result.orderSession);
```

However, all POST requests are returning 201 Created, which suggests that the `wasCreated` flag is always being set to `true`.

**Possible Causes:**
1. The session might not be found in the database when the POST request is made (race condition)
2. The session status might not be 'active' when checked
3. There might be a timing issue where the session is created but not yet persisted when the next POST request arrives

**Impact:**
- Low impact on functionality - the session is being updated correctly
- Medium impact on API semantics - incorrect HTTP status codes
- High impact on debugging - makes it difficult to distinguish between creates and updates

---

## Detailed Test Steps

### Step 1: Navigate to Application
- Action: Navigate to http://192.168.1.241:80
- Result: Page loaded successfully, user already logged in as "Admin User"

### Step 2: Add First Product
- Action: Click on "Scotch Whiskey" product
- Result: Product added to order, subtotal updated to €10,00
- Network: POST /api/order-sessions/current => 201 Created

### Step 3: Add Second Product
- Action: Click on "Cabernet Sauvignon" product
- Result: Product added to order, subtotal updated to €18,50
- Network: POST /api/order-sessions/current => 201 Created

### Step 4: Add Third Product
- Action: Click on "Mojito" product
- Result: Product added to order, subtotal updated to €30,50
- Network: POST /api/order-sessions/current => 201 Created

### Step 5: Add Fourth Product
- Action: Click on "IPA" product
- Result: Product added to order, subtotal updated to €36,50
- Network: POST /api/order-sessions/current => 201 Created

### Step 6: Verify Order Session
- Action: Call GET /api/order-sessions/current with authentication token
- Result: Session returned with all 4 products, status "active"

---

## Summary of Findings

### What's Working

1. **Order Persistence:** Products are correctly persisted in the order session
2. **Session Reuse:** The same session is being reused for all product additions
3. **No Duplicate Sessions:** Only one session exists with all products
4. **Order Total Calculation:** Order totals are calculated correctly
5. **Data Integrity:** All product details are stored correctly (name, price, quantity, tax rate)

### What's Not Working

1. **HTTP Status Codes:** All POST requests return 201 Created instead of 200 OK for updates
2. **API Semantics:** The backend is not correctly distinguishing between creates and updates

### Recommendations

1. **Investigate Status Code Issue:**
   - Add logging to the backend to track when `wasCreated` is set to `true`
   - Verify that the session is being found correctly in the database
   - Check for race conditions or timing issues

2. **Improve Error Handling:**
   - Add more detailed logging to track the session lifecycle
   - Consider adding a unique constraint on (userId, status) to prevent duplicate active sessions

3. **Add Integration Tests:**
   - Create automated tests to verify the correct HTTP status codes
   - Test the session persistence under various scenarios (concurrent requests, rapid additions, etc.)

---

## Conclusion

The session store fixes are **partially working**. The core functionality of persisting order items in a session is working correctly - all products are stored in the same session and the session is being updated. However, there's an issue with the HTTP status codes where all POST requests return 201 Created instead of 200 OK for updates.

This issue does not affect the functionality of the application, but it does affect the API semantics and makes debugging more difficult. The issue should be investigated and fixed to ensure correct HTTP status codes are returned.

**Test Status:** PARTIAL PASS

**Next Steps:**
1. Investigate why all POST requests return 201 Created
2. Add logging to track the session lifecycle
3. Fix the status code issue
4. Re-run the test to verify the fix
