import request from 'supertest';
import express from 'express';
import { prisma } from '../backend/src/prisma';
import roomsRouter from '../backend/src/handlers/rooms';

// Create an Express app to mount the rooms routes for testing
const app = express();
app.use(express.json());
app.use('/api/rooms', roomsRouter);

describe('Room Editing Functionality Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT /api/rooms/:id - Update Room Name', () => {
    it('should successfully update an existing room name', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Old Room Name', 
        description: 'Original description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { 
        name: 'New Room Name', 
        description: 'Updated description' 
      };
      
      const updatedRoom = { 
        id: 'room1', 
        ...updatedRoomData, 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-02T00:00:00Z' 
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
          name: 'New Room Name',
          description: 'Updated description',
        },
      });
    });

    it('should update only the room name while keeping other fields unchanged', async () => {
      const existingRoom = { 
        id: 'room2', 
        name: 'Existing Room', 
        description: 'Original description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { 
        name: 'Updated Room Name Only' 
      };
      
      const updatedRoom = { 
        id: 'room2', 
        name: 'Updated Room Name Only', 
        description: 'Original description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-02T00:00:00Z' 
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
          name: 'Updated Room Name Only',
        },
      });
    });

    it('should return 404 if room to update does not exist', async () => {
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/rooms/nonexistent')
        .send({ name: 'Updated Room Name' })
        .expect(404);

      expect(response.body).toEqual({ error: 'Room not found' });
    });

    it('should handle errors when updating room fails', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Old Room Name', 
        description: 'Original description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);
      (prisma.room.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .put('/api/rooms/room1')
        .send({ name: 'Updated Room Name' })
        .expect(500);

      expect(response.body).toEqual({ error: 'Failed to update room' });
    });

    // Edge case tests
    it('should reject empty room name', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Valid Room', 
        description: 'Original description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send({ name: '' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Failed to update room' });
    });

    it('should reject room name with only whitespace', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Valid Room', 
        description: 'Original description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send({ name: '   ' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Failed to update room' });
    });

    it('should reject room name that is too long (over 100 characters)', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Valid Room', 
        description: 'Original description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const longName = 'A'.repeat(101); // 101 characters, exceeding the 100 limit

      const response = await request(app)
        .put('/api/rooms/room1')
        .send({ name: longName })
        .expect(400);

      expect(response.body).toEqual({ error: 'Failed to update room' });
    });

    it('should reject room name with invalid characters', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Valid Room', 
        description: 'Original description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send({ name: 'Room with <script>alert("xss")</script>' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Failed to update room' });
    });

    it('should allow room name with valid special characters', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Old Room', 
        description: 'Original description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const validSpecialName = 'Room with spaces, hyphens-and_underscores (parentheses) and dots.';
      
      const updatedRoom = { 
        id: 'room1', 
        name: validSpecialName, 
        description: 'Original description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-02T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send({ name: validSpecialName })
        .expect(200);

      expect(response.body).toEqual(updatedRoom);
      expect(response.body.name).toBe(validSpecialName);
    });

    it('should handle concurrent updates to the same room', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Original Name', 
        description: 'Original description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoom = { 
        id: 'room1', 
        name: 'Concurrent Updated Name', 
        description: 'Updated description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-02T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      // Simulate concurrent requests
      const promises = [
        request(app)
          .put('/api/rooms/room1')
          .send({ name: 'First Update', description: 'First Description' })
          .expect(200),
        request(app)
          .put('/api/rooms/room1')
          .send({ name: 'Second Update', description: 'Second Description' })
          .expect(200)
      ];

      const responses = await Promise.all(promises);
      
      // Both requests should succeed, but the final state depends on which one completes last
      expect(responses.length).toBe(2);
      expect(responses[0].status).toBe(200);
      expect(responses[1].status).toBe(200);
    });
  });

  describe('Frontend Integration Tests for Room Editing', () => {
    it('should validate room name according to frontend rules when updating', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Valid Room', 
        description: 'Original description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const validRoomName = 'Updated Room Name 123';
      const updatedRoom = { 
        id: 'room1', 
        name: validRoomName, 
        description: 'Updated description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-02T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send({ name: validRoomName, description: 'Updated description' })
        .expect(200);

      expect(response.body.name).toBe(validRoomName);
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: 'room1' },
        data: {
          name: validRoomName,
          description: 'Updated description',
        },
      });
    });

    it('should maintain case sensitivity in room names', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'lowercase room', 
        description: 'Original description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoom = { 
        id: 'room1', 
        name: 'UPPERCASE ROOM', 
        description: 'Updated description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-02T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send({ name: 'UPPERCASE ROOM', description: 'Updated description' })
        .expect(200);

      expect(response.body.name).toBe('UPPERCASE ROOM');
    });
  });
});