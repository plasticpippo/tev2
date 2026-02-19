import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays } from 'date-fns';
import type { Transaction, Product, Category, Settings } from '../shared/types';
import { getBusinessDayStart } from '../utils/time';

import { HourlySalesChart } from './analytics/HourlySalesChart';
import { SalesTrendChart } from './analytics/SalesTrendChart';
import { TopPerformers } from './analytics/TopPerformers';
import { DatePicker } from './analytics/DatePicker';
import { ComparisonToggle } from './analytics/ComparisonToggle';
import { ComparisonChart } from './analytics/ComparisonChart';

interface HourlyData {
  hour: string;
  total: number;
  transactionCount: number;
  averageTransaction: number;
}

interface HourlySalesData {
  date: string;
  businessDayStart: string;
  businessDayEnd: string;
  hourlyData: HourlyData[];
  summary: {
    totalSales: number;
    totalTransactions: number;
    peakHour: string;
    peakHourTotal: number;
    averageHourly: number;
  };
}

interface ComparisonResult {
  period1: HourlySalesData;
  period2: HourlySalesData;
  comparison: {
    hourlyDifferences: {
      hour: string;
      difference: number;
      percentChange: number;
    }[];
    summaryDifference: {
      totalSalesDifference: number;
      totalSalesPercentChange: number;
      transactionCountDifference: number;
      transactionCountPercentChange: number;
    };
  };
}

interface AnalyticsPanelProps {
  transactions: Transaction[];
  products: Product[];
  categories: Category[];
  settings: Settings;
}

type DateRange = 'today' | 'week' | 'month' | 'year' | 'custom';

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ 
  transactions, 
  products, 
  categories, 
  settings 
}) => {
  const { t } = useTranslation('admin');
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [comparisonDate, setComparisonDate] = useState<Date>(subDays(new Date(), 7));
  const [hourlyData, setHourlyData] = useState<HourlySalesData | null>(null);
  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch hourly data when date changes
  useEffect(() => {
    if (dateRange === 'custom' || dateRange === 'today') {
      fetchHourlyData();
    } else {
      setHourlyData(null);
      setComparisonData(null);
    }
  }, [selectedDate, dateRange]);
  
  // Fetch comparison data when in comparison mode
  useEffect(() => {
    if (isComparisonMode && selectedDate && comparisonDate) {
      fetchComparisonData();
    } else {
      setComparisonData(null);
    }
  }, [isComparisonMode, selectedDate, comparisonDate]);
  
  const fetchHourlyData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/analytics/hourly-sales?date=${dateStr}`);
      if (!response.ok) {
        throw new Error('Failed to fetch hourly data');
      }
      const data = await response.json();
      setHourlyData(data);
    } catch (err) {
      console.error('Failed to fetch hourly data:', err);
      setError(t('analytics.noDataForDate'));
      setHourlyData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchComparisonData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const date1 = format(selectedDate, 'yyyy-MM-dd');
      const date2 = format(comparisonDate, 'yyyy-MM-dd');
      const response = await fetch(`/api/analytics/compare?date1=${date1}&date2=${date2}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comparison data');
      }
      const data = await response.json();
      setComparisonData(data);
    } catch (err) {
      console.error('Failed to fetch comparison data:', err);
      setError(t('analytics.noDataForDate'));
      setComparisonData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
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
      case 'custom':
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

  const handlePrimaryDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleComparisonDateChange = (date: Date) => {
    setComparisonDate(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-300 self-start sm:self-center">{t('analytics.title')}</h2>
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <DateRangeButton range="today" label={t('analytics.today')} />
            <DateRangeButton range="week" label={t('analytics.last7Days')} />
            <DateRangeButton range="month" label={t('analytics.last30Days')} />
            <DateRangeButton range="year" label={t('analytics.last12Months')} />
            <DateRangeButton range="custom" label={t('analytics.custom')} />
          </div>
          
          {/* Comparison Toggle */}
          {(dateRange === 'today' || dateRange === 'custom') && (
            <ComparisonToggle 
              isComparisonMode={isComparisonMode}
              onToggle={setIsComparisonMode}
            />
          )}
        </div>
      </div>
      
      {/* Custom Date Picker */}
      {dateRange === 'custom' && !isComparisonMode && (
        <div className="flex items-center gap-4">
          <DatePicker
            selectedDate={selectedDate}
            onDateChange={handlePrimaryDateChange}
          />
        </div>
      )}
      
      {/* Comparison Date Pickers */}
      {isComparisonMode && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Primary Date */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">{t('analytics.primaryDate')}</label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => handlePrimaryDateChange(new Date(e.target.value + 'T00:00:00'))}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>
          
          {/* VS indicator */}
          <span className="text-slate-500 font-bold">VS</span>
          
          {/* Comparison Date */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">{t('analytics.compareWith')}</label>
            <input
              type="date"
              value={format(comparisonDate, 'yyyy-MM-dd')}
              onChange={(e) => handleComparisonDateChange(new Date(e.target.value + 'T00:00:00'))}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>
          
          {/* Quick suggestions */}
          <div className="flex gap-2">
            <button
              onClick={() => handleComparisonDateChange(subDays(selectedDate, 1))}
              className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition text-white"
            >
              {t('analytics.previousDay')}
            </button>
            <button
              onClick={() => handleComparisonDateChange(subDays(selectedDate, 7))}
              className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 rounded transition text-white"
            >
              {t('analytics.sameDayLastWeek')}
            </button>
          </div>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto" />
          <p className="text-slate-400 mt-4">{t('analytics.loading')}</p>
        </div>
      )}
      
      {/* Error State */}
      {error && !isLoading && (
        <div className="text-center py-10 bg-slate-800 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}
      
      {/* Content */}
      {!isLoading && !error && (
        <>
          {/* Comparison View */}
          {isComparisonMode && comparisonData && (
            <ComparisonChart data={comparisonData} />
          )}
          
          {/* Single Day Hourly View */}
          {!isComparisonMode && (dateRange === 'today' || dateRange === 'custom') && hourlyData && (
            <HourlySalesChart 
              transactions={filteredTransactions} 
              settings={settings}
              hourlyData={hourlyData}
              targetDate={selectedDate}
            />
          )}
          
          {/* No hourly data for custom date */}
          {!isComparisonMode && (dateRange === 'today' || dateRange === 'custom') && !hourlyData && filteredTransactions.length > 0 && (
            <HourlySalesChart 
              transactions={filteredTransactions} 
              settings={settings}
              targetDate={selectedDate}
            />
          )}
          
          {/* Trend View for Week/Month/Year */}
          {!isComparisonMode && dateRange !== 'today' && dateRange !== 'custom' && (
            <SalesTrendChart 
              transactions={filteredTransactions} 
              dateRange={dateRange} 
            />
          )}
          
          {/* Top Performers */}
          <TopPerformers 
            transactions={filteredTransactions} 
            products={products} 
            categories={categories} 
            includeAllProducts={true} 
          />
        </>
      )}
      
      {/* No data message for other cases */}
      {!isLoading && !error && filteredTransactions.length === 0 && (
        <div className="text-center py-20 bg-slate-800 rounded-lg">
          <p className="text-slate-400">{t('analytics.noData')}</p>
        </div>
      )}
    </div>
  );
};
