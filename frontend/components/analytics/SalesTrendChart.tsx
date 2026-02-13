import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Transaction } from '../@shared/types';
import { formatCurrency } from '../../utils/formatting';

interface SalesTrendChartProps {
    transactions: Transaction[];
    dateRange: 'week' | 'month' | 'year';
}

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({ transactions, dateRange }) => {
    const { t } = useTranslation();

    const trendData = useMemo(() => {
        const dataMap = new Map<string, number>();
        const now = new Date();

        if (dateRange === 'year') {
            // Group transactions by month (YYYY-MM)
            transactions.forEach(t => {
                const date = new Date(t.createdAt);
                const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
                const currentTotal = dataMap.get(key) || 0;
                dataMap.set(key, currentTotal + t.total);
            });

            // Generate labels and data for the last 12 months to ensure no gaps
            const result = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
                const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                result.push({ label, total: dataMap.get(key) || 0 });
            }
            return result;
        } else { // 'week' or 'month' - group by day
            // Group transactions by day (YYYY-MM-DD)
            transactions.forEach(t => {
                const date = new Date(t.createdAt);
                const key = date.toISOString().split('T')[0];
                const currentTotal = dataMap.get(key) || 0;
                dataMap.set(key, currentTotal + t.total);
            });

            // Generate labels and data for the last 7 or 30 days
            const days = dateRange === 'week' ? 7 : 30;
            const result = [];
            for (let i = days - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const key = d.toISOString().split('T')[0];
                const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                result.push({ label, total: dataMap.get(key) || 0 });
            }
            return result;
        }
    }, [transactions, dateRange]);

    const maxSales = Math.max(...trendData.map(d => d.total), 1);
    const dateRangeKey = dateRange === 'week' ? 'last7Days' : dateRange === 'month' ? 'last30Days' : 'last12Months';
    const title = t('salesTrendChart.title', { dateRange: t(`dateTime.${dateRangeKey}`) });

    return (
        <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-slate-300 mb-4">{title}</h3>
            <div>
                <div className="flex justify-between items-end h-64 space-x-1">
                    {trendData.map((day, index) => (
                        <div key={index} className="flex-1 h-full flex flex-col justify-end items-center group relative">
                            <div className="absolute -top-6 bg-slate-900 border border-slate-600 text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {formatCurrency(day.total)}
                            </div>
                            <div
                                className="w-full bg-sky-600 hover:bg-sky-500 rounded-t transition-all"
                                style={{ height: `${(day.total / maxSales) * 100}%` }}
                            ></div>
                            <div className="text-xs text-slate-400 mt-1 text-center">{day.label}</div>
                        </div>
                    ))}
                </div>
                <div className="border-t border-slate-600 mt-2"></div>
            </div>
        </div>
    );
};