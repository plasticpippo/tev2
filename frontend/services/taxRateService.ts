import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { TaxRate, CreateTaxRateInput, UpdateTaxRateInput } from '../../shared/types';
import i18n from '../src/i18n';

// GET /api/tax-rates - Get all tax rates
export const getTaxRates = async (): Promise<TaxRate[]> => {
  const cacheKey = 'getTaxRates';
  try {
    const result = await makeApiRequest(apiUrl('/api/tax-rates'), undefined, cacheKey);
    // Convert rate from string to number
    return result.map((tr: TaxRate) => ({
      ...tr,
      rate: Number(tr.rate),
    }));
  } catch (error) {
    console.error(i18n.t('taxRateService.errorFetchingTaxRates'), error);
    return [];
  }
};

// GET /api/tax-rates/:id - Get single tax rate
export const getTaxRate = async (id: number): Promise<TaxRate | null> => {
  try {
    const result = await makeApiRequest(apiUrl(`/api/tax-rates/${id}`));
    // Convert rate from string to number
    return result ? {
      ...result,
      rate: Number(result.rate),
    } : null;
  } catch (error) {
    console.error(i18n.t('taxRateService.errorFetchingTaxRate'), error);
    return null;
  }
};

// POST /api/tax-rates - Create tax rate (admin only)
export const createTaxRate = async (data: CreateTaxRateInput): Promise<TaxRate> => {
  try {
    const response = await fetch(apiUrl('/api/tax-rates'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    const savedTaxRate = await response.json();
    notifyUpdates();
    return savedTaxRate;
  } catch (error) {
    console.error(i18n.t('taxRateService.errorCreatingTaxRate'), error);
    throw error;
  }
};

// PUT /api/tax-rates/:id - Update tax rate (admin only)
export const updateTaxRate = async (id: number, data: UpdateTaxRateInput): Promise<TaxRate> => {
  try {
    const response = await fetch(apiUrl(`/api/tax-rates/${id}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    const updatedTaxRate = await response.json();
    notifyUpdates();
    return updatedTaxRate;
  } catch (error) {
    console.error(i18n.t('taxRateService.errorUpdatingTaxRate'), error);
    throw error;
  }
};

// PUT /api/tax-rates/:id/default - Set as default tax rate (admin only)
export const setDefaultTaxRate = async (id: number): Promise<TaxRate> => {
  try {
    const response = await fetch(apiUrl(`/api/tax-rates/${id}/default`), {
      method: 'PUT',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    const updatedTaxRate = await response.json();
    notifyUpdates();
    return updatedTaxRate;
  } catch (error) {
    console.error(i18n.t('taxRateService.errorSettingDefaultTaxRate'), error);
    throw error;
  }
};

// DELETE /api/tax-rates/:id - Delete tax rate (admin only)
export const deleteTaxRate = async (id: number): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(apiUrl(`/api/tax-rates/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error(i18n.t('taxRateService.errorDeletingTaxRate'), error);
    return { success: false, message: error instanceof Error ? error.message : i18n.t('taxRateService.failedDeleteTaxRate') };
  }
};
