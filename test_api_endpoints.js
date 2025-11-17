import express from 'express';
import request from 'supertest';

// Import the backend modules
import { layoutRouter } from './backend/src/handlers/gridLayout.js';
import { prisma } from './backend/src/prisma.js';

// Create a simple test server to test the API endpoints
const app = express();
app.use(express.json());
app.use('/api', layoutRouter);

async function testApiEndpoints() {
  console.log('Testing API endpoints with filter-based parameters...');

 try {
    // First, get a till ID and category ID for testing
    const firstTill = await prisma.till.findFirst();
    if (!firstTill) {
      throw new Error('No till available for testing');
    }

    const categories = await prisma.category.findMany({ take: 1 });
    let categoryIdToUse = null;
    if (categories.length > 0) {
      categoryIdToUse = categories[0].id;
    } else {
      console.log('No categories found, creating a test category...');
      const testCategory = await prisma.category.create({
        data: {
          name: 'Test Category'
        }
      });
      categoryIdToUse = testCategory.id;
    }

    console.log(`Using till ID: ${firstTill.id}, category ID: ${categoryIdToUse}`);

    // Test 1: Create a layout via API
    console.log('\n--- Test 1: Creating layout via API ---');
    const createResponse = await request(app)
      .post(`/api/tills/${firstTill.id}/grid-layouts`)
      .send({
        name: 'API Test Layout',
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        isDefault: true,
        filterType: 'category',
        categoryId: categoryIdToUse
      });

    console.log('Create layout response status:', createResponse.status);
    if (createResponse.status === 201) {
      console.log('Layout created successfully:', createResponse.body);
      const createdLayoutId = createResponse.body.id;
      
      // Test 2: Get the specific layout by ID
      console.log('\n--- Test 2: Getting specific layout by ID ---');
      const getSpecificResponse = await request(app)
        .get(`/api/grid-layouts/${createdLayoutId}`);
      
      console.log('Get specific layout response status:', getSpecificResponse.status);
      if (getSpecificResponse.status === 200) {
        console.log('Retrieved layout:', getSpecificResponse.body);
        if (getSpecificResponse.body.filterType === 'category' && 
            getSpecificResponse.body.categoryId === categoryIdToUse) {
          console.log('✓ Filter type and category ID retrieved correctly');
        } else {
          console.log('✗ Filter type or category ID not retrieved correctly');
        }
      } else {
        console.log('✗ Failed to retrieve specific layout:', getSpecificResponse.body);
      }

      // Test 3: Get layouts by filter type
      console.log('\n--- Test 3: Getting layouts by filter type ---');
      const getLayoutsByFilterResponse = await request(app)
        .get(`/api/tills/${firstTill.id}/layouts-by-filter/category`);
      
      console.log('Get layouts by filter response status:', getLayoutsByFilterResponse.status);
      if (getLayoutsByFilterResponse.status === 200) {
        console.log('Layouts by filter type:', getLayoutsByFilterResponse.body);
        const foundLayout = getLayoutsByFilterResponse.body.find(layout => layout.id === createdLayoutId);
        if (foundLayout) {
          console.log('✓ Layout found in filter-specific query');
        } else {
          console.log('✗ Layout not found in filter-specific query');
        }
      } else {
        console.log('✗ Failed to get layouts by filter type:', getLayoutsByFilterResponse.body);
      }

      // Test 4: Get current layout for a specific filter type
      console.log('\n--- Test 4: Getting current layout for filter type ---');
      const getCurrentResponse = await request(app)
        .get(`/api/tills/${firstTill.id}/current-layout?filterType=category`);
      
      console.log('Get current layout response status:', getCurrentResponse.status);
      if (getCurrentResponse.status === 20) {
        console.log('Current layout for category filter:', getCurrentResponse.body);
        if (getCurrentResponse.body.id === createdLayoutId) {
          console.log('✓ Correct layout retrieved as current for category filter');
        } else {
          console.log('✗ Incorrect layout retrieved as current for category filter');
        }
      } else {
        console.log('✗ Failed to get current layout:', getCurrentResponse.body);
      }

      // Test 5: Update the layout via API
      console.log('\n--- Test 5: Updating layout via API ---');
      const updateResponse = await request(app)
        .put(`/api/grid-layouts/${createdLayoutId}`)
        .send({
          name: 'Updated API Test Layout',
          layout: {
            columns: 6,
            gridItems: [],
            version: '1.0'
          },
          isDefault: true,
          filterType: 'favorites', // Change the filter type
          categoryId: null
        });
      
      console.log('Update layout response status:', updateResponse.status);
      if (updateResponse.status === 200) {
        console.log('Layout updated successfully:', updateResponse.body);
        if (updateResponse.body.filterType === 'favorites' && updateResponse.body.categoryId === null) {
          console.log('✓ Layout updated with new filter type and category ID');
        } else {
          console.log('✗ Layout not updated with correct filter type and category ID');
        }
      } else {
        console.log('✗ Failed to update layout:', updateResponse.body);
      }

      // Clean up: delete the test layout
      console.log('\n--- Cleanup: Deleting test layout ---');
      const deleteResponse = await request(app)
        .delete(`/api/grid-layouts/${createdLayoutId}`);
      
      console.log('Delete layout response status:', deleteResponse.status);
      if (deleteResponse.status === 204) {
        console.log('✓ Test layout deleted successfully');
      } else {
        console.log('✗ Failed to delete test layout:', deleteResponse.body);
      }
    } else {
      console.log('✗ Failed to create layout:', createResponse.body);
    }

  } catch (error) {
    console.error('Error during API endpoint test:', error);
  }
}

// Run the test
testApiEndpoints();