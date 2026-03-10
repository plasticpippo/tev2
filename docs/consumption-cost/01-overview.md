# Consumption Cost Feature - Overview

## Feature Summary

This document provides a high-level overview of the consumption cost tracking feature. The feature enables tracking product costs based on stock consumption and tax rates, allowing for net earnings calculations with VAT.

## Goals

1. **Cost Tracking**: Calculate the cost of each product variant based on stock consumption
2. **Tax Rate Integration**: Use existing TaxRate model for cost overhead calculations
3. **Hybrid Approach**: Auto-calculate costs from stock items with optional manual override per product variant
4. **Profit Analytics**: Display net earnings and profit margins in analytics reports

## Current System State

| Component | Current Fields |
|-----------|---------------|
| ProductVariant | price, taxRateId, stockConsumption |
| StockItem | name, quantity, type, baseUnit, purchasingUnits |
| StockConsumption | variantId, stockItemId, quantity |
| TaxRate | name, rate, description, isDefault, isActive |

## Proposed Changes

### 1. StockItem Enhancement

Add cost tracking fields to StockItem:

```typescript
{
  costPerUnit: Decimal,    // Cost per base unit (e.g., 5.00 EUR per bottle)
  taxRateId: Int?          // Optional link to TaxRate for overhead %
}
```

### 2. ProductVariant Enhancement

Add manual cost override:

```typescript
{
  costPrice: Decimal?      // Optional manual override for calculated cost
}
```

### 3. Cost Calculation Formula

```
Total Cost = costPerUnit × quantity consumed × (1 + taxRate)

Example:
- Bottle costs €5 per unit
- Consumes 2 bottles per sale
- TaxRate: 10% (for overhead)
- Cost = 5 × 2 × 1.10 = €11
```

### 4. Hybrid Logic

1. If ProductVariant.costPrice is set → use manual override
2. Else → calculate from stock consumption × costPerUnit × taxRate

## Key Benefits

- **Automated**: Costs calculated from existing stock consumption data
- **Flexible**: Manual override for special cases
- **Integrated**: Uses existing TaxRate infrastructure
- **Profitable**: Enables profit margin analytics

## Related Documents

- [Database Schema Changes](./database-schema.md)
- [Backend API Changes](./backend-api.md)
- [Cost Calculation Logic](./cost-calculation.md)
- [Frontend Changes](./frontend-changes.md)
- [Migration Plan](./migration-plan.md)
