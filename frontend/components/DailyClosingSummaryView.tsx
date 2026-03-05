import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { DailyClosing } from '@shared/types';
import { getDailyClosings } from '../services/dailyClosingService';
import { formatMoney, isMoneyValid } from '../utils/money';
import { DailyClosingDetailsModal } from './DailyClosingDetailsModal';
import { format } from 'date-fns';

interface DailyClosingSummaryViewProps {
  currentUserRole: string;
}

export const DailyClosingSummaryView: React.FC<DailyClosingSummaryViewProps> = ({ currentUserRole }) => {
  const { t } = useTranslation('admin');
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClosing, setSelectedClosing] = useState<DailyClosing | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');

  // Fetch daily closings
  useEffect(() => {
    const fetchDailyClosings = async () => {
      try {
        setLoading(true);
        
        const response = await getDailyClosings(dateFilter, dateToFilter);
        
        setDailyClosings(response);
        setError(null);
      } catch (err) {
        setError(t('dailyClosing.errors.failedToFetch'));
        console.error('Error fetching daily closings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyClosings();
  }, [dateFilter, dateToFilter]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  // Format currency using the app's formatMoney utility (EUR)
  const formatCurrency = (amount: number) => {
    if (!isMoneyValid(amount)) return '€0.00';
    return formatMoney(amount);
  };

  // Close modal
  const closeModal = () => setSelectedClosing(null);

  // Calculate totals across all selected closings
  const calculateTotals = () => {
    if (!dailyClosings.length) return null;

    return dailyClosings.reduce((totals, closing) => {
      return {
        transactions: totals.transactions + (closing.summary?.transactions || 0),
        totalSales: totals.totalSales + (closing.summary?.netSales || closing.summary?.totalSales || 0),
        totalTax: totals.totalTax + (closing.summary?.totalTax || 0),
        totalTips: totals.totalTips + (closing.summary?.totalTips || 0),
        paymentMethods: { ...totals.paymentMethods },
        tills: { ...totals.tills }
      };
    }, {
      transactions: 0,
      totalSales: 0,
      totalTax: 0,
      totalTips: 0,
      paymentMethods: {} as Record<string, { count: number; total: number }>,
      tills: {} as Record<string, { transactions: number; total: number }>
    });
  };

  // Calculate combined payment methods across all closings
  const calculateCombinedPaymentMethods = () => {
    const combined: Record<string, { count: number; total: number }> = {};
    
    dailyClosings.forEach(closing => {
      if (closing.summary?.paymentMethods) {
        Object.entries(closing.summary.paymentMethods).forEach(([method, data]) => {
          if (!combined[method]) {
            combined[method] = { count: 0, total: 0 };
          }
          combined[method].count += data.count;
          combined[method].total += data.total;
        });
      }
    });
    
    return combined;
  };

  // Calculate combined tills across all closings
  const calculateCombinedTills = () => {
    const combined: Record<string, { transactions: number; total: number }> = {};
    
    dailyClosings.forEach(closing => {
      if (closing.summary?.tills) {
        Object.entries(closing.summary.tills).forEach(([tillKey, data]) => {
          if (!combined[tillKey]) {
            combined[tillKey] = { transactions: 0, total: 0 };
          }
          combined[tillKey].transactions += data.transactions;
          combined[tillKey].total += data.total;
        });
      }
    });
    
    return combined;
  };

  // Get totals
  const totals = calculateTotals();
  const combinedPaymentMethods = calculateCombinedPaymentMethods();
  const combinedTills = calculateCombinedTills();

  if (currentUserRole !== 'Admin') {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">{t('dailyClosing.accessDenied')}</h2>
        <p className="text-slate-400">{t('dailyClosing.accessDeniedMessage')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-slate-400">{t('dailyClosing.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">{t('dailyClosing.error')}</h2>
        <p className="text-slate-400">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {t('dailyClosing.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col bg-slate-900">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-300 mb-2">{t('dailyClosing.pageTitle')}</h1>
        <p className="text-slate-400">{t('dailyClosing.pageDescription')}</p>
      </div>

      {/* Date Filter Controls */}
      <div className="bg-slate-800 p-4 rounded-lg mb-6 flex-shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">{t('dailyClosing.filters.fromDate')}</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-900 p-2 rounded-md border border-slate-700 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">{t('dailyClosing.filters.toDate')}</label>
            <input
              type="date"
              value={dateToFilter}
              onChange={(e) => setDateToFilter(e.target.value)}
              className="w-full bg-slate-900 p-2 rounded-md border border-slate-700 text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFilter('');
                setDateToFilter('');
              }}
              className="w-full py-2 px-4 bg-slate-700 text-white rounded-md hover:bg-slate-600 transition"
            >
              {t('dailyClosing.filters.clearFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 p-4 rounded-lg border-slate-700">
            <h3 className="text-sm font-medium text-slate-400">{t('dailyClosing.totalTransactions')}</h3>
            <p className="text-2xl font-bold text-slate-200">{totals.transactions}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border-slate-700">
            <h3 className="text-sm font-medium text-slate-400">{t('dailyClosing.totalSales')}</h3>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(totals.totalSales)}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border-slate-700">
            <h3 className="text-sm font-medium text-slate-400">{t('dailyClosing.totalTax')}</h3>
            <p className="text-2xl font-bold text-amber-400">{formatCurrency(totals.totalTax)}</p>
          </div>
          <div className="bg-slate-800 p-4 rounded-lg border-slate-700">
            <h3 className="text-sm font-medium text-slate-400">{t('dailyClosing.totalTips')}</h3>
            <p className="text-2xl font-bold text-blue-400">{formatCurrency(totals.totalTips)}</p>
          </div>
        </div>
      )}

      {/* Daily Closings List - with scrolling */}
      <div className="bg-slate-800 rounded-lg flex-1 min-h-0">
        <div className="overflow-x-auto overflow-y-auto h-full">
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('dailyClosing.table.dateTime')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('dailyClosing.table.user')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('dailyClosing.table.transactions')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('dailyClosing.table.totalSales')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">{t('dailyClosing.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {dailyClosings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-slate-400">
                    {t('dailyClosing.noRecordsFound')}
                  </td>
                </tr>
              ) : (
                dailyClosings.map((closing) => (
                  <tr 
                    key={closing.id}
                    className="hover:bg-slate-700 cursor-pointer"
                    onClick={() => setSelectedClosing(closing)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-200">{formatDate(closing.closedAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-200">{closing.userName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-200">{closing.summary?.transactions || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-200">{formatCurrency(closing.summary?.netSales || closing.summary?.totalSales || 0)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-amber-400 hover:text-amber-300"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClosing(closing);
                        }}
                      >
                        {t('dailyClosing.table.viewDetails')}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Combined Payment Methods and Tills Summary */}
      {dailyClosings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Combined Payment Methods - takes 1 column */}
          <div className="bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-slate-300 mb-4">{t('dailyClosing.combined.paymentMethods')}</h3>
            <div className="space-y-2">
              {Object.entries(combinedPaymentMethods).map(([method, data]) => (
                <div key={method} className="flex justify-between bg-slate-700 p-2 rounded">
                  <span className="text-slate-300">{method}</span>
                  <span className="font-medium">
                    {t('dailyClosing.details.transactionsCount', { count: data.count })}, {formatCurrency(data.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Combined Tills Summary - takes 2 columns */}
          <div className="lg:col-span-2 bg-slate-800 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-slate-300 mb-4">{t('dailyClosing.combined.tillSummary')}</h3>
            <div className="space-y-2">
              {Object.entries(combinedTills).map(([tillKey, data]) => {
                // Handle formats: "till_1_Patio" or "Till till_1_Patio"
                // The key may have a "Till " prefix from display formatting
                let cleanKey = tillKey;
                if (tillKey.startsWith('Till ')) {
                  cleanKey = tillKey.substring(5); // Remove "Till " prefix
                }
                
                const parts = cleanKey.split('_');
                const tillId = parts[1] || '';
                const tillName = parts.slice(2).join('_') || '';
                
                return (
                  <div key={tillKey} className="flex justify-between bg-slate-700 p-2 rounded">
                    <span className="text-slate-300">{tillName || t('dailyClosing.fallbackTill', { id: tillId })}</span>
                    <span className="font-medium">
                      {t('dailyClosing.details.transactionsCount', { count: data.transactions })}, {formatCurrency(data.total)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Daily Closing Details */}
      {selectedClosing && (
        <DailyClosingDetailsModal 
          closing={selectedClosing} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
};
