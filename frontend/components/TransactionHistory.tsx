import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction, User, Till, Settings, Receipt } from '../../shared/types';
import { formatCurrency, formatDate } from '../utils/formatting';
import { getBusinessDayStart } from '../utils/time';
import { ReceiptGenerationModal } from './ReceiptGenerationModal';
import { getAuthHeaders } from '../services/apiBase';
import { voidTransaction } from '../services/transactionService';

const API_BASE = import.meta.env.VITE_API_BASE || '';

interface TransactionHistoryProps {
    transactions: Transaction[];
    users: User[];
    tills: Till[];
    settings: Settings;
    onDataUpdate?: () => void;
}

type DateRangePreset = 'today' | 'yesterday' | '7days' | '30days' | 'custom';

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, users, tills, settings, onDataUpdate }) => {
  const { t } = useTranslation('admin');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [dateRange, setDateRange] = useState<DateRangePreset>('30days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customStartTime, setCustomStartTime] = useState('00:00');
  const [customEndTime, setCustomEndTime] = useState('23:59');
  const [selectedTillId, setSelectedTillId] = useState<'all' | number>('all');
  const [selectedUserId, setSelectedUserId] = useState<'all' | number>('all');
  
  // Receipt generation state
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [transactionForReceipt, setTransactionForReceipt] = useState<Transaction | null>(null);

  // Void transaction state
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidError, setVoidError] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

    const filteredTransactions = useMemo(() => {
        let items = [...transactions];

        // Date Filtering
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (dateRange === 'today') {
            startDate = getBusinessDayStart(settings);
            endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
        } else if (dateRange === 'yesterday') {
            const businessDayStart = getBusinessDayStart(settings);
            const yesterdayBusinessDayStart = new Date(businessDayStart);
            yesterdayBusinessDayStart.setDate(businessDayStart.getDate() - 1);
            
            startDate = yesterdayBusinessDayStart;
            endDate = businessDayStart;

        } else if (dateRange === '7days') {
            startDate = new Date();
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        } else if (dateRange === '30days') {
            startDate = new Date();
            startDate.setDate(now.getDate() - 30);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        } else if (dateRange === 'custom' && customStart && customEnd) {
            const [startHours, startMinutes] = customStartTime.split(':').map(Number);
            startDate = new Date(customStart);
            startDate.setHours(startHours, startMinutes, 0, 0);

            const [endHours, endMinutes] = customEndTime.split(':').map(Number);
            endDate = new Date(customEnd);
            endDate.setHours(endHours, endMinutes, 59, 999);
        }

        if (startDate && endDate) {
            items = items.filter(t => {
                const createdAt = new Date(t.createdAt);
                return createdAt >= startDate! && createdAt < endDate!;
            });
        }

        // Till & User Filtering
        if (selectedTillId !== 'all') {
            items = items.filter(t => t.tillId === selectedTillId);
        }
        if (selectedUserId !== 'all') {
            items = items.filter(t => t.userId === selectedUserId);
        }

        return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [transactions, dateRange, customStart, customEnd, customStartTime, customEndTime, selectedTillId, selectedUserId, settings]);
    
  const totalFilteredSales = useMemo(() => {
    return filteredTransactions
      .filter(t => t.status !== 'voided')
      .reduce((sum, t) => sum + t.total, 0);
  }, [filteredTransactions]);

  const handleGenerateReceipt = (transaction: Transaction) => {
    setTransactionForReceipt(transaction);
    setShowReceiptModal(true);
  };

  const handleReceiptGenerated = (receipt: Receipt) => {
    // Optionally refresh data or show success message
    console.log('Receipt generated:', receipt.receiptNumber);
  };

  const handleViewReceipt = async (transaction: Transaction) => {
    if (!transaction.receipt) return;
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`${API_BASE}/api/receipts/${transaction.receipt.id}/pdf`, {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      } else if (response.status === 401) {
        // Session expired - redirect to login
        console.error('Session expired. Please log in again.');
        window.location.href = '/login';
      } else {
        const errorData = await response.json().catch(() => ({ error: t('transactions.errors.unknownError') }));
        console.error('Failed to view receipt:', errorData.error);
      }
    } catch (error) {
      console.error('Failed to view receipt:', error);
    }
  };

  const handleVoidTransaction = useCallback(() => {
    if (!selectedTransaction) return;
    setVoidReason('');
    setVoidError('');
    setShowVoidModal(true);
  }, [selectedTransaction]);

  const handleConfirmVoid = useCallback(async () => {
    if (!selectedTransaction || !voidReason.trim()) {
      setVoidError('A reason is required to void a transaction.');
      return;
    }
    setIsVoiding(true);
    setVoidError('');
    try {
      await voidTransaction(selectedTransaction.id, voidReason.trim());
      setShowVoidModal(false);
      setSelectedTransaction(null);
      setVoidReason('');
      onDataUpdate?.();
    } catch (error) {
      setVoidError(error instanceof Error ? error.message : t('transactions.errors.voidFailed'));
    } finally {
      setIsVoiding(false);
    }
  }, [selectedTransaction, voidReason, onDataUpdate]);
    
const DateRangeButton: React.FC<{preset: DateRangePreset, label: string}> = ({preset, label}) => (
<button
onClick={() => setDateRange(preset)}
className={`px-3 py-2 min-h-11 text-sm rounded-md transition ${dateRange === preset ? 'bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
aria-pressed={dateRange === preset}
aria-label={t('transactions.ariaLabels.filterBy', { label })}
data-testid={`date-range-${preset}`}
>
{label}
</button>
);
    
return (
    <>
      <div className="h-full flex flex-col">
        <h2 className="text-2xl font-bold text-slate-300 mb-4 flex-shrink-0">{t('transactions.title')}</h2>
            
            <div className="bg-slate-800 p-4 rounded-lg mb-4 flex-shrink-0 space-y-4">
                {/* Row 1: Date Presets */}
                <div className="flex flex-wrap gap-2">
                    <DateRangeButton preset="today" label={t('transactions.dateRange.today')}/>
                    <DateRangeButton preset="yesterday" label={t('transactions.dateRange.yesterday')}/>
                    <DateRangeButton preset="7days" label={t('transactions.dateRange.last7Days')}/>
                    <DateRangeButton preset="30days" label={t('transactions.dateRange.last30Days')}/>
<button
onClick={() => setDateRange('custom')}
className={`px-3 py-2 min-h-11 text-sm rounded-md transition ${dateRange === 'custom' ? 'bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
aria-label={t('transactions.ariaLabels.filterByCustomDateRange')}
aria-pressed={dateRange === 'custom'}
>
{t('transactions.dateRange.custom')}
</button>
                </div>

                {/* Additional Filters */}
                <div>
                    {dateRange === 'custom' ? (
                        <div className="space-y-4">
                            {/* Row 2 (Custom): Till & User */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="till-select" className="block text-sm font-medium text-slate-400 mb-1">{t('transactions.filters.till')}</label>
                                    <select id="till-select" value={selectedTillId} onChange={e => setSelectedTillId(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="w-full bg-slate-900 p-2 rounded-md border border-slate-700 text-sm" aria-label={t('transactions.ariaLabels.filterByTill')} data-testid="till-select" role="combobox">
                                        <option value="all">{t('transactions.allTills')}</option>
                                        {tills.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="user-select" className="block text-sm font-medium text-slate-400 mb-1">{t('transactions.filters.user')}</label>
                                    <select id="user-select" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="w-full bg-slate-900 p-2 rounded-md border border-slate-700 text-sm" aria-label={t('transactions.ariaLabels.filterByUser')} data-testid="user-select" role="combobox">
                                        <option value="all">{t('transactions.allUsers')}</option>
                                        {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            {/* Row 3 (Custom): Date/Time Pickers */}
                            <div className="flex items-center gap-2 flex-wrap bg-slate-900 p-2 rounded-md border border-slate-700">
                                <label htmlFor="custom-start-date" className="text-sm text-slate-400">{t('transactions.filters.from')}</label>
                                <input
                                    id="custom-start-date"
                                    type="date"
                                    value={customStart}
                                    onChange={e => setCustomStart(e.target.value)}
                                    className="bg-slate-700 p-2 rounded-md text-sm"
                                />
                                <input
                                    id="custom-start-time"
                                    type="time"
                                    value={customStartTime}
                                    onChange={e => setCustomStartTime(e.target.value)}
                                    className="bg-slate-700 p-2 rounded-md text-sm"
                                    aria-label={t('transactions.ariaLabels.startTime')}
                                />
                                <label htmlFor="custom-end-date" className="text-sm text-slate-400">{t('transactions.filters.to')}</label>
                                <input
                                    id="custom-end-date"
                                    type="date"
                                    value={customEnd}
                                    onChange={e => setCustomEnd(e.target.value)}
                                    className="bg-slate-700 p-2 rounded-md text-sm"
                                    aria-label={t('transactions.ariaLabels.endDate')}
                                />
                                <input
                                    id="custom-end-time"
                                    type="time"
                                    value={customEndTime}
                                    onChange={e => setCustomEndTime(e.target.value)}
                                    className="bg-slate-700 p-2 rounded-md text-sm"
                                    aria-label={t('transactions.ariaLabels.endTime')}
                                />
                            </div>
                        </div>
                    ) : (
                        /* Row 2 (Preset): Till & User */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="till-select-preset" className="block text-sm font-medium text-slate-400 mb-1">{t('transactions.filters.till')}</label>
                                <select id="till-select-preset" value={selectedTillId} onChange={e => setSelectedTillId(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="w-full bg-slate-900 p-2 rounded-md border border-slate-700 text-sm" aria-label={t('transactions.ariaLabels.filterByTill')} role="combobox" data-testid="till-select">
                                    <option value="all">{t('transactions.allTills')}</option>
                                    {tills.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="user-select-preset" className="block text-sm font-medium text-slate-400 mb-1">{t('transactions.filters.user')}</label>
                                <select id="user-select-preset" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="w-full bg-slate-900 p-2 rounded-md border border-slate-700 text-sm" aria-label={t('transactions.ariaLabels.filterByUser')}>
                                    <option value="all">{t('transactions.allUsers')}</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>


            <div className="mb-2 text-slate-400 text-sm" aria-live="polite">
                {t('transactions.found', { count: filteredTransactions.length, total: formatCurrency(totalFilteredSales) })}
            </div>

            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                <div className="overflow-y-auto pr-2 space-y-2">
                    {filteredTransactions.length === 0 ? (
                        <p className="text-slate-500 text-center pt-8">{t('transactions.noTransactions')}</p>
                    ) : (
                        filteredTransactions.map((tx) => (
                            <div key={tx.id} className="flex flex-col">
                            <button
                                onClick={() => setSelectedTransaction(tx)}
                                className={`w-full text-left p-3 rounded-md transition ${selectedTransaction?.id === tx.id ? 'bg-amber-60 text-white' : 'bg-slate-900 hover:bg-slate-700'}`}
                                aria-label={t('transactions.ariaLabels.transactionDetails', { id: tx.id, total: formatCurrency(tx.total), user: tx.userName, till: tx.tillName })}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">{formatCurrency(tx.total)}</span>
                                    <span className="text-xs text-slate-400">{tx.tillName}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-300">{tx.userName} ({tx.paymentMethod})</span>
                                    <span className="text-slate-400">{formatDate(tx.createdAt)}</span>
                                </div>
                                {tx.tableName && (
                                    <div className="flex justify-between items-center text-xs mt-1">
                                        <span className="text-green-400">{t('transactions.details.table', { name: tx.tableName })}</span>
                                    </div>
                                )}
                {tx.status === 'complimentary' && (
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-purple-400">{t('transactions.details.complimentary')}</span>
                  </div>
                )}
                {tx.status === 'voided' && (
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="text-red-400 font-semibold">VOIDED</span>
                    {tx.voidReason && (
                      <span className="text-red-300/70 text-xs truncate max-w-[60%]">{tx.voidReason}</span>
                    )}
                  </div>
                )}
                {tx.receipt && (
                  <div className="flex justify-between items-center text-xs mt-1">
                    <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
                      Receipt #{tx.receipt.receiptNumber}
                    </span>
                  </div>
                )}
              </button>
                          </div>
                        ))
                    )}
                </div>
                <div className="bg-slate-900 rounded-lg p-4 overflow-y-auto">
                    {selectedTransaction ? (
                        <div>
                            <h4 className="font-bold text-lg text-amber-400 mb-2">{t('transactions.receipt', { id: selectedTransaction.id })}</h4>
                            <p className="text-sm text-slate-400 mb-4">{formatDate(selectedTransaction.createdAt)}</p>
                            {selectedTransaction.status === 'complimentary' && (
                                <div className="mb-4 bg-purple-900/30 border border-purple-700/50 rounded-md p-2 text-center">
                                    <span className="text-purple-400 font-semibold">{t('transactions.details.complimentary')}</span>
                                </div>
                            )}
                            {selectedTransaction.status === 'voided' && (
                                <div className="mb-4 bg-red-900/30 border border-red-700/50 rounded-md p-3">
                                    <div className="text-red-400 font-semibold text-center mb-1">VOIDED</div>
                                    {selectedTransaction.voidReason && (
                                        <div className="text-red-300/70 text-xs text-center">{selectedTransaction.voidReason}</div>
                                    )}
                                    {selectedTransaction.voidedAt && (
                                        <div className="text-red-300/50 text-xs text-center mt-1">
                                            Voided at {formatDate(selectedTransaction.voidedAt)}
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="space-y-2 mb-4">
                                {selectedTransaction.items.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span>{item.quantity} x {item.name}</span>
                                        <span>{formatCurrency(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
            <div className="border-t border-slate-700 pt-2 space-y-1 text-sm">
              <div className="flex justify-between"><span>{t('transactions.details.subtotal')}</span><span>{formatCurrency(selectedTransaction.subtotal)}</span></div>
              <div className="flex justify-between"><span>{t('transactions.details.tax')}</span><span>{formatCurrency(selectedTransaction.tax)}</span></div>
              {selectedTransaction.discount > 0 && (
                <div className="flex justify-between text-purple-400">
                  <span>{t('transactions.details.discount')}</span>
                  <span>-{formatCurrency(selectedTransaction.discount)}</span>
                </div>
              )}
              {selectedTransaction.discountReason && (
                <div className="flex justify-between text-xs text-slate-500 italic">
                  <span>{t('transactions.details.discountReason')}:</span>
                  <span>{selectedTransaction.discountReason}</span>
                </div>
              )}
              <div className="flex justify-between"><span>{t('transactions.details.tip')}</span><span>{formatCurrency(selectedTransaction.tip)}</span></div>
              <div className="flex justify-between font-bold text-base mt-2"><span>{t('transactions.details.total')}</span><span>{formatCurrency(selectedTransaction.total)}</span></div>
            </div>
            
{/* Generate/View Receipt Button */}
<div className="mt-4 pt-4 border-t border-slate-700">
{selectedTransaction.receipt ? (
  selectedTransaction.receipt.status === 'draft' ? (
    // Draft receipt - open preview modal to issue
    <button
      onClick={() => handleGenerateReceipt(selectedTransaction)}
      className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-2 px-4 rounded-md transition flex items-center justify-center gap-2"
      aria-label={t('receipts.preview.button')}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {t('receipts.preview.button')}
    </button>
  ) : (
    // Issued receipt - view PDF
    <button
      onClick={() => handleViewReceipt(selectedTransaction)}
      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md transition flex items-center justify-center gap-2"
      aria-label={t('receipts.view.title')}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      {t('receipts.view.button')}
    </button>
  )
) : (
  <button
    onClick={() => handleGenerateReceipt(selectedTransaction)}
    className="w-full bg-amber-500 hover:bg-amber-400 text-white font-bold py-2 px-4 rounded-md transition flex items-center justify-center gap-2"
    aria-label={t('receipts.generate.title')}
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    {t('receipts.generate.button')}
  </button>
)}
</div>

{/* Void Transaction Button - only for completed/complimentary transactions */}
{selectedTransaction.status === 'completed' || selectedTransaction.status === 'complimentary' ? (
  <div className="mt-3">
    <button
      onClick={handleVoidTransaction}
      className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition flex items-center justify-center gap-2"
      aria-label={t('transactions.ariaLabels.voidTransaction')}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
      Void Transaction
    </button>
  </div>
) : null}
          </div>
                    ) : (
                        <p className="text-slate-500 text-center pt-16">{t('transactions.selectTransaction')}</p>
)}
</div>
</div>
</div>

{/* Receipt Generation Modal */}
<ReceiptGenerationModal
  isOpen={showReceiptModal}
  onClose={() => setShowReceiptModal(false)}
  transaction={transactionForReceipt}
  onReceiptGenerated={handleReceiptGenerated}
/>

{/* Void Transaction Confirmation Modal */}
{showVoidModal && selectedTransaction && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowVoidModal(false)}>
    <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-600" onClick={e => e.stopPropagation()}>
      <h3 className="text-lg font-bold text-red-400 mb-2">Void Transaction #{selectedTransaction.id}</h3>
      <p className="text-sm text-slate-400 mb-1">
        Total: <span className="text-white font-semibold">{formatCurrency(selectedTransaction.total)}</span>
      </p>
      <p className="text-sm text-slate-400 mb-4">
        This will restore stock for all items in this transaction and mark it as voided. This action cannot be undone.
      </p>
      <div className="mb-4">
        <label htmlFor="void-reason" className="block text-sm font-medium text-slate-300 mb-1">
          Reason for voiding *
        </label>
        <textarea
          id="void-reason"
          value={voidReason}
          onChange={e => { setVoidReason(e.target.value); setVoidError(''); }}
          placeholder="Enter the reason for voiding this transaction..."
          className="w-full bg-slate-900 p-3 rounded-md border border-slate-700 text-sm text-white placeholder-slate-500 resize-none"
          rows={3}
          autoFocus
        />
        {voidError && (
          <p className="text-red-400 text-xs mt-1">{voidError}</p>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setShowVoidModal(false)}
          className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-medium py-2 px-4 rounded-md transition"
          disabled={isVoiding}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirmVoid}
          className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isVoiding || !voidReason.trim()}
        >
          {isVoiding ? 'Voiding...' : 'Confirm Void'}
        </button>
      </div>
    </div>
  </div>
)}
</>
);
};
