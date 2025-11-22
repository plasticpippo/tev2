import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { OrderItem, OrderActivityLog } from '../../shared/types';
import type { OrderSession } from './apiBase';

// Order Sessions
export const getOrderSession = async (): Promise<OrderSession | null> => {
  try {
    // Get userId from localStorage or wherever it's stored after login
    const storedUser = localStorage.getItem('currentUser');
    const userId = storedUser ? JSON.parse(storedUser).id : null;
    
    if (!userId) {
      console.warn('No user authenticated for order session, returning null');
      return null;
    }
    
    const response = await fetch(apiUrl(`/api/order-sessions/current?userId=${userId}`));
    if (!response.ok) {
      if (response.status === 404) {
        // Return null or empty session if no active session exists
        return null;
      } else if (response.status === 401) {
        // User not authenticated, return null instead of throwing
        console.warn('User not authenticated for order session, returning null');
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
 } catch (error) {
    console.error('Error fetching order session:', error);
    // Return null instead of throwing to prevent errors during initialization
    return null;
  }
};

export const saveOrderSession = async (orderItems: OrderItem[]): Promise<OrderSession | null> => {
  try {
    // Get userId from localStorage or wherever it's stored after login
    const storedUser = localStorage.getItem('currentUser');
    const userId = storedUser ? JSON.parse(storedUser).id : null;
    
    if (!userId) {
      console.warn('No user authenticated for order session save, returning null');
      return null;
    }
    
    const response = await fetch(apiUrl('/api/order-sessions/current'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items: orderItems, userId })
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated, don't throw error to prevent app crashes
        console.warn('User not authenticated for order session save, returning null');
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const savedSession = await response.json();
    notifyUpdates();
    return savedSession;
  } catch (error) {
    console.error('Error saving order session:', error);
    // Return null instead of throwing to prevent errors during initialization
    return null;
  }
};

export const updateOrderSessionStatus = async (status: 'logout' | 'complete' | 'assign-tab'): Promise<OrderSession | null> => {
  try {
    // Get userId from localStorage or wherever it's stored after login
    const storedUser = localStorage.getItem('currentUser');
    const userId = storedUser ? JSON.parse(storedUser).id : null;
    
    if (!userId) {
      console.warn(`No user authenticated for order session status update (${status}), returning null`);
      return null;
    }
    
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
        throw new Error(`Invalid status: ${status}`);
    }
    
    const response = await fetch(apiUrl(endpoint), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        // User not authenticated, don't throw error to prevent app crashes
        console.warn(`User not authenticated for order session status update (${status}), returning null`);
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const updatedSession = await response.json();
    notifyUpdates();
    return updatedSession;
  } catch (error) {
    console.error(`Error updating order session status (${status}):`, error);
    // Return null instead of throwing to prevent errors during initialization
    return null;
  }
};

export const clearOrderSession = async (): Promise<void> => {
  // Helper function to clear the session after completion
  // In our implementation, this happens by updating the status to 'completed' or 'pending_logout'
  console.log('Order session cleared');
};

// Order Activity Log
export const getOrderActivityLogs = async (): Promise<OrderActivityLog[]> => {
  const cacheKey = 'getOrderActivityLogs';
  try {
    const result = await makeApiRequest(apiUrl('/api/order-activity-logs'), undefined, cacheKey);
    return result;
 } catch (error) {
    console.error('Error fetching order activity logs:', error);
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
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    const savedLog = await response.json();
    notifyUpdates();
    return savedLog;
  } catch (error) {
    console.error('Error saving order activity log:', error);
    throw error;
 }
};