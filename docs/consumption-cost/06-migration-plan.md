# Migration Plan

## Overview

This document outlines the step-by-step implementation plan for the consumption cost feature.

## Implementation Order

```
┌─────────────────────────────────────────────────────────────────┐
│                        PHASE 1: Database                        │
├─────────────────────────────────────────────────────────────────┤
│  1.1 Create Prisma migration for new fields                    │
│  1.2 Update TypeScript types                                    │
│  1.3 Run database migration                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 2: Backend Core                      │
├─────────────────────────────────────────────────────────────────┤
│  2.1 Update stock items handler (CRUD)                          │
│  2.2 Update products handler (CRUD)                            │
│  2.3 Add validation for new fields                             │
│  2.4 Create cost calculation service                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     PHASE 3: New Endpoints                      │
├─────────────────────────────────────────────────────────────────┤
│  3.1 Create product cost breakdown endpoint                     │
│  3.2 Create product cost analytics endpoint                     │
│  3.3 Update existing analytics with profit data                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       PHASE 4: Frontend                         │
├─────────────────────────────────────────────────────────────────┤
│  4.1 Update stock item forms                                    │
│  4.2 Update product forms                                       │
│  4.3 Add cost display to product cards                          │
│  4.4 Create analytics cost view                                │
│  4.5 Add i18n translations                                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      PHASE 5: Testing                           │
├─────────────────────────────────────────────────────────────────┤
│  5.1 Backend unit tests                                         │
│  5.2 Integration tests                                          │
│  5.3 E2E testing with Playwright                               │
└─────────────────────────────────────────────────────────────────┘
```

## Phase 1: Database (Step 1.1)

### Create Migration

```bash
cd backend
npx prisma migrate dev --name add_cost_fields
```

### Migration SQL Content

```sql
-- Add costPerUnit to stock_items
ALTER TABLE stock_items 
ADD COLUMN "costPerUnit" DECIMAL(10, 4);

-- Add taxRateId to stock_items
ALTER TABLE stock_items 
ADD COLUMN "taxRateId" INTEGER REFERENCES "tax_rates"("id") ON DELETE SET NULL;

-- Add costPrice to product_variants
ALTER TABLE product_variants 
ADD COLUMN "costPrice" DECIMAL(10, 4);

-- Create indexes
CREATE INDEX "idx_stock_items_tax_rate" ON stock_items("taxRateId");
CREATE INDEX "idx_product_variants_cost" ON product_variants("costPrice");
```

### Update Types

```typescript
// backend/src/types.ts
export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  type: string;
  baseUnit: string;
  purchasingUnits: PurchasingUnit[] | null;
  costPerUnit?: number;   // NEW
  taxRateId?: number;     // NEW
  // ... existing fields
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  costPrice?: number;     // NEW
  // ... existing fields
}
```

## Phase 2: Backend Core (Step 2.1-2.4)

### 2.1 Stock Items Handler

File: `backend/src/handlers/stockItems.ts`

Changes:
- Add `costPerUnit` to create/update validation
- Add `taxRateId` to create/update validation
- Include taxRate in GET responses

### 2.2 Products Handler

File: `backend/src/handlers/products.ts`

Changes:
- Add `costPrice` to variant validation
- Include calculatedCost in responses (optional field)

### 2.3 Validation

File: `backend/src/utils/validation.ts`

Add functions:
- `validateCostPerUnit()`
- `validateCostPrice()`

### 2.4 Cost Calculation Service

New file: `backend/src/services/costCalculationService.ts`

Functions:
- `calculateVariantCost(variantId)` → cost breakdown
- `calculateProductCosts(productId)` → all variants
- `calculateProfitMetrics(variantId, quantity)` → profit analytics

## Phase 3: New Endpoints (Step 3.1-3.3)

### 3.1 Product Cost Breakdown

```typescript
// New route
productsRouter.get('/:id/cost-breakdown', authenticateToken, async (req, res) => {
  // Return detailed cost breakdown
});
```

### 3.2 Product Cost Analytics

```typescript
// New route in analytics
analyticsRouter.get('/product-costs', authenticateToken, async (req, res) => {
  // Return aggregated cost/profit data
});
```

### 3.3 Update Existing Analytics

Modify `aggregateProductPerformance` to include cost calculations.

## Phase 4: Frontend (Step 4.1-4.5)

### 4.1 Stock Item Forms

Update:
- `frontend/components/Inventory/StockItemForm.tsx`
- Add cost input fields

### 4.2 Product Forms

Update:
- `frontend/components/Products/ProductForm.tsx`
- Add cost override to variant section

### 4.3 Product Cards

Update:
- `frontend/components/Products/ProductCard.tsx`
- Optional cost display
- Profit margin indicator

### 4.4 Analytics Cost View

Create:
- `frontend/pages/Analytics/CostAnalytics.tsx`
- Cost breakdown charts
- Profit margin tables

### 4.5 Translations

Update:
- `backend/locales/en/api.json`
- `backend/locales/it/api.json`

## Phase 5: Testing (Step 5.1-5.3)

### 5.1 Unit Tests

Test cost calculation service functions:
- Calculate with manual override
- Calculate from stock consumption
- Handle missing data gracefully
- Tax rate application

### 5.2 Integration Tests

Test API endpoints:
- CRUD operations with new fields
- Cost calculation accuracy
- Analytics data correctness

### 5.3 E2E Tests

Using Playwright MCP:
- Create stock item with cost
- Create product with cost override
- Verify cost breakdown
- Verify analytics calculations

## Rollback Plan

If issues arise:

1. **Database Rollback**
   ```bash
   npx prisma migrate revert
   ```

2. **Feature Flags**
   - Add feature flag `ENABLE_COST_TRACKING`
   - Gracefully handle missing fields

3. **Data Preservation**
   - All new fields are nullable
   - Existing data remains valid

## Estimated Complexity

| Phase | Complexity | Risk |
|-------|-----------|------|
| Database | Low | Low |
| Backend Core | Medium | Medium |
| New Endpoints | Medium | Medium |
| Frontend | High | Medium |
| Testing | Medium | Low |

## Related Documents

- [Overview](./01-overview.md)
- [Database Schema](./02-database-schema.md)
- [Cost Calculation](./03-cost-calculation.md)
- [Backend API](./04-backend-api.md)
- [Frontend Changes](./05-frontend-changes.md)
