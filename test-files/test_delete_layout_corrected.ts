import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function testDeleteLayoutCorrected() {
  try {
    console.log('Testing DELETE layout endpoint...');
    
    // First, check existing tills
    console.log('1. Fetching existing tills...');
    const tillsResponse = await axios.get(`${BASE_URL}/tills`);
    console.log('Available tills:', tillsResponse.data);
    
    // Use the first available till ID
    const tillId = tillsResponse.data[0].id;
    console.log(`Using till ID: ${tillId}`);
    
    // Create a layout to test with
    console.log('2. Creating a test layout...');
    const layoutData = {
      name: 'Test Delete Layout',
      layout: {
        columns: 4,
        gridItems: [],
        version: '1.0'
      },
      isDefault: false,
      filterType: 'all',
      categoryId: null
    };
    
    const createResponse = await axios.post(`${BASE_URL}/grid-layouts/tills/${tillId}/grid-layouts`, layoutData);
    console.log('Created layout with ID:', createResponse.data.id);
    const layoutId = createResponse.data.id;
    
    // Verify the layout was created
    console.log('3. Verifying layout exists...');
    const getResponse = await axios.get(`${BASE_URL}/grid-layouts/${layoutId}`);
    console.log('Retrieved layout:', getResponse.data.name);
    
    // Now try to delete the layout
    console.log('4. Attempting to delete layout...');
    const deleteResponse = await axios.delete(`${BASE_URL}/grid-layouts/${layoutId}`);
    console.log('Delete response status:', deleteResponse.status);
    console.log('Layout deleted successfully');
    
    // Try to get the layout again to confirm it's gone
    console.log('5. Verifying layout is deleted...');
    try {
      const getDeletedResponse = await axios.get(`${BASE_URL}/grid-layouts/${layoutId}`);
      console.log('ERROR: Layout still exists after deletion:', getDeletedResponse.data);
    } catch (getError: any) {
      if (getError.response?.status === 404) {
        console.log('SUCCESS: Layout properly deleted (404 when trying to retrieve it)');
      } else {
        console.log('Unexpected error when trying to retrieve deleted layout:', getError.response?.data || getError.message);
      }
    }
    
  } catch (error: any) {
    console.error('Error during layout deletion test:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testDeleteLayoutCorrected();