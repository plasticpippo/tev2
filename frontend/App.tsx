import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { LoginScreen } from './components/LoginScreen';
import { ProductGrid } from './components/ProductGrid';
import { OrderPanel } from './components/OrderPanel';
import { AdminPanel } from './components/AdminPanel';
import { PaymentModal } from './components/PaymentModal';
import { TabManager } from './components/TabManager';
import { TransferItemsModal } from './components/TransferItemsModal';
import { TillSetupScreen } from './components/TillSetupScreen';
import { VirtualKeyboardProvider } from './components/VirtualKeyboardContext';
import { VirtualKeyboard } from './components/VirtualKeyboard';

import type {
  User, Product, Category, OrderItem, ProductVariant, Settings,
  Transaction, Tab, Till, StockItem, StockAdjustment, OrderActivityLog
} from '../shared/types';
import * as api from './services/apiService';
import { subscribeToUpdates } from './services/apiService';

const App: React.FC = () => {
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
  }>({
    products: [], categories: [], users: [], tills: [], settings: null,
    transactions: [], tabs: [], stockItems: [], stockAdjustments: [], orderActivityLogs: []
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
  const [activeTab, setActiveTab] = useState<Tab | null>(null);

  // Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTabsModalOpen, setIsTabsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferSourceTab, setTransferSourceTab] = useState<Tab | null>(null);

  // --- DATA FETCHING ---
  const fetchData = useCallback(async () => {
    try {
      const [
        products, categories, users, tills, settings, transactions, tabs,
        stockItems, stockAdjustments, orderActivityLogs
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
        api.getOrderActivityLogs()
      ]);
      setAppData({
        products, categories, users, tills, settings, transactions, tabs,
        stockItems, stockAdjustments, orderActivityLogs
      });
    } catch (error) {
      console.error("Failed to fetch initial data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // If no till is assigned, we don't need to load all data, just enough to set up.
    if (!assignedTillId) {
        setIsLoading(false);
        return;
    }
    fetchData();
    const unsubscribe = subscribeToUpdates(fetchData);
    return () => unsubscribe();
  }, [fetchData, assignedTillId]);

  // --- STOCK & PRODUCT COMPUTATIONS ---
  const makableVariantIds = useMemo(() => {
    const stockMap = new Map(appData.stockItems.map(item => [item.id, item.quantity]));
    const makableIds = new Set<number>();
    appData.products.forEach(product => {
      product.variants.forEach(variant => {
        const canMake = variant.stockConsumption.every(
          ({ stockItemId, quantity }) => (stockMap.get(stockItemId) ?? 0) >= quantity
        );
        if (canMake) {
          makableIds.add(variant.id);
        }
      });
    });
    return makableIds;
  }, [appData.stockItems, appData.products]);

  const currentTillName = useMemo(() => {
    if (!assignedTillId) return "Not Configured";
    return appData.tills.find(t => t.id === assignedTillId)?.name || 'Unknown Till';
  }, [assignedTillId, appData.tills]);

  // --- HANDLERS ---
  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    // If an admin logs in to an unassigned till, we now need to fetch all data.
    if (!assignedTillId && user.role === 'Admin') {
        setIsLoading(true);
        await fetchData(); // Fetch all data required for setup
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
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
        details: `${quantityRemoved} x ${itemToUpdate.name}`,
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
      api.saveOrderActivityLog({
        action: 'Order Cleared',
        details: [...orderItems],
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
    const transactionData = {
        items: orderItems, subtotal, tax, tip, total, paymentMethod,
        userId: currentUser.id, userName: currentUser.name,
        tillId: assignedTillId, tillName: currentTillName
    };
    
    await api.saveTransaction(transactionData);
    
    // Decrease stock levels
    const consumptions = new Map<number, number>();
    orderItems.forEach(item => {
      const product = appData.products.find(p => p.id === item.productId);
      const variant = product?.variants.find(v => v.id === item.variantId);
      if (variant) {
        variant.stockConsumption.forEach(sc => {
          const currentQty = consumptions.get(sc.stockItemId) || 0;
          consumptions.set(sc.stockItemId, currentQty + (sc.quantity * item.quantity));
        });
      }
    });
    await api.updateStockLevels(Array.from(consumptions.entries()).map(([stockItemId, quantity]) => ({ stockItemId, quantity })));

    if (activeTab) {
      await api.deleteTab(activeTab.id);
    }
    
    clearOrder(false);
    setIsPaymentModalOpen(false);
  };

  // Tabs Management
  const handleCreateTab = async (name: string) => {
    if (!assignedTillId) return;
    await api.saveTab({ name, items: [], tillId: assignedTillId, tillName: currentTillName, createdAt: new Date().toISOString() });
  };
  
  const handleAddToTab = async (tabId: number) => {
    const tab = appData.tabs.find(t => t.id === tabId);
    if (!tab || orderItems.length === 0) return;
    const updatedItems = [...tab.items];
    orderItems.forEach(orderItem => {
      const existing = updatedItems.find(i => i.variantId === orderItem.variantId);
      if (existing) {
        existing.quantity += orderItem.quantity;
      } else {
        updatedItems.push(orderItem);
      }
    });
    await api.saveTab({ ...tab, items: updatedItems });
    clearOrder(false);
    setIsTabsModalOpen(false);
  };
  
  const handleLoadTab = (tabId: number) => {
    const tab = appData.tabs.find(t => t.id === tabId);
    if (tab) {
      setOrderItems(tab.items);
      setActiveTab(tab);
      setIsTabsModalOpen(false);
    }
  };
  
  const handleSaveTab = async () => {
    if (!activeTab) return;
    await api.saveTab({ ...activeTab, items: orderItems });
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
      if (!transferSourceTab || itemsToMove.length === 0 || !assignedTillId) return;

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
      itemsToMove.forEach(movingItem => {
          const existing = destItems.find(i => i.variantId === movingItem.variantId);
          if (existing) {
              existing.quantity += movingItem.quantity;
          } else {
              destItems.push({ ...movingItem, id: uuidv4() }); // new unique ID for the new tab
          }
      });

      // Remove items from source
      const sourceItems = [...transferSourceTab.items];
      itemsToMove.forEach(movingItem => {
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


  // --- RENDER LOGIC ---
  if (isLoading) {
    return <div className="bg-slate-900 text-white w-screen h-screen flex items-center justify-center">Loading POS...</div>;
  }
  
  if (!assignedTillId && currentUser?.role === 'Admin') {
    return <TillSetupScreen tills={appData.tills} onTillSelect={handleTillSelect} />;
  }
  
  if (!currentUser) {
    return (
      <VirtualKeyboardProvider>
        <LoginScreen onLogin={handleLogin} assignedTillId={assignedTillId} currentTillName={currentTillName} />
        <VirtualKeyboard />
      </VirtualKeyboardProvider>
    );
  }

  if (isAdminPanelOpen && currentUser.role === 'Admin') {
    return (
      <VirtualKeyboardProvider>
        <AdminPanel
          currentUser={currentUser}
          onLogout={handleLogout}
          products={appData.products}
          categories={appData.categories}
          users={appData.users}
          tills={appData.tills}
          settings={appData.settings!}
          transactions={appData.transactions}
          tabs={appData.tabs}
          stockItems={appData.stockItems}
          stockAdjustments={appData.stockAdjustments}
          orderActivityLogs={appData.orderActivityLogs}
          onDataUpdate={fetchData}
          assignedTillId={assignedTillId}
          onAssignDevice={handleAssignDevice}
          onSwitchToPos={() => setIsAdminPanelOpen(false)}
        />
        <VirtualKeyboard />
      </VirtualKeyboardProvider>
    );
  }
  
  return (
    <VirtualKeyboardProvider>
      <div className="w-screen h-screen bg-slate-800 text-white flex flex-col p-4 gap-4">
        {currentUser.role === 'Admin' && (
          <button
            onClick={() => setIsAdminPanelOpen(true)}
            className="absolute top-2 right-2 bg-purple-700 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-md z-30"
          >
            Admin Panel
          </button>
        )}
        <main className="flex-grow flex gap-4 overflow-hidden">
          <div className="w-2/3 h-full">
            <ProductGrid
              products={appData.products}
              categories={appData.categories}
              onAddToCart={handleAddToCart}
              assignedTillId={assignedTillId}
              makableVariantIds={makableVariantIds}
            />
          </div>
          <div className="w-1/3 h-full">
            <OrderPanel
              orderItems={orderItems}
              user={currentUser}
              onUpdateQuantity={handleUpdateQuantity}
              onClearOrder={() => clearOrder(true)}
              onPayment={() => setIsPaymentModalOpen(true)}
              onOpenTabs={() => setIsTabsModalOpen(true)}
              onLogout={handleLogout}
              activeTab={activeTab}
              onSaveTab={handleSaveTab}
            />
          </div>
        </main>
      </div>

      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderItems={orderItems}
        taxSettings={appData.settings!.tax}
        onConfirmPayment={handleConfirmPayment}
      />
      
      <TabManager
        isOpen={isTabsModalOpen}
        onClose={() => setIsTabsModalOpen(false)}
        tabs={appData.tabs}
        onCreateTab={handleCreateTab}
        onAddToTab={handleAddToTab}
        onLoadTab={handleLoadTab}
        onCloseTab={handleCloseTab}
        onOpenTransfer={handleOpenTransfer}
        currentOrder={orderItems}
      />

      <TransferItemsModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        sourceTab={transferSourceTab}
        allTabs={appData.tabs}
        onConfirmMove={handleConfirmMove}
      />
      
      <VirtualKeyboard />
    </VirtualKeyboardProvider>
  );
};

export default App;