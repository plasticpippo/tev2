import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function hashExistingPasswords() {
  try {
    console.log('Fetching users...');
    const users = await prisma.user.findMany();
    
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      console.log(`Processing user: ${user.username}`);
      
      // Check if password is already hashed (bcrypt hashes start with $2b$)
      if (user.password.startsWith('$2b$')) {
        console.log(`  Password already hashed, skipping`);
        continue;
      }
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      console.log(`  Hashed password: ${hashedPassword.substring(0, 20)}...`);
      
      // Update the user with hashed password
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });
      
      console.log(`  Updated user ${user.username}`);
    }
    
    console.log('All passwords have been hashed successfully!');
  } catch (error) {
    console.error('Error hashing passwords:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

hashExistingPasswords();
