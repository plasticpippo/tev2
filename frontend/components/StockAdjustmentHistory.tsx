import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { StockAdjustment } from '@shared/types';
import { formatDate } from '../utils/formatting';
import { VKeyboardInput } from './VKeyboardInput';

export const StockAdjustmentHistory: React.FC<{ adjustments: StockAdjustment[] }> = ({ adjustments }) => {
  const { t } = useTranslation('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAdjustments, setFilteredAdjustments] = useState<StockAdjustment[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter adjustments based on search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredAdjustments(adjustments);
      } else {
        const query = searchQuery.toLowerCase();
        const filtered = adjustments.filter(adj =>
          adj.itemName.toLowerCase().includes(query) ||
          (adj.userName && adj.userName.toLowerCase().includes(query)) ||
          (adj.reason && adj.reason.toLowerCase().includes(query))
        );
        setFilteredAdjustments(filtered);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, adjustments]);

  // Reset filtered adjustments when adjustments changes
  useEffect(() => {
    setFilteredAdjustments(adjustments);
  }, [adjustments]);

  if (adjustments.length === 0) {
    return <p className="text-slate-500 text-center">{t('inventory.noStockAdjustments')}</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-300">{t('inventory.stockAdjustmentHistory')}</h3>
      </div>
      
      {/* Search input */}
      <div className="mb-4">
        <div className="relative">
          <VKeyboardInput
            k-type="full"
            type="text"
            placeholder={t('inventory.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-slate-400 hover:text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {searchQuery.trim() && (
          <p className="text-sm text-slate-400 mt-2">
            {t('inventory.searchResults', { count: filteredAdjustments.length })}
          </p>
        )}
      </div>
      
      <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-2">
        {[...filteredAdjustments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(adj => (
          <div key={adj.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
            <div>
              <p className="font-semibold">{adj.itemName}</p>
              <p className="text-sm text-slate-400">{formatDate(adj.createdAt)} {t('inventory.byUser', { user: adj.userName || 'N/A' })}</p>
              <p className="text-sm text-slate-500 italic mt-1">{t('inventory.reasonLabel', { reason: adj.reason })}</p>
            </div>
            <div>
              <p className={`font-bold text-lg ${adj.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {adj.quantity > 0 ? '+' : ''}{adj.quantity}
              </p>
            </div>
          </div>
        ))}
        {searchQuery.trim() && filteredAdjustments.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            {t('inventory.noSearchResults')}
          </div>
        )}
      </div>
    </div>
  );
};