import express, { Request, Response } from 'express';
import { SignJWT, jwtVerify } from 'jose';
import { prisma } from '../prisma';
import type { User } from '../types';
import { hashPassword, comparePassword } from '../utils/password';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import { revokeToken, revokeAllUserTokens } from '../services/tokenBlacklistService';
import { validateJwtSecret } from '../utils/jwtSecretValidation';
import { logError, logAuthEvent, logDataAccess, logAuditEvent } from '../utils/logger';
import { toUserDTO, toUserDTOArray, UserResponseDTO } from '../types/dto';
import i18n from '../i18n';

// Validate JWT_SECRET at module load time - fail fast if invalid
validateJwtSecret();

const JWT_SECRET = process.env.JWT_SECRET!;

export const usersRouter = express.Router();

// GET /api/users - Get all users
usersRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    // Transform users to DTOs to exclude sensitive fields
    const userDTOs = toUserDTOArray(users);
    res.json(userDTOs);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching users', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('users.fetchFailed') });
  }
});

// GET /api/users/:id - Get a specific user
usersRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });
    
    if (!user) {
      return res.status(404).json({ error: i18n.t('users.notFound') });
    }
    
    // Transform user to DTO to exclude sensitive fields
    const userDTO = toUserDTO(user);
    res.json(userDTO);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching user', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('users.fetchOneFailed') });
  }
});

// POST /api/users - Create a new user
usersRouter.post('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, username, password, role } = req.body as Omit<User, 'id'> & { password: string };
    
    if (!password) {
      return res.status(400).json({ error: i18n.t('users.passwordRequired') });
    }
    
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    if (existingUser) {
      return res.status(409).json({ error: i18n.t('users.duplicateUsername') });
    }
    
    // Hash the password before storing
    const hashedPassword = await hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        name,
        username,
        password: hashedPassword,
        role
      }
    });
    
    // Log user creation event
    logAuditEvent('USER_CREATED', 'User created via admin', {
      role: user.role,
      correlationId: (req as any).correlationId,
    }, 'medium', { userId: user.id, username: user.username });
    
    // Transform user to DTO to exclude sensitive fields
    const userDTO = toUserDTO(user);
    res.status(201).json(userDTO);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error creating user', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('users.createFailed') });
  }
});

// PUT /api/users/:id - Update a user
usersRouter.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, username, password, role } = req.body as Omit<User, 'id'> & { password?: string };
    
    const updateData: any = {
      name,
      username,
      role
    };
    
    // Only hash and update password if provided
    if (password) {
      updateData.password = await hashPassword(password);
    }
    
    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData
    });
    
    // Log password change event if password was updated
    if (password) {
      logAuthEvent('PASSWORD_CHANGE', user.id, user.username, true, {
        correlationId: (req as any).correlationId
      });
    }
    
    // Transform user to DTO to exclude sensitive fields
    const userDTO = toUserDTO(user);
    res.json(userDTO);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating user', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('users.updateFailed') });
  }
});

// DELETE /api/users/:id - Delete a user
usersRouter.delete('/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get user info before deletion for logging
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });
    
    if (user) {
      // Log user deletion event
      logDataAccess('user', user.id, 'DELETE', req.user?.id, req.user?.username);
    }
    
    await prisma.user.delete({
      where: { id: Number(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    logError(error instanceof Error ? error : 'Error deleting user', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('users.deleteFailed') });
  }
});

// POST /api/users/login - Login endpoint
usersRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: i18n.t('auth.missingCredentials') });
    }
    
    // Find user by username only
    const user = await prisma.user.findUnique({
      where: {
        username
      }
    });
    
    if (!user) {
      // Log failed login attempt - user not found
      logAuthEvent('FAILED_LOGIN', undefined, username, false, {
        correlationId: (req as any).correlationId,
        reason: 'User not found'
      });
      return res.status(401).json({ error: i18n.t('auth.invalidCredentials') });
    }
    
    // Compare password using bcrypt
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      // Log failed login attempt - invalid password
      logAuthEvent('FAILED_LOGIN', user.id, username, false, {
        correlationId: (req as any).correlationId,
        reason: 'Invalid password'
      });
      return res.status(401).json({ error: i18n.t('auth.invalidCredentials') });
    }
    
    // Generate JWT token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({
      id: user.id,
      username: user.username,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(secret);
    
    // Log successful login
    logAuthEvent('LOGIN', user.id, user.username, true, {
      correlationId: (req as any).correlationId
    });
    
    // Transform user to DTO to exclude sensitive fields
    const userDTO = toUserDTO(user);
    res.json({
      ...userDTO,
      token
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error during login', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('users.loginFailed') });
  }
});

// POST /api/auth/logout - Logout endpoint
usersRouter.post('/auth/logout', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: i18n.t('auth.tokenMissing') });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Get user ID from request (attached by auth middleware)
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: i18n.t('auth.userNotFound') });
    }

    // Decode the JWT to get the expiration time
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Extract expiration time from the JWT payload
    const expiresAt = payload.exp ? new Date(payload.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Revoke the token using the token blacklist service
    await revokeToken(token, userId.toString(), expiresAt);
    
    // Log logout event
    logAuthEvent('LOGOUT', userId, req.user?.username, true, {
      correlationId: (req as any).correlationId
    });

    // Return success response
    res.status(200).json({ message: i18n.t('api.success.logoutSuccess') });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error during logout', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('users.logoutFailed') });
  }
});

// POST /api/auth/revoke-all - Revoke all tokens for a user (admin only)
usersRouter.post('/auth/revoke-all', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: i18n.t('users.userIdRequired') });
    }
    
    // Revoke all tokens for the target user
    await revokeAllUserTokens(userId.toString());
    
    // Return success response
    res.status(200).json({ message: i18n.t('users.tokensRevoked') });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error revoking all tokens', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('users.revokeFailed') });
  }
});

export default usersRouter;