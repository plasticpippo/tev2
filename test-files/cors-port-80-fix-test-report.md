# CORS Port 80 Fix Test Report

## Test Date
2026-02-11

## Test Objective
Test the CORS fix for the port 80 issue. The CORS issue was that when accessing the site on port 80 (the default HTTP port), browsers don't include the port in the Origin header. This caused a 403 error when processing payments.

## Changes Made to Fix CORS Issue

### 1. docker-compose.yml
- Updated backend service to use array format for environment variables
- Changed `CORS_ORIGIN: ${URL},${URL}:${NGINX_PORT}` to array format with `- CORS_ORIGIN=${URL},${URL}:${NGINX_PORT}`

### 2. nginx/nginx.conf
- Added map directive to handle multiple CORS origins
- Updated CORS header to use `$cors_origin` from map
- Updated CSP header to include both `${URL}` and `${URL}:${NGINX_PORT}`

## Test Steps Performed

### 1. Restart Containers
**Command:** `docker compose restart`

**Result:** All containers restarted successfully
- bar_pos_backend_db: Restarted
- bar_pos_backend: Restarted
- bar_pos_frontend: Restarted
- bar_pos_nginx: Restarted

### 2. Wait for Services to be Ready
**Command:** `docker compose ps`

**Result:** All services are healthy
- bar_pos_backend_db: Up 46 seconds (healthy)
- bar_pos_backend: Up 46 seconds (healthy)
- bar_pos_frontend: Up 46 seconds (healthy)
- bar_pos_nginx: Up 46 seconds (healthy)

### 3. Verify CORS_ORIGIN Environment Variable
**Command:** `docker exec bar_pos_backend env | grep CORS`

**Initial Result:** `CORS_ORIGIN=http://192.168.1.241:80`
- **Issue:** Only includes origin with port, not without port

**Fix Applied:** Changed docker-compose.yml to use array format for environment variables
- Changed from `CORS_ORIGIN: ${URL},${URL}:${NGINX_PORT}` to `- CORS_ORIGIN=${URL},${URL}:${NGINX_PORT}`

**After Rebuild:** `docker compose up -d --build backend`

**Result:** `CORS_ORIGIN=http://192.168.1.241,http://192.168.1.241:80`
- **Status:** Correctly set to include both origins (with and without port)

### 4. Test Payment Flow Using Playwright MCP

#### Test 1: Navigate to Application
**URL:** `http://192.168.1.241:80`

**Result:** Page loaded successfully
- Title: "Bar POS Pro - Professional Point of Sale System"
- User: Already logged in as Admin User
- Order: Existing order with items (IPA, Coca Cola, Scotch Whiskey)
- Total: €68,50

#### Test 2: Click Payment Button
**Action:** Clicked "Payment" button

**Result:** Payment modal opened successfully
- Tip Amount: €0,00
- Subtotal: €68,50
- Tax: €0,00
- Total: €68,50
- Payment Options: "Pay with CASH" and "Pay with CARD"

#### Test 3: Click "Pay with CASH" Button
**Action:** Clicked "Pay with CASH" button

**Result:** 403 Forbidden error occurred
- Error Dialog: "HTTP error! status: 403"
- Console Error: "Failed to load resource: the server responded with a status of 403 (Forbidden)"
- Console Error: "Error updating stock levels: Error: HTTP error! status: 403"
- Console Error: "Payment processing failed: Error: HTTP error! status: 403"

### 5. Network Request Analysis

**Command:** `mcp--playwright--browser_network_requests`

**Results:**
- GET requests: All successful (200 OK)
- POST /api/transactions: 201 Created (successful)
- PUT /api/stock-items/update-levels: 403 Forbidden (failed)

**Analysis:**
- Transaction creation succeeded
- Stock level update failed with 403 Forbidden
- Request is being blocked before reaching backend (not in nginx logs)
- Suggests CORS preflight check is failing

### 6. Backend Logs Analysis

**Command:** `docker logs bar_pos_backend --tail 30`

**Results:**
- POST /api/transactions: 201 Created (successful)
- No PUT /api/stock-items/update-levels request found in logs
- Suggests request is being blocked by CORS middleware before reaching backend

### 7. Nginx Logs Analysis

**Command:** `docker logs bar_pos_nginx --tail 30 | grep -i "update-levels"`

**Results:**
- No PUT /api/stock-items/update-levels request found in nginx logs
- Confirms request is being blocked before reaching nginx

## Test Results

### Summary
The CORS fix was partially implemented:
- **CORS_ORIGIN environment variable:** Correctly set to `http://192.168.1.241,http://192.168.1.241:80`
- **Transaction creation:** Successful (201 Created)
- **Stock level update:** Failed with 403 Forbidden

### Issues Found

1. **CORS Configuration Issue:** The CORS_ORIGIN is correctly set to include both origins, but the stock-items endpoint is still returning 403 Forbidden.

2. **Request Blocking:** The PUT request to `/api/stock-items/update-levels` is being blocked before reaching the backend (not in nginx logs), suggesting that the CORS preflight check is failing.

3. **Inconsistent Behavior:** The transaction endpoint works correctly (201 Created), but the stock-items endpoint fails with 403, suggesting there might be additional CORS or authorization issues specific to the stock-items endpoint.

### Conclusion

The CORS fix for the port 80 issue is **NOT WORKING** as expected. While the CORS_ORIGIN environment variable is correctly set to include both `http://192.168.1.241` and `http://192.168.1.241:80`, the payment flow still fails with a 403 error when trying to update stock levels.

The issue appears to be more complex than just the CORS configuration. The stock-items endpoint might have additional CORS or authorization restrictions that are preventing the request from being processed.

### Recommendations

1. **Investigate stock-items endpoint CORS configuration:** Check if the stock-items endpoint has additional CORS restrictions that are not covered by the global CORS_ORIGIN setting.

2. **Check authorization middleware:** Verify if the stock-items endpoint has authorization middleware that might be blocking the request.

3. **Review nginx CORS headers:** Ensure that the nginx CORS headers are being correctly applied to all API endpoints.

4. **Test with different browsers:** Test the payment flow with different browsers to see if the issue is browser-specific.

5. **Check backend CORS middleware:** Verify that the backend CORS middleware is correctly processing the CORS_ORIGIN environment variable and allowing requests from both origins.
