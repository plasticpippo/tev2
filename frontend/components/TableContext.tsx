import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Room, Table } from '../../shared/types';
import { useToast } from '../contexts/ToastContext';
import { useSessionContext } from '../contexts/SessionContext';
import { getRooms, saveRoom, deleteRoom as deleteRoomService, getTables, saveTable, deleteTable as deleteTableService, updateTablePosition as updateTablePositionService } from '../services/tableService';
import { isAuthTokenReady } from '../services/apiBase';

export type LayoutMode = 'view' | 'edit' | 'drag';

interface TableContextType {
  rooms: Room[];
  tables: Table[];
  layoutMode: LayoutMode;
  selectedRoomId: string | null;
  loading: boolean;
  error: string | null;
  setRooms: (rooms: Room[]) => void;
  setTables: (tables: Table[]) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setSelectedRoomId: (id: string | null) => void;
  fetchRooms: () => Promise<void>;
  fetchTables: () => Promise<void>;
  addRoom: (room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Room>;
  updateRoom: (id: string, room: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Room>;
  deleteRoom: (id: string) => Promise<void>;
  addTable: (table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Table>;
  updateTable: (id: string, table: Partial<Omit<Table, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Table>;
  deleteTable: (id: string) => Promise<void>;
  updateTablePosition: (id: string, x: number, y: number) => Promise<void>;
  refreshData: () => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('view');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addToast } = useToast();
  const { currentUser } = useSessionContext();
  const isMountedRef = useRef(true);

  // Fetch rooms from API
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getRooms();
      if (isMountedRef.current) {
        setRooms(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('tableContext.errorFetchingRooms');
      if (isMountedRef.current) {
        setError(errorMessage);
      }
      addToast(errorMessage, 'error');
      console.error('Error fetching rooms:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [addToast, t]);

  // Fetch tables from API
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTables();
      if (isMountedRef.current) {
        setTables(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('tableContext.errorFetchingTables');
      if (isMountedRef.current) {
        setError(errorMessage);
      }
      addToast(errorMessage, 'error');
      console.error('Error fetching tables:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [addToast, t]);

  // Add a new room
  const addRoom = useCallback(async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tables'>) => {
    try {
      setLoading(true);
      const newRoom = await saveRoom(roomData);
      setRooms(prev => [...prev, newRoom]);
      addToast(t('tableContext.roomCreated', { name: newRoom.name }), 'success');
      return newRoom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('tableContext.errorAddingRoom');
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error adding room:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  // Update a room
  const updateRoom = useCallback(async (id: string, roomData: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tables'>>) => {
    try {
      setLoading(true);
      const updatedRoom = await saveRoom({ ...roomData, id } as Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tables'> & { id?: string });
      setRooms(prev => prev.map(room => room.id === id ? updatedRoom : room));
      addToast(t('tableContext.roomUpdated'), 'success');
      return updatedRoom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('tableContext.errorUpdatingRoom');
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error updating room:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  // Delete a room
  const deleteRoom = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const result = await deleteRoomService(id);

      if (!result.success) {
        throw new Error(result.message || t('tableContext.failedDeleteRoom'));
      }

      setRooms(prev => prev.filter(room => room.id !== id));
      // Also remove tables in this room
      setTables(prev => prev.filter(table => table.roomId !== id));
      if (selectedRoomId === id) {
        setSelectedRoomId(null);
      }
      addToast(t('tableContext.roomDeleted'), 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('tableContext.errorDeletingRoom');
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error deleting room:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast, selectedRoomId, t]);

  // Add a new table
  const addTable = useCallback(async (tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'room' | 'tabs'>) => {
    try {
      setLoading(true);
      const newTable = await saveTable(tableData);
      setTables(prev => [...prev, newTable]);
      addToast(t('tableContext.tableCreated', { name: newTable.name }), 'success');
      return newTable;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('tableContext.errorAddingTable');
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error adding table:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  // Update a table
  const updateTable = useCallback(async (id: string, tableData: Partial<Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'room' | 'tabs'>>) => {
    try {
      setLoading(true);
      const updatedTable = await saveTable({ ...tableData, id } as Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'room' | 'tabs'> & { id?: string });
      setTables(prev => prev.map(table => table.id === id ? updatedTable : table));
      addToast(t('tableContext.tableUpdated'), 'success');
      return updatedTable;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('tableContext.errorUpdatingTable');
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error updating table:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  // Delete a table
  const deleteTable = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const result = await deleteTableService(id);

      if (!result.success) {
        throw new Error(result.message || t('tableContext.failedDeleteTable'));
      }

      setTables(prev => prev.filter(table => table.id !== id));
      addToast(t('tableContext.tableDeleted'), 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('tableContext.errorDeletingTable');
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error deleting table:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast, t]);

  // Update table position (for drag and drop)
  const updateTablePosition = useCallback(async (id: string, x: number, y: number) => {
    // Store original values before optimistic update for potential rollback
    const originalTable = tables.find(t => t.id === id);
    const originalX = originalTable?.x;
    const originalY = originalTable?.y;

    // Optimistically update the local state for immediate UI feedback
    setTables(prev =>
      prev.map(table =>
        table.id === id ? { ...table, x, y } : table
      )
    );

    // Then update the backend
    try {
      await updateTablePositionService(id, x, y);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('tableContext.failedUpdatePosition');
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error updating table position:', error);
      // Revert the optimistic update using original values
      if (originalX !== undefined && originalY !== undefined) {
        setTables(prev =>
          prev.map(table =>
            table.id === id ? { ...table, x: originalX, y: originalY } : table
          )
        );
      }
    }
  }, [addToast, tables, t]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchRooms(), fetchTables()]);
  }, [fetchRooms, fetchTables]);

  // Load initial data when context is mounted and user is authenticated
  useEffect(() => {
    isMountedRef.current = true;
    
    // Only fetch data if user is authenticated AND auth token is ready
    if (currentUser) {
      // Check if authentication token is ready before making API calls
      if (!isAuthTokenReady()) {
        // Token not ready yet, wait and try again
        const checkTokenInterval = setInterval(() => {
          // Stop polling if user logged out or component unmounted
          if (!currentUser || !isMountedRef.current) {
            clearInterval(checkTokenInterval);
            return;
          }
          if (isAuthTokenReady() && isMountedRef.current) {
            clearInterval(checkTokenInterval);
            refreshData();
          }
        }, 50); // Check every 50ms
        
        // Cleanup interval after 5 seconds to prevent infinite checking
        setTimeout(() => clearInterval(checkTokenInterval), 5000);
        
        return () => {
          clearInterval(checkTokenInterval);
          isMountedRef.current = false;
        };
      }
      
      // Token is ready, fetch data with a small delay for state propagation
      const timer = setTimeout(() => {
        // Only fetch if still mounted and user is still logged in
        if (isMountedRef.current && currentUser) {
          refreshData();
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [refreshData, currentUser]);

  return (
    <TableContext.Provider
      value={{
        rooms,
        tables,
        layoutMode,
        selectedRoomId,
        loading,
        error,
        setRooms,
        setTables,
        setLayoutMode,
        setSelectedRoomId,
        fetchRooms,
        fetchTables,
        addRoom: addRoom as (room: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tables'>) => Promise<Room>,
        updateRoom: updateRoom as (id: string, room: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tables'>>) => Promise<Room>,
        deleteRoom,
        addTable: addTable as (table: Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'room' | 'tabs'>) => Promise<Table>,
        updateTable: updateTable as (id: string, table: Partial<Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'room' | 'tabs'>>) => Promise<Table>,
        deleteTable,
        updateTablePosition,
        refreshData,
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

export const useTableContext = () => {
  const { t } = useTranslation();
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error(t('tableContext.contextError'));
  }
  return context;
};
