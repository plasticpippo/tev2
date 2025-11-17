import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCurrentLayoutEndpoint() {
  try {
    console.log('Testing current layout endpoint functionality...');

    // First, get a till ID
    const firstTill = await prisma.till.findFirst();
    if (!firstTill) {
      throw new Error('No till available for testing');
    }

    // Check if there are any categories in the database
    const categories = await prisma.category.findMany({ take: 1 });
    let categoryIdToUse = null;
    if (categories.length > 0) {
      categoryIdToUse = categories[0].id;
    } else {
      console.log('No categories found, creating a test category...');
      const testCategory = await prisma.category.create({
        data: {
          name: 'Test Category'
        }
      });
      categoryIdToUse = testCategory.id;
    }

    // Create test layouts with different filter types and set one as default for each type
    const layoutAll = await prisma.productGridLayout.create({
      data: {
        tillId: firstTill.id,
        name: 'All Products Default Layout',
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        isDefault: true, // This will be the default for 'all' filter type
        filterType: 'all',
        categoryId: null
      }
    });

    const layoutFavorites = await prisma.productGridLayout.create({
      data: {
        tillId: firstTill.id,
        name: 'Favorites Default Layout',
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        isDefault: true, // This will be the default for 'favorites' filter type
        filterType: 'favorites',
        categoryId: null
      }
    });

    const layoutCategory = await prisma.productGridLayout.create({
      data: {
        tillId: firstTill.id,
        name: 'Category Default Layout',
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        isDefault: true, // This will be the default for 'category' filter type
        filterType: 'category',
        categoryId: categoryIdToUse
      }
    });

    console.log('Created test layouts with defaults:', {
      layoutAll: { id: layoutAll.id, filterType: layoutAll.filterType, isDefault: layoutAll.isDefault },
      layoutFavorites: { id: layoutFavorites.id, filterType: layoutFavorites.filterType, isDefault: layoutFavorites.isDefault },
      layoutCategory: { id: layoutCategory.id, filterType: layoutCategory.filterType, isDefault: layoutCategory.isDefault, categoryId: layoutCategory.categoryId }
    });

    // Test retrieving the default layout for each filter type
    // This simulates what the /current-layout endpoint would do
    const defaultLayoutAll = await prisma.productGridLayout.findFirst({
      where: {
        tillId: firstTill.id,
        isDefault: true,
        filterType: 'all'
      }
    });
    console.log('Default layout for "all" filter:', defaultLayoutAll?.id);

    const defaultLayoutFavorites = await prisma.productGridLayout.findFirst({
      where: {
        tillId: firstTill.id,
        isDefault: true,
        filterType: 'favorites'
      }
    });
    console.log('Default layout for "favorites" filter:', defaultLayoutFavorites?.id);

    const defaultLayoutCategory = await prisma.productGridLayout.findFirst({
      where: {
        tillId: firstTill.id,
        isDefault: true,
        filterType: 'category'
      }
    });
    console.log('Default layout for "category" filter:', defaultLayoutCategory?.id);

    // Verify that each default layout matches what we expect
    if (defaultLayoutAll && defaultLayoutAll.id === layoutAll.id) {
      console.log('✓ Default layout for "all" filter type retrieved correctly');
    } else {
      console.log('✗ Default layout for "all" filter type not retrieved correctly');
    }

    if (defaultLayoutFavorites && defaultLayoutFavorites.id === layoutFavorites.id) {
      console.log('✓ Default layout for "favorites" filter type retrieved correctly');
    } else {
      console.log('✗ Default layout for "favorites" filter type not retrieved correctly');
    }

    if (defaultLayoutCategory && defaultLayoutCategory.id === layoutCategory.id) {
      console.log('✓ Default layout for "category" filter type retrieved correctly');
    } else {
      console.log('✗ Default layout for "category" filter type not retrieved correctly');
    }

    // Clean up: delete the test layouts
    await prisma.productGridLayout.deleteMany({
      where: {
        id: { in: [layoutAll.id, layoutFavorites.id, layoutCategory.id] }
      }
    });

    console.log('✓ Test layouts cleaned up successfully');

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCurrentLayoutEndpoint();