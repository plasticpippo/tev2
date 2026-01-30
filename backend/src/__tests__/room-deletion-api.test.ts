import request from 'supertest';
import express from 'express';
import { prisma } from '../prisma';
import roomsRouter from '../handlers/rooms';

// Create an Express app to mount the rooms routes for testing
const app = express();
app.use(express.json());

// Temporarily disable auth middleware for testing
const testRouter = express.Router();
testRouter.use((req, res, next) => {
  // Add a mock user to the request to bypass auth
  (req as any).user = { id: 'test-user', role: 'admin' };
  next();
});
testRouter.use(roomsRouter);
app.use('/api/rooms', testRouter);

describe('Room Deletion API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE /api/rooms/:id - API Behavior', () => {
    it('should delete a room from the database and return 204 status', async () => {
      const roomId = 'room1';
      const mockRoom = { id: roomId, name: 'Test Room', description: 'A test room' };
      
      // Mock the database operations
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (prisma.table.count as jest.Mock).mockResolvedValue(0); // No tables associated
      (prisma.room.delete as jest.Mock).mockResolvedValue(mockRoom);

      const response = await request(app)
        .delete(`/api/rooms/${roomId}`)
        .expect(204);

      // Verify the response is empty (204 No Content)
      expect(response.body).toEqual({});
      
      // Verify the correct database methods were called
      expect(prisma.room.findUnique).toHaveBeenCalledWith({ where: { id: roomId } });
      expect(prisma.table.count).toHaveBeenCalledWith({ where: { roomId } });
      expect(prisma.room.delete).toHaveBeenCalledWith({ where: { id: roomId } });
    });

    it('should return 404 when trying to delete a non-existent room', async () => {
      const roomId = 'nonexistent-room';
      
      // Mock the database to return null (room not found)
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete(`/api/rooms/${roomId}`)
        .expect(404);

      expect(response.body).toEqual({ error: 'Room not found' });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({ where: { id: roomId } });
      // The delete method should not be called
      expect(prisma.room.delete).not.toHaveBeenCalled();
    });

    it('should prevent deletion of room with assigned tables and return 400', async () => {
      const roomId = 'room-with-tables';
      const mockRoom = { id: roomId, name: 'Room with tables', description: 'A room with tables' };
      const tablesCount = 3;
      
      // Mock the database operations
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (prisma.table.count as jest.Mock).mockResolvedValue(tablesCount);

      const response = await request(app)
        .delete(`/api/rooms/${roomId}`)
        .expect(400);

      expect(response.body).toEqual({
        error: `Cannot delete room with ${tablesCount} assigned table(s). Please delete or reassign tables first.`,
        tableCount: tablesCount
      });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({ where: { id: roomId } });
      expect(prisma.table.count).toHaveBeenCalledWith({ where: { roomId } });
      // The delete method should not be called
      expect(prisma.room.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during room lookup', async () => {
      const roomId = 'room-with-db-error';
      
      // Mock the database to throw an error
      (prisma.room.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .delete(`/api/rooms/${roomId}`)
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to delete room', details: 'Database connection failed' });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({ where: { id: roomId } });
    });

    it('should handle database errors during table count', async () => {
      const roomId = 'room-with-table-count-error';
      const mockRoom = { id: roomId, name: 'Test Room', description: 'A test room' };
      
      // Mock the database operations
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (prisma.table.count as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete(`/api/rooms/${roomId}`)
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to delete room', details: 'Database error' });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({ where: { id: roomId } });
      expect(prisma.table.count).toHaveBeenCalledWith({ where: { roomId } });
    });

    it('should handle database errors during room deletion', async () => {
      const roomId = 'room-with-deletion-error';
      const mockRoom = { id: roomId, name: 'Test Room', description: 'A test room' };
      
      // Mock the database operations
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (prisma.table.count as jest.Mock).mockResolvedValue(0); // No tables associated
      (prisma.room.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete(`/api/rooms/${roomId}`)
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to delete room', details: 'Database error' });
      expect(prisma.room.findUnique).toHaveBeenCalledWith({ where: { id: roomId } });
      expect(prisma.table.count).toHaveBeenCalledWith({ where: { roomId } });
      expect(prisma.room.delete).toHaveBeenCalledWith({ where: { id: roomId } });
    });

    it('should properly clean up room data from database after successful deletion', async () => {
      const roomId = 'room-to-delete';
      const mockRoom = { id: roomId, name: 'Room to Delete', description: 'This room will be deleted' };
      
      // Mock the database operations
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (prisma.table.count as jest.Mock).mockResolvedValue(0); // No tables associated
      (prisma.room.delete as jest.Mock).mockResolvedValue(mockRoom);

      // First, verify the room exists (before deletion)
      await request(app)
        .get(`/api/rooms/${roomId}`)
        .expect(200);

      // Perform the deletion
      await request(app)
        .delete(`/api/rooms/${roomId}`)
        .expect(204);

      // Verify that the delete operation was called correctly
      expect(prisma.room.delete).toHaveBeenCalledWith({ where: { id: roomId } });
      
      // After deletion, the room should no longer be available
      (prisma.room.findUnique as jest.Mock).mockResolvedValueOnce(null);
      const response = await request(app)
        .get(`/api/rooms/${roomId}`)
        .expect(404);
        
      expect(response.body).toEqual({ error: 'Room not found' });
    });
  });
});