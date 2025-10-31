import request from 'supertest';
import express from 'express';
import { orderActivityLogsRouter } from '../handlers/orderActivityLogs';
import { prisma } from '../prisma';

// Create an Express app to mount the order activity log routes for testing
const app = express();
app.use(express.json());
app.use('/api/order-activity-logs', orderActivityLogsRouter);

describe('Order Activity Logs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/order-activity-logs', () => {
    it('should return all order activity logs', async () => {
      const mockOrderActivityLogs = [
        { id: 1, action: 'order_created', details: 'New order created', userId: 1, userName: 'John Doe', createdAt: new Date().toISOString() },
        { id: 2, action: 'order_updated', details: 'Order updated', userId: 1, userName: 'John Doe', createdAt: new Date().toISOString() }
      ];

      (prisma.orderActivityLog.findMany as jest.Mock).mockResolvedValue(mockOrderActivityLogs);

      const response = await request(app)
        .get('/api/order-activity-logs')
        .expect(200);

      expect(response.body).toEqual(mockOrderActivityLogs);
      expect(prisma.orderActivityLog.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching order activity logs fails', async () => {
      (prisma.orderActivityLog.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/order-activity-logs')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch order activity logs' });
    });
  });

  describe('GET /api/order-activity-logs/:id', () => {
    it('should return a specific order activity log', async () => {
      const mockOrderActivityLog = { id: 1, action: 'order_created', details: 'New order created', userId: 1, userName: 'John Doe', createdAt: new Date().toISOString() };

      (prisma.orderActivityLog.findUnique as jest.Mock).mockResolvedValue(mockOrderActivityLog);

      const response = await request(app)
        .get('/api/order-activity-logs/1')
        .expect(200);

      expect(response.body).toEqual(mockOrderActivityLog);
      expect(prisma.orderActivityLog.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if order activity log not found', async () => {
      (prisma.orderActivityLog.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/order-activity-logs/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Order activity log not found' });
    });
  });

  describe('POST /api/order-activity-logs', () => {
    it('should create a new order activity log', async () => {
      const newOrderActivityLog = { 
        action: 'order_created', 
        details: 'New order created', 
        userId: 1, 
        userName: 'John Doe' 
      };
      const createdOrderActivityLog = { id: 3, ...newOrderActivityLog, createdAt: new Date().toISOString() };

      (prisma.orderActivityLog.create as jest.Mock).mockResolvedValue(createdOrderActivityLog);

      const response = await request(app)
        .post('/api/order-activity-logs')
        .send(newOrderActivityLog)
        .expect(201);

      expect(response.body).toEqual(createdOrderActivityLog);
      expect(prisma.orderActivityLog.create).toHaveBeenCalledWith({
        data: {
          ...newOrderActivityLog,
          createdAt: expect.any(Date)
        }
      });
    });
  });
});