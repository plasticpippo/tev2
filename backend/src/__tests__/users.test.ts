import request from 'supertest';
import express from 'express';
import { MockProxy, mock } from 'jest-mock-extended';
import { usersRouter } from '../handlers/users';
import { prisma } from '../prisma';

// Mock the entire prisma module
jest.mock('../prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tab: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    till: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    stockItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    stockAdjustment: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    orderActivityLog: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    settings: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    stockConsumption: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateMany: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  }
}));

// Create an Express app to mount the user routes for testing
const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

describe('Users API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', username: 'johndoe', password_HACK: 'password123', role: 'Admin' },
        { id: 2, name: 'Jane Smith', username: 'janesmith', password_HACK: 'password456', role: 'Cashier' }
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching users fails', async () => {
      (prisma.user.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/users')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch users' });
    });
  });

 describe('GET /api/users/:id', () => {
    it('should return a specific user', async () => {
      const mockUser = { id: 1, name: 'John Doe', username: 'johndoe', password_HACK: 'password123', role: 'Admin' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/1')
        .expect(200);

      expect(response.body).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'User not found' });
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const newUser = { name: 'New User', username: 'newuser', password_HACK: 'password', role: 'Cashier' };
      const createdUser = { id: 3, ...newUser };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null); // User doesn't exist
      (prisma.user.create as jest.Mock).mockResolvedValue(createdUser);

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(201);

      expect(response.body).toEqual(createdUser);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: newUser
      });
    });

    it('should return 409 if username already exists', async () => {
      const newUser = { name: 'New User', username: 'existinguser', password_HACK: 'password', role: 'Cashier' };
      const existingUser = { id: 1, ...newUser };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/users')
        .send(newUser)
        .expect(409);

      expect(response.body).toEqual({ error: 'Username already exists' });
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update an existing user', async () => {
      const updatedUserData = { name: 'Updated Name', username: 'updateduser', password_HACK: 'newpassword', role: 'Admin' };
      const updatedUser = { id: 1, ...updatedUserData };

      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      const response = await request(app)
        .put('/api/users/1')
        .send(updatedUserData)
        .expect(200);

      expect(response.body).toEqual(updatedUser);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updatedUserData
      });
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user', async () => {
      (prisma.user.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete('/api/users/1')
        .expect(204);

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });
  });

  describe('POST /api/users/login', () => {
    it('should login a user with valid credentials', async () => {
      const loginData = { username: 'johndoe', password: 'password123' };
      const user = { id: 1, name: 'John Doe', username: 'johndoe', password_HACK: 'password123', role: 'Admin' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toEqual(user);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { 
          username: 'johndoe',
          password_HACK: 'password123'
        }
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const loginData = { username: 'johndoe', password: 'wrongpassword' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toEqual({ error: 'Invalid credentials' });
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({})
        .expect(400);

      expect(response.body).toEqual({ error: 'Username and password are required' });
    });
  });
});