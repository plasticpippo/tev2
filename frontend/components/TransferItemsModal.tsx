import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
  // All hooks must be called before any early returns - React rules of hooks
  const [transferQuantities, setTransferQuantities] = useState<Record<string, number>>({}); // orderItem.id -> quantity to move
  const [destination, setDestination] = useState<Destination>(null);
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

  // Calculate total items to move - using useMemo to ensure it's recalculated when transferQuantities changes
  const totalItemsToMove = useMemo(() =>
    Object.values(transferQuantities).reduce((sum: number, qty: number) => sum + qty, 0)
  , [transferQuantities]);

  // Early return after all hooks are called - this is the correct pattern
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

  const isMoveDisabled = !destination || (destination.type === 'new' && (!newTabName.trim() || totalItemsToMove === 0)) || (destination.type === 'existing' && totalItemsToMove === 0);

  // Get the currently selected tab name for display
  const selectedTabName = destination?.type === 'existing'
    ? destinationTabs.find(tab => tab.id === destination.id)?.name
    : null;

  // Helper function to get item display name
  const getItemDisplayName = (item: OrderItem): string => {
    return item.name || `${t('transferItemsModal.item')} ${item.variantId}`;
  };

    return (
      <div className="fixed inset-0 bg-slate-900 bg-opacity-70 flex items-center justify-center z-50 p-6">
       <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md sm:max-w-3xl max-h-[90vh] flex flex-col border border-slate-700">
        <div className="p-6 flex-shrink-0">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-amber-500">{t('transferItemsModal.title')}</h2>
                    <p className="text-base text-slate-300">{t('transferItemsModal.fromTab')} <span className="font-semibold text-white">{sourceTab.name}</span></p>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition duration-200" aria-label={t('transferItemsModal.close')}>&times;</button>
            </div>
        </div>

        <div className="p-6 space-y-4 flex-grow overflow-y-auto">
            <div>
                <h3 className="text-lg font-semibold mb-3 text-slate-300">{t('transferItemsModal.selectItemQuantities')}</h3>
                <div className="bg-slate-900 rounded-md max-h-72 overflow-y-auto p-3 space-y-3">
                    {sourceTab.items.length === 0 ? (
                        <p className="text-slate-400 text-center p-4">{t('transferItemsModal.noItemsInTab')}</p>
                    ) : (
                        sourceTab.items.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-slate-800 p-3 rounded-md">
                                <div>
                                    <span className="font-semibold text-base text-white">{getItemDisplayName(item)}</span>
                                    <span className="text-sm text-slate-400 ml-2">{t('transferItemsModal.outOf', { quantity: item.quantity })}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleQuantityChange(item.id, -1)}
                                    disabled={(transferQuantities[item.id] || 0) === 0}
                                    className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition duration-200"
                                    aria-label={t('transferItemsModal.decreaseQuantity', { itemName: getItemDisplayName(item) })}
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-bold text-xl text-white">{transferQuantities[item.id] || 0}</span>
                                  <button
                                    onClick={() => handleQuantityChange(item.id, 1)}
                                    disabled={(transferQuantities[item.id] || 0) >= item.quantity}
                                    className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition duration-200"
                                    aria-label={t('transferItemsModal.increaseQuantity', { itemName: getItemDisplayName(item) })}
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
                <h3 className="text-lg font-semibold mb-3 text-slate-300">{t('transferItemsModal.chooseDestination')}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {destinationTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setDestination({ type: 'existing', id: tab.id })}
                            className={`p-3 rounded-md font-semibold text-base truncate transition duration-200 text-white ${destination?.type === 'existing' && destination.id === tab.id ? 'bg-amber-500 ring-2 ring-amber-400 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800' : 'bg-slate-700 hover:bg-slate-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800'}`}
                            aria-label={t('transferItemsModal.selectDestinationTab', { tabName: tab.name })}
                        >
                            {tab.name}
                        </button>
                    ))}
                    <button
                        onClick={() => setDestination({ type: 'new' })}
                        className={`p-3 rounded-md font-semibold text-base transition duration-200 text-white ${destination?.type === 'new' ? 'bg-amber-500 ring-2 ring-amber-400 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800' : 'bg-slate-700 hover:bg-slate-600 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800'}`}
                        aria-label={t('transferItemsModal.createNewTab')}
                    >
                        {t('transferItemsModal.newTab')}
                    </button>
                </div>
                {destination?.type === 'new' && (
                    <div className="mt-6">
                        <VKeyboardInput
                            k-type="full"
                            type="text"
                            value={newTabName}
                            onChange={(e) => setNewTabName(e.target.value)}
                            placeholder={t('transferItemsModal.enterNewTabName')}
                            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md text-white placeholder-slate-400"
                            style={{ color: '#ffffff', backgroundColor: '#0f172a' }}
                            autoFocus
                            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                                // If Enter key is pressed, confirm the transfer
                                if (e.key === 'Enter') {
                                    handleConfirm();
                                }
                            }}
                        />
                        {newTabName && (
                            <div className="mt-3 flex justify-end">
                                <button
                                    onClick={handleConfirm}
                                    disabled={destination?.type === 'new' && !newTabName.trim()}
                                    className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-md disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-base focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition duration-200"
                                >
                                    {t('transferItemsModal.confirmTabName')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
                {destination?.type === 'existing' && selectedTabName && (
                  <p className="mt-3 text-slate-300 text-sm">
                    {t('transferItemsModal.selected')} <span className="text-amber-500 font-semibold">{selectedTabName}</span>
                  </p>
                )}
            </div>
          </div>
        
        <div className="flex justify-end gap-4 p-6 border-t border-slate-700 flex-shrink-0">
          <button onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-6 rounded-md text-base focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition duration-200">{t('transferItemsModal.cancel')}</button>
          <button
              onClick={handleConfirm}
              disabled={isMoveDisabled}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-md disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-base focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition duration-200"
            >
              {t('transferItemsModal.moveItems', { count: totalItemsToMove })}
            </button>
        </div>
      </div>
    </div>
  );
};
