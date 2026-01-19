import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSeedingBehavior() {
  console.log('Testing seeding behavior...\n');

  // Count existing records
  const userCount = await prisma.user.count();
  const tillCount = await prisma.till.count();
  const categoryCount = await prisma.category.count();
  const settingsCount = await prisma.settings.count();

  console.log('Current record counts:');
  console.log(`Users: ${userCount}`);
  console.log(`Tills: ${tillCount}`);
  console.log(`Categories: ${categoryCount}`);
  console.log(`Settings: ${settingsCount}`);

  // Show sample data if exists
  if (userCount > 0) {
    const users = await prisma.user.findMany({ take: 5 });
    console.log('\nSample users:');
    users.forEach(user => {
      console.log(`- ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
    });
  }

  if (tillCount > 0) {
    const tills = await prisma.till.findMany({ take: 5 });
    console.log('\nSample tills:');
    tills.forEach(till => {
      console.log(`- ID: ${till.id}, Name: ${till.name}`);
    });
  }

  if (categoryCount > 0) {
    const categories = await prisma.category.findMany({ take: 5 });
    console.log('\nSample categories:');
    categories.forEach(category => {
      console.log(`- ID: ${category.id}, Name: ${category.name}`);
    });
  }

  if (settingsCount > 0) {
    const settings = await prisma.settings.findMany({ take: 5 });
    console.log('\nSample settings:');
    settings.forEach(setting => {
      console.log(`- Tax Mode: ${setting.taxMode}, Auto Start Time: ${setting.autoStartTime}`);
    });
  }

  console.log('\nSeeding behavior test completed.');
}

testSeedingBehavior()
  .catch(e => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });