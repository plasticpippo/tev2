import { prisma, closePrisma } from '../prisma';
import { cleanupExpiredTokens } from '../services/tokenBlacklistService';

async function main() {
  try {
    console.log('Starting cleanup of expired tokens...');
    
    const deletedCount = await cleanupExpiredTokens();
    
    console.log(`Successfully deleted ${deletedCount} expired token(s)`);
    
    await closePrisma();
    process.exit(0);
  } catch (error) {
    console.error('Error during token cleanup:', error);
    await closePrisma();
    process.exit(1);
  }
}

main();
