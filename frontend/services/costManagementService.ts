import { apiUrl, makeApiRequest, getAuthHeaders, notifyUpdates } from './apiBase';

export interface IngredientCostInfo {
  id: string;
  name: string;
  type: string;
  baseUnit: string;
  standardCost: number;
  costPerUnit: number;
  lastCostUpdate: string;
  costUpdateReason: string | null;
  costStatus: string;
}

export interface CostHistoryEntry {
  id: number;
  stockItemId: string;
  previousCost: number;
  newCost: number;
  changePercent: number;
  reason: string;
  effectiveFrom: string;
  createdBy: number;
  createdAt: string;
  stockItemName?: string;
  createdByName?: string;
}

export interface VariantCostSummary {
  id: number;
  name: string;
  price: number;
  theoreticalCost: number | null;
  currentMargin: number | null;
  costStatus: string;
  lastCostCalc: string | null;
  productId: number;
  productName: string;
  categoryName: string;
}

export interface VariantCostBreakdown {
  variantId: number;
  variantName: string;
  productId: number;
  productName: string;
  ingredientCosts: {
    stockItemId: string;
    stockItemName: string;
    quantity: number;
    standardCost: number;
    ingredientCost: number;
  }[];
  totalCost: number | null;
  hasValidCosts: boolean;
}

export interface InventoryCountSummary {
  id: number;
  countDate: string;
  countType: string;
  status: string;
  notes: string | null;
  createdBy: number;
  createdAt: string;
  createdByName?: string;
  _count?: { items: number };
}

export interface InventoryCountDetail extends InventoryCountSummary {
  items: {
    id: number;
    stockItemId: string;
    quantity: number;
    unitCost: number;
    extendedValue: number;
    notes: string | null;
    stockItemName?: string;
  }[];
}

export interface VarianceReportSummary {
  id: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  theoreticalCost: number;
  actualCost: number;
  varianceValue: number;
  variancePercent: number;
  createdByName: string;
  createdAt: string;
  itemCount: number;
}

export interface VarianceReportDetail extends VarianceReportSummary {
  items: {
    id: number;
    stockItemId: string;
    stockItemName: string;
    theoreticalQty: number;
    actualQty: number;
    varianceQty: number;
    unitCost: number;
    varianceValue: number;
    variancePercent: number;
    status: string;
    notes: string | null;
  }[];
}

export interface ProfitSummary {
  period: { start: string; end: string };
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
  transactionCount: number;
  averageTransaction: number;
  averageMargin: number;
  transactionsWithCosts: number;
  costCoveragePercent: number;
}

export interface ProfitDashboardData {
  summary: ProfitSummary;
  comparison: {
    current: ProfitSummary;
    previous: ProfitSummary;
    changes: {
      revenueChange: number;
      revenueChangePercent: number;
      cogsChange: number;
      cogsChangePercent: number;
      grossProfitChange: number;
      grossProfitChangePercent: number;
      marginChangePp: number;
    };
  } | null;
  byCategory: {
    categoryId: number;
    categoryName: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
    marginPercent: number;
    transactionCount: number;
    itemsSold: number;
  }[];
  byProduct: {
    productId: number;
    productName: string;
    variantId: number;
    variantName: string;
    categoryId: number;
    categoryName: string;
    revenue: number;
    cogs: number | null;
    grossProfit: number | null;
    marginPercent: number | null;
    quantitySold: number;
    hasCostData: boolean;
  }[];
  trend: {
    date: string;
    revenue: number;
    cogs: number;
    grossProfit: number;
    marginPercent: number;
    transactionCount: number;
  }[];
}

export const fetchIngredients = async (
  search?: string,
  category?: string
): Promise<IngredientCostInfo[]> => {
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (category) queryParams.append('category', category);

  const url = apiUrl(`/api/cost-management/ingredients?${queryParams.toString()}`);
  const options = { method: 'GET', headers: getAuthHeaders() };
  return await makeApiRequest(url, options);
};

export const fetchIngredientDetail = async (
  id: string
): Promise<{ ingredient: IngredientCostInfo; history: CostHistoryEntry[] }> => {
  const url = apiUrl(`/api/cost-management/ingredients/${id}`);
  const options = { method: 'GET', headers: getAuthHeaders() };
  return await makeApiRequest(url, options);
};

export const updateIngredientCost = async (
  id: string,
  cost: number,
  reason: string,
  effectiveDate?: string
): Promise<CostHistoryEntry> => {
  const response = await fetch(apiUrl(`/api/cost-management/ingredients/${id}/cost`), {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ cost, reason, effectiveDate })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update ingredient cost');
  }
  notifyUpdates();
  return await response.json();
};

export const fetchCostHistory = async (
  stockItemId: string
): Promise<CostHistoryEntry[]> => {
  const url = apiUrl(`/api/cost-management/ingredients/${stockItemId}/history`);
  const options = { method: 'GET', headers: getAuthHeaders() };
  return await makeApiRequest(url, options);
};

export const fetchRecentCostChanges = async (
  limit?: number
): Promise<CostHistoryEntry[]> => {
  const queryParams = new URLSearchParams();
  if (limit) queryParams.append('limit', limit.toString());

  const url = apiUrl(`/api/cost-management/recent-changes?${queryParams.toString()}`);
  const options = { method: 'GET', headers: getAuthHeaders() };
  return await makeApiRequest(url, options);
};

export const fetchVariantCostSummary = async (
  status?: string,
  productId?: number
): Promise<VariantCostSummary[]> => {
  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  if (productId) queryParams.append('productId', productId.toString());

  const url = apiUrl(`/api/cost-management/variants/cost-summary?${queryParams.toString()}`);
  const options = { method: 'GET', headers: getAuthHeaders() };
  return await makeApiRequest(url, options);
};

export const fetchVariantCostBreakdown = async (
  variantId: number
): Promise<VariantCostBreakdown> => {
  const url = apiUrl(`/api/cost-management/variants/${variantId}/cost`);
  const options = { method: 'GET', headers: getAuthHeaders() };
  return await makeApiRequest(url, options);
};

export const recalculateVariantCost = async (
  variantId: number
): Promise<{ variantId: number; theoreticalCost: number | null; currentMargin: number | null; costStatus: string }> => {
  const response = await fetch(apiUrl(`/api/cost-management/variants/${variantId}/recalculate`), {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to recalculate variant cost');
  }
  notifyUpdates();
  return await response.json();
};

export const bulkRecalculateCosts = async (): Promise<{
  updated: number;
  failed: number;
  skipped: number;
}> => {
  const response = await fetch(apiUrl('/api/cost-management/bulk-recalculate'), {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to bulk recalculate costs');
  }
  notifyUpdates();
  return await response.json();
};

export const fetchInventoryCounts = async (
  status?: string,
  fromDate?: string,
  toDate?: string
): Promise<InventoryCountSummary[]> => {
  const queryParams = new URLSearchParams();
  if (status) queryParams.append('status', status);
  if (fromDate) queryParams.append('fromDate', fromDate);
  if (toDate) queryParams.append('toDate', toDate);

  const url = apiUrl(`/api/cost-management/inventory-counts?${queryParams.toString()}`);
  const options = { method: 'GET', headers: getAuthHeaders() };
  return await makeApiRequest(url, options);
};

export const fetchInventoryCount = async (
  id: number
): Promise<InventoryCountDetail> => {
  const url = apiUrl(`/api/cost-management/inventory-counts/${id}`);
  const options = { method: 'GET', headers: getAuthHeaders() };
  return await makeApiRequest(url, options);
};

export const createInventoryCount = async (data: {
  countDate: string;
  countType: string;
  notes?: string;
  items: { stockItemId: string; quantity: number; notes?: string }[];
}): Promise<InventoryCountDetail> => {
  const response = await fetch(apiUrl('/api/cost-management/inventory-counts'), {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to create inventory count');
  }
  notifyUpdates();
  return await response.json();
};

export const submitInventoryCount = async (
  id: number
): Promise<InventoryCountDetail> => {
  const response = await fetch(apiUrl(`/api/cost-management/inventory-counts/${id}/submit`), {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to submit inventory count');
  }
  notifyUpdates();
  return await response.json();
};

export const approveInventoryCount = async (
  id: number
): Promise<InventoryCountDetail> => {
  const response = await fetch(apiUrl(`/api/cost-management/inventory-counts/${id}/approve`), {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include'
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to approve inventory count');
  }
  notifyUpdates();
  return await response.json();
};

export const fetchVarianceReports = async (
  page?: number,
  limit?: number
): Promise<{ reports: VarianceReportSummary[]; totalCount: number }> => {
  const queryParams = new URLSearchParams();
  if (page) queryParams.append('page', page.toString());
  if (limit) queryParams.append('limit', limit.toString());

  const url = apiUrl(`/api/cost-management/variance-reports?${queryParams.toString()}`);
  const options = { method: 'GET', headers: getAuthHeaders() };
  return await makeApiRequest(url, options);
};

export const fetchVarianceReport = async (
  id: number
): Promise<VarianceReportDetail> => {
  const url = apiUrl(`/api/cost-management/variance-reports/${id}`);
  const options = { method: 'GET', headers: getAuthHeaders() };
  return await makeApiRequest(url, options);
};

export const generateVarianceReport = async (data: {
  periodStart: string;
  periodEnd: string;
  beginningCountId?: number;
  endingCountId?: number;
}): Promise<VarianceReportDetail> => {
  const response = await fetch(apiUrl('/api/cost-management/variance-reports/generate'), {
    method: 'POST',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate variance report');
  }
  notifyUpdates();
  return await response.json();
};

export const updateVarianceReportStatus = async (
  id: number,
  status: string
): Promise<VarianceReportSummary> => {
  const response = await fetch(apiUrl(`/api/cost-management/variance-reports/${id}/status`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ status })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to update variance report status');
  }
  notifyUpdates();
  return await response.json();
};

export const fetchProfitDashboard = async (
  startDate: string,
  endDate: string
): Promise<ProfitDashboardData> => {
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', startDate);
  queryParams.append('endDate', endDate);

  const url = apiUrl(`/api/analytics/profit-dashboard?${queryParams.toString()}`);
  const options = { method: 'GET', headers: getAuthHeaders() };
  return await makeApiRequest(url, options);
};

export const fetchProfitSummary = async (
  startDate: string,
  endDate: string
): Promise<ProfitSummary> => {
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', startDate);
  queryParams.append('endDate', endDate);

  const url = apiUrl(`/api/analytics/profit-summary?${queryParams.toString()}`);
  const options = { method: 'GET', headers: getAuthHeaders() };
  return await makeApiRequest(url, options);
};

export const fetchMarginTrend = async (
  startDate: string,
  endDate: string
): Promise<{
  date: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
  transactionCount: number;
}[]> => {
  const queryParams = new URLSearchParams();
  queryParams.append('startDate', startDate);
  queryParams.append('endDate', endDate);

  const url = apiUrl(`/api/analytics/margin-trend?${queryParams.toString()}`);
  const options = { method: 'GET', headers: getAuthHeaders() };
  return await makeApiRequest(url, options);
};
