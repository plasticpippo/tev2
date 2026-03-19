import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { jwtVerify, SignJWT } from 'jose';
import i18n from '../i18n';

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32; // 32 bytes = 64 hex characters
const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';

// Cookie names: httpOnly for browser auto-send, non-httpOnly for JavaScript access (double-submit)
const CSRF_COOKIE_HTTPONLY = 'XSRF-TOKEN';
const CSRF_COOKIE_ACCESSIBLE = 'XSRF-TOKEN-READ';

const JWT_SECRET = process.env.JWT_SECRET!;

// Cookie options for httpOnly CSRF token (browser auto-send only)
// Using SameSite=lax allows cookies to be sent across ports on the same host
// This is still secure for CSRF protection as browsers won't send lax cookies on cross-site requests
const getCsrfCookieOptionsHttpOnly = (): Record<string, any> => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true, // Prevent XSS from reading CSRF token - browser sends automatically
    secure: isProduction, // Only send over HTTPS in production
    sameSite: 'lax', // Lax allows cookies on same host different ports (e.g., port 80 vs 3001)
    maxAge: 24 * 60 * 60 * 1000, // 24 hours - matches token expiration
    path: '/',
  };
};

// Cookie options for accessible CSRF token (double-submit pattern)
// This cookie IS readable by JavaScript so frontend can read and send as header
const getCsrfCookieOptionsAccessible = (): Record<string, any> => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: false, // JavaScript CAN read this cookie to send as header
    secure: isProduction,
    sameSite: 'lax', // Lax allows cookies on same host different ports (e.g., port 80 vs 3001)
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  };
};

/**
 * Generate a new CSRF token
 * Uses cryptographically secure random bytes
 */
export const generateCsrfToken = (): string => {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
};

/**
 * Send CSRF token to client as signed cookies with SameSite=Strict
 * Called after successful authentication
 * 
 * Uses double-submit pattern with two cookies:
 * 1. httpOnly cookie (browser auto-send, XSS safe)
 * 2. Accessible cookie (JavaScript can read for double-submit)
 * 
 * Both cookies contain the same signed token value. The middleware validates:
 * - The httpOnly cookie is present (browser verification)
 * - The header contains the accessible cookie value (double-submit)
 */
export const sendCsrfToken = async (req: Request, res: Response): Promise<void> => {
  const csrfToken = generateCsrfToken();
  
  // Sign the CSRF token using JWT
  const signedToken = await new SignJWT({ csrf: csrfToken })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(new TextEncoder().encode(JWT_SECRET));
  
  // Set the signed CSRF token as an httpOnly cookie with SameSite=Strict
  // Browser sends this automatically; JavaScript cannot read it (XSS-safe)
  res.cookie(CSRF_COOKIE_HTTPONLY, signedToken, getCsrfCookieOptionsHttpOnly());
  
  // Also set an accessible cookie that JavaScript can read for double-submit
  // This allows the frontend to include the token in request headers
  res.cookie(CSRF_COOKIE_ACCESSIBLE, signedToken, getCsrfCookieOptionsAccessible());
};

/**
 * Parse cookies from header
 */
const parseCookies = (cookieHeader: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  
  if (!cookieHeader) {
    return cookies;
  }
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = decodeURIComponent(rest.join('=').trim());
    }
  });
  
  return cookies;
};

/**
 * Verify signed CSRF token from cookie
 * Returns the original CSRF token if valid, null otherwise
 */
const verifyCsrfToken = async (signedToken: string): Promise<string | null> => {
  try {
    const { payload } = await jwtVerify(signedToken, new TextEncoder().encode(JWT_SECRET));
    return payload.csrf as string;
  } catch (error) {
    return null;
  }
};

/**
 * Extract and validate JWT token from request
 * Returns the user payload if valid, null otherwise
 */
const extractUserFromToken = async (req: Request): Promise<{ id: number; username: string; role: string } | null> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.substring(7);
  
  if (!token) {
    return null;
  }
  
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    return {
      id: payload.id as number,
      username: payload.username as string,
      role: payload.role as string
    };
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
};

/**
 * CSRF middleware to validate tokens on state-changing requests
 * 
 * This middleware:
 * 1. Skips validation for safe methods (GET, HEAD, OPTIONS)
 * 2. Extracts and validates JWT token from Authorization header
 * 3. Validates CSRF token using double-submit pattern:
 *    - Verifies httpOnly cookie is present (browser auto-send)
 *    - Verifies client-submitted header token matches the signed value
 * 
 * Double-submit pattern with signed cookies:
 * - Cookie (httpOnly): Automatically sent by browser, XSS-safe
 * - Header token: Client reads accessible cookie and submits as header
 * - Server validates both match the same signed value
 */
export const csrfMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
	// Skip CSRF validation for safe methods
	const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
	if (safeMethods.includes(req.method)) {
		return next();
	}

	// Extract and validate JWT token to get user info
  const user = await extractUserFromToken(req);
  
  // If no valid JWT token, skip CSRF validation
  // The request will be rejected by authenticateToken middleware later anyway
  if (!user) {
    return next();
  }

  // Get cookies from header
  const cookies = parseCookies(req.headers.cookie || '');
  
  // 1. Check httpOnly cookie is present (browser auto-sends this)
  const signedCsrfTokenCookie = cookies[CSRF_COOKIE_HTTPONLY];
  if (!signedCsrfTokenCookie) {
    // Also check for the accessible cookie as fallback
    const accessibleCookie = cookies[CSRF_COOKIE_ACCESSIBLE];
    console.warn(`CSRF validation failed: No httpOnly CSRF cookie. Path: ${req.path}, Method: ${req.method}. Available cookies: ${Object.keys(cookies).join(', ')}. Fallback cookie found: ${!!accessibleCookie}`);
    res.status(403).json({ error: i18n.t('errors.csrf.noToken') });
    return;
  }

  // 2. Verify the signed token from httpOnly cookie
  const csrfTokenFromCookie = await verifyCsrfToken(signedCsrfTokenCookie);
  if (!csrfTokenFromCookie) {
    console.warn(`CSRF validation failed: Invalid signed token in cookie. Path: ${req.path}, Method: ${req.method}`);
    res.status(403).json({ error: i18n.t('errors.csrf.invalidToken') });
    return;
  }

  // 3. Double-submit: verify the client-submitted header token matches
  // The client reads the accessible cookie and sends it as a header
  const clientTokenHeader = req.headers[CSRF_HEADER_NAME.toLowerCase()] as string | undefined;
  
  if (!clientTokenHeader) {
    console.warn(`CSRF validation failed: No CSRF token in header. Path: ${req.path}, Method: ${req.method}`);
    res.status(403).json({ error: i18n.t('errors.csrf.noToken') });
    return;
  }

  // Verify the client-submitted token
  const csrfTokenFromHeader = await verifyCsrfToken(clientTokenHeader);
  if (!csrfTokenFromHeader) {
    console.warn(`CSRF validation failed: Invalid token in header. Path: ${req.path}, Method: ${req.method}`);
    res.status(403).json({ error: i18n.t('errors.csrf.invalidToken') });
    return;
  }

  // 4. Verify both tokens are equal (double-submit verification)
  if (csrfTokenFromCookie !== csrfTokenFromHeader) {
    console.warn(`CSRF validation failed: Token mismatch. Path: ${req.path}, Method: ${req.method}`);
    res.status(403).json({ error: i18n.t('errors.csrf.invalidToken') });
    return;
  }

  // Token is valid, proceed
  // Attach user info to request for downstream middleware/handlers
  req.user = user;
  return next();
};

/**
 * Refresh the CSRF token
 * Called on token refresh or re-authentication
 */
export const refreshCsrfToken = async (req: Request, res: Response): Promise<void> => {
  await sendCsrfToken(req, res);
};

/**
 * Clear the CSRF tokens from client
 * Called on logout to remove stale tokens
 */
export const clearCsrfToken = (res: Response): void => {
  const cookieOptions = { path: '/' };
  res.clearCookie(CSRF_COOKIE_HTTPONLY, cookieOptions);
  res.clearCookie(CSRF_COOKIE_ACCESSIBLE, cookieOptions);
};

export { CSRF_COOKIE_HTTPONLY, CSRF_COOKIE_ACCESSIBLE, CSRF_HEADER_NAME };
