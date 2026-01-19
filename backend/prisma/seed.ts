import { PrismaClient } from '@prisma/client';
import { User } from '../src/types';

const prisma = new PrismaClient();

const INITIAL_USERS: User[] = [
  { id: 1, name: 'Admin User', username: 'admin', password_HACK: 'admin123', role: 'Admin' },
  { id: 2, name: 'Cashier User', username: 'cashier', password_HACK: 'cashier123', role: 'Cashier' },
];

async function seedDatabase() {
  try {
    console.log('Checking for essential data in database...');

    // Check if essential data already exists
    const userCount = await prisma.user.count();
    const tillCount = await prisma.till.count();
    const categoryCount = await prisma.category.count();
    const settingsCount = await prisma.settings.count();

    // Only seed essential data if none exists
    if (userCount === 0) {
      console.log('Seeding users...');
      
      // Create users
      const users = await Promise.all(
        INITIAL_USERS.map((user) =>
          prisma.user.create({
            data: {
              name: user.name,
              username: user.username,
              password_HACK: user.password_HACK,
              role: user.role,
            },
          })
        )
      );
      console.log('Created users:', users.length);
    } else {
      console.log(`Users already exist (${userCount}), skipping user seeding`);
    }

    if (tillCount === 0) {
      console.log('Seeding tills...');
      
      // Create tills
      const tills = await Promise.all([
        prisma.till.create({
          data: { name: 'Main Bar' },
        }),
        prisma.till.create({
          data: { name: 'Patio' },
        }),
      ]);
      console.log('Created tills:', tills.length);
    } else {
      console.log(`Tills already exist (${tillCount}), skipping till seeding`);
    }

    if (categoryCount === 0) {
      console.log('Seeding categories...');
      
      // Create categories
      const categories = await Promise.all([
        prisma.category.create({
          data: {
            name: 'Red Wine',
            visibleTillIds: [] // JSON field with empty array
          },
        }),
        prisma.category.create({
          data: {
            name: 'Beer',
            visibleTillIds: [1] // Visible only on Main Bar
          },
        }),
        prisma.category.create({
          data: {
            name: 'Cocktails',
            visibleTillIds: [] // Visible on all
          },
        }),
      ]);
      console.log('Created categories:', categories.length);
    } else {
      console.log(`Categories already exist (${categoryCount}), skipping category seeding`);
    }

    if (settingsCount === 0) {
      console.log('Seeding settings...');
      
      // Create settings
      await prisma.settings.create({
        data: {
          taxMode: 'exclusive',
          autoStartTime: '06:00',
          lastManualClose: null,
        },
      });
      console.log('Created settings');
    } else {
      console.log(`Settings already exist (${settingsCount}), skipping settings seeding`);
    }

    console.log('Database seeding check completed successfully!');
  } catch (error) {
    console.error('Error checking/seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };