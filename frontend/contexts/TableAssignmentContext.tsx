import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Table } from '../../shared/types';
import * as api from '../services/apiService';
import { useSessionContext } from './SessionContext';
import { useOrderContext } from './OrderContext';
import { useGlobalDataContext } from './GlobalDataContext';
import { useUIStateContext } from './UIStateContext';
import { useToast } from './ToastContext';

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
  const { addToast } = useToast();

  const handleTableAssign = async (tableId: string) => {
    try {
      if (tableId) {
        // Get the full table object from appData
        const table = appData.tables.find(t => t.id === tableId);
        if (!table) {
          console.error(`Table with ID ${tableId} not found`);
          addToast(`Table with ID ${tableId} not found`, 'error');
          return;
        }
        
        // Check if table is available before allowing assignment
        if (table.status !== 'available') {
          const statusMessage = table.status === 'occupied' 
            ? 'This table is currently occupied. Please select another table.'
            : `This table is currently ${table.status.replace('_', ' ')}. Please select another table.`;
          console.warn(`Table ${table.name} is ${table.status}`);
          addToast(statusMessage, 'error');
          return;
        }
        
        setAssignedTable(table);
        
        // Get the till name for the new tab
        const tillName = appData.tills.find(t => t.id === assignedTillId)?.name || 'Unknown';
        
        // If there's an active tab, update it with the new table assignment
        if (activeTab && assignedTillId) {
          await api.saveTab({ ...activeTab, tableId });
        } else if (!activeTab && assignedTillId) {
          // If there's no active tab, create a new tab with the tableId
          // This ensures the backend receives the tableId and updates table status to 'occupied'
          const newTab = {
            name: `Table ${table.name}`,
            items: [],
            createdAt: new Date().toISOString(),
            tillId: assignedTillId,
            tillName: tillName,
            tableId
          };
          await api.saveTab(newTab);
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
      addToast('Failed to assign table. Please try again.', 'error');
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
