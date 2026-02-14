import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import { sanitizeName, SanitizationError } from '../utils/sanitization';
import i18n from '../src/i18n';

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
      { signal, headers: getAuthHeaders() },
      cacheKey
    );
    return result;
  } catch (error) {
    // Don't log abort errors - they're expected when cancelling
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error(i18n.t('layoutService.errorFetchingTillLayout'), error);
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
    const result = await makeApiRequest(
      apiUrl(`/api/layouts/till/${tillId}/category/${categoryId}`),
      {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ positions })
      }
    );
    notifyUpdates();
    return result;
  } catch (error) {
    console.error(i18n.t('layoutService.errorSavingTillLayout'), error);
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
    await makeApiRequest(
      apiUrl(`/api/layouts/till/${tillId}/category/${categoryId}`),
      {
        method: 'DELETE',
        headers: getAuthHeaders()
      }
    );
    notifyUpdates();
  } catch (error) {
    console.error(i18n.t('layoutService.errorResettingTillLayout'), error);
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
    
    const result = await makeApiRequest(url, { headers: getAuthHeaders() }, cacheKey);
    return result;
  } catch (error) {
    console.error(i18n.t('layoutService.errorFetchingSharedLayouts'), error);
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
      { headers: getAuthHeaders() },
      cacheKey
    );
    return result;
  } catch (error) {
    console.error(i18n.t('layoutService.errorFetchingSharedLayout'), error);
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

    const result = await makeApiRequest(apiUrl('/api/layouts/shared'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name: sanitizedName, categoryId, positions })
    });
    notifyUpdates();
    return result;
  } catch (error) {
    if (error instanceof SanitizationError) {
      throw new Error(i18n.t('layoutService.invalidLayoutName', { message: error.message }) as string);
    }
    console.error(i18n.t('layoutService.errorCreatingSharedLayout'), error);
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
    const result = await makeApiRequest(apiUrl(`/api/layouts/shared/${id}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    notifyUpdates();
    return result;
  } catch (error) {
    console.error(i18n.t('layoutService.errorUpdatingSharedLayout'), error);
    throw error;
  }
};

/**
 * Delete a shared layout
 */
export const deleteSharedLayout = async (id: number): Promise<void> => {
  try {
    await makeApiRequest(apiUrl(`/api/layouts/shared/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    notifyUpdates();
  } catch (error) {
    console.error(i18n.t('layoutService.errorDeletingSharedLayout'), error);
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
    const result = await makeApiRequest(
      apiUrl(`/api/layouts/shared/${sharedLayoutId}/load-to-till/${tillId}`),
      {
        method: 'POST',
        headers: getAuthHeaders()
      }
    );
    notifyUpdates();
    return result.layouts;
  } catch (error) {
    console.error(i18n.t('layoutService.errorLoadingSharedLayoutToTill'), error);
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