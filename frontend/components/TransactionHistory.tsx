import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction, User, Till, Settings } from '@shared/types';
import { formatCurrency, formatDate } from '../utils/formatting';
import { getBusinessDayStart } from '../utils/time';

interface TransactionHistoryProps {
    transactions: Transaction[];
    users: User[];
    tills: Till[];
    settings: Settings;
}

type DateRangePreset = 'today' | 'yesterday' | '7days' | '30days' | 'custom';

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({ transactions, users, tills, settings }) => {
    const { t } = useTranslation('admin');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [dateRange, setDateRange] = useState<DateRangePreset>('30days');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [customStartTime, setCustomStartTime] = useState('00:00');
    const [customEndTime, setCustomEndTime] = useState('23:59');
    const [selectedTillId, setSelectedTillId] = useState<'all' | number>('all');
    const [selectedUserId, setSelectedUserId] = useState<'all' | number>('all');

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
        return filteredTransactions.reduce((sum, t) => sum + t.total, 0);
    }, [filteredTransactions]);
    
    const DateRangeButton: React.FC<{preset: DateRangePreset, label: string}> = ({preset, label}) => (
        <button
            onClick={() => setDateRange(preset)}
            className={`px-3 py-2 text-sm rounded-md transition ${dateRange === preset ? 'bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
            aria-pressed={dateRange === preset}
            aria-label={t('transactions.ariaLabels.filterBy', { label })}
            data-testid={`date-range-${preset}`}
        >
            {label}
        </button>
    );
    
    return (
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
                        className={`px-3 py-2 text-sm rounded-md transition ${dateRange === 'custom' ? 'bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
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
                        filteredTransactions.map(t => (
                            <div key={t.id} className="flex flex-col">
                            <button
                                onClick={() => setSelectedTransaction(t)}
                                className={`w-full text-left p-3 rounded-md transition ${selectedTransaction?.id === t.id ? 'bg-amber-60 text-white' : 'bg-slate-900 hover:bg-slate-700'}`}
                                aria-label={t('transactions.ariaLabels.transactionDetails', { id: t.id, total: formatCurrency(t.total), user: t.userName, till: t.tillName })}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">{formatCurrency(t.total)}</span>
                                    <span className="text-xs text-slate-400">{t.tillName}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-300">{t.userName} ({t.paymentMethod})</span>
                                    <span className="text-slate-400">{formatDate(t.createdAt)}</span>
                                </div>
                                {t.tableName && (
                                    <div className="flex justify-between items-center text-xs mt-1">
                                        <span className="text-green-400">{t('transactions.details.table', { name: t.tableName })}</span>
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
                                <div className="flex justify-between"><span>{t('transactions.details.tip')}</span><span>{formatCurrency(selectedTransaction.tip)}</span></div>
                                <div className="flex justify-between font-bold text-base mt-2"><span>{t('transactions.details.total')}</span><span>{formatCurrency(selectedTransaction.total)}</span></div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-slate-500 text-center pt-16">{t('transactions.selectTransaction')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};