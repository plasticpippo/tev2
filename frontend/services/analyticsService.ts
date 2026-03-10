import { apiUrl, makeApiRequest, getAuthHeaders } from './apiBase';

// Define types for the API response
export interface ProductPerformance {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
  transactionCount: number;
  totalCost?: number;
  grossProfit?: number;
  profitMargin?: number | null;
}

export interface ProductPerformanceResult {
  products: ProductPerformance[];
  metadata: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  summary: {
    totalRevenue: number;
    totalUnitsSold: number;
    totalCost?: number;
    totalProfit?: number;
    averageMargin?: number | null;
    topProduct: {
      name: string;
      revenue: number;
      quantity: number;
    } | null;
  };
}

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  productId?: number;
  categoryId?: number;
  sortBy?: 'revenue' | 'quantity' | 'name' | 'cost' | 'profit';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeAllProducts?: boolean;
}

export const fetchProductPerformance = async (
  params: AnalyticsParams = {}
): Promise<ProductPerformanceResult> => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.productId) queryParams.append('productId', params.productId.toString());
  if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.includeAllProducts !== undefined) {
    queryParams.append('includeAllProducts', params.includeAllProducts.toString());
  }

  const url = apiUrl(`/api/analytics/product-costs?${queryParams.toString()}`);
  const options = {
    method: 'GET',
    headers: getAuthHeaders()
  };
  
  return await makeApiRequest(url, options);
};

export const fetchTopPerformers = async (
  params: AnalyticsParams = {}
): Promise<ProductPerformanceResult> => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.productId) queryParams.append('productId', params.productId.toString());
  if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const url = apiUrl(`/api/analytics/top-performers?${queryParams.toString()}`);
  const options = {
    method: 'GET',
    headers: getAuthHeaders()
  };
  
  return await makeApiRequest(url, options);
};

// Product cost analytics types
export interface ProductCostData {
  productId: number;
  productName: string;
  variantName: string;
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number | null;
  netEarnings: number;
}

export interface ProductCostResult {
  products: ProductCostData[];
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    averageMargin: number | null;
  };
}

export const fetchProductCosts = async (
  params: AnalyticsParams = {}
): Promise<ProductCostResult> => {
  const queryParams = new URLSearchParams();
  
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.categoryId) queryParams.append('categoryId', params.categoryId.toString());
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const url = apiUrl(`/api/analytics/product-costs?${queryParams.toString()}`);
  const options = {
    method: 'GET',
    headers: getAuthHeaders()
  };
  
  return await makeApiRequest(url, options);
};

// Cost breakdown for a single product
export interface CostBreakdownItem {
  stockItemName: string;
  quantity: number;
  costPerUnit: number;
  taxRate: number;
  subtotal: number;
}

export interface VariantCostData {
  variantId: number;
  variantName: string;
  sellingPrice: number;
  taxRate: number;
  sellingPriceExclVAT: number;
  costBreakdown: CostBreakdownItem[];
  calculatedCost: number;
  manualCostOverride: number | null;
  grossProfit: number;
  profitMargin: number | null;
  netEarnings: number;
}

export interface ProductCostBreakdownResult {
  productId: number;
  productName: string;
  variants: VariantCostData[];
}

export const fetchProductCostBreakdown = async (
  productId: number
): Promise<ProductCostBreakdownResult> => {
  const url = apiUrl(`/api/products/${productId}/cost-breakdown`);
  const options = {
    method: 'GET',
    headers: getAuthHeaders()
  };
  
  return await makeApiRequest(url, options);
};