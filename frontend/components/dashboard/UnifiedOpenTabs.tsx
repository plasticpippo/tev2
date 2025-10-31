import React from 'react';
import type { Tab } from '../../../shared/types';
import { formatCurrency } from '../../utils/formatting';

export const UnifiedOpenTabs: React.FC<{ tabs: Tab[] }> = ({ tabs }) => {
    return (
        <div className="bg-slate-900 p-4 rounded-lg flex flex-col h-full">
            <h2 className="text-xl font-bold text-slate-300 mb-3 flex-shrink-0">All Open Tabs</h2>
            <div className="flex-grow overflow-y-auto pr-2">
                {tabs.length === 0 ? (
                    <p className="text-center text-slate-500 pt-8">No open tabs across all tills.</p>
                ) : (
                    <div className="space-y-2">
                         {[...tabs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(tab => {
                             const tabTotal = tab.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                             return (
                                <div key={tab.id} className="bg-slate-800 p-3 rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-bold">{tab.name}</p>
                                        <p className="text-sm text-slate-400">on {tab.tillName}</p>
                                    </div>
                                    <p className="font-semibold text-lg text-amber-400">{formatCurrency(tabTotal)}</p>
                                </div>
                             );
                         })}
                    </div>
                )}
            </div>
        </div>
    );
};