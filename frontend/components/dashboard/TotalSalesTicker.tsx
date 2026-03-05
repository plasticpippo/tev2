

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction, Settings } from '../@shared/types';
import { getBusinessDayStart, isWithinBusinessDay } from '../../utils/time';
import { addMoney, roundMoney, formatMoney } from '../../utils/money';

const StatCard: React.FC<{ title: string; value: string; color: string }> = ({ title, value, color }) => (
    <div className="bg-slate-800 p-4 rounded-lg text-center">
        <p className="text-sm text-slate-400">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
);

export const TotalSalesTicker: React.FC<{ transactions: Transaction[], settings: Settings }> = ({ transactions, settings }) => {
    const { t } = useTranslation('admin');
    
    const dailyStats = useMemo(() => {
        const businessDayStart = getBusinessDayStart(settings);
        const todaysTransactions = transactions.filter(t => isWithinBusinessDay(t.createdAt, businessDayStart));
        
        // grossSales is the sum of all transaction totals (before discounts)
        const grossSales = roundMoney(todaysTransactions.reduce((sum, t) => addMoney(sum, t.total), 0));
        // totalDiscounts is the sum of all discounts
        const totalDiscounts = roundMoney(todaysTransactions.reduce((sum, t) => addMoney(sum, t.discount || 0), 0));
        // netSales = grossSales - totalDiscounts (this matches backend calculation)
        const netSales = roundMoney(grossSales - totalDiscounts);
        const totalSubtotal = roundMoney(todaysTransactions.reduce((sum, t) => addMoney(sum, t.subtotal), 0));
        const totalTax = roundMoney(todaysTransactions.reduce((sum, t) => addMoney(sum, t.tax), 0));
        const totalTips = roundMoney(todaysTransactions.reduce((sum, t) => addMoney(sum, t.tip), 0));

        const { totalCash, totalCard } = todaysTransactions.reduce((acc, t) => {
            if (t.paymentMethod === 'Cash') {
                acc.totalCash = addMoney(acc.totalCash, t.total);
            } else if (t.paymentMethod === 'Card') {
                acc.totalCard = addMoney(acc.totalCard, t.total);
            }
            return acc;
        }, { totalCash: 0, totalCard: 0 });
        
        return { 
            grossSales: roundMoney(grossSales),
            netSales: roundMoney(netSales),
            totalDiscounts: roundMoney(totalDiscounts),
            totalSubtotal: roundMoney(totalSubtotal), 
            totalTax: roundMoney(totalTax), 
            totalTips: roundMoney(totalTips), 
            totalCash: roundMoney(totalCash), 
            totalCard: roundMoney(totalCard) 
        };
    }, [transactions, settings]);

    return (
        <div className="flex-shrink-0 bg-slate-900 p-4 rounded-lg">
             <h2 className="text-xl font-bold text-slate-300 mb-3 text-center">{t('dashboard.currentBusinessDaySales')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard title={t('dashboard.grossSales')} value={formatMoney(dailyStats.grossSales)} color="text-green-400" />
                <StatCard title={t('dashboard.totalCash')} value={formatMoney(dailyStats.totalCash)} color="text-green-400" />
                <StatCard title={t('dashboard.totalCard')} value={formatMoney(dailyStats.totalCard)} color="text-green-400" />
                <StatCard title={t('dashboard.netSales')} value={formatMoney(dailyStats.netSales)} color="text-sky-400" />
                <StatCard title={t('dashboard.totalTax')} value={formatMoney(dailyStats.totalTax)} color="text-slate-300" />
                <StatCard title={t('dashboard.totalTips')} value={formatMoney(dailyStats.totalTips)} color="text-amber-400" />
            </div>
        </div>
    );
};