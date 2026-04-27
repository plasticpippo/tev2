# Comprehensive Codebase Audit Report — Bar POS System

**Date:** 2026-04-27  
**Scope:** Full-stack audit covering database schema, backend handlers/services/middleware, frontend components/services, shared code, infrastructure configuration, and financial calculation correctness.  
**Files Analyzed:** 150+ source files across 9,200+ lines of backend code, 88 frontend components, 19 service files, 7 middleware files, 767-line Prisma schema, Docker/nginx configuration.

---

## Executive Summary

| Severity | Count | Description |
|----------|-------|-------------|
| **CRITICAL** | 8 | Immediate security/financial risk. Exploitable without special conditions. |
| **HIGH** | 17 | Significant security, data integrity, or financial accuracy issues. |
| **MEDIUM** | 31 | Technical debt with real but bounded impact. |
| **LOW** | 24 | Code quality, minor inconsistencies, or hypothetical risks. |
| **Code Smells** | 16 | Architectural concerns, maintainability issues. |
| **Total** | **96** | |

---

## CRITICAL (8 issues)

### C-01. CSRF Middleware Fully Implemented but Never Applied
**File:** `backend/src/middleware/csrf.ts` (exported at line 164) — never imported in `backend/src/router.ts`  
**Root Cause:** The `csrfMiddleware` function is complete and exported, but no route applies it. CSRF tokens are sent after login but never validated on subsequent state-changing requests.  
**Impact:** Any authenticated user can be tricked into performing unintended operations (transactions, user deletion, settings changes) via a malicious website. Full CSRF bypass.  
**Fix:** Apply `csrfMiddleware` to all POST/PUT/DELETE/PATCH routes in `router.ts`.

### C-02. Three API Endpoints Have Zero Authentication
**File:** `backend/src/handlers/orderActivityLogs.ts`, lines 10, 57, 107  
**Root Cause:** `GET /`, `GET /:id`, and `POST /` on the order-activity-logs router have no `authenticateToken` middleware.  
**Impact:** Unauthenticated users can read to full order activity log (audit trail) and inject fake log entries.  
**Fix:** Add `authenticateToken` to all three routes:
```typescript
orderActivityLogsRouter.get('/', authenticateToken, async (req, res) => { /* ... */ });
orderActivityLogsRouter.get('/:id', authenticateToken, async (req, res) => { /* ... */ });
orderActivityLogsRouter.post('/', authenticateToken, async (req, res) => { /* ... */ });
```

### C-03. Duplicate CORS Headers (nginx + Express) Cause Browser Rejection
**File:** `nginx/nginx.conf` lines 195-199 AND `backend/src/index.ts` line 173  
**Root Cause:** Both nginx and Express independently add `Access-Control-Allow-Origin` and related CORS headers. Browsers reject responses with duplicate CORS headers.  
**Impact:** Cross-origin requests fail silently or inconsistently depending on which layer's header the browser processes first.  
**Fix:** Remove the `add_header Access-Control-*` block from `nginx.conf` `location /api/`. Keep Express as the single CORS authority.

### C-04. Nginx `add_header` Inheritance Drops ALL Security Headers
**File:** `nginx/nginx.conf` lines 118-129 (server-level) vs lines 169, 195, 231, 246 (location-level)  
**Root Cause:** In nginx, `add_header` in a location block **replaces** all inherited `add_header` from the server block. Every location that adds its own headers (Cache-Control, CORS, Content-Type) drops X-Frame-Options, X-Content-Type-Options, CSP, and all other security headers.  
**Impact:** The application is vulnerable to clickjacking, MIME-type sniffing, and XSS on every proxied route.  
**Fix:** Create a reusable snippet file and `include` it in every location block, or use `more_set_headers` from the `headers-more-nginx-module`.

### C-05. Hardcoded Plaintext Passwords Shipped in Frontend Bundle
**File:** `shared/constants.ts` lines 5-8  
**Root Cause:** Default credentials (`admin`/`admin123`, `cashier`/`cashier123`) are in `shared/constants.ts`, which is bundled into the frontend JavaScript. Anyone viewing the browser's DevTools can extract them.  
**Impact:** Direct authentication bypass. Combined with no forced password change on first login, these defaults may persist indefinitely.  
**Fix:** Remove from shared code. Move seed data exclusively to `backend/prisma/seed.ts` with bcrypt hashing. Delete `password_HACK` field from the shared `User` type.

### C-06. Daily Closing Double-Counts Discounts — Net Sales Wrong
**File:** `backend/src/services/dailyClosingService.ts` lines 77-80, 119  
**Root Cause:** For non-complimentary orders, `grossAmount` is set to `txTotal` (which already has discount subtracted: `subtotal + tax + tip - discount`). Then line 119 computes `netSales = grossSales - totalDiscounts`, subtracting the discount a second time.  
**Impact:** Daily closing reports understate net sales by the total discounts given that day. Example: ten 5 EUR discounts = 50 EUR underreported. This affects accounting, tax reporting, and business analytics.  
**Fix:** Change line 80 to always use pre-discount gross:
```typescript
const grossAmount = addMoney(addMoney(txSubtotal, txTax), txTip);
```

### C-07. Database Container on External Network
**File:** `docker-compose.yml` lines 24-26  
**Root Cause:** The `db` service is connected to both `internal-network` and `external-network`. The external network bridges to the nginx reverse proxy facing the host.  
**Impact:** Any container or process on the external Docker network can attempt direct PostgreSQL connections.  
**Fix:** Remove `external-network` from the `db` service. Only nginx needs to bridge both networks.

### C-08. Receipt Tax Breakdown Uses Raw Floating-Point Math
**File:** `backend/src/services/receiptService.ts` lines 100-116; `backend/src/services/paymentModalReceiptService.ts` lines 112, 126-147  
**Root Cause:** Tax breakdowns use raw `*`, `/`, `-`, `+=` instead of `currency.js` money-safe utilities. Accumulated floating-point drift across many items can cause 1-cent discrepancies on printed fiscal receipts.  
**Impact:** Receipt line items may not sum to the transaction total. In jurisdictions requiring exact receipt figures, this is a compliance issue.  
**Fix:** Replace all raw arithmetic with `multiplyMoney()`, `divideMoney()`, `subtractMoney()`, `addMoney()` from money utilities.

---

## HIGH (17 issues)

### H-01. Mass Assignment in User Update
**File:** `backend/src/handlers/users.ts` lines 110-192  
Role field updated in same operation as other fields without transaction isolation. Non-admin users could potentially elevate privileges via race condition.  
**Fix:** Split role update into a separate database operation with explicit admin-only check.

### H-02. Missing `await` on `next()` in CSRF Async Middleware
**File:** `backend/src/middleware/csrf.ts` line 230  
Async middleware calls `return next()` without `await`, causing unhandled promise rejections if downstream middleware throws.  
**Fix:** Change to `await next(); return;`.

### H-03. JWT Verification Bypass in CSRF Middleware
**File:** `backend/src/middleware/csrf.ts` lines 177-179  
If JWT is invalid, middleware calls `next()` and skips CSRF validation entirely. Attackers can craft requests with malformed JWTs to bypass CSRF.  
**Fix:** Return 401 immediately if no valid JWT.

### H-04. Source Maps Shipped in Production Docker Image
**File:** `backend/tsconfig.json` lines 15-16  
`sourceMap: true` generates `.js.map` files that are included in the Docker image.  
**Fix:** Remove source maps after build: `RUN find dist -name "*.map" -delete`.

### H-05. initPrisma Silently Starts Server Without Database Connection
**File:** `backend/src/prisma.ts` lines 100-116  
On initial connection failure, the server starts anyway with background reconnection attempts. All API calls return raw Prisma errors instead of clean 503s.  
**Fix:** Fail fast: `throw new Error('Database connection failed')` instead of silently continuing.

### H-06. Divergent Duplicate Type Definitions (14 Interfaces Differ)
**Files:** `shared/types.ts` vs `backend/src/types.ts`  
Both files define the same interfaces (OrderItem, ProductVariant, User, Transaction, etc.) but with different shapes — missing fields, extra fields, different optionality.  
**Impact:** Runtime type mismatches between frontend and backend. Phantom fields, missing fields, incorrect type narrowing.  
**Fix:** Eliminate backend duplicates. Import from `@shared/types` and extend where backend-specific fields are needed.

### H-07. Receipt Number Peek Hardcodes 1 Instead of receiptStartNumber
**File:** `backend/src/services/receiptNumberService.ts` line 103  
`peekNextReceiptNumber()` uses `nextNumber = 1` on year rollover while `generateNextReceiptNumber()` correctly uses `settings.receiptStartNumber`.  
**Impact:** If receiptStartNumber is not 1 (e.g., 1000), the preview shows "R000001" but actual generation produces "R001000".  
**Fix:** Add `startNumber` to `ReceiptNumberConfig` and use `config.startNumber` instead of `1`.

### H-08. Silent Failures on All GET Requests Return Empty Arrays
**Files:** All 11 frontend service files (`productService.ts`, `transactionService.ts`, etc.)  
Every GET operation catches errors and returns `[]`. The UI cannot distinguish "no data" from "API is down."  
**Impact:** In a POS system, operators see empty transaction lists when the backend is unreachable — potentially causing them to re-enter orders or miss existing ones.  
**Fix:** Re-throw errors or return a `Result<T>` type so the UI can display a proper error state.

### H-09. Race Condition in Payment Processing (Dual State)
**File:** `frontend/components/PaymentModal.tsx` lines 95-108  
Both `isProcessingRef.current` and `isProcessing` state are checked independently, creating a window for double-submission.  
**Fix:** Remove redundant `isProcessing` state check; rely solely on `isProcessingRef`.

### H-10. N+1 Query in Consumption Reports
**File:** `backend/src/handlers/consumptionReports.ts` lines 43-90  
Multiple sequential queries in a loop to build consumption data.  
**Fix:** Refactor to use a single query with proper joins and a pre-built variant-to-consumption map.

### H-11. Race Condition in Business Day Scheduler
**File:** `backend/src/services/businessDayScheduler.ts` line 258  
Auto-close operation not wrapped in a database transaction. Partial state if error occurs mid-close.  
**Fix:** Wrap entire closing operation in `prisma.$transaction()`.

### H-12. Race Condition in Receipt Number Generation
**File:** `backend/src/services/receiptService.ts` line 164  
Receipt number generation is not atomic with receipt creation. Concurrent requests could produce duplicate numbers.  
**Fix:** Use a single database transaction for number generation + receipt creation with `SELECT ... FOR UPDATE`.

### H-13. SQL Injection Potential via Dynamic sortBy
**File:** `backend/src/services/customerService.ts` line 153  
Dynamic `sortBy` parameter used directly in `prisma.orderBy` without whitelist validation.  
**Fix:** Validate against an allowlist of permitted sort fields.

### H-14. Unsafe Blob URL Opening
**File:** `frontend/components/TransactionHistory.tsx` line 128  
Blob URLs opened with `window.open()` without validating content type.  
**Fix:** Check `response.headers.get('content-type')` contains `application/pdf` before opening.

### H-15. Backend Container Runs as Root
**File:** `backend/Dockerfile`  
No `USER` directive — Node.js runs as root inside the container.  
**Fix:** Add `RUN addgroup -S appgroup && adduser -S appuser -G appgroup` and `USER appuser`.

### H-16. Uncached Token Revocation Check on Every Request
**File:** `backend/src/middleware/auth.ts` line 57  
Database query for revoked token on every authenticated request with no caching.  
**Impact:** Database bottleneck under load.  
**Fix:** Implement in-memory cache with TTL for revoked token checks.

### H-17. Payment Retry Logic Has Dead Code Path
**File:** `frontend/services/transactionService.ts` lines 149-200  
Two overlapping retry mechanisms for 409 conflicts; the second path is unreachable.  
**Fix:** Consolidate into a single retry mechanism.

---

## MEDIUM (31 issues)

| # | Area | File | Issue |
|---|------|------|-------|
| M-01 | Security | `backend/src/middleware/upload.ts` | File uploads only validate MIME type, not actual content (no magic number check, no SVG sanitization) |
| M-02 | Security | `backend/src/handlers/users.ts` | Information leakage in error messages exposes internal system state |
| M-03 | Security | `backend/src/index.ts` lines 204-212 | Upload static files served with wildcard `Access-Control-Allow-Origin: *` |
| M-04 | Security | `backend/src/router.ts` lines 54-63 | Unauthenticated `/version` endpoint leaks Node.js version and environment name |
| M-05 | Security | `frontend/services/apiBase.ts` lines 101-110 | Cookie parsing breaks if cookie value contains `=` — silently disables CSRF |
| M-06 | Security | `frontend/services/userService.ts` lines 64-92 | Login request does not include CSRF token (login CSRF vulnerability) |
| M-07 | Security | `frontend/utils/errorMessages.ts` | Raw server error messages displayed to users — may contain SQL/stack traces |
| M-08 | Finance | PaymentModal.tsx / transactions.ts / PaymentContext.tsx | Inconsistent inclusive tax divisor (`addMoney(1, rate)` vs `1 + rate`) produces different pre-tax prices for non-standard rates |
| M-09 | Finance | `backend/src/handlers/transactions.ts` lines 522-524 | Reconciliation endpoint uses raw `+=` for financial totals instead of `addMoney()` |
| M-10 | Finance | `frontend/utils/formatting.ts` vs `frontend/utils/money.ts` | Two redundant currency formatters producing different output for same values |
| M-11 | Schema | `backend/prisma/schema.prisma` | 20+ foreign keys missing indexes — slow JOIN and WHERE queries |
| M-12 | Schema | `backend/prisma/schema.prisma` | 12+ fields that should be enums stored as unbounded Strings (role, status, paymentMethod) |
| M-13 | Schema | `backend/prisma/schema.prisma` | Missing NOT NULL constraints on critical fields (price, quantity, name) |
| M-14 | Schema | `backend/prisma/schema.prisma` | Inconsistent `onDelete` behavior — some relations cascade, some restrict, most have no policy |
| M-15 | API | Multiple handlers | Missing pagination on list endpoints (categories, tills, stock adjustments) |
| M-16 | API | Multiple handlers | Inconsistent response formats — some return `{ data: [...] }`, others return bare arrays |
| M-17 | API | `backend/src/handlers/categories.ts` line 188 | Returns 500 for business logic error (category in use) — should be 409 Conflict |
| M-18 | API | `backend/src/handlers/analytics.ts` | No rate limiting on analytics endpoints — DoS risk |
| M-19 | Frontend | `frontend/components/VirtualKeyboard.tsx` lines 188-211 | Missing useEffect dependencies — stale closures |
| M-20 | Frontend | `frontend/services/apiBase.ts` lines 74-94 | `isTokenExpiringSoon` actually checks if token is expired (no buffer), defeating proactive refresh |
| M-21 | Frontend | `frontend/services/transactionService.ts` lines 119-124 | `updateMultipleTabs` uses non-atomic `Promise.all` — partial updates on failure |
| M-22 | Frontend | Multiple services | 30+ duplicated fetch/error/notify patterns across mutation functions |
| M-23 | Frontend | `frontend/services/consumptionService.ts` lines 30-32 | No error handling — unhandled promise rejection crashes consuming component |
| M-24 | Config | `frontend/vite.config.ts` lines 8, 51 | Hardcoded `loadEnv('development')` and hardcoded LAN IP `192.168.1.241` |
| M-25 | Config | `backend/Dockerfile` lines 40, 67 | `npm install` runs twice; dev dependencies included in production image |
| M-26 | Config | `frontend/nginx.conf` lines 28-34 | `if` inside location block — nginx "If Is Evil" anti-pattern |
| M-27 | Types | `shared/types.ts` lines 205-211 | `DailyClosing.summary` type has `totalSales` but actual data has `grossSales/netSales/totalDiscounts` |
| M-28 | Validation | `backend/src/handlers/customerHandler.ts` | VAT/phone/postal code validation not comprehensive |
| M-29 | Middleware | `backend/src/middleware/rateLimiter.ts` | No custom `keyGenerator` — behind reverse proxy, all requests share same IP-based limit |
| M-30 | Services | `frontend/services/apiBase.ts` line 192 | `export let subscribers` allows external reassignment of mutable array |
| M-31 | Services | `frontend/services/costManagementService.ts` | Hardcoded English error messages, not using i18n |

---

## LOW (24 issues)

| # | Area | File | Issue |
|---|------|------|-------|
| L-01 | Auth | `backend/src/middleware/auth.ts` line 54 | JWT `iat` claim extracted without validating it is a number |
| L-02 | Auth | `backend/src/middleware/auth.ts` line 36 | No JWT format validation before verification attempt |
| L-03 | Auth | `backend/src/middleware/auth.ts` lines 83-94 | All JWT errors return same generic message — poor UX for expired vs invalid |
| L-04 | Auth | `backend/src/middleware/authorization.ts` lines 40, 91, 111, 144 | Inconsistent role comparison (`'ADMIN' \|\| 'Admin'`) — should use helper |
| L-05 | Auth | `backend/src/middleware/authorization.ts` lines 50, 125, 152, 192 | Uses `console.error` instead of structured logger |
| L-06 | Schema | `backend/prisma/schema.prisma` | Missing composite indexes for common query patterns (status+createdAt) |
| L-07 | Schema | `backend/prisma/schema.prisma` | Missing length constraints on String fields (names, reasons) |
| L-08 | Schema | `backend/prisma/schema.prisma` | Nullable fields with defaults (`isFavourite Boolean? @default(false)`) |
| L-09 | Frontend | `frontend/components/LoginScreen.tsx` lines 45-64 | Error catch uses `err: any` instead of proper type narrowing |
| L-10 | Frontend | `frontend/components/PaymentModal.tsx` line 110 | Error message lacks `role="alert"` — screen readers won't announce it |
| L-11 | Frontend | `frontend/components/OrderPanel.tsx` lines 57-59 | Quantity buttons lack ARIA labels and `type="button"` |
| L-12 | Frontend | `frontend/components/LoginScreen.tsx` lines 82-101 | Login inputs lack proper labels and ARIA attributes |
| L-13 | Frontend | `frontend/components/TransactionHistory.tsx` line 442 | Hardcoded "Void Transaction" text — not internationalized |
| L-14 | Frontend | `frontend/components/TransactionHistory.tsx` line 132 | Hardcoded `window.location.href = '/login'` instead of React Router navigation |
| L-15 | Frontend | `frontend/components/ReceiptManagement.tsx` | 1076+ line component — should be split into sub-components |
| L-16 | Frontend | `frontend/components/ReceiptManagement.tsx` | Extensive `(receipt as any)` type casting throughout |
| L-17 | Frontend | `frontend/components/CustomerSelectionModal.tsx` line 181 | `null as any` type cast bypasses TypeScript safety |
| L-18 | Frontend | `frontend/services/transactionService.ts` lines 69, 81 | Debug `console.log` logs full tab data (potential sensitive data exposure) |
| L-19 | Frontend | `frontend/services/geminiService.ts`, `tokenRefresh.ts` | Dead code files — contain only "Dead code removed" comment |
| L-20 | Config | `backend/src/middleware/errorHandler.ts` lines 405-410 | `getClientIp` doesn't handle IPv6-mapped IPv4 addresses |
| L-21 | Config | `backend/src/index.ts` line 166 | PORT parsing without NaN guard |
| L-22 | Config | `frontend/tsconfig.json` vs `backend/tsconfig.json` | Mismatched targets (ES2015 vs ES2020) |
| L-23 | Types | `shared/types.ts` lines 226, 230 | `Table.items` and `Table.tabs` typed as `any[]` |
| L-24 | Perf | `frontend/components/TransactionHistory.tsx` lines 97-98 | Date objects created inside sort comparison — O(n log n) Date allocations |

---

## CODE SMELLS (16 issues)

| # | File | Issue |
|---|------|-------|
| CS-01 | `backend/src/handlers/` | Date validation logic duplicated across 8+ handlers — extract shared utility |
| CS-02 | `frontend/services/*.ts` | All mutation functions duplicate identical fetch/error/notify pattern — create `makeMutationRequest()` helper |
| CS-03 | `frontend/services/*.ts` | GET operations use `makeApiRequest` (timeout, dedup, auth) but mutations use raw `fetch` (no timeout protection) |
| CS-04 | `shared/types.ts` vs `backend/src/types.ts` | 14 interfaces defined twice with divergent shapes — canonical source is ambiguous |
| CS-05 | `backend/src/handlers/receiptHandler.ts` | Receipt retry allows admin retry without audit logging |
| CS-06 | `backend/src/middleware/responseSanitizer.ts` | Entire file is dead code (only a comment) |
| CS-07 | `backend/prisma/schema.prisma` | Denormalized `userName`, `tillName` on Transaction — document as intentional snapshots or remove |
| CS-08 | `frontend/utils/formatting.ts` vs `frontend/utils/money.ts` | Two currency formatting functions with different behavior — consolidate |
| CS-09 | `backend/Dockerfile` | Single-stage build with dev dependencies in production image |
| CS-10 | `backend/src/utils/logger.ts` / `backend/src/middleware/authorization.ts` | Mixed logging: structured logger vs `console.error` |
| CS-11 | `frontend/components/*.tsx` | No error boundaries implemented — any component error crashes entire app |
| CS-12 | `frontend/contexts/` | 12 context providers — consider consolidating related state |
| CS-13 | `backend/src/handlers/` | Missing idempotency on customer creation, product creation, category creation |
| CS-14 | `backend/prisma/schema.prisma` | Settings model uses String for time fields (`autoStartTime`, `businessDayEndHour`) |
| CS-15 | `frontend/services/apiBase.ts` | `subscribers` array mutated during iteration in `notifyUpdates()` |
| CS-16 | `backend/src/services/analyticsService.ts` | Fetches all transactions without pagination — unbounded memory usage |

---

## Prioritized Remediation Plan

### Week 1 — Critical Security & Financial Fixes

| Priority | Issue | Effort |
|----------|-------|--------|
| 1 | C-02: Add authentication to orderActivityLogs endpoints | 10 min |
| 2 | C-05: Remove plaintext passwords from shared code | 30 min |
| 3 | C-06: Fix daily closing discount double-counting | 15 min |
| 4 | C-04: Fix nginx security header inheritance | 1 hr |
| 5 | C-03: Remove duplicate CORS from nginx | 30 min |
| 6 | C-07: Remove db from external network | 5 min |
| 7 | C-08: Replace raw math in receipt tax calculations | 2 hrs |
| 8 | C-01: Apply CSRF middleware to state-changing routes | 1 hr |

### Week 2 — High Priority

| Priority | Issue | Effort |
|----------|-------|--------|
| 1 | H-05: Fail fast on database connection failure | 15 min |
| 2 | H-04: Remove source maps from production build | 15 min |
| 3 | H-01: Fix mass assignment in user update | 1 hr |
| 4 | H-06: Consolidate divergent type definitions | 4 hrs |
| 5 | H-08: Stop swallowing GET errors in frontend services | 3 hrs |
| 6 | H-15: Run backend container as non-root user | 30 min |
| 7 | H-07: Fix receipt number peek hardcoding | 30 min |

### Month 1 — Medium Priority

- Fix inclusive tax divisor inconsistency (M-08)
- Add pagination to list endpoints (M-15)
- Add file content validation for uploads (M-01)
- Fix `isTokenExpiringSoon` to actually check expiration buffer (M-20)
- Standardize response formats (M-16)
- Add missing database indexes (M-11)
- Eliminate 30+ duplicated fetch patterns in frontend services (M-22)

### Quarter 1 — Low Priority & Code Smells

- Extract shared date validation utility (CS-01)
- Create `makeMutationRequest` helper (CS-02)
- Consolidate duplicate currency formatters (CS-08)
- Implement error boundaries (CS-11)
- Add ARIA labels for accessibility (L-10, L-11, L-12)
- Refactor ReceiptManagement into sub-components (CS-15)
- Convert String fields to enums in schema (M-12)

---

**Methodology:** All findings were identified through systematic source code analysis across 8 audit domains: database schema (767 lines), backend handlers (22 files), backend services (20 files), backend middleware (7 files), frontend components (88 files, top 15 analyzed in depth), frontend services (19 files), shared code and infrastructure configuration (12 files), and financial calculation correctness (9 files). Each finding includes the exact file location, root cause analysis, impact assessment, and specific code fix.
