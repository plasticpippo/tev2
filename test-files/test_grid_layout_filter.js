import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLayoutStorage() {
  try {
    console.log('Testing layout storage with filterType and categoryId...');

    // First, check if there are any tills in the database
    const tills = await prisma.till.findMany({ take: 1 });
    if (tills.length === 0) {
      console.log('No tills found in the database. Creating a test till...');
      const testTill = await prisma.till.create({
        data: {
          name: 'Test Till'
        }
      });
      console.log('Created test till:', testTill);
    }

    // Get the first till ID
    const firstTill = await prisma.till.findFirst();
    if (!firstTill) {
      throw new Error('No till available for testing');
    }

    // Check if there are any categories in the database
    const categories = await prisma.category.findMany({ take: 1 });
    let categoryIdToUse = null;
    if (categories.length === 0) {
      console.log('No categories found in the database. Creating a test category...');
      const testCategory = await prisma.category.create({
        data: {
          name: 'Test Category'
        }
      });
      console.log('Created test category:', testCategory);
      categoryIdToUse = testCategory.id;
    } else {
      categoryIdToUse = categories[0].id;
    }

    // Create a test layout with filterType and categoryId
    const testLayout = await prisma.productGridLayout.create({
      data: {
        tillId: firstTill.id,
        name: 'Test Layout',
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        isDefault: false,
        filterType: 'category',
        categoryId: categoryIdToUse
      }
    });

    console.log('Created layout:', testLayout);

    // Retrieve the layout to verify it was stored correctly
    const retrievedLayout = await prisma.productGridLayout.findUnique({
      where: {
        id: testLayout.id
      }
    });

    console.log('Retrieved layout:', retrievedLayout);

    // Verify the fields were stored correctly
    if (retrievedLayout.filterType === 'category' && retrievedLayout.categoryId !== null) {
      console.log('✓ Test passed: filterType and categoryId were stored correctly');
      console.log('Stored filterType:', retrievedLayout.filterType);
      console.log('Stored categoryId:', retrievedLayout.categoryId);
    } else {
      console.log('✗ Test failed: filterType or categoryId not stored correctly');
      console.log('Expected filterType: category, Actual:', retrievedLayout.filterType);
      console.log('Expected categoryId: not null, Actual:', retrievedLayout.categoryId);
    }

    // Clean up: delete the test layout
    await prisma.productGridLayout.delete({
      where: {
        id: testLayout.id
      }
    });

    console.log('✓ Test layout cleaned up successfully');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testLayoutStorage();