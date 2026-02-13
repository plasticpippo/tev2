import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { OrderItem, OrderActivityLog } from '../../shared/types';
import type { OrderSession } from './apiBase';
import i18n from '../src/i18n';

// Order Sessions
export const getOrderSession = async (): Promise<OrderSession | null> => {
  try {
    const response = await fetch(apiUrl('/api/order-sessions/current'), {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        // Return null or empty session if no active session exists
        return null;
      } else if (response.status === 401) {
        // User not authenticated, return null instead of throwing
        console.warn(i18n.t('orderService.notAuthenticatedSession'));
        return null;
      }
      throw new Error(i18n.t('api.httpError', { status: response.status }));
    }
    return await response.json();
  } catch (error) {
    console.error(i18n.t('orderService.errorFetchingSession'), error);
    // Return null instead of throwing to prevent errors during initialization
    return null;
  }
};

export const saveOrderSession = async (orderItems: OrderItem[]): Promise<OrderSession | null> => {
  try {
    const response = await fetch(apiUrl('/api/order-sessions/current'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items: orderItems })
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated, don't throw error to prevent app crashes
        console.warn(i18n.t('orderService.notAuthenticatedSessionSave'));
        return null;
      }
      throw new Error(i18n.t('api.httpError', { status: response.status }));
    }
    const savedSession = await response.json();
    notifyUpdates();
    return savedSession;
  } catch (error) {
    console.error(i18n.t('orderService.errorSavingSession'), error);
    // Return null instead of throwing to prevent errors during initialization
    return null;
  }
};

export const updateOrderSessionStatus = async (status: 'logout' | 'complete' | 'assign-tab'): Promise<OrderSession | null> => {
  try {
    let endpoint = '';
    switch (status) {
      case 'logout':
        endpoint = '/api/order-sessions/current/logout';
        break;
      case 'complete':
        endpoint = '/api/order-sessions/current/complete';
        break;
      case 'assign-tab':
        endpoint = '/api/order-sessions/current/assign-tab';
        break;
      default:
        throw new Error(i18n.t('orderService.invalidStatus', { status }));
    }
    
    const response = await fetch(apiUrl(endpoint), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated, don't throw error to prevent app crashes
        console.warn(i18n.t('orderService.notAuthenticatedSessionStatus', { status }));
        return null;
      }
      throw new Error(i18n.t('api.httpError', { status: response.status }));
    }
    const updatedSession = await response.json();
    notifyUpdates();
    return updatedSession;
  } catch (error) {
    console.error(i18n.t('orderService.errorUpdatingSessionStatus'), error);
    // Return null instead of throwing to prevent errors during initialization
    return null;
  }
};

export const clearOrderSession = async (): Promise<void> => {
  // Helper function to clear the session after completion
  // In our implementation, this happens by updating the status to 'completed' or 'pending_logout'
  console.log(i18n.t('orderService.sessionCleared'));
};

// Order Activity Log
export const getOrderActivityLogs = async (): Promise<OrderActivityLog[]> => {
  const cacheKey = 'getOrderActivityLogs';
  try {
    const result = await makeApiRequest(apiUrl('/api/order-activity-logs'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error(i18n.t('orderService.errorFetchingActivityLogs'), error);
    return [];
  }
};

export const saveOrderActivityLog = async (logData: Omit<OrderActivityLog, 'id' | 'createdAt'>): Promise<OrderActivityLog> => {
  try {
    const response = await fetch(apiUrl('/api/order-activity-logs'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(logData)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || i18n.t('api.httpError', { status: response.status });
      throw new Error(errorMessage);
    }
    const savedLog = await response.json();
    notifyUpdates();
    return savedLog;
  } catch (error) {
    console.error(i18n.t('orderService.errorSavingActivityLog'), error);
    throw error;
  }
};