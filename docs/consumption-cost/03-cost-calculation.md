# Cost Calculation Logic

## Overview

This document details the cost calculation formulas and logic for the consumption cost feature.

## Core Formulas

### 1. Base Cost Calculation

```
Base Cost = costPerUnit × quantityConsumed
```

**Example:**
- Stock Item: "Bottle of Wine"
- costPerUnit: €5.00
- quantityConsumed per product: 1 bottle
- Base Cost = €5.00 × 1 = €5.00

### 2. Tax Rate Overlay (Overhead)

```
Cost with Tax = Base Cost × (1 + taxRate)

Example:
- Base Cost: €5.00
- Tax Rate: 10% (0.10)
- Cost with Tax = €5.00 × 1.10 = €5.50
```

### 3. Complete Cost Formula

```
Total Cost = costPerUnit × quantityConsumed × (1 + taxRate)
```

### 4. Hybrid Override

If ProductVariant.costPrice is set:

```
Total Cost = costPrice (manual override)
```

## Calculation Flow

```mermaid
flowchart TD
    A[ProductVariant Sold] --> B{Has costPrice?}
    B -->|Yes| C[Use costPrice]
    B -->|No| D[Get Stock Consumptions]
    D --> E[For Each Stock Item]
    E --> F{costPerUnit Set?}
    F -->|Yes| G{costTaxRate Set?}
    G -->|Yes| H[Calculate: cost × qty × (1 + rate)]
    G -->|No| I[Calculate: cost × qty]
    F -->|No| J[Cost = 0]
    H --> K[Sum All Costs]
    I --> K
    J --> K
    C --> L[Final Cost]
    K --> L
```

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No costPerUnit set | Cost = 0, show warning |
| No stock consumption | Cost = 0 |
| No taxRate on stock item | Use rate = 0 |
| Both costPrice and stock consumption | costPrice takes precedence |

## Implementation Details

### Service Function: calculateVariantCost

```typescript
interface StockConsumptionWithDetails {
  stockItemId: string;
  quantity: number;
  costPerUnit: number | null;
  taxRate: number | null;  // decimal form (0.10 = 10%)
}

async function calculateVariantCost(
  variantId: number
): Promise<{
  totalCost: number;
  breakdown: Array<{
    stockItemName: string;
    quantity: number;
    costPerUnit: number;
    taxRate: number;
    subtotal: number;
  }>;
}> {
  // 1. Check for manual override first
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: { costPrice: true }
  });
  
  if (variant?.costPrice !== null && variant?.costPrice !== undefined) {
    return {
      totalCost: Number(variant.costPrice),
      breakdown: []
    };
  }
  
  // 2. Get stock consumptions with cost details
  const consumptions = await prisma.stockConsumption.findMany({
    where: { variantId },
    include: {
      stockItem: {
        include: { taxRate: true }
      }
    }
  });
  
  // 3. Calculate cost for each consumption
  let totalCost = 0;
  const breakdown: any[] = [];
  
  for (const consumption of consumptions) {
    const costPerUnit = Number(consumption.stockItem.costPerUnit) || 0;
    const taxRate = consumption.stockItem.taxRate 
      ? Number(consumption.stockItem.taxRate.rate) 
      : 0;
    const quantity = consumption.quantity;
    
    const itemCost = costPerUnit * quantity * (1 + taxRate);
    totalCost += itemCost;
    
    breakdown.push({
      stockItemName: consumption.stockItem.name,
      quantity,
      costPerUnit,
      taxRate,
      subtotal: itemCost
    });
  }
  
  return { totalCost, breakdown };
}
```

### Profit Calculation

```typescript
interface ProfitCalculation {
  sellingPriceExclVAT: number;  // price / (1 + taxRate)
  taxAmount: number;             // sellingPriceExclVAT * taxRate
  costPrice: number;             // calculated from stock
  grossProfit: number;           // sellingPriceExclVAT - costPrice
  profitMargin: number;         // (grossProfit / sellingPriceExclVAT) * 100
  netEarnings: number;           // sellingPrice - taxAmount - costPrice
}

function calculateProfit(
  variantPrice: number,
  variantTaxRate: number,
  costPrice: number
): ProfitCalculation {
  const sellingPriceExclVAT = variantPrice / (1 + variantTaxRate);
  const taxAmount = variantPrice - sellingPriceExclVAT;
  const grossProfit = sellingPriceExclVAT - costPrice;
  const profitMargin = sellingPriceExclVAT > 0 
    ? (grossProfit / sellingPriceExclVAT) * 100 
    : 0;
  const netEarnings = variantPrice - taxAmount - costPrice;
  
  return {
    sellingPriceExclVAT,
    taxAmount,
    costPrice,
    grossProfit,
    profitMargin,
    netEarnings
  };
}
```

## Pricing Mode Considerations

The system has `taxMode` in Settings (inclusive/exclusive). Cost calculation should always work with VAT-exclusive prices for consistency:

| Tax Mode | Selling Price | Calculation |
|----------|--------------|--------------|
| inclusive | €12.00 (includes 20% VAT) | price / 1.20 = €10.00 excl. |
| exclusive | €10.00 + €2.00 VAT | price = €10.00 excl. |

## Related Documents

- [Overview](./01-overview.md)
- [Database Schema](./02-database-schema.md)
- [Backend API](./04-backend-api.md)
