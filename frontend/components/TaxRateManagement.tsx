import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { TaxRate, CreateTaxRateInput, UpdateTaxRateInput } from '../../shared/types';
import { getTaxRates, createTaxRate, updateTaxRate, deleteTaxRate, setDefaultTaxRate } from '../services/apiService';
import { VKeyboardInput } from './VKeyboardInput';
import ConfirmationModal from './ConfirmationModal';
import ErrorMessage from './ErrorMessage';
import { formatTaxRate, getTaxRateLabel } from '../utils/taxRateUtils';
import { useVirtualKeyboard } from './VirtualKeyboardContext';

interface TaxRateModalProps {
  taxRate?: TaxRate;
  onClose: () => void;
  onSave: () => void;
}

const TaxRateModal: React.FC<TaxRateModalProps> = ({ taxRate, onClose, onSave }) => {
  const { t } = useTranslation('admin');
  const [name, setName] = useState(taxRate?.name || '');
  const [rate, setRate] = useState(taxRate ? Math.round(taxRate.rate * 100) : '');
  const [description, setDescription] = useState(taxRate?.description || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const removeError = (key: string) => {
    setErrors(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const { closeKeyboard } = useVirtualKeyboard();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate name
    if (!name.trim()) {
      newErrors.name = t('taxRates.validation.nameRequired');
    } else if (name.trim().length > 100) {
      newErrors.name = t('taxRates.validation.nameMaxLength');
    }

    // Validate rate
    const rateNum = parseFloat(rate as unknown as string);
    if (isNaN(rateNum)) {
      newErrors.rate = t('taxRates.validation.rateRequired');
    } else if (rateNum < 0 || rateNum > 100) {
      newErrors.rate = t('taxRates.validation.rateRange');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRetry = async () => {
    setApiError(null);
    const formValid = validateForm();
    if (!formValid) return;

    setIsSaving(true);
    try {
      const rateDecimal = parseFloat(rate as unknown as string) / 100;
      if (taxRate) {
        const updateData: UpdateTaxRateInput = {
          name: name.trim(),
          rate: rateDecimal,
          description: description.trim() || null
        };
        await updateTaxRate(taxRate.id, updateData);
      } else {
        const createData: CreateTaxRateInput = {
          name: name.trim(),
          rate: rateDecimal,
          description: description.trim() || undefined
        };
        await createTaxRate(createData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving tax rate:', error);
      setApiError(error instanceof Error ? error.message : t('taxRates.errors.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearForm = () => {
    setName('');
    setRate('');
    setDescription('');
    setErrors({});
    setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    closeKeyboard();

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const rateDecimal = parseFloat(rate as unknown as string) / 100;
      if (taxRate) {
        const updateData: UpdateTaxRateInput = {
          name: name.trim(),
          rate: rateDecimal,
          description: description.trim() || null
        };
        await updateTaxRate(taxRate.id, updateData);
      } else {
        const createData: CreateTaxRateInput = {
          name: name.trim(),
          rate: rateDecimal,
          description: description.trim() || undefined
        };
        await createTaxRate(createData);
      }
      onSave();
    } catch (error) {
      console.error('Error saving tax rate:', error);
      setApiError(error instanceof Error ? error.message : t('taxRates.errors.failedToSave'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col border border-slate-700">
        <div className="p-6 pb-4 border-b border-slate-700">
          <h3 className="text-xl font-bold text-amber-400">
            {taxRate ? t('taxRates.editTaxRate') : t('taxRates.addTaxRate')}
          </h3>
          <p className="text-sm text-slate-400">{t('taxRates.taxRateDescription')}</p>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          {apiError && (
            <ErrorMessage
              message={apiError}
              type="error"
              onRetry={handleRetry}
              onClear={handleClearForm}
              showRetry={true}
              showClear={true}
            />
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('taxRates.name')}
            </label>
            <VKeyboardInput
              k-type="full"
              type="text"
              placeholder={t('taxRates.namePlaceholder')}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) removeError('name');
              }}
              className={`w-full p-3 bg-slate-900 border rounded-md ${errors.name ? 'border-red-500' : 'border-slate-700'}`}
              required
              autoFocus
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('taxRates.rate')}
            </label>
            <VKeyboardInput
              k-type="numeric"
              type="number"
              placeholder={t('taxRates.ratePlaceholder')}
              value={rate}
              onChange={(e) => {
                setRate(e.target.value as unknown as number);
                if (errors.rate) removeError('rate');
              }}
              className={`w-full p-3 bg-slate-900 border rounded-md ${errors.rate ? 'border-red-500' : 'border-slate-700'}`}
              required
              min="0"
              max="100"
              step="0.01"
            />
            {errors.rate && <p className="text-red-500 text-xs mt-1">{errors.rate}</p>}
            <p className="text-xs text-slate-500 mt-1">{t('taxRates.rateHint')}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              {t('taxRates.description')}
            </label>
            <VKeyboardInput
              k-type="full"
              type="text"
              placeholder={t('taxRates.descriptionPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md"
            />
            <p className="text-xs text-slate-500 mt-1">{t('taxRates.descriptionHint')}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-auto p-6 pt-4 border-t border-slate-700">
          <button
            type="button"
            onClick={() => { closeKeyboard(); onClose(); }}
            className="btn btn-secondary"
          >
            {t('buttons.cancel', { ns: 'common' })}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={`btn btn-primary ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {isSaving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('buttons.saving', { ns: 'common' })}
              </span>
            ) : t('taxRates.saveTaxRate')}
          </button>
        </div>
      </form>
    </div>
  );
};

interface TaxRateManagementProps {
  onDataUpdate?: () => void;
}

export const TaxRateManagement: React.FC<TaxRateManagementProps> = ({ onDataUpdate }) => {
  const { t } = useTranslation('admin');
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | undefined>(undefined);
  const [deletingTaxRate, setDeletingTaxRate] = useState<TaxRate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  const fetchTaxRates = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const rates = await getTaxRates();
      setTaxRates(rates);
    } catch (error) {
      console.error('Error fetching tax rates:', error);
      setLoadError(error instanceof Error ? error.message : t('taxRates.errors.failedToLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxRates();
  }, []);

  const handleSave = () => {
    setIsModalOpen(false);
    setEditingTaxRate(undefined);
    fetchTaxRates();
    if (onDataUpdate) {
      onDataUpdate();
    }
  };

  const confirmDelete = async () => {
    if (deletingTaxRate) {
      setIsDeleting(true);
      setDeleteError(null);
      try {
        const result = await deleteTaxRate(deletingTaxRate.id);
        if (result.success) {
          setDeletingTaxRate(null);
          fetchTaxRates();
          if (onDataUpdate) {
            onDataUpdate();
          }
        } else {
          setDeleteError(result.message || t('taxRates.errors.failedToDelete'));
        }
      } catch (error) {
        console.error('Error deleting tax rate:', error);
        setDeleteError(error instanceof Error ? error.message : t('taxRates.errors.failedToDelete'));
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleRetryDelete = async () => {
    setDeleteError(null);
    await confirmDelete();
  };

  const handleSetDefault = async (taxRate: TaxRate) => {
    setSettingDefaultId(taxRate.id);
    try {
      await setDefaultTaxRate(taxRate.id);
      fetchTaxRates();
      if (onDataUpdate) {
        onDataUpdate();
      }
    } catch (error) {
      console.error('Error setting default tax rate:', error);
      // Could show an error message here
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleRetryLoad = () => {
    setLoadError(null);
    fetchTaxRates();
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-400">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{t('taxRates.loading')}</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-300">{t('taxRates.title')}</h3>
        </div>
        <ErrorMessage
          message={loadError}
          type="error"
          onRetry={handleRetryLoad}
          showRetry={true}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-300">{t('taxRates.title')}</h3>
        <button
          onClick={() => { setEditingTaxRate(undefined); setIsModalOpen(true); }}
          className="btn btn-primary"
        >
          {t('taxRates.addTaxRate')}
        </button>
      </div>
      <div className="flex-grow space-y-2 overflow-y-auto pr-2">
        {taxRates.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <p>{t('taxRates.noTaxRates')}</p>
          </div>
        ) : (
          taxRates.map(taxRate => (
            <div key={taxRate.id} className="bg-slate-800 p-4 rounded-md">
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{getTaxRateLabel(taxRate)}</p>
                    {taxRate.isDefault && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-600 text-white">
                        {t('taxRates.default')}
                      </span>
                    )}
                  </div>
                  {taxRate.description && (
                    <p className="text-sm text-slate-400 mt-1">{taxRate.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!taxRate.isDefault && (
                    <button
                      onClick={() => handleSetDefault(taxRate)}
                      disabled={settingDefaultId !== null}
                      className={`btn btn-secondary btn-sm ${settingDefaultId ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                      {settingDefaultId === taxRate.id ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {t('taxRates.settingDefault')}
                        </span>
                      ) : t('taxRates.setDefault')}
                    </button>
                  )}
                  <button
                    onClick={() => { setEditingTaxRate(taxRate); setIsModalOpen(true); }}
                    className="btn btn-secondary btn-sm"
                  >
                    {t('buttons.edit', { ns: 'common' })}
                  </button>
                  <button
                    onClick={() => setDeletingTaxRate(taxRate)}
                    disabled={isDeleting}
                    className={`btn btn-danger btn-sm ${isDeleting ? 'opacity-75 cursor-not-allowed' : ''}`}
                  >
                    {isDeleting && deletingTaxRate?.id === taxRate.id ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {t('buttons.deleting', { ns: 'common' })}
                      </span>
                    ) : t('buttons.delete', { ns: 'common' })}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {isModalOpen && (
        <TaxRateModal
          taxRate={editingTaxRate}
          onClose={() => { setIsModalOpen(false); setEditingTaxRate(undefined); }}
          onSave={handleSave}
        />
      )}
      <ConfirmationModal
        show={!!deletingTaxRate}
        title={t('confirmation.confirmDelete', { ns: 'common' })}
        message={t('taxRates.confirmDelete', { name: deletingTaxRate?.name })}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingTaxRate(null)}
        confirmText={isDeleting ? t('buttons.deleting', { ns: 'common' }) : t('buttons.delete', { ns: 'common' })}
        confirmButtonType="danger"
        disabled={isDeleting}
      />
      {deleteError && (
        <ErrorMessage
          message={deleteError}
          type="error"
          onRetry={handleRetryDelete}
          showRetry={true}
        />
      )}
    </div>
  );
};

export default TaxRateManagement;
