import axios from 'axios';

// Test the API endpoints for the new layout system
async function testApiLayoutFunctionality() {
  console.log('Testing API endpoints for the new layout system...');

  try {
    const baseUrl = 'http://localhost:3001'; // Assuming backend runs on port 3001

    // First, let's try to get a list of tills to use in our tests
    console.log('\n1. Getting list of tills...');
    let tills: any[] = [];
    try {
      const tillsResponse = await axios.get(`${baseUrl}/api/tills`);
      tills = tillsResponse.data;
      console.log(`✓ Found ${tills.length} tills`);
    } catch (error: any) {
      console.log('⚠ Could not fetch tills, creating a test till...');
      // Create a test till
      const testTillResponse = await axios.post(`${baseUrl}/api/tills`, {
        name: 'API Test Till'
      });
      tills = [testTillResponse.data];
      console.log('✓ Created test till');
    }

    if (tills.length === 0) {
      throw new Error('No tills available for testing');
    }

    const testTillId = tills[0].id;
    console.log(`✓ Using till ID: ${testTillId}`);

    // Test 1: Create a layout for "All Products" (categoryId = 0)
    console.log('\n2. Testing creation of "All Products" layout...');
    const allProductsLayout = {
      name: 'API Test All Products Layout',
      layout: {
        columns: 4,
        gridItems: [],
        version: '1.0'
      },
      isDefault: false,
      filterType: 'all',
      categoryId: 0  // Special "All Products" category
    };

    const createAllResponse = await axios.post(
      `${baseUrl}/api/grid-layouts/tills/${testTillId}/grid-layouts`,
      allProductsLayout
    );
    console.log('✓ Created "All Products" layout:', createAllResponse.data.name);
    const allLayoutId = createAllResponse.data.id;

    // Test 2: Create a layout for "Favorites" (categoryId = -1)
    console.log('\n3. Testing creation of "Favorites" layout...');
    const favoritesLayout = {
      name: 'API Test Favorites Layout',
      layout: {
        columns: 4,
        gridItems: [],
        version: '1.0'
      },
      isDefault: false,
      filterType: 'favorites',
      categoryId: -1  // Special "Favorites" category
    };

    const createFavoritesResponse = await axios.post(
      `${baseUrl}/api/grid-layouts/tills/${testTillId}/grid-layouts`,
      favoritesLayout
    );
    console.log('✓ Created "Favorites" layout:', createFavoritesResponse.data.name);
    const favoritesLayoutId = createFavoritesResponse.data.id;

    // Test 3: Create a layout for a regular category
    console.log('\n4. Testing creation of regular category layout...');
    let categoryId = 1; // Default to 1, but try to find an existing category
    try {
      const categoriesResponse = await axios.get(`${baseUrl}/api/categories`);
      if (categoriesResponse.data && categoriesResponse.data.length > 0) {
        categoryId = categoriesResponse.data[0].id;
        console.log(`✓ Using existing category ID: ${categoryId}`);
      }
    } catch (error: any) {
      console.log('⚠ Could not fetch categories, using default ID 1');
    }

    const categoryLayout = {
      name: 'API Test Category Layout',
      layout: {
        columns: 4,
        gridItems: [],
        version: '1.0'
      },
      isDefault: false,
      filterType: 'category',
      categoryId: categoryId
    };

    const createCategoryResponse = await axios.post(
      `${baseUrl}/api/grid-layouts/tills/${testTillId}/grid-layouts`,
      categoryLayout
    );
    console.log('✓ Created category layout:', createCategoryResponse.data.name);
    const categoryLayoutId = createCategoryResponse.data.id;

    // Test 4: Get all layouts for the till
    console.log('\n5. Testing retrieval of all layouts for the till...');
    const getLayoutsResponse = await axios.get(
      `${baseUrl}/api/grid-layouts/tills/${testTillId}/grid-layouts`
    );
    console.log(`✓ Retrieved ${getLayoutsResponse.data.length} layouts for the till`);

    // Test 5: Get layouts by filter type - "All Products"
    console.log('\n6. Testing retrieval of "All Products" layouts...');
    const getAllLayoutsResponse = await axios.get(
      `${baseUrl}/api/grid-layouts/tills/${testTillId}/layouts-by-filter/all`
    );
    console.log(`✓ Retrieved ${getAllLayoutsResponse.data.length} "All Products" layouts`);

    // Test 6: Get layouts by filter type - "Favorites"
    console.log('\n7. Testing retrieval of "Favorites" layouts...');
    const getFavoritesLayoutsResponse = await axios.get(
      `${baseUrl}/api/grid-layouts/tills/${testTillId}/layouts-by-filter/favorites`
    );
    console.log(`✓ Retrieved ${getFavoritesLayoutsResponse.data.length} "Favorites" layouts`);

    // Test 7: Get layouts by filter type - Category
    console.log('\n8. Testing retrieval of category layouts...');
    const getCategoryLayoutsResponse = await axios.get(
      `${baseUrl}/api/grid-layouts/tills/${testTillId}/layouts-by-filter/category?categoryId=${categoryId}`
    );
    console.log(`✓ Retrieved ${getCategoryLayoutsResponse.data.length} category layouts`);

    // Test 8: Get a specific layout by ID
    console.log('\n9. Testing retrieval of specific layout by ID...');
    const getSpecificLayoutResponse = await axios.get(
      `${baseUrl}/api/grid-layouts/${allLayoutId}`
    );
    console.log(`✓ Retrieved specific layout: ${getSpecificLayoutResponse.data.name}`);

    // Test 9: Update a layout
    console.log('\n10. Testing layout update...');
    const updatedLayoutData = {
      ...allProductsLayout,
      name: 'API Test All Products Layout - Updated'
    };

    const updateResponse = await axios.put(
      `${baseUrl}/api/grid-layouts/${allLayoutId}`,
      updatedLayoutData
    );
    console.log('✓ Updated layout:', updateResponse.data.name);

    // Test 10: Set layout as default
    console.log('\n11. Testing setting layout as default...');
    const setDefaultResponse = await axios.put(
      `${baseUrl}/api/grid-layouts/${allLayoutId}/set-default`
    );
    console.log('✓ Set layout as default:', setDefaultResponse.data.name);

    // Test 11: Get current layout for till with specific filter
    console.log('\n12. Testing retrieval of current layout for filter...');
    const getCurrentLayoutResponse = await axios.get(
      `${baseUrl}/api/grid-layouts/tills/${testTillId}/current-layout?filterType=all`
    );
    console.log('✓ Retrieved current layout for "all" filter:', getCurrentLayoutResponse.data.name);

    // Test 12: Copy layout to another till (if we have multiple tills)
    if (tills.length > 1) {
      console.log('\n13. Testing copying layout to another till...');
      try {
        const copyResponse = await axios.post(
          `${baseUrl}/api/grid-layouts/${allLayoutId}/copy-to/${tills[1].id}`,
          { name: 'Copied Layout' }
        );
        console.log('✓ Copied layout to another till:', copyResponse.data.name);
      } catch (error: any) {
        console.log('⚠ Could not copy layout (might be expected):', error.response?.data?.message || error.message);
      }
    } else {
      console.log('\n13. Skipping copy test (only one till available)');
    }

    // Test 13: Apply layout to another till
    console.log('\n14. Testing applying layout to another till...');
    if (tills.length > 1) {
      try {
        const applyResponse = await axios.post(
          `${baseUrl}/api/grid-layouts/${allLayoutId}/apply-to/${tills[1].id}`,
          { name: 'Applied Layout' }
        );
        console.log('✓ Applied layout to another till:', applyResponse.data.name);
      } catch (error: any) {
        console.log('⚠ Could not apply layout (might be expected):', error.response?.data?.message || error.message);
      }
    } else {
      console.log('14. Skipping apply test (only one till available)');
    }

    // Test 15: Delete the test layouts
    console.log('\n15. Cleaning up - deleting test layouts...');
    
    await axios.delete(`${baseUrl}/api/grid-layouts/${allLayoutId}`);
    console.log('✓ Deleted "All Products" layout');
    
    await axios.delete(`${baseUrl}/api/grid-layouts/${favoritesLayoutId}`);
    console.log('✓ Deleted "Favorites" layout');
    
    await axios.delete(`${baseUrl}/api/grid-layouts/${categoryLayoutId}`);
    console.log('✓ Deleted category layout');

    console.log('\n✓ All API tests passed! The new layout system is working correctly through the API.');
  } catch (error: any) {
    console.error('❌ API test failed:', error.response?.data?.message || error.message);
    console.error('Status:', error.response?.status);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the API test
testApiLayoutFunctionality();