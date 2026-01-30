import request from 'supertest';
import express from 'express';
import { prisma } from '../prisma';
import roomsRouter from '../handlers/rooms';
import { Room } from '../../../shared/types';

// Create an Express app to mount the rooms routes for testing
const app = express();
app.use(express.json());
app.use('/api/rooms', roomsRouter);

describe('Room Data Sync Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('CRUD Operations Synchronization Tests', () => {
    it('should properly sync room creation between frontend and backend', async () => {
      const newRoomData = { 
        name: 'Test Room', 
        description: 'A room for testing synchronization' 
      };
      
      const createdRoom = { 
        id: 'test-room-1', 
        ...newRoomData, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString(),
        tables: [] 
      };

      // Mock the Prisma create method
      (prisma.room.create as jest.Mock).mockResolvedValue(createdRoom);

      // Make the API call
      const response = await request(app)
        .post('/api/rooms')
        .send(newRoomData)
        .expect(201);

      // Verify the response matches the created room
      expect(response.body).toEqual(createdRoom);
      
      // Verify that Prisma was called with the correct data
      expect(prisma.room.create).toHaveBeenCalledWith({
        data: newRoomData,
        include: {
          tables: true,
        },
      });

      // Verify the data structure matches the Room interface
      const room: Room = response.body;
      expect(room.id).toBeDefined();
      expect(room.name).toBe(newRoomData.name);
      expect(room.description).toBe(newRoomData.description);
      expect(room.createdAt).toBeDefined();
      expect(room.updatedAt).toBeDefined();
      expect(Array.isArray(room.tables)).toBe(true);
    });

    it('should properly sync room retrieval between frontend and backend', async () => {
      const mockRooms = [
        { 
          id: 'room1', 
          name: 'Main Dining', 
          description: 'Main dining area', 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(),
          tables: [] 
        },
        { 
          id: 'room2', 
          name: 'Bar Area', 
          description: 'Bar and lounge area', 
          createdAt: new Date().toISOString(), 
          updatedAt: new Date().toISOString(),
          tables: [] 
        }
      ];

      // Mock the Prisma findMany method
      (prisma.room.findMany as jest.Mock).mockResolvedValue(mockRooms);

      // Make the API call
      const response = await request(app)
        .get('/api/rooms')
        .expect(200);

      // Verify the response contains all rooms
      expect(response.body).toEqual(mockRooms);
      
      // Verify that Prisma was called correctly
      expect(prisma.room.findMany).toHaveBeenCalledWith({
        include: {
          tables: true,
        },
        orderBy: {
          id: 'asc',
        },
      });

      // Verify all rooms match the Room interface
      response.body.forEach((room: Room) => {
        expect(room.id).toBeDefined();
        expect(room.name).toBeDefined();
        expect(room.createdAt).toBeDefined();
        expect(room.updatedAt).toBeDefined();
        expect(Array.isArray(room.tables)).toBe(true);
      });
    });

    it('should properly sync specific room retrieval between frontend and backend', async () => {
      const mockRoom = { 
        id: 'specific-room', 
        name: 'VIP Room', 
        description: 'Very important people room', 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString(),
        tables: [] 
      };

      // Mock the Prisma findUnique method
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(mockRoom);

      // Make the API call
      const response = await request(app)
        .get('/api/rooms/specific-room')
        .expect(200);

      // Verify the response contains the specific room
      expect(response.body).toEqual(mockRoom);

      // Verify that Prisma was called with the correct ID
      expect(prisma.room.findUnique).toHaveBeenCalledWith({
        where: { id: 'specific-room' },
        include: {
          tables: true,
        },
      });

      // Verify the room matches the Room interface
      const room: Room = response.body;
      expect(room.id).toBe('specific-room');
      expect(room.name).toBe('VIP Room');
      expect(room.description).toBe('Very important people room');
      expect(room.createdAt).toBeDefined();
      expect(room.updatedAt).toBeDefined();
      expect(Array.isArray(room.tables)).toBe(true);
    });

    it('should properly sync room updates between frontend and backend', async () => {
      const roomId = 'room-to-update';
      const updateData = { 
        name: 'Updated Room Name', 
        description: 'Updated description' 
      };
      
      const updatedRoom = { 
        id: roomId, 
        ...updateData, 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString(),
        tables: [] 
      };

      // Mock the Prisma methods for update
      (prisma.room.findUnique as jest.Mock).mockResolvedValue({
        id: roomId,
        name: 'Old Room Name',
        description: 'Old description',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      // Make the API call
      const response = await request(app)
        .put(`/api/rooms/${roomId}`)
        .send(updateData)
        .expect(200);

      // Verify the response contains the updated room
      expect(response.body).toEqual(updatedRoom);

      // Verify that Prisma was called with the correct parameters
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: roomId },
        data: {
          name: 'Updated Room Name',
          description: 'Updated description',
        },
        include: {
          tables: true,
        },
      });

      // Verify the updated room matches the Room interface
      const room: Room = response.body;
      expect(room.id).toBe(roomId);
      expect(room.name).toBe('Updated Room Name');
      expect(room.description).toBe('Updated description');
      expect(room.createdAt).toBeDefined();
      expect(room.updatedAt).toBeDefined();
      expect(Array.isArray(room.tables)).toBe(true);
    });

    it('should properly sync partial room updates between frontend and backend', async () => {
      const roomId = 'room-to-update-partially';
      const updateData = { 
        name: 'Partially Updated Room Name' 
      };
      
      const updatedRoom = { 
        id: roomId, 
        name: 'Partially Updated Room Name', 
        description: 'Original description preserved', 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString(),
        tables: [] 
      };

      // Mock the Prisma methods for partial update
      (prisma.room.findUnique as jest.Mock).mockResolvedValue({
        id: roomId,
        name: 'Old Room Name',
        description: 'Original description preserved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      (prisma.room.update as jest.Mock).mockResolvedValue(updatedRoom);

      // Make the API call
      const response = await request(app)
        .put(`/api/rooms/${roomId}`)
        .send(updateData)
        .expect(200);

      // Verify the response contains the partially updated room
      expect(response.body).toEqual(updatedRoom);

      // Verify that Prisma was called with only the updated fields
      expect(prisma.room.update).toHaveBeenCalledWith({
        where: { id: roomId },
        data: {
          name: 'Partially Updated Room Name',
        },
        include: {
          tables: true,
        },
      });

      // Verify the updated room matches the Room interface
      const room: Room = response.body;
      expect(room.id).toBe(roomId);
      expect(room.name).toBe('Partially Updated Room Name');
      expect(room.description).toBe('Original description preserved');
      expect(room.createdAt).toBeDefined();
      expect(room.updatedAt).toBeDefined();
      expect(Array.isArray(room.tables)).toBe(true);
    });

    it('should properly sync room deletion between frontend and backend', async () => {
      const roomId = 'room-to-delete';
      const roomToDelete = { 
        id: roomId, 
        name: 'Room to Delete', 
        description: 'This room will be deleted', 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString(),
        tables: [] 
      };

      // Mock the Prisma methods for deletion
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(roomToDelete);
      (prisma.table.count as jest.Mock).mockResolvedValue(0); // No tables in this room
      (prisma.room.delete as jest.Mock).mockResolvedValue(roomToDelete);

      // Make the API call
      const response = await request(app)
        .delete(`/api/rooms/${roomId}`)
        .expect(204);

      // Verify that Prisma was called with the correct parameters
      expect(prisma.room.delete).toHaveBeenCalledWith({
        where: { id: roomId },
      });

      // Verify that the table count check was performed
      expect(prisma.table.count).toHaveBeenCalledWith({
        where: {
          roomId: roomId,
        },
      });
    });

    it('should properly handle room creation validation errors', async () => {
      // Test with missing name
      const responseMissingName = await request(app)
        .post('/api/rooms')
        .send({ description: 'A room without name' })
        .expect(400);

      expect(responseMissingName.body).toEqual({ error: 'Name is required' });

      // Test with duplicate name
      const duplicateRoomData = { 
        name: 'Duplicate Room', 
        description: 'This room name already exists' 
      };
      
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({
        id: 'existing-room-id',
        name: 'Duplicate Room',
        description: 'Existing room with same name',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const responseDuplicateName = await request(app)
        .post('/api/rooms')
        .send(duplicateRoomData)
        .expect(400);

      expect(responseDuplicateName.body).toEqual({ error: 'A room with this name already exists' });
    });

    it('should properly handle room update validation errors', async () => {
      const roomId = 'room-with-duplicate-name';
      const updateData = { 
        name: 'Existing Room Name' // This name already exists for another room
      };

      // Mock room exists check
      (prisma.room.findUnique as jest.Mock).mockResolvedValue({
        id: roomId,
        name: 'Different Room Name',
        description: 'Original description',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Mock duplicate name check
      (prisma.room.findFirst as jest.Mock).mockResolvedValue({
        id: 'another-existing-room',
        name: 'Existing Room Name',
        description: 'Another room with same name',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const response = await request(app)
        .put(`/api/rooms/${roomId}`)
        .send(updateData)
        .expect(400);

      expect(response.body).toEqual({ error: 'A room with this name already exists' });
    });

    it('should properly handle room deletion validation errors', async () => {
      const roomId = 'room-with-tables';
      const roomWithTables = { 
        id: roomId, 
        name: 'Room With Tables', 
        description: 'This room has tables assigned', 
        createdAt: new Date().toISOString(), 
        updatedAt: new Date().toISOString(),
        tables: [] 
      };

      // Mock the Prisma methods for deletion validation
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(roomWithTables);
      (prisma.table.count as jest.Mock).mockResolvedValue(2); // 2 tables in this room

      const response = await request(app)
        .delete(`/api/rooms/${roomId}`)
        .expect(400);

      expect(response.body).toEqual({
        error: 'Cannot delete room with 2 assigned table(s). Please delete or reassign tables first.',
        tableCount: 2
      });
    });

    it('should handle errors gracefully during room operations', async () => {
      // Test error during fetching all rooms
      (prisma.room.findMany as jest.Mock).mockRejectedValue(new Error('Database connection failed'));

      const fetchAllErrorResponse = await request(app)
        .get('/api/rooms')
        .expect(500);

      expect(fetchAllErrorResponse.body).toEqual({ 
        error: 'Failed to fetch rooms', 
        details: 'Database connection failed' 
      });

      // Test error during creating a room - need to mock the validation to pass first
      (prisma.room.findFirst as jest.Mock).mockResolvedValue(null); // No duplicate found
      (prisma.room.create as jest.Mock).mockRejectedValue(new Error('Database error on create'));

      const createErrorResponse = await request(app)
        .post('/api/rooms')
        .send({ name: 'New Room', description: 'Test room' })
        .expect(500);

      expect(createErrorResponse.body).toEqual({
        error: 'Failed to create room',
        details: 'Database error on create'
      });

      // Test error during fetching a specific room
      (prisma.room.findUnique as jest.Mock).mockRejectedValue(new Error('Database error on fetch'));

      const fetchOneErrorResponse = await request(app)
        .get('/api/rooms/room1')
        .expect(500);

      expect(fetchOneErrorResponse.body).toEqual({ 
        error: 'Failed to fetch room', 
        details: 'Database error on fetch' 
      });

      // Test error during updating a room
      (prisma.room.findUnique as jest.Mock).mockResolvedValue({
        id: 'room1',
        name: 'Old Room',
        description: 'Old description',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      (prisma.room.update as jest.Mock).mockRejectedValue(new Error('Database error on update'));

      const updateErrorResponse = await request(app)
        .put('/api/rooms/room1')
        .send({ name: 'Updated Room' })
        .expect(500);

      expect(updateErrorResponse.body).toEqual({ 
        error: 'Failed to update room', 
        details: 'Database error on update' 
      });

      // Test error during deleting a room
      (prisma.room.findUnique as jest.Mock).mockResolvedValue({
        id: 'room1',
        name: 'Room to delete',
        description: 'A room to delete',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      (prisma.table.count as jest.Mock).mockResolvedValue(0);
      (prisma.room.delete as jest.Mock).mockRejectedValue(new Error('Database error on delete'));

      const deleteErrorResponse = await request(app)
        .delete('/api/rooms/room1')
        .expect(500);

      expect(deleteErrorResponse.body).toEqual({ 
        error: 'Failed to delete room', 
        details: 'Database error on delete' 
      });
    });

    it('should properly handle 404 errors for non-existent rooms', async () => {
      // Test 404 for non-existent room during update
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      const updateNotFoundResponse = await request(app)
        .put('/api/rooms/nonexistent')
        .send({ name: 'Updated Room' })
        .expect(404);

      expect(updateNotFoundResponse.body).toEqual({ error: 'Room not found' });

      // Test 404 for non-existent room during deletion
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      const deleteNotFoundResponse = await request(app)
        .delete('/api/rooms/nonexistent')
        .expect(404);

      expect(deleteNotFoundResponse.body).toEqual({ error: 'Room not found' });

      // Test 404 for non-existent room during fetch
      (prisma.room.findUnique as jest.Mock).mockResolvedValue(null);

      const fetchNotFoundResponse = await request(app)
        .get('/api/rooms/nonexistent')
        .expect(404);

      expect(fetchNotFoundResponse.body).toEqual({ error: 'Room not found' });
    });
  });
});