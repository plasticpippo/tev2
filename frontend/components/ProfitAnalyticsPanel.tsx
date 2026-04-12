import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { formatCurrency } from '../utils/formatting';
import { getAuthHeaders, isAuthTokenReady } from '../services/apiBase';
import {
  fetchProfitDashboard,
  type ProfitDashboardData,
  type ProfitSummary,
} from '../services/costManagementService';

type DateRange = 'today' | 'last7Days' | 'last30Days' | 'thisMonth' | 'custom';

const getDateRange = (range: DateRange): { startDate: string; endDate: string } => {
  const today = new Date();
  const fmt = (d: Date) => format(d, 'yyyy-MM-dd');

  switch (range) {
    case 'today':
      return { startDate: fmt(today), endDate: fmt(today) };
    case 'last7Days':
      return { startDate: fmt(subDays(today, 6)), endDate: fmt(today) };
    case 'last30Days':
      return { startDate: fmt(subDays(today, 29)), endDate: fmt(today) };
    case 'thisMonth':
      return { startDate: fmt(startOfMonth(today)), endDate: fmt(endOfMonth(today)) };
    case 'custom':
      return { startDate: fmt(today), endDate: fmt(today) };
  }
};

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
};

const marginColor = (margin: number | null | undefined): string => {
  if (margin === null || margin === undefined) return 'text-slate-400';
  if (margin >= 60) return 'text-green-400';
  if (margin >= 30) return 'text-amber-400';
  return 'text-red-400';
};

const marginBgColor = (margin: number | null | undefined): string => {
  if (margin === null || margin === undefined) return 'bg-slate-600';
  if (margin >= 60) return 'bg-green-500';
  if (margin >= 30) return 'bg-amber-500';
  return 'bg-red-500';
};

const ChangeIndicator: React.FC<{ value: number | null | undefined; suffix?: string }> = ({
  value,
  suffix = '%',
}) => {
  if (value === null || value === undefined) return null;
  const isPositive = value >= 0;
  return (
    <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
      {isPositive ? '+' : ''}
      {value.toFixed(1)}
      {suffix}
    </span>
  );
};

export const ProfitAnalyticsPanel: React.FC = () => {
  const { t } = useTranslation('admin');
  const [dateRange, setDateRange] = useState<DateRange>('last7Days');
  const [customStart, setCustomStart] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState<ProfitDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (isAuthTokenReady()) {
      setAuthReady(true);
    } else {
      const interval = setInterval(() => {
        if (isAuthTokenReady()) {
          setAuthReady(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  const activeDateRange = useMemo(() => {
    if (dateRange === 'custom') {
      return { startDate: customStart, endDate: customEnd };
    }
    return getDateRange(dateRange);
  }, [dateRange, customStart, customEnd]);

  useEffect(() => {
    if (!authReady) return;
    loadDashboard();
  }, [authReady, dateRange, customStart, customEnd]);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchProfitDashboard(activeDateRange.startDate, activeDateRange.endDate);
      setData(result);
    } catch (err) {
      console.error('Failed to fetch profit dashboard:', err);
      setError(t('analytics.noData'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const DateRangeButton: React.FC<{ range: DateRange; label: string }> = ({ range, label }) => (
    <button
      onClick={() => setDateRange(range)}
      className={`text-center px-4 py-2 min-h-11 text-sm font-semibold rounded-md transition ${
        dateRange === range ? 'bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600'
      }`}
    >
      {label}
    </button>
  );

  const summary: ProfitSummary | null = data?.summary ?? null;
  const comparison = data?.comparison ?? null;
  const categories = data?.byCategory ?? [];
  const products = data?.byProduct ?? [];
  const trend = data?.trend ?? [];

  const maxTrendMargin = useMemo(() => {
    if (trend.length === 0) return 100;
    const max = Math.max(...trend.map((d) => d.marginPercent));
    return Math.max(max, 1);
  }, [trend]);

  const maxCategoryRevenue = useMemo(() => {
    if (categories.length === 0) return 1;
    return Math.max(...categories.map((c) => c.revenue), 1);
  }, [categories]);

  const topProducts = useMemo(() => {
    return [...products]
      .filter((p) => p.hasCostData && p.marginPercent !== null)
      .sort((a, b) => (b.marginPercent ?? 0) - (a.marginPercent ?? 0))
      .slice(0, 10);
  }, [products]);

  const costCoverage = summary?.costCoveragePercent ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-300 self-start sm:self-center">
          {t('profitAnalytics.title', 'Profit Analytics')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <DateRangeButton range="today" label={t('analytics.today')} />
          <DateRangeButton range="last7Days" label={t('analytics.last7Days')} />
          <DateRangeButton range="last30Days" label={t('analytics.last30Days')} />
          <DateRangeButton range="thisMonth" label={t('profitAnalytics.thisMonth', 'This Month')} />
          <DateRangeButton range="custom" label={t('analytics.custom')} />
        </div>
      </div>

      {dateRange === 'custom' && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">{t('analytics.startDate')}</label>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              max={customEnd}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">{t('analytics.endDate')}</label>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              min={customStart}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto" />
          <p className="text-slate-400 mt-4">{t('analytics.loading')}</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="text-center py-10 bg-slate-800 rounded-lg">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!isLoading && !error && summary && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-lg p-5">
              <p className="text-sm text-slate-400 mb-1">
                {t('profitAnalytics.revenue', 'Revenue')}
              </p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summary.revenue)}</p>
              {comparison && (
                <div className="mt-2">
                  <ChangeIndicator value={comparison.changes.revenueChangePercent} />
                  <span className="text-xs text-slate-500 ml-1">
                    {t('profitAnalytics.vsPrevPeriod', 'vs prev period')}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-slate-800 rounded-lg p-5">
              <p className="text-sm text-slate-400 mb-1">
                {t('profitAnalytics.cogs', 'COGS')}
              </p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summary.cogs)}</p>
              {comparison && (
                <div className="mt-2">
                  <ChangeIndicator value={comparison.changes.cogsChangePercent} />
                  <span className="text-xs text-slate-500 ml-1">
                    {t('profitAnalytics.vsPrevPeriod', 'vs prev period')}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-slate-800 rounded-lg p-5">
              <p className="text-sm text-slate-400 mb-1">
                {t('profitAnalytics.grossProfit', 'Gross Profit')}
              </p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(summary.grossProfit)}
              </p>
              {comparison && (
                <div className="mt-2">
                  <ChangeIndicator value={comparison.changes.grossProfitChangePercent} />
                  <span className="text-xs text-slate-500 ml-1">
                    {t('profitAnalytics.vsPrevPeriod', 'vs prev period')}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-slate-800 rounded-lg p-5">
              <p className="text-sm text-slate-400 mb-1">
                {t('profitAnalytics.marginPercent', 'Margin %')}
              </p>
              <p className={`text-2xl font-bold ${marginColor(summary.marginPercent)}`}>
                {formatPercent(summary.marginPercent)}
              </p>
              {comparison && (
                <div className="mt-2">
                  <ChangeIndicator value={comparison.changes.marginChangePp} suffix="pp" />
                  <span className="text-xs text-slate-500 ml-1">
                    {t('profitAnalytics.vsPrevPeriod', 'vs prev period')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {trend.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-slate-300 mb-4">
                {t('profitAnalytics.marginTrend', 'Margin Trend')}
              </h3>
              <div className="flex items-end gap-1 h-48">
                {trend.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center min-w-0">
                    <span className="text-xs text-slate-400 mb-1">
                      {formatPercent(d.marginPercent)}
                    </span>
                    <div
                      className={`w-full rounded-t ${marginBgColor(d.marginPercent)}`}
                      style={{ height: `${Math.max((d.marginPercent / maxTrendMargin) * 100, 2)}%` }}
                      title={`${format(new Date(d.date), 'dd MMM')}: ${formatPercent(d.marginPercent)} | Revenue: ${formatCurrency(d.revenue)}`}
                    />
                    <span className="text-xs text-slate-400 mt-1 truncate w-full text-center">
                      {format(new Date(d.date), 'dd')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-slate-300 mb-4">
                {t('profitAnalytics.categoryBreakdown', 'Category Breakdown')}
              </h3>
              <div className="space-y-4">
                {categories.map((cat) => (
                  <div key={cat.categoryId}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-slate-300">{cat.categoryName}</span>
                      <span className={`text-sm font-semibold ${marginColor(cat.marginPercent)}`}>
                        {formatPercent(cat.marginPercent)}
                      </span>
                    </div>
                    <div className="relative h-6 bg-slate-700 rounded overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-amber-500/70 rounded"
                        style={{ width: `${(cat.revenue / maxCategoryRevenue) * 100}%` }}
                      />
                      <div
                        className="absolute inset-y-0 left-0 bg-red-500/50 rounded"
                        style={{ width: `${(cat.cogs / maxCategoryRevenue) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-amber-400">
                        {t('profitAnalytics.revenue', 'Rev')}: {formatCurrency(cat.revenue)}
                      </span>
                      <span className="text-xs text-red-400">
                        {t('profitAnalytics.cogs', 'COGS')}: {formatCurrency(cat.cogs)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {topProducts.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-5">
              <h3 className="text-lg font-semibold text-slate-300 mb-4">
                {t('profitAnalytics.topProductsByMargin', 'Top Products by Margin')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-2 text-slate-400 font-medium">
                        {t('profitAnalytics.product', 'Product')}
                      </th>
                      <th className="text-left py-3 px-2 text-slate-400 font-medium">
                        {t('profitAnalytics.variant', 'Variant')}
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">
                        {t('profitAnalytics.revenue', 'Revenue')}
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">
                        {t('profitAnalytics.cogs', 'COGS')}
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">
                        {t('profitAnalytics.grossProfit', 'Margin')}
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">
                        {t('profitAnalytics.marginPercent', 'Margin %')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p) => (
                      <tr key={`${p.productId}-${p.variantId}`} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-3 px-2 text-slate-300">{p.productName}</td>
                        <td className="py-3 px-2 text-slate-400">{p.variantName}</td>
                        <td className="py-3 px-2 text-right text-slate-300">
                          {formatCurrency(p.revenue)}
                        </td>
                        <td className="py-3 px-2 text-right text-slate-400">
                          {formatCurrency(p.cogs)}
                        </td>
                        <td className="py-3 px-2 text-right text-slate-300">
                          {formatCurrency(p.grossProfit)}
                        </td>
                        <td className={`py-3 px-2 text-right font-semibold ${marginColor(p.marginPercent)}`}>
                          {formatPercent(p.marginPercent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-slate-800 rounded-lg p-5">
            <div className="flex items-start gap-3">
              {costCoverage < 50 ? (
                <>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <span className="text-amber-500 font-bold text-sm">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-400">
                      {t('profitAnalytics.costCoverageWarning', 'Low Cost Coverage')}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      {t(
                        'profitAnalytics.costCoverageWarningDesc',
                        'Only {{percent}}% of transactions have cost data. Add ingredient costs to more products for accurate profit tracking.',
                        { percent: costCoverage.toFixed(0) }
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 font-bold text-sm">i</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      {t('profitAnalytics.costCoverage', 'Cost Coverage')}
                    </p>
                    <p className="text-sm text-slate-400 mt-1">
                      {t(
                        'profitAnalytics.costCoverageDesc',
                        '{{percent}}% of transactions include cost data.',
                        { percent: costCoverage.toFixed(0) }
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {!isLoading && !error && !summary && (
        <div className="text-center py-20 bg-slate-800 rounded-lg">
          <p className="text-slate-400">{t('analytics.noData')}</p>
        </div>
      )}
    </div>
  );
};

export default ProfitAnalyticsPanel;
