import request from 'supertest';
import express from 'express';
import { MockProxy, mock } from 'jest-mock-extended';
import { orderSessionsRouter } from '../handlers/orderSessions';

// Mock the entire prisma module
jest.mock('../prisma', () => ({
  prisma: {
    orderSession: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  }
}));

import { prisma } from '../prisma';

// Create an Express app to mount the order sessions routes for testing
const app = express();
app.use(express.json());
app.use('/api/order-sessions', orderSessionsRouter);

describe('OrderSessions API', () => {
 beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/order-sessions/current', () => {
    it('should return 401 when user is not authenticated', async () => {
      const response = await request(app)
        .get('/api/order-sessions/current')
        .query({ userId: null })
        .expect(401);
      
      expect(response.body.error).toBe('User not authenticated');
    });

    it('should return the current user\'s active order session', async () => {
      const mockUser = { id: 1, name: 'Test User', username: 'testuser', password_HACK: 'password', role: 'Cashier' };
      const mockSession = {
        id: 'test-session-id',
        userId: 1,
        items: JSON.stringify([{ id: '1', variantId: 1, productId: 1, name: 'Test Item', price: 10, quantity: 1, effectiveTaxRate: 0.1 }]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        logoutTime: null
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.orderSession.findFirst as jest.Mock).mockResolvedValue(mockSession);

      const response = await request(app)
        .get('/api/order-sessions/current')
        .query({ userId: 1 })
        .expect(200);
      
      expect(response.body.id).toBe(mockSession.id);
      expect(response.body.userId).toBe(mockSession.userId);
      expect(response.body.status).toBe(mockSession.status);
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items[0].name).toBe('Test Item');
    });

    it('should return 404 when no active order session exists', async () => {
      (prisma.orderSession.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/order-sessions/current')
        .query({ userId: 1 })
        .expect(404);
      
      expect(response.body.error).toBe('No active order session found');
    });
  });

  describe('POST /api/order-sessions/current', () => {
    it('should create a new order session when none exists', async () => {
      const mockUser = { id: 1, name: 'Test User', username: 'testuser', password_HACK: 'password', role: 'Cashier' };
      const mockSession = {
        id: 'test-session-id',
        userId: 1,
        items: JSON.stringify([{ id: '1', variantId: 1, productId: 1, name: 'Test Item', price: 10, quantity: 1, effectiveTaxRate: 0.1 }]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const items = [{ id: '1', variantId: 1, productId: 1, name: 'Test Item', price: 10, quantity: 1, effectiveTaxRate: 0.1 }];
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.orderSession.findFirst as jest.Mock).mockResolvedValue(null); // No existing session
      (prisma.orderSession.create as jest.Mock).mockResolvedValue(mockSession);

      const response = await request(app)
        .post('/api/order-sessions/current')
        .send({ userId: 1, items })
        .expect(201);
      
      expect(response.body.userId).toBe(mockSession.userId);
      expect(response.body.status).toBe(mockSession.status);
      expect(response.body.items).toBe(mockSession.items); // items is a JSON string for POST operations
      expect(prisma.orderSession.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          items: JSON.stringify(items),
          status: 'active',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });

    it('should update an existing order session if one exists', async () => {
      const mockUser = { id: 1, name: 'Test User', username: 'testuser', password_HACK: 'password', role: 'Cashier' };
      const existingSession = {
        id: 'existing-session-id',
        userId: 1,
        items: JSON.stringify([{ id: '1', variantId: 1, productId: 1, name: 'Old Item', price: 5, quantity: 1, effectiveTaxRate: 0.1 }]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedSession = {
        id: 'existing-session-id',
        userId: 1,
        items: JSON.stringify([{ id: '2', variantId: 2, productId: 2, name: 'New Item', price: 15, quantity: 2, effectiveTaxRate: 0.1 }]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const newItems = [{ id: '2', variantId: 2, productId: 2, name: 'New Item', price: 15, quantity: 2, effectiveTaxRate: 0.1 }];
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.orderSession.findFirst as jest.Mock).mockResolvedValue(existingSession); // Existing session found
      (prisma.orderSession.update as jest.Mock).mockResolvedValue(updatedSession);

      const response = await request(app)
        .post('/api/order-sessions/current')
        .send({ userId: 1, items: newItems })
        .expect(201);
      
      expect(response.body.id).toBe(existingSession.id);
      expect(response.body.userId).toBe(existingSession.userId);
      expect(response.body.status).toBe('active');
      expect(response.body.items).toBe(JSON.stringify(newItems)); // After update, items should be the new items
      expect(prisma.orderSession.update).toHaveBeenCalledWith({
        where: { id: existingSession.id },
        data: {
          items: JSON.stringify(newItems),
          status: 'active',
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('PUT /api/order-sessions/current', () => {
    it('should update the current user\'s order session', async () => {
      const mockUser = { id: 1, name: 'Test User', username: 'testuser', password_HACK: 'password', role: 'Cashier' };
      const existingSession = {
        id: 'existing-session-id',
        userId: 1,
        items: JSON.stringify([{ id: '1', variantId: 1, productId: 1, name: 'Old Item', price: 5, quantity: 1, effectiveTaxRate: 0.1 }]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const updatedSession = {
        id: 'existing-session-id',
        userId: 1,
        items: JSON.stringify([{ id: '2', variantId: 2, productId: 2, name: 'Updated Item', price: 20, quantity: 3, effectiveTaxRate: 0.1 }]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const newItems = [{ id: '2', variantId: 2, productId: 2, name: 'Updated Item', price: 20, quantity: 3, effectiveTaxRate: 0.1 }];
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.orderSession.findFirst as jest.Mock).mockResolvedValue(existingSession);
      (prisma.orderSession.update as jest.Mock).mockResolvedValue(updatedSession);

      const response = await request(app)
        .put('/api/order-sessions/current')
        .send({ userId: 1, items: newItems })
        .expect(200);
      
      expect(response.body.id).toBe(existingSession.id);
      expect(response.body.userId).toBe(existingSession.userId);
      expect(response.body.items).toBe(JSON.stringify(newItems)); // After update, items should be the new items
      expect(prisma.orderSession.update).toHaveBeenCalledWith({
        where: { id: existingSession.id },
        data: {
          items: JSON.stringify(newItems),
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('PUT /api/order-sessions/current/logout', () => {
    it('should mark the session as pending logout', async () => {
      const mockUser = { id: 1, name: 'Test User', username: 'testuser', password_HACK: 'password', role: 'Cashier' };
      const existingSession = {
        id: 'existing-session-id',
        userId: 1,
        items: JSON.stringify([{ id: '1', variantId: 1, productId: 1, name: 'Test Item', price: 10, quantity: 1, effectiveTaxRate: 0.1 }]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        logoutTime: null
      };
      const updatedSession = {
        id: 'existing-session-id',
        userId: 1,
        items: JSON.stringify([{ id: '1', variantId: 1, productId: 1, name: 'Test Item', price: 10, quantity: 1, effectiveTaxRate: 0.1 }]),
        status: 'pending_logout',
        createdAt: new Date(),
        updatedAt: new Date(),
        logoutTime: new Date()
      };
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.orderSession.findFirst as jest.Mock).mockResolvedValue(existingSession);
      (prisma.orderSession.update as jest.Mock).mockResolvedValue(updatedSession);

      const response = await request(app)
        .put('/api/order-sessions/current/logout')
        .send({ userId: 1 })
        .expect(200);
      
      expect(response.body.id).toBe(existingSession.id);
      expect(response.body.status).toBe('pending_logout');
      expect(response.body.logoutTime).not.toBeNull();
      expect(prisma.orderSession.update).toHaveBeenCalledWith({
        where: { id: existingSession.id },
        data: {
          status: 'pending_logout',
          logoutTime: expect.any(Date),
          updatedAt: expect.any(Date)
        }
      });
    });
  });

  describe('PUT /api/order-sessions/current/complete', () => {
    it('should mark the session as completed', async () => {
      const mockUser = { id: 1, name: 'Test User', username: 'testuser', password_HACK: 'password', role: 'Cashier' };
      const existingSession = {
        id: 'existing-session-id',
        userId: 1,
        items: JSON.stringify([{ id: '1', variantId: 1, productId: 1, name: 'Test Item', price: 10, quantity: 1, effectiveTaxRate: 0.1 }]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        logoutTime: null
      };
      const updatedSession = {
        id: 'existing-session-id',
        userId: 1,
        items: JSON.stringify([{ id: '1', variantId: 1, productId: 1, name: 'Test Item', price: 10, quantity: 1, effectiveTaxRate: 0.1 }]),
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        logoutTime: null
      };
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.orderSession.findFirst as jest.Mock).mockResolvedValue(existingSession);
      (prisma.orderSession.update as jest.Mock).mockResolvedValue(updatedSession);

      const response = await request(app)
        .put('/api/order-sessions/current/complete')
        .send({ userId: 1 })
        .expect(200);
      
      expect(response.body.id).toBe(existingSession.id);
      expect(response.body.status).toBe('completed');
      expect(prisma.orderSession.update).toHaveBeenCalledWith({
        where: { id: existingSession.id },
        data: {
          status: 'completed',
          updatedAt: expect.any(Date)
        }
      });
    });
 });

  describe('PUT /api/order-sessions/current/assign-tab', () => {
    it('should mark the session as completed when assigned to a tab', async () => {
      const mockUser = { id: 1, name: 'Test User', username: 'testuser', password_HACK: 'password', role: 'Cashier' };
      const existingSession = {
        id: 'existing-session-id',
        userId: 1,
        items: JSON.stringify([{ id: '1', variantId: 1, productId: 1, name: 'Test Item', price: 10, quantity: 1, effectiveTaxRate: 0.1 }]),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        logoutTime: null
      };
      const updatedSession = {
        id: 'existing-session-id',
        userId: 1,
        items: JSON.stringify([{ id: '1', variantId: 1, productId: 1, name: 'Test Item', price: 10, quantity: 1, effectiveTaxRate: 0.1 }]),
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
        logoutTime: null
      };
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.orderSession.findFirst as jest.Mock).mockResolvedValue(existingSession);
      (prisma.orderSession.update as jest.Mock).mockResolvedValue(updatedSession);

      const response = await request(app)
        .put('/api/order-sessions/current/assign-tab')
        .send({ userId: 1 })
        .expect(200);
      
      expect(response.body.id).toBe(existingSession.id);
      expect(response.body.status).toBe('completed');
      expect(prisma.orderSession.update).toHaveBeenCalledWith({
        where: { id: existingSession.id },
        data: {
          status: 'completed',
          updatedAt: expect.any(Date)
        }
      });
    });
  });
});