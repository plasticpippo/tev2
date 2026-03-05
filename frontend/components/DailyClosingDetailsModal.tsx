import React from 'react';
import { useTranslation } from 'react-i18next';
import type { DailyClosing } from '@shared/types';
import { formatMoney } from '../utils/money';
import { format } from 'date-fns';

interface DailyClosingDetailsModalProps {
  closing: DailyClosing;
  onClose: () => void;
}

export const DailyClosingDetailsModal: React.FC<DailyClosingDetailsModalProps> = ({ closing, onClose }) => {
  const { t } = useTranslation('admin');

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  // Format currency using the app's formatMoney utility (EUR)
  const formatCurrency = (amount: number) => {
    return formatMoney(amount);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-200">{t('dailyClosing.details.title')}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700 transition"
          >
            &times;
          </button>
        </div>
        <div className="p-6">
          {/* Basic Info */}
          <div className="mb-6 p-4 bg-slate-900 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">{t('dailyClosing.details.closedAt')}</p>
                <p className="font-medium text-slate-200">{formatDate(closing.closedAt)}</p>
              </div>
              <div>
                <p className="text-slate-400">{t('dailyClosing.details.closedBy')}</p>
                <p className="font-medium text-slate-200">{closing.userName}</p>
              </div>
              <div>
                <p className="text-slate-400">{t('dailyClosing.details.closingId')}</p>
                <p className="font-medium text-slate-200">#{closing.id}</p>
              </div>
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-slate-300 mb-3">{t('dailyClosing.details.transactionSummary')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-3 rounded-lg">
                <p className="text-slate-400 text-sm">{t('dailyClosing.table.transactions')}</p>
                <p className="font-bold text-xl text-slate-200">{closing.summary?.transactions || 0}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg">
                <p className="text-slate-400 text-sm">{t('dailyClosing.totalSales')}</p>
                <p className="font-bold text-xl text-green-400">{formatCurrency(closing.summary?.totalSales || 0)}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg">
                <p className="text-slate-400 text-sm">{t('dailyClosing.totalTax')}</p>
                <p className="font-bold text-xl text-amber-400">{formatCurrency(closing.summary?.totalTax || 0)}</p>
              </div>
              <div className="bg-slate-900 p-3 rounded-lg">
                <p className="text-slate-400 text-sm">{t('dailyClosing.totalTips')}</p>
                <p className="font-bold text-xl text-blue-400">{formatCurrency(closing.summary?.totalTips || 0)}</p>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-slate-300 mb-3">{t('dailyClosing.details.paymentMethods')}</h3>
            <div className="space-y-2">
              {Object.entries(closing.summary?.paymentMethods || {}).map(([method, data]) => (
                <div key={method} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg">
                  <span className="text-slate-300 font-medium">{method}</span>
                  <div className="text-right">
                    <span className="text-slate-400 text-sm">{t('dailyClosing.details.transactionsCount', { count: data.count })}</span>
                    <span className="ml-2 font-bold text-slate-200">{formatCurrency(data.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Till Summary */}
          <div>
            <h3 className="text-lg font-medium text-slate-300 mb-3">{t('dailyClosing.details.tillSummary')}</h3>
            <div className="space-y-2">
              {Object.entries(closing.summary?.tills || {}).map(([tillKey, data]) => {
                const [tillId, tillName] = tillKey.split('-');
                return (
                  <div key={tillKey} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg">
                    <span className="text-slate-300 font-medium">{tillName || t('dailyClosing.fallbackTill', { id: tillId })}</span>
                    <div className="text-right">
                      <span className="text-slate-400 text-sm">{t('dailyClosing.details.transactionsCount', { count: data.transactions })}</span>
                      <span className="ml-2 font-bold text-slate-200">{formatCurrency(data.total)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition"
          >
            {t('dailyClosing.details.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
