import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

import type {
  User, Product, Category, OrderItem, ProductVariant, Settings,
  Transaction, Tab, Till, StockItem, StockAdjustment, OrderActivityLog,
  Room, Table
} from '../../shared/types';
import * as api from '../services/apiService';
import { subscribeToUpdates } from '../services/apiBase';
import type { OrderSession } from '../services/apiBase';

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

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Global App State
 const [appData, setAppData] = useState<{
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
  }>({
    products: [], categories: [], users: [], tills: [], settings: null,
    transactions: [], tabs: [], stockItems: [], stockAdjustments: [], orderActivityLogs: [],
    rooms: [], tables: []
  });
  const [isLoading, setIsLoading] = useState(true);

  // Session State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [assignedTillId, setAssignedTillId] = useState<number | null>(() => {
    const savedTill = localStorage.getItem('assignedTillId');
    return savedTill ? parseInt(savedTill, 10) : null;
  });
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Order State
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoadingOrderSession, setIsLoadingOrderSession] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab | null>(null);
  const [assignedTable, setAssignedTable] = useState<Table | null>(null);

  // Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTabsModalOpen, setIsTabsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTableAssignmentModalOpen, setIsTableAssignmentModalOpen] = useState(false);
  const [transferSourceTab, setTransferSourceTab] = useState<Tab | null>(null);

  // Debounce function to prevent rapid API calls
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  const fetchData = useCallback(async () => {
    try {
      const [
        products, categories, users, tills, settings, transactions, tabs,
        stockItems, stockAdjustments, orderActivityLogs, rooms, tables
      ] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getUsers(),
        api.getTills(),
        api.getSettings(),
        api.getTransactions(),
        api.getTabs(),
        api.getStockItems(),
        api.getStockAdjustments(),
        api.getOrderActivityLogs(),
        api.getRooms(),
        api.getTables()
      ]);
      setAppData({
        products, categories, users, tills, settings, transactions, tabs,
        stockItems, stockAdjustments, orderActivityLogs, rooms, tables
      });
    } catch (error) {
      console.error("Failed to fetch initial data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced version of fetchData to prevent multiple rapid calls
 const debouncedFetchData = useCallback(debounce(fetchData, 300), [fetchData]);

  useEffect(() => {
    // If no till is assigned, we don't need to load all data, just enough to set up.
    if (!assignedTillId) {
      setIsLoading(false);
      return;
    }
    fetchData();
    const unsubscribe = subscribeToUpdates(debouncedFetchData);
    return () => unsubscribe();
  }, [fetchData, debouncedFetchData, assignedTillId]);

  // --- STOCK & PRODUCT COMPUTATIONS ---
  const makableVariantIds = useMemo(() => {
    const stockMap = new Map(appData.stockItems.map(item => [item.id, item.quantity]));
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const makableIds = new Set<number>();
    appData.products.forEach(product => {
      product.variants.forEach(variant => {
        // Only consider valid stock consumption records (with proper UUID format and existing stock items)
        const validStockConsumptions = variant.stockConsumption.filter(
          ({ stockItemId }) => uuidRegex.test(stockItemId) && stockMap.has(stockItemId)
        );
        
        // Check if all valid stock consumption requirements can be met
        const canMake = validStockConsumptions.every(
          ({ stockItemId, quantity }) => (stockMap.get(stockItemId) ?? 0) >= quantity
        );
        
        // Only consider the variant makable if all of its valid stock consumption requirements can be met
        // If a variant has invalid stock references, it should not be considered makable
        if (canMake && validStockConsumptions.length === variant.stockConsumption.length) {
          makableIds.add(variant.id);
        } else if (validStockConsumptions.length < variant.stockConsumption.length) {
          // Log warning for variants with invalid stock references
          const invalidRefs = variant.stockConsumption.filter(
            ({ stockItemId }) => !uuidRegex.test(stockItemId) || !stockMap.has(stockItemId)
          );
          console.warn(`Variant ${variant.id} (${product.name} - ${variant.name}) has invalid stock references:`,
                       invalidRefs.map(ref => ref.stockItemId));
        }
      });
    });
    return makableIds;
 }, [appData.stockItems, appData.products]);

  const currentTillName = useMemo(() => {
    if (!assignedTillId) return "Not Configured";
    return appData.tills.find(t => t.id === assignedTillId)?.name || 'Unknown Till';
  }, [assignedTillId, appData.tills]);

  // --- ORDER SESSION MANAGEMENT ---
  // Load order session when user logs in
  useEffect(() => {
    const loadOrderSession = async () => {
      if (currentUser) {
        setIsLoadingOrderSession(true);
        try {
          const session = await api.getOrderSession();
          if (session && session.items) {
            setOrderItems(session.items);
          } else {
            // If no active session exists, start with empty order
            setOrderItems([]);
          }
        } catch (error) {
          console.error('Failed to load order session:', error);
          // Start with empty order if session loading fails
          setOrderItems([]);
        } finally {
          setIsLoadingOrderSession(false);
        }
      } else {
        // If no user is logged in, ensure order items are cleared
        setOrderItems([]);
        setIsLoadingOrderSession(false);
      }
    };

    loadOrderSession();
  }, [currentUser]);

    // Save order session whenever orderItems change (with debounce)
    useEffect(() => {
      if (!currentUser || isLoadingOrderSession) {
        return; // Don't save if no user or still loading
      }

      // Only save if we have actual order items
      if (orderItems && orderItems.length > 0) {
        const saveSession = async () => {
          const result = await api.saveOrderSession(orderItems);
          if (!result) {
            console.warn('Order session save failed or user not authenticated');
          }
        };

        // Debounce the save operation to avoid too many API calls
        const timeoutId = setTimeout(saveSession, 500);
        return () => clearTimeout(timeoutId);
      } else if (orderItems && orderItems.length === 0) {
        // If we have no order items but a user is logged in, clear any existing session
        // This prevents creating empty sessions on initialization
        api.saveOrderSession(orderItems).then(result => {
          if (!result) {
            console.warn('Empty order session save failed or user not authenticated');
          }
        }).catch(error => {
          console.error('Failed to save empty order session:', error);
        });
      }
    }, [orderItems, currentUser, isLoadingOrderSession]);

  // --- HANDLERS ---
  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    // User is already stored in localStorage by the login API function
    // If an admin logs in to an unassigned till, we now need to fetch all data.
    if (!assignedTillId && user.role === 'Admin') {
        setIsLoading(true);
        await fetchData(); // Fetch all data required for setup
    }
 };

   const handleLogout = async () => {
     if (currentUser) {
       try {
         const result = await api.updateOrderSessionStatus('logout');
         if (!result) {
           console.warn('Order session logout status update failed or user not authenticated');
         }
       } catch (error) {
         console.error('Failed to update order session status on logout:', error);
       }
     }
     setCurrentUser(null);
     // Clear stored user from localStorage using API service
     await api.logout();
     setIsAdminPanelOpen(false);
     clearOrder(false); // don't log on logout
   };
  
  const handleTillSelect = (tillId: number) => {
      localStorage.setItem('assignedTillId', String(tillId));
      setAssignedTillId(tillId);
      // If the user is an admin, the data is already loaded, so we don't need to show loading.
      if (currentUser?.role === 'Admin') {
          setIsAdminPanelOpen(true);
      } else {
        // This case is for future use; currently, only admins can select a till.
      }
  };


  const handleAssignDevice = (tillId: number) => {
    localStorage.setItem('assignedTillId', String(tillId));
    setAssignedTillId(tillId);
    // Log the user out and return to the login screen to reflect the change,
    // avoiding a full page reload which can cause a blank screen flicker.
    setCurrentUser(null);
    // Clear stored user from localStorage using API service
    api.logout();
    setIsAdminPanelOpen(false);
    clearOrder(false); // Also clear any transient order state
  };

  // Order Management
  const handleAddToCart = (variant: ProductVariant, product: Product) => {
    const existingItem = orderItems.find(item => item.variantId === variant.id);
    if (existingItem) {
      handleUpdateQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const newOrderItem: OrderItem = {
        id: uuidv4(),
        variantId: variant.id,
        productId: product.id,
        name: `${product.name} - ${variant.name}`,
        price: variant.price,
        quantity: 1,
        effectiveTaxRate: 0.19, // Example tax rate, would be better to store this per product
      };
      // Ensure the name is not empty or undefined
      if (!newOrderItem.name || newOrderItem.name.trim() === '') {
        newOrderItem.name = `Item ${newOrderItem.variantId}`;
      }
      setOrderItems([...orderItems, newOrderItem]);
    }
  };

  const handleUpdateQuantity = (orderItemId: string, newQuantity: number) => {
    const itemToUpdate = orderItems.find(item => item.id === orderItemId);
    if (!itemToUpdate || !currentUser) return;

    const oldQuantity = itemToUpdate.quantity;

    // Log if quantity is decreased
    if (newQuantity < oldQuantity) {
      const quantityRemoved = oldQuantity - newQuantity;
      api.saveOrderActivityLog({
        action: 'Item Removed',
        details: `${quantityRemoved} x ${itemToUpdate.name || `Item ${itemToUpdate.variantId}`}`,
        userId: currentUser.id,
        userName: currentUser.name,
      });
    }

    // Update the state
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter(item => item.id !== orderItemId));
    } else {
      setOrderItems(orderItems.map(item =>
        item.id === orderItemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };
  
  const clearOrder = (logActivity: boolean = true) => {
    if (logActivity && orderItems.length > 0 && currentUser) {
      // Fix items without names before logging
      const correctedItems = orderItems.map(item => ({
        ...item,
        name: item.name && item.name.trim() !== '' ? item.name : `Item ${item.variantId}`
      }));
      api.saveOrderActivityLog({
        action: 'Order Cleared',
        details: correctedItems,
        userId: currentUser.id,
        userName: currentUser.name,
      });
    }
    setOrderItems([]);
    setActiveTab(null);
  };
  
  // Payment
  const handleConfirmPayment = async (paymentMethod: string, tip: number) => {
    if (!currentUser || !assignedTillId || !appData.settings) return;

    try {
      let subtotal = 0;
      let tax = 0;
      orderItems.forEach(item => {
          const itemTotal = item.price * item.quantity;
          if (appData.settings!.tax.mode === 'inclusive') {
              const itemSubtotal = itemTotal / (1 + item.effectiveTaxRate);
              subtotal += itemSubtotal;
              tax += itemTotal - itemSubtotal;
          } else if (appData.settings!.tax.mode === 'exclusive') {
              subtotal += itemTotal;
              tax += itemTotal * item.effectiveTaxRate;
          } else { // 'none'
              subtotal += itemTotal;
          }
      });

      const total = subtotal + tax + tip;
      
      // Validate that all items have names before saving transaction
      const validItems = orderItems.filter(item => item.name && item.name.trim() !== '');
      if (validItems.length !== orderItems.length) {
        console.warn('Some items have invalid names, correcting them before saving transaction');
        // Fix items without names
        const correctedItems = orderItems.map(item => ({
          ...item,
          name: item.name && item.name.trim() !== '' ? item.name : `Item ${item.variantId}`
        }));
        const transactionData = {
          items: correctedItems,
          subtotal: subtotal,
          tax: tax,
          tip: tip,
          total: total,
          paymentMethod: paymentMethod,
          userId: currentUser.id,
          userName: currentUser.name,
          tillId: assignedTillId,
          tillName: currentTillName,
          tableId: assignedTable?.id, // Include table ID if available
          tableName: assignedTable?.name // Include table name for reference
        };
        
        await api.saveTransaction(transactionData);
      } else {
        const transactionData = {
          items: orderItems,
          subtotal: subtotal,
          tax: tax,
          tip: tip,
          total: total,
          paymentMethod: paymentMethod,
          userId: currentUser.id,
          userName: currentUser.name,
          tillId: assignedTillId,
          tillName: currentTillName,
          tableId: assignedTable?.id, // Include table ID if available
          tableName: assignedTable?.name // Include table name for reference
        };
        
        await api.saveTransaction(transactionData);
      }
      
      // Decrease stock levels
      const consumptions = new Map<string, number>();
      orderItems.forEach(item => {
        const product = appData.products.find(p => p.id === item.productId);
        const variant = product?.variants.find(v => v.id === item.variantId);
        if (variant) {
          variant.stockConsumption.forEach(sc => {
            // Validate that the stockItemId is a proper UUID format and exists in our stockItems data
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            const isUUIDFormat = uuidRegex.test(sc.stockItemId);
            const stockItemExists = appData.stockItems.some(stockItem => stockItem.id === sc.stockItemId);
            
            if (isUUIDFormat && stockItemExists) {
              const currentQty = consumptions.get(sc.stockItemId) || 0;
              consumptions.set(sc.stockItemId, currentQty + (sc.quantity * item.quantity));
            } else {
              let warningMsg = `Invalid stock item reference in variant ${variant.id}: ${sc.stockItemId}`;
              if (!isUUIDFormat) {
                warningMsg += " (Invalid UUID format)";
              }
              if (!stockItemExists) {
                warningMsg += " (Stock item does not exist)";
              }
              console.warn(warningMsg);
            }
          });
        }
      });
      if (consumptions.size > 0) {
        await api.updateStockLevels(Array.from(consumptions.entries()).map(([stockItemId, quantity]) => ({ stockItemId, quantity })));
      }

      if (activeTab) {
        await api.deleteTab(activeTab.id);
      }
      
      // Update order session status to completed
      try {
        const result = await api.updateOrderSessionStatus('complete');
        if (!result) {
          console.warn('Order session complete status update failed or user not authenticated');
        }
      } catch (error) {
        console.error('Failed to update order session status on payment completion:', error);
      }
      
      // Update table status to available after payment
      if (assignedTable) {
        await api.saveTable({ ...assignedTable, status: 'available' });
        setAssignedTable(null);
      }
      
      clearOrder(false);
      setIsPaymentModalOpen(false);
    } catch (error) {
      console.error('Payment processing failed:', error);
      alert(error instanceof Error ? error.message : 'Payment processing failed. Please try again or contact support.');
      // Keep the modal open so the user can try again or cancel
    }
  };

  // Tabs Management
  const handleCreateTab = async (name: string) => {
     if (!assignedTillId) return;
     await api.saveTab({ name, items: [], tillId: assignedTillId, tillName: currentTillName, createdAt: new Date().toISOString(), tableId: assignedTable?.id });
  };
  
  const handleAddToTab = async (tabId: number) => {
     const tab = appData.tabs.find(t => t.id === tabId);
     if (!tab || orderItems.length === 0) return;
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

  const handleTableAssign = async (tableId: string) => {
    if (tableId) {
      const table = appData.tables.find(t => t.id === tableId);
      if (table) {
        setAssignedTable(table);
        
        // If there's an active tab, update it with the new table assignment
        if (activeTab) {
          await api.saveTab({ ...activeTab, tableId });
        }
      }
    } else {
      // Clear table assignment
      setAssignedTable(null);
      if (activeTab) {
        await api.saveTab({ ...activeTab, tableId: undefined });
      }
    }
  };

  const handleOpenTableAssignment = () => {
    setIsTableAssignmentModalOpen(true);
  };

  const handleConfirmMove = async (
    destination: { type: 'existing', id: number } | { type: 'new', name: string },
    itemsToMove: OrderItem[]
  ) => {
    console.log('App: handleConfirmMove called');
    console.log('App: destination', destination);
    console.log('App: itemsToMove', itemsToMove);
    console.log('App: transferSourceTab', transferSourceTab);
      if (!transferSourceTab || itemsToMove.length === 0 || !assignedTillId) return;

      // Fix items without names before moving
      const correctedItemsToMove = itemsToMove.map(item => ({
        ...item,
        name: item.name && item.name.trim() !== '' ? item.name : `Item ${item.variantId}`
      }));

      let destTab: Tab;
      if (destination.type === 'new') {
          destTab = await api.saveTab({ name: destination.name, items: [], tillId: assignedTillId, tillName: currentTillName, createdAt: new Date().toISOString() });
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

  const value: AppContextType = {
    // State
    appData,
    isLoading,
    setIsLoading,
    currentUser,
    setCurrentUser,
    assignedTillId,
    setAssignedTillId,
    isAdminPanelOpen,
    setIsAdminPanelOpen,
    orderItems,
    setOrderItems,
    isLoadingOrderSession,
    setIsLoadingOrderSession,
    activeTab,
    setActiveTab,
    assignedTable,
    setAssignedTable,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isTabsModalOpen,
    setIsTabsModalOpen,
    isTransferModalOpen,
    setIsTransferModalOpen,
    isTableAssignmentModalOpen,
    setIsTableAssignmentModalOpen,
    transferSourceTab,
    setTransferSourceTab,
    
    // Computed values
    makableVariantIds,
    currentTillName,
    
    // Handlers
    handleLogin,
    handleLogout,
    handleTillSelect,
    handleAssignDevice,
    handleAddToCart,
    handleUpdateQuantity,
    clearOrder,
    handleConfirmPayment,
    handleCreateTab,
    handleAddToTab,
    handleLoadTab,
    handleSaveTab,
    handleCloseTab,
    handleOpenTransfer,
    handleTableAssign,
    handleOpenTableAssignment,
    handleConfirmMove,
    fetchData,
    debouncedFetchData
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};