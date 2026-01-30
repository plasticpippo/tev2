import request from 'supertest';
import express from 'express';
import { prisma } from '../backend/src/prisma';
import roomsRouter from '../backend/src/handlers/rooms';

// Create an Express app to mount the rooms routes for testing
const app = express();
app.use(express.json());
app.use('/api/rooms', roomsRouter);

describe('Room Creation Validation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid Room Name Creation Tests', () => {
    // Test cases for valid room names according to the requirements:
    // - alphanumeric characters
    // - spaces
    // - hyphens
    // - underscores
    // - parentheses
    // - commas
    // - periods
    // - apostrophes
    // - ampersands
    // - max 100 characters
    // - not empty or just whitespace

    it('should create a room with a simple alphanumeric name', async () => {
      const newRoomData = { name: 'MainDining', description: 'Main dining area' };
      const createdRoom = { id: 'room1', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
      });
    });

    it('should create a room with spaces in the name', async () => {
      const newRoomData = { name: 'Main Dining Room', description: 'Main dining area' };
      const createdRoom = { id: 'room2', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
      });
    });

    it('should create a room with hyphens in the name', async () => {
      const newRoomData = { name: 'VIP-Lounge', description: 'Very important people lounge' };
      const createdRoom = { id: 'room3', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
      });
    });

    it('should create a room with underscores in the name', async () => {
      const newRoomData = { name: 'Staff_Lounge', description: 'Staff relaxation area' };
      const createdRoom = { id: 'room4', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
      });
    });

    it('should create a room with parentheses in the name', async () => {
      const newRoomData = { name: 'Private Room (Upstairs)', description: 'Private area upstairs' };
      const createdRoom = { id: 'room5', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
      });
    });

    it('should create a room with commas in the name', async () => {
      const newRoomData = { name: 'Conference Room, Floor 2', description: 'Conference room on second floor' };
      const createdRoom = { id: 'room6', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
      });
    });

    it('should create a room with periods in the name', async () => {
      const newRoomData = { name: 'Room A.1', description: 'First room in section A' };
      const createdRoom = { id: 'room7', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
      });
    });

    it('should create a room with apostrophes in the name', async () => {
      const newRoomData = { name: "Customer's Lounge", description: 'Area for customer comfort' };
      const createdRoom = { id: 'room8', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
      });
    });

    it('should create a room with ampersands in the name', async () => {
      const newRoomData = { name: 'Restaurant & Bar', description: 'Combined restaurant and bar area' };
      const createdRoom = { id: 'room9', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
      });
    });

    it('should create a room with mixed valid characters', async () => {
      const newRoomData = { 
        name: "John's VIP Room (Main Floor) - Section A & B", 
        description: 'VIP area with various amenities' 
      };
      const createdRoom = { id: 'room10', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
      });
    });

    it('should create a room with a name at exactly 100 characters', async () => {
      const longName = 'A'.repeat(100); // Exactly 100 characters
      const newRoomData = { name: longName, description: 'Room with maximum length name' };
      const createdRoom = { id: 'room11', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      expect(response.body).toEqual(createdRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
      });
    });

    // Note: Currently, the backend does not validate the room name format
    // This is highlighted as an issue in the documentation
    // The following tests demonstrate that invalid names are currently accepted by the backend
    it('should currently allow invalid characters in room name (needs backend validation)', async () => {
      const newRoomData = { name: 'Room with <script>alert("xss")</script>', description: 'Room with invalid characters' };
      const createdRoom = { id: 'room12', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      // This currently passes but should fail with proper backend validation
      expect(response.body).toEqual(createdRoom);
    });

    it('should currently allow room name longer than 100 characters (needs backend validation)', async () => {
      const longName = 'A'.repeat(150); // More than 100 characters
      const newRoomData = { name: longName, description: 'Room with very long name' };
      const createdRoom = { id: 'room13', ...newRoomData, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' };

      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      // This currently passes but should fail with proper backend validation
      expect(response.body).toEqual(createdRoom);
    });
  });

  describe('Invalid Room Name Rejection Tests', () => {
    it('should reject room creation with empty name', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({ name: '', description: 'A room without name' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Name is required' });
    });

    it('should reject room creation with null name', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({ name: null, description: 'A room without name' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Name is required' });
    });

    it('should reject room creation with undefined name', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({ description: 'A room without name' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Name is required' });
    });

    it('should reject room creation with name consisting only of whitespace', async () => {
      const response = await request(app)
        .post('/api/rooms')
        .send({ name: '   ', description: 'A room with whitespace name' })
        .expect(400);

      expect(response.body).toEqual({ error: 'Name is required' });
    });
  });
});