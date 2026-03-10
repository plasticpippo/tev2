# Backend API Changes

## Overview

This document details the backend API modifications required to support consumption cost tracking.

## 1. StockItems Handler Updates

### GET /api/stock-items

**Response Enhancement:**

```json
{
  "id": "uuid",
  "name": "Bottle of Wine",
  "quantity": 50,
  "type": "beverage",
  "baseUnit": "bottle",
  "purchasingUnits": [...],
  "costPerUnit": 5.00,
  "taxRateId": 1,
  "taxRate": {
    "id": 1,
    "name": "Reduced Rate",
    "rate": 0.10,
    "ratePercent": "10.00%"
  }
}
```

### POST /api/stock-items

**Request Body Enhancement:**

```json
{
  "name": "Bottle of Wine",
  "quantity": 50,
  "type": "beverage",
  "baseUnit": "bottle",
  "purchasingUnits": [...],
  "costPerUnit": 5.00,
  "taxRateId": 1
}
```

### PUT /api/stock-items/:id

**Request Body Enhancement:**

```json
{
  "name": "Bottle of Wine",
  "quantity": 50,
  "costPerUnit": 5.50,
  "taxRateId": 1
}
```

## 2. Products Handler Updates

### GET /api/products

**Response Enhancement:**

```json
[
  {
    "id": 1,
    "name": "Cabernet Sauvignon",
    "categoryId": 1,
    "variants": [
      {
        "id": 1,
        "productId": 1,
        "name": "Glass",
        "price": 8.50,
        "taxRateId": 2,
        "costPrice": null,
        "taxRate": { ... },
        "calculatedCost": 2.75,
        "stockConsumption": [...]
      }
    ]
  }
]
```

### POST /api/products

**Request Body Enhancement:**

```json
{
  "name": "Cabernet Sauvignon",
  "categoryId": 1,
  "variants": [
    {
      "name": "Glass",
      "price": 8.50,
      "taxRateId": 2,
      "costPrice": 2.50,
      "backgroundColor": "#8B0000",
      "textColor": "#FFFFFF",
      "stockConsumption": [...]
    }
  ]
}
```

## 3. New Endpoint: Cost Calculation

### GET /api/products/:id/cost-breakdown

Get detailed cost breakdown for a product.

**Response:**

```json
{
  "productId": 1,
  "productName": "Cabernet Sauvignon",
  "variants": [
    {
      "variantId": 1,
      "variantName": "Glass",
      "sellingPrice": 8.50,
      "taxRate": 0.19,
      "sellingPriceExclVAT": 7.14,
      "costBreakdown": [
        {
          "stockItemName": "Bottle of Wine",
          "quantity": 0.25,
          "costPerUnit": 5.00,
          "taxRate": 0.10,
          "subtotal": 1.375
        }
      ],
      "calculatedCost": 1.375,
      "manualCostOverride": null,
      "grossProfit": 5.765,
      "profitMargin": 80.75,
      "netEarnings": 5.765
    }
  ]
}
```

## 4. New Endpoint: Product Cost Analytics

### GET /api/analytics/product-costs

Get cost and profit analytics for products.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | string | ISO date string |
| endDate | string | ISO date string |
| categoryId | number | Filter by category |
| sortBy | string | 'cost' 'revenue' 'profit' |
| sortOrder | string | 'asc' 'desc' |

**Response:**

```json
{
  "products": [
    {
      "productId": 1,
      "productName": "Cabernet Sauvignon",
      "variantName": "Glass",
      "totalSold": 150,
      "totalRevenue": 1275.00,
      "totalCost": 206.25,
      "grossProfit": 1068.75,
      "profitMargin": 83.82,
      "netEarnings": 1068.75
    }
  ],
  "summary": {
    "totalRevenue": 15000.00,
    "totalCost": 3500.00,
    "totalProfit": 11500.00,
    "averageMargin": 76.67
  }
}
```

## 5. Validation Updates

### StockItem Validation

Add validation for cost fields in `backend/src/utils/validation.ts`:

```typescript
function validateCostPerUnit(value: number | undefined): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number') return 'Cost per unit must be a number';
  if (value < 0) return 'Cost per unit cannot be negative';
  if (value > 1000000) return 'Cost per unit exceeds maximum allowed';
  return null;
}

function validateTaxRateId(value: number | undefined): string | null {
  if (value === undefined || value === null) return null;
  // Validate tax rate exists and is active
  // ...
}
```

### ProductVariant Validation

Add validation for costPrice field:

```typescript
function validateCostPrice(value: number | undefined): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number') return 'Cost price must be a number';
  if (value < 0) return 'Cost price cannot be negative';
  if (value > 1000000) return 'Cost price exceeds maximum allowed';
  return null;
}
```

## 6. Service Layer: Cost Calculation Service

Create `backend/src/services/costCalculationService.ts`:

```typescript
import { prisma } from '../prisma';
import { roundMoney, multiplyMoney } from '../utils/money';

export interface CostBreakdownItem {
  stockItemName: string;
  quantity: number;
  costPerUnit: number;
  taxRate: number;
  subtotal: number;
}

export interface VariantCostResult {
  variantId: number;
  variantName: string;
  calculatedCost: number;
  manualCostOverride: number | null;
  costBreakdown: CostBreakdownItem[];
}

export async function calculateProductCosts(
  productId: number
): Promise<VariantCostResult[]> {
  const variants = await prisma.productVariant.findMany({
    where: { productId },
    include: {
      stockConsumption: {
        include: {
          stockItem: {
            include: { taxRate: true }
          }
        }
      }
    }
  });

  return variants.map(variant => {
    // Check for manual override
    if (variant.costPrice !== null) {
      return {
        variantId: variant.id,
        variantName: variant.name,
        calculatedCost: Number(variant.costPrice),
        manualCostOverride: Number(variant.costPrice),
        costBreakdown: []
      };
    }

    // Calculate from stock consumption
    const costBreakdown: CostBreakdownItem[] = [];
    let totalCost = 0;

    for (const consumption of variant.stockConsumption) {
      const costPerUnit = Number(consumption.stockItem.costPerUnit) || 0;
      const taxRate = consumption.stockItem.taxRate 
        ? Number(consumption.stockItem.taxRate.rate) 
        : 0;
      
      const subtotal = multiplyMoney(costPerUnit * consumption.quantity, 1 + taxRate);
      totalCost = addMoney(totalCost, subtotal);

      costBreakdown.push({
        stockItemName: consumption.stockItem.name,
        quantity: consumption.quantity,
        costPerUnit,
        taxRate,
        subtotal
      });
    }

    return {
      variantId: variant.id,
      variantName: variant.name,
      calculatedCost: roundMoney(totalCost),
      manualCostOverride: null,
      costBreakdown
    };
  });
}
```

## Related Documents

- [Overview](./01-overview.md)
- [Database Schema](./02-database-schema.md)
- [Cost Calculation](./03-cost-calculation.md)
- [Frontend Changes](./05-frontend-changes.md)
