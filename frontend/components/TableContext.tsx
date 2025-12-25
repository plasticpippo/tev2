import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { Room, Table } from '@shared/types';

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
  updateTablePosition: (id: string, x: number, y: number) => void;
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

  // Fetch rooms from API
  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rooms');
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching rooms');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch tables from API
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tables');
      if (!response.ok) throw new Error('Failed to fetch tables');
      const data = await response.json();
      setTables(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching tables');
      console.error('Error fetching tables:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new room
  const addRoom = useCallback(async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });
      
      if (!response.ok) throw new Error('Failed to add room');
      const newRoom = await response.json();
      setRooms(prev => [...prev, newRoom]);
      return newRoom;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding room');
      console.error('Error adding room:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a room
  const updateRoom = useCallback(async (id: string, roomData: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rooms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData),
      });
      
      if (!response.ok) throw new Error('Failed to update room');
      const updatedRoom = await response.json();
      setRooms(prev => prev.map(room => room.id === id ? updatedRoom : room));
      return updatedRoom;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating room');
      console.error('Error updating room:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a room
  const deleteRoom = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rooms/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete room');
      setRooms(prev => prev.filter(room => room.id !== id));
      // Also remove tables in this room
      setTables(prev => prev.filter(table => table.roomId !== id));
      if (selectedRoomId === id) {
        setSelectedRoomId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting room');
      console.error('Error deleting room:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [selectedRoomId]);

  // Add a new table
  const addTable = useCallback(async (tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tableData),
      });
      
      if (!response.ok) throw new Error('Failed to add table');
      const newTable = await response.json();
      setTables(prev => [...prev, newTable]);
      return newTable;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error adding table');
      console.error('Error adding table:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update a table
  const updateTable = useCallback(async (id: string, tableData: Partial<Omit<Table, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tables/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tableData),
      });
      
      if (!response.ok) throw new Error('Failed to update table');
      const updatedTable = await response.json();
      setTables(prev => prev.map(table => table.id === id ? updatedTable : table));
      return updatedTable;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating table');
      console.error('Error updating table:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a table
  const deleteTable = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tables/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete table');
      setTables(prev => prev.filter(table => table.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting table');
      console.error('Error deleting table:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update table position (for drag and drop)
  const updateTablePosition = useCallback((id: string, x: number, y: number) => {
    setTables(prev => 
      prev.map(table => 
        table.id === id ? { ...table, x, y } : table
      )
    );
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([fetchRooms(), fetchTables()]);
  }, [fetchRooms, fetchTables]);

  // Load initial data when context is mounted
  useEffect(() => {
    refreshData();
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
        addRoom,
        updateRoom,
        deleteRoom,
        addTable,
        updateTable,
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