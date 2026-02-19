import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/formatting';

interface HourlyDataPoint {
  hour: string;
  total: number;
  transactionCount: number;
  averageTransaction: number;
}

interface HourlySalesResult {
  date: string;
  businessDayStart: string;
  businessDayEnd: string;
  hourlyData: HourlyDataPoint[];
  summary: {
    totalSales: number;
    totalTransactions: number;
    peakHour: string;
    peakHourTotal: number;
    averageHourly: number;
  };
}

interface ComparisonResult {
  period1: HourlySalesResult;
  period2: HourlySalesResult;
  comparison: {
    hourlyDifferences: {
      hour: string;
      difference: number;
      percentChange: number;
    }[];
    summaryDifference: {
      totalSalesDifference: number;
      totalSalesPercentChange: number;
      transactionCountDifference: number;
      transactionCountPercentChange: number;
    };
  };
}

interface ComparisonChartProps {
  data: ComparisonResult;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({ data }) => {
  const { t } = useTranslation('admin');
  
  const maxSales = Math.max(
    ...data.period1.hourlyData.map(h => h.total),
    ...data.period2.hourlyData.map(h => h.total),
    1
  );
  
  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-700 p-4 rounded-lg">
          <h4 className="text-sm text-slate-400">{data.period1.date}</h4>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(data.period1.summary.totalSales)}
          </p>
          <p className="text-sm text-slate-400">
            {data.period1.summary.totalTransactions} {t('analytics.transactions')}
          </p>
        </div>
        <div className="bg-slate-700 p-4 rounded-lg">
          <h4 className="text-sm text-slate-400">{data.period2.date}</h4>
          <p className="text-2xl font-bold text-white">
            {formatCurrency(data.period2.summary.totalSales)}
          </p>
          <p className="text-sm text-slate-400">
            {data.period2.summary.totalTransactions} {t('analytics.transactions')}
          </p>
        </div>
      </div>
      
      {/* Difference Summary */}
      <div className={`p-4 rounded-lg mb-6 ${
        data.comparison.summaryDifference.totalSalesDifference >= 0 
          ? 'bg-green-900/30 border border-green-700' 
          : 'bg-red-900/30 border border-red-700'
      }`}>
        <div className="flex justify-between items-center">
          <span className="text-slate-300">{t('analytics.difference')}</span>
          <span className={`text-xl font-bold ${
            data.comparison.summaryDifference.totalSalesDifference >= 0 
              ? 'text-green-400' 
              : 'text-red-400'
          }`}>
            {data.comparison.summaryDifference.totalSalesDifference >= 0 ? '+' : ''}
            {formatCurrency(Math.abs(data.comparison.summaryDifference.totalSalesDifference))}
            {' '}({data.comparison.summaryDifference.totalSalesPercentChange >= 0 ? '+' : ''}
            {data.comparison.summaryDifference.totalSalesPercentChange.toFixed(1)}%)
          </span>
        </div>
      </div>
      
      {/* Hourly Comparison Bars */}
      <h3 className="text-xl font-bold text-slate-300 mb-4">{t('analytics.hourlyComparison')}</h3>
      <div className="space-y-2">
        {data.period1.hourlyData.map((hour1, index) => {
          const hour2 = data.period2.hourlyData[index];
          const diff = data.comparison.hourlyDifferences[index];
          
          return (
            <div key={hour1.hour} className="flex items-center gap-4">
              <span className="w-12 text-sm text-slate-400">{hour1.hour}</span>
              
              {/* Period 1 Bar */}
              <div className="flex-1 h-6 bg-slate-700 rounded relative">
                <div
                  className="absolute left-0 top-0 h-full bg-sky-500 rounded transition-all"
                  style={{ width: `${(hour1.total / maxSales) * 100}%` }}
                />
              </div>
              
              {/* Period 2 Bar */}
              <div className="flex-1 h-6 bg-slate-700 rounded relative">
                <div
                  className="absolute left-0 top-0 h-full bg-amber-500 rounded transition-all"
                  style={{ width: `${(hour2.total / maxSales) * 100}%` }}
                />
              </div>
              
              {/* Difference indicator */}
              <span className={`w-20 text-right text-sm ${
                diff.difference >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {diff.difference >= 0 ? '+' : ''}{diff.percentChange.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-sky-500 rounded" />
          <span className="text-sm text-slate-400">{data.period1.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded" />
          <span className="text-sm text-slate-400">{data.period2.date}</span>
        </div>
      </div>
    </div>
  );
};
