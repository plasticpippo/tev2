import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrderItem, TaxSettings } from '../../shared/types';
import { formatCurrency } from '../utils/formatting';
import { useSessionContext } from '../contexts/SessionContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  taxSettings: TaxSettings;
  onConfirmPayment: (paymentMethod: string, tip: number, discount: number, discountReason: string) => void;
  assignedTable?: { name: string } | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, orderItems, taxSettings, onConfirmPayment, assignedTable }) => {
  const { t } = useTranslation('pos');
  const { currentUser } = useSessionContext();
  const isAdmin = currentUser?.role === 'Admin';
  
  const [tip, setTip] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  
  const { subtotal, tax } = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    
    if (taxSettings.mode === 'none') {
        subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return { subtotal, tax: 0 };
    }

    orderItems.forEach(item => {
        const itemTotal = item.price * item.quantity;
        if (taxSettings.mode === 'inclusive') {
            const itemSubtotal = itemTotal / (1 + item.effectiveTaxRate);
            subtotal += itemSubtotal;
            tax += itemTotal - itemSubtotal;
        } else { // exclusive
            subtotal += itemTotal;
            tax += itemTotal * item.effectiveTaxRate;
        }
    });

    return { subtotal, tax };
  }, [orderItems, taxSettings]);

  if (!isOpen) return null;

  const totalBeforeTip = subtotal + tax;
  const totalAfterDiscount = totalBeforeTip - discount;
  const finalTotal = Math.max(0, totalAfterDiscount + tip);
  
  const handleDiscountChange = (value: number) => {
    // Validate: discount cannot exceed totalBeforeTip
    const maxDiscount = totalBeforeTip;
    setDiscount(Math.min(Math.max(0, value), maxDiscount));
  };

  const isComplimentary = finalTotal === 0 && discount > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md p-6 border border-slate-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-400">{t('payment.title')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700 transition" aria-label={t('payment.close')}>&times;</button>
        </div>
        <div className="flex-grow overflow-y-auto pb-4">
        
        {assignedTable && (
            <div className="mb-4 bg-green-900 p-3 rounded-md border-green-700">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-bold text-green-200">{t('order.tableLabel', { name: assignedTable.name })}</p>
                        <p className="text-sm text-green-300">{t('payment.tablePayment')}</p>
                    </div>
                </div>
            </div>
        )}
        
        {/* Discount Section - Admin Only */}
        {isAdmin && (
          <div className="mb-4 p-3 bg-purple-900/30 border border-purple-700/50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-purple-300 font-semibold">{t('payment.discount')}</label>
              {isComplimentary && (
                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">
                  {t('payment.complimentary')}
                </span>
              )}
            </div>
            <div className="mb-2">
              <label className="block text-slate-400 text-sm mb-1">{t('payment.discountAmount')}</label>
              <div className="flex items-center gap-3">
                <button 
                    onClick={() => handleDiscountChange(discount - 1)} 
                    className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center hover:bg-slate-600 transition"
                    aria-label={t('payment.decreaseDiscount')}
                >
                    -
                </button>
                <span className="w-20 text-center font-bold text-lg text-white">{formatCurrency(discount)}</span>
                <button 
                    onClick={() => handleDiscountChange(discount + 1)} 
                    className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center hover:bg-slate-600 transition"
                    aria-label={t('payment.increaseDiscount')}
                >
                    +
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {t('payment.maxDiscount', { max: formatCurrency(totalBeforeTip) })}
              </p>
            </div>
            {/* Quick Add Buttons */}
            <div className="mb-2">
              <label className="block text-slate-400 text-sm mb-1">{t('payment.quickAdd')}</label>
              <div className="flex gap-2">
                {[10, 20, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleDiscountChange(discount + amount)}
                    className="flex-1 bg-purple-700 hover:bg-purple-600 text-white font-semibold py-2 px-3 rounded-md transition text-sm"
                    aria-label={t('payment.quickAdd') + ` ${amount}`}
                  >
                    {amount}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">{t('payment.discountReason')}</label>
              <input
                type="text"
                value={discountReason}
                onChange={(e) => setDiscountReason(e.target.value)}
                placeholder={t('payment.discountReasonPlaceholder')}
                className="w-full bg-slate-900 p-2 rounded-md border border-slate-700 text-white text-sm"
                maxLength={200}
              />
            </div>
          </div>
        )}

        <div className="mb-4">
            <label className="block text-slate-300 mb-1">{t('payment.tipAmount')}</label>
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setTip(Math.max(0, tip - 1))} 
                    className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center hover:bg-slate-600 transition"
                    aria-label={t('payment.decreaseTip')}
                >
                    -
                </button>
                <span className="w-20 text-center font-bold text-lg text-white">{formatCurrency(tip)}</span>
                <button 
                    onClick={() => setTip(tip + 1)} 
                    className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center hover:bg-slate-600 transition"
                    aria-label={t('payment.increaseTip')}
                >
                    +
                </button>
            </div>
        </div>

        <div className="border-t border-slate-700 pt-4">
            <div className="flex justify-between text-slate-300"><span>{t('cart.subtotal')}</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-slate-300"><span>{t('cart.tax')}</span><span>{formatCurrency(tax)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-purple-400"><span>{t('payment.discount')}</span><span>-{formatCurrency(discount)}</span></div>
            )}
            <div className="flex justify-between text-slate-300"><span>{t('cart.tip')}</span><span>{formatCurrency(tip)}</span></div>
            <div className="flex justify-between text-2xl font-bold mt-2 text-green-400">
              <span>{t('payment.finalTotal')}</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
        </div>
        </div>

        <div className="pt-4 border-t border-slate-700 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={() => onConfirmPayment('Cash', tip, discount, discountReason)}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 text-lg rounded-md transition"
            >
              {t('payment.payWithCash')}
            </button>
            <button
              onClick={() => onConfirmPayment('Card', tip, discount, discountReason)}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 text-lg rounded-md transition"
            >
              {t('payment.payWithCard')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
