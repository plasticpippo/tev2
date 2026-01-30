import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import roomsRouter from '../handlers/rooms';

// Create a real Prisma client instance (not mocked)
const prisma = new PrismaClient();

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

describe('Room Data Persistence Real Database Tests', () => {
  // Clean up the test database before each test
  beforeEach(async () => {
    // Delete all test-related rooms to ensure clean state
    // We'll use a naming convention to identify test rooms
    await prisma.table.deleteMany({
      where: {
        room: {
          name: { contains: 'Test Room' }
        }
      }
    });
    
    await prisma.room.deleteMany({
      where: {
        name: { contains: 'Test Room' }
      }
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Room Data Persistence Across Browser Sessions', () => {
    it('should persist room data when browser is closed and reopened', async () => {
      // Step 1: Create a room (simulating initial browser session)
      const newRoomData = { 
        name: 'Test Room Persistence - Real DB', 
        description: 'A room created to test persistence across browser sessions' 
      };
      
      const createResponse = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      const createdRoom = createResponse.body;
      expect(createdRoom.name).toBe(newRoomData.name);
      expect(createdRoom.description).toBe(newRoomData.description);
      expect(createdRoom.id).toBeDefined();

      // Store the room ID to test persistence
      const roomId = createdRoom.id;
      
      // Step 2: Close browser session and reopen (simulating page refresh)
      // The data should still be available in the database
      const retrieveResponse = await request(app)
        .get(`/api/rooms/${roomId}`)
        .expect(200);

      const retrievedRoom = retrieveResponse.body;
      expect(retrievedRoom.id).toBe(roomId);
      expect(retrievedRoom.name).toBe(newRoomData.name);
      expect(retrievedRoom.description).toBe(newRoomData.description);
      expect(retrievedRoom.tables).toEqual([]);
    });

    it('should persist multiple rooms across browser sessions', async () => {
      // Step 1: Create multiple rooms (simulating initial browser session)
      const roomDataList = [
        { name: 'Integration Test Room 1', description: 'The first test room' },
        { name: 'Integration Test Room 2', description: 'The second test room' }
      ];

      const createdRooms: any[] = [];
      
      // Create first room
      const firstResponse = await request(app)
        .post('/api/rooms')
        .send(roomDataList[0])
        .expect(201);
      createdRooms.push(firstResponse.body);

      // Create second room
      const secondResponse = await request(app)
        .post('/api/rooms')
        .send(roomDataList[1])
        .expect(201);
      createdRooms.push(secondResponse.body);

      // Verify both rooms were created with correct data
      expect(createdRooms[0].name).toBe(roomDataList[0].name);
      expect(createdRooms[1].name).toBe(roomDataList[1].name);

      // Step 2: Simulate browser refresh - retrieve all rooms
      const retrieveAllResponse = await request(app)
        .get('/api/rooms')
        .expect(200);

      const retrievedRooms = retrieveAllResponse.body;
      // Filter to only our test rooms
      const testRooms = retrievedRooms.filter((r: any) => 
        r.name.includes('Integration Test Room')
      );
      
      expect(testRooms).toHaveLength(2);
      
      // Verify that both rooms exist and have correct data
      const firstRetrievedRoom = testRooms.find((r: any) => r.id === createdRooms[0].id);
      const secondRetrievedRoom = testRooms.find((r: any) => r.id === createdRooms[1].id);
      
      expect(firstRetrievedRoom).toBeDefined();
      expect(secondRetrievedRoom).toBeDefined();
      expect(firstRetrievedRoom?.name).toBe(roomDataList[0].name);
      expect(secondRetrievedRoom?.name).toBe(roomDataList[1].name);
    });

    it('should maintain room data integrity after update and browser refresh', async () => {
      // Step 1: Create a room
      const initialRoomData = { 
        name: 'Original Room Name - Integration', 
        description: 'Original description' 
      };
      
      const createResponse = await request(app)
        .post('/api/rooms')
        .send(initialRoomData)
        .expect(201);

      const createdRoom = createResponse.body;
      const roomId = createdRoom.id;
      
      // Step 2: Update the room (still in same session)
      const updatedRoomData = { 
        name: 'Updated Room Name - Integration', 
        description: 'Updated description' 
      };
      
      const updateResponse = await request(app)
        .put(`/api/rooms/${roomId}`)
        .send(updatedRoomData)
        .expect(200);

      const updatedRoom = updateResponse.body;
      expect(updatedRoom.name).toBe(updatedRoomData.name);
      expect(updatedRoom.description).toBe(updatedRoomData.description);

      // Step 3: Simulate browser refresh - retrieve the updated room
      const retrieveResponse = await request(app)
        .get(`/api/rooms/${roomId}`)
        .expect(200);

      const refreshedRoom = retrieveResponse.body;
      expect(refreshedRoom.id).toBe(roomId);
      expect(refreshedRoom.name).toBe(updatedRoomData.name);
      expect(refreshedRoom.description).toBe(updatedRoomData.description);
    });

    it('should handle room deletion properly and not persist deleted rooms', async () => {
      // Step 1: Create a room
      const roomData = { 
        name: 'Room to Delete - Integration', 
        description: 'This room will be deleted' 
      };
      
      const createResponse = await request(app)
        .post('/api/rooms')
        .send(roomData)
        .expect(201);

      const createdRoom = createResponse.body;
      const roomId = createdRoom.id;
      expect(createdRoom.name).toBe(roomData.name);

      // Step 2: Delete the room
      await request(app)
        .delete(`/api/rooms/${roomId}`)
        .expect(204);

      // Step 3: Try to retrieve the room after "browser refresh" - should not exist
      const retrieveResponse = await request(app)
        .get(`/api/rooms/${roomId}`)
        .expect(404);

      expect(retrieveResponse.body.error).toBe('Room not found');

      // Verify the room is truly gone from the database
      const dbRoom = await prisma.room.findUnique({
        where: { id: roomId }
      });
      expect(dbRoom).toBeNull();
    });
  });
});