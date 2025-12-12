import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugGridLayouts() {
  console.log('=== Debugging Grid Layout Persistence ===\n');
  
  try {
    // Get all tills
    const tills = await prisma.till.findMany();
    console.log('Available Tills:', tills.map(t => ({ id: t.id, name: t.name })));
    
    if (tills.length === 0) {
      console.log('No tills found in database');
      return;
    }
    
    // Get all grid layouts for the first till
    const tillId = tills[0].id;
    console.log(`\nChecking layouts for till ID: ${tillId}`);
    
    const allLayouts = await prisma.productGridLayout.findMany({
      where: { tillId: tillId },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('\nAll layouts for this till:');
    allLayouts.forEach(layout => {
      console.log(`- ID: ${layout.id}, Name: ${layout.name}, FilterType: ${layout.filterType}, CategoryId: ${layout.categoryId}, IsDefault: ${layout.isDefault}`);
    });
    
    // Check layouts specifically for favorites filter type
    console.log('\nChecking layouts for favorites filter type:');
    const favoriteLayouts = await prisma.productGridLayout.findMany({
      where: { 
        tillId: tillId,
        filterType: 'favorites'
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log('Favorites layouts:');
    favoriteLayouts.forEach(layout => {
      console.log(`- ID: ${layout.id}, Name: ${layout.name}, IsDefault: ${layout.isDefault}`);
    });
    
    // Check default layout for favorites
    console.log('\nChecking default layout for favorites:');
    const defaultFavoriteLayout = await prisma.productGridLayout.findFirst({
      where: { 
        tillId: tillId,
        filterType: 'favorites',
        isDefault: true
      }
    });
    
    console.log('Default favorites layout:', defaultFavoriteLayout ? 
      { id: defaultFavoriteLayout.id, name: defaultFavoriteLayout.name } : 
      'No default favorites layout found');
    
    // Check if there are any layouts without filterType (should be 'all' by default now)
    console.log('\nChecking layouts without filterType (should be empty):');
    const layoutsNoFilterType = await prisma.productGridLayout.findMany({
      where: { 
        tillId: tillId,
        filterType: null
      }
    });
    
    console.log('Layouts without filterType:', layoutsNoFilterType.map(l => ({ id: l.id, name: l.name })));
    
    // Test the current layout retrieval logic for favorites
    console.log('\nTesting current layout retrieval for favorites:');
    
    // First try to get the default layout for favorites
    const defaultLayoutForFavorites = await prisma.productGridLayout.findFirst({
      where: {
        tillId: tillId,
        filterType: 'favorites',
        isDefault: true
      }
    });
    
    console.log('Default layout for favorites:', defaultLayoutForFavorites ? 
      { id: defaultLayoutForFavorites.id, name: defaultLayoutForFavorites.name } : 
      'No default layout found for favorites');
    
    // If no default, get the first layout for favorites
    if (!defaultLayoutForFavorites) {
      const firstLayoutForFavorites = await prisma.productGridLayout.findFirst({
        where: {
          tillId: tillId,
          filterType: 'favorites'
        },
        orderBy: { createdAt: 'asc' }
      });
      
      console.log('First layout for favorites (if no default):', firstLayoutForFavorites ? 
        { id: firstLayoutForFavorites.id, name: firstLayoutForFavorites.name } : 
        'No layout found for favorites');
    }
    
    // Test category layouts if any exist
    console.log('\nChecking category layouts:');
    const categoryLayouts = await prisma.productGridLayout.findMany({
      where: { 
        tillId: tillId,
        filterType: 'category'
      }
    });
    
    console.log('Category layouts:', categoryLayouts.map(l => ({ 
      id: l.id, 
      name: l.name, 
      categoryId: l.categoryId 
    })));
    
    // Get all categories for reference
    const categories = await prisma.category.findMany();
    console.log('\nAvailable categories:', categories.map(c => ({ id: c.id, name: c.name })));
    
  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug function
debugGridLayouts();