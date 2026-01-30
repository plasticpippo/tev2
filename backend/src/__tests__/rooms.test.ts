import request from 'supertest';
import express from 'express';
import { prisma } from '../prisma';
import roomsRouter from '../handlers/rooms';

// Create an Express app to mount the rooms routes for testing
const app = express();
app.use(express.json());
app.use('/api/rooms', roomsRouter);

describe('Rooms API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/rooms', () => {
    it('should return all rooms', async () => {
      const mockRooms = [
        { id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' },
        { id: 'room2', name: 'Bar Area', description: 'Bar and lounge area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }
      ];

      (prisma.room.findMany as jest.Mock).mockResolvedValue(mockRooms);

      const response = await request(app)
        .get('/api/rooms')
        .expect(200);

      expect(response.body).toEqual(mockRooms);
      expect(prisma.room.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.room.findMany).toHaveBeenCalledWith({
        include: {
          tables: true,
        },
        orderBy: {
          id: 'asc',
        },
      });
    });

    it('should handle errors when fetching rooms fails', async () => {
      (prisma.room.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/rooms')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch rooms', details: 'Database error' });
    });
  });

  describe('GET /api/rooms/:id', () => {
    it('should return a specific room', async () => {
      const mockRoom = { id: 'room1', name: 'Main Dining', description: 'Main dining area', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);

      const response = await request(app)
        .get('/api/rooms/room1')
        .expect(200);

      expect(response.body).toEqual(mockRoom);
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: 'room1' },
        include: {
          tables: true,
        },
      });
    });

    it('should return 404 if room not found', async () => {
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/rooms/nonexistent')
        .expect(404);

      expect(response.body).toEqual({ error: 'Room not found' });
    });

    it('should handle errors when fetching room fails', async () => {
      (prisma.room.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/rooms/room1')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to fetch room', details: 'Database error' });
    });
  });

  describe('POST /api/rooms', () => {
    it('should create a new room', async () => {
      const newRoomData = { name: 'New Room', description: 'A new room' };
      const createdRoom = { id: 'newroom1', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
        include: {
          tables: true,
        },
      });
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({ description: 'A room without name' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Name is required' });
    });

    it('should handle errors when creating room fails', async () => {
      const newRoomData = { name: 'New Room', description: 'A new room' };
      (prisma.room.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to create room', details: 'Database error' });
    });
  });

  describe('PUT /api/rooms/:id', () => {
    it('should update an existing room', async () => {
      const updatedRoomData = { name: 'Updated Room', description: 'Updated description' };
      const updatedRoom = { id: 'room1', ...updatedRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue({ id: 'room1', name: 'Old Room', description: 'Old description', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' });
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send(updatedRoomData)
        .expect(200);

      expect(response.body).toEqual(updatedRoom);
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: 'room1' },
        data: {
          name: 'Updated Room',
          description: 'Updated description',
        },
        include: {
          tables: true,
        },
      });
    });

    it('should update only provided fields', async () => {
      const updatedRoomData = { name: 'Updated Room Only' };
      const updatedRoom = { id: 'room1', name: 'Updated Room Only', description: 'Old description', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue({ id: 'room1', name: 'Old Room', description: 'Old description', createdAt: '2023-01-01T0:00:00Z', updatedAt: '2023-01-01T00:00:00Z' });
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send(updatedRoomData)
        .expect(200);

      expect(response.body).toEqual(updatedRoom);
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: 'room1' },
        data: {
          name: 'Updated Room Only',
        },
        include: {
          tables: true,
        },
      });
    });

    it('should return 404 if room to update not found', async () => {
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/rooms/nonexistent')
        .send({ name: 'Updated Room' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Room not found' });
    });

    it('should handle errors when updating room fails', async () => {
      (prisma.room.findUnique as jest.Mock).mockResolvedValue({ id: 'room1', name: 'Old Room', description: 'Old description', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' });
      (prisma.room.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/rooms/room1')
        .send({ name: 'Updated Room' })
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to update room', details: 'Database error' });
    });
  });

  describe('DELETE /api/rooms/:id', () => {
    it('should delete a room', async () => {
      const mockRoom = { id: 'room1', name: 'Room to delete', description: 'A room to delete', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };
      const mockTablesCount = 0;

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (prisma.table.count as jest.Mock).mockResolvedValue(mockTablesCount);
      (prisma.room.delete as jest.Mock).mockResolvedValue(mockRoom);

      const response = await request(app)
        .delete('/api/rooms/room1')
        .expect(204);

      expect(prisma.room.delete).toHaveBeenCalledWith({
        where: { id: 'room1' }
      });
    });

    it('should return 404 if room to delete not found', async () => {
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/rooms/nonexistent')
        .expect(404);

      expect(response.body).toEqual({ error: 'Room not found' });
    });

    it('should prevent deletion of room with assigned tables', async () => {
      const mockRoom = { id: 'room1', name: 'Room with tables', description: 'A room with tables', createdAt: '2023-01-01T00:00Z', updatedAt: '2023-01-01T0:00:00Z' };
      const mockTablesCount = 2;

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (prisma.table.count as jest.Mock).mockResolvedValue(mockTablesCount);

      const response = await request(app)
        .delete('/api/rooms/room1')
        .expect(400);

      expect(response.body).toEqual({ error: 'Cannot delete room with 2 assigned table(s). Please delete or reassign tables first.', tableCount: 2 });
      expect(prisma.table.count).toHaveBeenCalledWith({
        where: {
          roomId: 'room1',
        },
      });
    });

    it('should handle errors when deleting room fails', async () => {
      const mockRoom = { id: 'room1', name: 'Room to delete', description: 'A room to delete', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };
      const mockTablesCount = 0;

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);
      (prisma.table.count as jest.Mock).mockResolvedValue(mockTablesCount);
      (prisma.room.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/rooms/room1')
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to delete room', details: 'Database error' });
    });
  });
});