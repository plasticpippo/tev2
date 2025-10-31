import request from 'supertest';
import express from 'express';
import { transactionsRouter } from '../handlers/transactions';
import { prisma } from '../prisma';

// Create an Express app to mount the transaction routes for testing
const app = express();
app.use(express.json());
app.use('/api/transactions', transactionsRouter);

describe('Transactions API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/transactions', () => {
    it('should return all transactions', async () => {
      const mockTransactions = [
        { id: 1, items: [], subtotal: 10.9, tax: 0.88, tip: 1.0, total: 12.87, paymentMethod: 'card', userId: 1, userName: 'John Doe', tillId: 1, tillName: 'Main Till', createdAt: new Date().toISOString() },
        { id: 2, items: [], subtotal: 15.50, tax: 1.24, tip: 1.50, total: 18.24, paymentMethod: 'cash', userId: 2, userName: 'Jane Smith', tillId: 1, tillName: 'Main Till', createdAt: new Date().toISOString() }
      ];

      (prisma.transaction.findMany as jest.Mock).mockResolvedValue(mockTransactions);

      const response = await request(app)
        .get('/api/transactions')
        .expect(200);

      expect(response.body).toEqual(mockTransactions);
      expect(prisma.transaction.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching transactions fails', async () => {
      (prisma.transaction.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/transactions')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch transactions' });
    });
  });

  describe('GET /api/transactions/:id', () => {
    it('should return a specific transaction', async () => {
      const mockTransaction = { id: 1, items: [], subtotal: 10.9, tax: 0.88, tip: 1.0, total: 12.87, paymentMethod: 'card', userId: 1, userName: 'John Doe', tillId: 1, tillName: 'Main Till', createdAt: new Date().toISOString() };

      (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(mockTransaction);

      const response = await request(app)
        .get('/api/transactions/1')
        .expect(200);

      expect(response.body).toEqual(mockTransaction);
      expect(prisma.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if transaction not found', async () => {
      (prisma.transaction.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/transactions/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Transaction not found' });
    });
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const newTransaction = { 
        items: [], 
        subtotal: 10.99, 
        tax: 0.88, 
        tip: 1.00, 
        total: 12.87, 
        paymentMethod: 'card', 
        userId: 1, 
        userName: 'John Doe', 
        tillId: 1, 
        tillName: 'Main Till' 
      };
      const createdTransaction = { id: 3, ...newTransaction, createdAt: new Date().toISOString() };

      (prisma.transaction.create as jest.Mock).mockResolvedValue(createdTransaction);

      const response = await request(app)
        .post('/api/transactions')
        .send(newTransaction)
        .expect(201);

      expect(response.body).toEqual(createdTransaction);
      expect(prisma.transaction.create).toHaveBeenCalledWith({
        data: {
          ...newTransaction,
          items: JSON.stringify(newTransaction.items), // The handler serializes items to JSON
          createdAt: expect.any(Date)
        }
      });
    });
  });
});