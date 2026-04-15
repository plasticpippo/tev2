import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, formatCost, formatDate } from '../utils/formatting';
import * as costApi from '../services/costManagementService';
import type { IngredientCostInfo, CostHistoryEntry, VariantCostSummary, VariantCostBreakdown } from '../services/costManagementService';

interface CostManagementPanelProps {
  stockItems: any[];
}

type TabKey = 'ingredients' | 'variants' | 'changes';

const STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-yellow-600/30 text-yellow-300',
  current: 'bg-green-600/30 text-green-300',
  stale: 'bg-orange-600/30 text-orange-300',
  outdated: 'bg-red-600/30 text-red-300',
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE_CLASSES[status] || 'bg-slate-600/30 text-slate-300';
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function CostStatusBadge({ status }: { status: string | null | undefined }) {
  if (!status) return <span className="px-2 py-1 rounded text-xs font-semibold bg-slate-600/30 text-slate-300">pending</span>;
  const cls = STATUS_BADGE_CLASSES[status] || 'bg-slate-600/30 text-slate-300';
  return <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>{status}</span>;
}

interface UpdateCostModalProps {
  ingredient: IngredientCostInfo;
  onClose: () => void;
  onSaved: () => void;
}

const UpdateCostModal: React.FC<UpdateCostModalProps> = ({ ingredient, onClose, onSaved }) => {
  const { t } = useTranslation('admin');
  const [newCost, setNewCost] = useState('');
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(newCost);
    if (isNaN(cost) || cost <= 0) {
      setError(t('costManagement.invalidCost'));
      return;
    }
    if (!reason.trim()) {
      setError(t('costManagement.reasonRequired'));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await costApi.updateIngredientCost(ingredient.id, cost, reason.trim(), effectiveDate || undefined);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('costManagement.updateFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">
          {t('costManagement.updateCost')} - {ingredient.name}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t('costManagement.currentCost')}</label>
            <p className="text-white font-semibold">{formatCost(ingredient.standardCost)} / {ingredient.baseUnit}</p>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t('costManagement.newCost')}</label>
            <input
              type="number"
              step="0.000001"
              min="0"
              value={newCost}
              onChange={e => setNewCost(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t('costManagement.reason')}</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t('costManagement.effectiveDate')}</label>
            <input
              type="date"
              value={effectiveDate}
              onChange={e => setEffectiveDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition min-h-11">
            {t('costManagement.cancel')}
          </button>
          <button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 min-h-11 rounded-md transition disabled:opacity-50">
            {saving ? t('costManagement.saving') : t('costManagement.updateCost')}
          </button>
        </div>
      </form>
    </div>
  );
};

interface IngredientDetailPanelProps {
  ingredient: IngredientCostInfo;
  onClose: () => void;
  onUpdateClick: () => void;
}

const IngredientDetailPanel: React.FC<IngredientDetailPanelProps> = ({ ingredient, onClose, onUpdateClick }) => {
  const { t } = useTranslation('admin');
  const [history, setHistory] = useState<CostHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await costApi.fetchIngredientDetail(ingredient.id);
        setHistory(result.history || []);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [ingredient.id]);

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">{ingredient.name}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
      </div>
      <div className="space-y-3 mb-6">
        <div className="flex justify-between">
          <span className="text-slate-400">{t('costManagement.type')}</span>
          <span className="text-white">{ingredient.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">{t('costManagement.baseUnit')}</span>
          <span className="text-white">{ingredient.baseUnit}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">{t('costManagement.standardCost')}</span>
          <span className="text-white font-semibold">{formatCost(ingredient.standardCost)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">{t('costManagement.costPerUnit')}</span>
          <span className="text-white">{formatCost(ingredient.costPerUnit)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">{t('costManagement.lastUpdate')}</span>
          <span className="text-white">{formatDate(ingredient.lastCostUpdate)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">{t('costManagement.status')}</span>
          <CostStatusBadge status={ingredient.costStatus} />
        </div>
      </div>
      <button
        onClick={onUpdateClick}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 min-h-11 rounded-md transition mb-6"
      >
        {t('costManagement.updateCost')}
      </button>
      <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('costManagement.recentHistory')}</h4>
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500" />
        </div>
      ) : history.length === 0 ? (
        <p className="text-slate-400 text-sm">{t('costManagement.noHistory')}</p>
      ) : (
        <div className="space-y-2">
          {history.map(entry => (
            <div key={entry.id} className="bg-slate-700 rounded p-3 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>{formatCost(entry.previousCost)}</span>
                <span className="text-slate-500">&rarr;</span>
                <span className="font-semibold">{formatCost(entry.newCost)}</span>
              </div>
              <p className="text-slate-400 text-xs mt-1">{entry.reason}</p>
              <p className="text-slate-500 text-xs">{formatDate(entry.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface VariantBreakdownPanelProps {
  variantId: number;
  variantName: string;
  onClose: () => void;
}

const VariantBreakdownPanel: React.FC<VariantBreakdownPanelProps> = ({ variantId, variantName, onClose }) => {
  const { t } = useTranslation('admin');
  const [breakdown, setBreakdown] = useState<VariantCostBreakdown | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await costApi.fetchVariantCostBreakdown(variantId);
        setBreakdown(result);
      } catch {
        setBreakdown(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [variantId]);

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-white">{variantName}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
      </div>
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : !breakdown ? (
        <p className="text-slate-400">{t('costManagement.noBreakdown')}</p>
      ) : (
        <>
          <div className="flex justify-between mb-4">
            <span className="text-slate-400">{t('costManagement.totalCost')}</span>
            <span className="text-white font-semibold">{breakdown.totalCost !== null ? formatCost(breakdown.totalCost) : 'N/A'}</span>
          </div>
          <h4 className="text-sm font-semibold text-slate-300 mb-2">{t('costManagement.ingredientCosts')}</h4>
          <div className="space-y-2">
            {breakdown.ingredientCosts.map((ic, idx) => (
              <div key={idx} className="bg-slate-700 rounded p-3">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{ic.stockItemName}</span>
                  <span className="text-white font-semibold">{formatCost(ic.ingredientCost)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>{ic.quantity} x {formatCost(ic.standardCost)}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const IngredientCostsTab: React.FC<{ onModalOpen: (ingredient: IngredientCostInfo) => void; refreshTrigger: number }> = ({ onModalOpen, refreshTrigger }) => {
  const { t } = useTranslation('admin');
  const [ingredients, setIngredients] = useState<IngredientCostInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadIngredients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await costApi.fetchIngredients(searchTerm || undefined);
      setIngredients(data);
    } catch {
      setIngredients([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients, refreshTrigger]);

  const selectedIngredient = selectedId ? ingredients.find(i => i.id === selectedId) || null : null;

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="mb-4">
          <input
            type="text"
            placeholder={t('costManagement.searchIngredients')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
          />
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto" />
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <table className="min-w-full bg-slate-800 rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.name')}</th>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.type')}</th>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.baseUnit')}</th>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.standardCost')}</th>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.lastUpdate')}</th>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.status')}</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map(ing => (
                  <tr
                    key={ing.id}
                    onClick={() => setSelectedId(ing.id === selectedId ? null : ing.id)}
                    className={`cursor-pointer hover:bg-slate-700/50 transition ${selectedId === ing.id ? 'bg-slate-700' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{ing.name}</td>
                    <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{ing.type}</td>
                    <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{ing.baseUnit}</td>
                    <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{formatCost(ing.standardCost)}</td>
                    <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{formatDate(ing.lastCostUpdate)}</td>
                    <td className="px-4 py-3 text-sm border-t border-slate-700"><CostStatusBadge status={ing.costStatus} /></td>
                  </tr>
                ))}
                {ingredients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-sm text-slate-400 text-center border-t border-slate-700">
                      {t('costManagement.noIngredients')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedIngredient && (
        <div className="w-96 flex-shrink-0">
          <IngredientDetailPanel
            ingredient={selectedIngredient}
            onClose={() => setSelectedId(null)}
            onUpdateClick={() => onModalOpen(selectedIngredient)}
          />
        </div>
      )}
    </div>
  );
};

const VariantCostsTab: React.FC = () => {
  const { t } = useTranslation('admin');
  const [variants, setVariants] = useState<VariantCostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [selectedVariantName, setSelectedVariantName] = useState('');

  const loadVariants = useCallback(async () => {
    setLoading(true);
    try {
      const data = await costApi.fetchVariantCostSummary();
      setVariants(data);
    } catch {
      setVariants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVariants();
  }, [loadVariants]);

  const handleBulkRecalculate = async () => {
    setRecalculating(true);
    try {
      await costApi.bulkRecalculateCosts();
      await loadVariants();
    } catch (err) {
      console.error('Bulk recalculate failed:', err);
    } finally {
      setRecalculating(false);
    }
  };

  const handleRecalculate = async (variantId: number) => {
    try {
      await costApi.recalculateVariantCost(variantId);
      await loadVariants();
    } catch (err) {
      console.error('Recalculate failed:', err);
    }
  };

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white">{t('costManagement.variantCosts')}</h3>
          <button
            onClick={handleBulkRecalculate}
            disabled={recalculating}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 min-h-11 rounded-md transition disabled:opacity-50"
          >
            {recalculating ? t('costManagement.recalculating') : t('costManagement.recalculateAll')}
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto" />
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <table className="min-w-full bg-slate-800 rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.variantName')}</th>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.product')}</th>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.category')}</th>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.price')}</th>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.theoreticalCost')}</th>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.margin')}</th>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.costStatus')}</th>
                  <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300"></th>
                </tr>
              </thead>
              <tbody>
                {variants.map(v => (
                  <tr
                    key={v.variantId ?? v.id}
                    onClick={() => {
                      const vid = v.variantId ?? v.id;
                      setSelectedVariantId(vid === selectedVariantId ? null : vid);
                      setSelectedVariantName(v.name || v.variantName || '');
                    }}
                    className={`cursor-pointer hover:bg-slate-700/50 transition ${selectedVariantId === (v.variantId ?? v.id) ? 'bg-slate-700' : ''}`}
                  >
                    <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{v.name || v.variantName}</td>
                    <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{v.productName}</td>
                    <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{(v as any).categoryName || ''}</td>
                    <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{formatCurrency(v.price)}</td>
                    <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{v.theoreticalCost !== null ? formatCost(v.theoreticalCost) : 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-white border-t border-slate-700">
                      {v.currentMargin !== null ? `${Number(v.currentMargin).toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm border-t border-slate-700"><CostStatusBadge status={v.costStatus} /></td>
                    <td className="px-4 py-3 text-sm border-t border-slate-700">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleRecalculate(v.variantId ?? v.id);
                        }}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition"
                      >
                        {t('costManagement.recalculate')}
                      </button>
                    </td>
                  </tr>
                ))}
                {variants.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-sm text-slate-400 text-center border-t border-slate-700">
                      {t('costManagement.noVariants')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedVariantId !== null && (
        <div className="w-96 flex-shrink-0">
          <VariantBreakdownPanel
            variantId={selectedVariantId}
            variantName={selectedVariantName}
            onClose={() => setSelectedVariantId(null)}
          />
        </div>
      )}
    </div>
  );
};

const RecentChangesTab: React.FC<{ refreshTrigger: number }> = ({ refreshTrigger }) => {
  const { t } = useTranslation('admin');
  const [changes, setChanges] = useState<CostHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChanges = useCallback(async () => {
    setLoading(true);
    try {
      const data = await costApi.fetchRecentCostChanges(50);
      setChanges(data);
    } catch {
      setChanges([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChanges();
  }, [loadChanges, refreshTrigger]);

  const renderChangePercent = (pct: number) => {
    const isPositive = pct > 0;
    const cls = isPositive ? 'text-red-400' : pct < 0 ? 'text-green-400' : 'text-slate-400';
    return <span className={`font-semibold ${cls}`}>{isPositive ? '+' : ''}{Number(pct).toFixed(2)}%</span>;
  };

  return (
    <div className="h-full overflow-y-auto">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto" />
        </div>
      ) : (
        <table className="min-w-full bg-slate-800 rounded-lg overflow-hidden">
          <thead>
            <tr>
              <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.date')}</th>
              <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.ingredient')}</th>
              <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.previousCost')}</th>
              <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.newCost')}</th>
              <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.changePercent')}</th>
              <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.reason')}</th>
              <th className="px-4 py-3 bg-slate-700 text-left text-sm font-semibold text-slate-300">{t('costManagement.updatedBy')}</th>
            </tr>
          </thead>
          <tbody>
            {changes.map(ch => (
              <tr key={ch.id} className="hover:bg-slate-700/50 transition">
                <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{formatDate(ch.createdAt)}</td>
                <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{ch.stockItemName || ch.stockItemId}</td>
                <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{formatCost(ch.previousCost)}</td>
                <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{formatCost(ch.newCost)}</td>
                <td className="px-4 py-3 text-sm border-t border-slate-700">{renderChangePercent(ch.changePercent)}</td>
                <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{ch.reason}</td>
                <td className="px-4 py-3 text-sm text-white border-t border-slate-700">{ch.createdByName || ch.createdBy}</td>
              </tr>
            ))}
            {changes.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-sm text-slate-400 text-center border-t border-slate-700">
                  {t('costManagement.noChanges')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

const CostManagementPanel: React.FC<CostManagementPanelProps> = () => {
  const { t } = useTranslation('admin');
  const [activeTab, setActiveTab] = useState<TabKey>('ingredients');
  const [modalIngredient, setModalIngredient] = useState<IngredientCostInfo | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'ingredients', label: t('costManagement.ingredientCosts') },
    { key: 'variants', label: t('costManagement.variantCosts') },
    { key: 'changes', label: t('costManagement.recentChanges') },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 flex gap-2 mb-4">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-2 px-4 min-h-11 rounded-md font-semibold transition ${
              activeTab === tab.key
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'ingredients' && (
          <IngredientCostsTab onModalOpen={ing => setModalIngredient(ing)} refreshTrigger={refreshTrigger} />
        )}
        {activeTab === 'variants' && <VariantCostsTab />}
        {activeTab === 'changes' && <RecentChangesTab refreshTrigger={refreshTrigger} />}
      </div>
      {modalIngredient && (
        <UpdateCostModal
          ingredient={modalIngredient}
          onClose={() => setModalIngredient(null)}
          onSaved={() => { setModalIngredient(null); setRefreshTrigger(prev => prev + 1); }}
        />
      )}
    </div>
  );
};

export default CostManagementPanel;
