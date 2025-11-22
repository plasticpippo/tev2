import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { Till } from '../../shared/types';

// Tills
export const getTills = async (): Promise<Till[]> => {
  const cacheKey = 'getTills';
  try {
    const result = await makeApiRequest(apiUrl('/api/tills'), undefined, cacheKey);
    return result;
  } catch (error) {
    console.error('Error fetching tills:', error);
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
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    const savedTill = await response.json();
    notifyUpdates();
    return savedTill;
  } catch (error) {
    console.error('Error saving till:', error);
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
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    notifyUpdates();
    return { success: true };
  } catch (error) {
    console.error('Error deleting till:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to delete till' };
  }
};