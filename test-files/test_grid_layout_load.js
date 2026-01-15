import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testLayoutLoad() {
  try {
    console.log('Testing layout load functionality with filterType...');

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

    // Create test layouts with different filter types
    const layoutAll = await prisma.productGridLayout.create({
      data: {
        tillId: firstTill.id,
        name: 'All Products Layout',
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        isDefault: false,
        filterType: 'all',
        categoryId: null
      }
    });

    const layoutFavorites = await prisma.productGridLayout.create({
      data: {
        tillId: firstTill.id,
        name: 'Favorites Layout',
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        isDefault: false,
        filterType: 'favorites',
        categoryId: null
      }
    });

    const layoutCategory = await prisma.productGridLayout.create({
      data: {
        tillId: firstTill.id,
        name: 'Category Layout',
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

    console.log('Created test layouts:', {
      layoutAll: { id: layoutAll.id, filterType: layoutAll.filterType },
      layoutFavorites: { id: layoutFavorites.id, filterType: layoutFavorites.filterType },
      layoutCategory: { id: layoutCategory.id, filterType: layoutCategory.filterType, categoryId: layoutCategory.categoryId }
    });

    // Test retrieving layouts by filter type
    const allLayouts = await prisma.productGridLayout.findMany({
      where: {
        tillId: firstTill.id,
        filterType: 'all'
      }
    });
    console.log('Layouts with filterType "all":', allLayouts.length);

    const favoriteLayouts = await prisma.productGridLayout.findMany({
      where: {
        tillId: firstTill.id,
        filterType: 'favorites'
      }
    });
    console.log('Layouts with filterType "favorites":', favoriteLayouts.length);

    const categoryLayouts = await prisma.productGridLayout.findMany({
      where: {
        tillId: firstTill.id,
        filterType: 'category'
      }
    });
    console.log('Layouts with filterType "category":', categoryLayouts.length);

    // Verify that the filtering works correctly
    const allLayoutIds = allLayouts.map(l => l.id);
    const favoriteLayoutIds = favoriteLayouts.map(l => l.id);
    const categoryLayoutIds = categoryLayouts.map(l => l.id);

    if (allLayoutIds.includes(layoutAll.id) && 
        !allLayoutIds.includes(layoutFavorites.id) && 
        !allLayoutIds.includes(layoutCategory.id)) {
      console.log('✓ FilterType "all" filtering works correctly');
    } else {
      console.log('✗ FilterType "all" filtering failed');
    }

    if (favoriteLayoutIds.includes(layoutFavorites.id) && 
        !favoriteLayoutIds.includes(layoutAll.id) && 
        !favoriteLayoutIds.includes(layoutCategory.id)) {
      console.log('✓ FilterType "favorites" filtering works correctly');
    } else {
      console.log('✗ FilterType "favorites" filtering failed');
    }

    if (categoryLayoutIds.includes(layoutCategory.id) && 
        !categoryLayoutIds.includes(layoutAll.id) && 
        !categoryLayoutIds.includes(layoutFavorites.id)) {
      console.log('✓ FilterType "category" filtering works correctly');
    } else {
      console.log('✗ FilterType "category" filtering failed');
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
testLayoutLoad();