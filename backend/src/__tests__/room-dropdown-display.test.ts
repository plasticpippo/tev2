import request from 'supertest';
import express from 'express';
import { prisma } from '../prisma';
import roomsRouter from '../handlers/rooms';

// Create an Express app to mount the rooms routes for testing
const app = express();
app.use(express.json());
app.use('/api/rooms', roomsRouter);

describe('Room Dropdown Display API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/rooms for dropdown display', () => {
    it('should return rooms in a format suitable for dropdown menus', async () => {
      const mockRooms = [
        { 
          id: 'room1', 
          name: 'Main Dining', 
          description: 'Main dining area', 
          createdAt: '2023-01-01T00:00:00Z', 
          updatedAt: '2023-01-01T00:00:00Z',
          tables: []
        },
        { 
          id: 'room2', 
          name: 'Bar Area', 
          description: 'Bar and lounge area', 
          createdAt: '2023-01-01T00:00:00Z', 
          updatedAt: '2023-01-01T00:00:00Z',
          tables: []
        },
        { 
          id: 'room3', 
          name: 'Private Room', 
          description: 'VIP private room', 
          createdAt: '2023-01-01T00:00:00Z', 
          updatedAt: '2023-01-01T00:00:00Z',
          tables: []
        }
      ];

      (prisma.room.findMany as jest.Mock).mockResolvedValue(mockRooms);

      const response = await request(app)
        .get('/api/rooms')
        .expect(200);

      // Verify the response structure is suitable for dropdowns
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
      
      // Check that each room has the essential properties needed for dropdown display
      response.body.forEach((room: any, index: number) => {
        expect(room).toHaveProperty('id');
        expect(room).toHaveProperty('name');
        expect(typeof room.id).toBe('string');
        expect(typeof room.name).toBe('string');
        expect(room.name).toBeTruthy(); // Name should not be empty
      });

      // Verify the rooms are sorted by ID as per the implementation
      expect(response.body[0].id).toBe('room1');
      expect(response.body[1].id).toBe('room2');
      expect(response.body[2].id).toBe('room3');

      // Verify the mock was called with correct parameters
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

    it('should return empty array when no rooms exist', async () => {
      (prisma.room.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/rooms')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return rooms with tables included for comprehensive display', async () => {
      const mockRooms = [
        { 
          id: 'room1', 
          name: 'Main Dining', 
          description: 'Main dining area', 
          createdAt: '2023-01-01T00:00:00Z', 
          updatedAt: '2023-01-01T00:00:00Z',
          tables: [
            { id: 'table1', name: 'Table 1', x: 0, y: 0, width: 100, height: 100, status: 'available', roomId: 'room1', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' },
            { id: 'table2', name: 'Table 2', x: 100, y: 0, width: 100, height: 100, status: 'occupied', roomId: 'room1', createdAt: '2023-01-01T00:00:00Z', updatedAt: '2023-01-01T00:00:00Z' }
          ]
        }
      ];

      (prisma.room.findMany as jest.Mock).mockResolvedValue(mockRooms);

      const response = await request(app)
        .get('/api/rooms')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('tables');
      expect(Array.isArray(response.body[0].tables)).toBe(true);
      expect(response.body[0].tables).toHaveLength(2);
    });

    it('should handle errors when fetching rooms fails', async () => {
      (prisma.room.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/rooms')
        .expect(500);

      expect(response.body).toEqual({ 
        error: 'Failed to fetch rooms', 
        details: 'Database error' 
      });
    });

    it('should return rooms sorted by ID for consistent dropdown display', async () => {
      // When Prisma queries with orderBy: { id: 'asc' }, the database returns results sorted by ID
      // Our mock should simulate this behavior
      const sortedMockRooms = [
        {
          id: 'room1',
          name: 'Main Dining',
          description: 'Main dining area',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          tables: []
        },
        {
          id: 'room2',
          name: 'Bar Area',
          description: 'Bar and lounge area',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          tables: []
        },
        {
          id: 'room3',
          name: 'Private Room',
          description: 'VIP private room',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          tables: []
        }
      ];

      (prisma.room.findMany as jest.Mock).mockResolvedValue(sortedMockRooms);

      const response = await request(app)
        .get('/api/rooms')
        .expect(200);

      // Verify the rooms are returned in sorted order by ID
      expect(response.body[0].id).toBe('room1');
      expect(response.body[1].id).toBe('room2');
      expect(response.body[2].id).toBe('room3');
    });
  });
});