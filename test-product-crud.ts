import axios from 'axios';

// Configuration
const BASE_URL = 'http://192.168.1.241:3000/api';
const USERNAME = 'admin';
const PASSWORD = 'admin123';

// Global variables to store test data
let authToken: string;
let testProductId: number | null = null;
let testCategoryId: number | null = null;

async function authenticate() {
  try {
    console.log(' Authenticating...');
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: USERNAME,
      password: PASSWORD
    });
    
    authToken = response.data.token;
    console.log(' ✓ Authentication successful');
    return true;
  } catch (error) {
    console.error(' ✗ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

async function getAuthToken() {
  if (!authToken) {
    const authenticated = await authenticate();
    if (!authenticated) {
      throw new Error('Cannot proceed without authentication');
    }
  }
  return authToken;
}

async function getExistingCategories() {
  try {
    console.log(' Getting existing categories...');
    const token = await getAuthToken();
    const response = await axios.get(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(' ✓ Retrieved categories:', response.data.length);
    if (response.data.length > 0) {
      testCategoryId = response.data[0].id;
      console.log(` - Using category ID: ${testCategoryId} (${response.data[0].name})`);
    } else {
      console.log(' ! No categories found, you may need to create one first');
    }
    return response.data;
  } catch (error) {
    console.error(' ✗ Failed to get categories:', error.response?.data || error.message);
    return [];
  }
}

async function createTestProduct() {
  try {
    console.log(' Creating a test product...');
    if (!testCategoryId) {
      console.log(' ! Cannot create product without a category');
      return false;
    }
    
    const token = await getAuthToken();
    const productData = {
      name: 'Test Product - CRUD Test',
      categoryId: testCategoryId,
      variants: [
        {
          name: 'Standard',
          price: 15.99,
          isFavourite: false,
          backgroundColor: 'bg-blue-500',
          textColor: 'text-white',
          stockConsumption: []
        }
      ]
    };
    
    const response = await axios.post(`${BASE_URL}/products`, productData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    testProductId = response.data.id;
    console.log(` ✓ Created product with ID: ${testProductId}`);
    return true;
  } catch (error) {
    console.error(' ✗ Failed to create product:', error.response?.data || error.message);
    return false;
  }
}

async function getAllProducts() {
  try {
    console.log(' Getting all products...');
    const token = await getAuthToken();
    const response = await axios.get(`${BASE_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(` ✓ Retrieved ${response.data.length} products`);
    // Find our test product to confirm it exists
    const testProduct = response.data.find(p => p.id === testProductId);
    if (testProduct) {
      console.log(` ✓ Test product found in list: ${testProduct.name}`);
    } else {
      console.log(' ! Test product not found in list');
    }
    return response.data;
  } catch (error) {
    console.error(' ✗ Failed to get products:', error.response?.data || error.message);
    return [];
  }
}

async function getProductById() {
  try {
    if (!testProductId) {
      console.log(' ! Cannot get product without a product ID');
      return false;
    }
    
    console.log(` Getting product by ID: ${testProductId}`);
    const token = await getAuthToken();
    const response = await axios.get(`${BASE_URL}/products/${testProductId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(' ✓ Retrieved product details:');
    console.log(`   - Name: ${response.data.name}`);
    console.log(`   - Category ID: ${response.data.categoryId}`);
    console.log(`   - Variants: ${response.data.variants.length}`);
    return true;
  } catch (error) {
    console.error(' ✗ Failed to get product by ID:', error.response?.data || error.message);
    return false;
  }
}

async function updateTestProduct() {
  try {
    if (!testProductId) {
      console.log(' ! Cannot update product without a product ID');
      return false;
    }
    
    console.log(` Updating product ID: ${testProductId}`);
    const token = await getAuthToken();
    const updatedProductData = {
      name: 'Updated Test Product - CRUD Test',
      categoryId: testCategoryId,
      variants: [
        {
          name: 'Large Size',
          price: 22.99,
          isFavourite: true,
          backgroundColor: 'bg-green-500',
          textColor: 'text-black',
          stockConsumption: []
        },
        {
          name: 'Small Size',
          price: 12.99,
          isFavourite: false,
          backgroundColor: 'bg-purple-500',
          textColor: 'text-white',
          stockConsumption: []
        }
      ]
    };
    
    const response = await axios.put(`${BASE_URL}/products/${testProductId}`, updatedProductData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(' ✓ Product updated successfully');
    console.log(`   - New name: ${response.data.name}`);
    console.log(`   - New variants count: ${response.data.variants.length}`);
    return true;
  } catch (error) {
    console.error(' ✗ Failed to update product:', error.response?.data || error.message);
    return false;
  }
}

async function deleteTestProduct() {
  try {
    if (!testProductId) {
      console.log(' ! Cannot delete product without a product ID');
      return false;
    }
    
    console.log(` Deleting product ID: ${testProductId}`);
    const token = await getAuthToken();
    await axios.delete(`${BASE_URL}/products/${testProductId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(' ✓ Product deleted successfully');
    testProductId = null;
    return true;
  } catch (error) {
    console.error(' ✗ Failed to delete product:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Product CRUD Tests...\n');
  
  // Step 1: Authenticate
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.log('\n❌ Tests aborted: Authentication failed');
    return;
  }
  
  // Step 2: Get categories
  await getExistingCategories();
  if (!testCategoryId) {
    console.log('\n❌ Tests aborted: No categories available');
    return;
  }
  
  // Step 3: Create product (CREATE)
  const createSuccess = await createTestProduct();
  if (!createSuccess) {
    console.log('\n❌ Tests aborted: Could not create test product');
    return;
  }
  
  // Step 4: Read all products (READ)
  console.log('\n--- READ: Getting all products ---');
  await getAllProducts();
  
  // Step 5: Read specific product (READ)
  console.log('\n--- READ: Getting specific product ---');
  await getProductById();
  
  // Step 6: Update product (UPDATE)
  console.log('\n--- UPDATE: Modifying product ---');
  const updateSuccess = await updateTestProduct();
  if (!updateSuccess) {
    console.log('\n⚠️  Update failed, continuing to cleanup...');
  }
  
  // Step 7: Verify update by reading again
  console.log('\n--- READ: Verifying update ---');
  await getProductById();
  
  // Step 8: Delete product (DELETE)
  console.log('\n--- DELETE: Removing product ---');
  const deleteSuccess = await deleteTestProduct();
  if (!deleteSuccess) {
    console.log('\n⚠️  Cleanup failed, product may still exist');
  }
  
  console.log('\n✅ Product CRUD Tests Completed!');
}

// Run the tests
runTests().catch(console.error);