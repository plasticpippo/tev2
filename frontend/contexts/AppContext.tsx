import React, { createContext, useContext } from 'react';
import type {
  User, Product, Category, OrderItem, ProductVariant, Settings,
  Transaction, Tab, Till, StockItem, StockAdjustment, OrderActivityLog,
  Room, Table
} from '../../shared/types';
import { useSessionContext } from './SessionContext';
import { useGlobalDataContext } from './GlobalDataContext';
import { useOrderContext } from './OrderContext';
import { useUIStateContext } from './UIStateContext';
import { useTableAssignmentContext } from './TableAssignmentContext';
import { usePaymentContext } from './PaymentContext';
import { useTabManagementContext } from './TabManagementContext';

// Combined AppContext interface that brings together all the separate contexts
interface AppContextType {
  // Global App Data
 appData: {
    products: Product[];
    categories: Category[];
    users: User[];
    tills: Till[];
    settings: Settings | null;
    transactions: Transaction[];
    tabs: Tab[];
    stockItems: StockItem[];
    stockAdjustments: StockAdjustment[];
    orderActivityLogs: OrderActivityLog[];
    rooms: Room[];
    tables: Table[];
  };
  isLoading: boolean;
 setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

  // Session State
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  assignedTillId: number | null;
  setAssignedTillId: React.Dispatch<React.SetStateAction<number | null>>;
  isAdminPanelOpen: boolean;
  setIsAdminPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;

  // Order State
  orderItems: OrderItem[];
  setOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  isLoadingOrderSession: boolean;
  setIsLoadingOrderSession: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: Tab | null;
  setActiveTab: React.Dispatch<React.SetStateAction<Tab | null>>;
  assignedTable: Table | null;
  setAssignedTable: React.Dispatch<React.SetStateAction<Table | null>>;

 // Modal State
 isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTabsModalOpen: boolean;
  setIsTabsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTableAssignmentModalOpen: boolean;
  setIsTableAssignmentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  transferSourceTab: Tab | null;
  setTransferSourceTab: React.Dispatch<React.SetStateAction<Tab | null>>;

  // Computed Values
  makableVariantIds: Set<number>;
  currentTillName: string;

  // Handlers
  handleLogin: (user: User) => void;
  handleLogout: () => void;
  handleTillSelect: (tillId: number) => void;
 handleAssignDevice: (tillId: number) => void;
  handleAddToCart: (variant: ProductVariant, product: Product) => void;
  handleUpdateQuantity: (orderItemId: string, newQuantity: number) => void;
  clearOrder: (logActivity?: boolean) => void;
  handleConfirmPayment: (paymentMethod: string, tip: number) => Promise<void>;
  handleCreateTab: (name: string) => Promise<void>;
  handleAddToTab: (tabId: number) => Promise<void>;
  handleLoadTab: (tabId: number) => void;
  handleSaveTab: () => Promise<void>;
  handleCloseTab: (tabId: number) => Promise<void>;
  handleOpenTransfer: (tabId: number) => void;
  handleTableAssign: (tableId: string) => Promise<void>;
  handleOpenTableAssignment: () => void;
  handleConfirmMove: (
    destination: { type: 'existing', id: number } | { type: 'new', name: string },
    itemsToMove: OrderItem[]
  ) => Promise<void>;
  fetchData: () => Promise<void>;
  debouncedFetchData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Combined provider that wraps all the individual providers
interface AppProviderProps {
  children: React.ReactNode;
}

export const NewAppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // This provider is now just a wrapper for backward compatibility
  // The actual implementation is in the AppProvider.tsx file
  return <>{children}</>;
};

// Combined hook that provides access to all contexts
export const useAppContext = () => {
  const sessionContext = useSessionContext();
  const globalDataContext = useGlobalDataContext();
  const orderContext = useOrderContext();
  const uiStateContext = useUIStateContext();
  const tableAssignmentContext = useTableAssignmentContext();
  const paymentContext = usePaymentContext();
  const tabManagementContext = useTabManagementContext();

  const contextValue: AppContextType = {
    // Global App Data
    appData: globalDataContext.appData,
    isLoading: globalDataContext.isLoading,
    setIsLoading: globalDataContext.setIsLoading,

    // Session State
    currentUser: sessionContext.currentUser,
    setCurrentUser: sessionContext.setCurrentUser,
    assignedTillId: sessionContext.assignedTillId,
    setAssignedTillId: sessionContext.setAssignedTillId,
    isAdminPanelOpen: sessionContext.isAdminPanelOpen,
    setIsAdminPanelOpen: sessionContext.setIsAdminPanelOpen,

    // Order State
    orderItems: orderContext.orderItems,
    setOrderItems: orderContext.setOrderItems,
    isLoadingOrderSession: orderContext.isLoadingOrderSession,
    setIsLoadingOrderSession: orderContext.setIsLoadingOrderSession,
    activeTab: orderContext.activeTab,
    setActiveTab: orderContext.setActiveTab,
    assignedTable: tableAssignmentContext.assignedTable,
    setAssignedTable: tableAssignmentContext.setAssignedTable,

    // Modal State
    isPaymentModalOpen: uiStateContext.isPaymentModalOpen,
    setIsPaymentModalOpen: uiStateContext.setIsPaymentModalOpen,
    isTabsModalOpen: uiStateContext.isTabsModalOpen,
    setIsTabsModalOpen: uiStateContext.setIsTabsModalOpen,
    isTransferModalOpen: uiStateContext.isTransferModalOpen,
    setIsTransferModalOpen: uiStateContext.setIsTransferModalOpen,
    isTableAssignmentModalOpen: uiStateContext.isTableAssignmentModalOpen,
    setIsTableAssignmentModalOpen: uiStateContext.setIsTableAssignmentModalOpen,
    transferSourceTab: uiStateContext.transferSourceTab,
    setTransferSourceTab: uiStateContext.setTransferSourceTab,

    // Computed Values
    makableVariantIds: globalDataContext.makableVariantIds,
    currentTillName: globalDataContext.currentTillName,

    // Handlers
    handleLogin: sessionContext.handleLogin,
    handleLogout: sessionContext.handleLogout,
    handleTillSelect: sessionContext.handleTillSelect,
    handleAssignDevice: sessionContext.handleAssignDevice,
    handleAddToCart: orderContext.handleAddToCart,
    handleUpdateQuantity: orderContext.handleUpdateQuantity,
    clearOrder: orderContext.clearOrder,
    handleConfirmPayment: paymentContext.handleConfirmPayment,
    handleCreateTab: tabManagementContext.handleCreateTab,
    handleAddToTab: tabManagementContext.handleAddToTab,
    handleLoadTab: tabManagementContext.handleLoadTab,
    handleSaveTab: tabManagementContext.handleSaveTab,
    handleCloseTab: tabManagementContext.handleCloseTab,
    handleOpenTransfer: tabManagementContext.handleOpenTransfer,
    handleTableAssign: tableAssignmentContext.handleTableAssign,
    handleOpenTableAssignment: tableAssignmentContext.handleOpenTableAssignment,
    handleConfirmMove: tabManagementContext.handleConfirmMove,
    fetchData: globalDataContext.fetchData,
    debouncedFetchData: globalDataContext.debouncedFetchData
  };

  return contextValue;
};