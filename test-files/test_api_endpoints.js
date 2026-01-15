// Comprehensive test for the updated grid layout endpoints
async function testEndpoints() {
  try {
    // Dynamically import axios
    const { default: axios } = await import('axios');
    
    console.log('Testing updated grid layout endpoints...');

    // First, let's check if the API is running
    try {
      const healthResponse = await axios.get('http://localhost:3001/api/health');
      console.log('✓ API health check passed:', healthResponse.data.status);
    } catch (error) {
      console.log('✗ API health check failed:', error.response?.data || error.message);
      return;
    }

    // Test 1: Get all layouts for till 1 (should return empty initially)
    console.log('\n1. Testing get all layouts for till 1...');
    try {
      const layoutsResponse = await axios.get('http://localhost:3001/api/grid-layouts/tills/1/grid-layouts');
      console.log(`✓ Retrieved ${layoutsResponse.data.length} layouts for till 1`);
    } catch (error) {
      console.log('✗ Error retrieving layouts:', error.response?.data || error.message);
    }

    // Test 2: Create a test layout first
    console.log('\n2. Creating a test layout...');
    try {
      const newLayoutData = {
        name: "Test Layout for Endpoint Verification",
        layout: {
          columns: 4,
          gridItems: [
            { id: "1", productId: 1, position: { row: 0, col: 0 } },
            { id: "2", productId: 2, position: { row: 0, col: 1 } }
          ],
          version: '1.0'
        },
        isDefault: false,
        filterType: 'all'
      };
      
      const createResponse = await axios.post('http://localhost:3001/api/grid-layouts/tills/1/grid-layouts', newLayoutData);
      console.log('✓ Test layout created successfully:', createResponse.data.name);
      const testLayoutId = createResponse.data.id;
      console.log(`✓ Test layout ID: ${testLayoutId}`);
      
      // Test 3: Get the layout by ID using the current-layout endpoint with layoutId parameter
      console.log('\n3. Testing current-layout endpoint with layoutId parameter...');
      try {
        const response3 = await axios.get(`http://localhost:3001/api/grid-layouts/tills/1/current-layout?filterType=all&layoutId=${testLayoutId}`);
        console.log('✓ Layout by ID retrieved successfully:', response3.data.name);
      } catch (error) {
        console.log('✗ Error retrieving layout by ID:', error.response?.data || error.message);
      }
      
      // Test 4: Get the layout using the new endpoint
      console.log('\n4. Testing new endpoint: /tills/:tillId/current-layout-with-id/:layoutId...');
      try {
        const response4 = await axios.get(`http://localhost:3001/api/grid-layouts/tills/1/current-layout-with-id/${testLayoutId}`);
        console.log('✓ New endpoint layout retrieval successful:', response4.data.name);
      } catch (error) {
        console.log('✗ Error with new endpoint:', error.response?.data || error.message);
      }
      
      // Test 5: Test backward compatibility - get default layout
      console.log('\n5. Testing backward compatibility (default layout)...');
      try {
        const response5 = await axios.get('http://localhost:3001/api/grid-layouts/tills/1/current-layout?filterType=all');
        console.log('✓ Default layout retrieved (backward compatibility):', response5.data.name);
      } catch (error) {
        console.log('✗ Error retrieving default layout:', error.response?.data || error.message);
      }
      
      // Test 6: Test with filter type parameter
      console.log('\n6. Testing with different filter type...');
      try {
        const response6 = await axios.get(`http://localhost:3001/api/grid-layouts/tills/1/current-layout?filterType=favorites&layoutId=${testLayoutId}`);
        console.log('✓ Layout with filter type retrieved:', response6.data.name);
      } catch (error) {
        console.log('✗ Error with filter type:', error.response?.data || error.message);
      }
      
      // Clean up: Delete the test layout
      console.log('\n7. Cleaning up - deleting test layout...');
      try {
        await axios.delete(`http://localhost:3001/api/grid-layouts/grid-layouts/${testLayoutId}`);
        console.log('✓ Test layout deleted successfully');
      } catch (error) {
        console.log('✗ Error deleting test layout:', error.response?.data || error.message);
      }
      
    } catch (error) {
      console.log('✗ Error creating test layout:', error.response?.data || error.message);
    }

    console.log('\n✓ All endpoint tests completed!');
  } catch (error) {
    console.error('✗ Test suite failed:', error.message);
  }
}

// Run the tests
testEndpoints();