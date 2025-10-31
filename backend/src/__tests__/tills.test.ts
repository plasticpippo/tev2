import request from 'supertest';
import express from 'express';
import { tillsRouter } from '../handlers/tills';
import { prisma } from '../prisma';

// Create an Express app to mount the till routes for testing
const app = express();
app.use(express.json());
app.use('/api/tills', tillsRouter);

describe('Tills API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tills', () => {
    it('should return all tills', async () => {
      const mockTills = [
        { id: 1, name: 'Main Till' },
        { id: 2, name: 'Side Till' }
      ];

      (prisma.till.findMany as jest.Mock).mockResolvedValue(mockTills);

      const response = await request(app)
        .get('/api/tills')
        .expect(200);

      expect(response.body).toEqual(mockTills);
      expect(prisma.till.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching tills fails', async () => {
      (prisma.till.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/tills')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch tills' });
    });
  });

  describe('GET /api/tills/:id', () => {
    it('should return a specific till', async () => {
      const mockTill = { id: 1, name: 'Main Till' };

      (prisma.till.findUnique as jest.Mock).mockResolvedValue(mockTill);

      const response = await request(app)
        .get('/api/tills/1')
        .expect(200);

      expect(response.body).toEqual(mockTill);
      expect(prisma.till.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if till not found', async () => {
      (prisma.till.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tills/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Till not found' });
    });
  });

  describe('POST /api/tills', () => {
    it('should create a new till', async () => {
      const newTill = { name: 'New Till' };
      const createdTill = { id: 3, ...newTill };

      (prisma.till.create as jest.Mock).mockResolvedValue(createdTill);

      const response = await request(app)
        .post('/api/tills')
        .send(newTill)
        .expect(201);

      expect(response.body).toEqual(createdTill);
      expect(prisma.till.create).toHaveBeenCalledWith({
        data: newTill
      });
    });
  });

  describe('PUT /api/tills/:id', () => {
    it('should update an existing till', async () => {
      const updatedTillData = { name: 'Updated Till' };
      const updatedTill = { id: 1, ...updatedTillData };

      (prisma.till.update as jest.Mock).mockResolvedValue(updatedTill);

      const response = await request(app)
        .put('/api/tills/1')
        .send(updatedTillData)
        .expect(200);

      expect(response.body).toEqual(updatedTill);
      expect(prisma.till.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updatedTillData
      });
    });
  });

  describe('DELETE /api/tills/:id', () => {
    it('should delete a till', async () => {
      (prisma.till.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete('/api/tills/1')
        .expect(204);

      expect(prisma.till.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });
  });
});