import {
  getRooms,
  saveRoom,
  deleteRoom,
  getTables,
  saveTable,
  deleteTable,
  updateTablePosition
} from '../../services/apiService';
import { Room, Table } from '../../../shared/types';

// Mock the fetch API
global.fetch = jest.fn();

// Mock the import.meta.env for tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:3001'
  },
  writable: true
});

const mockRoom: Room = {
  id: 'room1',
  name: 'Main Dining',
  description: 'Main dining area',
  createdAt: '2023-01-01T00:00:00Z',
 updatedAt: '2023-01-01T00:00Z'
};

const mockTable: Table = {
  id: 'table1',
  name: 'Table 1',
  x: 100,
  y: 50,
  width: 80,
  height: 80,
  status: 'available',
  roomId: 'room1',
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z'
};

describe('API Service Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Room API Functions', () => {
    it('should fetch all rooms', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockRoom]
      });

      const rooms = await getRooms();
      
      expect(rooms).toEqual([mockRoom]);
      expect(global.fetch).toHaveBeenCalledWith('http://192.168.1.241:3001/api/rooms', undefined);
    });

    it('should handle error when fetching rooms fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to fetch rooms' })
      });

      const rooms = await getRooms();
      expect(rooms).toEqual([]);
    });

    it('should create a new room', async () => {
      const newRoomData = { name: 'New Room', description: 'New room description' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoom
      });

      const room = await saveRoom(newRoomData);
      
      expect(room).toEqual(mockRoom);
      expect(global.fetch).toHaveBeenCalledWith('http://192.168.1.241:3001/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRoomData)
      });
    });

    it('should handle error when creating a room fails', async () => {
      const newRoomData = { name: 'New Room', description: 'New room description' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Name is required' })
      });

      await expect(saveRoom(newRoomData)).rejects.toThrow('Name is required');
    });

    it('should update a room', async () => {
      const updatedRoomData = { name: 'Updated Room', description: 'Updated description' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRoom
      });

      const room = await saveRoom({ ...updatedRoomData, id: 'room1' });
      
      expect(room).toEqual(mockRoom);
      expect(global.fetch).toHaveBeenCalledWith('http://192.168.1.241:3001/api/rooms/room1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...updatedRoomData, id: 'room1' })
      });
    });

    it('should handle error when updating a room fails', async () => {
      const updatedRoomData = { name: 'Updated Room', description: 'Updated description' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Room not found' })
      });

      await expect(saveRoom({ ...updatedRoomData, id: 'nonexistent' })).rejects.toThrow('Room not found');
    });

    it('should delete a room', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204
      });

      await deleteRoom('room1');
      
      expect(global.fetch).toHaveBeenCalledWith('http://192.168.1.241:3001/api/rooms/room1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    });

    it('should handle error when deleting a room fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Cannot delete room with assigned tables' })
      });

      const result = await deleteRoom('room1');
      expect(result).toEqual({ success: false, message: 'Cannot delete room with assigned tables' });
    });
  });

  describe('Table API Functions', () => {
    it('should fetch all tables', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [mockTable]
      });

      const tables = await getTables();
      
      expect(tables).toEqual([mockTable]);
      expect(global.fetch).toHaveBeenCalledWith('http://192.168.1.241:3001/api/tables', undefined);
    });

    it('should handle error when fetching tables fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to fetch tables' })
      });

      const tables = await getTables();
      expect(tables).toEqual([]);
    });

    it('should create a new table', async () => {
      const newTableData = {
        name: 'New Table',
        roomId: 'room1',
        x: 100,
        y: 50,
        width: 80,
        height: 80,
        status: 'available' as const
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTable
      });

      const table = await saveTable(newTableData);
      
      expect(table).toEqual(mockTable);
      expect(global.fetch).toHaveBeenCalledWith('http://192.168.1.241:3001/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTableData)
      });
    });

    it('should handle error when creating a table fails', async () => {
      const newTableData = {
        name: 'New Table',
        roomId: 'room1',
        x: 100,
        y: 50,
        width: 80,
        height: 80,
        status: 'available' as const
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Name and roomId are required' })
      });

      await expect(saveTable(newTableData)).rejects.toThrow('Name and roomId are required');
    });

    it('should update a table', async () => {
      const updatedTableData = {
        name: 'Updated Table',
        roomId: 'room1',
        x: 150,
        y: 100,
        width: 90,
        height: 90,
        status: 'occupied' as const
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTable
      });

      const table = await saveTable({ ...updatedTableData, id: 'table1' });
      
      expect(table).toEqual(mockTable);
      expect(global.fetch).toHaveBeenCalledWith('http://192.168.1.241:3001/api/tables/table1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...updatedTableData, id: 'table1' })
      });
    });

    it('should handle error when updating a table fails', async () => {
      const updatedTableData = {
        name: 'Updated Table',
        roomId: 'room1',
        x: 150,
        y: 100,
        width: 90,
        height: 90,
        status: 'occupied' as const
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Table not found' })
      });

      await expect(saveTable({ ...updatedTableData, id: 'nonexistent' })).rejects.toThrow('Table not found');
    });

    it('should delete a table', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204
      });

      await deleteTable('table1');
      
      expect(global.fetch).toHaveBeenCalledWith('http://192.168.1.241:3001/api/tables/table1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    });

    it('should handle error when deleting a table fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Cannot delete table with open tabs' })
      });

      const result = await deleteTable('table1');
      expect(result).toEqual({ success: false, message: 'Cannot delete table with open tabs' });
    });

    it('should update table position', async () => {
      const positionData = { positionX: 20, positionY: 150 };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTable
      });

      const table = await updateTablePosition('table1', 20, 150);
      
      expect(table).toEqual(mockTable);
      expect(global.fetch).toHaveBeenCalledWith('http://192.168.1.241:3001/api/tables/table1/position', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(positionData)
      });
    });

    it('should handle error when updating table position fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'positionX and positionY are required' })
      });

      await expect(updateTablePosition('table1', 200, 150)).rejects.toThrow('positionX and positionY are required');
    });
 });
});