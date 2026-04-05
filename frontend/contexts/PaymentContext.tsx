import React, { createContext, useContext, useCallback } from 'react';
import { addMoney, subtractMoney, multiplyMoney, divideMoney, roundMoney } from '../utils/money';
import { useTranslation } from 'react-i18next';
import type { OrderItem } from '../../shared/types';
import * as api from '../services/apiService';
import { processPayment } from '../services/transactionService';
import { useSessionContext } from './SessionContext';
import { useOrderContext } from './OrderContext';
import { useGlobalDataContext } from './GlobalDataContext';
import { useTableAssignmentContext } from './TableAssignmentContext';
import { useUIStateContext } from './UIStateContext';

interface PaymentContextType {
  handleConfirmPayment: (paymentMethod: string, tip: number, discount: number, discountReason: string, idempotencyKey: string, issueReceipt?: boolean) => Promise<void>;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

interface PaymentProviderProps {
  children: React.ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const { t } = useTranslation();
  const { currentUser, assignedTillId } = useSessionContext();
  const { orderItems, clearOrder, activeTab } = useOrderContext();
  const { appData, currentTillName } = useGlobalDataContext();
  const { assignedTable, clearTableAssignment } = useTableAssignmentContext();
  const { setIsPaymentModalOpen } = useUIStateContext();

  const handleConfirmPayment = async (paymentMethod: string, tip: number, discount: number, discountReason: string, idempotencyKey: string, issueReceipt?: boolean) => {
    // Check if user is logged in
    if (!currentUser) {
      alert(t('errors.api.auth.authenticationFailed'));
      return;
    }

    // Check if till is assigned before attempting payment
    if (!assignedTillId) {
      alert(t('errors.api.transactions.noTillAssigned'));
      return;
    }

    if (!appData.settings) {
      alert(t('errors.general.loadFailed'));
      return;
    }

    try {
      let subtotal = 0;
      let tax = 0;
      orderItems.forEach(item => {
          // Calculate item total (price * quantity)
          const itemTotal = multiplyMoney(item.price, item.quantity);
          if (appData.settings!.tax.mode === 'inclusive') {
              // In inclusive mode, extract pre-tax price from unit price first
              // then multiply by quantity - this matches backend calculation
              // IMPORTANT: Round the pre-tax unit price to 2 decimal places before
              // multiplying by quantity to follow Italian VAT rounding rules (IVA)
              const preTaxUnitPrice = roundMoney(divideMoney(item.price, 1 + item.effectiveTaxRate));
              const itemSubtotal = multiplyMoney(preTaxUnitPrice, item.quantity);
              const itemTax = subtractMoney(itemTotal, itemSubtotal);
              subtotal = addMoney(subtotal, itemSubtotal);
              tax = addMoney(tax, itemTax);
          } else if (appData.settings!.tax.mode === 'exclusive') {
              subtotal = addMoney(subtotal, itemTotal);
              tax = addMoney(tax, multiplyMoney(itemTotal, item.effectiveTaxRate));
          } else { // 'none'
              subtotal = addMoney(subtotal, itemTotal);
          }
      });

      const totalBeforeDiscount = addMoney(subtotal, tax);
      const total = Math.max(0, addMoney(subtractMoney(totalBeforeDiscount, discount), tip));
      
      // Determine status: if total is 0 and discount was applied, it's complimentary
      const status: 'completed' | 'complimentary' = total === 0 && discount > 0 ? 'complimentary' : 'completed';
      
      // Validate that all items have names before saving transaction
      const validItems = orderItems.filter(item => item.name && item.name.trim() !== '');
      let itemsToSave = orderItems;
      
      if (validItems.length !== orderItems.length) {
        console.warn(t('paymentContext.invalidItemNames'));
        // Fix items without names
        itemsToSave = orderItems.map(item => ({
          ...item,
          name: item.name && item.name.trim() !== '' ? item.name : t('paymentContext.itemFallbackName', { variantId: item.variantId })
        }));
      }
      
    // Use atomic payment processing - handles transaction + stock + session + tab in one call
    // If ANY step fails, ALL changes are rolled back
const result = await processPayment({
      items: itemsToSave,
      subtotal: subtotal,
      tax: tax,
      tip: tip,
      paymentMethod: paymentMethod,
      userId: currentUser.id,
      userName: currentUser.name,
      tillId: assignedTillId,
      tillName: currentTillName,
      discount: discount,
      discountReason: discountReason || undefined,
      activeTabId: activeTab?.id,
      tableId: assignedTable?.id,
      tableName: assignedTable?.name,
      idempotencyKey: idempotencyKey,
      issueReceipt: issueReceipt
    });

    if (result.receipt) {
      const receipt = result.receipt;
      if (receipt.status === 'issued' && receipt.number) {
        alert(t('paymentContext.paymentSuccessWithReceipt', { receiptNumber: receipt.number }));
      } else if (receipt.status === 'pending' || receipt.status === 'queued') {
        alert(t('paymentContext.paymentSuccessReceiptQueued'));
      } else if (receipt.status === 'draft') {
        alert(t('paymentContext.paymentSuccessReceiptDraft'));
      } else {
        alert(t('paymentContext.paymentSuccess'));
      }
    } else if (issueReceipt) {
      alert(t('paymentContext.paymentSuccessReceiptError'));
    } else {
      alert(t('paymentContext.paymentSuccess'));
    }

    if (assignedTable) {
      clearTableAssignment();
    }

    clearOrder(false);
    setIsPaymentModalOpen(false);
    } catch (error) {
      console.error(t('paymentContext.paymentProcessingFailed'), error);
      alert(error instanceof Error ? error.message : t('paymentContext.paymentProcessingFailedMessage'));
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
  const { t } = useTranslation();
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error(t('paymentContext.contextError'));
  }
  return context;
};
