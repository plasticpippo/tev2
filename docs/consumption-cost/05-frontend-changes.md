# Frontend Changes

## Overview

This document details the frontend modifications required to support consumption cost tracking.

## 1. Stock Item Management (Inventory Page)

### Stock Item Form Enhancement

Add cost fields to the stock item edit/create form:

```typescript
interface StockItemFormData {
  name: string;
  quantity: number;
  type: string;
  baseUnit: string;
  purchasingUnits: PurchasingUnit[];
  costPerUnit: number | null;    // NEW
  taxRateId: number | null;       // NEW
}
```

**UI Components:**

- Input field for "Cost per Unit" (currency input)
- Dropdown to select Tax Rate (reuses existing TaxRate selector)
- Display calculated cost indicator

### Stock Items List View

Add columns to display cost information:

| Column | Description |
|--------|-------------|
| Cost/Unit | Display costPerUnit value |
| Tax Rate | Display linked tax rate |
| Actions | Edit/Delete buttons |

## 2. Product Management

### Product Form - Variant Section

Enhance variant form with cost override:

```typescript
interface ProductVariantFormData {
  name: string;
  price: number;
  backgroundColor: string;
  textColor: string;
  taxRateId: number | null;
  costPrice: number | null;       // NEW: Manual override
  stockConsumption: StockConsumptionFormData[];
}
```

**UI Components:**

- Input field for "Cost Price" (manual override)
- Display "Calculated from stock" vs "Manual override" indicator
- Show calculated cost preview when editing

### Product List/Cards

Display profit indicators on product cards:

```typescript
interface ProductCardProps {
  product: Product;
  showCostInfo?: boolean;
  showProfitMargin?: boolean;
}
```

**Display Options:**

- Hide cost by default
- Toggle to show "Cost: €X.XX" below price
- Color-coded profit margin indicator (green/yellow/red)

## 3. Analytics Dashboard

### Product Performance Report

Enhance existing analytics with cost/profit columns:

| Column | Description |
|--------|-------------|
| Revenue | Total sales revenue |
| Cost | Total calculated cost |
| Gross Profit | Revenue - Cost |
| Margin | (Profit / Revenue) × 100 |

### New Cost Analytics View

Create dedicated cost analytics page:

```typescript
interface CostAnalyticsPageProps {
  // Filter options
  startDate: Date;
  endDate: Date;
  categoryId?: number;
  stockItemType?: string;
}
```

**Sections:**

1. **Summary Cards**
   - Total Revenue
   - Total Cost
   - Gross Profit
   - Average Margin

2. **Product Cost Table**
   - Product/Variant name
   - Units Sold
   - Revenue
   - Cost
   - Profit
   - Margin %

3. **Stock Item Cost Analysis**
   - Which stock items are most costly
   - Cost breakdown by stock item type

## 4. Internationalization (i18n)

Add translation keys for new UI elements:

```json
{
  "stockItem": {
    "costPerUnit": "Cost per unit",
    "taxRate": "Cost tax rate",
    "calculatedCost": "Calculated cost"
  },
  "product": {
    "costPrice": "Cost price",
    "manualOverride": "Manual override",
    "calculatedFromStock": "Calculated from stock"
  },
  "analytics": {
    "cost": "Cost",
    "grossProfit": "Gross profit",
    "netEarnings": "Net earnings",
    "profitMargin": "Profit margin"
  }
}
```

## 5. API Integration

### Update API Service

```typescript
// stockItemsApi.ts
export const updateStockItem = async (id: string, data: StockItemFormData) => {
  return api.put(`/api/stock-items/${id}`, data);
};

// productsApi.ts  
export const createProduct = async (data: ProductFormData) => {
  return api.post('/api/products', data);
};

// analyticsApi.ts
export const getProductCosts = async (params: CostAnalyticsParams) => {
  return api.get('/api/analytics/product-costs', { params });
};
```

### TypeScript Types

Add types to frontend:

```typescript
// types/stockItem.ts
export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  type: string;
  baseUnit: string;
  purchasingUnits: PurchasingUnit[] | null;
  costPerUnit?: number;
  taxRateId?: number;
  taxRate?: TaxRate;
}

// types/product.ts
export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  costPrice?: number;
  // ...
}

// types/analytics.ts
export interface ProductCostAnalytics {
  productId: number;
  productName: string;
  variantName: string;
  totalSold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: number;
}
```

## 6. Component Library Updates

### Reusable Components

Create or update these components:

1. **CurrencyInput**
   - Format as currency
   - Handle decimal precision

2. **TaxRateSelector**
   - Reuse existing dropdown
   - Add "None" option

3. **ProfitBadge**
   - Color-coded margin display
   - Green: >50%, Yellow: 20-50%, Red: <20%

4. **CostBreakdownTable**
   - Show detailed cost components
   - Expandable rows for variants

## Related Documents

- [Overview](./01-overview.md)
- [Database Schema](./02-database-schema.md)
- [Cost Calculation](./03-cost-calculation.md)
- [Backend API](./04-backend-api.md)
- [Migration Plan](./06-migration-plan.md)
