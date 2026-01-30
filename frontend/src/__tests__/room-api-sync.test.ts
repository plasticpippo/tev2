import { getRooms, saveRoom, deleteRoom } from '../../services/tableService';
import type { Room } from '../../../shared/types';

// Mock the fetch API to simulate backend API calls
global.fetch = jest.fn();

describe('Room API Synchronization Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should properly sync room creation between frontend and backend', async () => {
    // Mock successful API response for room creation
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => createdRoom,
    });

    const result = await saveRoom(newRoomData);

    // Verify the fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rooms'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify(newRoomData)
      })
    );

    // Verify the returned room matches expectations
    expect(result).toEqual(createdRoom);
    
    // Verify the room structure matches the Room interface
    const room: Room = result;
    expect(room.id).toBeDefined();
    expect(room.name).toBe(newRoomData.name);
    expect(room.description).toBe(newRoomData.description);
    expect(room.createdAt).toBeDefined();
    expect(room.updatedAt).toBeDefined();
    expect(Array.isArray(room.tables)).toBe(true);
  });

  it('should properly sync room update between frontend and backend', async () => {
    // Mock successful API response for room update
    const roomId = 'existing-room';
    const updateData = { 
      id: roomId,
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedRoom,
    });

    const result = await saveRoom(updateData);

    // Verify the fetch was called with correct parameters for update
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/rooms/${roomId}`),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.any(Object),
        body: JSON.stringify(updateData)
      })
    );

    // Verify the returned room matches expectations
    expect(result).toEqual(updatedRoom);
    
    // Verify the room structure matches the Room interface
    const room: Room = result;
    expect(room.id).toBe(roomId);
    expect(room.name).toBe(updateData.name);
    expect(room.description).toBe(updateData.description);
    expect(room.createdAt).toBeDefined();
    expect(room.updatedAt).toBeDefined();
    expect(Array.isArray(room.tables)).toBe(true);
  });

  it('should properly sync room retrieval between frontend and backend', async () => {
    // Mock successful API response for room retrieval
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

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockRooms,
    });

    const result = await getRooms();

    // Verify the fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rooms'),
      undefined
    );

    // Verify the returned rooms match expectations
    expect(result).toEqual(mockRooms);
    
    // Verify all rooms match the Room interface
    result.forEach((room: Room) => {
      expect(room.id).toBeDefined();
      expect(room.name).toBeDefined();
      expect(room.createdAt).toBeDefined();
      expect(room.updatedAt).toBeDefined();
      expect(Array.isArray(room.tables)).toBe(true);
    });
  });

  it('should properly sync room deletion between frontend and backend', async () => {
    const roomId = 'room-to-delete';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await deleteRoom(roomId);

    // Verify the fetch was called with correct parameters for deletion
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/rooms/${roomId}`),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.any(Object)
      })
    );

    // Verify the returned result indicates success
    expect(result).toEqual({ success: true });
  });

  it('should handle errors during room creation', async () => {
    const newRoomData = { 
      name: 'Test Room', 
      description: 'A room for testing synchronization' 
    };

    const errorResponse = { error: 'Failed to create room' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => errorResponse,
    });

    // Expect the promise to reject
    await expect(saveRoom(newRoomData)).rejects.toThrow(errorResponse.error);

    // Verify the fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rooms'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.any(Object),
        body: JSON.stringify(newRoomData)
      })
    );
  });

  it('should handle errors during room update', async () => {
    const updateData = { 
      id: 'existing-room',
      name: 'Updated Room Name' 
    };

    const errorResponse = { error: 'Failed to update room' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => errorResponse,
    });

    // Expect the promise to reject
    await expect(saveRoom(updateData)).rejects.toThrow(errorResponse.error);

    // Verify the fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rooms/existing-room'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.any(Object),
        body: JSON.stringify(updateData)
      })
    );
  });

  it('should handle errors during room retrieval', async () => {
    const errorResponse = { error: 'Failed to fetch rooms' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => errorResponse,
    });

    // In the service, errors are caught and an empty array is returned
    const result = await getRooms();

    // Verify the fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/rooms'),
      undefined
    );

    // Verify that an empty array is returned on error
    expect(result).toEqual([]);
  });

  it('should handle errors during room deletion', async () => {
    const roomId = 'room-to-delete';
    const errorResponse = { error: 'Failed to delete room' };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => errorResponse,
    });

    const result = await deleteRoom(roomId);

    // Verify the fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/api/rooms/${roomId}`),
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.any(Object)
      })
    );

    // Verify the returned result indicates failure with the error message
    expect(result).toEqual({ 
      success: false, 
      message: errorResponse.error 
    });
  });

  it('should handle network errors during room operations', async () => {
    const roomId = 'test-room';
    
    // Simulate a network error for each operation
    (global.fetch as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error')) // For saveRoom
      .mockRejectedValueOnce(new Error('Network error')); // For getRooms

    // Test error during room creation
    await expect(saveRoom({ name: 'Test Room' })).rejects.toThrow('Network error');

    // Test error during room retrieval
    const getRoomsResult = await getRooms();
    expect(getRoomsResult).toEqual([]);

    // Mock network error for deleteRoom
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    // Test error during room deletion
    const deleteResult = await deleteRoom(roomId);
    // The actual error message depends on how the service handles the network error
    expect(deleteResult.success).toBe(false);
    expect(deleteResult.message).toBeDefined();
  });

  it('should properly handle 404 errors for non-existent rooms', async () => {
    const roomId = 'non-existent-room';
    const errorResponse = { error: 'Room not found' };

    // Mock 404 response for update
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => errorResponse,
      });

    // Test update 404
    await expect(saveRoom({ id: roomId, name: 'Updated Room' })).rejects.toThrow(errorResponse.error);

    // Test delete 404
    const deleteResult = await deleteRoom(roomId);
    expect(deleteResult).toEqual({ 
      success: false, 
      message: errorResponse.error 
    });

    // Reset mock for get request
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => errorResponse,
    });

    // Test get 404
    const getResult = await getRooms();
    expect(getResult).toEqual([]);
  });
});