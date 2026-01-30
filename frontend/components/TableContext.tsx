import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import { Room, Table } from '../../shared/types';
import { useToast } from '../contexts/ToastContext';
import { getRooms, saveRoom, deleteRoom as deleteRoomService, getTables, saveTable, deleteTable as deleteTableService, updateTablePosition as updateTablePositionService } from '../services/tableService';

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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('view');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addToast } = useToast();
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
      const errorMessage = err instanceof Error ? err.message : 'Error fetching rooms';
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
  }, [addToast]);

  // Fetch tables from API
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTables();
      if (isMountedRef.current) {
        setTables(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching tables';
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
  }, [addToast]);

  // Add a new room
  const addRoom = useCallback(async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tables'>) => {
    try {
      setLoading(true);
      const newRoom = await saveRoom(roomData);
      setRooms(prev => [...prev, newRoom]);
      addToast(`Room "${newRoom.name}" created successfully`, 'success');
      return newRoom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding room';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error adding room:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Update a room
  const updateRoom = useCallback(async (id: string, roomData: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tables'>>) => {
    try {
      setLoading(true);
      const updatedRoom = await saveRoom({ ...roomData, id } as Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tables'> & { id?: string });
      setRooms(prev => prev.map(room => room.id === id ? updatedRoom : room));
      addToast('Room updated successfully', 'success');
      return updatedRoom;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating room';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error updating room:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Delete a room
  const deleteRoom = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const result = await deleteRoomService(id);

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete room');
      }

      setRooms(prev => prev.filter(room => room.id !== id));
      // Also remove tables in this room
      setTables(prev => prev.filter(table => table.roomId !== id));
      if (selectedRoomId === id) {
        setSelectedRoomId(null);
      }
      addToast('Room deleted successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting room';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error deleting room:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast, selectedRoomId]);

  // Add a new table
  const addTable = useCallback(async (tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'room' | 'tabs'>) => {
    try {
      setLoading(true);
      const newTable = await saveTable(tableData);
      setTables(prev => [...prev, newTable]);
      addToast(`Table "${newTable.name}" created successfully`, 'success');
      return newTable;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding table';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error adding table:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Update a table
  const updateTable = useCallback(async (id: string, tableData: Partial<Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'room' | 'tabs'>>) => {
    try {
      setLoading(true);
      const updatedTable = await saveTable({ ...tableData, id } as Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'room' | 'tabs'> & { id?: string });
      setTables(prev => prev.map(table => table.id === id ? updatedTable : table));
      addToast('Table updated successfully', 'success');
      return updatedTable;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating table';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error updating table:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Delete a table
  const deleteTable = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const result = await deleteTableService(id);

      if (!result.success) {
        throw new Error(result.message || 'Failed to delete table');
      }

      setTables(prev => prev.filter(table => table.id !== id));
      addToast('Table deleted successfully', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error deleting table';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error deleting table:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

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
      const errorMessage = error instanceof Error ? error.message : 'Failed to update table position';
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
  }, [addToast, tables]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchRooms(), fetchTables()]);
  }, [fetchRooms, fetchTables]);

  // Load initial data when context is mounted
  useEffect(() => {
    isMountedRef.current = true;
    refreshData();

    return () => {
      isMountedRef.current = false;
    };
  }, [refreshData]);

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
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  return context;
};
