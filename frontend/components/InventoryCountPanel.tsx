import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/formatting';
import * as costApi from '../services/costManagementService';

type ViewMode = 'list' | 'create';

interface CountFormItem {
  stockItemId: string;
  name: string;
  quantity: number | '';
  notes: string;
}

const InventoryCountPanel: React.FC = () => {
  const { t } = useTranslation('admin');

  const [view, setView] = useState<ViewMode>('list');
  const [counts, setCounts] = useState<costApi.InventoryCountSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedDetail, setExpandedDetail] = useState<costApi.InventoryCountDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [countDate, setCountDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [countType, setCountType] = useState<string>('full');
  const [countNotes, setCountNotes] = useState('');
  const [formItems, setFormItems] = useState<CountFormItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<costApi.IngredientCostInfo[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const loadCounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await costApi.fetchInventoryCounts(statusFilter || undefined);
      setCounts(data);
    } catch {
      setError(t('inventoryCounts.loading'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter, t]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await costApi.fetchIngredients(searchTerm.trim());
        const filtered = results.filter(
          (r) => !formItems.some((fi) => fi.stockItemId === r.id)
        );
        setSearchResults(filtered);
        setShowDropdown(filtered.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchTerm, formItems]);

  const handleViewDetail = useCallback(async (id: number) => {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedDetail(null);
      return;
    }
    setExpandedId(id);
    setDetailLoading(true);
    try {
      const detail = await costApi.fetchInventoryCount(id);
      setExpandedDetail(detail);
    } catch {
      setExpandedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, [expandedId]);

  const handleSubmit = useCallback(async (id: number) => {
    if (!window.confirm(t('inventoryCounts.submitConfirm'))) return;
    try {
      await costApi.submitInventoryCount(id);
      await loadCounts();
      if (expandedId === id) {
        setExpandedId(null);
        setExpandedDetail(null);
      }
    } catch {
      // handle silently
    }
  }, [t, loadCounts, expandedId]);

  const handleApprove = useCallback(async (id: number) => {
    if (!window.confirm(t('inventoryCounts.approveConfirm'))) return;
    try {
      await costApi.approveInventoryCount(id);
      await loadCounts();
      if (expandedId === id) {
        setExpandedId(null);
        setExpandedDetail(null);
      }
    } catch {
      // handle silently
    }
  }, [t, loadCounts, expandedId]);

  const handleAddItem = useCallback((ingredient: costApi.IngredientCostInfo) => {
    setFormItems((prev) => [
      ...prev,
      { stockItemId: ingredient.id, name: ingredient.name, quantity: '', notes: '' },
    ]);
    setSearchTerm('');
    setShowDropdown(false);
  }, []);

  const handleRemoveItem = useCallback((index: number) => {
    setFormItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleItemQuantityChange = useCallback((index: number, value: string) => {
    const num = value === '' ? '' : Number(value);
    setFormItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, quantity: num as number | '' } : item))
    );
  }, []);

  const handleCreate = useCallback(async () => {
    const validItems = formItems.filter(
      (item) => item.quantity !== '' && item.quantity > 0
    );
    if (validItems.length === 0) return;
    setCreating(true);
    try {
      await costApi.createInventoryCount({
        countDate,
        countType,
        notes: countNotes || undefined,
        items: validItems.map((item) => ({
          stockItemId: item.stockItemId,
          quantity: Number(item.quantity),
          notes: item.notes || undefined,
        })),
      });
      setView('list');
      resetForm();
      await loadCounts();
    } catch {
      // handle silently
    } finally {
      setCreating(false);
    }
  }, [formItems, countDate, countType, countNotes, loadCounts]);

  const resetForm = () => {
    setCountDate(new Date().toISOString().split('T')[0]);
    setCountType('full');
    setCountNotes('');
    setFormItems([]);
    setSearchTerm('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const canCreate =
    formItems.length > 0 &&
    formItems.every((item) => item.quantity !== '' && item.quantity > 0);

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      full: 'bg-blue-600/30 text-blue-300',
      partial: 'bg-yellow-600/30 text-yellow-300',
      spot: 'bg-green-600/30 text-green-300',
    };
    return styles[type] || 'bg-slate-600/30 text-slate-300';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-yellow-600/30 text-yellow-300',
      submitted: 'bg-blue-600/30 text-blue-300',
      approved: 'bg-green-600/30 text-green-300',
    };
    return styles[status] || 'bg-slate-600/30 text-slate-300';
  };

  if (loading && counts.length === 0) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto" />
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{t('inventoryCounts.newCount')}</h2>
          <button
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 min-h-11 rounded-md transition"
            onClick={() => { setView('list'); resetForm(); }}
          >
            {t('inventoryCounts.cancel')}
          </button>
        </div>

        <div className="bg-slate-800 rounded-lg p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t('inventoryCounts.countDate')}
              </label>
              <input
                type="date"
                value={countDate}
                onChange={(e) => setCountDate(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-md px-3 py-2 border border-slate-600 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t('inventoryCounts.countType')}
              </label>
              <select
                value={countType}
                onChange={(e) => setCountType(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-md px-3 py-2 border border-slate-600 focus:border-amber-500 focus:outline-none"
              >
                <option value="full">{t('inventoryCounts.full')}</option>
                <option value="partial">{t('inventoryCounts.partial')}</option>
                <option value="spot">{t('inventoryCounts.spot')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {t('inventoryCounts.notes')}
              </label>
              <textarea
                value={countNotes}
                onChange={(e) => setCountNotes(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-md px-3 py-2 border border-slate-600 focus:border-amber-500 focus:outline-none"
                rows={1}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('inventoryCounts.addItem')}
            </label>
            <div ref={searchRef} className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('inventoryCounts.searchIngredient')}
                className="w-full bg-slate-700 text-white rounded-md px-3 py-2 border border-slate-600 focus:border-amber-500 focus:outline-none"
              />
              {searching && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500" />
                </div>
              )}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((ing) => (
                    <button
                      key={ing.id}
                      className="w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 transition"
                      onClick={() => handleAddItem(ing)}
                    >
                      {ing.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {formItems.length > 0 ? (
            <table className="min-w-full bg-slate-700/50 rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="px-4 py-2 bg-slate-700 text-left text-sm font-semibold text-slate-300">
                    {t('inventoryCounts.ingredient')}
                  </th>
                  <th className="px-4 py-2 bg-slate-700 text-left text-sm font-semibold text-slate-300">
                    {t('inventoryCounts.quantity')}
                  </th>
                  <th className="px-4 py-2 bg-slate-700 text-left text-sm font-semibold text-slate-300 w-20">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody>
                {formItems.map((item, idx) => (
                  <tr key={item.stockItemId}>
                    <td className="px-4 py-2 text-sm text-white border-t border-slate-600">
                      {item.name}
                    </td>
                    <td className="px-4 py-2 text-sm border-t border-slate-600">
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                        className="w-24 bg-slate-700 text-white rounded px-2 py-1 border border-slate-600 focus:border-amber-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2 text-sm border-t border-slate-600">
                      <button
                        className="text-red-400 hover:text-red-300 text-xs font-medium transition"
                        onClick={() => handleRemoveItem(idx)}
                      >
                        {t('inventoryCounts.remove')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-400 text-sm py-4 text-center">
              {t('inventoryCounts.noItems')}
            </p>
          )}

          <div className="flex justify-end">
            <button
              className={`bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 min-h-11 rounded-md transition ${
                !canCreate || creating ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!canCreate || creating}
              onClick={handleCreate}
            >
              {creating ? t('inventoryCounts.creating') : t('inventoryCounts.create')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">{t('inventoryCounts.title')}</h2>
        <button
          className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 min-h-11 rounded-md transition"
          onClick={() => setView('create')}
        >
          {t('inventoryCounts.newCount')}
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {['', 'draft', 'submitted', 'approved'].map((status) => (
          <button
            key={status}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              statusFilter === status
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            onClick={() => setStatusFilter(status)}
          >
            {status === '' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/30 text-red-300 rounded-md px-4 py-3 mb-4">{error}</div>
      )}

      {counts.length === 0 ? (
        <div className="bg-slate-800 rounded-lg p-8 text-center">
          <p className="text-slate-400">{t('inventoryCounts.noCounts')}</p>
        </div>
      ) : (
        <table className="min-w-full bg-slate-800 rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">
                {t('inventoryCounts.date')}
              </th>
              <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">
                {t('inventoryCounts.type')}
              </th>
              <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">
                {t('inventoryCounts.status')}
              </th>
              <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">
                {t('inventoryCounts.items')}
              </th>
              <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">
                {t('inventoryCounts.notes')}
              </th>
              <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">
                {t('inventoryCounts.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {counts.map((count) => {
              const isExpanded = expandedId === count.id;
              const itemCount = count._count?.items ?? 0;
              return (
                <React.Fragment key={count.id}>
                  <tr>
                    <td className="px-4 py-3 text-sm text-white border-t border-slate-700">
                      {new Date(count.countDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm border-t border-slate-700">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getTypeBadge(count.countType)}`}
                      >
                        {t(`inventoryCounts.${count.countType}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm border-t border-slate-700">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(count.status)}`}
                      >
                        {count.status.charAt(0).toUpperCase() + count.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white border-t border-slate-700">
                      {itemCount}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400 border-t border-slate-700 max-w-xs truncate">
                      {count.notes || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm border-t border-slate-700 space-x-2">
                      {count.status === 'draft' && (
                        <button
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-3 rounded transition"
                          onClick={() => handleSubmit(count.id)}
                        >
                          {t('inventoryCounts.submit')}
                        </button>
                      )}
                      {count.status === 'submitted' && (
                        <button
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-3 rounded transition"
                          onClick={() => handleApprove(count.id)}
                        >
                          {t('inventoryCounts.approve')}
                        </button>
                      )}
                      <button
                        className="bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold py-1 px-3 rounded transition"
                        onClick={() => handleViewDetail(count.id)}
                      >
                        {isExpanded ? t('inventoryCounts.hide') : t('inventoryCounts.view')}
                      </button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 bg-slate-900/50 border-t border-slate-700">
                        {detailLoading ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
                          </div>
                        ) : expandedDetail ? (
                          <div>
                            <table className="w-full">
                              <thead>
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">
                                    {t('inventoryCounts.ingredient')}
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">
                                    {t('inventoryCounts.quantity')}
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">
                                    {t('inventoryCounts.unitCost')}
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">
                                    {t('inventoryCounts.extendedValue')}
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-semibold text-slate-400">
                                    {t('inventoryCounts.notes')}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {expandedDetail.items.map((item) => (
                                  <tr key={item.id}>
                                    <td className="px-3 py-2 text-sm text-white">
                                      {item.stockItemName || item.stockItemId}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-white">{item.quantity}</td>
                                    <td className="px-3 py-2 text-sm text-white">
                                      {formatCurrency(item.unitCost)}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-white">
                                      {formatCurrency(item.extendedValue)}
                                    </td>
                                    <td className="px-3 py-2 text-sm text-slate-400">
                                      {item.notes || '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="border-t border-slate-600">
                                  <td colSpan={3} className="px-3 py-2 text-sm font-semibold text-amber-500 text-right">
                                    {t('inventoryCounts.totalValue')}:
                                  </td>
                                  <td className="px-3 py-2 text-sm font-semibold text-amber-500">
                                    {formatCurrency(
                                      expandedDetail.items.reduce(
                                        (sum, item) => sum + item.extendedValue,
                                        0
                                      )
                                    )}
                                  </td>
                                  <td />
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InventoryCountPanel;
