import React, { createContext, useContext, useCallback } from 'react';
import type { OrderItem } from '../../shared/types';
import * as api from '../services/apiService';
import { useSessionContext } from './SessionContext';
import { useOrderContext } from './OrderContext';
import { useGlobalDataContext } from './GlobalDataContext';
import { useTableAssignmentContext } from './TableAssignmentContext';
import { useUIStateContext } from './UIStateContext';

interface PaymentContextType {
  handleConfirmPayment: (paymentMethod: string, tip: number) => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

interface PaymentProviderProps {
  children: React.ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const { currentUser, assignedTillId } = useSessionContext();
  const { orderItems, clearOrder, activeTab } = useOrderContext();
  const { appData, currentTillName } = useGlobalDataContext();
  const { assignedTable } = useTableAssignmentContext();
  const { setIsPaymentModalOpen } = useUIStateContext();

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
        // setAssignedTable(null); // This would be called from TableAssignmentContext
      }
      
      clearOrder(false);
      setIsPaymentModalOpen(false);
    } catch (error) {
      console.error('Payment processing failed:', error);
      alert(error instanceof Error ? error.message : 'Payment processing failed. Please try again or contact support.');
      // Keep the modal open so the user can try again or cancel
    }
 };

  const value: PaymentContextType = {
    handleConfirmPayment
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePaymentContext = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePaymentContext must be used within a PaymentProvider');
  }
  return context;
};