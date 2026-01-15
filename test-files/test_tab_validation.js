import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';

// Test credentials
const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Helper function to get auth token
async function getAuthToken() {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/login`, {
      username: ADMIN_USER,
      password: ADMIN_PASSWORD
    });
    // Note: The login endpoint might not return a JWT token in this implementation
    // We'll assume session-based authentication for now
    console.log('✓ Successfully authenticated');
    return true;
  } catch (error) {
    console.error('✗ Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to create a tab
async function createTab(tabData) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    const response = await axios.post(`${API_BASE_URL}/tabs`, tabData, {
      headers,
      validateStatus: (status) => status >= 20 && status < 500 // Don't throw on 4xx errors
    });
    return response;
  } catch (error) {
    if (error.response) {
      // Return the response even if it's an error status
      return error.response;
    } else {
      throw error;
    }
  }
}

// Test cases for tab name validation
async function runTests() {
  console.log('🧪 Starting Tab Name Validation Tests...\n');

  // Authenticate first
 await getAuthToken();

 // Test 1: Try to create a tab with empty name
 console.log('Test 1: Creating tab with empty name');
  try {
    const response = await createTab({
      name: '',
      items: [],
      tillId: 1,
      tillName: 'Main Till'
    });
    
    if (response.status === 400 && response.data.error) {
      console.log('✓ PASS: Empty name properly rejected with 400 error');
      console.log(`  Error message: "${response.data.error}"`);
    } else {
      console.log('✗ FAIL: Empty name should be rejected with 400 error');
      console.log(`  Status: ${response.status}, Response:`, response.data);
    }
  } catch (error) {
    console.log('✗ FAIL: Error during test:', error.message);
  }

  // Test 2: Try to create a tab with whitespace-only name
  console.log('\nTest 2: Creating tab with whitespace-only name');
  try {
    const response = await createTab({
      name: '   ',
      items: [],
      tillId: 1,
      tillName: 'Main Till'
    });
    
    if (response.status === 400 && response.data.error) {
      console.log('✓ PASS: Whitespace-only name properly rejected with 400 error');
      console.log(`  Error message: "${response.data.error}"`);
    } else {
      console.log('✗ FAIL: Whitespace-only name should be rejected with 400 error');
      console.log(`  Status: ${response.status}, Response:`, response.data);
    }
  } catch (error) {
    console.log('✗ FAIL: Error during test:', error.message);
  }

  // Test 3: Try to create a tab with null name
 console.log('\nTest 3: Creating tab with null name');
  try {
    const response = await createTab({
      name: null,
      items: [],
      tillId: 1,
      tillName: 'Main Till'
    });
    
    if (response.status === 400 && response.data.error) {
      console.log('✓ PASS: Null name properly rejected with 400 error');
      console.log(` Error message: "${response.data.error}"`);
    } else {
      console.log('✗ FAIL: Null name should be rejected with 400 error');
      console.log(`  Status: ${response.status}, Response:`, response.data);
    }
  } catch (error) {
    console.log('✗ FAIL: Error during test:', error.message);
  }

  // Test 4: Try to create a tab without name field
  console.log('\nTest 4: Creating tab without name field');
  try {
    const response = await createTab({
      items: [],
      tillId: 1,
      tillName: 'Main Till'
    });
    
    if (response.status === 400 && response.data.error) {
      console.log('✓ PASS: Missing name field properly rejected with 400 error');
      console.log(`  Error message: "${response.data.error}"`);
    } else {
      console.log('✗ FAIL: Missing name field should be rejected with 400 error');
      console.log(`  Status: ${response.status}, Response:`, response.data);
    }
  } catch (error) {
    console.log('✗ FAIL: Error during test:', error.message);
  }

  // Test 5: Try to create a tab with newline characters only
  console.log('\nTest 5: Creating tab with newline characters only');
  try {
    const response = await createTab({
      name: '\n\n',
      items: [],
      tillId: 1,
      tillName: 'Main Till'
    });
    
    if (response.status === 400 && response.data.error) {
      console.log('✓ PASS: Newline-only name properly rejected with 400 error');
      console.log(`  Error message: "${response.data.error}"`);
    } else {
      console.log('✗ FAIL: Newline-only name should be rejected with 400 error');
      console.log(`  Status: ${response.status}, Response:`, response.data);
    }
  } catch (error) {
    console.log('✗ FAIL: Error during test:', error.message);
  }

  // Test 6: Try to create a tab with tab characters only
  console.log('\nTest 6: Creating tab with tab characters only');
  try {
    const response = await createTab({
      name: '\t\t',
      items: [],
      tillId: 1,
      tillName: 'Main Till'
    });
    
    if (response.status === 400 && response.data.error) {
      console.log('✓ PASS: Tab-only name properly rejected with 400 error');
      console.log(`  Error message: "${response.data.error}"`);
    } else {
      console.log('✗ FAIL: Tab-only name should be rejected with 400 error');
      console.log(`  Status: ${response.status}, Response:`, response.data);
    }
  } catch (error) {
    console.log('✗ FAIL: Error during test:', error.message);
  }

  // Test 7: Successfully create a tab with valid name
 console.log('\nTest 7: Creating tab with valid name');
  try {
    const response = await createTab({
      name: 'Test Tab',
      items: [],
      tillId: 1,
      tillName: 'Main Till'
    });
    
    if (response.status === 201 && response.data.id) {
      console.log('✓ PASS: Valid tab name properly accepted');
      console.log(`  Created tab with ID: ${response.data.id}, Name: "${response.data.name}"`);
      
      // Clean up: delete the test tab
      try {
        await axios.delete(`${API_BASE_URL}/tabs/${response.data.id}`);
        console.log('  Cleaned up test tab');
      } catch (cleanupError) {
        console.log('  Warning: Could not clean up test tab:', cleanupError.message);
      }
    } else {
      console.log('✗ FAIL: Valid tab name should be accepted');
      console.log(`  Status: ${response.status}, Response:`, response.data);
    }
  } catch (error) {
    console.log('✗ FAIL: Error during test:', error.message);
  }

  console.log('\n🎯 Tab Name Validation Tests Completed');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});