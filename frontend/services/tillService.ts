import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { Till } from '../../shared/types';
import i18n from '../src/i18n';

// Tills
export const getTills = async (): Promise<Till[]> => {
  const cacheKey = 'getTills';
  try {
    const result = await makeApiRequest(apiUrl('/api/tills'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error(i18n.t('tillService.errorFetchingTills'), error);
    return [];
  }
};

export const saveTill = async (till: Omit<Till, 'id'> & { id?: number }): Promise<Till> => {
  try {
    const method = till.id ? 'PUT' : 'POST';
    const url = till.id ? apiUrl(`/api/tills/${till.id}`) : apiUrl('/api/tills');
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(till)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    const savedTill = await response.json();
    notifyUpdates();
    return savedTill;
  } catch (error) {
    console.error(i18n.t('tillService.errorSavingTill'), error);
    throw error;
  }
};

export const deleteTill = async (tillId: number): Promise<{success: boolean, message?: string}> => {
  try {
    const response = await fetch(apiUrl(`/api/tills/${tillId}`), {
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
    console.error(i18n.t('tillService.errorDeletingTill'), error);
    return { success: false, message: error instanceof Error ? error.message : i18n.t('tillService.failedDeleteTill') };
  }
};