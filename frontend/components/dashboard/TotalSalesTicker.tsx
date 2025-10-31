

import React, { useMemo } from 'react';
import type { Transaction, Settings } from '../../../shared/types';
import { formatCurrency } from '../../utils/formatting';
import { getBusinessDayStart, isWithinBusinessDay } from '../../utils/time';

const StatCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
    <div className="bg-slate-800 p-4 rounded-lg text-center">
        <p className="text-sm text-slate-400">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
);

export const TotalSalesTicker: React.FC<{ transactions: Transaction[], settings: Settings }> = ({ transactions, settings }) => {
    const dailyStats = useMemo(() => {
        const businessDayStart = getBusinessDayStart(settings);
        const todaysTransactions = transactions.filter(t => isWithinBusinessDay(t.createdAt, businessDayStart));
        
        const totalRevenue = todaysTransactions.reduce((sum, t) => sum + t.total, 0);
        const totalSubtotal = todaysTransactions.reduce((sum, t) => sum + t.subtotal, 0);
        const totalTax = todaysTransactions.reduce((sum, t) => sum + t.tax, 0);
        const totalTips = todaysTransactions.reduce((sum, t) => sum + t.tip, 0);

        const { totalCash, totalCard } = todaysTransactions.reduce((acc, t) => {
            if (t.paymentMethod === 'Cash') {
                acc.totalCash += t.total;
            } else if (t.paymentMethod === 'Card') {
                acc.totalCard += t.total;
            }
            return acc;
        }, { totalCash: 0, totalCard: 0 });
        
        return { totalRevenue, totalSubtotal, totalTax, totalTips, totalCash, totalCard };
    }, [transactions, settings]);

    return (
        <div className="flex-shrink-0 bg-slate-900 p-4 rounded-lg">
             <h2 className="text-xl font-bold text-slate-300 mb-3 text-center">Current Business Day Sales (All Tills)</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard title="Total Revenue" value={formatCurrency(dailyStats.totalRevenue)} color="text-green-400" />
                <StatCard title="Total Cash" value={formatCurrency(dailyStats.totalCash)} color="text-green-400" />
                <StatCard title="Total Card" value={formatCurrency(dailyStats.totalCard)} color="text-green-400" />
                <StatCard title="Net Sales" value={formatCurrency(dailyStats.totalSubtotal)} color="text-sky-400" />
                <StatCard title="Total Tax" value={formatCurrency(dailyStats.totalTax)} color="text-slate-300" />
                <StatCard title="Total Tips" value={formatCurrency(dailyStats.totalTips)} color="text-amber-400" />
            </div>
        </div>
    );
};