import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { Transaction, Tab } from '../../shared/types';
import i18n from '../src/i18n';

// Transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  const cacheKey = 'getTransactions';
  try {
    const result = await makeApiRequest(apiUrl('/api/transactions'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error(i18n.t('transactionService.errorFetchingTransactions'), error);
    return [];
  }
};

export const saveTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> => {
  try {
    const response = await fetch(apiUrl('/api/transactions'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transactionData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    const savedTransaction = await response.json();
    notifyUpdates();
    return savedTransaction;
  } catch (error) {
    console.error(i18n.t('transactionService.errorSavingTransaction'), error);
    throw error;
  }
};

// Tabs
export const getTabs = async (): Promise<Tab[]> => {
  const cacheKey = 'getTabs';
  try {
    const result = await makeApiRequest(apiUrl('/api/tabs'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error(i18n.t('transactionService.errorFetchingTabs'), error);
    return [];
  }
};

export const saveTab = async (tabData: Omit<Tab, 'id'> & {id?: number}): Promise<Tab> => {
  console.log('apiService: saveTab called with data:', tabData);
  try {
    const method = tabData.id ? 'PUT' : 'POST';
    const url = tabData.id ? apiUrl(`/api/tabs/${tabData.id}`) : apiUrl('/api/tabs');
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(tabData)
    });
    
    console.log('apiService: saveTab response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      console.log('apiService: saveTab error response:', errorData);
      throw new Error(errorMessage);
    }
    const savedTab = await response.json();
    console.log('apiService: saveTab successful, savedTab:', savedTab);
    notifyUpdates();
    return savedTab;
  } catch (error) {
    console.error(i18n.t('transactionService.errorSavingTab'), error);
    throw error;
  }
};

export const deleteTab = async (tabId: number): Promise<void> => {
  try {
    const response = await fetch(apiUrl(`/api/tabs/${tabId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    notifyUpdates();
  } catch (error) {
    console.error(i18n.t('transactionService.errorDeletingTab'), error);
    throw error;
  }
};

export const updateMultipleTabs = async (tabsToUpdate: Tab[]): Promise<void> => {
  // For now, update each tab individually
  const promises = tabsToUpdate.map(tab => saveTab(tab));
  await Promise.all(promises);
  notifyUpdates();
};