import request from 'supertest';
import express from 'express';
import { stockItemsRouter } from '../handlers/stockItems';
import { prisma } from '../prisma';

// Create an Express app to mount the stock item routes for testing
const app = express();
app.use(express.json());
app.use('/api/stock-items', stockItemsRouter);

describe('Stock Items API', () => {
 beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/stock-items', () => {
    it('should return all stock items', async () => {
      const mockStockItems = [
        { id: '50e8400-e29b-41d4-a716-46655440000', name: 'Tomatoes', quantity: 100, type: 'ingredient', purchasingUnits: null },
        { id: '550e8400-e29b-41d4-a716-446655440001', name: 'Lettuce', quantity: 50, type: 'ingredient', purchasingUnits: null }
      ];

      (prisma.stockItem.findMany as jest.Mock).mockResolvedValue(mockStockItems);

      const response = await request(app)
        .get('/api/stock-items')
        .expect(200);

      expect(response.body).toEqual(mockStockItems);
      expect(prisma.stockItem.findMany).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching stock items fails', async () => {
      (prisma.stockItem.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/stock-items')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch stock items' });
    });
  });

  describe('GET /api/stock-items/:id', () => {
    it('should return a specific stock item', async () => {
      const mockStockItem = { id: '550e8400-e29b-41d4-a716-4665544000', name: 'Tomatoes', quantity: 100, type: 'ingredient', purchasingUnits: null };

      (prisma.stockItem.findUnique as jest.Mock).mockResolvedValue(mockStockItem);

      const response = await request(app)
        .get('/api/stock-items/550e8400-e29b-41d4-a716-46655440000')
        .expect(200);

      expect(response.body).toEqual(mockStockItem);
      expect(prisma.stockItem.findUnique).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-46655440000' }
      });
    });

    it('should return 404 if stock item not found', async () => {
      (prisma.stockItem.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/stock-items/550e8400-e29b-41d4-a716-46655440002')
        .expect(404);

      expect(response.body).toEqual({ error: 'Stock item not found' });
    });
  });

  describe('POST /api/stock-items', () => {
    it('should create a new stock item', async () => {
      const newStockItem = { name: 'New Stock Item', quantity: 10, type: 'ingredient', purchasingUnits: null };
      const createdStockItem = { id: '550e8400-e29b-41d4-a716-46655440003', ...newStockItem };

      (prisma.stockItem.create as jest.Mock).mockResolvedValue(createdStockItem);

      const response = await request(app)
        .post('/api/stock-items')
        .send(newStockItem)
        .expect(201);

      expect(response.body).toEqual(createdStockItem);
      expect(prisma.stockItem.create).toHaveBeenCalledWith({
        data: {
          ...newStockItem,
          baseUnit: 'unit', // Default base unit is added
          purchasingUnits: undefined // the handler uses undefined when not provided
        }
      });
    });
  });

  describe('PUT /api/stock-items/:id', () => {
    it('should update an existing stock item', async () => {
      const updatedStockItemData = { name: 'Updated Stock Item', quantity: 20, type: 'ingredient', purchasingUnits: null };
      const updatedStockItem = { id: '550e8400-e29b-41d4-a716-466544004', ...updatedStockItemData };

      (prisma.stockItem.update as jest.Mock).mockResolvedValue(updatedStockItem);

      const response = await request(app)
        .put('/api/stock-items/550e8400-e29b-41d4-a716-46655440004')
        .send(updatedStockItemData)
        .expect(200);

      expect(response.body).toEqual(updatedStockItem);
      expect(prisma.stockItem.update).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-46655440004' },
        data: {
          ...updatedStockItemData,
          baseUnit: 'unit', // Default base unit is added
          purchasingUnits: undefined // the handler uses undefined when not provided
        }
      });
    });
  });

  describe('DELETE /api/stock-items/:id', () => {
    it('should delete a stock item', async () => {
      (prisma.stockItem.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete('/api/stock-items/550e8400-e29b-41d4-a716-46655440005')
        .expect(204);

      expect(prisma.stockItem.delete).toHaveBeenCalledWith({
        where: { id: '550e8400-e29b-41d4-a716-46655440005' }
      });
    });

    it('should return 400 if stock item is used in a product recipe', async () => {
      // Mock that the stock item is used in a product recipe
      (prisma.stockConsumption.count as jest.Mock).mockResolvedValue(1);
      
      const response = await request(app)
        .delete('/api/stock-items/1')
        .expect(400);

      expect(response.body).toEqual({ 
        error: 'Cannot delete stock item. It is currently used in a product recipe.' 
      });
    });
  });
});