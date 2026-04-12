import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatDate } from '../utils/formatting';
import * as costApi from '../services/costManagementService';
import type { VarianceReportSummary, VarianceReportDetail } from '../services/costManagementService';

const REPORT_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-yellow-600/30 text-yellow-300',
  reviewed: 'bg-blue-600/30 text-blue-300',
  final: 'bg-green-600/30 text-green-300',
};

const ITEM_STATUS_CLASSES: Record<string, string> = {
  ok: 'bg-green-600/30 text-green-300',
  warning: 'bg-orange-600/30 text-orange-300',
  critical: 'bg-red-600/30 text-red-300',
  missing_data: 'bg-slate-600/30 text-slate-400',
};

function variancePercentColor(pct: number): string {
  const abs = Math.abs(pct);
  if (abs < 2) return 'text-green-400';
  if (abs <= 5) return 'text-orange-400';
  return 'text-red-400';
}

function ReportStatusBadge({ status }: { status: string }) {
  const cls = REPORT_STATUS_BADGE[status] || 'bg-slate-600/30 text-slate-300';
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function ItemStatusBadge({ status }: { status: string }) {
  const cls = ITEM_STATUS_CLASSES[status] || 'bg-slate-600/30 text-slate-300';
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

const GenerateReportSection: React.FC<{
  onGenerated: (report: VarianceReportDetail) => void;
}> = ({ onGenerated }) => {
  const { t } = useTranslation('admin');
  const [expanded, setExpanded] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = useCallback(async () => {
    if (!periodStart || !periodEnd) {
      setError(t('varianceReport.datesRequired', 'Start and end dates are required'));
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const report = await costApi.generateVarianceReport({ periodStart, periodEnd });
      onGenerated(report);
      setPeriodStart('');
      setPeriodEnd('');
      setExpanded(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('varianceReport.generateFailed', 'Failed to generate report'));
    } finally {
      setGenerating(false);
    }
  }, [periodStart, periodEnd, onGenerated, t]);

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <h3 className="text-lg font-semibold text-amber-400">
          {t('varianceReport.generateNew', 'Generate New Report')}
        </h3>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="px-6 pb-6 border-t border-slate-700 pt-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                {t('varianceReport.periodStart', 'Period Start')}
              </label>
              <input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                {t('varianceReport.periodEnd', 'Period End')}
              </label>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 min-h-11 rounded-md transition disabled:opacity-50"
            >
              {generating
                ? t('varianceReport.generating', 'Generating...')
                : t('varianceReport.generate', 'Generate Report')}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>
      )}
    </div>
  );
};

const ReportDetailPanel: React.FC<{
  report: VarianceReportDetail;
  onStatusChanged: () => void;
}> = ({ report, onStatusChanged }) => {
  const { t } = useTranslation('admin');
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = useCallback(async (newStatus: string) => {
    setUpdating(true);
    try {
      await costApi.updateVarianceReportStatus(report.id, newStatus);
      onStatusChanged();
    } catch {
      // error handled silently, list refresh will reflect state
    } finally {
      setUpdating(false);
    }
  }, [report.id, onStatusChanged]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {t('varianceReport.reportSummary', 'Report Summary')}
          </h3>
          <ReportStatusBadge status={report.status} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-slate-400">{t('varianceReport.theoreticalCost', 'Theoretical Cost')}</p>
            <p className="text-xl font-bold text-white">{formatCurrency(report.theoreticalCost)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">{t('varianceReport.actualCost', 'Actual Cost')}</p>
            <p className="text-xl font-bold text-white">{formatCurrency(report.actualCost)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">{t('varianceReport.varianceValue', 'Variance Value')}</p>
            <p className={`text-xl font-bold ${variancePercentColor(report.variancePercent)}`}>
              {formatCurrency(report.varianceValue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-slate-400">{t('varianceReport.variancePercent', 'Variance %')}</p>
            <p className={`text-xl font-bold ${variancePercentColor(report.variancePercent)}`}>
              {report.variancePercent.toFixed(1)}%
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-700 flex items-center gap-4 text-sm text-slate-400">
          <span>
            {t('varianceReport.period', 'Period')}: {new Date(report.periodStart).toLocaleDateString()} - {new Date(report.periodEnd).toLocaleDateString()}
          </span>
          <span>
            {t('varianceReport.createdBy', 'Created by')}: {report.createdByName}
          </span>
          <span>
            {t('varianceReport.createdAt', 'Created')}: {formatDate(report.createdAt)}
          </span>
        </div>
      </div>

      {report.items.length > 0 && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <h4 className="text-md font-semibold text-white">
              {t('varianceReport.ingredientDetails', 'Ingredient Details')} ({report.items.length})
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-700">
                  <th className="px-4 py-3 text-left text-slate-300 font-medium">{t('varianceReport.ingredient', 'Ingredient')}</th>
                  <th className="px-4 py-3 text-right text-slate-300 font-medium">{t('varianceReport.theoreticalQty', 'Theoretical Qty')}</th>
                  <th className="px-4 py-3 text-right text-slate-300 font-medium">{t('varianceReport.actualQty', 'Actual Qty')}</th>
                  <th className="px-4 py-3 text-right text-slate-300 font-medium">{t('varianceReport.varianceQty', 'Variance Qty')}</th>
                  <th className="px-4 py-3 text-right text-slate-300 font-medium">{t('varianceReport.unitCost', 'Unit Cost')}</th>
                  <th className="px-4 py-3 text-right text-slate-300 font-medium">{t('varianceReport.varianceValue', 'Variance Value')}</th>
                  <th className="px-4 py-3 text-right text-slate-300 font-medium">{t('varianceReport.variancePercent', 'Variance %')}</th>
                  <th className="px-4 py-3 text-center text-slate-300 font-medium">{t('varianceReport.status', 'Status')}</th>
                </tr>
              </thead>
              <tbody>
                {report.items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-700 hover:bg-slate-700/50">
                    <td className="px-4 py-3 text-white">
                      {item.stockItemName}
                      {item.notes && (
                        <p className="text-xs text-slate-500 mt-1">{item.notes}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{item.theoreticalQty.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{item.actualQty.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${variancePercentColor(item.variancePercent)}`}>
                      {item.varianceQty.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{formatCurrency(item.unitCost)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${variancePercentColor(item.variancePercent)}`}>
                      {formatCurrency(item.varianceValue)}
                    </td>
                    <td className={`px-4 py-3 text-right font-medium ${variancePercentColor(item.variancePercent)}`}>
                      {item.variancePercent.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ItemStatusBadge status={item.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h4 className="text-md font-semibold text-white mb-3">
          {t('varianceReport.possibleCauses', 'Possible Causes')}
        </h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
          <li>{t('varianceReport.causeSpillage', 'Spillage or waste during preparation')}</li>
          <li>{t('varianceReport.causeOverPortion', 'Over-portioning by staff')}</li>
          <li>{t('varianceReport.causeTheft', 'Unauthorized consumption or theft')}</li>
          <li>{t('varianceReport.causeReceivingError', 'Receiving errors - quantity mismatch on delivery')}</li>
          <li>{t('varianceReport.causeCountingError', 'Inventory counting errors')}</li>
          <li>{t('varianceReport.causeRecipeDrift', 'Recipe drift - actual usage differs from recipe spec')}</li>
          <li>{t('varianceReport.causeSpoilage', 'Unrecorded spoilage or expired items')}</li>
        </ul>
      </div>

      {report.status !== 'final' && (
        <div className="flex gap-3">
          {report.status === 'draft' && (
            <button
              onClick={() => handleStatusUpdate('reviewed')}
              disabled={updating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 min-h-11 rounded-md transition disabled:opacity-50"
            >
              {t('varianceReport.markReviewed', 'Mark as Reviewed')}
            </button>
          )}
          <button
            onClick={() => handleStatusUpdate('final')}
            disabled={updating}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 min-h-11 rounded-md transition disabled:opacity-50"
          >
            {t('varianceReport.markFinal', 'Mark as Final')}
          </button>
        </div>
      )}
    </div>
  );
};

const VarianceReportPanel: React.FC = () => {
  const { t } = useTranslation('admin');

  const [reports, setReports] = useState<VarianceReportSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<VarianceReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const limit = 10;

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await costApi.fetchVarianceReports(page, limit);
      setReports(result.reports);
      setTotalCount(result.totalCount);
    } catch {
      setError(t('varianceReport.loadFailed', 'Failed to load variance reports'));
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const loadDetail = useCallback(async (id: number) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const result = await costApi.fetchVarianceReport(id);
      setDetail(result);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const handleReportGenerated = useCallback((report: VarianceReportDetail) => {
    setSelectedId(report.id);
    setDetail(report);
    setPage(1);
    loadReports();
  }, [loadReports]);

  const handleStatusChanged = useCallback(() => {
    if (selectedId) loadDetail(selectedId);
    loadReports();
  }, [selectedId, loadDetail, loadReports]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">
        {t('varianceReport.title', 'Variance Analysis Report')}
      </h2>

      <GenerateReportSection onGenerated={handleReportGenerated} />

      {loading ? (
        <div className="py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto" />
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-300">{error}</div>
      ) : reports.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center text-slate-400">
          {t('varianceReport.noReports', 'No variance reports found. Generate one to get started.')}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700">
                <h3 className="text-md font-semibold text-white">
                  {t('varianceReport.reports', 'Reports')} ({totalCount})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-700">
                      <th className="px-4 py-3 text-left text-slate-300 font-medium">{t('varianceReport.period', 'Period')}</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">{t('varianceReport.variance', 'Variance')}</th>
                      <th className="px-4 py-3 text-right text-slate-300 font-medium">{t('varianceReport.variancePercent', 'Var %')}</th>
                      <th className="px-4 py-3 text-center text-slate-300 font-medium">{t('varianceReport.status', 'Status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => loadDetail(r.id)}
                        className={`border-t border-slate-700 cursor-pointer transition ${
                          selectedId === r.id
                            ? 'bg-amber-500/10 border-l-2 border-l-amber-500'
                            : 'hover:bg-slate-700/50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <p className="text-white text-xs">
                            {new Date(r.periodStart).toLocaleDateString()}
                          </p>
                          <p className="text-slate-400 text-xs">
                            {new Date(r.periodEnd).toLocaleDateString()}
                          </p>
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${variancePercentColor(r.variancePercent)}`}>
                          {formatCurrency(r.varianceValue)}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${variancePercentColor(r.variancePercent)}`}>
                          {r.variancePercent.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ReportStatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-700">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="bg-slate-700 hover:bg-slate-600 text-white rounded-md transition min-h-11 px-4 py-2 disabled:opacity-50"
                  >
                    {t('varianceReport.previous', 'Previous')}
                  </button>
                  <span className="text-sm text-slate-400">
                    {t('varianceReport.pageInfo', 'Page {{current}} of {{total}}', { current: page, total: totalPages })}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="bg-slate-700 hover:bg-slate-600 text-white rounded-md transition min-h-11 px-4 py-2 disabled:opacity-50"
                  >
                    {t('varianceReport.next', 'Next')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-2">
            {selectedId === null ? (
              <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center text-slate-400">
                {t('varianceReport.selectReport', 'Select a report to view details')}
              </div>
            ) : detailLoading ? (
              <div className="py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto" />
              </div>
            ) : detail ? (
              <ReportDetailPanel report={detail} onStatusChanged={handleStatusChanged} />
            ) : (
              <div className="bg-slate-800 rounded-lg p-8 border border-slate-700 text-center text-red-300">
                {t('varianceReport.loadDetailFailed', 'Failed to load report details')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export { VarianceReportPanel };
export default VarianceReportPanel;
