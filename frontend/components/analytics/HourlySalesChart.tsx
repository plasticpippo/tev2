import React, { useMemo } from 'react';
import type { Transaction, Settings } from '../@shared/types';
import { formatCurrency } from '../../utils/formatting';
import { getBusinessDayStart } from '../../utils/time';

interface HourlySalesChartProps {
    transactions: Transaction[];
    settings: Settings;
}

export const HourlySalesChart: React.FC<HourlySalesChartProps> = ({ transactions, settings }) => {

    const hourlyData = useMemo(() => {
        const businessDayStart = getBusinessDayStart(settings);
        const startHour = businessDayStart.getHours();
        
        const hours = Array.from({ length: 24 }, (_, i) => {
            const hour = (startHour + i) % 24;
            const label = `${hour.toString().padStart(2, '0')}:00`;
            return { label, total: 0 };
        });

        transactions.forEach(t => {
            const transactionDate = new Date(t.createdAt);
            // Calculate how many hours have passed since the business day started
            const hoursSinceStart = Math.floor((transactionDate.getTime() - businessDayStart.getTime()) / (1000 * 60 * 60));
            if (hoursSinceStart >= 0 && hoursSinceStart < 24) {
                hours[hoursSinceStart].total += t.total;
            }
        });

        return hours;
    }, [transactions, settings]);

    const maxSales = Math.max(...hourlyData.map(h => h.total), 1); // Avoid division by zero

    return (
        <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-slate-300 mb-4">Hourly Sales Performance</h3>
            <div>
                <div className="flex justify-between items-end h-64 space-x-1">
                    {hourlyData.map((hour, index) => (
                        <div
                            key={index}
                            className="flex-1 h-full flex flex-col justify-end items-center group relative"
                        >
                            <div className="absolute -top-6 w-max bg-slate-900 border border-slate-600 text-white text-xs rounded py-1 px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {hour.label}: {formatCurrency(hour.total)}
                            </div>
                            <div
                                className="w-full bg-sky-600 hover:bg-sky-500 rounded-t transition-all duration-300"
                                style={{ height: `${(hour.total / maxSales) * 100}%` }}
                            ></div>
                            <div className="text-xs text-slate-400 mt-1 text-center">{hour.label.split(':')[0]}</div>
                        </div>
                    ))}
                </div>
                <div className="border-t border-slate-600 mt-2"></div>
            </div>
        </div>
    );
};