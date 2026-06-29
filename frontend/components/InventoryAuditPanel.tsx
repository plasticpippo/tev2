import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getInventoryAudit } from '../services/transactionService';
import type { InventoryAuditResult } from '../../shared/types';
import { formatDate } from '../utils/formatting';

export const InventoryAuditPanel: React.FC = () => {
  const { t } = useTranslation('admin');
  const [auditResult, setAuditResult] = useState<InventoryAuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loadAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: { from?: string; to?: string } = {};
      if (fromDate) filters.from = fromDate;
      if (toDate) filters.to = toDate;

      const result = await getInventoryAudit(filters);
      setAuditResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  const handleRunAudit = () => {
    loadAudit();
  };

  const formatIssue = (issue: string): string => {
    if (issue === 'none_no_recipe') {
      return 'No inventory deducted - no recipe';
    }
    if (issue === 'orphaned_reference') {
      return 'Orphaned stock reference';
    }
    if (issue.startsWith('recipe_item_zero_deduction:')) {
      const itemName = issue.split(':')[1];
      return `Recipe item has zero deduction: ${itemName}`;
    }
    return issue;
  };

  return (
    <div className="h-full flex flex-col p-4">
      <h2 className="text-2xl font-bold text-slate-300 mb-4">Inventory Audit</h2>

      <div className="bg-slate-800 p-4 rounded-lg mb-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-48">
            <label className="block text-sm text-slate-400 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-sm text-slate-400 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-slate-700 text-white rounded px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleRunAudit}
            className="bg-amber-500 hover:bg-amber-400 text-white font-bold py-2 px-4 rounded-md transition"
          >
            Run Audit
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 text-red-400 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-slate-400 py-8">Loading audit data...</div>
      ) : auditResult ? (
        <>
          <div className="bg-slate-800 p-4 rounded-lg mb-4">
            <div className="flex gap-8">
              <div>
                <div className="text-sm text-slate-400">Total Scanned</div>
                <div className="text-2xl font-bold text-slate-300">{auditResult.totalScanned}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400">Flagged</div>
                <div className="text-2xl font-bold text-amber-400">{auditResult.flagged.length}</div>
              </div>
            </div>
          </div>

          {auditResult.flagged.length === 0 ? (
            <div className="text-center text-green-400 py-8">
              No issues found. All transactions have proper inventory deduction.
            </div>
          ) : (
            <div className="flex-1 overflow-auto bg-slate-800 rounded-lg">
              <table className="w-full">
                <thead className="bg-slate-700 sticky top-0">
                  <tr>
                    <th className="text-left text-slate-300 px-4 py-3 text-sm font-semibold">ID</th>
                    <th className="text-left text-slate-300 px-4 py-3 text-sm font-semibold">Date</th>
                    <th className="text-left text-slate-300 px-4 py-3 text-sm font-semibold">Status</th>
                    <th className="text-left text-slate-300 px-4 py-3 text-sm font-semibold">Cashier</th>
                    <th className="text-left text-slate-300 px-4 py-3 text-sm font-semibold">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {auditResult.flagged.map((flagged) => (
                    <tr key={flagged.transactionId} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-sm text-slate-300">#{flagged.transactionId}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{formatDate(flagged.createdAt)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded text-xs ${
                          flagged.status === 'completed' ? 'bg-green-600 text-white' :
                          flagged.status === 'complimentary' ? 'bg-purple-600 text-white' :
                          'bg-slate-600 text-slate-300'
                        }`}>
                          {flagged.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">{flagged.userName}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {flagged.issues.map((issue, idx) => (
                            <span key={idx} className="bg-amber-600 text-white px-2 py-1 rounded text-xs">
                              {formatIssue(issue)}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-500">
            <strong>Note:</strong> Recipe added after sale (item sold with no recipe that now has a recipe) will show as advisory "review", not a hard error.
          </div>
        </>
      ) : null}
    </div>
  );
};