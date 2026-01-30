import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import { sanitizeName, SanitizationError } from '../utils/sanitization';

// ============================================
// TYPES
// ============================================

export interface VariantLayoutPosition {
  variantId: number;
  gridColumn: number;
  gridRow: number;
}

export interface VariantLayout {
  id: number;
  tillId: number;
  categoryId: number;
  variantId: number;
  gridColumn: number;
  gridRow: number;
  createdAt: string;
  updatedAt: string;
}

export interface SharedLayoutPosition {
  id: number;
  sharedLayoutId: number;
  variantId: number;
  gridColumn: number;
  gridRow: number;
}

export interface SharedLayout {
  id: number;
  name: string;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  positions: SharedLayoutPosition[];
  category?: {
    id: number;
    name: string;
  };
}

// ============================================
// TILL-SPECIFIC LAYOUT FUNCTIONS
// ============================================

/**
 * Get layout for a specific till and category
 */
export const getTillLayout = async (
  tillId: number,
  categoryId: number,
  signal?: AbortSignal
): Promise<VariantLayout[]> => {
  const cacheKey = `getTillLayout_${tillId}_${categoryId}`;
  try {
    const result = await makeApiRequest(
      apiUrl(`/api/layouts/till/${tillId}/category/${categoryId}`),
      { signal },
      cacheKey
    );
    return result;
  } catch (error) {
    // Don't log abort errors - they're expected when cancelling
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error fetching till layout:', error);
    return [];
  }
};

/**
 * Save layout for a specific till and category
 */
export const saveTillLayout = async (
  tillId: number,
  categoryId: number,
  positions: VariantLayoutPosition[]
): Promise<VariantLayout[]> => {
  try {
    const response = await fetch(
      apiUrl(`/api/layouts/till/${tillId}/category/${categoryId}`),
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ positions })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const savedLayouts = await response.json();
    notifyUpdates();
    return savedLayouts;
  } catch (error) {
    console.error('Error saving till layout:', error);
    throw error;
  }
};

/**
 * Reset layout for a specific till and category (delete all positions)
 */
export const resetTillLayout = async (
  tillId: number,
  categoryId: number
): Promise<void> => {
  try {
    const response = await fetch(
      apiUrl(`/api/layouts/till/${tillId}/category/${categoryId}`),
      {
        method: 'DELETE',
        headers: getAuthHeaders()
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    notifyUpdates();
  } catch (error) {
    console.error('Error resetting till layout:', error);
    throw error;
  }
};

// ============================================
// SHARED LAYOUT FUNCTIONS
// ============================================

/**
 * Get all shared layouts, optionally filtered by category
 */
export const getSharedLayouts = async (
  categoryId?: number
): Promise<SharedLayout[]> => {
  const cacheKey = categoryId 
    ? `getSharedLayouts_${categoryId}` 
    : 'getSharedLayouts';
  
  try {
    const url = categoryId
      ? apiUrl(`/api/layouts/shared?categoryId=${categoryId}`)
      : apiUrl('/api/layouts/shared');
    
    const result = await makeApiRequest(url, undefined, cacheKey);
    return result;
  } catch (error) {
    console.error('Error fetching shared layouts:', error);
    return [];
  }
};

/**
 * Get a specific shared layout by ID
 */
export const getSharedLayout = async (id: number): Promise<SharedLayout | null> => {
  const cacheKey = `getSharedLayout_${id}`;
  try {
    const result = await makeApiRequest(
      apiUrl(`/api/layouts/shared/${id}`),
      undefined,
      cacheKey
    );
    return result;
  } catch (error) {
    console.error('Error fetching shared layout:', error);
    return null;
  }
};

/**
 * Create a new shared layout
 */
export const createSharedLayout = async (
  name: string,
  categoryId: number,
  positions: VariantLayoutPosition[]
): Promise<SharedLayout> => {
  try {
    // Sanitize layout name for defense-in-depth
    const sanitizedName = sanitizeName(name);

    const response = await fetch(apiUrl('/api/layouts/shared'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: sanitizedName, categoryId, positions })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const createdLayout = await response.json();
    notifyUpdates();
    return createdLayout;
  } catch (error) {
    if (error instanceof SanitizationError) {
      throw new Error(`Invalid layout name: ${error.message}`);
    }
    console.error('Error creating shared layout:', error);
    throw error;
  }
};

/**
 * Update an existing shared layout
 */
export const updateSharedLayout = async (
  id: number,
  updates: {
    name?: string;
    positions?: VariantLayoutPosition[];
  }
): Promise<SharedLayout> => {
  try {
    const response = await fetch(apiUrl(`/api/layouts/shared/${id}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const updatedLayout = await response.json();
    notifyUpdates();
    return updatedLayout;
  } catch (error) {
    console.error('Error updating shared layout:', error);
    throw error;
  }
};

/**
 * Delete a shared layout
 */
export const deleteSharedLayout = async (id: number): Promise<void> => {
  try {
    const response = await fetch(apiUrl(`/api/layouts/shared/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    notifyUpdates();
  } catch (error) {
    console.error('Error deleting shared layout:', error);
    throw error;
  }
};

/**
 * Load a shared layout into a specific till
 * This creates a copy of the shared layout as a till-specific layout
 */
export const loadSharedLayoutToTill = async (
  sharedLayoutId: number,
  tillId: number
): Promise<VariantLayout[]> => {
  try {
    const response = await fetch(
      apiUrl(`/api/layouts/shared/${sharedLayoutId}/load-to-till/${tillId}`),
      {
        method: 'POST',
        headers: getAuthHeaders()
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    const result = await response.json();
    notifyUpdates();
    return result.layouts;
  } catch (error) {
    console.error('Error loading shared layout to till:', error);
    throw error;
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Convert VariantLayout array to VariantLayoutPosition array
 */
export const variantLayoutsToPositions = (
  layouts: VariantLayout[]
): VariantLayoutPosition[] => {
  return layouts.map(layout => ({
    variantId: layout.variantId,
    gridColumn: layout.gridColumn,
    gridRow: layout.gridRow
  }));
};

/**
 * Convert SharedLayoutPosition array to VariantLayoutPosition array
 */
export const sharedLayoutPositionsToPositions = (
  positions: SharedLayoutPosition[]
): VariantLayoutPosition[] => {
  return positions.map(pos => ({
    variantId: pos.variantId,
    gridColumn: pos.gridColumn,
    gridRow: pos.gridRow
  }));
};