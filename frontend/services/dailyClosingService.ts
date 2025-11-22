import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { DailyClosing } from './apiBase';

// Daily Closings
export const getDailyClosings = async (dateFrom?: string, dateTo?: string): Promise<DailyClosing[]> => {
  const cacheKey = `getDailyClosings_${dateFrom || ''}_${dateTo || ''}`;
  try {
    let url = apiUrl('/api/daily-closings');
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom);
    if (dateTo) params.append('dateTo', dateTo);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const result = await makeApiRequest(url, undefined, cacheKey);
    return result;
 } catch (error) {
    console.error('Error fetching daily closings:', error);
    return [];
  }
};

export const createDailyClosing = async (closedAt: string, userId: number): Promise<DailyClosing> => {
  try {
    const response = await fetch(apiUrl('/api/daily-closings'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ closedAt, userId, summary: {} }) // Summary will be calculated on the backend
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    const savedClosing = await response.json();
    notifyUpdates();
    return savedClosing;
  } catch (error) {
    console.error('Error creating daily closing:', error);
    throw error;
 }
};