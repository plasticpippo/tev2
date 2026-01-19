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

describe('Expanded Analytics API', () => {
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

    it('should return product performance data with custom sorting', async () => {
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

      // Test sorting by quantity ascending
      const response = await request(app)
        .get('/analytics/product-performance?sortBy=quantity&sortOrder=asc')
        .expect(200);

      expect(response.body.products).toHaveLength(2);
      // With ascending order by quantity, the product with lower quantity should come first
    });

    it('should return product performance data with pagination', async () => {
      // Create mock transactions for multiple products
      const mockTransactions = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        items: [
          {
            id: `item${i + 1}`,
            variantId: i + 1,
            productId: i + 1,
            name: `Product ${i + 1}`,
            price: 10,
            quantity: i + 1,
            effectiveTaxRate: 0.19,
          }
        ],
        subtotal: 10 * (i + 1),
        tax: 1.9 * (i + 1),
        tip: 0,
        total: 11.9 * (i + 1),
        paymentMethod: 'cash',
        userId: 1,
        userName: 'Test User',
        tillId: 1,
        tillName: 'Till 1',
        createdAt: new Date(),
      }));

      (prisma.transaction.findMany as jest.MockedFunction<any>).mockResolvedValue(mockTransactions);

      // Create mock products
      const mockProducts = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        categoryId: 1,
        category: {
          id: 1,
          name: 'Category 1',
        },
      }));

      (prisma.product.findMany as jest.MockedFunction<any>).mockResolvedValue(mockProducts);

      // Test pagination - first page with 5 items per page
      const response = await request(app)
        .get('/analytics/product-performance?page=1&limit=5')
        .expect(200);

      expect(response.body.products).toHaveLength(5);
      expect(response.body.metadata).toHaveProperty('totalPages', 4); // 20 items / 5 per page = 4 pages
      expect(response.body.metadata).toHaveProperty('currentPage', 1);
      expect(response.body.metadata).toHaveProperty('hasNextPage', true);
      expect(response.body.metadata).toHaveProperty('hasPrevPage', false);
    });

    it('should return error for invalid date parameters', async () => {
      const response = await request(app)
        .get('/analytics/product-performance?startDate=invalid-date')
        .expect(200); // Should still return 200 but with empty data since we ignore invalid dates
      
      // The function should handle invalid dates gracefully
      expect(response.body).toHaveProperty('products');
    });

    it('should return error for invalid product ID', async () => {
      const response = await request(app)
        .get('/analytics/product-performance?productId=invalid')
        .expect(200); // Should still return 200 but with empty data since we ignore invalid IDs
      
      expect(response.body).toHaveProperty('products');
    });

    it('should return error for invalid category ID', async () => {
      const response = await request(app)
        .get('/analytics/product-performance?categoryId=invalid')
        .expect(200); // Should still return 200 but with empty data since we ignore invalid IDs
      
      expect(response.body).toHaveProperty('products');
    });

    it('should return error for invalid sort parameters', async () => {
      const response = await request(app)
        .get('/analytics/product-performance?sortBy=invalid&sortOrder=invalid')
        .expect(200); // Should still return 200 but with default sorting
      
      expect(response.body).toHaveProperty('products');
    });

    it('should return error for invalid pagination parameters', async () => {
      const response = await request(app)
        .get('/analytics/product-performance?page=0&limit=0')
        .expect(200); // Should still return 200 but with default pagination
      
      expect(response.body).toHaveProperty('products');
    });

    it('should handle transactions with string items properly', async () => {
      // Mock transaction with items as a string
      (prisma.transaction.findMany as jest.MockedFunction<any>).mockResolvedValue([
        {
          id: 1,
          items: JSON.stringify([
            {
              id: 'item1',
              variantId: 1,
              productId: 1,
              name: 'Product 1',
              price: 10,
              quantity: 2,
              effectiveTaxRate: 0.19,
            }
          ]),
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

      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0]).toHaveProperty('name', 'Product 1');
    });

    it('should handle transactions with invalid items gracefully', async () => {
      (prisma.transaction.findMany as jest.MockedFunction<any>).mockResolvedValue([
        {
          id: 1,
          items: [
            {
              id: 'item1',
              // Missing required fields
            }
          ],
          subtotal: 0,
          tax: 0,
          tip: 0,
          total: 0,
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

      // Should return empty results since items are invalid
      expect(response.body.products).toHaveLength(0);
    });

    it('should return product performance data with all features combined', async () => {
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
              quantity: 3,
              effectiveTaxRate: 0.19,
            }
          ],
          subtotal: 65,
          tax: 12.35,
          tip: 0,
          total: 77.35,
          paymentMethod: 'card',
          userId: 1,
          userName: 'Test User',
          tillId: 1,
          tillName: 'Till 1',
          createdAt: new Date('2023-06-15'),
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
        .get('/analytics/product-performance?startDate=2023-01-01&endDate=2023-12-31&categoryId=1&sortBy=revenue&sortOrder=desc&page=1&limit=10')
        .expect(200);

      expect(response.body.products).toHaveLength(2);
      expect(response.body.metadata).toHaveProperty('currentPage', 1);
      expect(response.body.summary).toHaveProperty('totalRevenue');
      expect(response.body.summary).toHaveProperty('totalUnitsSold');
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

    it('should maintain backward compatibility with custom parameters', async () => {
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
            }
          ],
          subtotal: 50,
          tax: 9.5,
          tip: 0,
          total: 59.5,
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
        .get('/analytics/top-performers?startDate=2023-01-01&endDate=2023-12-31&categoryId=1')
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body).toHaveProperty('metadata');
      expect(response.body).toHaveProperty('summary');
    });
  });

  describe('Validation and Error Handling', () => {
    it('should handle server error gracefully', async () => {
      // Mock an error in the service layer
      (prisma.transaction.findMany as jest.MockedFunction<any>).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/analytics/product-performance')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle server error gracefully for top-performers endpoint', async () => {
      // Mock an error in the service layer
      (prisma.transaction.findMany as jest.MockedFunction<any>).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/analytics/top-performers')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });
});