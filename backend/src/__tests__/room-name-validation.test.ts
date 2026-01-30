import request from 'supertest';
import express from 'express';
import { prisma } from '../prisma';
import roomsRouter from '../handlers/rooms';

// Create an Express app to mount the rooms routes for testing
const app = express();
app.use(express.json());
app.use('/api/rooms', roomsRouter);

describe('Room Name Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Room Name Validation - Empty Names', () => {
    it('should reject room with empty name string', async () => {
      const newRoomData = { name: '', description: 'A room with empty name' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Name is required' });
    });

    it('should reject room with only spaces in name', async () => {
      const newRoomData = { name: '   ', description: 'A room with whitespace name' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name cannot be empty' });
    });

    it('should reject room with only tabs and spaces in name', async () => {
      const newRoomData = { name: '\t\t  \t', description: 'A room with tab/space name' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name cannot be empty' });
    });

    it('should reject room with only special whitespace characters', async () => {
      const newRoomData = { name: '\u0020\u00A0\u2000', description: 'A room with special whitespace' }; // space, non-breaking space, en quad

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name cannot be empty' });
    });

    it('should reject room with null name', async () => {
      const newRoomData = { name: null, description: 'A room with null name' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Name is required' });
    });

    it('should reject room with undefined name', async () => {
      const newRoomData = { name: undefined, description: 'A room with undefined name' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Name is required' });
    });
  });

  describe('Room Name Validation - Length Limits', () => {
    it('should accept room name with exactly 100 characters', async () => {
      const validName = 'A'.repeat(100);
      const newRoomData = { name: validName, description: 'A room with exactly 100 chars' };
      const createdRoom = { id: 'newroom1', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.findFirst as jest.Mock).mockResolvedValue(null); // No duplicate found
      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
    });

    it('should reject room name with 101 characters', async () => {
      const longName = 'A'.repeat(101); // 101 characters
      const newRoomData = { name: longName, description: 'A room with 101 char name' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name must be 100 characters or less' });
    });

    it('should reject room name with 200 characters', async () => {
      const longName = 'A'.repeat(200); // 200 characters
      const newRoomData = { name: longName, description: 'A room with 200 char name' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name must be 100 characters or less' });
    });

    it('should reject room name with 1000 characters', async () => {
      const longName = 'A'.repeat(1000); // 1000 characters
      const newRoomData = { name: longName, description: 'A room with 1000 char name' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name must be 100 characters or less' });
    });
  });

  describe('Room Name Validation - Special Characters', () => {
    it('should reject room name with HTML tags', async () => {
      const newRoomData = { name: 'Room with <script>alert("xss")</script>', description: 'A room with HTML' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });

    it('should reject room name with SQL injection characters', async () => {
      const newRoomData = { name: 'Room with \'; DROP TABLE rooms; --', description: 'A room with SQL injection' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });

    it('should reject room name with various special characters', async () => {
      const newRoomData = { name: 'Room with !@#$%^&*()+=[]{}|;:"<>?/', description: 'A room with special chars' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });

    it('should reject room name with backslashes and quotes', async () => {
      const newRoomData = { name: 'Room with \\"\'\\', description: 'A room with backslashes' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });

    it('should accept room name with allowed special characters', async () => {
      const newRoomData = { name: 'Main Hall & Bar (VIP Section)', description: 'A room with allowed special chars' };
      const createdRoom = { id: 'newroom1', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.findFirst as jest.Mock).mockResolvedValue(null); // No duplicate found
      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
    });

    it('should accept room name with hyphens and underscores', async () => {
      const newRoomData = { name: 'Dining-Room_Section-A', description: 'A room with hyphens and underscores' };
      const createdRoom = { id: 'newroom1', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.findFirst as jest.Mock).mockResolvedValue(null); // No duplicate found
      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
    });

    it('should accept room name with apostrophes and dots', async () => {
      const newRoomData = { name: "John's Dining Room", description: 'A room with an apostrophe' };
      const createdRoom = { id: 'newroom1', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.findFirst as jest.Mock).mockResolvedValue(null); // No duplicate found
      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
    });

    it('should reject room name with unicode control characters', async () => {
      const newRoomData = { name: 'Room\u0000With\u0001Control\u0002Chars', description: 'A room with control chars' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });

    it('should reject room name with unicode symbols', async () => {
      const newRoomData = { name: 'Room with €£¥©®™ symbols', description: 'A room with unicode symbols' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });
  });

  describe('Room Name Validation - Security Edge Cases', () => {
    it('should reject room name with JavaScript code', async () => {
      const newRoomData = { name: 'javascript:alert("xss")', description: 'A room with JS code' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });

    it('should reject room name with encoded characters', async () => {
      const newRoomData = { name: 'Room%20with%20encoded', description: 'A room with encoded chars' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });

    it('should reject room name with file path traversal', async () => {
      const newRoomData = { name: '../../../etc/passwd', description: 'A room with path traversal' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });

    it('should reject room name with OS command injection', async () => {
      const newRoomData = { name: 'Room; rm -rf /', description: 'A room with command injection' };

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });
  });

  describe('Room Name Validation - Update Operations', () => {
    it('should reject updating room with empty name', async () => {
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

      expect(response.body).toEqual({ error: 'Room name is required' });
    });

    it('should reject updating room with name that is too long', async () => {
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

    it('should reject updating room with invalid characters', async () => {
      const existingRoom = { 
        id: 'room1', 
        name: 'Old Room', 
        description: 'Old description', 
        createdAt: '2023-01-01T00:00:00Z', 
        updatedAt: '2023-01-01T00:00:00Z' 
      };
      
      const updatedRoomData = { name: '<script>alert("xss")</script>' };

      (prisma.room.findUnique as jest.Mock).mockResolvedValue(existingRoom);

      const response = await request(app)
        .put('/api/rooms/room1')
        .send(updatedRoomData)
        .expect(400);

      expect(response.body).toEqual({ error: 'Room name contains invalid characters' });
    });

    it('should allow updating room with valid name', async () => {
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
  });
});