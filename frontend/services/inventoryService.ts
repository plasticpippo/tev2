import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { StockItem, StockAdjustment } from '../../shared/types';
import i18n from '../src/i18n';

// Stock Items
export const getStockItems = async (): Promise<StockItem[]> => {
  const cacheKey = 'getStockItems';
  try {
    const result = await makeApiRequest(apiUrl('/api/stock-items'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error(i18n.t('inventoryService.errorFetchingStockItems'), error);
    return [];
  }
};

export const saveStockItem = async (item: Omit<StockItem, 'id'> & { id?: string }): Promise<StockItem> => {
  try {
    const method = item.id ? 'PUT' : 'POST';
    const url = item.id ? apiUrl(`/api/stock-items/${item.id}`) : apiUrl('/api/stock-items');
    
    const response = await fetch(url, {
      method,
      headers: getAuthHeaders(),
      body: JSON.stringify(item)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    const savedItem = await response.json();
    notifyUpdates();
    return savedItem;
  } catch (error) {
    console.error(i18n.t('inventoryService.errorSavingStockItem'), error);
    throw error;
  }
};

export const deleteStockItem = async (itemId: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const response = await fetch(apiUrl(`/api/stock-items/${itemId}`), {
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
    console.error(i18n.t('inventoryService.errorDeletingStockItem'), error);
    return { success: false, message: error instanceof Error ? error.message : i18n.t('inventoryService.failedDeleteStockItem') };
  }
};

export const updateStockLevels = async (consumptions: { stockItemId: string, quantity: number }[]): Promise<void> => {
  try {
     const response = await fetch(apiUrl('/api/stock-items/update-levels'), {
       method: 'PUT',
       headers: getAuthHeaders(),
       body: JSON.stringify({ consumptions })
     });
     
     if (!response.ok) {
       // Check if it's a 400 error with a specific message
       if (response.status === 400) {
         const errorData = await response.json();
         console.warn(i18n.t('inventoryService.stockLevelUpdateResponse'), errorData);
         // If the error is related to invalid stock item references, we might want to handle it differently
         if (errorData.error && errorData.error.includes('Invalid stock item ID format')) {
           throw new Error(`${i18n.t('inventoryService.invalidStockItemIdFormat')}: ${errorData.error}`);
         }
       }
       throw new Error(i18n.t('api.httpError', { status: response.status }));
     }
     
     // Check if the response contains warnings (for orphaned references)
     const responseData = await response.json();
     if (responseData.warnings) {
       console.warn(i18n.t('inventoryService.stockLevelUpdateWarnings'), responseData.warnings);
     }
     
     notifyUpdates();
   } catch (error) {
     console.error(i18n.t('inventoryService.errorUpdatingStockLevels'), error);
     throw error;
  }
};

// Stock Adjustments
export const getStockAdjustments = async (): Promise<StockAdjustment[]> => {
  const cacheKey = 'getStockAdjustments';
  try {
    const result = await makeApiRequest(apiUrl('/api/stock-adjustments'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error(i18n.t('inventoryService.errorFetchingStockAdjustments'), error);
    return [];
  }
};

export const saveStockAdjustment = async (adjData: Omit<StockAdjustment, 'id' | 'createdAt'>): Promise<StockAdjustment> => {
  try {
    const response = await fetch(apiUrl('/api/stock-adjustments'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(adjData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    const savedAdjustment = await response.json();
    notifyUpdates();
    return savedAdjustment;
  } catch (error) {
    console.error(i18n.t('inventoryService.errorSavingStockAdjustment'), error);
    throw error;
  }
};
