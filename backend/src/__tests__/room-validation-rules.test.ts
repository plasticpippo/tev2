import request from 'supertest';
import express from 'express';
import { prisma } from '../prisma';
import roomsRouter from '../handlers/rooms';

// Create an Express app to mount the rooms routes for testing
const app = express();
app.use(express.json());
app.use('/api/rooms', roomsRouter);

describe('Room Validation Rules API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/rooms - validation', () => {
    it('should create a room with valid name', async () => {
      const newRoomData = { name: 'Valid Room Name', description: 'A valid room' };
      const createdRoom = { id: 'newroom1', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.findFirst as jest.Mock).mockResolvedValue(null); // No duplicate found
      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
    });

    it('should reject room with invalid characters', async () => {
      const newRoomData = { name: 'Room with <script>alert("xss")</script>', description: 'A room with invalid characters' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });

    it('should reject room name that is too long (>100 characters)', async () => {
      const longName = 'A'.repeat(101); // 101 characters
      const newRoomData = { name: longName, description: 'A room with a very long name' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name must be 100 characters or less' });
    });

    it('should reject room name that is empty', async () => {
      const newRoomData = { name: '', description: 'A room with empty name' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name is required' });
    });

    it('should reject room name that is only whitespace', async () => {
      const newRoomData = { name: '   ', description: 'A room with whitespace name' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name cannot be empty' });
    });

    it('should reject room with duplicate name', async () => {
      const newRoomData = { name: 'Existing Room', description: 'A room with duplicate name' };
      
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({ id: 'existing1', name: 'Existing Room' }); // Duplicate found

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'A room with this name already exists' });
    });

    it('should reject room with description that is too long (>500 characters)', async () => {
      const longDescription = 'A'.repeat(501); // 501 characters
      const newRoomData = { name: 'Valid Room', description: longDescription };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Description must be 500 characters or less' });
    });

    it('should return 400 if name is missing', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({ description: 'A room without name' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Name is required' });
    });
  });

  describe('PUT /api/rooms/:id - validation', () => {
    it('should update room with valid name', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { name: 'Updated Room Name' };
      const updatedRoom = { 
        id: 'room1', 
        name: 'Updated Room Name', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);
      (prisma.room.findFirst as jest.Mock).mockResolvedValue(null); // No duplicate found
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send(updatedRoomData)
        .expect(200);

      expect(response.body).toEqual(updatedRoom);
    });

    it('should reject room update with invalid characters', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { name: 'Room with <script>alert("xss")</script>' };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send(updatedRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });

    it('should reject room update with name that is too long (>100 characters)', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const longName = 'A'.repeat(101); // 101 characters
      const updatedRoomData = { name: longName };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send(updatedRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name must be 100 characters or less' });
    });

    it('should reject room update with name that is empty', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { name: '' };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send(updatedRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name cannot be empty' });
    });

    it('should reject room update with duplicate name', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { name: 'Existing Room' };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({ id: 'other-room', name: 'Existing Room' }); // Duplicate found

      const response = await request(app)
        .put('/api/rooms/room1')
        .send(updatedRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'A room with this name already exists' });
    });

    it('should reject room update with description that is too long (>500 characters)', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const longDescription = 'A'.repeat(501); // 501 characters
      const updatedRoomData = { description: longDescription };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send(updatedRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Description must be 500 characters or less' });
    });

    it('should update only description when name is not provided', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { description: 'New Description' };
      const updatedRoom = { 
        id: 'room1', 
        name: 'Old Room', 
        description: 'New Description', 
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
    });
  });
});