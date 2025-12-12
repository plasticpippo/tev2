import request from 'supertest';
import express from 'express';
import { layoutRouter } from '../handlers/gridLayout';
import { prisma } from '../prisma';

// Create an express app to test the router
const app = express();
app.use(express.json());
app.use('/api/grid-layouts', layoutRouter);

describe('Grid Layout Integration Tests - Full CRUD Flow', () => {
  const testLayoutData = {
    name: 'Integration Test Layout',
    layout: {
      columns: 4,
      gridItems: [
        {
          id: 'item-1-1-0',
          variantId: 1,
          productId: 1,
          x: 0,
          y: 0,
          width: 1,
          height: 1
        }
      ],
      version: '1.0'
    },
    isDefault: false,
    filterType: 'all',
    categoryId: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete CRUD Flow', () => {
    it('should perform complete CRUD operations: Create, Read, Update, Delete', async () => {
      // 1. Create a new layout
      (prisma.productGridLayout.create as jest.Mock).mockResolvedValue({
        id: 1,
        ...testLayoutData,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        tillId: 1
      });

      const createResponse = await request(app)
        .post('/api/grid-layouts/tills/1/grid-layouts')
        .send(testLayoutData)
        .expect(201);

      expect(createResponse.body).toMatchObject({
        id: 1,
        name: 'Integration Test Layout',
        isDefault: false,
        filterType: 'all'
      });
      
      const createdLayoutId = createResponse.body.id;
      expect(createdLayoutId).toBe(1);

      // 2. Read the created layout
      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue({
        id: createdLayoutId,
        ...testLayoutData,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        tillId: 1
      });

      const readResponse = await request(app)
        .get(`/api/grid-layouts/${createdLayoutId}`)
        .expect(200);

      expect(readResponse.body).toMatchObject({
        id: createdLayoutId,
        name: 'Integration Test Layout',
        isDefault: false
      });

      // 3. Update the layout
      const updatedLayoutData = {
        ...testLayoutData,
        name: 'Updated Integration Test Layout',
        isDefault: true
      };

      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue({
        id: createdLayoutId,
        ...testLayoutData,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        tillId: 1
      });
      
      (prisma.productGridLayout.updateMany as jest.Mock).mockResolvedValue({ count: 0 });
      (prisma.productGridLayout.update as jest.Mock).mockResolvedValue({
        id: createdLayoutId,
        ...updatedLayoutData,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:01Z'), // Updated time
        tillId: 1
      });

      const updateResponse = await request(app)
        .put(`/api/grid-layouts/${createdLayoutId}`)
        .send(updatedLayoutData)
        .expect(200);

      expect(updateResponse.body).toMatchObject({
        id: createdLayoutId,
        name: 'Updated Integration Test Layout',
        isDefault: true
      });

      // 4. Set as default
      (prisma.productGridLayout.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.productGridLayout.update as jest.Mock).mockResolvedValue({
        id: createdLayoutId,
        ...updatedLayoutData,
        isDefault: true,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:02Z'),
        tillId: 1
      });

      const setDefaultResponse = await request(app)
        .put(`/api/grid-layouts/${createdLayoutId}/set-default`)
        .expect(200);

      expect(setDefaultResponse.body).toMatchObject({
        id: createdLayoutId,
        isDefault: true
      });

      // 5. Get layouts for the till to verify it exists
      (prisma.productGridLayout.findMany as jest.Mock).mockResolvedValue([{
        id: createdLayoutId,
        ...updatedLayoutData,
        isDefault: true,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:02Z'),
        tillId: 1
      }]);

      const getLayoutsResponse = await request(app)
        .get('/api/grid-layouts/tills/1/grid-layouts')
        .expect(200);

      expect(getLayoutsResponse.body).toHaveLength(1);
      expect(getLayoutsResponse.body[0]).toMatchObject({
        id: createdLayoutId,
        name: 'Updated Integration Test Layout',
        isDefault: true
      });

      // 6. Delete the layout
      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue({
        id: createdLayoutId,
        ...updatedLayoutData,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:02Z'),
        tillId: 1
      });
      
      (prisma.productGridLayout.findMany as jest.Mock).mockResolvedValue([]); // Other layouts exist (not the only one)
      (prisma.productGridLayout.delete as jest.Mock).mockResolvedValue({
        id: createdLayoutId,
        ...updatedLayoutData,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:02Z'),
        tillId: 1
      });

      const deleteResponse = await request(app)
        .delete(`/api/grid-layouts/${createdLayoutId}`)
        .expect(204);

      // Verify the delete was successful (no content returned)
      expect(deleteResponse.status).toBe(204);
    });
  });

  describe('Filter-specific operations', () => {
    it('should handle category filter type operations', async () => {
      const categoryLayoutData = {
        name: 'Category Test Layout',
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        isDefault: false,
        filterType: 'category',
        categoryId: 1
      };

      // Create a category filter layout
      (prisma.productGridLayout.create as jest.Mock).mockResolvedValue({
        id: 2,
        ...categoryLayoutData,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        tillId: 1
      });

      const createResponse = await request(app)
        .post('/api/grid-layouts/tills/1/grid-layouts')
        .send(categoryLayoutData)
        .expect(201);

      expect(createResponse.body).toMatchObject({
        id: 2,
        name: 'Category Test Layout',
        filterType: 'category',
        categoryId: 1
      });

      // Get layouts by category filter
      (prisma.productGridLayout.findMany as jest.Mock).mockResolvedValue([createResponse.body]);

      const getResponse = await request(app)
        .get('/api/grid-layouts/tills/1/layouts-by-filter/category?categoryId=1')
        .expect(200);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0]).toMatchObject({
        id: 2,
        filterType: 'category',
        categoryId: 1
      });
    });

    it('should handle favorites filter type operations', async () => {
      const favoritesLayoutData = {
        name: 'Favorites Test Layout',
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        isDefault: false,
        filterType: 'favorites',
        categoryId: null
      };

      // Create a favorites filter layout
      (prisma.productGridLayout.create as jest.Mock).mockResolvedValue({
        id: 3,
        ...favoritesLayoutData,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z'),
        tillId: 1
      });

      const createResponse = await request(app)
        .post('/api/grid-layouts/tills/1/grid-layouts')
        .send(favoritesLayoutData)
        .expect(201);

      expect(createResponse.body).toMatchObject({
        id: 3,
        name: 'Favorites Test Layout',
        filterType: 'favorites'
      });

      // Get layouts by favorites filter
      (prisma.productGridLayout.findMany as jest.Mock).mockResolvedValue([createResponse.body]);

      const getResponse = await request(app)
        .get('/api/grid-layouts/tills/1/layouts-by-filter/favorites')
        .expect(200);

      expect(getResponse.body).toHaveLength(1);
      expect(getResponse.body[0]).toMatchObject({
        id: 3,
        filterType: 'favorites'
      });
    });
  });

  describe('Current layout retrieval', () => {
    it('should get the current (default) layout for a till', async () => {
      const defaultLayout = {
        id: 4,
        name: 'Default Layout',
        tillId: 2,
        layout: {
          columns: 4,
          gridItems: [],
          version: '1.0'
        },
        isDefault: true,
        filterType: 'all',
        categoryId: null,
        createdAt: new Date('2023-01-01T00:00:00Z'),
        updatedAt: new Date('2023-01-01T00:00:00Z')
      };

      // Mock finding the default layout
      (prisma.productGridLayout.findFirst as jest.Mock).mockResolvedValue(defaultLayout);

      const response = await request(app)
        .get('/api/grid-layouts/tills/2/current-layout')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 4,
        name: 'Default Layout',
        isDefault: true
      });
    });

    it('should get a fallback layout when no layouts exist', async () => {
      // Mock no default layout and no first layout
      (prisma.productGridLayout.findFirst as jest.Mock)
        .mockResolvedValueOnce(null) // No default layout
        .mockResolvedValueOnce(null); // No first layout

      const response = await request(app)
        .get('/api/grid-layouts/tills/999/current-layout')
        .expect(200);

      expect(response.body).toMatchObject({
        id: null,
        name: 'Default all Layout',
        isDefault: true,
        filterType: 'all'
      });
    });
  });

  describe('Error handling in CRUD flow', () => {
    it('should handle error when creating layout with invalid data', async () => {
      const invalidLayoutData = {
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/grid-layouts/tills/1/grid-layouts')
        .send(invalidLayoutData)
        .expect(500); // Assuming error handling in the handler

      // The exact error depends on how the handler deals with missing data
      // This test ensures the server doesn't crash
      expect([400, 500]).toContain(response.status);
    });

    it('should handle error when trying to delete a non-existent layout', async () => {
      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/grid-layouts/99')
        .expect(404);

      expect(response.body).toEqual({ error: 'Layout not found' });
    });

    it('should handle error when trying to get a non-existent layout', async () => {
      (prisma.productGridLayout.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/grid-layouts/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Layout not found' });
    });
  });
});