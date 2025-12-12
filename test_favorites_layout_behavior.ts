import { PrismaClient } from '@prisma/client';
import { getCurrentLayoutForTillWithFilter } from './frontend/services/gridLayoutService';

const prisma = new PrismaClient();

// Mock the API service to test the actual logic
async function testFavoritesLayoutBehavior() {
  console.log('=== Testing Favorites Layout Behavior ===\n');
  
  try {
    // Get a till to test with
    const tills = await prisma.till.findMany();
    if (tills.length === 0) {
      console.log('No tills found');
      return;
    }
    
    const tillId = tills[0].id;
    console.log(`Testing with till ID: ${tillId}`);
    
    // Test the backend logic directly
    console.log('\n--- Backend Logic Test ---');
    
    // Simulate the getCurrentLayoutForTillWithFilter endpoint logic
    const filterType = 'favorites';
    const categoryId = null;
    
    // First try to get the default layout for the specific filter type
    let whereClauseForDefault: any = {
      tillId: tillId,
      isDefault: true,
      filterType: filterType
    };
    
    // If filtering by category, also filter by categoryId
    if (filterType === 'category' && categoryId !== null && typeof categoryId !== 'undefined') {
      whereClauseForDefault.categoryId = categoryId;
    }
    
    let layout = await prisma.productGridLayout.findFirst({
      where: whereClauseForDefault
    });
    
    console.log('Default layout for favorites:', layout ?
      { id: layout.id, name: layout.name } :
      'No default layout found');
    
    // If no default layout exists for the filter type, get the first layout for that filter type
    if (!layout) {
      let whereClauseForFirst: any = {
        tillId: tillId,
        filterType: filterType
      };
      
      // If filtering by category, also filter by categoryId
      if (filterType === 'category' && categoryId !== null && typeof categoryId !== 'undefined') {
        whereClauseForFirst.categoryId = categoryId;
      }
      
      layout = await prisma.productGridLayout.findFirst({
        where: whereClauseForFirst,
        orderBy: { createdAt: 'asc' }
      });
      
      console.log('First layout for favorites (fallback):', layout ? 
        { id: layout.id, name: layout.name } : 
        'No layout found for favorites');
    }
    
    // Test all favorites layouts to see which one should be retrieved
    console.log('\n--- All Favorites Layouts for this till ---');
    const allFavorites = await prisma.productGridLayout.findMany({
      where: { 
        tillId: tillId,
        filterType: 'favorites'
      },
      orderBy: { createdAt: 'asc' }
    });
    
    allFavorites.forEach((favLayout, index) => {
      console.log(`${index + 1}. ID: ${favLayout.id}, Name: "${favLayout.name}", IsDefault: ${favLayout.isDefault}, Created: ${favLayout.createdAt}`);
    });
    
    // Test the current logic with different filter types
    console.log('\n--- Testing different filter types ---');
    
    // Test 'all' filter type
    const allFilterLayout = await prisma.productGridLayout.findFirst({
      where: {
        tillId: tillId,
        filterType: 'all',
        isDefault: true
      }
    });
    
    console.log('Default "all" layout:', allFilterLayout ? 
      { id: allFilterLayout.id, name: allFilterLayout.name } : 
      'No default "all" layout found');
    
    // Test category filter type
    const categoryLayouts = await prisma.productGridLayout.findMany({
      where: {
        tillId: tillId,
        filterType: 'category'
      }
    });
    
    console.log('Category layouts found:', categoryLayouts.length);
    categoryLayouts.forEach(layout => {
      console.log(`- ID: ${layout.id}, Name: "${layout.name}", CategoryId: ${layout.categoryId}, IsDefault: ${layout.isDefault}`);
    });
    
    // Now let's check if there's a potential issue with layout saving
    console.log('\n--- Checking for potential issues ---');
    
    // Check if multiple layouts are marked as default for the same filter type
    const defaultLayoutsPerFilterType = await prisma.productGridLayout.groupBy({
      by: ['filterType', 'tillId'],
      where: { 
        tillId: tillId,
        isDefault: true
      },
      _count: {
        id: true
      }
    });
    
    console.log('Number of default layouts per filter type:');
    defaultLayoutsPerFilterType.forEach(group => {
      console.log(`- FilterType: ${group.filterType}, TillId: ${group.tillId}, Count: ${group._count.id}`);
    });
    
    // Check specifically for favorites
    const defaultFavorites = await prisma.productGridLayout.findMany({
      where: {
        tillId: tillId,
        filterType: 'favorites',
        isDefault: true
      }
    });
    
    console.log(`\nDefault favorites layouts count: ${defaultFavorites.length}`);
    if (defaultFavorites.length > 1) {
      console.log('ERROR: Multiple default layouts for favorites filter type!');
      defaultFavorites.forEach(layout => {
        console.log(`- ID: ${layout.id}, Name: "${layout.name}"`);
      });
    } else if (defaultFavorites.length === 0) {
      console.log('INFO: No default favorites layout found');
    } else {
      console.log(`INFO: Correctly has 1 default favorites layout: ID ${defaultFavorites[0].id}`);
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
 } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFavoritesLayoutBehavior();