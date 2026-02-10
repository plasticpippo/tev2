import React, { createContext, useContext, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { OrderItem, Tab } from '../../shared/types';
import * as api from '../services/apiService';
import { useSessionContext } from './SessionContext';
import { useOrderContext } from './OrderContext';
import { useGlobalDataContext } from './GlobalDataContext';
import { useUIStateContext } from './UIStateContext';
import { useTableAssignmentContext } from './TableAssignmentContext';

interface TabManagementContextType {
  handleCreateTab: (name: string) => Promise<void>;
  handleAddToTab: (tabId: number) => Promise<void>;
  handleLoadTab: (tabId: number) => void;
  handleSaveTab: () => Promise<void>;
  handleCloseTab: (tabId: number) => Promise<void>;
  handleOpenTransfer: (tabId: number) => void;
  handleConfirmMove: (
    destination: { type: 'existing', id: number } | { type: 'new', name: string },
    itemsToMove: OrderItem[]
  ) => Promise<void>;
}

const TabManagementContext = createContext<TabManagementContextType | undefined>(undefined);

interface TabManagementProviderProps {
  children: React.ReactNode;
}

export const TabManagementProvider: React.FC<TabManagementProviderProps> = ({ children }) => {
  const { currentUser, assignedTillId } = useSessionContext();
  const { orderItems, setOrderItems, clearOrder, activeTab, setActiveTab } = useOrderContext();
  const { appData } = useGlobalDataContext();
  const { setIsTabsModalOpen, transferSourceTab, setTransferSourceTab, setIsTransferModalOpen } = useUIStateContext();
  const { assignedTable } = useTableAssignmentContext();

  const handleCreateTab = async (name: string) => {
    if (!assignedTillId) return;
    await api.saveTab({
      name,
      items: [],
      tillId: assignedTillId,
      tillName: "Placeholder Till Name", // This should come from GlobalDataContext
      createdAt: new Date().toISOString(),
      tableId: assignedTable?.id
    });
  };
  
  const handleAddToTab = async (tabId: number) => {
    const tab = appData.tabs.find(t => t.id === tabId);
    if (!tab || orderItems.length === 0 || !currentUser) return;
    // Fix items without names when adding to a tab
    const correctedOrderItems = orderItems.map(item => ({
      ...item,
      name: item.name && item.name.trim() !== '' ? item.name : `Item ${item.variantId}`
    }));
    const updatedItems = [...tab.items];
    correctedOrderItems.forEach(orderItem => {
      const existing = updatedItems.find(i => i.variantId === orderItem.variantId);
      if (existing) {
        existing.quantity += orderItem.quantity;
      } else {
        updatedItems.push(orderItem);
      }
    });
    await api.saveTab({ ...tab, items: updatedItems, tableId: assignedTable?.id });
    
    // Update order session status to assign-tab when adding to a tab
    try {
      const result = await api.updateOrderSessionStatus('assign-tab');
      if (!result) {
        console.warn('Order session assign-tab status update failed or user not authenticated');
      }
    } catch (error) {
      console.error('Failed to update order session status when assigning to tab:', error);
    }
    
    clearOrder(false);
    setIsTabsModalOpen(false);
  };
  
  const handleLoadTab = (tabId: number) => {
    const tab = appData.tabs.find(t => t.id === tabId);
    if (tab) {
      // Fix items without names when loading a tab
      const correctedItems = tab.items.map(item => ({
        ...item,
        name: item.name && item.name.trim() !== '' ? item.name : `Item ${item.variantId}`
      }));
      setOrderItems(correctedItems);
      setActiveTab(tab);
      setIsTabsModalOpen(false);
    }
  };
  
  const handleSaveTab = async () => {
    if (!activeTab) return;
    // Fix items without names when saving a tab
    const correctedItems = orderItems.map(item => ({
      ...item,
      name: item.name && item.name.trim() !== '' ? item.name : `Item ${item.variantId}`
    }));
    await api.saveTab({ ...activeTab, items: correctedItems, tableId: assignedTable?.id });
    clearOrder(false);
 };
  
  const handleCloseTab = async (tabId: number) => {
    const tab = appData.tabs.find(t => t.id === tabId);
    if (tab && tab.items.length === 0) {
      await api.deleteTab(tabId);
    }
  };
  
  const handleOpenTransfer = (tabId: number) => {
    const source = appData.tabs.find(t => t.id === tabId);
    if (source) {
      setTransferSourceTab(source);
      setIsTabsModalOpen(false);
      setIsTransferModalOpen(true);
    }
 };

  const handleConfirmMove = async (
    destination: { type: 'existing', id: number } | { type: 'new', name: string },
    itemsToMove: OrderItem[]
  ) => {
    // Use the transferSourceTab from the component's scope
    // Note: Allow creating new tabs even when no items are selected
    if (!transferSourceTab || !assignedTillId || !currentUser) return;

    // Fix items without names before moving
    const correctedItemsToMove = itemsToMove.map(item => ({
      ...item,
      name: item.name && item.name.trim() !== '' ? item.name : `Item ${item.variantId}`
    }));

    let destTab: Tab;
    if (destination.type === 'new') {
        destTab = await api.saveTab({
          name: destination.name,
          items: [],
          tillId: assignedTillId,
          tillName: "Placeholder Till Name", // This should come from GlobalDataContext
          createdAt: new Date().toISOString()
        });
    } else {
        const foundTab = appData.tabs.find(t => t.id === destination.id);
        if (!foundTab) return;
        destTab = foundTab;
    }

    // Add items to destination
    const destItems = [...destTab.items];
    correctedItemsToMove.forEach(movingItem => {
        const existing = destItems.find(i => i.variantId === movingItem.variantId);
        if (existing) {
            existing.quantity += movingItem.quantity;
        } else {
            destItems.push({ ...movingItem, id: uuidv4() }); // new unique ID for the new tab
        }
    });

    // Remove items from source
    const sourceItems = [...transferSourceTab.items];
    correctedItemsToMove.forEach(movingItem => {
        const existingIndex = sourceItems.findIndex(i => i.id === movingItem.id);
        if (existingIndex > -1) {
            sourceItems[existingIndex].quantity -= movingItem.quantity;
        }
    });
    const finalSourceItems = sourceItems.filter(i => i.quantity > 0);

    await api.updateMultipleTabs([
        { ...transferSourceTab, items: finalSourceItems },
        { ...destTab, items: destItems }
    ]);
    setIsTransferModalOpen(false);
    setTransferSourceTab(null);
  };

  const value: TabManagementContextType = {
    handleCreateTab,
    handleAddToTab,
    handleLoadTab,
    handleSaveTab,
    handleCloseTab,
    handleOpenTransfer,
    handleConfirmMove
  };

  return (
    <TabManagementContext.Provider value={value}>
      {children}
    </TabManagementContext.Provider>
  );
};

export const useTabManagementContext = () => {
  const context = useContext(TabManagementContext);
  if (context === undefined) {
    throw new Error('useTabManagementContext must be used within a TabManagementProvider');
  }
  return context;
};