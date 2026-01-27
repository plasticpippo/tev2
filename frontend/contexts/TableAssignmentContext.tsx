import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Table } from '../../shared/types';
import * as api from '../services/apiService';
import { useSessionContext } from './SessionContext';
import { useOrderContext } from './OrderContext';
import { useGlobalDataContext } from './GlobalDataContext';
import { useUIStateContext } from './UIStateContext';

interface TableAssignmentContextType {
  assignedTable: Table | null;
  setAssignedTable: React.Dispatch<React.SetStateAction<Table | null>>;
  handleTableAssign: (tableId: string) => Promise<void>;
  handleOpenTableAssignment: () => void;
  handleTableUnassign: () => Promise<void>;
  syncTableWithActiveTab: (tableId: string | null) => Promise<void>;
  clearTableAssignment: () => void;
}

const TableAssignmentContext = createContext<TableAssignmentContextType | undefined>(undefined);

interface TableAssignmentProviderProps {
  children: React.ReactNode;
}

export const TableAssignmentProvider: React.FC<TableAssignmentProviderProps> = ({ children }) => {
  const [assignedTable, setAssignedTable] = useState<Table | null>(null);

  const { activeTab } = useOrderContext();
  const { assignedTillId } = useSessionContext();
  const { appData } = useGlobalDataContext();

  const handleTableAssign = async (tableId: string) => {
    try {
      if (tableId) {
        // Get the full table object from appData
        const table = appData.tables.find(t => t.id === tableId);
        if (!table) {
          console.error(`Table with ID ${tableId} not found`);
          return;
        }
        
        setAssignedTable(table);
        
        // If there's an active tab, update it with the new table assignment
        if (activeTab && assignedTillId) {
          await api.saveTab({ ...activeTab, tableId });
        }
      } else {
        // Clear table assignment
        setAssignedTable(null);
        if (activeTab && assignedTillId) {
          await api.saveTab({ ...activeTab, tableId: undefined });
        }
      }
    } catch (error) {
      console.error('Error handling table assignment:', error);
      // Optionally, you could throw the error or handle it differently
      // For example, you could show an error message to the user
    }
 };

  const handleTableUnassign = async () => {
    try {
      setAssignedTable(null);
      if (activeTab && assignedTillId) {
        await api.saveTab({ ...activeTab, tableId: undefined });
      }
    } catch (error) {
      console.error('Error unassigning table:', error);
    }
  };

  const syncTableWithActiveTab = async (tableId: string | null) => {
    try {
      if (activeTab && assignedTillId) {
        const updatedTab = { ...activeTab, tableId: tableId || undefined };
        await api.saveTab(updatedTab);
      }
    } catch (error) {
      console.error('Error syncing table with active tab:', error);
    }
  };

  const { setIsTableAssignmentModalOpen } = useUIStateContext();

  const handleOpenTableAssignment = () => {
    setIsTableAssignmentModalOpen(true);
  };

  const clearTableAssignment = () => {
    setAssignedTable(null);
  };

  const value: TableAssignmentContextType = {
    assignedTable,
    setAssignedTable,
    handleTableAssign,
    handleOpenTableAssignment,
    handleTableUnassign,
    syncTableWithActiveTab,
    clearTableAssignment
  };

  return (
    <TableAssignmentContext.Provider value={value}>
      {children}
    </TableAssignmentContext.Provider>
  );
};

export const useTableAssignmentContext = () => {
  const context = useContext(TableAssignmentContext);
  if (context === undefined) {
    throw new Error('useTableAssignmentContext must be used within a TableAssignmentProvider');
  }
  return context;
};