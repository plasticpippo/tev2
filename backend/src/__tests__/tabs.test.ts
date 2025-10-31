import request from 'supertest';
import express from 'express';
import { tabsRouter } from '../handlers/tabs';
import { prisma } from '../prisma';

// Create an Express app to mount the tab routes for testing
const app = express();
app.use(express.json());
app.use('/api/tabs', tabsRouter);

describe('Tabs API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/tabs', () => {
    it('should return all tabs', async () => {
      const mockTabs = [
        { id: 1, name: 'Tab 1', items: [], tillId: 1, tillName: 'Main Till', createdAt: new Date().toISOString() },
        { id: 2, name: 'Tab 2', items: [], tillId: 1, tillName: 'Main Till', createdAt: new Date().toISOString() }
      ];

      (prisma.tab.findMany as jest.Mock).mockResolvedValue(mockTabs);

      const response = await request(app)
        .get('/api/tabs')
        .expect(200);

      expect(response.body).toEqual(mockTabs);
      expect(prisma.tab.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching tabs fails', async () => {
      (prisma.tab.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/tabs')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch tabs' });
    });
 });

  describe('GET /api/tabs/:id', () => {
    it('should return a specific tab', async () => {
      const mockTab = { id: 1, name: 'Tab 1', items: [], tillId: 1, tillName: 'Main Till', createdAt: new Date().toISOString() };

      (prisma.tab.findUnique as jest.Mock).mockResolvedValue(mockTab);

      const response = await request(app)
        .get('/api/tabs/1')
        .expect(200);

      expect(response.body).toEqual(mockTab);
      expect(prisma.tab.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });

    it('should return 404 if tab not found', async () => {
      (prisma.tab.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tabs/999')
        .expect(404);

      expect(response.body).toEqual({ error: 'Tab not found' });
    });
  });

  describe('POST /api/tabs', () => {
    it('should create a new tab', async () => {
      const newTab = { name: 'New Tab', items: [], tillId: 1, tillName: 'Main Till' };
      const createdTab = { id: 3, ...newTab, createdAt: new Date().toISOString() };

      (prisma.tab.create as jest.Mock).mockResolvedValue(createdTab);

      const response = await request(app)
        .post('/api/tabs')
        .send(newTab)
        .expect(201);

      expect(response.body).toEqual(createdTab);
      expect(prisma.tab.create).toHaveBeenCalledWith({
        data: {
          ...newTab,
          items: JSON.stringify(newTab.items), // The handler serializes items to JSON
          createdAt: expect.any(Date)
        }
      });
    });
  });

  describe('PUT /api/tabs/:id', () => {
    it('should update an existing tab', async () => {
      const updatedTabData = { name: 'Updated Tab', items: [], tillId: 1, tillName: 'Main Till' };
      const updatedTab = { id: 1, ...updatedTabData };

      (prisma.tab.update as jest.Mock).mockResolvedValue(updatedTab);

      const response = await request(app)
        .put('/api/tabs/1')
        .send(updatedTabData)
        .expect(200);

      expect(response.body).toEqual(updatedTab);
      expect(prisma.tab.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          ...updatedTabData,
          items: JSON.stringify(updatedTabData.items) // The handler serializes items to JSON
        }
      });
    });
  });

  describe('DELETE /api/tabs/:id', () => {
    it('should delete a tab', async () => {
      (prisma.tab.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete('/api/tabs/1')
        .expect(204);

      expect(prisma.tab.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });
  });
});