import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { Room, Table } from '../../shared/types';

// Rooms
export const getRooms = async (): Promise<Room[]> => {
  const cacheKey = 'getRooms';
  try {
    const result = await makeApiRequest(apiUrl('/api/rooms'), undefined, cacheKey);
    return result;
 } catch (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
};

export const saveRoom = async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Room> => {
  try {
    const method = roomData.id ? 'PUT' : 'POST';
    const url = roomData.id ? apiUrl(`/api/rooms/${roomData.id}`) : apiUrl('/api/rooms');
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(roomData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    const savedRoom = await response.json();
    notifyUpdates();
    return savedRoom;
  } catch (error) {
    console.error('Error saving room:', error);
    throw error;
  }
};

export const deleteRoom = async (roomId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(apiUrl(`/api/rooms/${roomId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error('Error deleting room:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete room' };
  }
};

// Tables
export const getTables = async (): Promise<Table[]> => {
  const cacheKey = 'getTables';
  try {
    const result = await makeApiRequest(apiUrl('/api/tables'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error('Error fetching tables:', error);
    return [];
  }
};

export const saveTable = async (tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Table> => {
  try {
    const method = tableData.id ? 'PUT' : 'POST';
    const url = tableData.id ? apiUrl(`/api/tables/${tableData.id}`) : apiUrl('/api/tables');
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(tableData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    const savedTable = await response.json();
    notifyUpdates();
    return savedTable;
  } catch (error) {
    console.error('Error saving table:', error);
    throw error;
 }
};

export const deleteTable = async (tableId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(apiUrl(`/api/tables/${tableId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error('Error deleting table:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete table' };
  }
};

// Function to update table position specifically (for drag/drop operations)
export const updateTablePosition = async (tableId: string, x: number, y: number): Promise<Table> => {
  try {
    const response = await fetch(apiUrl(`/api/tables/${tableId}/position`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ positionX: x, positionY: y })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    const updatedTable = await response.json();
    notifyUpdates();
    return updatedTable;
  } catch (error) {
    console.error('Error updating table position:', error);
    throw error;
 }
};