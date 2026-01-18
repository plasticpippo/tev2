import { 
  createGridLayout, 
  getAllLayouts, 
  getLayoutById, 
  updateGridLayout, 
  deleteGridLayout,
  setLayoutAsDefault 
} from '../frontend/services/gridLayoutService';

// Comprehensive test for all CRUD operations of grid layout functionality
async function testGridCrudOperations() {
  console.log('Starting Grid Layout CRUD Operations Test...');
  
  // Test data for creating a new layout
  const testLayout = {
    name: 'Test Layout - CRUD Operations',
    layoutData: [
      { id: '1', name: 'Product 1', x: 0, y: 0, width: 1, height: 1 },
      { id: '2', name: 'Product 2', x: 1, y: 0, width: 1, height: 1 }
    ],
    filterType: 'all',
    filterCategoryId: null,
    shared: true
  };

  try {
    console.log('\n1. Testing CREATE operation...');
    // Test Create operation
    const createdLayout = await createGridLayout(testLayout);
    console.log('✓ Create operation successful:', createdLayout);
    
    if (!createdLayout || !createdLayout.id) {
      throw new Error('Failed to create layout - no ID returned');
    }
    
    const layoutId = createdLayout.id;
    console.log(`Created layout with ID: ${layoutId}`);

    console.log('\n2. Testing READ (getAll) operation...');
    // Test Read operation (get all)
    const allLayouts = await getAllLayouts();
    console.log('✓ Read (getAll) operation successful. Total layouts:', allLayouts.length);
    
    // Verify our created layout is in the list
    const foundLayout = allLayouts.find(layout => layout.id === layoutId);
    if (!foundLayout) {
      throw new Error('Created layout not found in get all layouts response');
    }
    console.log('✓ Created layout found in get all layouts response');

    console.log('\n3. Testing READ (getById) operation...');
    // Test Read operation (get by ID)
    const retrievedLayout = await getLayoutById(layoutId);
    console.log('✓ Read (getById) operation successful:', retrievedLayout);
    
    if (!retrievedLayout || retrievedLayout.id !== layoutId) {
      throw new Error('Failed to retrieve the created layout by ID');
    }

    console.log('\n4. Testing UPDATE operation...');
    // Test Update operation
    const updatedLayoutData = {
      ...testLayout,
      name: 'Updated Test Layout - CRUD Operations',
      layoutData: [
        ...testLayout.layoutData,
        { id: '3', name: 'Product 3', x: 2, y: 0, width: 1, height: 1 }
      ]
    };
    
    const updatedLayout = await updateGridLayout(layoutId, updatedLayoutData);
    console.log('✓ Update operation successful:', updatedLayout);
    
    if (!updatedLayout || updatedLayout.id !== layoutId || updatedLayout.name !== updatedLayoutData.name) {
      throw new Error('Update operation failed - layout not properly updated');
    }

    console.log('\n5. Testing SET AS DEFAULT operation...');
    // Test Set as Default operation
    const defaultResult = await setLayoutAsDefault(layoutId);
    console.log('✓ Set as default operation successful:', defaultResult);

    console.log('\n6. Testing DELETE operation...');
    // Test Delete operation
    const deleteResult = await deleteGridLayout(layoutId);
    console.log('✓ Delete operation successful:', deleteResult);

    // Verify the layout was deleted
    try {
      const deletedLayout = await getLayoutById(layoutId);
      if (deletedLayout) {
        throw new Error('Delete operation failed - layout still exists after deletion');
      }
    } catch (error: any) {
      // Expected behavior - trying to get a deleted layout should fail
      if (error.message.includes('Not Found') || error.status === 404) {
        console.log('✓ Delete operation confirmed - layout no longer exists');
      } else {
        // Re-throw if it's a different error
        throw error;
      }
    }

    console.log('\n✓ All CRUD operations tested successfully!');
    console.log('✓ Create, Read, Update, and Delete operations are working correctly');
    console.log('✓ Set as default functionality is working correctly');
    
  } catch (error) {
    console.error('✗ Error during CRUD operations test:', error);
    throw error;
  }
}

// Run the test
testGridCrudOperations()
  .then(() => {
    console.log('\n🎉 Grid Layout CRUD Operations Test Completed Successfully!');
  })
  .catch((error) => {
    console.error('\n❌ Grid Layout CRUD Operations Test Failed:', error);
    process.exit(1);
  });
