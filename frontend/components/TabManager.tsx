import React, { useState } from 'react';
import type { Tab, OrderItem } from '../../shared/types';
import { VKeyboardInput } from './VKeyboardInput';
import { formatCurrency } from '../utils/formatting';

interface TabManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: Tab[];
  onCreateTab: (name: string) => void;
  onAddToTab: (tabId: number) => void;
 onLoadTab: (tabId: number) => void;
 onCloseTab: (tabId: number) => void;
  onOpenTransfer: (tabId: number) => void;
  currentOrder: OrderItem[];
}

export const TabManager: React.FC<TabManagerProps> = ({ isOpen, onClose, tabs, onCreateTab, onAddToTab, onLoadTab, onCloseTab, onOpenTransfer, currentOrder }) => {
  const [newTabName, setNewTabName] = useState('');

  const handleCreateTab = () => {
    if (newTabName.trim()) {
      onCreateTab(newTabName.trim());
      setNewTabName('');
    }
  };

  if (!isOpen) return null;

  const canAddToTabs = currentOrder.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-lg p-6 border border-slate-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-400">Manage Tabs</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700 transition" aria-label="Close tab manager">&times;</button>
        </div>
        
        <div className="flex-grow overflow-y-auto pb-4">
          <div className="flex gap-2 mb-6">
          <VKeyboardInput
            k-type="full"
            type="text"
            value={newTabName}
            onChange={(e) => setNewTabName(e.target.value)}
            placeholder="New tab name (e.g., 'John D.')"
            className="flex-grow p-3 bg-slate-900 text-white placeholder-slate-400 border border-slate-700 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
          />
          <button
            onClick={handleCreateTab}
            disabled={!newTabName.trim()}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-md transition duration-300 disabled:bg-slate-600"
          >
            Create
          </button>
        </div>

        <h3 className="text-lg font-semibold mb-2 text-slate-300">Open Tabs</h3>
        <div className="overflow-y-auto max-h-80 space-y-2">
          {tabs.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No open tabs.</p>
          ) : (
            [...tabs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(tab => {
              const tabTotal = tab.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
              return (
                <div key={tab.id} className="bg-slate-900 p-3 rounded-md flex flex-col">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold">{tab.name}</p>
                      <p className="text-sm text-slate-400">{formatCurrency(tabTotal)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canAddToTabs ? (
                        <button
                          onClick={() => onAddToTab(tab.id)}
                          className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md text-sm transition"
                        >
                          Add to Tab
                        </button>
                      ) : tab.items.length === 0 ? (
                        <button
                          onClick={() => onCloseTab(tab.id)}
                          className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm transition"
                        >
                          Close Tab
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onOpenTransfer(tab.id)}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-md text-sm transition"
                          >
                            Transfer
                          </button>
                          <button
                            onClick={() => onLoadTab(tab.id)}
                            className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md text-sm transition"
                          >
                            Load Tab
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {tab.tableId && (
                    <div className="flex justify-between items-center text-xs mt-1">
                      <span className="text-green-400">Table: {tab.tableId}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        {!canAddToTabs && tabs.length > 0 && (
             <p className="text-center text-slate-400 text-sm mt-4">Select a tab to load it for editing or payment.</p>
        )}
        </div>
        <div className="pt-4 border-t border-slate-700 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 rounded-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};