import { prisma } from '../prisma';
import { createHash } from 'crypto';

/**
 * Hash a token using SHA-256
 * @param token - The token to hash
 * @returns The SHA-256 hash of the token as a hexadecimal string
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Revoke a token by storing its hash in the RevokedToken table
 * @param token - The JWT token to revoke
 * @param userId - The ID of the user who owns the token
 * @param expiresAt - The expiration date of the token
 */
export async function revokeToken(token: string, userId: string, expiresAt: Date): Promise<void> {
  const tokenDigest = hashToken(token);
  
  await prisma.revokedToken.create({
    data: {
      tokenDigest,
      userId: parseInt(userId, 10),
      expiresAt,
    },
  });
}

/**
 * Check if a token has been revoked
 * @param token - The JWT token to check
 * @param userId - Optional user ID to check tokensRevokedAt field
 * @param tokenIssuedAt - Optional token issued-at timestamp to compare with tokensRevokedAt
 * @returns True if the token is revoked, false otherwise
 */
export async function isTokenRevoked(
  token: string,
  userId?: number,
  tokenIssuedAt?: Date
): Promise<boolean> {
  const tokenDigest = hashToken(token);
  
  // Check individual token revocation
  const revokedToken = await prisma.revokedToken.findUnique({
    where: {
      tokenDigest,
    },
  });
  
  if (revokedToken !== null) {
    return true;
  }
  
  // Check bulk token revocation via tokensRevokedAt
  if (userId && tokenIssuedAt) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tokensRevokedAt: true }
    });
    
    if (user?.tokensRevokedAt && tokenIssuedAt < user.tokensRevokedAt) {
      return true;
    }
  }
  
  return false;
}

/**
 * Revoke all tokens for a specific user
 * @param userId - The ID of the user whose tokens should be revoked
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await prisma.user.update({
    where: {
      id: parseInt(userId, 10),
    },
    data: {
      tokensRevokedAt: new Date(),
    },
  });
}

/**
 * Delete all expired tokens from the RevokedToken table
 * @returns The count of deleted records
 */
export async function cleanupExpiredTokens(): Promise<number> {
  const result = await prisma.revokedToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  
  return result.count;
}
