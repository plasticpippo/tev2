import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function testDeleteLayout() {
  try {
    console.log('Testing DELETE layout endpoint...');
    
    // First, let's try to get all layouts to see what exists
    console.log('1. Fetching existing layouts...');
    const layoutsResponse = await axios.get(`${BASE_URL}/grid-layouts/tills/1/grid-layouts`);
    console.log('Existing layouts:', layoutsResponse.data);
    
    // If there are layouts, try to delete the first one (noting that we can't delete the only layout if it's default)
    if (layoutsResponse.data && layoutsResponse.data.length > 0) {
      // Find a non-default layout to delete (or one where there are other layouts for the till)
      const layoutToDelete = layoutsResponse.data.find((layout: any) => layout.id);
      if (layoutToDelete) {
        console.log(`2. Attempting to delete layout with ID: ${layoutToDelete.id}`);
        const deleteResponse = await axios.delete(`${BASE_URL}/grid-layouts/${layoutToDelete.id}`);
        console.log('Delete response status:', deleteResponse.status);
        console.log('Layout deleted successfully');
      } else {
        console.log('No suitable layout found to delete');
      }
    } else {
      console.log('No layouts found to delete');
    }
  } catch (error: any) {
    console.error('Error during layout deletion test:', error.response?.data || error.message);
  }
}

testDeleteLayout();