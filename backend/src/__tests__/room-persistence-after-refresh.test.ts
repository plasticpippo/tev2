import request from 'supertest';
import express from 'express';
import { prisma } from '../prisma';
import roomsRouter from '../handlers/rooms';

// Create an Express app to mount the rooms routes for testing
const app = express();
app.use(express.json());
app.use('/api/rooms', roomsRouter);

describe('Room Data Persistence After Refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Room Creation and Retrieval (Simulating Page Refresh)', () => {
    it('should persist room data after creating and retrieving (simulating page refresh)', async () => {
      // Mock data for the new room
      const newRoomData = { 
        name: 'Test Room', 
        description: 'A room created for testing persistence' 
      };
      
      // Mock the created room object with timestamps
      const createdRoom = { 
        id: 'test-room-123', 
        ...newRoomData, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString() 
      };

      // Mock the creation of a new room
      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      // Step 1: Create a new room
      const createResponse = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      // Verify that the room was created successfully
      expect(createResponse.body).toEqual(createdRoom);
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
        include: {
          tables: true,
        },
      });

      // Simulate a "page refresh" by retrieving the room we just created
      // Mock the retrieval of the same room
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(createdRoom);

      // Step 2: Retrieve the room (simulating page refresh where data needs to be reloaded)
      const retrieveResponse = await request(app)
        .get(`/api/rooms/${createdRoom.id}`)
        .expect(200);

      // Verify that the retrieved room matches what we created
      expect(retrieveResponse.body).toEqual(createdRoom);
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: createdRoom.id },
        include: {
          tables: true,
        },
      });
    });

    it('should persist multiple rooms after creating and retrieving all (simulating page refresh)', async () => {
      // Mock data for multiple rooms
      const roomDataList = [
        { name: 'First Room', description: 'The first test room' },
        { name: 'Second Room', description: 'The second test room' }
      ];

      // Mock the created room objects with IDs and timestamps
      const createdRooms = roomDataList.map((data, index) => ({
        id: `room-${index + 1}`,
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Mock the creation of the first room
      (prisma.room.create as jest.Mock).mockResolvedValueOnce(createdRooms[0]);
      (prisma.room.create as jest.Mock).mockResolvedValueOnce(createdRooms[1]);

      // Step 1: Create the first room
      const firstCreateResponse = await request(app)
        .post('/api/rooms')
        .send(roomDataList[0])
        .expect(201);

      // Verify that the first room was created successfully
      expect(firstCreateResponse.body).toEqual(createdRooms[0]);

      // Step 2: Create the second room
      const secondCreateResponse = await request(app)
        .post('/api/rooms')
        .send(roomDataList[1])
        .expect(201);

      // Verify that the second room was created successfully
      expect(secondCreateResponse.body).toEqual(createdRooms[1]);

      // Simulate a "page refresh" by retrieving all rooms
      // Mock the retrieval of all rooms
      (prisma.room.findMany as jest.Mock).mockResolvedValue(createdRooms);

      // Step 3: Retrieve all rooms (simulating page refresh where all data needs to be reloaded)
      const retrieveAllResponse = await request(app)
        .get('/api/rooms')
        .expect(200);

      // Verify that all created rooms are retrieved
      expect(retrieveAllResponse.body).toEqual(createdRooms);
      expect(prisma.room.findMany).toHaveBeenCalledWith({
        include: {
          tables: true,
        },
        orderBy: {
          id: 'asc',
        },
      });
    });

    it('should maintain room data integrity after update and subsequent retrieval', async () => {
      // Initial room data
      const initialRoomData = { 
        id: 'persistent-room-1', 
        name: 'Original Name', 
        description: 'Original description',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Updated room data
      const updatedRoomData = { 
        name: 'Updated Name', 
        description: 'Updated description' 
      };

      // Expected room data after update
      const updatedRoom = {
        ...initialRoomData,
        ...updatedRoomData,
        updatedAt: new Date().toISOString() // Updated timestamp
      };

      // Mock finding the initial room
      (prisma.room.findUnique as jest.Mock)
        .mockResolvedValueOnce(initialRoomData) // For the update validation
        .mockResolvedValueOnce(updatedRoom);   // For the final retrieval

      // Mock updating the room
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      // Step 1: Update an existing room
      const updateResponse = await request(app)
        .put(`/api/rooms/${initialRoomData.id}`)
        .send(updatedRoomData)
        .expect(200);

      // Verify that the room was updated successfully
      expect(updateResponse.body).toEqual(updatedRoom);
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: initialRoomData.id },
        data: updatedRoomData,
        include: {
          tables: true,
        },
      });

      // Simulate a "page refresh" by retrieving the updated room
      // Step 2: Retrieve the updated room (simulating page refresh)
      const retrieveResponse = await request(app)
        .get(`/api/rooms/${initialRoomData.id}`)
        .expect(200);

      // Verify that the retrieved room reflects the updates
      expect(retrieveResponse.body).toEqual(updatedRoom);
    });

    it('should handle retrieval of non-existent room gracefully after attempted refresh', async () => {
      const nonExistentRoomId = 'non-existent-room';

      // Mock that the room doesn't exist
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      // Attempt to retrieve a non-existent room (simulating page refresh trying to load deleted room)
      const response = await request(app)
        .get(`/api/rooms/${nonExistentRoomId}`)
        .expect(404);

      // Verify that the proper error is returned
      expect(response.body).toEqual({ error: 'Room not found' });
    });
  });
});