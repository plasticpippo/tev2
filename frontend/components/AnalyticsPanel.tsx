import React, { useState, useMemo } from 'react';
import type { Transaction, Product, Category, Settings } from '@shared/types';
import { getBusinessDayStart } from '../utils/time';

import { HourlySalesChart } from './analytics/HourlySalesChart';
import { SalesTrendChart } from './analytics/SalesTrendChart';
import { TopPerformers } from './analytics/TopPerformers';

interface AnalyticsPanelProps {
  transactions: Transaction[];
  products: Product[];
  categories: Category[];
  settings: Settings;
}

type DateRange = 'today' | 'week' | 'month' | 'year';

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ transactions, products, categories, settings }) => {
  const [dateRange, setDateRange] = useState<DateRange>('today');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'week':
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'today':
      default:
        startDate = getBusinessDayStart(settings);
        break;
    }

    return transactions.filter(t => new Date(t.createdAt) >= startDate);
  }, [transactions, dateRange, settings]);
  
  const DateRangeButton: React.FC<{range: DateRange, label: string}> = ({range, label}) => (
    <button 
      onClick={() => setDateRange(range)} 
      className={`text-center px-4 py-2 text-sm font-semibold rounded-md transition ${dateRange === range ? 'bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>
        {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-300 self-start sm:self-center">Analytics Dashboard</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
          <DateRangeButton range="today" label="Today" />
          <DateRangeButton range="week" label="Last 7 Days" />
          <DateRangeButton range="month" label="Last 30 Days" />
          <DateRangeButton range="year" label="Last 12 Months" />
        </div>
      </div>
      
      {filteredTransactions.length === 0 ? (
        <div className="text-center py-20 bg-slate-800 rounded-lg">
            <p className="text-slate-400">No sales data available for the selected period.</p>
        </div>
      ) : (
        <>
            {dateRange === 'today' && <HourlySalesChart transactions={filteredTransactions} settings={settings} />}
            {dateRange !== 'today' && <SalesTrendChart transactions={filteredTransactions} dateRange={dateRange} />}
            <TopPerformers transactions={filteredTransactions} products={products} categories={categories} />
        </>
      )}
    </div>
  );
};