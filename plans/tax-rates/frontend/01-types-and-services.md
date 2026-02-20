# Frontend Types and Services Plan

## Objective

Create shared types and API service for tax rates, enabling type-safe communication between frontend and backend.

**Phase:** 5 of 8  
**Dependencies:** Phase 1-4 (Backend complete)  
**Estimated Subtasks:** 7

---

## Current State

### Shared Types ([`shared/types.ts`](shared/types.ts))

```typescript
export interface TaxSettings {
  mode: 'inclusive' | 'exclusive' | 'none';
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  isFavourite?: boolean;
  stockConsumption: { stockItemId: string; quantity: number; }[];
  backgroundColor: string;
  textColor: string;
  // Missing: taxRateId, taxRate
}

export interface Settings {
  tax: TaxSettings;
  businessDay: { ... };
}
```

### Missing
- `TaxRate` interface
- `taxRateId` on `ProductVariant`
- `defaultTaxRateId` on `Settings`
- Tax rate API service

---

## Changes Required

### 1. Add TaxRate Interface

### 2. Update ProductVariant Interface

### 3. Update Settings Interface

### 4. Create Tax Rate API Service

---

## Implementation Details

### File: [`shared/types.ts`](shared/types.ts)

```typescript
// Add TaxRate interface
export interface TaxRate {
  id: number;
  name: string;
  rate: string;  // String to preserve decimal precision
  ratePercent: string;  // Convenience field for display (e.g., "19.00%")
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Update TaxSettings interface
export interface TaxSettings {
  mode: 'inclusive' | 'exclusive' | 'none';
  defaultTaxRateId: number | null;
  defaultTaxRate: TaxRate | null;
}

// Update ProductVariant interface
export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  isFavourite?: boolean;
  stockConsumption: { stockItemId: string; quantity: number; }[];
  backgroundColor: string;
  textColor: string;
  taxRateId: number | null;  // Added
  taxRate: TaxRate | null;   // Added
}

// Update Settings interface
export interface Settings {
  tax: TaxSettings;
  businessDay: {
    autoStartTime: string;
    businessDayEndHour: string;
    lastManualClose: string | null;
    autoCloseEnabled: boolean;
  };
}

// Add input types for API operations
export interface CreateTaxRateInput {
  name: string;
  rate: number | string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateTaxRateInput {
  name?: string;
  rate?: number | string;
  description?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
}
```

---

### File: [`frontend/services/taxRateService.ts`](frontend/services/taxRateService.ts) (New)

```typescript
import api from './api';
import type { TaxRate, CreateTaxRateInput, UpdateTaxRateInput } from '../../shared/types';

export const taxRateService = {
  /**
   * Get all tax rates
   */
  async getTaxRates(): Promise<TaxRate[]> {
    const response = await api.get<TaxRate[]>('/tax-rates');
    return response.data;
  },

  /**
   * Get a single tax rate by ID
   */
  async getTaxRate(id: number): Promise<TaxRate> {
    const response = await api.get<TaxRate>(`/tax-rates/${id}`);
    return response.data;
  },

  /**
   * Create a new tax rate
   */
  async createTaxRate(input: CreateTaxRateInput): Promise<TaxRate> {
    const response = await api.post<TaxRate>('/tax-rates', input);
    return response.data;
  },

  /**
   * Update an existing tax rate
   */
  async updateTaxRate(id: number, input: UpdateTaxRateInput): Promise<TaxRate> {
    const response = await api.put<TaxRate>(`/tax-rates/${id}`, input);
    return response.data;
  },

  /**
   * Deactivate a tax rate (soft delete)
   */
  async deactivateTaxRate(id: number): Promise<TaxRate> {
    const response = await api.delete<TaxRate>(`/tax-rates/${id}`);
    return response.data;
  },

  /**
   * Set a tax rate as the default
   */
  async setDefaultTaxRate(id: number): Promise<TaxRate> {
    const response = await api.put<TaxRate>(`/tax-rates/${id}/default`);
    return response.data;
  }
};

export default taxRateService;
```

---

### File: [`frontend/services/apiService.ts`](frontend/services/apiService.ts) (Update)

Add tax rate exports:

```typescript
// Add to existing exports
export * from './taxRateService';

// Or add individual exports
export { taxRateService } from './taxRateService';
```

---

## Helper Utilities

### File: [`frontend/utils/taxRateUtils.ts`](frontend/utils/taxRateUtils.ts) (New)

```typescript
import type { TaxRate, ProductVariant, Settings } from '../../shared/types';

/**
 * Get the effective tax rate for a product variant.
 * Returns the variant's tax rate if set, otherwise the default tax rate.
 * Returns 0 if no tax rate is available.
 */
export function getEffectiveTaxRate(
  variant: ProductVariant,
  settings: Settings | null
): number {
  // If variant has a tax rate, use it
  if (variant.taxRate && variant.taxRate.isActive) {
    return parseFloat(variant.taxRate.rate);
  }
  
  // Otherwise, use the default tax rate from settings
  if (settings?.tax?.defaultTaxRate && settings.tax.defaultTaxRate.isActive) {
    return parseFloat(settings.tax.defaultTaxRate.rate);
  }
  
  // Fallback to 0% tax
  return 0;
}

/**
 * Format a tax rate for display.
 * @param rate - The tax rate as a decimal (e.g., 0.19 for 19%)
 * @returns Formatted string (e.g., "19.00%")
 */
export function formatTaxRate(rate: number | string): string {
  const rateNumber = typeof rate === 'string' ? parseFloat(rate) : rate;
  return (rateNumber * 100).toFixed(2) + '%';
}

/**
 * Get a display label for a tax rate.
 * Includes the name and percentage.
 */
export function getTaxRateLabel(taxRate: TaxRate | null): string {
  if (!taxRate) {
    return 'Default';
  }
  return `${taxRate.name} (${taxRate.ratePercent})`;
}

/**
 * Check if a variant is using the default tax rate.
 */
export function isUsingDefaultTaxRate(
  variant: ProductVariant,
  settings: Settings | null
): boolean {
  return variant.taxRateId === null && settings?.tax?.defaultTaxRateId !== null;
}

/**
 * Get active tax rates from a list.
 */
export function getActiveTaxRates(taxRates: TaxRate[]): TaxRate[] {
  return taxRates.filter(tr => tr.isActive);
}

/**
 * Get the default tax rate from a list.
 */
export function getDefaultTaxRate(taxRates: TaxRate[]): TaxRate | null {
  return taxRates.find(tr => tr.isDefault && tr.isActive) || null;
}
```

---

## Implementation Subtasks

### Subtask 5.1: Add TaxRate Interface
- [ ] Open [`shared/types.ts`](shared/types.ts)
- [ ] Add `TaxRate` interface
- [ ] Add `CreateTaxRateInput` interface
- [ ] Add `UpdateTaxRateInput` interface

### Subtask 5.2: Update TaxSettings Interface
- [ ] Add `defaultTaxRateId` field
- [ ] Add `defaultTaxRate` field

### Subtask 5.3: Update ProductVariant Interface
- [ ] Add `taxRateId` field
- [ ] Add `taxRate` field

### Subtask 5.4: Create Tax Rate Service
- [ ] Create [`frontend/services/taxRateService.ts`](frontend/services/taxRateService.ts)
- [ ] Implement all CRUD methods
- [ ] Export from apiService

### Subtask 5.5: Create Tax Rate Utilities
- [ ] Create [`frontend/utils/taxRateUtils.ts`](frontend/utils/taxRateUtils.ts)
- [ ] Implement helper functions

### Subtask 5.6: Update API Service Exports
- [ ] Update [`frontend/services/apiService.ts`](frontend/services/apiService.ts)
- [ ] Export tax rate service

### Subtask 5.7: Test Types and Services
- [ ] Verify TypeScript compiles without errors
- [ ] Test API service methods (can be done in later phases)

---

## Files to Create/Modify

| File | Action |
|------|--------|
| [`shared/types.ts`](shared/types.ts) | Modify |
| [`frontend/services/taxRateService.ts`](frontend/services/taxRateService.ts) | Create |
| [`frontend/services/apiService.ts`](frontend/services/apiService.ts) | Modify |
| [`frontend/utils/taxRateUtils.ts`](frontend/utils/taxRateUtils.ts) | Create |

---

## Usage Examples

### Using Tax Rate Service

```typescript
import { taxRateService } from '../services/apiService';

// Get all tax rates
const taxRates = await taxRateService.getTaxRates();

// Create a new tax rate
const newRate = await taxRateService.createTaxRate({
  name: 'Super Reduced',
  rate: 0.04,
  description: 'Super reduced VAT rate (4%)'
});

// Set as default
await taxRateService.setDefaultTaxRate(newRate.id);
```

### Using Tax Rate Utilities

```typescript
import { getEffectiveTaxRate, getTaxRateLabel } from '../utils/taxRateUtils';

// Get effective tax rate for a variant
const taxRate = getEffectiveTaxRate(variant, settings);

// Get display label
const label = getTaxRateLabel(variant.taxRate);
// Output: "Standard Rate (19.00%)"
```

---

## Rollback Strategy

1. Remove `TaxRate` interface and related types from [`shared/types.ts`](shared/types.ts)
2. Remove `taxRateId` and `taxRate` from `ProductVariant`
3. Remove `defaultTaxRateId` and `defaultTaxRate` from `TaxSettings`
4. Delete [`frontend/services/taxRateService.ts`](frontend/services/taxRateService.ts)
5. Delete [`frontend/utils/taxRateUtils.ts`](frontend/utils/taxRateUtils.ts)
6. Revert [`frontend/services/apiService.ts`](frontend/services/apiService.ts) exports

---

## Testing Considerations

### Type Checking
- Run `tsc --noEmit` to verify types compile
- Check for any type errors in existing code

### Unit Tests
- Test `getEffectiveTaxRate` utility
- Test `formatTaxRate` utility
- Test `getTaxRateLabel` utility

### Integration Tests
- Test tax rate service methods with mock API
- Verify error handling works correctly
