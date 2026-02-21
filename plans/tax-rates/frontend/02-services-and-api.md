# Frontend Implementation Plan: Variable Tax Rates - Services and API

## Overview

This plan covers the service layer for tax rate API communication, following existing patterns from [`settingService.ts`](../../frontend/services/settingService.ts) and [`apiBase.ts`](../../frontend/services/apiBase.ts).

---

## New Service File: `frontend/services/taxRateService.ts`

### Imports

```typescript
import i18n from '../src/i18n';
import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';
import type { TaxRate } from '@shared/types';
```

### Function Signatures

#### `getTaxRates`

List all tax rates (available to all authenticated users).

```typescript
/**
 * Fetch all tax rates
 * GET /api/tax-rates
 * @returns Promise<TaxRate[]> - Array of tax rates
 */
export const getTaxRates = async (): Promise<TaxRate[]> => {
  const cacheKey = 'getTaxRates';
  try {
    const result = await makeApiRequest(
      apiUrl('/api/tax-rates'),
      undefined,
      cacheKey
    );
    return result;
  } catch (error) {
    console.error(i18n.t('taxRateService.errorFetchingTaxRates'), error);
    return [];
  }
};
```

#### `getTaxRate`

Get a single tax rate by ID.

```typescript
/**
 * Fetch a single tax rate by ID
 * GET /api/tax-rates/:id
 * @param id - Tax rate ID
 * @returns Promise<TaxRate | null>
 */
export const getTaxRate = async (id: number): Promise<TaxRate | null> => {
  try {
    const result = await makeApiRequest(
      apiUrl(`/api/tax-rates/${id}`)
    );
    return result;
  } catch (error) {
    console.error(i18n.t('taxRateService.errorFetchingTaxRate'), error);
    return null;
  }
};
```

#### `createTaxRate`

Create a new tax rate (admin only).

```typescript
/**
 * Create a new tax rate
 * POST /api/tax-rates
 * @param data - Tax rate creation data
 * @returns Promise<TaxRate>
 */
export interface CreateTaxRateData {
  name: string;
  rate: string;        // Decimal string e.g., "0.1900" for 19%. Backend validates 0-1, NOT 0-100!
  description?: string;
  isDefault?: boolean;
}

export const createTaxRate = async (data: CreateTaxRateData): Promise<TaxRate> => {
  const response = await fetch(apiUrl('/api/tax-rates'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || i18n.t('api.httpError', { status: response.status }));
  }
  
  notifyUpdates();
  return await response.json();
};
```

#### `updateTaxRate`

Update an existing tax rate (admin only).

```typescript
/**
 * Update an existing tax rate
 * PUT /api/tax-rates/:id
 * @param id - Tax rate ID
 * @param data - Update data
 * @returns Promise<TaxRate>
 */
export interface UpdateTaxRateData {
  name?: string;
  rate?: string;
  description?: string | null;
  isActive?: boolean;
}

export const updateTaxRate = async (id: number, data: UpdateTaxRateData): Promise<TaxRate> => {
  const response = await fetch(apiUrl(`/api/tax-rates/${id}`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || i18n.t('api.httpError', { status: response.status }));
  }
  
  notifyUpdates();
  return await response.json();
};
```

#### `setDefaultTaxRate`

Set a tax rate as the system default (admin only).

```typescript
/**
 * Set a tax rate as the system default
 * PUT /api/tax-rates/:id/default
 * @param id - Tax rate ID to set as default
 * @returns Promise<TaxRate>
 */
export const setDefaultTaxRate = async (id: number): Promise<TaxRate> => {
  const response = await fetch(apiUrl(`/api/tax-rates/${id}/default`), {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || i18n.t('api.httpError', { status: response.status }));
  }
  
  notifyUpdates();
  return await response.json();
};
```

#### `deleteTaxRate`

Soft delete (deactivate) a tax rate (admin only).

```typescript
/**
 * Deactivate a tax rate (soft delete)
 * DELETE /api/tax-rates/:id
 * @param id - Tax rate ID to deactivate
 * @returns Promise<void>
 */
export const deleteTaxRate = async (id: number): Promise<void> => {
  const response = await fetch(apiUrl(`/api/tax-rates/${id}`), {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || i18n.t('api.httpError', { status: response.status }));
  }
  
  notifyUpdates();
};
```

---

## Changes to `frontend/services/settingService.ts`

### Current Implementation

The existing [`settingService.ts`](../../frontend/services/settingService.ts) handles settings with these functions:
- [`getSettings()`](../../frontend/services/settingService.ts:6) - Fetches settings
- [`saveSettings()`](../../frontend/services/settingService.ts:21) - Saves settings via PUT

### Required Updates

#### 1. Update Default Settings

Modify the fallback settings in [`getSettings()`](../../frontend/services/settingService.ts:14) to include `defaultTaxRateId`:

```typescript
// Current fallback
return {
  tax: { mode: 'none' },
  businessDay: { autoStartTime: '06:00', lastManualClose: null }
};

// Updated fallback
return {
  tax: { 
    mode: 'none', 
    defaultTaxRateId: null,
    defaultTaxRate: null 
  },
  businessDay: { 
    autoStartTime: '06:00', 
    businessDayEndHour: '06:00',
    lastManualClose: null,
    autoCloseEnabled: false 
  }
};
```

#### 2. No Changes Needed to `saveSettings()`

The existing [`saveSettings()`](../../frontend/services/settingService.ts:21) function already handles arbitrary settings objects via JSON serialization. The backend will handle the new `defaultTaxRateId` field automatically.

---

## API Endpoints Summary

| Function | Method | Endpoint | Auth |
|----------|--------|----------|------|
| `getTaxRates()` | GET | `/api/tax-rates` | Any authenticated user |
| `getTaxRate(id)` | GET | `/api/tax-rates/:id` | Any authenticated user |
| `createTaxRate(data)` | POST | `/api/tax-rates` | Admin only |
| `updateTaxRate(id, data)` | PUT | `/api/tax-rates/:id` | Admin only |
| `setDefaultTaxRate(id)` | PUT | `/api/tax-rates/:id/default` | Admin only |
| `deleteTaxRate(id)` | DELETE | `/api/tax-rates/:id` | Admin only |

---

## i18n Keys to Add

Add to [`frontend/src/i18n/locales/en/translation.json`](../../frontend/src/i18n/locales/en/translation.json):

```json
{
  "taxRateService": {
    "errorFetchingTaxRates": "Error fetching tax rates",
    "errorFetchingTaxRate": "Error fetching tax rate"
  }
}
```

---

## Next Steps

1. **Part 3**: Tax rate management UI component ([`TaxSettings.tsx`](../../frontend/components/TaxSettings.tsx))
2. **Part 4**: Product management integration
3. **Part 5**: Tax calculation updates in DataContext
4. **Part 6**: Transaction and reporting updates
