import i18n from '../src/i18n';
import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { Settings } from '../../shared/types';

// Settings
export const getSettings = async (): Promise<Settings> => {
  const cacheKey = 'getSettings';
  try {
    const result = await makeApiRequest(apiUrl('/api/settings'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error(i18n.t('settingService.errorFetchingSettings'), error);
    // Return default settings on error
    return {
      tax: { mode: 'none' },
      businessDay: { autoStartTime: '06:00', lastManualClose: null }
    };
  }
};

export const saveSettings = async (settings: Settings): Promise<void> => {
  try {
    const response = await fetch(apiUrl('/api/settings'), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    notifyUpdates();
  } catch (error) {
    console.error(i18n.t('settingService.errorSavingSettings'), error);
    throw error;
  }
};