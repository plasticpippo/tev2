import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { OrderItem, TaxSettings, Settings } from '../../shared/types';
import { formatCurrency } from '../utils/formatting';
import { useSessionContext } from '../contexts/SessionContext';
import { isMoneyValid, roundMoney, addMoney, subtractMoney, multiplyMoney, divideMoney } from '../utils/money';
import { generateIdempotencyKey } from '../utils/idempotency';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  taxSettings: TaxSettings;
  settings: Settings | null;
  onConfirmPayment: (paymentMethod: string, tip: number, discount: number, discountReason: string, idempotencyKey: string, issueReceipt?: boolean) => void;
  assignedTable?: { name: string } | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, orderItems, taxSettings, settings, onConfirmPayment, assignedTable }) => {
  const { t } = useTranslation('pos');
  const { currentUser } = useSessionContext();
  const isAdmin = currentUser?.role === 'Admin';

  const [tip, setTip] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [issueReceipt, setIssueReceipt] = useState(false);
  const isProcessingRef = useRef(false);

  const allowReceiptFromPaymentModal = settings?.receiptFromPaymentModal?.allowReceiptFromPaymentModal ?? false;
  const receiptIssueDefaultSelected = settings?.receiptFromPaymentModal?.receiptIssueDefaultSelected ?? false;

  useEffect(() => {
    if (isOpen && allowReceiptFromPaymentModal) {
      setIssueReceipt(receiptIssueDefaultSelected);
    }
  }, [isOpen, allowReceiptFromPaymentModal, receiptIssueDefaultSelected]);
  
  const { subtotal, tax } = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    
    // Filter out invalid items (Issue #24)
    const validItems = orderItems.filter(item => 
        item.price >= 0 && item.quantity > 0 && isMoneyValid(item.price) && isMoneyValid(item.quantity)
    );
    
    if (taxSettings.mode === 'none') {
        subtotal = validItems.reduce((sum, item) => addMoney(sum, multiplyMoney(item.price, item.quantity)), 0);
        return { subtotal, tax: 0 };
    }

    validItems.forEach(item => {
        // Validate effectiveTaxRate (Issue #8)
        const taxRate = isMoneyValid(item.effectiveTaxRate) && item.effectiveTaxRate >= 0 ? item.effectiveTaxRate : 0;
        
        const itemTotal = multiplyMoney(item.price, item.quantity);
        if (taxSettings.mode === 'inclusive') {
            // In inclusive mode, extract pre-tax price from unit price first
            // then multiply by quantity - this matches backend calculation
            // IMPORTANT: Round the pre-tax unit price to 2 decimal places before
            // multiplying by quantity to follow Italian VAT rounding rules (IVA)
            const preTaxUnitPrice = roundMoney(divideMoney(item.price, addMoney(1, taxRate)));
            const itemSubtotal = multiplyMoney(preTaxUnitPrice, item.quantity);
            subtotal = addMoney(subtotal, itemSubtotal);
            tax = addMoney(tax, subtractMoney(itemTotal, itemSubtotal));
        } else if (taxSettings.mode === 'exclusive') {
            // exclusive mode: tax is calculated on top of item price
            subtotal = addMoney(subtotal, itemTotal);
            tax = addMoney(tax, multiplyMoney(itemTotal, taxRate));
        } else {
            // 'none' mode - no tax, just add item total to subtotal
            subtotal = addMoney(subtotal, itemTotal);
        }
    });

    return { subtotal, tax };
  }, [orderItems, taxSettings]);

  if (!isOpen) return null;

  const totalBeforeTip = addMoney(subtotal, tax);
  const totalAfterDiscount = subtractMoney(totalBeforeTip, discount);
  const finalTotal = roundMoney(Math.max(0, addMoney(totalAfterDiscount, tip)));
  
  const handleDiscountChange = (value: number) => {
    // Validate: discount cannot exceed totalBeforeTip
    const maxDiscount = totalBeforeTip;
    setDiscount(Math.min(Math.max(0, value), maxDiscount));
  };

  const isComplimentary = finalTotal === 0 && discount > 0;

  const handlePayment = async (paymentMethod: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const idempotencyKey = generateIdempotencyKey(orderItems);
      await onConfirmPayment(paymentMethod, tip, discount, discountReason, idempotencyKey, allowReceiptFromPaymentModal ? issueReceipt : undefined);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-sm sm:max-w-md p-6 border border-slate-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-400">{t('payment.title')}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl w-11 h-11 min-h-11 min-w-11 flex items-center justify-center rounded-full hover:bg-slate-700 transition" aria-label={t('payment.close')}>&times;</button>
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
className="w-11 h-11 min-h-11 min-w-11 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center hover:bg-slate-600 transition"
aria-label={t('payment.decreaseDiscount')}
>
-
</button>
                <span className="w-20 text-center font-bold text-lg text-white">{formatCurrency(discount)}</span>
<button
onClick={() => handleDiscountChange(discount + 1)}
className="w-11 h-11 min-h-11 min-w-11 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center hover:bg-slate-600 transition"
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
                    className="flex-1 min-h-11 bg-purple-700 hover:bg-purple-600 text-white font-semibold py-2 px-3 rounded-md transition text-sm"
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
className="w-11 h-11 min-h-11 min-w-11 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center hover:bg-slate-600 transition"
aria-label={t('payment.decreaseTip')}
>
-
</button>
                <span className="w-20 text-center font-bold text-lg text-white">{formatCurrency(tip)}</span>
<button
onClick={() => setTip(tip + 1)}
className="w-11 h-11 min-h-11 min-w-11 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center hover:bg-slate-600 transition"
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
        {allowReceiptFromPaymentModal && (
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={issueReceipt}
              onChange={(e) => setIssueReceipt(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-800"
            />
            <span className="text-slate-300 font-medium">{t('payment.issueReceipt')}</span>
          </label>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => handlePayment('Cash')}
            disabled={isProcessing}
            className={`flex-1 ${isProcessing ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'} text-white font-bold py-4 text-lg rounded-md transition flex items-center justify-center gap-2`}
          >
            {isProcessing && (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isProcessing ? (issueReceipt ? t('payment.processingWithReceipt') : t('payment.processingShort')) : t('payment.payWithCash')}
          </button>
          <button
            onClick={() => handlePayment('Card')}
            disabled={isProcessing}
            className={`flex-1 ${isProcessing ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'} text-white font-bold py-4 text-lg rounded-md transition flex items-center justify-center gap-2`}
          >
            {isProcessing && (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isProcessing ? (issueReceipt ? t('payment.processingWithReceipt') : t('payment.processingShort')) : t('payment.payWithCard')}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};
