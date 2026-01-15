import axios from 'axios';

const BASE_URL = 'http://localhost:3001/api';

async function testDeleteNotFound() {
  try {
    console.log('Testing DELETE layout endpoint with non-existent layout ID...');
    
    // Try to delete a layout that doesn't exist
    console.log('Attempting to delete non-existent layout ID 999999...');
    const deleteResponse = await axios.delete(`${BASE_URL}/grid-layouts/999999`);
    console.log('Delete response status:', deleteResponse.status);
    
  } catch (error: any) {
    console.log('Expected error when deleting non-existent layout:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
  }
  
  // Also test with an invalid layout ID format
  try {
    console.log('\nTesting DELETE layout endpoint with invalid layout ID format...');
    const deleteResponse = await axios.delete(`${BASE_URL}/grid-layouts/invalid`);
    console.log('Delete response status:', deleteResponse.status);
    
  } catch (error: any) {
    console.log('Expected error when deleting with invalid layout ID:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
  }
}

testDeleteNotFound();