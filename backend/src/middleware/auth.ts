import { Request, Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import '../types'; // Import types to extend Express Request interface

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-for-development-only';

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
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Verify the token using jose library
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    // Attach decoded user info to req.user
    req.user = {
      id: payload.id as number,
      username: payload.username as string,
      role: payload.role as string
    };

    next();
  } catch (error) {
    // Return 403 if token is invalid
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};
