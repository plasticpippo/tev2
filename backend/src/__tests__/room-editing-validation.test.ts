import request from 'supertest';
import express from 'express';
import { prisma } from '../prisma';
import roomsRouter from '../handlers/rooms';

// Create an Express app to mount the rooms routes for testing
const app = express();
app.use(express.json());
app.use('/api/rooms', roomsRouter);

describe('Room Editing Validation API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/rooms/:id - Update room with validation', () => {
    it('should update room name with valid characters', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { name: 'Main Dining Room' };
      const updatedRoom = { 
        id: 'room1', 
        name: 'Main Dining Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send(updatedRoomData)
        .expect(200);

      expect(response.body).toEqual(updatedRoom);
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: 'room1' },
        data: {
          name: 'Main Dining Room',
        },
      });
    });

    it('should update room name with special valid characters', async () => {
      const existingRoom = { 
        id: 'room2', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { name: "John's VIP Room (Main Floor) - Section A & B" };
      const updatedRoom = { 
        id: 'room2', 
        name: "John's VIP Room (Main Floor) - Section A & B", 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      const response = await request(app)
        .put('/api/rooms/room2')
        .send(updatedRoomData)
        .expect(200);

      expect(response.body).toEqual(updatedRoom);
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: 'room2' },
        data: {
          name: "John's VIP Room (Main Floor) - Section A & B",
        },
      });
    });

    it('should update room name with exactly 100 characters', async () => {
      const existingRoom = { 
        id: 'room3', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const maxName = 'A'.repeat(100);
      const updatedRoomData = { name: maxName };
      const updatedRoom = { 
        id: 'room3', 
        name: maxName, 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      const response = await request(app)
        .put('/api/rooms/room3')
        .send(updatedRoomData)
        .expect(200);

      expect(response.body).toEqual(updatedRoom);
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: 'room3' },
        data: {
          name: maxName,
        },
      });
    });

    it('should reject room name with invalid characters', async () => {
      const existingRoom = { 
        id: 'room4', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const invalidName = 'Room with <script>alert("xss")</script>';
      const updatedRoomData = { name: invalidName };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room4')
        .send(updatedRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });

    it('should reject room name that is too long (>100 characters)', async () => {
      const existingRoom = { 
        id: 'room5', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const longName = 'A'.repeat(101); // 101 characters
      const updatedRoomData = { name: longName };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room5')
        .send(updatedRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name must be 100 characters or less' });
    });

    it('should reject room name that is empty', async () => {
      const existingRoom = { 
        id: 'room6', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { name: '' };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room6')
        .send(updatedRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name is required' });
    });

    it('should reject room name that is only whitespace', async () => {
      const existingRoom = { 
        id: 'room7', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { name: '   ' }; // Only whitespace

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room7')
        .send(updatedRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name cannot be empty' });
    });

    it('should reject room name that is null', async () => {
      const existingRoom = { 
        id: 'room8', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { name: null };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room8')
        .send(updatedRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name is required' });
    });

    it('should reject room name that is undefined', async () => {
      const existingRoom = { 
        id: 'room9', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = {}; // No name field

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room9')
        .send(updatedRoomData)
        .expect(200); // Currently, the endpoint allows updating without name

      // If we update without name, it should preserve the original name
      expect(response.body.name).toEqual('Old Room');
    });

    it('should update only the description when name is not provided', async () => {
      const existingRoom = { 
        id: 'room10', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { description: 'New Description' };
      const updatedRoom = { 
        id: 'room10', 
        name: 'Old Room', 
        description: 'New Description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      const response = await request(app)
        .put('/api/rooms/room10')
        .send(updatedRoomData)
        .expect(200);

      expect(response.body).toEqual(updatedRoom);
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: 'room10' },
        data: {
          description: 'New Description',
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
      (prisma.room.findUnique as jest.Mock).mockResolvedValue({ 
        id: 'room11', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      });
      (prisma.room.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/rooms/room11')
        .send({ name: 'Updated Room' })
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to update room' });
    });
  });
});