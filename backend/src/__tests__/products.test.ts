import request from 'supertest';
import express from 'express';
import { productsRouter } from '../handlers/products';
import { prisma } from '../prisma';

// Create an Express app to mount the product routes for testing
const app = express();
app.use(express.json());
app.use('/api/products', productsRouter);

describe('Products API', () => {
 beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: 10.99, categoryId: 1, variants: [] },
        { id: 2, name: 'Product 2', price: 15.99, categoryId: 2, variants: [] }
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching products fails', async () => {
      (prisma.product.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/products')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch products' });
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return a specific product', async () => {
      const mockProduct = { id: 1, name: 'Product 1', price: 10.99, categoryId: 1, variants: [] };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const response = await request(app)
        .get('/api/products/1')
        .expect(200);

      expect(response.body).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          variants: {
            include: {
              stockConsumption: true
            }
          }
        }
      });
    });

    it('should return 404 if product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/products/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Product not found' });
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProduct = { name: 'New Product', categoryId: 1, variants: [] };
      const createdProduct = { id: 3, ...newProduct };

      (prisma.product.create as jest.Mock).mockResolvedValue(createdProduct);

      const response = await request(app)
        .post('/api/products')
        .send(newProduct)
        .expect(201);

      expect(response.body).toEqual(createdProduct);
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          ...newProduct,
          variants: {
            create: []
          }
        },
        include: {
          variants: {
            include: {
              stockConsumption: true
            }
          }
        }
      });
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update an existing product', async () => {
      const updatedProductData = { name: 'Updated Product', categoryId: 2, variants: [] };
      const updatedProduct = { id: 1, ...updatedProductData };

      (prisma.product.update as jest.Mock).mockResolvedValue(updatedProduct);

      const response = await request(app)
        .put('/api/products/1')
        .send(updatedProductData)
        .expect(200);

      expect(response.body).toEqual(updatedProduct);
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          ...updatedProductData,
          variants: {
            create: []
          }
        },
        include: {
          variants: {
            include: {
              stockConsumption: true
            }
          }
        }
      });
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete a product', async () => {
      (prisma.product.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete('/api/products/1')
        .expect(204);

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });
  });
});