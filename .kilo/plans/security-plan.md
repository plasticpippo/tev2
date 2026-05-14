# Security Overhaul Plan

## Context

This plan addresses all confirmed security vulnerabilities found across the TEV2 POS application (backend, frontend, nginx, Docker). The existing security reports in `security/` are **outdated** — several issues they flag (plain-text passwords, no token revocation) are already resolved. This plan focuses exclusively on **current, verified** findings.

**Architecture**: A [Pangolin](https://pangolin.net) reverse proxy sits **in front of nginx** to provide identity-aware access, automatic TLS, and zero-trust networking. The POS app retains its own JWT auth as a second defense layer (defense in depth). The deployment may run on the same LAN or via Newt tunnel across the internet.

```
Internet → Pangolin (TLS, auth, WireGuard tunnel) → nginx → frontend/backend → db
   LAN   → Pangolin (local site)                   → nginx → frontend/backend → db
```

Pangolin handles:
- Automatic SSL/TLS with Let's Encrypt (replaces manual cert management)
- Outer authentication gate (SSO, MFA, PIN, email OTP, shareable links)
- Identity-aware access control with RBAC (users, roles, geo-blocking, IP rules)
- WireGuard tunneling for remote access via Newt sites
- Health checks and failover
- Traefik-based reverse proxy with security headers

The app's own JWT auth serves as the **inner** authentication layer. Users authenticate with Pangolin first, then with the app's login.

---

## Already Resolved (from old reports)

These are implemented and working — no action needed:
- Password hashing via bcrypt (10 rounds) — `backend/src/utils/password.ts`
- Token blacklist service — `backend/src/services/tokenBlacklistService.ts`
- JWT secret validation at startup (min 64 chars) — `backend/src/utils/jwtSecretValidation.ts`
- Centralized error handler (no stack traces in production) — `backend/src/middleware/errorHandler.ts`
- Audit logging with sensitive data redaction — `backend/src/utils/logger.ts`
- Helmet security headers — `backend/src/index.ts:176`
- CORS origin validation — `backend/src/index.ts:31-145`
- DTO-based user responses (password stripped) — `backend/src/handlers/users.ts`
- Backend not exposed to host (only via nginx reverse proxy) — `docker-compose.yml`

---

## Phase 0: Pangolin Integration (New)

This phase covers the Pangolin deployment itself. It should be done first because it provides an immediate outer security layer (TLS + auth gate) that mitigates several risks while the deeper fixes are implemented.

### 0.1 Deploy Pangolin Server

**Priority**: FOUNDATIONAL
**What**: Install and configure Pangolin. Can be self-hosted (Community Edition) or use Pangolin Cloud.
**Steps**:
1. Follow the [quick install guide](https://docs.pangolin.net/self-host/quick-install) for self-hosting, or sign up at [app.pangolin.net](https://app.pangolin.net) for cloud
2. Configure a domain (e.g., `pos.example.com`) and point DNS to the Pangolin server
3. Pangolin/Traefik will automatically provision Let's Encrypt TLS certificates

### 0.2 Create a Site and Resource for the POS App

**Priority**: FOUNDATIONAL
**What**: Define the POS application as a Pangolin resource so it is accessible through Pangolin's reverse proxy.
**Steps**:
1. Create a **site**:
   - **Same server/LAN**: Use a "local" site (no tunneling needed, Traefik routes directly to nginx)
   - **Remote network**: Install Newt connector on the POS server, creating a WireGuard-tunneled site
2. Create a **public resource** pointing to the nginx container:
   - Type: HTTPS (Pangolin handles TLS termination)
   - Target: `nginx:80` (or the appropriate internal address)
   - Domain: `pos.example.com`
3. Enable **Pangolin auth** on the resource (this is the outer authentication gate)
4. Configure access rules: assign users/roles who should have access

### 0.3 Configure Authentication Policies

**Priority**: HIGH
**What**: Set up Pangolin's outer authentication layer.
**Steps**:
1. Create users in Pangolin (or connect an external identity provider — Google, Azure, OIDC)
2. Assign roles (e.g., `admin`, `cashier`) in Pangolin
3. Optionally enable **MFA** for all users
4. Optionally configure **geo-blocking** to restrict access by country
5. Optionally configure **session length** limits

### 0.4 Update CORS and Environment Variables

**Priority**: HIGH (required for Pangolin routing to work)
**Files**: `.env`, `backend/src/index.ts`, `docker-compose.yml`
**What**: Update the app's CORS origin to include the Pangolin domain, and update environment URLs.
**Steps**:
1. Update `CORS_ORIGIN` in `.env` to include `https://pos.example.com` (alongside any LAN origins for direct access)
2. Update `URL` in `.env` to the Pangolin domain
3. Ensure `credentials: 'include'` continues to work across the Pangolin proxy (Pangolin/Traefik forwards cookies and headers transparently)

### 0.5 Restrict Nginx to Accept Traffic Only from Pangolin/Traefik

**Priority**: HIGH
**Files**: `nginx/nginx.conf`
**What**: Once Pangolin is the entry point, nginx should not accept direct connections from untrusted sources.
**Steps**:
1. If using Docker networking: nginx only needs to be on `internal-network` (no `external-network`)
2. If Pangolin is on the same Docker network: nginx can restrict by `allow`/`deny` directives to only accept from the Traefik/Pangolin container IP range
3. If on the same host without Docker: bind nginx to `127.0.0.1` only and let Pangolin proxy to localhost

### Security Benefits Immediately Gained by Phase 0

| Risk | Mitigation |
|------|-----------|
| No TLS/SSL (Phase 2.6) | Pangolin auto-provisions Let's Encrypt certs |
| Unauthenticated endpoints exposed to internet | Pangolin auth gate blocks unauthenticated users before they reach the app |
| No MFA | Pangolin supports MFA at the outer gate |
| No geo-blocking | Pangolin supports geo-blocking |
| No audit logging of access attempts | Pangolin logs all authentication events, request logs, and admin actions |
| Nginx security headers not applied (Phase 1.2) | Pangolin/Traefik applies security headers at the reverse proxy layer |

---

## Phase 1: Critical Fixes

### 1.1 Apply CSRF Middleware to Request Pipeline

**Severity**: CRITICAL
**Files**: `backend/src/index.ts`, `backend/src/middleware/csrf.ts`
**Problem**: `csrfMiddleware` is fully implemented but never imported or applied. CSRF tokens are generated on login and sent as cookies, but the validation middleware is not in the Express pipeline. All state-changing requests (POST/PUT/DELETE) are unprotected.
**Fix**: Import and apply `csrfMiddleware` in `index.ts` before the API router, after the general rate limiter.

### 1.2 Fix Nginx Security Header Inheritance

**Severity**: CRITICAL (reduced to HIGH with Pangolin, which adds outer security headers)
**Files**: `nginx/nginx.conf`
**Problem**: Nginx's `add_header` directive does **not inherit** into `location` blocks that define their own `add_header`. All 6 security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, CSP, Permissions-Policy) defined at server block level are silently dropped for every location that has its own `add_header` — which is all of them (`/`, `/api/`, `/health`, `/uploads/`).
**Fix**: Use the `more_set_headers` directive from `ngx_http_headers_more_module` (available in `nginx:alpine` as `headers-more-nginx-module`), or duplicate all security headers into every location block that contains `add_header`.
**Note**: Pangolin/Traefik adds security headers at the outer proxy layer, providing defense in depth. However, the inner nginx should also apply headers correctly for direct LAN access scenarios where Pangolin is not in the path.

### 1.3 Run All Containers as Non-Root

**Severity**: CRITICAL
**Files**: `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`
**Problem**: No Dockerfile has a `USER` directive. Backend runs Node.js as root; frontend runtime (nginx:alpine) runs as root. If the app is compromised, the attacker has root inside the container.
**Fix**:
- Backend: Add `USER node` after the build steps (node:20-alpine already creates a `node` user)
- Frontend: Add `USER nginx` in the runtime stage
- docker-compose.yml: Add `user: "node"` / `user: "nginx"` to each service

### 1.4 Remove Database from External Network

**Severity**: CRITICAL
**Files**: `docker-compose.yml`
**Problem**: The `db` service is on both `internal-network` and `external-network`. Only `nginx` needs external network access to serve traffic (and with Pangolin, even nginx only needs `internal-network` if Pangolin is on the same Docker network).
**Fix**: Remove `- external-network` from the `db` service networks.

---

## Phase 2: High-Priority Fixes

### 2.1 Apply Auth Rate Limiter to Login Endpoint

**Severity**: HIGH
**Files**: `backend/src/index.ts` or `backend/src/router.ts`
**Problem**: `authRateLimit` (20 requests/15min per IP) is defined at `index.ts:157-163` but never applied. The login endpoint `POST /api/users/login` only has the general 2000/15min limiter, allowing brute-force attempts.
**Fix**: Apply `authRateLimit` to the login route specifically, either in the router or via a path-specific middleware in index.ts.
**Note**: Pangolin provides outer rate limiting and failed-auth logging, but the app should also protect its own login endpoint.

### 2.2 Secure Unauthenticated Endpoints

**Severity**: HIGH (mitigated to MEDIUM with Pangolin auth gate, but still needed for LAN-only access)
**Files**: `backend/src/handlers/settings.ts`, `backend/src/router.ts`
**Problem**: `GET /api/settings/business-day-status` requires no authentication and exposes scheduler config. Health endpoints (`/health`, `/api/health`, `/api/health/pdfs`, `/api/version`) expose Node version, environment, DB status, and PDF counts.
**Fix**:
- Add `authenticateToken` to business-day-status
- Reduce health endpoint info to a simple `{ status: "ok" }` without version/DB details, or require auth for detailed health

### 2.3 Move JWT Tokens from localStorage to httpOnly Cookies

**Severity**: HIGH
**Files**: `frontend/services/userService.ts`, `frontend/services/apiBase.ts`, `frontend/contexts/SessionContext.tsx`, `backend/src/handlers/users.ts`
**Problem**: JWT tokens are stored in `localStorage`, accessible to any JS on the page. Any XSS vulnerability (even in a dependency) enables token theft.
**Fix**: Backend sets the JWT as an `httpOnly`, `secure`, `sameSite=strict` cookie on login. Frontend stops storing/reading the token from localStorage. All API calls rely on `credentials: 'include'` (already set). Backend auth middleware reads the token from cookies as the primary source, with Authorization header as fallback. Keep 24h token lifetime (refresh tokens deferred to future work).

### 2.4 Add Docker Container Security Hardening

**Severity**: HIGH
**Files**: `docker-compose.yml`
**Problem**: No containers define `security_opt`, `cap_drop`, or `read_only` options.
**Fix**: For each service, add:
```yaml
security_opt:
  - no-new-privileges:true
cap_drop:
  - ALL
read_only: true
tmpfs:
  - /tmp
```
Add `tmpfs` for writable paths as needed (nginx cache, node temp, etc.).

### 2.5 Sanitize SVG Uploads

**Severity**: HIGH
**Files**: `backend/src/middleware/upload.ts`, `backend/src/services/logoUploadService.ts`
**Problem**: SVG is an allowed upload type. SVGs can contain embedded `<script>` tags for XSS. Combined with the `Access-Control-Allow-Origin: *` on `/uploads/`, this is exploitable.
**Fix**: Add server-side SVG sanitization using the existing `isomorphic-dompurify` dependency. Strip `<script>` tags, `on*` event handlers, `javascript:` URLs, and `<iframe>` elements before saving. Apply sanitization in `logoUploadService.ts` after MIME validation.

### 2.6 Restrict Database Port Binding

**Severity**: HIGH
**Files**: `docker-compose.override.yml`, `.gitignore`
**Problem**: Override file exposes Postgres on `0.0.0.0:5432` (all interfaces). The override file is not gitignored.
**Fix**:
- Change port mapping to `127.0.0.1:5432:5432`
- Uncomment `docker-compose.override.yml` in `.gitignore` (line 19)

---

## Phase 3: Medium-Priority Fixes

### 3.1 Standardize Input Validation with Zod

**Severity**: MEDIUM
**Files**: All handlers in `backend/src/handlers/`
**Problem**: Only `customerHandler.ts` and `receiptHandler.ts` use Zod schemas. The rest rely on manual checks or TypeScript types alone (which provide no runtime protection).
**Fix**: Create Zod schemas for all request bodies. Priority order:
1. `users.ts` — user creation/update (username, password, role)
2. `settings.ts` — complex nested settings object
3. `transactions.ts` — payment processing
4. `products.ts` — product CRUD
5. Remaining handlers

### 3.2 Add File Content (Magic Bytes) Validation

**Severity**: MEDIUM
**Files**: `backend/src/middleware/upload.ts`, `backend/src/services/logoUploadService.ts`
**Problem**: Upload validation trusts the `Content-Type` header from the client, which can be spoofed. No file content inspection is performed.
**Fix**: Use `file-type` library or manual magic byte checking to verify the actual file content matches the declared MIME type before accepting the upload.

### 3.3 Encrypt SMTP Password in Database

**Severity**: MEDIUM
**Files**: `backend/src/handlers/settings.ts`, `backend/src/services/settingsService.ts` (or new encryption utility)
**Problem**: SMTP password is stored in plain text in the `Settings` table.
**Fix**: Encrypt with AES-256-GCM using a key derived from `JWT_SECRET` (or a dedicated `ENCRYPTION_KEY` env var). Decrypt on read for sending emails. Mask in API responses (already done).

### 3.4 Replace console.warn/error with Secure Logger

**Severity**: MEDIUM
**Files**: `backend/src/index.ts:123,129,202`, `backend/src/middleware/authorization.ts:50,125,152`, `backend/src/middleware/csrf.ts:189,197,207,215,222`
**Problem**: These files use `console.warn()`/`console.error()` directly, bypassing the Winston logger's sensitive data redaction and log injection prevention.
**Fix**: Import and use the Winston logger in all locations that currently use console.* methods.

### 3.5 Fix Static File CORS Wildcard

**Severity**: MEDIUM
**Files**: `backend/src/index.ts:218`
**Problem**: `/uploads` route sets `Access-Control-Allow-Origin: *`.
**Fix**: Use the same validated CORS origin(s) as the rest of the application, or remove the header entirely (uploads are same-origin by default).

### 3.6 Fix Inconsistent Frontend Error Handling

**Severity**: MEDIUM
**Files**: `frontend/services/userService.ts`, `frontend/services/settingService.ts`, `frontend/services/receiptService.ts`, `frontend/services/tableService.ts`
**Problem**: Several services make direct `fetch()` calls instead of using `makeApiRequest()`, bypassing automatic 401 redirect and timeout handling.
**Fix**: Refactor all services to use `makeApiRequest()` from `apiBase.ts`.

### 3.7 Tighten CSP Policy

**Severity**: MEDIUM
**Files**: `nginx/nginx.conf:125`
**Problem**: CSP includes `'unsafe-inline'` and `'unsafe-eval'` in `script-src`, which negate XSS protection.
**Fix**: Remove `unsafe-eval`. For `unsafe-inline`, use nonce-based CSP:
- Backend generates a random nonce per request
- Inline scripts/styles reference the nonce
- CSP: `script-src 'self' 'nonce-{random}'`

### 3.8 Optionally Read Pangolin Forwarded Headers

**Severity**: MEDIUM (enhancement)
**Files**: `backend/src/middleware/auth.ts` (or new middleware)
**What**: Pangolin forwards user identity headers (`Remote-User`, `Remote-Email`, `Remote-Name`, `Remote-Role`) to backend applications. These can be used for logging, audit correlation, or as supplementary trust signals.
**Fix**:
- Add optional middleware that reads `Remote-*` headers and attaches them to `req.pangolinUser`
- Use for audit logging correlation (link Pangolin user to app user)
- Do NOT use as primary authentication — always validate the app's own JWT
- Validate that these headers are only accepted from trusted proxy IPs (Pangolin/Traefik)

---

## Phase 4: Low-Priority Improvements

### 4.1 Update Outdated Dependencies

**Files**: `backend/package.json`
- `express` 4.18.2 → latest 4.x (4.21+)
- `express-rate-limit` 6.x → 7.x

### 4.2 Clean Up Logger SENSITIVE_FIELDS

**Files**: `backend/src/utils/logger.ts`
- Remove business-critical fields from redaction list (`amount`, `price`, `total`, `balance`)
- Remove nonsensical AI-generated entries (lines 415+)
- Keep genuinely sensitive fields (password, token, secret, etc.)

### 4.3 Fix .env.example JWT Secret Placeholder

**Files**: `backend/.env.example:19`, `.env.example:79`
- Replace `your-secret-key-here` / `your-generated-secret-here` with a note to generate a 64+ char secret
- Add generation command: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 4.4 Normalize Role Comparison

**Files**: `backend/src/middleware/authorization.ts`
- Normalize role to uppercase once at the start of each function instead of checking multiple cases

### 4.5 Remove Unused Dependency

**Files**: `frontend/package.json`
- Remove `@google/genai` (dead code in `geminiService.ts`)

### 4.6 Pin Docker Image Digests

**Files**: `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`
- Pin `node:20-alpine`, `nginx:alpine`, `postgres:15` to specific digests

---

## Implementation Order

| Phase | Tasks | Estimated Effort |
|-------|-------|-----------------|
| **Phase 0** | 0.1-0.5 (Pangolin integration) | 1-2 days |
| **Phase 1** | 1.1-1.4 (Critical) | 2-3 days |
| **Phase 2** | 2.1-2.6 (High) | 3-5 days |
| **Phase 3** | 3.1-3.8 (Medium) | 5-7 days |
| **Phase 4** | 4.1-4.6 (Low) | 1-2 days |

**Total estimated effort**: 12-19 days

---

## Verification Plan

Each phase should be verified before moving to the next:

1. **Phase 0 verification**: Access `https://pos.example.com` in a browser. Verify Pangolin login page appears. After authenticating with Pangolin, verify the POS app loads. Verify TLS certificate is valid. Verify `curl -I https://pos.example.com` shows security headers from Pangolin/Traefik.
2. **Phase 1 verification**: Run `docker compose down -v && docker compose up -d --build`, verify all containers start as non-root (`docker exec whoami`), verify security headers appear in `curl -I` responses through nginx, verify CSRF tokens are validated on POST requests
3. **Phase 2 verification**: Attempt brute-force login (should be rate-limited), verify unauthenticated requests to previously-open endpoints return 401, verify JWT is in httpOnly cookie (not localStorage), verify SVG upload is sanitized, verify DB port only on localhost
4. **Phase 3 verification**: Send malformed input to all endpoints (should be rejected by Zod), upload file with spoofed MIME type (should be rejected), verify SMTP password is encrypted in DB, verify no console.* calls remain, verify Pangolin forwarded headers appear in audit logs
5. **Phase 4 verification**: `npm audit` shows no critical/high vulnerabilities, verify log output contains transaction amounts for debugging

---

## Decisions Made

1. **Reverse proxy**: Pangolin sits **in front of nginx** (does not replace it). Nginx continues handling internal routing.
2. **TLS/SSL**: Handled by Pangolin/Traefik automatically (Let's Encrypt). No manual cert management needed. Removed from Phase 2.
3. **Authentication**: Dual-layer — Pangolin auth (outer gate) + app JWT auth (inner gate). Defense in depth.
4. **Deployment topology**: May be same LAN (local site) or remote (Newt tunnel). Plan supports both.
5. **SVG uploads**: Sanitize server-side with DOMPurify (already a dependency) rather than blocking.
6. **Token storage**: Move to httpOnly cookies only, keep 24h token lifetime. Refresh tokens deferred to future work.
7. **Pangolin forwarded headers**: Read for audit correlation only, NOT for primary authentication.
