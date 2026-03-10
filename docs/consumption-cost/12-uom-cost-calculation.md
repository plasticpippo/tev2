# UOM System - Cost Calculation Logic

## Overview

This document details the updated cost calculation formulas and logic for the UOM system, enabling automatic unit conversions and bulk pricing calculations.

## Core Formulas

### 1. Cost Per Base Unit

```
Cost Per Base Unit = purchasingUnit.costPerUnit / purchasingUnit.multiplier

Example:
- Bottle: €20.00 / 750ml = €0.02667 per ml
- Case: €216.00 / 9000ml = €0.02400 per ml  
- Pallet: €1800.00 / 90000ml = €0.02000 per ml
```

### 2. Recipe Cost Calculation

```
Recipe Cost = quantityConsumed × Cost Per Base Unit × (1 + taxRate)

Example (using Bottle pricing):
- Quantity: 40ml
- Cost Per ml: €0.02667
- Tax Rate: 10%
- Cost = 40 × €0.02667 × 1.10 = €1.17
```

### 3. Bulk Pricing Selection

When multiple purchasing units are available, the system uses:
1. **Active Purchasing Unit**: If explicitly set, use that
2. **Default Purchasing Unit**: If marked as default, use that
3. **Lowest Cost Per Unit**: Optionally, automatically select the cheapest

```
Selected Purchasing Unit = 
  activePurchasingUnitId OR
  (first with isDefault = true) OR
  (first in list)
```

## Calculation Flow

```mermaid
flowchart TD
    A[ProductVariant Sold] --> B{Has costPrice Override?}
    B -->|Yes| C[Use costPrice]
    B -->|No| D[Get Stock Consumptions]
    
    D --> E[For Each Stock Item]
    E --> F{Has purchasingUnits?}
    
    F -->|Yes| G[Get Active Purchasing Unit]
    G --> H[Calculate Cost Per Base Unit]
    H --> I[Calculate: qty × costPerBase × (1 + tax)]
    
    F -->|No| J{Has costPerUnit?}
    J -->|Yes| K[Calculate: qty × costPerUnit × (1 + tax)]
    J -->|No| L[Cost = 0, Show Warning]
    
    I --> M[Sum All Costs]
    K --> M
    C --> N[Final Cost]
    M --> N
```

## Implementation Details

### Updated Interfaces

```typescript
interface PurchasingUnit {
  id: string;
  name: string;
  multiplier: number;       // Base units per this unit
  costPerUnit: number;      // Cost for the entire unit
  isDefault: boolean;
  minOrderQuantity?: number;
}

interface CostBreakdownItem {
  stockItemName: string;
  recipeQuantity: number;
  recipeUnit: string;
  purchasingUnitName: string;
  costPerBaseUnit: number;
  baseUnit: string;
  taxRate: number;
  subtotal: number;
}
```

### Cost Calculation Service

```typescript
/**
 * Get cost per base unit from purchasing unit
 */
function getCostPerBaseUnit(purchasingUnit: PurchasingUnit): number {
  if (!purchasingUnit || purchasingUnit.multiplier <= 0) {
    return 0;
  }
  return purchasingUnit.costPerUnit / purchasingUnit.multiplier;
}

/**
 * Get the active purchasing unit from stock item
 */
function getActivePurchasingUnit(
  stockItem: StockItem
): PurchasingUnit | null {
  const units = stockItem.purchasingUnits;
  if (!units || units.length === 0) {
    return null;
  }
  
  // 1. Find by activePurchasingUnitId
  if (stockItem.activePurchasingUnitId) {
    const active = units.find(u => u.id === stockItem.activePurchasingUnitId);
    if (active) return active;
  }
  
  // 2. Find default
  const defaultUnit = units.find(u => u.isDefault);
  if (defaultUnit) return defaultUnit;
  
  // 3. First available
  return units[0];
}

/**
 * Calculate cost for a single stock consumption
 */
function calculateConsumptionCost(
  consumption: StockConsumption,
  stockItem: StockItem,
  taxRate: number
): CostBreakdownItem {
  const quantity = consumption.quantity;
  const baseUnit = stockItem.baseUnit;
  
  let costPerBaseUnit = 0;
  let purchasingUnitName = 'Legacy';
  
  // Try to get from purchasing units
  const activeUnit = getActivePurchasingUnit(stockItem);
  if (activeUnit) {
    costPerBaseUnit = getCostPerBaseUnit(activeUnit);
    purchasingUnitName = activeUnit.name;
  } else if (stockItem.costPerUnit) {
    // Fall back to legacy costPerUnit
    costPerBaseUnit = Number(stockItem.costPerUnit);
    purchasingUnitName = 'Manual';
  }
  
  // Formula: quantity × costPerBaseUnit × (1 + taxRate)
  const subtotal = roundMoney(quantity * costPerBaseUnit * (1 + taxRate));
  
  return {
    stockItemName: stockItem.name,
    recipeQuantity: quantity,
    recipeUnit: baseUnit,
    purchasingUnitName,
    costPerBaseUnit,
    baseUnit,
    taxRate,
    subtotal
  };
}
```

### Updated calculateVariantCost Function

```typescript
export async function calculateVariantCost(
  variantId: number
): Promise<VariantCostResult> {
  // Get variant with stock consumption and tax rate
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: { include: { category: true } },
      stockConsumption: {
        include: {
          stockItem: {
            include: { taxRate: true }
          }
        }
      },
      taxRate: true
    }
  });

  // Check for manual cost override
  if (variant.costPrice !== null && variant.costPrice !== undefined) {
    // ... (existing override logic)
  }

  // Calculate cost from stock consumption with UOM
  const costBreakdown: CostBreakdownItem[] = [];
  let totalCost = 0;

  for (const consumption of variant.stockConsumption) {
    const stockItem = consumption.stockItem;
    const itemTaxRate = stockItem.taxRate 
      ? Number(stockItem.taxRate.rate) 
      : 0;
    
    const breakdown = calculateConsumptionCost(
      consumption,
      stockItem,
      itemTaxRate
    );
    
    costBreakdown.push(breakdown);
    totalCost = addMoney(totalCost, breakdown.subtotal);
  }

  // ... rest of function
}
```

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No purchasing units, no costPerUnit | Cost = 0, log warning |
| Multiple purchasing units | Use active/default/first |
| Invalid multiplier (0 or negative) | Use 0, skip calculation |
| Negative costPerUnit | Treat as 0 |
| No taxRate on stock item | Use rate = 0 |

## Profit Calculation (Unchanged)

The profit calculation remains the same as in the current implementation:

```typescript
interface ProfitCalculation {
  sellingPriceExclVAT: number;
  taxAmount: number;
  costPrice: number;
  grossProfit: number;
  profitMargin: number | null;
  netEarnings: number;
}
```

## Cost Breakdown Report Enhancement

The cost breakdown will now include additional UOM information:

```json
{
  "variantName": "Whiskey 40ml",
  "costBreakdown": [
    {
      "stockItemName": "Jameson Irish Whiskey",
      "recipeQuantity": 40,
      "recipeUnit": "ml",
      "purchasingUnitName": "Pallet",
      "costPerBaseUnit": 0.02,
      "baseUnit": "ml",
      "taxRate": 0.10,
      "subtotal": 0.88
    }
  ],
  "calculatedCost": 0.88,
  "sellingPrice": 8.00,
  "grossProfit": 5.62,
  "profitMargin": 81.5
}
```

## Related Documents

- [Overview](./10-uom-overview.md)
- [Database Schema](./11-uom-database-schema.md)
- [Backend API Changes](./13-uom-backend-api.md)
