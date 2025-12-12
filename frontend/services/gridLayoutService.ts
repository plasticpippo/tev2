import { apiUrl } from './apiBase';
import type { ProductGridLayoutData } from './apiBase';

// Function to save a grid layout
export const saveGridLayout = async (layoutData: ProductGridLayoutData): Promise<ProductGridLayoutData> => {
  const response = await fetch(apiUrl('/api/grid-layouts/tills/' + layoutData.tillId + '/grid-layouts'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: layoutData.name,
      layout: layoutData.layout,
      isDefault: layoutData.isDefault,
      filterType: layoutData.filterType,
      categoryId: layoutData.categoryId
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to save grid layout: ${response.statusText}`);
  }

  return response.json();
};

// Function to get grid layouts for a till
export const getGridLayoutsForTill = async (tillId: number): Promise<ProductGridLayoutData[]> => {
  const response = await fetch(apiUrl(`/api/grid-layouts/tills/${tillId}/grid-layouts`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get grid layouts: ${response.statusText}`);
  }

 return response.json();
};

// Function to get current layout for a till
export const getCurrentLayoutForTill = async (tillId: number): Promise<ProductGridLayoutData> => {
  const response = await fetch(apiUrl(`/api/grid-layouts/tills/${tillId}/current-layout`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get current layout: ${response.statusText}`);
  }

  return response.json();
};

// Function to get current layout for a till with specific filter type
export const getCurrentLayoutForTillWithFilter = async (tillId: number, filterType: string, categoryId?: number | null): Promise<ProductGridLayoutData> => {
  let url = `${apiUrl(`/api/grid-layouts/tills/${tillId}/current-layout?filterType=${filterType}`)}`;
  if (filterType === 'category' && categoryId !== undefined && categoryId !== null) {
    url += `&categoryId=${categoryId}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get current layout: ${response.statusText}`);
  }

  return response.json();
};

// Function to get shared layouts
export const getSharedLayouts = async (): Promise<ProductGridLayoutData[]> => {
  const response = await fetch(apiUrl('/api/grid-layouts/shared'), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get shared layouts: ${response.statusText}`);
  }

  return response.json();
};

// Function to delete a grid layout
export const deleteGridLayout = async (layoutId: string): Promise<void> => {
  const response = await fetch(apiUrl(`/api/grid-layouts/${layoutId}`), {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete grid layout: ${response.statusText}`);
  }
};

// Function to set a layout as default
export const setLayoutAsDefault = async (layoutId: string): Promise<ProductGridLayoutData> => {
  const response = await fetch(apiUrl(`/api/grid-layouts/${layoutId}/set-default`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to set layout as default: ${response.statusText}`);
  }

  return response.json();
};

// Function to get layouts by filter type for a specific till
export const getLayoutsByFilterType = async (
  tillId: number,
  filterType: 'all' | 'favorites' | 'category',
  categoryId?: number | null
): Promise<ProductGridLayoutData[]> => {
  let url = `${apiUrl(`/api/grid-layouts/tills/${tillId}/layouts-by-filter/${filterType}`)}`;
  
  if (filterType === 'category' && categoryId !== undefined && categoryId !== null) {
    url += `?categoryId=${categoryId}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get layouts by filter type: ${response.statusText}`);
  }

  return response.json();
};

// Function to get a specific layout by ID
export const getLayoutById = async (layoutId: string): Promise<ProductGridLayoutData> => {
  const response = await fetch(apiUrl(`/api/grid-layouts/${layoutId}`), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get layout by ID: ${response.statusText}`);
  }

  return response.json();
};