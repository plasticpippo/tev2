import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { OrderItem, Product, ProductVariant } from '../../shared/types';
import * as api from '../services/apiService';
import { useSessionContext } from './SessionContext';
import { useGlobalDataContext } from './GlobalDataContext';

interface OrderContextType {
  orderItems: OrderItem[];
  setOrderItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  isLoadingOrderSession: boolean;
  setIsLoadingOrderSession: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: any; // Using any for now until we define the full Tab type in the TabManagementContext
  setActiveTab: React.Dispatch<React.SetStateAction<any>>;
  handleAddToCart: (variant: ProductVariant, product: Product) => void;
  handleUpdateQuantity: (orderItemId: string, newQuantity: number) => void;
  clearOrder: (logActivity?: boolean) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

interface OrderProviderProps {
  children: React.ReactNode;
}

export const OrderProvider: React.FC<OrderProviderProps> = ({ children }) => {
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [isLoadingOrderSession, setIsLoadingOrderSession] = useState(false);
  const [activeTab, setActiveTab] = useState<any>(null); // Using any temporarily

  const { currentUser } = useSessionContext();
  const { appData } = useGlobalDataContext();

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
  
  const value: OrderContextType = {
    orderItems,
    setOrderItems,
    isLoadingOrderSession,
    setIsLoadingOrderSession,
    activeTab,
    setActiveTab,
    handleAddToCart,
    handleUpdateQuantity,
    clearOrder
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrderContext = () => {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrderContext must be used within an OrderProvider');
  }
  return context;
};