import request from 'supertest';
import express from 'express';
import { prisma } from '../prisma';
import roomsRouter from '../handlers/rooms';

// Create an Express app to mount the rooms routes for testing
const app = express();
app.use(express.json());
app.use('/api/rooms', roomsRouter);

describe('Room Deletion Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE /api/rooms/:id', () => {
    it('should successfully delete a room with no assigned tables', async () => {
      const mockRoom = { 
        id: 'room1', 
        name: 'Unused Room', 
        description: 'A room with no tables', 
        createdAt: new Date('2023-01-01T00:00:00Z'), 
        updatedAt: new Date('2023-01-01T00:00:00Z') 
      };
      const mockTablesCount = 0;

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (prisma.table.count as jest.Mock).mockResolvedValue(mockTablesCount);
      (prisma.room.delete as jest.Mock).mockResolvedValue(mockRoom);

      const response = await request(app)
        .delete('/api/rooms/room1')
        .expect(204);

      expect(response.body).toEqual({});
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: 'room1' }
      });
      expect(prisma.table.count).toHaveBeenCalledWith({
        where: {
          roomId: 'room1',
        },
      });
      expect(prisma.room.delete).toHaveBeenCalledWith({
        where: { id: 'room1' }
      });
    });

    it('should return 404 if attempting to delete a non-existent room', async () => {
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/rooms/nonexistent')
        .expect(404);

      expect(response.body).toEqual({ error: 'Room not found' });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' }
      });
      // Should not check for tables if room doesn't exist
      expect(prisma.table.count).not.toHaveBeenCalled();
      expect(prisma.room.delete).not.toHaveBeenCalled();
    });

    it('should prevent deletion of room with assigned tables (1 table)', async () => {
      const mockRoom = { 
        id: 'room1', 
        name: 'Room with tables', 
        description: 'A room with tables assigned', 
        createdAt: new Date('2023-01-01T00:00:00Z'), 
        updatedAt: new Date('2023-01-01T00:00:00Z') 
      };
      const mockTablesCount = 1;

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (prisma.table.count as jest.Mock).mockResolvedValue(mockTablesCount);

      const response = await request(app)
        .delete('/api/rooms/room1')
        .expect(400);

      expect(response.body).toEqual({ 
        error: 'Cannot delete room with 1 assigned table(s). Please delete or reassign tables first.',
        tableCount: 1
      });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: 'room1' }
      });
      expect(prisma.table.count).toHaveBeenCalledWith({
        where: {
          roomId: 'room1',
        },
      });
      expect(prisma.room.delete).not.toHaveBeenCalled();
    });

    it('should prevent deletion of room with assigned tables (multiple tables)', async () => {
      const mockRoom = { 
        id: 'room2', 
        name: 'Room with multiple tables', 
        description: 'A room with multiple tables assigned', 
        createdAt: new Date('2023-01-01T00:00:00Z'), 
        updatedAt: new Date('2023-01-01T00:00:00Z') 
      };
      const mockTablesCount = 5;

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (prisma.table.count as jest.Mock).mockResolvedValue(mockTablesCount);

      const response = await request(app)
        .delete('/api/rooms/room2')
        .expect(400);

      expect(response.body).toEqual({ 
        error: 'Cannot delete room with 5 assigned table(s). Please delete or reassign tables first.',
        tableCount: 5
      });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: 'room2' }
      });
      expect(prisma.table.count).toHaveBeenCalledWith({
        where: {
          roomId: 'room2',
        },
      });
      expect(prisma.room.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during room lookup', async () => {
      (prisma.room.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .delete('/api/rooms/room1')
        .expect(500);

      expect(response.body).toEqual({ 
        error: 'Failed to delete room', 
        details: 'Database connection failed' 
      });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: 'room1' }
      });
      // Should not proceed with table count or deletion if room lookup fails
      expect(prisma.table.count).not.toHaveBeenCalled();
      expect(prisma.room.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during table count', async () => {
      const mockRoom = { 
        id: 'room1', 
        name: 'Test Room', 
        description: 'A test room', 
        createdAt: new Date('2023-01-01T00:00:00Z'), 
        updatedAt: new Date('2023-01-01T00:00:00Z') 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (prisma.table.count as jest.Mock).mockRejectedValue(new Error('Table count failed'));

      const response = await request(app)
        .delete('/api/rooms/room1')
        .expect(500);

      expect(response.body).toEqual({ 
        error: 'Failed to delete room', 
        details: 'Table count failed' 
      });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: 'room1' }
      });
      expect(prisma.table.count).toHaveBeenCalledWith({
        where: {
          roomId: 'room1',
        },
      });
      // Should not proceed with deletion if table count fails
      expect(prisma.room.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during room deletion', async () => {
      const mockRoom = { 
        id: 'room1', 
        name: 'Test Room', 
        description: 'A test room', 
        createdAt: new Date('2023-01-01T00:00:00Z'), 
        updatedAt: new Date('2023-01-01T00:00:00Z') 
      };
      const mockTablesCount = 0;

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (prisma.table.count as jest.Mock).mockResolvedValue(mockTablesCount);
      (prisma.room.delete as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

      const response = await request(app)
        .delete('/api/rooms/room1')
        .expect(500);

      expect(response.body).toEqual({ 
        error: 'Failed to delete room', 
        details: 'Deletion failed' 
      });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: 'room1' }
      });
      expect(prisma.table.count).toHaveBeenCalledWith({
        where: {
          roomId: 'room1',
        },
      });
      expect(prisma.room.delete).toHaveBeenCalledWith({
        where: { id: 'room1' }
      });
    });

    it('should correctly validate that only unused rooms can be deleted', async () => {
      // This test verifies the core business rule: only rooms without assigned tables can be deleted
      
      // First, test that a room with 0 tables can be deleted
      const mockUnusedRoom = { 
        id: 'unused-room', 
        name: 'Unused Room', 
        description: 'A room with no tables', 
        createdAt: new Date('2023-01-01T00:00:00Z'), 
        updatedAt: new Date('2023-01-01T00:00:00Z') 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValueOnce(mockUnusedRoom);
      (prisma.table.count as jest.Mock).mockResolvedValueOnce(0);
      (prisma.room.delete as jest.Mock).mockResolvedValueOnce(mockUnusedRoom);

      const successResponse = await request(app)
        .delete('/api/rooms/unused-room')
        .expect(204);

      expect(successResponse.status).toBe(204);
      
      // Reset mocks and test that a room with tables cannot be deleted
      jest.clearAllMocks();

      const mockUsedRoom = { 
        id: 'used-room', 
        name: 'Used Room', 
        description: 'A room with tables', 
        createdAt: new Date('2023-01-01T00:00:00Z'), 
        updatedAt: new Date('2023-01-01T00:00:00Z') 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValueOnce(mockUsedRoom);
      (prisma.table.count as jest.Mock).mockResolvedValueOnce(3);

      const failureResponse = await request(app)
        .delete('/api/rooms/used-room')
        .expect(400);

      expect(failureResponse.body).toEqual({ 
        error: 'Cannot delete room with 3 assigned table(s). Please delete or reassign tables first.',
        tableCount: 3
      });
    });
  });
});