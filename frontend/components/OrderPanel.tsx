import React from 'react';
import type { OrderItem, User, Tab, Table } from '../../shared/types';
import { formatCurrency } from '../utils/formatting';

interface OrderPanelProps {
  orderItems: OrderItem[];
  user: User;
  // Fix: Changed productId from number to orderItemId (string) to match the OrderItem type and the handler in App.tsx.
  onUpdateQuantity: (orderItemId: string, newQuantity: number) => void;
 onClearOrder: () => void;
  onPayment: () => void;
  onOpenTabs: () => void;
  onLogout: () => void;
  activeTab: Tab | null;
  onSaveTab: () => void;
  assignedTable: Table | null;
  onOpenTableAssignment: () => void;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({ orderItems, user, onUpdateQuantity, onClearOrder, onPayment, onOpenTabs, onLogout, activeTab, onSaveTab, assignedTable, onOpenTableAssignment }) => {
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="bg-slate-900 text-white rounded-lg p-4 flex flex-col h-full">
      <div className="flex-shrink-0 mb-4">
        <div className="flex justify-between items-center mb-2">
            <div>
                <p className="text-sm text-slate-400">Logged in as:</p>
                <p className="font-bold">{user.name} <span className="text-xs text-amber-400">({user.role})</span></p>
            </div>
            <button onClick={onLogout} className="text-sm bg-red-700 hover:bg-red-600 font-bold py-2 px-3 rounded-md transition">
                Logout
            </button>
        </div>
        {activeTab && (
            <div className="bg-sky-800 p-2 rounded-md my-2 text-center border border-sky-600">
                <p className="font-bold text-sky-200">Editing Tab: {activeTab.name}</p>
            </div>
        )}
        {assignedTable && (
            <div className="bg-green-800 p-2 rounded-md my-2 text-center border border-green-600 flex justify-between items-center">
                <div>
                    <p className="font-bold text-green-200">Table: {assignedTable.name}</p>
                    <p className="text-xs text-green-300">{assignedTable.status.charAt(0).toUpperCase() + assignedTable.status.slice(1)}</p>
                </div>
                <button
                    onClick={onOpenTableAssignment}
                    className="text-xs bg-amber-600 hover:bg-amber-500 font-bold py-1 px-2 rounded-md"
                >
                    Change Table
                </button>
            </div>
        )}
        <h2 className="text-2xl font-bold text-amber-400 border-t border-slate-700 pt-2">Current Order</h2>
      </div>
      
      <div className="flex-grow overflow-y-auto pr-2">
        {orderItems.length === 0 ? (
          <p className="text-slate-500 text-center mt-10">Select products to add them here.</p>
        ) : (
          <div className="space-y-3">
            {orderItems.map(item => (
              <div key={item.id} className="bg-slate-800 p-3 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-slate-400 text-sm">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {/* Fix: item.id is a string, and onUpdateQuantity now correctly accepts it. */}
                  <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center">-</button>
                  <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                  {/* Fix: item.id is a string, and onUpdateQuantity now correctly accepts it. */}
                  <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center">+</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-700 flex-shrink-0 space-y-2">
        {orderItems.length > 0 && (
          <div className="flex justify-between text-xl">
            <span>Subtotal</span>
            <span className="font-bold">{formatCurrency(subtotal)}</span>
          </div>
        )}

        {activeTab ? (
          <>
            <button
              onClick={onSaveTab}
              className="w-full bg-sky-600 hover:bg-sky-500 font-bold py-3 rounded-md transition"
            >
              Save Tab & Start New Order
            </button>
            
            {orderItems.length > 0 && (
              <button onClick={onPayment} className="w-full bg-green-600 hover:bg-green-500 font-bold py-3 rounded-md transition">
                Payment
              </button>
            )}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onOpenTabs}
                className={`w-full bg-sky-700 hover:bg-sky-600 font-bold py-3 rounded-md transition ${orderItems.length === 0 ? 'col-span-2' : ''}`}
              >
                {orderItems.length > 0 ? 'Tabs' : 'View Open Tabs'}
              </button>
              {orderItems.length > 0 && (
                <button onClick={onClearOrder} className="w-full bg-red-700 hover:bg-red-600 font-bold py-3 rounded-md transition">
                  Clear
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              {orderItems.length > 0 && !assignedTable && (
                <button
                  onClick={onOpenTableAssignment}
                  className="w-full bg-amber-600 hover:bg-amber-500 font-bold py-3 rounded-md transition"
                >
                  Assign to Table
                </button>
              )}
              {orderItems.length > 0 && (
                <button
                  onClick={onPayment}
                  className="w-full bg-green-600 hover:bg-green-500 font-bold py-3 rounded-md transition"
                >
                  Payment
                </button>
              )}
            </div>
          </>
        )}
        
        
      </div>
    </div>
  );
};