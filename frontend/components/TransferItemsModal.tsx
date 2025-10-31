import React, { useState, useMemo, useEffect } from 'react';
import type { Tab, OrderItem } from '../../shared/types';
import { VKeyboardInput } from './VKeyboardInput';

interface TransferItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTab: Tab | null;
  allTabs: Tab[];
  onConfirmMove: (destination: { type: 'existing', id: number } | { type: 'new', name: string }, itemsToMove: OrderItem[]) => void;
}

export const TransferItemsModal: React.FC<TransferItemsModalProps> = ({ isOpen, onClose, sourceTab, allTabs, onConfirmMove }) => {
  const [transferQuantities, setTransferQuantities] = useState<Record<string, number>>({}); // product.id -> quantity to move
  const [destination, setDestination] = useState<{ type: 'existing'; id: number } | { type: 'new' } | null>(null);
  const [newTabName, setNewTabName] = useState('');

  const destinationTabs = useMemo(() => {
    if (!sourceTab) return [];
    return allTabs.filter(t => t.id !== sourceTab.id);
  }, [allTabs, sourceTab]);

  // Reset state when the modal is opened for a new tab
  useEffect(() => {
    if (isOpen) {
      setTransferQuantities({});
      setNewTabName('');
      setDestination(null);
    }
  }, [isOpen, sourceTab]);

  if (!isOpen || !sourceTab) return null;

  const handleQuantityChange = (orderItemId: string, change: number) => {
    const sourceItem = sourceTab.items.find(item => item.id === orderItemId);
    if (!sourceItem) return;

    const existingQty = transferQuantities[orderItemId];
    const currentQty = typeof existingQty === 'number' ? existingQty : 0;
    const newQty = currentQty + change;

    if (newQty >= 0 && newQty <= sourceItem.quantity) {
      setTransferQuantities(prev => ({ ...prev, [orderItemId]: newQty }));
    }
  };

  const handleConfirm = () => {
    const itemsToMove = Object.entries(transferQuantities)
      .filter(([, quantity]: [string, number]) => quantity > 0)
      .map(([productId, quantity]: [string, number]) => {
        const sourceItem = sourceTab.items.find(item => item.id === productId);
        return { ...sourceItem!, quantity: quantity };
      });

    if (itemsToMove.length === 0 || !destination) return;

    if (destination.type === 'new') {
      if (!newTabName.trim()) return;
      onConfirmMove({ type: 'new', name: newTabName.trim() }, itemsToMove);
    } else {
      onConfirmMove({ type: 'existing', id: destination.id }, itemsToMove);
    }
  };
  
  // Fix: Explicitly typed the accumulator and value of the `reduce` function to ensure that `totalItemsToMove` is correctly inferred as a number, resolving type errors.
  const totalItemsToMove = Object.values(transferQuantities).reduce((sum: number, qty: number) => sum + qty, 0);
  const isMoveDisabled = totalItemsToMove === 0 || !destination || (destination.type === 'new' && !newTabName.trim());

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700">
        <div className="p-6 pb-4 flex-shrink-0">
            <h2 className="text-2xl font-bold text-amber-400">Transfer Items</h2>
            <p className="text-slate-400">From tab: <span className="font-semibold text-white">{sourceTab.name}</span></p>
        </div>

        <div className="px-6 space-y-4 flex-grow overflow-y-auto">
            <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-300">1. Select Item Quantities to Move</h3>
                <div className="bg-slate-900 rounded-md max-h-60 overflow-y-auto p-2 space-y-2">
                    {sourceTab.items.length === 0 ? (
                        <p className="text-slate-500 text-center p-4">This tab has no items.</p>
                    ) : (
                        sourceTab.items.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                                <div>
                                    <span className="font-semibold">{item.name}</span>
                                    <span className="text-sm text-slate-400 ml-2">(out of {item.quantity})</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button onClick={() => handleQuantityChange(item.id, -1)} disabled={(transferQuantities[item.id] || 0) === 0} className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center disabled:opacity-50">-</button>
                                  <span className="w-8 text-center font-bold text-lg">{transferQuantities[item.id] || 0}</span>
                                  <button onClick={() => handleQuantityChange(item.id, 1)} disabled={(transferQuantities[item.id] || 0) >= item.quantity} className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center disabled:opacity-50">+</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-2 text-slate-300">2. Choose Destination</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {destinationTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setDestination({ type: 'existing', id: tab.id })}
                            className={`p-3 rounded-md transition font-semibold truncate ${destination?.type === 'existing' && destination.id === tab.id ? 'bg-amber-500 text-white ring-2 ring-amber-300' : 'bg-slate-700 hover:bg-slate-600'}`}
                        >
                            {tab.name}
                        </button>
                    ))}
                    <button
                        onClick={() => setDestination({ type: 'new' })}
                        className={`p-3 rounded-md transition font-semibold ${destination?.type === 'new' ? 'bg-amber-500 text-white ring-2 ring-amber-300' : 'bg-slate-700 hover:bg-slate-500'}`}
                    >
                        + New Tab
                    </button>
                </div>
                {destination?.type === 'new' && (
                    <div className="mt-4">
                        <VKeyboardInput
                            k-type="full"
                            type="text"
                            value={newTabName}
                            onChange={(e) => setNewTabName(e.target.value)}
                            placeholder="Enter new tab name..."
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md"
                            autoFocus
                        />
                    </div>
                )}
            </div>
        </div>
        
        <div className="flex justify-end gap-2 p-6 pt-4 border-t border-slate-700 flex-shrink-0">
          <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-6 rounded-md">Cancel</button>
          <button 
            onClick={handleConfirm}
            disabled={isMoveDisabled}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-md disabled:bg-slate-700 disabled:cursor-not-allowed"
          >
            Move {totalItemsToMove > 0 ? `${totalItemsToMove} Item(s)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};