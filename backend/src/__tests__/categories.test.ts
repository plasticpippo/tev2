import request from 'supertest';
import express from 'express';
import { categoriesRouter } from '../handlers/categories';
import { prisma } from '../prisma';

// Create an Express app to mount the category routes for testing
const app = express();
app.use(express.json());
app.use('/api/categories', categoriesRouter);

describe('Categories API', () => {
 beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Food', visibleTillIds: [] },
        { id: 2, name: 'Drinks', visibleTillIds: [] }
      ];

      (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body).toEqual(mockCategories);
      expect(prisma.category.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching categories fails', async () => {
      (prisma.category.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/categories')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch categories' });
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return a specific category', async () => {
      const mockCategory = { id: 1, name: 'Food', visibleTillIds: [] };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      const response = await request(app)
        .get('/api/categories/1')
        .expect(200);

      expect(response.body).toEqual(mockCategory);
      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: {
          id: true,
          name: true,
          visibleTillIds: true
        }
      });
    });

    it('should return 404 if category not found', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/categories/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Category not found' });
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const newCategory = { name: 'New Category', visibleTillIds: [] };
      const createdCategory = { id: 3, ...newCategory };

      (prisma.category.create as jest.Mock).mockResolvedValue(createdCategory);

      const response = await request(app)
        .post('/api/categories')
        .send(newCategory)
        .expect(201);

      expect(response.body).toEqual(createdCategory);
      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: 'New Category',
          visibleTillIds: []
        },
        select: {
          id: true,
          name: true,
          visibleTillIds: true
        }
      });
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update an existing category', async () => {
      const updatedCategoryData = { name: 'Updated Category', visibleTillIds: [] };
      const updatedCategory = { id: 1, ...updatedCategoryData };

      (prisma.category.update as jest.Mock).mockResolvedValue(updatedCategory);

      const response = await request(app)
        .put('/api/categories/1')
        .send(updatedCategoryData)
        .expect(200);

      expect(response.body).toEqual(updatedCategory);
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated Category',
          visibleTillIds: []
        },
        select: {
          id: true,
          name: true,
          visibleTillIds: true
        }
      });
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a category', async () => {
      (prisma.category.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete('/api/categories/1')
        .expect(204);

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 400 if category has associated products', async () => {
      // Mock that the category has associated products
      (prisma.product.count as jest.Mock).mockResolvedValue(1);
      
      const response = await request(app)
        .delete('/api/categories/1')
        .expect(400);

      expect(response.body).toEqual({ 
        error: 'Cannot delete category with associated products. Please re-assign products first.' 
      });
    });
  });
});