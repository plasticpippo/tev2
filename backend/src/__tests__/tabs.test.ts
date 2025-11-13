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

      // Mock to return no existing tab with same name
      (prisma.tab.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.tab.create as jest.Mock).mockResolvedValue(createdTab);

      const response = await request(app)
        .post('/api/tabs')
        .send(newTab)
        .expect(201);

      expect(response.body).toEqual(createdTab);
      expect(prisma.tab.create).toHaveBeenCalledWith({
        data: {
          ...newTab,
          name: 'New Tab', // The handler trims the name
          items: JSON.stringify(newTab.items), // The handler serializes items to JSON
          createdAt: expect.any(Date)
        }
      });
    });

    it('should return 400 if name is empty', async () => {
      const newTab = { name: '', items: [], tillId: 1, tillName: 'Main Till' };

      const response = await request(app)
        .post('/api/tabs')
        .send(newTab)
        .expect(400);

      expect(response.body).toEqual({ error: 'Tab name is required and must be a non-empty string' });
    });

    it('should return 400 if name is not provided', async () => {
      const newTab = { items: [], tillId: 1, tillName: 'Main Till' };

      const response = await request(app)
        .post('/api/tabs')
        .send(newTab)
        .expect(400);

      expect(response.body).toEqual({ error: 'Tab name is required and must be a non-empty string' });
    });

    it('should return 400 if name is only whitespace', async () => {
      const newTab = { name: '   ', items: [], tillId: 1, tillName: 'Main Till' };

      const response = await request(app)
        .post('/api/tabs')
        .send(newTab)
        .expect(400);

      expect(response.body).toEqual({ error: 'Tab name is required and must be a non-empty string' });
    });

    it('should return 409 if a tab with the same name already exists', async () => {
      const newTab = { name: 'Existing Tab', items: [], tillId: 1, tillName: 'Main Till' };

      // Mock to return an existing tab with the same name
      (prisma.tab.findFirst as jest.Mock).mockResolvedValue({ id: 1, name: 'Existing Tab' });

      const response = await request(app)
        .post('/api/tabs')
        .send(newTab)
        .expect(409);

      expect(response.body).toEqual({ error: 'A tab with this name already exists' });
    });
  });

  describe('PUT /api/tabs/:id', () => {
    it('should update an existing tab', async () => {
      const updatedTabData = { name: 'Updated Tab', items: [], tillId: 1, tillName: 'Main Till' };
      const updatedTab = { id: 1, ...updatedTabData };

      // Mock to return no existing tab with same name (excluding current tab)
      (prisma.tab.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.tab.update as jest.Mock).mockResolvedValue(updatedTab);

      const response = await request(app)
        .put('/api/tabs/1')
        .send(updatedTabData)
        .expect(200);

      expect(response.body).toEqual(updatedTab);
      expect(prisma.tab.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated Tab', // The handler trims the name
          items: JSON.stringify(updatedTabData.items), // The handler serializes items to JSON
          tillId: 1,
          tillName: 'Main Till',
          tableId: null
        }
      });
    });

    it('should return 400 if name is empty', async () => {
      const updatedTabData = { name: '', items: [], tillId: 1, tillName: 'Main Till' };

      const response = await request(app)
        .put('/api/tabs/1')
        .send(updatedTabData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Tab name must be a non-empty string' });
    });

    it('should return 400 if name is only whitespace', async () => {
      const updatedTabData = { name: '   ', items: [], tillId: 1, tillName: 'Main Till' };

      const response = await request(app)
        .put('/api/tabs/1')
        .send(updatedTabData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Tab name must be a non-empty string' });
    });

    it('should return 409 if a tab with the same name already exists', async () => {
      const updatedTabData = { name: 'Existing Tab', items: [], tillId: 1, tillName: 'Main Till' };

      // Mock to return an existing tab with the same name (excluding current tab)
      (prisma.tab.findFirst as jest.Mock).mockResolvedValue({ id: 2, name: 'Existing Tab' });

      const response = await request(app)
        .put('/api/tabs/1')
        .send(updatedTabData)
        .expect(409);

      expect(response.body).toEqual({ error: 'A tab with this name already exists' });
    });

    it('should update tab without name if name is not provided', async () => {
      const updatedTabData = { items: [], tillId: 1, tillName: 'Main Till' };
      const updatedTab = { id: 1, name: 'Original Tab', ...updatedTabData };

      (prisma.tab.update as jest.Mock).mockResolvedValue(updatedTab);

      const response = await request(app)
        .put('/api/tabs/1')
        .send(updatedTabData)
        .expect(200);

      expect(response.body).toEqual(updatedTab);
      expect(prisma.tab.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: undefined, // Name is not updated when not provided
          items: JSON.stringify(updatedTabData.items), // The handler serializes items to JSON
          tillId: 1,
          tillName: 'Main Till',
          tableId: null
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