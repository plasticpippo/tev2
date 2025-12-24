import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateNullVisibleTillIds() {
  try {
    console.log('Updating categories with null visibleTillIds...');

    // Use raw SQL query to update null values to empty JSON array
    const result = await prisma.$executeRaw`UPDATE categories SET "visibleTillIds" = '[]' WHERE "visibleTillIds" IS NULL`;
    
    console.log(`Updated ${result} categories with null visibleTillIds to empty array.`);
    // Verify the update by checking how many records still have null values
    const nullCheckResult = await prisma.$queryRaw<Array<{count: bigint}>>`SELECT COUNT(*) FROM categories WHERE "visibleTillIds" IS NULL`;
    const remainingNullCategories = Number(nullCheckResult[0].count);
    
    console.log(`Remaining categories with null visibleTillIds: ${remainingNullCategories}`);
    
    if (remainingNullCategories === 0) {
      console.log('Successfully updated all categories with null visibleTillIds!');
    } else {
      console.log('Some categories still have null visibleTillIds.');
    }

  } catch (error) {
    console.error('Error updating categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  updateNullVisibleTillIds();
}

export { updateNullVisibleTillIds };
