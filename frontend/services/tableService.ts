import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { Room, Table } from '../../shared/types';
import i18n from '../src/i18n';

// Rooms
export const getRooms = async (): Promise<Room[]> => {
  const cacheKey = 'getRooms';
  try {
    const result = await makeApiRequest(apiUrl('/api/rooms'), { headers: getAuthHeaders() }, cacheKey);
    return result;
  } catch (error) {
    console.error(i18n.t('tableService.errorFetchingRooms'), error);
    return [];
  }
};

export const saveRoom = async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tables'> & { id?: string }): Promise<Room> => {
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
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    const savedRoom = await response.json();
    notifyUpdates();
    return savedRoom;
  } catch (error) {
    console.error(i18n.t('tableService.errorSavingRoom'), error);
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
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error(i18n.t('tableService.errorDeletingRoom'), error);
    return { success: false, message: error instanceof Error ? error.message : i18n.t('tableService.failedDeleteRoom') };
  }
};

// Tables
export const getTables = async (): Promise<Table[]> => {
  const cacheKey = 'getTables';
  try {
    const result = await makeApiRequest(apiUrl('/api/tables'), { headers: getAuthHeaders() }, cacheKey);
    return result;
  } catch (error) {
    console.error(i18n.t('tableService.errorFetchingTables'), error);
    return [];
  }
};

export const saveTable = async (tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'room' | 'tabs'> & { id?: string }): Promise<Table> => {
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
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    const savedTable = await response.json();
    notifyUpdates();
    return savedTable;
  } catch (error) {
    console.error(i18n.t('tableService.errorSavingTable'), error);
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
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error(i18n.t('tableService.errorDeletingTable'), error);
    return { success: false, message: error instanceof Error ? error.message : i18n.t('tableService.failedDeleteTable') };
  }
};

// Function to update table position specifically (for drag/drop operations)
export const updateTablePosition = async (tableId: string, x: number, y: number): Promise<Table> => {
  try {
    const response = await fetch(apiUrl(`/api/tables/${tableId}/position`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ x, y })  // Changed from positionX/positionY to x/y
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    const updatedTable = await response.json();
    notifyUpdates();
    return updatedTable;
  } catch (error) {
    console.error(i18n.t('tableService.errorUpdatingTablePosition'), error);
    throw error;
  }
};