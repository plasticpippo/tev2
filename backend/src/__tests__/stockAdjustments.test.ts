import request from 'supertest';
import express from 'express';
import { stockAdjustmentsRouter } from '../handlers/stockAdjustments';
import { prisma } from '../prisma';

// Create an Express app to mount the stock adjustment routes for testing
const app = express();
app.use(express.json());
app.use('/api/stock-adjustments', stockAdjustmentsRouter);

describe('Stock Adjustments API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/stock-adjustments', () => {
    it('should return all stock adjustments', async () => {
      const mockStockAdjustments = [
        { id: 1, stockItemId: 1, itemName: 'Tomatoes', quantity: 10, reason: 'Delivery', userId: 1, userName: 'John Doe', createdAt: new Date().toISOString() },
        { id: 2, stockItemId: 2, itemName: 'Lettuce', quantity: -5, reason: 'Spoilage', userId: 1, userName: 'John Doe', createdAt: new Date().toISOString() }
      ];

      (prisma.stockAdjustment.findMany as jest.Mock).mockResolvedValue(mockStockAdjustments);

      const response = await request(app)
        .get('/api/stock-adjustments')
        .expect(200);

      expect(response.body).toEqual(mockStockAdjustments);
      expect(prisma.stockAdjustment.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching stock adjustments fails', async () => {
      (prisma.stockAdjustment.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/stock-adjustments')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch stock adjustments' });
    });
  });

  describe('GET /api/stock-adjustments/:id', () => {
    it('should return a specific stock adjustment', async () => {
      const mockStockAdjustment = { id: 1, stockItemId: 1, itemName: 'Tomatoes', quantity: 10, reason: 'Delivery', userId: 1, userName: 'John Doe', createdAt: new Date().toISOString() };

      (prisma.stockAdjustment.findUnique as jest.Mock).mockResolvedValue(mockStockAdjustment);

      const response = await request(app)
        .get('/api/stock-adjustments/1')
        .expect(200);

      expect(response.body).toEqual(mockStockAdjustment);
      expect(prisma.stockAdjustment.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if stock adjustment not found', async () => {
      (prisma.stockAdjustment.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/stock-adjustments/99')
        .expect(404);

      expect(response.body).toEqual({ error: 'Stock adjustment not found' });
    });
  });

  describe('POST /api/stock-adjustments', () => {
    it('should create a new stock adjustment', async () => {
      const newStockAdjustment = { 
        stockItemId: 1, 
        itemName: 'Tomatoes', 
        quantity: 10, 
        reason: 'Delivery', 
        userId: 1, 
        userName: 'John Doe' 
      };
      const createdStockAdjustment = { id: 3, ...newStockAdjustment, createdAt: new Date().toISOString() };

      (prisma.stockAdjustment.create as jest.Mock).mockResolvedValue(createdStockAdjustment);

      const response = await request(app)
        .post('/api/stock-adjustments')
        .send(newStockAdjustment)
        .expect(201);

      expect(response.body).toEqual(createdStockAdjustment);
      expect(prisma.stockAdjustment.create).toHaveBeenCalledWith({
        data: {
          ...newStockAdjustment,
          createdAt: expect.any(Date)
        }
      });
    });
  });
});