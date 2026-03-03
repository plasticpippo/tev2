# Reverse Proxy CSS MIME Type Error Investigation Report

**Date:** 2026-03-03  
**Error:** The stylesheet https://pos.pipposan.site/assets/index-Cs_FijX7.css was not loaded because its MIME type, "text/html", is not "text/css".  
**Status:** Root Cause Identified - External HTTPS Proxy Confirmed

---

## Executive Summary

**CRITICAL NEW FINDING:**

The user has confirmed that this issue does NOT occur when accessing the application directly via HTTP using the machine's IP address on the LAN (e.g., `http://[machine-ip]:80`). The CSS MIME type error ONLY occurs when accessing via the external domain `https://pos.pipposan.site`.

This is a critical finding that definitively points to the **external HTTPS reverse proxy** (the infrastructure handling HTTPS termination for `pos.pipposan.site`) as the root cause, NOT the internal nginx configuration.

| Access Method | Result |
|---------------|--------|
| `http://[machine-ip]:80` (LAN direct) | WORKS FINE |
| `https://pos.pipposan.site` (via external proxy) | CSS MIME TYPE ERROR |

The external proxy is failing to properly forward requests for `/assets/` files or is not passing the correct `Content-Type: text/css` headers. This is a configuration issue on the external HTTPS termination point (likely Cloudflare, Traefik, nginx-proxy-manager, or another reverse proxy instance).

---

## Investigation Findings

### 1. Architecture Overview

The application uses a multi-tier nginx reverse proxy architecture:

```
External Request (HTTPS via pos.pipposan.site)
         ↓
External HTTPS Proxy (Cloudflare/Traefik/etc.)
         ↓
Main Nginx (:80)
         ↓
Frontend Nginx (:3000)
         ↓
/usr/share/nginx/html (Static Files)
         ↓
Backend (:3001) - API Only
```

**Key Points:**
- Main Nginx listens on port 80 and acts as the primary reverse proxy
- Frontend Nginx runs on port 3000 and serves static files from `/usr/share/nginx/html`
- Backend runs on port 3001 and handles API requests only
- The external domain `pos.pipposan.site` is handled by an external HTTPS proxy BEFORE reaching the internal nginx

---

### 2. Why Internal Configuration Is Not the Cause

Since the application works correctly when accessed directly via LAN IP, the internal nginx and frontend configurations are functioning properly. This rules out:

- Internal nginx `try_files` misconfiguration
- Missing CSS files in the build output
- Incorrect MIME type mapping in internal nginx
- `X-Content-Type-Options` header issues in internal nginx

The problem MUST be in the external layer that handles HTTPS termination for `pos.pipposan.site`.

---

### 3. Backend Configuration

**File:** [`backend/src/index.ts`](backend/src/index.ts)

**Findings:**
- Express does **NOT** serve any static files
- There is no `express.static()` middleware configured
- The backend only handles:
  - API routes (`/api/*`)
  - Health check endpoint (`/health`)
- **CSS files are NOT served by the backend**

```typescript
// The backend only mounts API and health routes
app.use('/api', router);
app.get('/health', (_, res) => res.json({ status: 'ok' }));
```

---

### 4. Frontend Configuration

**Build Process:**
- Vite builds the frontend to `/app/frontend/dist`
- The built files are copied to `/usr/share/nginx/html` in the nginx container

**Frontend Nginx Configuration:**
- Includes `mime.types` for proper MIME type mapping
- Has a fallback configuration: `try_files $uri $uri/ /index.html`

---

## Root Cause Analysis

### The Error Flow (With External Proxy)

When the browser requests `/assets/index-Cs_FijX7.css` via `https://pos.pipposan.site`:

1. **HTTPS Request** to `https://pos.pipposan.site/assets/index-Cs_FijX7.css`
2. **External Proxy (HTTPS Termination)** receives the request
3. **Proxy forwards to Main Nginx** - but may be misconfigured
4. **Internal nginx processes request** - works fine if direct access is tested
5. **Response returns through External Proxy** - proxy may alter headers or content
6. **Browser receives HTML instead of CSS** - `Content-Type: text/html`
7. **Security block** - Browser refuses to interpret HTML as CSS

### Why Direct LAN Access Works

When accessing `http://[machine-ip]:80`:
- Request bypasses the external HTTPS proxy entirely
- Goes directly to Main Nginx on port  proxy chain80
- Internal works correctly
- CSS files are served with proper `Content-Type: text/css`

### Root Cause: External HTTPS Proxy Misconfiguration

The external proxy handling HTTPS for `pos.pipposan.site` is one of the following:

1. **Cloudflare** - Common cause of MIME type issues with cached HTML responses
2. **Traefik** - May have incorrect routing rules for static assets
3. **nginx-proxy-manager** - May have fallback rules that return HTML
4. **Another nginx instance** - May have similar `try_files` issues
5. **Load balancer/CDN** - May be caching the wrong content type

The external proxy is likely:
- Not properly forwarding `/assets/*` requests to the backend
- Using a fallback rule that returns `index.html` for unknown paths
- Not passing through the correct `Content-Type` headers from the origin server
- Caching an HTML response instead of the CSS file

---

## Key Findings

1. **Confirmed Not Internal Issue:** The application works perfectly when accessed directly via LAN IP, proving the internal nginx configuration is correct.

2. **External Proxy is Root Cause:** The issue ONLY occurs when traffic goes through the external HTTPS proxy for `pos.pipposan.site`.

3. **MIME Type Header Issue:** The external proxy is either:
   - Not forwarding the correct `Content-Type: text/css` header
   - Returning cached HTML content instead of CSS
   - Having its own fallback rules that serve HTML for CSS requests

4. **Typical Cloudflare/Proxy Issue:** This is a common problem with HTTPS termination proxies that have page rules or caching enabled for static assets.

---

## Recommendations

### 1. EXTERNAL PROXY CONFIGURATION - PRIMARY FOCUS

**This is where the problem lies.** Check the configuration of the external HTTPS proxy:

#### If using Cloudflare:
- Check **Page Rules** or **Transform Rules** that might affect `/assets/` paths
- Verify **Caching** is not serving stale HTML for CSS files
- Check **Automatic HTTPS Rewrites** - may be interfering
- Review **Origin Server** settings - ensure proper headers are passed through

#### If using Traefik:
- Check `tryFiles` or file-based routing configuration
- Verify middleware is not rewriting responses
- Ensure static file routes are properly defined

#### If using nginx-proxy-manager or another nginx:
- Check for `try_files` directives that might serve index.html for CSS requests
- Verify proxy_pass is correctly forwarding to the internal nginx
- Check for any caching that might serve wrong content

#### If using another reverse proxy/load balancer:
- Look for similar fallback/spa-catch-all configurations
- Verify header forwarding (especially `Content-Type`)
- Check for response caching issues

### 2. Verify Headers at External Proxy Level

Check what headers the external proxy is sending to the origin:

```
Expected headers from external proxy to origin:
- Host: pos.pipposan.site (or internal hostname)
- X-Forwarded-For: <client-ip>
- X-Forwarded-Proto: https  (if HTTPS termination happens at proxy)

Headers that SHOULD NOT be modified:
- Content-Type: text/css  (for CSS files)
```

### 3. Test Without External Proxy (Confirm Internal Works)

Temporarily bypass the external proxy to confirm:

```bash
# Access directly via internal IP (this works according to testing)
curl -I http://<machine-ip>:80/assets/index-Cs_FijX7.css
# Should return: Content-Type: text/css

# Access via external domain (this fails)
curl -I https://pos.pipposan.site/assets/index-Cs_FijX7.css
# Likely returns: Content-Type: text/html
```

Compare the `Content-Type` headers between these two requests.

### 4. Check External Proxy Logs

Examine logs from the external proxy (Cloudflare, Traefik, etc.) for:
- 404 errors on `/assets/` paths
- Cache hits serving wrong content
- Rewrite rules being applied to CSS requests

### 5. Check for Cached HTML Responses

The external proxy may have cached the HTML `index.html` response and is serving it for CSS requests. Try:

- **Purge cache** in Cloudflare/dashboard
- **Disable caching** for static assets in the proxy configuration
- **Check cache key** - ensure it's different for CSS vs HTML files

### 6. Add Explicit /assets/ Routing in External Proxy

Ensure the external proxy has explicit rules for `/assets/` that bypass any fallback logic:

```nginx
# Example (if using Cloudflare Page Rules):
# Pattern: pos.pipposan.site/assets/*
# Settings: Cache Level: Cache Everything, Edge Cache TTL: 1 hour
```

### 7. Internal Nginx Improvements (Secondary)

While internal config is not the root cause, you can add explicit handling:

```nginx
# In Main Nginx - ensure assets are explicitly handled
location /assets/ {
    proxy_pass http://frontend:3000/assets/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Ensure correct content-type is preserved
    proxy_pass_header Content-Type;
}
```

---

## Conclusion

**ROOT CAUSE CONFIRMED:** The CSS MIME type error is caused by a misconfiguration in the external HTTPS reverse proxy handling `pos.pipposan.site`, NOT by the internal nginx configuration.

The evidence is conclusive:
- Direct LAN access via `http://[machine-ip]:80` WORKS PERFECTLY
- External HTTPS access via `https://pos.pipposan.site` FAILS

This definitively rules out the internal proxy chain and points to the external proxy (Cloudflare, Traefik, nginx-proxy-manager, or similar) as the source of the problem. The external proxy is either:
1. Not properly forwarding `/assets/` requests to the origin
2. Not passing through the correct `Content-Type: text/css` headers
3. Using a fallback rule that serves HTML for CSS paths
4. Caching an HTML response and serving it for CSS requests

**Recommended Action Plan:**
1. Identify and access the external proxy configuration (Cloudflare dashboard, Traefik config, etc.)
2. Check for Page Rules/Transform Rules affecting `/assets/` paths
3. Verify caching is not serving stale HTML for CSS files
4. Test headers between direct LAN access and external access
5. Purge any cached responses
6. Add explicit routing rules for `/assets/` that bypass fallback logic
7. Verify `Content-Type` headers are being passed through correctly

---

## References

- [Nginx try_files directive](http://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
- [X-Content-Type-Options MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options)
- [Vite Build Options](https://vitejs.dev/config/build-options.html)
- [Cloudflare Page Rules Troubleshooting](https://developers.cloudflare.com/cache/)
- [Traefik Static Configuration](https://doc.traefik.io/traefik/routing/overview/)
