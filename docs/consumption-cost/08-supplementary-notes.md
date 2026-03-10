# Supplementary Notes

## Overview

This document covers additional considerations and missing items identified during review.

## 1. Purchasing Units Cost Calculation

The user mentioned "calculate cost from purchasing units". The existing `purchasingUnits` JSON field can contain cost information that should be used to auto-calculate `costPerUnit`.

### Purchasing Units Structure

```json
[
  {
    "id": "uuid",
    "name": "Case",
    "quantity": 6,
    "barcode": "123456789",
    "cost": 30.00
  }
]
```

### Auto-Calculation Logic

```
costPerUnit = purchasingUnit.cost / purchasingUnit.quantity

Example:
- Case of 6 bottles costs €30
- costPerUnit = €30 / 6 = €5 per bottle
```

### Implementation

Add a helper function in the stock items handler:

```typescript
/**
 * Calculate cost per base unit from purchasing units
 * @param purchasingUnits - Array of purchasing units with cost info
 * @returns Calculated cost per unit, or null if not calculable
 */
function calculateCostFromPurchasingUnits(purchasingUnits: any[]): number | null {
  if (!purchasingUnits || purchasingUnits.length === 0) {
    return null;
  }

  // Find the first purchasing unit with valid cost
  const unitWithCost = purchasingUnits.find(u => u.cost && u.quantity);
  if (!unitWithCost) {
    return null;
  }

  return unitWithCost.cost / unitWithCost.quantity;
}
```

When saving a StockItem:
1. If `costPerUnit` is not provided, auto-calculate from purchasingUnits
2. If `costPerUnit` IS provided, use the manual value (don't override)

## 2. Router Registration

New endpoints must be registered in the main router. Update `backend/src/router.ts`:

```typescript
import { productsRouter } from './handlers/products';
import { consumptionReportsRouter } from './handlers/consumptionReports';

// Existing routes
app.use('/api/products', productsRouter);
app.use('/api/stock-items', stockItemsRouter);
app.use('/api/consumption-reports', consumptionReportsRouter);

// Cost analytics will be added to existing analytics router
// or create new router
```

## 3. Error Handling & i18n

Add error messages to both language files:

### backend/locales/en/errors.json additions

```json
{
  "stockItems": {
    "costPerUnitRequired": "Cost per unit is required for cost tracking",
    "costPerUnitInvalid": "Cost per unit must be a positive number",
    "invalidTaxRateReference": "Invalid tax rate reference: {ids}"
  },
  "products": {
    "costPriceInvalid": "Cost price must be a positive number",
    "costPriceExceedsSellingPrice": "Cost price exceeds selling price"
  },
  "costCalculation": {
    "noStockConsumption": "No stock consumption defined for this product",
    "calculationFailed": "Failed to calculate cost"
  }
}
```

### backend/locales/it/errors.json additions

```json
{
  "stockItems": {
    "costPerUnitRequired": "Il costo per unita e richiesto per il tracciamento dei costi",
    "costPerUnitInvalid": "Il costo per unita deve essere un numero positivo",
    "invalidTaxRateReference": "Riferimento tasso fiscale non valido: {ids}"
  },
  "products": {
    "costPriceInvalid": "Il prezzo di costo deve essere un numero positivo",
    "costPriceExceedsSellingPrice": "Il prezzo di costo supera il prezzo di vendita"
  },
  "costCalculation": {
    "noStockConsumption": "Nessun consumo di stock definito per questo prodotto",
    "calculationFailed": "Impossibile calcolare il costo"
  }
}
```

## 4. Security & Authorization

Consider authorization requirements for new endpoints:

| Endpoint | Required Role | Notes |
|----------|--------------|-------|
| GET /api/products/:id/cost-breakdown | AUTHENTICATED | Any logged-in user |
| GET /api/analytics/product-costs | AUTHENTICATED | Any logged-in user |
| POST/PUT /api/stock-items (with cost) | ADMIN | Same as existing |
| POST/PUT /api/products (with cost) | ADMIN | Same as existing |

The existing authorization middleware should work. No new roles required.

## 5. Response Sanitization

Update `backend/src/middleware/responseSanitizer.ts` if needed to handle new numeric fields. The sanitizer typically handles:

- Removing sensitive fields
- Formatting dates
- Converting decimals

Check if Decimal types need special handling in responses.

## 6. Default Tax Rate for Costs

Consider adding a default tax rate setting for costs in the Settings model:

```prisma
model Settings {
  // ... existing fields
  defaultCostTaxRateId Int?
  defaultCostTaxRate   TaxRate? @relation(fields: [defaultCostTaxRateId], references: [id], onDelete: SetNull)
}
```

This is optional - can be added later if users want a global default for cost overhead.

## 7. Seed Data Update

Update `backend/prisma/seed.ts` to include sample costs:

```typescript
// When seeding stock items, add costPerUnit
const stockItems = await prisma.stockItem.createMany({
  data: [
    { name: 'Bottle of Wine', quantity: 50, type: 'beverage', baseUnit: 'bottle', costPerUnit: 5.00 },
    // ...
  ]
});
```

## 8. Frontend Component Details

### Additional Components to Update

| Component | File Path | Changes |
|-----------|-----------|---------|
| StockItemList | `components/Inventory/StockItemList.tsx` | Add cost column |
| StockItemForm | `components/Inventory/StockItemForm.tsx` | Add cost fields |
| ProductForm | `components/Products/ProductForm.tsx` | Add variant cost override |
| ProductCard | `components/Products/ProductCard.tsx` | Optional profit display |
| AnalyticsDashboard | `pages/Analytics/Dashboard.tsx` | Add cost metrics |

## 9. Testing Considerations

### Unit Tests

Add tests for `costCalculationService.ts`:

```typescript
describe('calculateVariantCost', () => {
  it('should use manual override when set');
  it('should calculate from stock consumption');
  it('should apply tax rate correctly');
  it('should handle missing costPerUnit');
  it('should handle null taxRate');
});
```

### Edge Cases to Test

1. Stock item with costPerUnit = 0
2. Tax rate = 0%
3. Multiple stock consumptions for one variant
4. Product with no stock consumption
5. Very large cost values
6. Decimal precision (4 decimal places)

## 10. Performance Considerations

- Add database indexes on new fields (already in migration plan)
- Consider caching calculated costs
- Optimize the analytics query with proper indexing

## Related Documents

- [Overview](./01-overview.md)
- [Database Schema](./02-database-schema.md)
- [Cost Calculation](./03-cost-calculation.md)
- [Backend API](./04-backend-api.md)
- [Frontend Changes](./05-frontend-changes.md)
- [Migration Plan](./06-migration-plan.md)
- [Implementation Checklist](./07-implementation-checklist.md)
