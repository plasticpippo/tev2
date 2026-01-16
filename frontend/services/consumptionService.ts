import { makeApiRequest, apiUrl } from './apiBase';
import type { ConsumptionReportItem, ConsumptionReportResponse } from '../../shared/types';

interface ConsumptionFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: number;
  stockItemType?: string;
}

export const getConsumptionReport = async (filters: ConsumptionFilters = {}): Promise<ConsumptionReportResponse> => {
  const queryParams = new URLSearchParams();
  
  if (filters.startDate) {
    queryParams.append('startDate', filters.startDate);
  }
  if (filters.endDate) {
    queryParams.append('endDate', filters.endDate);
  }
  if (filters.categoryId) {
    queryParams.append('categoryId', filters.categoryId.toString());
  }
  if (filters.stockItemType) {
    queryParams.append('stockItemType', filters.stockItemType);
  }

  const queryString = queryParams.toString();
  const endpoint = `/api/consumption-reports/itemised${queryString ? `?${queryString}` : ''}`;

  return makeApiRequest(apiUrl(endpoint), {
    method: 'GET',
  });
};