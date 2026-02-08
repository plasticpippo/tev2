import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { isTokenRevoked } from '../services/tokenBlacklistService';
import { validateJwtSecret } from '../utils/jwtSecretValidation';
import { logAuthEvent, logSecurityAlert } from '../utils/logger';
import '../types'; // Import types to extend Express Request interface

// Validate JWT_SECRET at module load time - fail fast if invalid
validateJwtSecret();

const JWT_SECRET = process.env.JWT_SECRET!;

export interface TokenPayload {
  id: number;
  username: string;
  role: string;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token from Authorization header (Bearer token format)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Log authentication failure - missing token
      logAuthEvent('FAILED_LOGIN', undefined, undefined, false, {
        correlationId: (req as any).correlationId,
        reason: 'Missing or invalid Authorization header',
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      // Log authentication failure - empty token
      logAuthEvent('FAILED_LOGIN', undefined, undefined, false, {
        correlationId: (req as any).correlationId,
        reason: 'Empty token',
        path: req.path,
        method: req.method
      });
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verify the token using jose library
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Check if the token has been revoked
    const revoked = await isTokenRevoked(token);
    if (revoked) {
      // Log authentication failure - revoked token
      logSecurityAlert(
        'REVOKED_TOKEN',
        'Attempted access with revoked token',
        {
          correlationId: (req as any).correlationId,
          userId: payload.id,
          username: payload.username,
          path: req.path,
          method: req.method
        },
        'high'
      );
      return res.status(401).json({ error: 'Token has been revoked. Please login again.' });
    }

    // Attach decoded user info to req.user
    req.user = {
      id: payload.id as number,
      username: payload.username as string,
      role: payload.role as string
    };

    next();
  } catch (error) {
    // Log authentication failure - invalid or expired token
    logAuthEvent('FAILED_LOGIN', undefined, undefined, false, {
      correlationId: (req as any).correlationId,
      reason: 'Invalid or expired token',
      path: req.path,
      method: req.method,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    // Return 403 if token is invalid
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};
