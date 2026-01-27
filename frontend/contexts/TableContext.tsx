import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Room, Table } from '../../shared/types';
import * as tableService from '../services/tableService';

type LayoutMode = 'view' | 'edit' | 'drag';

interface TableContextType {
  // Data
  rooms: Room[];
  tables: Table[];
  
  // UI State
  selectedRoomId: string | null;
  setSelectedRoomId: (roomId: string | null) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  loading: boolean;
  error: string | null;
  
  // Room CRUD operations
  addRoom: (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tables'>) => Promise<void>;
  updateRoom: (roomId: string, roomData: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tables'>>) => Promise<void>;
  deleteRoom: (roomId: string) => Promise<void>;
  
  // Table CRUD operations
  addTable: (tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'room' | 'tabs'>) => Promise<void>;
  updateTable: (tableId: string, tableData: Partial<Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'room' | 'tabs'>>) => Promise<void>;
  deleteTable: (tableId: string) => Promise<void>;
  updateTablePosition: (tableId: string, x: number, y: number) => Promise<void>;
  
  // Utility
  refreshData: () => Promise<void>;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

interface TableProviderProps {
  children: React.ReactNode;
}

export const TableProvider: React.FC<TableProviderProps> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roomsData, tablesData] = await Promise.all([
        tableService.getRooms(),
        tableService.getTables()
      ]);
      setRooms(roomsData);
      setTables(tablesData);
    } catch (err) {
      console.error('Error fetching table data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Room CRUD operations
  const addRoom = async (roomData: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tables'>) => {
    try {
      setError(null);
      await tableService.saveRoom(roomData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add room';
      setError(errorMessage);
      throw err;
    }
  };

  const updateRoom = async (roomId: string, roomData: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tables'>>) => {
    try {
      setError(null);
      // Build the room object with required properties, ensuring required fields have values
      const currentRoom = rooms.find(r => r.id === roomId);
      if (!currentRoom) {
        throw new Error('Room not found');
      }
      
      // Merge current room data with updates, ensuring required fields are present
      const roomToUpdate = {
        ...currentRoom,
        ...roomData,
        id: roomId
      };
      
      await tableService.saveRoom(roomToUpdate as Omit<Room, 'id' | 'createdAt' | 'updatedAt'> & { id?: string });
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update room';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteRoom = async (roomId: string) => {
    try {
      setError(null);
      const result = await tableService.deleteRoom(roomId);
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete room');
      }
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete room';
      setError(errorMessage);
      throw err;
    }
  };

  // Table CRUD operations
  const addTable = async (tableData: Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'room' | 'tabs'>) => {
    try {
      setError(null);
      await tableService.saveTable(tableData);
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add table';
      setError(errorMessage);
      throw err;
    }
  };

  const updateTable = async (tableId: string, tableData: Partial<Omit<Table, 'id' | 'createdAt' | 'updatedAt' | 'room' | 'tabs'>>) => {
    try {
      setError(null);
      // Build the table object with required properties, ensuring required fields have values
      const currentTable = tables.find(t => t.id === tableId);
      if (!currentTable) {
        throw new Error('Table not found');
      }
      
      // Merge current table data with updates, ensuring required fields are present
      const tableToUpdate = {
        ...currentTable,
        ...tableData,
        id: tableId
      };
      
      await tableService.saveTable(tableToUpdate as Omit<Table, 'id' | 'createdAt' | 'updatedAt'> & { id?: string });
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update table';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteTable = async (tableId: string) => {
    try {
      setError(null);
      const result = await tableService.deleteTable(tableId);
      if (!result.success) {
        throw new Error(result.message || 'Failed to delete table');
      }
      await refreshData();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete table';
      setError(errorMessage);
      throw err;
    }
  };

  const updateTablePosition = async (tableId: string, x: number, y: number) => {
    try {
      setError(null);
      
      // Optimistically update local state for immediate feedback
      setTables(prevTables => 
        prevTables.map(table => 
          table.id === tableId 
            ? { ...table, x, y } 
            : table
        )
      );
      
      // Then update backend
      await tableService.updateTablePosition(tableId, x, y);
      
      // No need to refresh all data, position already updated optimistically
    } catch (err) {
      // If backend update fails, refresh to get correct state
      console.error('Error updating table position:', err);
      await refreshData();
      const errorMessage = err instanceof Error ? err.message : 'Failed to update table position';
      setError(errorMessage);
    }
  };

  const value: TableContextType = {
    rooms,
    tables,
    selectedRoomId,
    setSelectedRoomId,
    layoutMode,
    setLayoutMode,
    loading,
    error,
    addRoom,
    updateRoom,
    deleteRoom,
    addTable,
    updateTable,
    deleteTable,
    updateTablePosition,
    refreshData
  };

  return (
    <TableContext.Provider value={value}>
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