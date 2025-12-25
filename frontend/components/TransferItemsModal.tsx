import React, { useState, useMemo, useEffect } from 'react';
import type { Tab, OrderItem } from '@shared/types';
import { VKeyboardInput } from './VKeyboardInput';

// Define destination types more clearly
type ExistingDestination = { type: 'existing'; id: number };
type NewDestination = { type: 'new' };
type Destination = ExistingDestination | NewDestination | null;

interface TransferItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTab: Tab | null;
  allTabs: Tab[];
  onConfirmMove: (destination: { type: 'existing', id: number } | { type: 'new', name: string }, itemsToMove: OrderItem[]) => void;
}

export const TransferItemsModal: React.FC<TransferItemsModalProps> = ({ isOpen, onClose, sourceTab, allTabs, onConfirmMove }) => {
  // Early return before any hooks are called - this was the original issue
  if (!isOpen || !sourceTab) return null;

  const [transferQuantities, setTransferQuantities] = useState<Record<string, number>>({}); // orderItem.id -> quantity to move
  const [destination, setDestination] = useState<Destination>(null);
 const [newTabName, setNewTabName] = useState('');

 const destinationTabs = useMemo(() => {
   // This hook will always be called in the same order now
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
   console.log('TransferItemsModal: handleConfirm called');
   console.log('TransferItemsModal: destination', destination);
   console.log('TransferItemsModal: newTabName', newTabName);
   console.log('TransferItemsModal: transferQuantities', transferQuantities);
   
   // Create items to move based on selected quantities
   const itemsToMove: OrderItem[] = [];
   
   Object.entries(transferQuantities).forEach(([orderItemId, quantity]) => {
     if (quantity > 0) {
       const sourceItem = sourceTab.items.find(item => item.id === orderItemId);
       if (sourceItem) {
         // Create a new item with the specified quantity
         itemsToMove.push({ ...sourceItem, quantity });
       }
     }
   });

   console.log('TransferItemsModal: itemsToMove', itemsToMove);

   if (!destination) {
     console.log('TransferItemsModal: Early return - no destination');
     return;
   }

   // Only validate items exist if we're actually trying to move items
   // If the user just wants to close the modal, they can click Cancel
   if (itemsToMove.length === 0) {
     console.log('TransferItemsModal: Early return - no items to move');
     return;
   }

   if (destination.type === 'new') {
     console.log('TransferItemsModal: Creating new tab with name:', newTabName.trim());
     if (!newTabName.trim()) {
       console.log('TransferItemsModal: New tab name is empty, returning');
       return;
     }
     onConfirmMove({ type: 'new', name: newTabName.trim() }, itemsToMove);
   } else {
     console.log('TransferItemsModal: Using existing tab with id:', destination.id);
     onConfirmMove({ type: 'existing', id: destination.id }, itemsToMove);
   }
 };
  
 // Calculate total items to move - using useMemo to ensure it's recalculated when transferQuantities changes
 const totalItemsToMove = useMemo(() =>
   Object.values(transferQuantities).reduce((sum: number, qty: number) => sum + qty, 0)
 , [transferQuantities]);

 const isMoveDisabled = !destination || (destination.type === 'new' && (!newTabName.trim() || totalItemsToMove === 0)) || (destination.type === 'existing' && totalItemsToMove === 0);

 // Get the currently selected tab name for display
 const selectedTabName = destination?.type === 'existing'
   ? destinationTabs.find(tab => tab.id === destination.id)?.name
   : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700">
        <div className="p-6 pb-4 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-amber-400">Transfer Items</h2>
                    <p className="text-slate-300">From tab: <span className="font-semibold text-white">{sourceTab.name}</span></p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700 transition" aria-label="Close">&times;</button>
            </div>
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
                                    <span className="font-semibold">{item.name || `Item ${item.variantId}`}</span>
                                    <span className="text-sm text-slate-400 ml-2">(out of {item.quantity})</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleQuantityChange(item.id, -1)}
                                    disabled={(transferQuantities[item.id] || 0) === 0}
                                    className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center disabled:opacity-50"
                                    aria-label={`Decrease quantity of ${item.name || `Item ${item.variantId}`}`}
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-bold text-lg">{transferQuantities[item.id] || 0}</span>
                                  <button
                                    onClick={() => handleQuantityChange(item.id, 1)}
                                    disabled={(transferQuantities[item.id] || 0) >= item.quantity}
                                    className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center disabled:opacity-50"
                                    aria-label={`Increase quantity of ${item.name || `Item ${item.variantId}`}`}
                                  >
                                    +
                                  </button>
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
                            aria-label={`Select destination tab: ${tab.name}`}
                        >
                            {tab.name}
                        </button>
                    ))}
                    <button
                        onClick={() => setDestination({ type: 'new' })}
                        className={`p-3 rounded-md transition font-semibold ${destination?.type === 'new' ? 'bg-amber-500 text-white ring-2 ring-amber-300' : 'bg-slate-700 hover:bg-slate-500'}`}
                        aria-label="Create new tab"
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
                            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                // If Enter key is pressed, confirm the transfer
                                if (e.key === 'Enter') {
                                    handleConfirm();
                                }
                            }}
                        />
                        {newTabName && (
                            <div className="mt-2 flex justify-end">
                                <button
                                    onClick={handleConfirm}
                                    disabled={destination?.type === 'new' && !newTabName.trim()}
                                    className="bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 px-4 rounded-md disabled:bg-slate-700 disabled:cursor-not-allowed text-sm"
                                >
                                    Confirm Tab Name
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {destination?.type === 'existing' && selectedTabName && (
                  <p className="mt-2 text-slate-300 text-sm">
                    Selected: <span className="text-amber-400 font-semibold">{selectedTabName}</span>
                  </p>
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
              Move Items ({totalItemsToMove})
            </button>
        </div>
      </div>
    </div>
  );
};