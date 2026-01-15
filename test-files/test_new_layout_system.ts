import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNewLayoutSystem() {
 console.log('Testing new layout system functionality...');

  try {
    // 1. Check if special categories exist
    console.log('\n1. Checking special categories...');
    const allProductsCategory = await prisma.category.findUnique({
      where: { id: 0 }
    });
    
    const favoritesCategory = await prisma.category.findUnique({
      where: { id: -1 }
    });
    
    if (!allProductsCategory) {
      console.log('Creating "All Products" special category...');
      await prisma.category.create({
        data: {
          id: 0,
          name: 'All Products'
        }
      });
      console.log('✓ "All Products" category created');
    } else {
      console.log('✓ "All Products" category exists');
    }
    
    if (!favoritesCategory) {
      console.log('Creating "Favorites" special category...');
      await prisma.category.create({
        data: {
          id: -1,
          name: 'Favorites'
        }
      });
      console.log('✓ "Favorites" category created');
    } else {
      console.log('✓ "Favorites" category exists');
    }

    // 2. Test creating layouts with special categories
    console.log('\n2. Testing layout creation with special categories...');
    
    // Find a till to use for testing
    const till = await prisma.till.findFirst();
    if (!till) {
      console.log('No till found, creating one...');
      const newTill = await prisma.till.create({
        data: {
          name: 'Test Till'
        }
      });
      console.log(`✓ Created test till: ${newTill.name}`);
    } else {
      console.log(`✓ Using existing till: ${till.name}`);
    }

    // Test creating a layout for "All Products"
    const allProductsLayout = await prisma.productGridLayout.create({
      data: {
        name: 'Test All Products Layout',
        tillId: till?.id,
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        categoryId: 0, // All Products special category
        filterType: 'all'
      }
    });
    console.log(`✓ Created "All Products" layout: ${allProductsLayout.name}`);

    // Test creating a layout for "Favorites"
    const favoritesLayout = await prisma.productGridLayout.create({
      data: {
        name: 'Test Favorites Layout',
        tillId: till?.id,
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        categoryId: -1, // Favorites special category
        filterType: 'favorites'
      }
    });
    console.log(`✓ Created "Favorites" layout: ${favoritesLayout.name}`);

    // 3. Test retrieving layouts by category
    console.log('\n3. Testing layout retrieval...');
    
    const allLayouts = await prisma.productGridLayout.findMany({
      where: { 
        tillId: till?.id 
      }
    });
    console.log(`✓ Found ${allLayouts.length} layouts for the till`);
    
    const allProductsLayouts = await prisma.productGridLayout.findMany({
      where: { 
        categoryId: 0 // All Products
      }
    });
    console.log(`✓ Found ${allProductsLayouts.length} "All Products" layouts`);
    
    const favoritesLayouts = await prisma.productGridLayout.findMany({
      where: { 
        categoryId: -1 // Favorites
      }
    });
    console.log(`✓ Found ${favoritesLayouts.length} "Favorites" layouts`);

    // 4. Test updating a layout
    console.log('\n4. Testing layout update...');
    
    const updatedLayout = await prisma.productGridLayout.update({
      where: { id: allProductsLayout.id },
      data: {
        name: 'Updated All Products Layout'
      }
    });
    console.log(`✓ Updated layout name to: ${updatedLayout.name}`);

    // 5. Test deleting a layout
    console.log('\n5. Testing layout deletion...');
    
    await prisma.productGridLayout.delete({
      where: { id: favoritesLayout.id }
    });
    console.log('✓ Deleted "Favorites" layout');

    console.log('\n✓ All tests passed! New layout system is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNewLayoutSystem();