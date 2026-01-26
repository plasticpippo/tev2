import axios from 'axios';

// Test script to verify the layout saving fix
async function testLayoutSaving() {
  const baseUrl = 'http://192.168.1.241:3001/api';
  
  console.log('Testing layout saving functionality...');
  
  try {
    // First, try to authenticate
    console.log('\n1. Authenticating as admin...');
    const authResponse = await axios.post(`${baseUrl}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = authResponse.data.token;
    console.log('✓ Authentication successful');
    
    // Headers with authentication
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test 1: Try to save layout for a regular category
    console.log('\n2. Testing layout save for regular category (categoryId: 1)...');
    try {
      const regularCategoryResponse = await axios.post(
        `${baseUrl}/layouts/till/1/category/1`,
        {
          positions: [
            { variantId: 1, gridColumn: 1, gridRow: 1 },
            { variantId: 2, gridColumn: 2, gridRow: 1 }
          ]
        },
        { headers }
      );
      console.log('✓ Regular category layout save successful:', regularCategoryResponse.status);
    } catch (error: any) {
      console.log('✗ Regular category layout save failed:', error.response?.data || error.message);
    }
    
    // Test 2: Try to save layout for Favourites category (categoryId: -1)
    console.log('\n3. Testing layout save for Favourites category (categoryId: -1)...');
    try {
      const favouritesResponse = await axios.post(
        `${baseUrl}/layouts/till/1/category/-1`,
        {
          positions: [
            { variantId: 1, gridColumn: 1, gridRow: 1 },
            { variantId: 3, gridColumn: 2, gridRow: 1 }
          ]
        },
        { headers }
      );
      console.log('✓ Favourites category layout save successful:', favouritesResponse.status);
    } catch (error: any) {
      console.log('✗ Favourites category layout save failed:', error.response?.data || error.message);
    }
    
    // Test 3: Try to get layout for Favourites category
    console.log('\n4. Testing layout fetch for Favourites category (categoryId: -1)...');
    try {
      const getFavouritesResponse = await axios.get(
        `${baseUrl}/layouts/till/1/category/-1`,
        { headers }
      );
      console.log('✓ Favourites category layout fetch successful:', getFavouritesResponse.status);
      console.log('  Retrieved layouts:', getFavouritesResponse.data.length);
    } catch (error: any) {
      console.log('✗ Favourites category layout fetch failed:', error.response?.data || error.message);
    }
    
    // Test 4: Try to delete layout for Favourites category
    console.log('\n5. Testing layout delete for Favourites category (categoryId: -1)...');
    try {
      const deleteFavouritesResponse = await axios.delete(
        `${baseUrl}/layouts/till/1/category/-1`,
        { headers }
      );
      console.log('✓ Favourites category layout delete successful:', deleteFavouritesResponse.status);
    } catch (error: any) {
      console.log('✗ Favourites category layout delete failed:', error.response?.data || error.message);
    }
    
    console.log('\n✓ All tests completed!');
    
  } catch (error: any) {
    console.error('✗ Authentication or general error:', error.response?.data || error.message);
  }
}

// Run the test
testLayoutSaving().catch(console.error);