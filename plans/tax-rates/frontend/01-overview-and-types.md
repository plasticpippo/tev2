# Frontend Implementation Plan: Variable Tax Rates - Overview and Types

## Overview

This plan outlines the frontend implementation for variable tax rates (VAT) functionality. The feature allows different tax rates to be assigned to individual product variants, with a fallback to a default system-wide tax rate.

**Prerequisites:** Backend implementation completed (see [`plans/tax-rates/backend/01-implementation-plan.md`](../backend/01-implementation-plan.md))

---

## Frontend Files Requiring Changes

### Shared Types
| File | Changes |
|------|---------|
| [`shared/types.ts`](../../shared/types.ts) | Add TaxRate interface, update ProductVariant and Settings interfaces |

### Components
| File | Changes |
|------|---------|
| [`frontend/components/TaxSettings.tsx`](../../frontend/components/TaxSettings.tsx) | Add tax rate management UI (CRUD operations) |
| [`frontend/components/ProductManagement.tsx`](../../frontend/components/ProductManagement.tsx) | Add tax rate selector for product variants |
| [`frontend/components/PaymentModal.tsx`](../../frontend/components/PaymentModal.tsx) | Update tax calculation to use variant-specific rates |
| [`frontend/components/TransactionHistory.tsx`](../../frontend/components/TransactionHistory.tsx) | Display tax rate per item in transaction details |
| [`frontend/components/DailyClosingSummaryView.tsx`](../../frontend/components/DailyClosingSummaryView.tsx) | Group tax by different rates in closing summary |

### Services
| File | Changes |
|------|---------|
| [`frontend/services/api.ts`](../../frontend/services/api.ts) | Add tax rate API endpoints |

### Contexts
| File | Changes |
|------|---------|
| [`frontend/contexts/DataContext.tsx`](../../frontend/contexts/DataContext.tsx) | Add tax rates to data context, update tax calculation logic |

---

## New TypeScript Type Definitions

### TaxRate Interface

Add to [`shared/types.ts`](../../shared/types.ts):

```typescript
export interface TaxRate {
  id: number;
  name: string;           // e.g., "Standard Rate", "Reduced Rate"
  rate: string;           // Decimal as string (e.g., "0.1900" for 19%). Backend validates 0-1, NOT 0-100!
  ratePercent: string;    // Convenience field for display (e.g., "19.00%")
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Important:** The backend stores rate as `Decimal(5,4)` with values 0.0000 to 1.0000. The `rate` field is the decimal value (0-1), while `ratePercent` is a computed field for display purposes.

### Updated ProductVariant Interface

Modify existing [`ProductVariant`](../../shared/types.ts:11) interface:

```typescript
export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  isFavourite?: boolean;
  stockConsumption: {
    stockItemId: string;
    quantity: number;
  }[];
  backgroundColor: string;
  textColor: string;
  taxRateId: number | null;    // NEW: Optional tax rate override
  taxRate: TaxRate | null;     // NEW: Populated tax rate object
}
```

### Updated Settings Interface

Modify existing [`Settings`](../../shared/types.ts:70) and [`TaxSettings`](../../shared/types.ts:66) interfaces:

```typescript
export interface TaxSettings {
  mode: 'inclusive' | 'exclusive' | 'none';
  defaultTaxRateId: number | null;    // NEW: System default tax rate
  defaultTaxRate: TaxRate | null;     // NEW: Populated default tax rate
}

export interface Settings {
  tax: TaxSettings;
  businessDay: {
    autoStartTime: string;
    businessDayEndHour: string;
    lastManualClose: string | null;
    autoCloseEnabled: boolean;
  };
}
```

---

## Tax Rate Resolution Logic

When calculating tax for a product variant, use this resolution order:

1. **Variant-specific rate**: If `variant.taxRateId` is set, use `variant.taxRate.rate`
2. **System default rate**: If variant has no rate, use `settings.tax.defaultTaxRate.rate`
3. **Fallback**: If no default is configured, treat as tax-free (rate = 0)

```typescript
function getEffectiveTaxRate(variant: ProductVariant, settings: Settings): number {
  // 1. Variant-specific override
  if (variant.taxRate?.isActive) {
    return parseFloat(variant.taxRate.rate);
  }
  
  // 2. System default
  if (settings.tax.defaultTaxRate?.isActive) {
    return parseFloat(settings.tax.defaultTaxRate.rate);
  }
  
  // 3. Fallback - no tax
  return 0;
}
```

---

## API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tax-rates` | List all tax rates |
| GET | `/api/tax-rates/:id` | Get single tax rate |
| POST | `/api/tax-rates` | Create tax rate (admin) |
| PUT | `/api/tax-rates/:id` | Update tax rate (admin) |
| PUT | `/api/tax-rates/:id/default` | Set as default (admin) |
| DELETE | `/api/tax-rates/:id` | Deactivate tax rate (admin) |

---

## Next Steps

1. **Part 2**: API service layer updates
2. **Part 3**: Tax rate management UI component
3. **Part 4**: Product management integration
4. **Part 5**: Tax calculation updates
5. **Part 6**: Transaction and reporting updates
