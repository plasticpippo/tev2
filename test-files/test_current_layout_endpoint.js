// Test the updated current layout endpoint with layoutId parameter
async function testCurrentLayoutEndpoint() {
  try {
    // Dynamically import axios
    const { default: axios } = await import('axios');
    
    console.log('Testing updated current layout endpoint...');

    // Test 1: Get default layout (backward compatibility)
    console.log('\n1. Testing default layout retrieval (backward compatibility)...');
    try {
      const response1 = await axios.get('http://localhost:3001/api/grid-layouts/tills/1/current-layout?filterType=all');
      console.log('✓ Default layout retrieved successfully:', response1.data.name);
    } catch (error) {
      console.log('✗ Error retrieving default layout:', error.response?.data || error.message);
    }

    // Test 2: Get layout by specific ID
    console.log('\n2. Testing layout retrieval by specific ID...');
    try {
      // First, let's get all layouts for till 1 to find a valid layout ID
      const layoutsResponse = await axios.get('http://localhost:3001/api/grid-layouts/tills/1/grid-layouts');
      if (layoutsResponse.data && layoutsResponse.data.length > 0) {
        const firstLayoutId = layoutsResponse.data[0].id;
        console.log(`Using layout ID: ${firstLayoutId} for testing...`);
        
        const response2 = await axios.get(`http://localhost:3001/api/grid-layouts/tills/1/current-layout?filterType=all&layoutId=${firstLayoutId}`);
        console.log('✓ Layout by ID retrieved successfully:', response2.data.name);
      } else {
        console.log('No layouts found for testing');
      }
    } catch (error) {
      console.log('✗ Error retrieving layout by ID:', error.response?.data || error.message);
    }

    // Test 3: Get layout by ID using the new endpoint
    console.log('\n3. Testing new endpoint: /tills/:tillId/current-layout-with-id/:layoutId...');
    try {
      // First, let's get all layouts for till 1 to find a valid layout ID
      const layoutsResponse = await axios.get('http://localhost:3001/api/grid-layouts/tills/1/grid-layouts');
      if (layoutsResponse.data && layoutsResponse.data.length > 0) {
        const firstLayoutId = layoutsResponse.data[0].id;
        console.log(`Using layout ID: ${firstLayoutId} for testing new endpoint...`);
        
        const response3 = await axios.get(`http://localhost:3001/api/grid-layouts/tills/1/current-layout-with-id/${firstLayoutId}`);
        console.log('✓ New endpoint layout retrieval successful:', response3.data.name);
      } else {
        console.log('No layouts found for testing');
      }
    } catch (error) {
      console.log('✗ Error with new endpoint:', error.response?.data || error.message);
    }

    // Test 4: Test with category filter type
    console.log('\n4. Testing with category filter type...');
    try {
      const layoutsResponse = await axios.get('http://localhost:3001/api/grid-layouts/tills/1/grid-layouts?filterType=category');
      if (layoutsResponse.data && layoutsResponse.data.length > 0) {
        const categoryLayout = layoutsResponse.data[0];
        console.log(`Using category layout ID: ${categoryLayout.id} for testing...`);
        
        const response4 = await axios.get(`http://localhost:3001/api/grid-layouts/tills/1/current-layout?filterType=category&layoutId=${categoryLayout.id}`);
        console.log('✓ Category layout by ID retrieved successfully:', response4.data.name);
      } else {
        console.log('No category layouts found for testing');
      }
    } catch (error) {
      console.log('✗ Error retrieving category layout by ID:', error.response?.data || error.message);
    }

    console.log('\n✓ All tests completed!');
  } catch (error) {
    console.error('✗ Test suite failed:', error.message);
  }
}

// Run the tests
testCurrentLayoutEndpoint();