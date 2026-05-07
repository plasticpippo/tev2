import React, { createContext, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import type { OrderItem, Tab } from '../../shared/types';
import * as api from '../services/apiService';
import { useToast } from './ToastContext';
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
  const { t } = useTranslation();
  const { currentUser, assignedTillId } = useSessionContext();
  const { orderItems, setOrderItems, clearOrder, activeTab, setActiveTab } = useOrderContext();
  const { appData } = useGlobalDataContext();
  const { setIsTabsModalOpen, transferSourceTab, setTransferSourceTab, setIsTransferModalOpen } = useUIStateContext();
  const { assignedTable } = useTableAssignmentContext();
  const { addToast } = useToast();

  const handleCreateTab = async (name: string) => {
    if (!assignedTillId) return;
    try {
      await api.saveTab({
        name,
        items: [],
        tillId: assignedTillId,
        tillName: t('tabManagementContext.placeholderTillName'), // This should come from GlobalDataContext
        createdAt: new Date().toISOString(),
        tableId: assignedTable?.id
      });
      setIsTabsModalOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('tabs.createFailed');
      addToast(errorMessage, 'error', 5000);
      console.error('Failed to create tab:', error);
    }
  };
  
  const handleAddToTab = async (tabId: number) => {
    const tab = appData.tabs.find(t => t.id === tabId);
    if (!tab || orderItems.length === 0 || !currentUser) return;
    // Fix items without names when adding to a tab
    const correctedOrderItems = orderItems.map(item => ({
      ...item,
      name: item.name && item.name.trim() !== '' ? item.name : t('tabManagementContext.itemFallbackName', { variantId: item.variantId })
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

    try {
      await api.saveTab({ ...tab, items: updatedItems, tableId: assignedTable?.id });

      // Update order session status to assign-tab when adding to a tab
      const result = await api.updateOrderSessionStatus('assign-tab');
      if (!result) {
        console.warn(t('tabManagementContext.orderSessionAssignTabFailed'));
        addToast(t('tabManagementContext.orderSessionAssignTabFailed'), 'error', 5000);
      }

      clearOrder(false);
      setIsTabsModalOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('tabs.addFailed');
      addToast(errorMessage, 'error', 5000);
      console.error('Failed to add to tab:', error);
    }
  };
  
  const handleLoadTab = async (tabId: number) => {
    const tab = appData.tabs.find(t => t.id === tabId);
    if (tab) {
      // Fix items without names when loading a tab
      const correctedItems = tab.items.map(item => ({
        ...item,
        name: item.name && item.name.trim() !== '' ? item.name : t('tabManagementContext.itemFallbackName', { variantId: item.variantId })
      }));
      setOrderItems(correctedItems);
      setActiveTab(tab);
      setIsTabsModalOpen(false);

      // Immediately persist the order session so the backend has an active
      // session with the tab items. Without this the autosave debounce (500ms)
      // leaves a window where the backend has no matching session, causing
      // payment processing to fail with a 500 error.
      try {
        await api.saveOrderSession(correctedItems);
      } catch (error) {
        console.error('Failed to save order session for loaded tab:', error);
      }
    }
  };
  
  const handleSaveTab = async () => {
    if (!activeTab) return;
    // Fix items without names when saving a tab
    const correctedItems = orderItems.map(item => ({
      ...item,
      name: item.name && item.name.trim() !== '' ? item.name : t('tabManagementContext.itemFallbackName', { variantId: item.variantId })
    }));

    try {
      await api.saveTab({ ...activeTab, items: correctedItems, tableId: assignedTable?.id });
      clearOrder(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('tabs.saveFailed');
      addToast(errorMessage, 'error', 5000);
      console.error('Failed to save tab:', error);
    }
  };
  
  const handleCloseTab = async (tabId: number) => {
    const tab = appData.tabs.find(t => t.id === tabId);
    if (tab && tab.items.length === 0) {
      try {
        await api.deleteTab(tabId);
        addToast(t('tabs.tabClosed'), 'success', 3000);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : t('tabs.deleteFailed');
        addToast(errorMessage, 'error', 5000);
        console.error('Failed to close tab:', error);
      }
    } else if (tab && tab.items.length > 0) {
      addToast(t('tabs.emptyTab'), 'error', 3000);
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
      name: item.name && item.name.trim() !== '' ? item.name : t('tabManagementContext.itemFallbackName', { variantId: item.variantId })
    }));

    // Prepare destination data
    let destinationData;
    if (destination.type === 'new') {
        destinationData = {
          type: 'new' as const,
          name: destination.name,
          tillId: assignedTillId,
          tillName: t('tabManagementContext.placeholderTillName'),
          tableId: assignedTable?.id
        };
    } else {
        destinationData = {
          type: 'existing' as const,
          id: destination.id
        };
    }

    try {
      // Use atomic transfer endpoint
      await api.transferTabItems(transferSourceTab.id, destinationData, correctedItemsToMove);
      setIsTransferModalOpen(false);
      setTransferSourceTab(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('transfer.transferFailed');
      addToast(errorMessage, 'error', 5000);
      console.error('Failed to transfer items:', error);
    }
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