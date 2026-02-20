import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User, Transaction, OrderActivityLog, OrderItem, Settings } from '@shared/types';
import { formatCurrency, formatDate } from '../utils/formatting';
import { getBusinessDayStart } from '../utils/time';

interface UserPerformanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  transactions: Transaction[];
  orderActivityLogs: OrderActivityLog[];
  settings: Settings;
}

export const UserPerformanceReportModal: React.FC<UserPerformanceReportModalProps> = ({ isOpen, onClose, user, transactions, orderActivityLogs, settings }) => {
    const { t } = useTranslation('admin');
    const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('today');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
    const [tillIdFilter, setTillIdFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

    const isWithinDateRange = (dateString: string, range: 'today' | 'week' | 'month' | 'all' | 'custom') => {
        const date = new Date(dateString);
        const now = new Date();
        
        if (range === 'all') return true;
    
        if (range === 'today') {
            const businessDayStart = getBusinessDayStart(settings);
            return date >= businessDayStart;
        }
        
        if (range === 'week') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            return date >= oneWeekAgo;
        }
    
        if (range === 'month') {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(now.getMonth() - 1);
            return date >= oneMonthAgo;
        }

        if (range === 'custom' && customStartDate && customEndDate) {
            const startDate = new Date(customStartDate);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999);
            return date >= startDate && date <= endDate;
        }

        if (range === 'custom' && customStartDate) {
            const startDate = new Date(customStartDate);
            startDate.setHours(0, 0, 0, 0);
            return date >= startDate;
        }

        if (range === 'custom' && customEndDate) {
            const endDate = new Date(customEndDate);
            endDate.setHours(23, 59, 59, 999);
            return date <= endDate;
        }
        
        return false;
    };

    // Extract unique payment methods from transactions
    const availablePaymentMethods = useMemo(() => {
        const methods = new Set<string>();
        transactions.forEach(t => {
            if (t.paymentMethod) {
                methods.add(t.paymentMethod);
            }
        });
        return Array.from(methods).sort();
    }, [transactions]);

    // Extract unique tills from transactions
    const availableTills = useMemo(() => {
        const tills = new Map<number, string>();
        transactions.forEach(t => {
            if (t.tillId) {
                tills.set(t.tillId, t.tillName || `Till ${t.tillId}`);
            }
        });
        return Array.from(tills.entries()).sort((a, b) => a[0] - b[0]);
    }, [transactions]);

    const userStats = useMemo(() => {
        const filteredByDateTransactions = transactions.filter(t => t.userId === user.id && isWithinDateRange(t.createdAt, dateRange));
        const filteredByDateLogs = orderActivityLogs.filter(log => log.userId === user.id && isWithinDateRange(log.createdAt, dateRange));

        // Apply additional filters
        const userTransactions = filteredByDateTransactions.filter(t => {
            // Payment method filter
            if (paymentMethodFilter !== 'all' && t.paymentMethod !== paymentMethodFilter) {
                return false;
            }
            // Till filter
            if (tillIdFilter !== 'all' && String(t.tillId) !== tillIdFilter) {
                return false;
            }
            // Status filter
            if (statusFilter !== 'all' && t.status !== statusFilter) {
                return false;
            }
            return true;
        });

        const userLogs = filteredByDateLogs.filter(log => {
            // Payment method filter - need to check transaction's payment method
            if (paymentMethodFilter !== 'all' || tillIdFilter !== 'all' || statusFilter !== 'all') {
                // Find the associated transaction
                const associatedTransaction = transactions.find(t => t.id === log.transactionId);
                if (paymentMethodFilter !== 'all' && associatedTransaction?.paymentMethod !== paymentMethodFilter) {
                    return false;
                }
                if (tillIdFilter !== 'all' && String(associatedTransaction?.tillId) !== tillIdFilter) {
                    return false;
                }
                if (statusFilter !== 'all' && associatedTransaction?.status !== statusFilter) {
                    return false;
                }
            }
            return true;
        });

        const totalRevenue = userTransactions.reduce((sum, t) => sum + t.total, 0);
        const totalTips = userTransactions.reduce((sum, t) => sum + t.tip, 0);
        const transactionCount = userTransactions.length;
        const averageSale = transactionCount > 0 ? totalRevenue / transactionCount : 0;
        
        const allItemsSold = userTransactions.flatMap(t => t.items);
        // FIX: Replaced reduce's generic argument with a typed accumulator in the callback to fix type inference issues.
        const itemCounts = allItemsSold.reduce((acc: Record<string, number>, item) => {
            acc[item.name] = (acc[item.name] || 0) + item.quantity;
            return acc;
        }, {});
        // FIX: Explicitly typing sort parameters to prevent arithmetic operation errors on potentially unknown types.
        const topSellingItems = Object.entries(itemCounts).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).slice(0, 5);
        
        // --- START FIX for Item Removal Counting ---
        // FIX: Replaced reduce's generic argument with a typed accumulator in the callback to fix type inference issues.
        const removedItemsData = userLogs.reduce((acc: { count: number, topItems: Record<string, number> }, log) => {
            if (log.action === 'Item Removed' && typeof log.details === 'string') {
                const match = log.details.match(/^(\d+)\s*x\s*(.*)$/);
                if (match) {
                    const quantity = parseInt(match[1], 10);
                    const name = match[2];
                    acc.count += quantity;
                    acc.topItems[name] = (acc.topItems[name] || 0) + quantity;
                } else {
                     // Fallback for old format "Removed: Item Name"
                    const name = log.details.replace('Removed: ', '');
                    acc.count += 1;
                    acc.topItems[name] = (acc.topItems[name] || 0) + 1;
                }
            } else if (log.action === 'Order Cleared' && Array.isArray(log.details)) {
                log.details.forEach((item: OrderItem) => {
                    acc.topItems[item.name] = (acc.topItems[item.name] || 0) + item.quantity;
                });
            }
            return acc;
        }, { count: 0, topItems: {} });
        
        // FIX: Explicitly typing sort parameters to prevent arithmetic operation errors on potentially unknown types.
        const topRemovedItems = Object.entries(removedItemsData.topItems).sort((a: [string, number], b: [string, number]) => b[1] - a[1]).slice(0, 5);
        const ordersClearedCount = userLogs.filter(log => log.action === 'Order Cleared').length;
        // --- END FIX ---

        return {
            totalRevenue, totalTips, transactionCount, averageSale, topSellingItems,
            itemsRemovedCount: removedItemsData.count, ordersClearedCount, topRemovedItems,
            filteredLogs: userLogs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        };
    }, [user, transactions, orderActivityLogs, dateRange, settings, paymentMethodFilter, tillIdFilter, statusFilter, customStartDate, customEndDate]);

    if (!isOpen) return null;

    const StatCard: React.FC<{ title: string; value: string | number; isCurrency?: boolean }> = ({ title, value, isCurrency = true }) => (
        <div className="bg-slate-800 p-3 rounded-lg text-center">
            <p className="text-sm text-slate-400">{title}</p>
            <p className="text-xl font-bold">{isCurrency ? formatCurrency(Number(value)) : value}</p>
        </div>
    );
    
    const DateRangeButton: React.FC<{range: typeof dateRange, label: string}> = ({range, label}) => (
        <button onClick={() => { setDateRange(range); if (range !== 'custom') { setCustomStartDate(''); setCustomEndDate(''); } }} className={`px-3 py-1 text-sm rounded-md transition ${dateRange === range ? 'bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}>{label}</button>
    );

    const FilterDropdown: React.FC<{
        label: string;
        value: string;
        onChange: (value: string) => void;
        options: { value: string; label: string }[];
    }> = ({ label, value, onChange, options }) => (
        <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400 whitespace-nowrap">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-slate-700 text-white text-sm rounded-md px-2 py-1 border border-slate-600 focus:outline-none focus:border-amber-500"
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-xs sm:max-w-4xl max-h-[90vh] flex flex-col border border-slate-700">
                <div className="p-6 pb-4 border-b border-slate-700">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-amber-400">{t('performanceReport.title')}</h2>
                            <p className="text-slate-400">{t('performanceReport.forUser')} <span className="font-semibold text-white">{user.name}</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                             <DateRangeButton range="today" label={t('performanceReport.today')} />
                             <DateRangeButton range="week" label={t('performanceReport.thisWeek')} />
                             <DateRangeButton range="month" label={t('performanceReport.thisMonth')} />
                             <DateRangeButton range="all" label={t('performanceReport.allTime')} />
                             <DateRangeButton range="custom" label={t('performanceReport.custom')} />
                             <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700 transition ml-4">&times;</button>
                        </div>
                    </div>

                    {/* Custom Date Range Picker */}
                    {dateRange === 'custom' && (
                        <div className="flex items-center gap-4 mb-4 bg-slate-800 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-400">{t('performanceReport.startDate')}</label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="bg-slate-700 text-white text-sm rounded-md px-2 py-1 border border-slate-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-slate-400">{t('performanceReport.endDate')}</label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="bg-slate-700 text-white text-sm rounded-md px-2 py-1 border border-slate-600 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-4">
                        <FilterDropdown
                            label={t('performanceReport.paymentMethod')}
                            value={paymentMethodFilter}
                            onChange={setPaymentMethodFilter}
                            options={[{ value: 'all', label: t('performanceReport.allMethods') }, ...availablePaymentMethods.map(pm => ({ value: pm, label: pm }))]}
                        />
                        <FilterDropdown
                            label={t('performanceReport.till')}
                            value={tillIdFilter}
                            onChange={setTillIdFilter}
                            options={[{ value: 'all', label: t('performanceReport.allTills') }, ...availableTills.map(([id, name]) => ({ value: String(id), label: name }))]}
                        />
                        <FilterDropdown
                            label={t('performanceReport.status')}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                                { value: 'all', label: t('performanceReport.allStatuses') },
                                { value: 'completed', label: t('performanceReport.statusCompleted') },
                                { value: 'complimentary', label: t('performanceReport.statusComplimentary') },
                                { value: 'voided', label: t('performanceReport.statusVoided') }
                            ]}
                        />
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard title={t('performanceReport.totalRevenue')} value={userStats.totalRevenue} />
                        <StatCard title={t('performanceReport.transactions')} value={userStats.transactionCount} isCurrency={false} />
                        <StatCard title={t('performanceReport.averageSale')} value={userStats.averageSale} />
                        <StatCard title={t('performanceReport.totalTips')} value={userStats.totalTips} />
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-lg font-semibold text-slate-300 mb-2">{t('performanceReport.top5SellingItems')}</h4>
                            {userStats.topSellingItems.length > 0 ? (
                                <ul className="bg-slate-800 p-4 rounded-lg space-y-2">
                                    {userStats.topSellingItems.map(([name, count]) => (
                                        <li key={name} className="flex justify-between text-sm">
                                            <span className="font-semibold">{name}</span>
                                            <span className="text-slate-400">{count} {t('performanceReport.sold')}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (<p className="text-slate-500 text-sm bg-slate-800 p-4 rounded-lg text-center">{t('performanceReport.noItemsSold')}</p>)}
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-slate-300 mb-2">{t('performanceReport.top5RemovedItems')}</h4>
                            {userStats.topRemovedItems.length > 0 ? (
                                <ul className="bg-slate-800 p-4 rounded-lg space-y-2">
                                    {userStats.topRemovedItems.map(([name, count]) => (
                                        <li key={name} className="flex justify-between text-sm">
                                            <span className="font-semibold">{name}</span>
                                            <span className="text-red-400">{count} {t('performanceReport.removed')}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (<p className="text-slate-500 text-sm bg-slate-800 p-4 rounded-lg text-center">{t('performanceReport.noItemsRemoved')}</p>)}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-slate-300 mb-2">{t('performanceReport.detailedActivityLog')}</h4>
                        <div className="bg-slate-800 p-2 rounded-lg max-h-64 overflow-y-auto space-y-1">
                            {userStats.filteredLogs.length > 0 ? userStats.filteredLogs.map(log => (
                                <div key={log.id} className="bg-slate-900 p-3 rounded-md">
                                    <div className="flex justify-between items-start cursor-pointer" onClick={() => setExpandedLogId(prev => prev === log.id ? null : log.id)}>
                                        <div>
                                            <p className="font-semibold text-red-400">{log.action}</p>
                                            <p className="text-sm text-slate-300">
                                                {/* Fix: Use a type guard to ensure `log.details` is treated as a string, resolving a TypeScript error where an array of objects could not be rendered. */}
                                                {log.action === 'Order Cleared' 
                                                    ? t('performanceReport.clearedOrderWith', { count: Array.isArray(log.details) ? log.details.reduce((s,i)=>s+i.quantity,0) : '?' }) 
                                                    : (typeof log.details === 'string' ? log.details : null)
                                                }
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-slate-400 flex-shrink-0 ml-4">
                                            <p>{formatDate(log.createdAt)}</p>
                                        </div>
                                    </div>
                                    {expandedLogId === log.id && Array.isArray(log.details) && (
                                        <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-400 space-y-1">
                                            {log.details.map((item, index) => (
                                                 <div key={index} className="flex justify-between">
                                                    <span>{item.quantity} x {item.name}</span>
                                                    <span>{formatCurrency(item.price * item.quantity)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )) : <p className="text-slate-500 text-center p-4">{t('performanceReport.noActivityLogged')}</p>}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end p-6 pt-4 mt-auto border-t border-slate-700">
                    <button onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">{t('performanceReport.close')}</button>
                </div>
            </div>
        </div>
    );
};