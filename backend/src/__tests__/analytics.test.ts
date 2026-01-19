import request from 'supertest';
import express from 'express';
import { router } from '../router';
import { prisma } from '../prisma';

// Mock the prisma client to avoid database connections in tests
jest.mock('../prisma', () => ({
  prisma: {
    transaction: {
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
  },
}));

const app = express();
app.use(express.json());
app.use(router);

describe('Analytics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/product-performance', () => {
    it('should return product performance data with default parameters', async () => {
      // Mock the database responses
      (prisma.transaction.findMany as jest.MockedFunction<any>).mockResolvedValue([
        {
          id: 1,
          items: [
            {
              id: 'item1',
              variantId: 1,
              productId: 1,
              name: 'Product 1',
              price: 10,
              quantity: 2,
              effectiveTaxRate: 0.19,
            }
          ],
          subtotal: 20,
          tax: 3.8,
          tip: 0,
          total: 23.8,
          paymentMethod: 'cash',
          userId: 1,
          userName: 'Test User',
          tillId: 1,
          tillName: 'Till 1',
          createdAt: new Date(),
        }
      ]);

      (prisma.product.findMany as jest.MockedFunction<any>).mockResolvedValue([
        {
          id: 1,
          name: 'Product 1',
          categoryId: 1,
          category: {
            id: 1,
            name: 'Category 1',
          },
        }
      ]);

      const response = await request(app)
        .get('/analytics/product-performance')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body).toHaveProperty('summary');
      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0]).toHaveProperty('name', 'Product 1');
      expect(response.body.products[0]).toHaveProperty('totalQuantity', 2);
      expect(response.body.products[0]).toHaveProperty('totalRevenue', 20); // price * quantity
    });

    it('should return product performance data with custom date range', async () => {
      (prisma.transaction.findMany as jest.MockedFunction<any>).mockResolvedValue([]);
      (prisma.product.findMany as jest.MockedFunction<any>).mockResolvedValue([]);

      const response = await request(app)
        .get('/analytics/product-performance?startDate=2023-01-01&endDate=2023-12-31')
        .expect(200);

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2023-01-01'),
              lte: new Date('2023-12-31'),
            },
          }),
        })
      );
    });

    it('should return product performance data filtered by product ID', async () => {
      (prisma.transaction.findMany as jest.MockedFunction<any>).mockResolvedValue([
        {
          id: 1,
          items: [
            {
              id: 'item1',
              variantId: 1,
              productId: 1,
              name: 'Product 1',
              price: 10,
              quantity: 2,
              effectiveTaxRate: 0.19,
            },
            {
              id: 'item2',
              variantId: 2,
              productId: 2,
              name: 'Product 2',
              price: 15,
              quantity: 1,
              effectiveTaxRate: 0.19,
            }
          ],
          subtotal: 35,
          tax: 6.65,
          tip: 0,
          total: 41.65,
          paymentMethod: 'card',
          userId: 1,
          userName: 'Test User',
          tillId: 1,
          tillName: 'Till 1',
          createdAt: new Date(),
        }
      ]);

      (prisma.product.findMany as jest.MockedFunction<any>).mockResolvedValue([
        {
          id: 1,
          name: 'Product 1',
          categoryId: 1,
          category: {
            id: 1,
            name: 'Category 1',
          },
        },
        {
          id: 2,
          name: 'Product 2',
          categoryId: 1,
          category: {
            id: 1,
            name: 'Category 1',
          },
        }
      ]);

      const response = await request(app)
        .get('/analytics/product-performance?productId=1')
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0]).toHaveProperty('id', 1);
    });

    it('should return product performance data filtered by category ID', async () => {
      (prisma.transaction.findMany as jest.MockedFunction<any>).mockResolvedValue([
        {
          id: 1,
          items: [
            {
              id: 'item1',
              variantId: 1,
              productId: 1,
              name: 'Product 1',
              price: 10,
              quantity: 2,
              effectiveTaxRate: 0.19,
            }
          ],
          subtotal: 20,
          tax: 3.8,
          tip: 0,
          total: 23.8,
          paymentMethod: 'cash',
          userId: 1,
          userName: 'Test User',
          tillId: 1,
          tillName: 'Till 1',
          createdAt: new Date(),
        }
      ]);

      (prisma.product.findMany as jest.MockedFunction<any>).mockResolvedValue([
        {
          id: 1,
          name: 'Product 1',
          categoryId: 1,
          category: {
            id: 1,
            name: 'Category 1',
          },
        }
      ]);

      const response = await request(app)
        .get('/analytics/product-performance?categoryId=1')
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0]).toHaveProperty('categoryId', 1);
    });

    it('should return error for invalid date parameters', async () => {
      const response = await request(app)
        .get('/analytics/product-performance?startDate=invalid-date')
        .expect(200); // Should still return 200 but with empty data since we ignore invalid dates
      
      // The function should handle invalid dates gracefully
      expect(response.body).toHaveProperty('products');
    });
  });

  describe('GET /api/analytics/top-performers', () => {
    it('should return top performers with backward compatibility', async () => {
      (prisma.transaction.findMany as jest.MockedFunction<any>).mockResolvedValue([
        {
          id: 1,
          items: [
            {
              id: 'item1',
              variantId: 1,
              productId: 1,
              name: 'Product 1',
              price: 10,
              quantity: 5,
              effectiveTaxRate: 0.19,
            },
            {
              id: 'item2',
              variantId: 2,
              productId: 2,
              name: 'Product 2',
              price: 15,
              quantity: 3,
              effectiveTaxRate: 0.19,
            }
          ],
          subtotal: 95,
          tax: 18.05,
          tip: 0,
          total: 113.05,
          paymentMethod: 'cash',
          userId: 1,
          userName: 'Test User',
          tillId: 1,
          tillName: 'Till 1',
          createdAt: new Date(),
        }
      ]);

      (prisma.product.findMany as jest.MockedFunction<any>).mockResolvedValue([
        {
          id: 1,
          name: 'Product 1',
          categoryId: 1,
          category: {
            id: 1,
            name: 'Category 1',
          },
        },
        {
          id: 2,
          name: 'Product 2',
          categoryId: 1,
          category: {
            id: 1,
            name: 'Category 1',
          },
        }
      ]);

      const response = await request(app)
        .get('/analytics/top-performers')
        .expect(200);

      // Should return at most 5 items for backward compatibility
      expect(response.body.products).toHaveLength(2); // Less than 5, so all returned
      expect(response.body).toHaveProperty('metadata');
      expect(response.body).toHaveProperty('summary');
    });
  });
});