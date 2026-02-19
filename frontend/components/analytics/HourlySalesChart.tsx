import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import type { Transaction, Settings } from '../../shared/types';
import { formatCurrency } from '../../utils/formatting';
import { getBusinessDayStart } from '../../utils/time';

interface HourlyDataPoint {
  hour: string;
  total: number;
  transactionCount: number;
  averageTransaction?: number;
}

interface HourlySalesData {
  date: string;
  businessDayStart: string;
  businessDayEnd: string;
  hourlyData: HourlyDataPoint[];
  summary: {
    totalSales: number;
    totalTransactions: number;
    peakHour: string;
    peakHourTotal?: number;
    averageHourly?: number;
  };
}

interface HourlySalesChartProps {
  transactions: Transaction[];
  settings: Settings;
  hourlyData?: HourlySalesData;
  targetDate?: Date;
}

interface HourData {
  label: string;
  total: number;
  transactionCount: number;
}

export const HourlySalesChart: React.FC<HourlySalesChartProps> = ({ 
  transactions, 
  settings,
  hourlyData: serverData,
  targetDate
}) => {
  const { t } = useTranslation();

  // Use server-side data if available, otherwise fall back to client-side calculation
  const hourlyData = useMemo((): HourData[] => {
    if (serverData) {
      return serverData.hourlyData.map(h => ({
        label: h.hour,
        total: h.total,
        transactionCount: h.transactionCount
      }));
    }
    
    // Fallback to client-side calculation for backward compatibility
    const businessDayStart = getBusinessDayStart(settings);
    const startHour = businessDayStart.getHours();
    
    const hours: HourData[] = Array.from({ length: 24 }, (_, i) => {
      const hour = (startHour + i) % 24;
      const label = `${hour.toString().padStart(2, '0')}:00`;
      return { label, total: 0, transactionCount: 0 };
    });

    transactions.forEach(t => {
      const transactionDate = new Date(t.createdAt);
      // Calculate how many hours have passed since the business day started
      const hoursSinceStart = Math.floor((transactionDate.getTime() - businessDayStart.getTime()) / (1000 * 60 * 60));
      if (hoursSinceStart >= 0 && hoursSinceStart < 24) {
        hours[hoursSinceStart].total += t.total;
        hours[hoursSinceStart].transactionCount += 1;
      }
    });

    return hours;
  }, [transactions, settings, serverData]);

  const maxSales = Math.max(...hourlyData.map(h => h.total), 1);
  
  // Calculate summary from data
  const summary = useMemo(() => {
    if (serverData?.summary) {
      return serverData.summary;
    }
    
    const totalSales = hourlyData.reduce((sum, h) => sum + h.total, 0);
    const totalTransactions = hourlyData.reduce((sum, h) => sum + h.transactionCount, 0);
    const peakHourData = hourlyData.reduce((max, h) => h.total > max.total ? h : max, hourlyData[0]);
    
    return {
      totalSales,
      totalTransactions,
      peakHour: peakHourData.label,
    };
  }, [hourlyData, serverData]);

  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      {/* Title with date if specified */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-300">
          {t('hourlySalesChart.title')}
          {targetDate && (
            <span className="text-sm font-normal text-slate-400 ml-2">
              {format(targetDate, 'MMM d, yyyy')}
            </span>
          )}
        </h3>
        
        {/* Summary badges */}
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-400">{t('analytics.totalSales')}</p>
            <p className="text-lg font-bold text-white">{formatCurrency(summary.totalSales)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">{t('analytics.peakHour')}</p>
            <p className="text-lg font-bold text-amber-400">{summary.peakHour}</p>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div>
        <div className="flex justify-between items-end h-64 space-x-1">
          {hourlyData.map((hour, index) => (
            <div
              key={index}
              className="flex-1 h-full flex flex-col justify-end items-center group relative"
            >
              {/* Tooltip */}
              <div className="absolute -top-6 w-max bg-slate-900 border border-slate-600 text-white text-xs rounded py-1 px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div>{hour.label}</div>
                <div className="font-bold">{formatCurrency(hour.total)}</div>
                <div className="text-slate-400">{hour.transactionCount} transactions</div>
              </div>
              
              {/* Bar */}
              <div
                className={`w-full rounded-t transition-all duration-300 ${
                  hour.label === summary.peakHour 
                    ? 'bg-amber-500 hover:bg-amber-400' 
                    : 'bg-sky-600 hover:bg-sky-500'
                }`}
                style={{ height: `${(hour.total / maxSales) * 100}%` }}
              />
              
              {/* Hour label */}
              <div className="text-xs text-slate-400 mt-1 text-center">
                {hour.label.split(':')[0]}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-600 mt-2" />
      </div>
    </div>
  );
};
