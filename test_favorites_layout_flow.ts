import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFavoritesLayoutFlow() {
  console.log('=== Testing Favorites Layout Flow ===\n');
  
  try {
    // Get a till to test with
    const tills = await prisma.till.findMany();
    if (tills.length === 0) {
      console.log('No tills found');
      return;
    }
    
    const tillId = tills[0].id;
    console.log(`Testing with till ID: ${tillId}`);
    
    // Simulate the flow of customizing the favorites layout
    console.log('\n--- Simulating Favorites Layout Customization Flow ---');
    
    // 1. User selects "Favorites" filter type in the UI
    const filterType = 'favorites';
    console.log(`User selects filter type: ${filterType}`);
    
    // 2. UI calls getCurrentLayoutForTillWithFilter(tillId, 'favorites', null)
    console.log('\n2. Retrieving current layout for favorites filter...');
    
    // This simulates the logic in the GET /api/tills/:tillId/current-layout endpoint
    let whereClauseForDefault: any = {
      tillId: tillId,
      isDefault: true,
      filterType: filterType
    };
    
    let layout = await prisma.productGridLayout.findFirst({
      where: whereClauseForDefault
    });
    
    if (layout) {
      console.log(`✓ Found default favorites layout: ID ${layout.id}, Name: "${layout.name}"`);
    } else {
      console.log('No default favorites layout found, would get first layout');
      // Get first layout for favorites if no default exists
      const firstLayout = await prisma.productGridLayout.findFirst({
        where: {
          tillId: tillId,
          filterType: filterType
        },
        orderBy: { createdAt: 'asc' }
      });
      
      if (firstLayout) {
        console.log(`✓ Found first favorites layout: ID ${firstLayout.id}, Name: "${firstLayout.name}"`);
      } else {
        console.log('No favorites layouts exist, would return default/fallback layout');
      }
    }
    
    // 3. User customizes the layout and saves it
    console.log('\n3. Simulating user customizing and saving favorites layout...');
    
    // This is what happens when user saves a customized favorites layout
    const customizedLayoutData = {
      name: 'User Customized Favorites Layout',
      tillId: tillId,
      layout: {
        columns: 4,
        gridItems: [
          { id: 'item-1', variantId: 1, productId: 1, x: 0, y: 0, width: 1, height: 1 },
          { id: 'item-2', variantId: 2, productId: 2, x: 1, y: 0, width: 1, height: 1 }
        ],
        version: '1.0'
      },
      isDefault: false, // User might not set this as default
      filterType: 'favorites',
      categoryId: null
    };
    
    console.log(`Saving new layout: "${customizedLayoutData.name}", filterType: ${customizedLayoutData.filterType}, isDefault: ${customizedLayoutData.isDefault}`);
    
    // Check if this is the first layout for this filter type
    const existingLayoutsForFilter = await prisma.productGridLayout.findMany({
      where: {
        tillId: tillId,
        filterType: customizedLayoutData.filterType
      }
    });
    
    console.log(`Found ${existingLayoutsForFilter.length} existing layouts for filter type '${customizedLayoutData.filterType}'`);
    
    // According to the POST logic in gridLayout.ts, if no layouts exist for this filter type,
    // it would set isDefault = true, but since there are existing layouts, it stays as false
    if (existingLayoutsForFilter.length === 0) {
      console.log('This would be the first layout for this filter type, so it would be made default');
      customizedLayoutData.isDefault = true;
    } else {
      console.log('There are existing layouts for this filter type, so new layout remains non-default');
    }
    
    // 4. Now let's check what happens when user switches to different filter and back
    console.log('\n4. Testing switching between filters and back to favorites...');
    
    // Simulate getting layout for 'all' filter type
    console.log('Getting layout for "all" filter type...');
    const allLayout = await prisma.productGridLayout.findFirst({
      where: {
        tillId: tillId,
        filterType: 'all',
        isDefault: true
      }
    });
    
    if (allLayout) {
      console.log(`✓ Found default "all" layout: ID ${allLayout.id}, Name: "${allLayout.name}"`);
    } else {
      console.log('No default "all" layout found');
    }
    
    // Now go back to favorites - should get the same favorites layout as before
    console.log('\nGoing back to favorites filter type...');
    const favoritesLayoutAfterSwitch = await prisma.productGridLayout.findFirst({
      where: {
        tillId: tillId,
        filterType: 'favorites',
        isDefault: true  // Should still get the default favorites layout
      }
    });
    
    if (favoritesLayoutAfterSwitch) {
      console.log(`✓ Retrieved favorites layout after switching: ID ${favoritesLayoutAfterSwitch.id}, Name: "${favoritesLayoutAfterSwitch.name}"`);
    } else {
      console.log('No default favorites layout found after switching');
    }
    
    // 5. Test the issue scenario: What if user sets a new favorites layout as default?
    console.log('\n5. Testing setting a different favorites layout as default...');
    
    // Find a non-default favorites layout to set as default
    const nonDefaultFavorites = await prisma.productGridLayout.findMany({
      where: {
        tillId: tillId,
        filterType: 'favorites',
        isDefault: false
      }
    });
    
    if (nonDefaultFavorites.length > 0) {
      const layoutToSetAsDefault = nonDefaultFavorites[0];
      console.log(`Setting layout ID ${layoutToSetAsDefault.id} ("${layoutToSetAsDefault.name}") as default for favorites...`);
      
      // This is the logic from the PUT endpoint to set as default
      // First, unset other defaults for the same filter type
      await prisma.productGridLayout.updateMany({
        where: {
          tillId: layoutToSetAsDefault.tillId,
          filterType: 'favorites',
          isDefault: true
        },
        data: { isDefault: false }
      });
      
      // Then set this one as default
      const updatedLayout = await prisma.productGridLayout.update({
        where: { id: layoutToSetAsDefault.id },
        data: { isDefault: true }
      });
      
      console.log(`✓ Layout ID ${updatedLayout.id} is now the default favorites layout`);
      
      // Verify that only one favorites layout is now default
      const defaultFavoritesAfterUpdate = await prisma.productGridLayout.findMany({
        where: {
          tillId: tillId,
          filterType: 'favorites',
          isDefault: true
        }
      });
      
      console.log(`After update, there are ${defaultFavoritesAfterUpdate.length} default favorites layouts`);
      defaultFavoritesAfterUpdate.forEach(layout => {
        console.log(`- ID: ${layout.id}, Name: "${layout.name}"`);
      });
    } else {
      console.log('No non-default favorites layouts available to set as default');
    }
    
    // 6. Check the overall state now
    console.log('\n6. Final state check:');
    
    const allCurrentLayouts = await prisma.productGridLayout.findMany({
      where: { tillId: tillId },
      orderBy: [
        { filterType: 'asc' },
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    });
    
    console.log('All layouts for this till:');
    allCurrentLayouts.forEach(layout => {
      const isDefaultIndicator = layout.isDefault ? ' [DEFAULT]' : '';
      console.log(`- ID: ${layout.id}, Name: "${layout.name}", Filter: ${layout.filterType}, Category: ${layout.categoryId || 'N/A'}${isDefaultIndicator}`);
    });
    
  } catch (error) {
    console.error('Error during testing:', error);
 } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFavoritesLayoutFlow();