import React, { useState, useMemo } from 'react';
import type { OrderItem, TaxSettings } from '../../shared/types';
import { formatCurrency } from '../utils/formatting';
import { PAYMENT_METHODS } from '../../shared/constants';
import { VKeyboardInput } from './VKeyboardInput';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  taxSettings: TaxSettings;
  onConfirmPayment: (paymentMethod: string, tip: number) => void;
  assignedTable?: { name: string } | null;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, orderItems, taxSettings, onConfirmPayment, assignedTable }) => {
  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0]);
  const [tip, setTip] = useState(0);
  
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
  const finalTotal = totalBeforeTip + tip;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-400">Complete Payment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700 transition">&times;</button>
        </div>
        
        {assignedTable && (
            <div className="mb-4 bg-green-900 p-3 rounded-md border border-green-700">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-bold text-green-200">Table: {assignedTable.name}</p>
                        <p className="text-sm text-green-30">Payment for assigned table</p>
                    </div>
                </div>
            </div>
        )}
        <div className="mb-4">
            <label className="block text-slate-300 mb-1">Tip Amount</label>
            <VKeyboardInput
                k-type="numeric"
                type="number"
                value={tip === 0 ? '' : tip}
                onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
                className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md"
                placeholder="0.00"
            />
        </div>

        <div className="border-t border-slate-700 pt-4">
            <div className="flex justify-between text-slate-300"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-slate-300"><span>Tax</span><span>{formatCurrency(tax)}</span></div>
            <div className="flex justify-between text-slate-300"><span>Tip</span><span>{formatCurrency(tip)}</span></div>
            <div className="flex justify-between text-2xl font-bold mt-2 text-green-400"><span>Total</span><span>{formatCurrency(finalTotal)}</span></div>
        </div>
        
        <div className="my-6">
          <h3 className="text-lg font-semibold mb-2 text-slate-300">Payment Method</h3>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map(method => (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                className={`px-4 py-3 rounded-md transition ${selectedMethod === method ? 'bg-amber-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-300'}`}
              >
                {method}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => onConfirmPayment(selectedMethod, tip)}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 text-lg rounded-md transition"
        >
          Confirm Payment for {formatCurrency(finalTotal)}
        </button>
      </div>
    </div>
  );
};