import request from 'supertest';
import express from 'express';
import { prisma } from '../prisma';
import tablesRouter from '../handlers/tables';

// Create an Express app to mount the tables routes for testing
const app = express();
app.use(express.json());
app.use('/api/tables', tablesRouter);

describe('Tables API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

 describe('GET /api/tables', () => {
    it('should return all tables with room information', async () => {
      const mockTables = [
        { 
          id: 'table1', 
          name: 'Table 1', 
          x: 100, 
          y: 50, 
          width: 80, 
          height: 80, 
          status: 'available', 
          roomId: 'room1', 
          createdAt: '2023-01-01T00:00:00Z', 
          updatedAt: '2023-01-01T0:00:00Z',
          room: { id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }
        },
        { 
          id: 'table2', 
          name: 'Table 2', 
          x: 200, 
          y: 150, 
          width: 80, 
          height: 80, 
          status: 'occupied', 
          roomId: 'room1', 
          createdAt: '2023-01-01T00:00:00Z', 
          updatedAt: '2023-01-01T00:00:00Z',
          room: { id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: '2023-01-01T0:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }
        }
      ];

      (prisma.table.findMany as jest.Mock).mockResolvedValue(mockTables);

      const response = await request(app)
        .get('/api/tables')
        .expect(200);

      expect(response.body).toEqual(mockTables);
      expect(prisma.table.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.table.findMany).toHaveBeenCalledWith({
        include: {
          room: true,
        },
        orderBy: {
          id: 'asc',
        },
      });
    });

    it('should handle errors when fetching tables fails', async () => {
      (prisma.table.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/tables')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch tables' });
    });
  });

  describe('GET /api/tables/:id', () => {
    it('should return a specific table with room information', async () => {
      const mockTable = { 
        id: 'table1', 
        name: 'Table 1', 
        x: 10, 
        y: 50, 
        width: 80, 
        height: 80, 
        status: 'available', 
        roomId: 'room1', 
        createdAt: '2023-01-01T00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z',
        room: { id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }
      };

      (prisma.table.findUnique as jest.Mock).mockResolvedValue(mockTable);

      const response = await request(app)
        .get('/api/tables/table1')
        .expect(200);

      expect(response.body).toEqual(mockTable);
      expect(prisma.table.findUnique).toHaveBeenCalledWith({
        where: { id: 'table1' },
        include: {
          room: true,
        },
      });
    });

    it('should return 404 if table not found', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/tables/nonexistent')
        .expect(404);

      expect(response.body).toEqual({ error: 'Table not found' });
    });

    it('should handle errors when fetching table fails', async () => {
      (prisma.table.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/tables/table1')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch table' });
    });
  });

  describe('POST /api/tables', () => {
    it('should create a new table', async () => {
      const newTableData = { 
        name: 'New Table', 
        roomId: 'room1', 
        positionX: 100, 
        positionY: 50, 
        width: 80, 
        height: 80, 
        status: 'available' 
      };
      
      const createdTable = { 
        id: 'newtable1', 
        ...newTableData, 
        x: 100, 
        y: 50, 
        createdAt: '2023-01-01T00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z',
        room: { id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue({ id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00Z' });
      (prisma.table.create as jest.Mock).mockResolvedValue(createdTable);

      const response = await request(app)
        .post('/api/tables')
        .send(newTableData)
        .expect(201);

      expect(response.body).toEqual(createdTable);
      expect(prisma.table.create).toHaveBeenCalledWith({
        data: {
          name: 'New Table',
          roomId: 'room1',
          x: 100,
          y: 50,
          width: 80,
          height: 80,
          status: 'available',
        },
        include: {
          room: true,
        },
      });
    });

    it('should create a new table with default values when optional fields are not provided', async () => {
      const newTableData = { 
        name: 'New Table', 
        roomId: 'room1' 
      };
      
      const createdTable = { 
        id: 'newtable1', 
        name: 'New Table', 
        roomId: 'room1', 
        x: 0, 
        y: 0, 
        width: 100, 
        height: 100, 
        status: 'available', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z',
        room: { id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue({ id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00Z' });
      (prisma.table.create as jest.Mock).mockResolvedValue(createdTable);

      const response = await request(app)
        .post('/api/tables')
        .send(newTableData)
        .expect(201);

      expect(response.body).toEqual(createdTable);
      expect(prisma.table.create).toHaveBeenCalledWith({
        data: {
          name: 'New Table',
          roomId: 'room1',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          status: 'available',
        },
        include: {
          room: true,
        },
      });
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/tables')
        .send({ roomId: 'room1' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Name and roomId are required' });
    });

    it('should return 400 if roomId is missing', async () => {
      const response = await request(app)
        .post('/api/tables')
        .send({ name: 'New Table' })
        .expect(40);

      expect(response.body).toEqual({ error: 'Name and roomId are required' });
    });

    it('should return 404 if room does not exist', async () => {
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/tables')
        .send({ name: 'New Table', roomId: 'nonexistent' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Room not found' });
    });

    it('should handle errors when creating table fails', async () => {
      (prisma.room.findUnique as jest.Mock).mockResolvedValue({ id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' });
      (prisma.table.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/tables')
        .send({ name: 'New Table', roomId: 'room1' })
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to create table' });
    });
  });

  describe('PUT /api/tables/:id', () => {
    it('should update an existing table', async () => {
      const updatedTableData = { 
        name: 'Updated Table', 
        roomId: 'room2', 
        positionX: 150, 
        positionY: 100, 
        width: 90, 
        height: 90, 
        status: 'occupied' 
      };
      
      const updatedTable = { 
        id: 'table1', 
        ...updatedTableData, 
        x: 150, 
        y: 100, 
        createdAt: '2023-01-01T0:00:00Z', 
        updatedAt: '2023-01-01T00:00Z',
        room: { id: 'room2', name: 'Bar Area', description: 'Bar and lounge area', createdAt: '2023-01-01T00:00Z', updatedAt: '2023-01-01T00:00:00Z' }
      };

      (prisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 'table1', name: 'Old Table', roomId: 'room1', x: 100, y: 50, width: 80, height: 80, status: 'available', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' });
      (prisma.room.findUnique as jest.Mock).mockResolvedValue({ id: 'room2', name: 'Bar Area', description: 'Bar and lounge area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' });
      (prisma.table.update as jest.Mock).mockResolvedValue(updatedTable);

      const response = await request(app)
        .put('/api/tables/table1')
        .send(updatedTableData)
        .expect(200);

      expect(response.body).toEqual(updatedTable);
      expect(prisma.table.update).toHaveBeenCalledWith({
        where: { id: 'table1' },
        data: {
          name: 'Updated Table',
          roomId: 'room2',
          x: 150,
          y: 100,
          width: 90,
          height: 90,
          status: 'occupied',
        },
        include: {
          room: true,
        },
      });
    });

    it('should update only provided fields', async () => {
      const updatedTableData = { name: 'Updated Name Only' };
      
      const updatedTable = { 
        id: 'table1', 
        name: 'Updated Name Only', 
        roomId: 'room1', 
        x: 10, 
        y: 50, 
        width: 80, 
        height: 80, 
        status: 'available', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z',
        room: { id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }
      };

      (prisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 'table1', name: 'Old Table', roomId: 'room1', x: 100, y: 50, width: 80, height: 80, status: 'available', createdAt: '2023-01-01T00:00Z', updatedAt: '2023-01-01T00:00:00Z' });
      (prisma.table.update as jest.Mock).mockResolvedValue(updatedTable);

      const response = await request(app)
        .put('/api/tables/table1')
        .send(updatedTableData)
        .expect(200);

      expect(response.body).toEqual(updatedTable);
      expect(prisma.table.update).toHaveBeenCalledWith({
        where: { id: 'table1' },
        data: {
          name: 'Updated Name Only',
        },
        include: {
          room: true,
        },
      });
    });

    it('should return 404 if table to update not found', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/tables/nonexistent')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Table not found' });
    });

    it('should return 404 if new room does not exist', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 'table1', name: 'Old Table', roomId: 'room1', x: 100, y: 50, width: 80, height: 80, status: 'available', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' });
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/tables/table1')
        .send({ name: 'Updated Name', roomId: 'nonexistent' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Room not found' });
    });

    it('should handle errors when updating table fails', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 'table1', name: 'Old Table', roomId: 'room1', x: 100, y: 50, width: 80, height: 80, status: 'available', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' });
      (prisma.room.findUnique as jest.Mock).mockResolvedValue({ id: 'room2', name: 'Bar Area', description: 'Bar and lounge area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' });
      (prisma.table.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/tables/table1')
        .send({ name: 'Updated Name', roomId: 'room2' })
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to update table' });
    });
  });

 describe('DELETE /api/tables/:id', () => {
    it('should delete a table', async () => {
      const mockTable = { 
        id: 'table1', 
        name: 'Table to delete', 
        roomId: 'room1', 
        x: 100, 
        y: 50, 
        width: 80, 
        height: 80, 
        status: 'available', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z'
      };
      
      (prisma.table.findUnique as jest.Mock).mockResolvedValue(mockTable);
      (prisma.tab.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.table.delete as jest.Mock).mockResolvedValue(mockTable);

      const response = await request(app)
        .delete('/api/tables/table1')
        .expect(204);

      expect(prisma.table.delete).toHaveBeenCalledWith({
        where: { id: 'table1' }
      });
    });

    it('should return 404 if table to delete not found', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/tables/nonexistent')
        .expect(404);

      expect(response.body).toEqual({ error: 'Table not found' });
    });

    it('should prevent deletion of table with open tabs', async () => {
      const mockTable = { 
        id: 'table1', 
        name: 'Table with tabs', 
        roomId: 'room1', 
        x: 100, 
        y: 50, 
        width: 80, 
        height: 80, 
        status: 'available', 
        createdAt: '2023-01-01T00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z'
      };
      
      const mockTabs = [{ id: 1, name: 'Open Tab', items: [], createdAt: '2023-01-01T00:00:00Z', tillId: 1, tillName: 'Till 1' }];

      (prisma.table.findUnique as jest.Mock).mockResolvedValue(mockTable);
      (prisma.tab.findMany as jest.Mock).mockResolvedValue(mockTabs);

      const response = await request(app)
        .delete('/api/tables/table1')
        .expect(400);

      expect(response.body).toEqual({ error: 'Cannot delete table with open tabs' });
      expect(prisma.tab.findMany).toHaveBeenCalledWith({
        where: {
          tableId: 'table1',
        },
      });
    });

    it('should handle errors when deleting table fails', async () => {
      const mockTable = { 
        id: 'table1', 
        name: 'Table to delete', 
        roomId: 'room1', 
        x: 100, 
        y: 50, 
        width: 80, 
        height: 80, 
        status: 'available', 
        createdAt: '2023-01-01T00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z'
      };
      
      (prisma.table.findUnique as jest.Mock).mockResolvedValue(mockTable);
      (prisma.tab.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.table.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/tables/table1')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to delete table' });
    });
  });

  describe('PUT /api/tables/:id/position', () => {
    it('should update table position', async () => {
      const positionData = { positionX: 200, positionY: 150 };
      
      const updatedTable = { 
        id: 'table1', 
        name: 'Table 1', 
        roomId: 'room1', 
        x: 20, 
        y: 150, 
        width: 80, 
        height: 80, 
        status: 'available', 
        createdAt: '2023-01-01T00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z',
        room: { id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }
      };

      (prisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 'table1', name: 'Table 1', roomId: 'room1', x: 10, y: 50, width: 80, height: 80, status: 'available', createdAt: '2023-01-01T00:00Z', updatedAt: '2023-01-01T00:00:00Z' });
      (prisma.table.update as jest.Mock).mockResolvedValue(updatedTable);

      const response = await request(app)
        .put('/api/tables/table1/position')
        .send(positionData)
        .expect(200);

      expect(response.body).toEqual(updatedTable);
      expect(prisma.table.update).toHaveBeenCalledWith({
        where: { id: 'table1' },
        data: {
          x: 200,
          y: 150,
        },
        include: {
          room: true,
        },
      });
    });

    it('should return 404 if table to update position not found', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/tables/nonexistent/position')
        .send({ positionX: 200, positionY: 150 })
        .expect(404);

      expect(response.body).toEqual({ error: 'Table not found' });
    });

    it('should return 400 if positionX is missing', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 'table1', name: 'Table 1', roomId: 'room1', x: 10, y: 50, width: 80, height: 80, status: 'available', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' });

      const response = await request(app)
        .put('/api/tables/table1/position')
        .send({ positionY: 150 })
        .expect(400);

      expect(response.body).toEqual({ error: 'positionX and positionY are required' });
    });

    it('should return 400 if positionY is missing', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 'table1', name: 'Table 1', roomId: 'room1', x: 100, y: 50, width: 80, height: 80, status: 'available', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' });

      const response = await request(app)
        .put('/api/tables/table1/position')
        .send({ positionX: 20 })
        .expect(400);

      expect(response.body).toEqual({ error: 'positionX and positionY are required' });
    });

    it('should handle errors when updating table position fails', async () => {
      (prisma.table.findUnique as jest.Mock).mockResolvedValue({ id: 'table1', name: 'Table 1', roomId: 'room1', x: 100, y: 50, width: 80, height: 80, status: 'available', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' });
      (prisma.table.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/tables/table1/position')
        .send({ positionX: 200, positionY: 150 })
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to update table position' });
    });
  });
});