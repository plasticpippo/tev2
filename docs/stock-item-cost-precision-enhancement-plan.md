# Stock Item Cost/Price Precision Enhancement: 6 Decimal Places Implementation Plan

**Date:** 2026-04-13
**Project:** Bar POS System (tev2)
**Status:** Planning Phase

---

## Executive Summary

This document provides a comprehensive implementation plan for enhancing the stock item management system to support a minimum of **6 decimal places** for cost and price fields. The current system uses 4 decimal places for unit costs and 2 decimal places for display prices. Increasing precision to 6 decimal places is necessary for accurate cost tracking in scenarios involving bulk ingredients, small serving sizes, or high-precision inventory management.

**Key Changes Required:**
- 14 database column precision upgrades across 7 tables
- New high-precision arithmetic utilities in backend
- Frontend formatting and input field adjustments
- Updates to calculation services for cost propagation
- API validation enhancements

**Estimated Implementation Effort:** 8-12 hours across 2-3 phases
**Risk Level:** Medium (data-safe migration, backward compatible)

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Scope Decision](#2-scope-decision)
3. [Implementation Plan](#3-implementation-plan)
4. [Files to Modify](#4-files-to-modify)
5. [Risk Assessment](#5-risk-assessment)
6. [Testing Strategy](#6-testing-strategy)
7. [Deployment Plan](#7-deployment-plan)

---

## 1. Current State Analysis

### 1.1 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Database** | PostgreSQL | 15 (Docker) |
| **ORM** | Prisma | 5.22 |
| **Backend** | Node.js + Express | 20 Alpine |
| **Frontend** | React + Vite | 18 + 6.2 |
| **Currency Library** | currency.js | Latest |

### 1.2 Current Database Schema Precision

The system uses three precision tiers for `Decimal` fields:

#### Tier 1: Display Monetary Values (2 decimal places)
**Purpose:** Final prices, transaction totals, receipts (currency display)
**Precision:** `Decimal(10, 2)` — supports up to 99,999,999.99

| Model | Fields |
|-------|--------|
| `ProductVariant` | `price` |
| `Transaction` | `subtotal`, `tax`, `tip`, `total`, `discount`, `totalCost`, `grossMargin` |
| `TransactionItem` | `price` |
| `Receipt` | `subtotal`, `tax`, `discount`, `tip`, `total` |
| `VarianceReport` | `theoreticalCost`, `actualCost`, `varianceValue` |
| `VarianceReportItem` | `theoreticalQty`, `actualQty`, `varianceQty`, `varianceValue` |
| `InventoryCountItem` | `extendedValue` |

#### Tier 2: Unit Costs and Rates (4 decimal places)
**Purpose:** Per-unit costs, theoretical costs, cost history
**Precision:** `Decimal(10, 4)` — supports up to 99,999.9999

| Model | Fields |
|-------|--------|
| `StockItem` | `standardCost`, `costPerUnit` |
| `CostHistory` | `previousCost`, `newCost` |
| `ProductVariant` | `theoreticalCost` |
| `TransactionItem` | `unitCost`, `totalCost`, `effectiveTaxRate` |
| `InventoryCountItem` | `unitCost` |
| `VarianceReportItem` | `unitCost` |

#### Tier 3: Percentages (2 decimal places)
**Purpose:** Margin percentages, change percentages
**Precision:** `Decimal(5, 2)` or `Decimal(6, 2)` — supports up to 999.99% or 9,999.99%

| Model | Fields |
|-------|--------|
| `ProductVariant` | `currentMargin` |
| `Transaction` | `marginPercent` |
| `CostHistory` | `changePercent` |
| `VarianceReport` | `variancePercent` |
| `VarianceReportItem` | `variancePercent` |
| `TaxRate` | `rate` |

### 1.3 Current Backend Calculation Pipeline

#### Calculation Bottleneck

The critical bottleneck is in `/home/pippo/tev2/backend/src/utils/money.ts`:

```typescript
const DEFAULT_CURRENCY = {
  symbol: '€',
  decimal: '.',
  separator: ',',
  precision: 2,  // ← This rounds all calculations to 2 decimal places
};
```

**Impact:** Even though `StockItem.standardCost` is stored at 4 decimal places in the database, any multiplication (e.g., `standardCost * quantity`) passes through `multiplyMoney()` which rounds the result to 2 decimal places before persisting.

**Calculation Flow:**
```
StockItem.standardCost (4dp in DB)
  → decimalToNumber() → JS number (full precision)
  → multiplyMoney(standardCost, quantity) → rounded to 2dp ← BOTTLENECK
  → roundMoney(totalCost) → rounded to 2dp again
  → stored as ProductVariant.theoreticalCost (4dp in DB, but value already rounded to 2dp)
```

**Example Loss of Precision:**

| Input | Current Output | Desired Output |
|-------|----------------|----------------|
| `0.1234 * 2.5` | `0.31` (rounded to 2dp) | `0.3085` (preserved) |
| `0.0001 * 10` | `0.00` (rounded to 2dp) | `0.0010` (preserved) |

#### Affected Calculation Services

| File | Functions | Current Precision |
|------|-----------|-------------------|
| `costCalculationService.ts` | `calculateVariantCost()`, `calculateTransactionItemCost()`, `updateVariantTheoreticalCost()` | 2dp |
| `costHistoryService.ts` | `updateIngredientCost()` (changePercent calc) | 2dp |
| `varianceService.ts` | `generateVarianceReport()` (all cost/qty/variance calcs) | 2dp |
| `analyticsService.ts` | `aggregateProductPerformance()`, `getProfitSummary()`, margin calculations | 2dp |
| `transactions.ts` handler | Payment processing cost calculation | 2dp |

### 1.4 Current Frontend Formatting

Three distinct formatting approaches exist:

#### 1. `formatCurrency()` — `/home/pippo/tev2/frontend/utils/formatting.ts`

```typescript
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return '€0,00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '€0,00';
  return `€${numAmount.toFixed(2).replace('.', ',')}`;  // ← Hard-coded 2dp
};
```

**Used by:** 18+ components (CostManagementPanel, ProfitAnalyticsPanel, VarianceReportPanel, InventoryCountPanel, etc.)

#### 2. `formatMoney()` — `/home/pippo/tev2/frontend/utils/money.ts`

```typescript
export function formatMoney(value: number, locale: string = 'it-IT', currencyCode: string = 'EUR'): string {
  if (!isMoneyValid(value)) return '€0.00';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(value);
}
```

**Used by:** Dashboard components, closing components (defaults to 2dp via `Intl.NumberFormat`)

#### 3. Local `formatCurrency` Functions

Found in:
- `CustomerDetail.tsx` (line 80) — uses `Intl.NumberFormat('it-IT')`
- `DailyClosingDetailsModal.tsx` (line 21) — wraps `formatMoney(amount)`
- `DailyClosingSummaryView.tsx` (line 49) — wraps `formatMoney(amount)`

### 1.5 Current Input Fields

**Cost Input Field** — `CostManagementPanel.tsx` (lines 85-93):

```html
<input type="number" step="0.01" min="0" value={newCost}
  onChange={e => setNewCost(e.target.value)} ... required />
```

**Issue:** `step="0.01"` restricts input to 2 decimal places, but `parseFloat(newCost)` parsing can technically handle higher precision (limited by JavaScript's `Number` type).

---

## 2. Scope Decision

### 2.1 Primary Target Fields (Must Change to 6dp)

**Direct cost unit rates on StockItem:**

| Table | Column | Current | Target | Rationale |
|-------|--------|---------|--------|-----------|
| `stock_items` | `standardCost` | `Decimal(10, 4)` | `Decimal(12, 6)` | Base unit cost (e.g., €0.123456 per ml) |
| `stock_items` | `costPerUnit` | `Decimal(10, 4)` | `Decimal(12, 6)` | Display cost per serving |

**Cost snapshots and propagated values:**

| Table | Column | Current | Target | Rationale |
|-------|--------|---------|--------|-----------|
| `cost_history` | `previousCost` | `Decimal(10, 4)` | `Decimal(12, 6)` | Historical cost tracking |
| `cost_history` | `newCost` | `Decimal(10, 4)` | `Decimal(12, 6)` | Historical cost tracking |
| `product_variants` | `theoreticalCost` | `Decimal(10, 4)` | `Decimal(12, 6)` | Ingredient cost aggregation |
| `transaction_items` | `unitCost` | `Decimal(10, 4)` | `Decimal(12, 6)` | Cost at time of sale |
| `transaction_items` | `totalCost` | `Decimal(10, 4)` | `Decimal(12, 6)` | Cost at time of sale |
| `inventory_count_items` | `unitCost` | `Decimal(10, 4)` | `Decimal(12, 6)` | Cost at count time |
| `variance_report_items` | `unitCost` | `Decimal(10, 4)` | `Decimal(12, 6)` | Cost at report time |

### 2.2 Computed Value Fields (Change to Higher Precision)

**Values computed from 6dp unit costs:**

| Table | Column | Current | Target | Rationale |
|-------|--------|---------|--------|-----------|
| `inventory_count_items` | `extendedValue` | `Decimal(10, 2)` | `Decimal(14, 6)` | `quantity(2dp) * unitCost(6dp) = 8dp`, rounded to 6dp |
| `variance_report_items` | `varianceValue` | `Decimal(10, 2)` | `Decimal(14, 6)` | `varianceQty(2dp) * unitCost(6dp) = 8dp`, rounded to 6dp |
| `variance_reports` | `theoreticalCost` | `Decimal(10, 2)` | `Decimal(14, 6)` | Sum of extended values, preserve precision |
| `variance_reports` | `actualCost` | `Decimal(10, 2)` | `Decimal(14, 6)` | Sum of extended values, preserve precision |
| `variance_reports` | `varianceValue` | `Decimal(10, 2)` | `Decimal(14, 6)` | Difference of theoretical/actual, preserve precision |

**Note:** `Decimal(14, 6)` supports values up to 9,999,999.999999, sufficient for inventory and variance reports.

### 2.3 Fields NOT Changing (Stay at 2dp)

**Display-level monetary values:**

| Table | Column | Current | Stay At | Rationale |
|-------|--------|---------|--------|-----------|
| `product_variants` | `price` | `Decimal(10, 2)` | `Decimal(10, 2)` | Selling price (no fractional cents) |
| `transactions` | `subtotal`, `tax`, `tip`, `total`, `discount` | `Decimal(10, 2)` | `Decimal(10, 2)` | Transaction display values |
| `transactions` | `totalCost`, `grossMargin` | `Decimal(10, 2)` | `Decimal(10, 2)` | Aggregated display values |
| `transactions` | `marginPercent` | `Decimal(5, 2)` | `Decimal(5, 2)` | Percentage display |
| `transaction_items` | `price` | `Decimal(10, 2)` | `Decimal(10, 2)` | Sale price |
| `transaction_items` | `effectiveTaxRate` | `Decimal(10, 4)` | `Decimal(10, 4)` | Already sufficient |
| `receipts` | all | `Decimal(10, 2)` | `Decimal(10, 2)` | Receipt display |
| `product_variants` | `currentMargin` | `Decimal(5, 2)` | `Decimal(5, 2)` | Margin percentage |
| `tax_rates` | `rate` | `Decimal(5, 4)` | `Decimal(5, 4)` | Already sufficient |

---

## 3. Implementation Plan

### Phase 1: Database Schema Migration

#### Step 1.1: Create Prisma Migration

**File:** `backend/prisma/schema.prisma`

Update the following fields:

```prisma
model StockItem {
  // ... existing fields ...
  standardCost Decimal @default(0) @db.Decimal(12, 6)  // Changed from (10, 4)
  costPerUnit  Decimal @default(0) @db.Decimal(12, 6)  // Changed from (10, 4)
  // ... rest of model ...
}

model CostHistory {
  // ... existing fields ...
  previousCost Decimal @db.Decimal(12, 6)  // Changed from (10, 4)
  newCost      Decimal @db.Decimal(12, 6)  // Changed from (10, 4)
  // ... rest of model ...
}

model ProductVariant {
  // ... existing fields ...
  theoreticalCost Decimal? @db.Decimal(12, 6)  // Changed from (10, 4)
  // ... rest of model ...
}

model TransactionItem {
  // ... existing fields ...
  unitCost  Decimal? @db.Decimal(12, 6)  // Changed from (10, 4)
  totalCost Decimal? @db.Decimal(12, 6)  // Changed from (10, 4)
  // ... rest of model ...
}

model InventoryCountItem {
  // ... existing fields ...
  quantity      Decimal @db.Decimal(10, 2)  // Unchanged
  unitCost      Decimal @db.Decimal(12, 6)  // Changed from (10, 4)
  extendedValue Decimal @db.Decimal(14, 6)  // Changed from (10, 2)
  // ... rest of model ...
}

model VarianceReportItem {
  // ... existing fields ...
  theoreticalQty  Decimal @db.Decimal(10, 2)  // Unchanged
  actualQty       Decimal @db.Decimal(10, 2)  // Unchanged
  varianceQty     Decimal @db.Decimal(10, 2)  // Unchanged
  unitCost        Decimal @db.Decimal(12, 6)  // Changed from (10, 4)
  varianceValue   Decimal @db.Decimal(14, 6)  // Changed from (10, 2)
  // ... rest of model ...
}

model VarianceReport {
  // ... existing fields ...
  theoreticalCost Decimal @db.Decimal(14, 6)  // Changed from (10, 2)
  actualCost      Decimal @db.Decimal(14, 6)  // Changed from (10, 2)
  varianceValue   Decimal @db.Decimal(14, 6)  // Changed from (10, 2)
  // ... rest of model ...
}
```

Run migration creation:

```bash
cd /home/pippo/tev2/backend
npx prisma migrate dev --name increase_cost_precision_to_6dp --create-only
```

#### Step 1.2: Review Generated Migration SQL

**Expected output** in `backend/prisma/migrations/YYYYMMDDHHMMSS_increase_cost_precision_to_6dp/migration.sql`:

```sql
-- AlterTable
ALTER TABLE "stock_items" ALTER COLUMN "standardCost" TYPE DECIMAL(12,6), ALTER COLUMN "standardCost" SET NOT NULL;
ALTER TABLE "stock_items" ALTER COLUMN "costPerUnit" TYPE DECIMAL(12,6), ALTER COLUMN "costPerUnit" SET NOT NULL;

-- AlterTable
ALTER TABLE "cost_history" ALTER COLUMN "previousCost" TYPE DECIMAL(12,6);
ALTER TABLE "cost_history" ALTER COLUMN "newCost" TYPE DECIMAL(12,6);

-- AlterTable
ALTER TABLE "product_variants" ALTER COLUMN "theoreticalCost" TYPE DECIMAL(12,6);

-- AlterTable
ALTER TABLE "transaction_items" ALTER COLUMN "unitCost" TYPE DECIMAL(12,6);
ALTER TABLE "transaction_items" ALTER COLUMN "totalCost" TYPE DECIMAL(12,6);

-- AlterTable
ALTER TABLE "inventory_count_items" ALTER COLUMN "unitCost" TYPE DECIMAL(12,6);
ALTER TABLE "inventory_count_items" ALTER COLUMN "extendedValue" TYPE DECIMAL(14,6);

-- AlterTable
ALTER TABLE "variance_report_items" ALTER COLUMN "unitCost" TYPE DECIMAL(12,6);
ALTER TABLE "variance_report_items" ALTER COLUMN "varianceValue" TYPE DECIMAL(14,6);

-- AlterTable
ALTER TABLE "variance_reports" ALTER COLUMN "theoreticalCost" TYPE DECIMAL(14,6);
ALTER TABLE "variance_reports" ALTER COLUMN "actualCost" TYPE DECIMAL(14,6);
ALTER TABLE "variance_reports" ALTER COLUMN "varianceValue" TYPE DECIMAL(14,6);
```

**Data Safety:** PostgreSQL's `DECIMAL` type is arbitrary precision. Changing from `(10,4)` to `(12,6)` adds trailing zeros to existing data, it does **not** truncate.

Example:
- `1.2340` → `1.234000` (no data loss)
- `999.9999` → `999.999900` (no data loss)

#### Step 1.3: Apply Migration

```bash
cd /home/pippo/tev2/backend
npx prisma migrate deploy
```

Or rebuild containers (which automatically runs `prisma migrate deploy` in `docker-entrypoint.sh`):

```bash
cd /home/pippo/tev2
docker compose up -d --build
```

#### Step 1.4: Verify Migration

Execute SQL verification:

```sql
SELECT
    table_name,
    column_name,
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE
    table_name IN (
        'stock_items', 'cost_history', 'product_variants',
        'transaction_items', 'inventory_count_items',
        'variance_report_items', 'variance_reports'
    )
    AND column_name IN (
        'standardCost', 'costPerUnit', 'previousCost', 'newCost',
        'theoreticalCost', 'unitCost', 'totalCost',
        'extendedValue', 'varianceValue', 'actualCost'
    )
ORDER BY table_name, column_name;
```

**Expected results:**
- `stock_items.standardCost`, `costPerUnit`: `numeric_precision=12`, `numeric_scale=6`
- `cost_history.previousCost`, `newCost`: `numeric_precision=12`, `numeric_scale=6`
- `product_variants.theoreticalCost`: `numeric_precision=12`, `numeric_scale=6`
- `transaction_items.unitCost`, `totalCost`: `numeric_precision=12`, `numeric_scale=6`
- `inventory_count_items.unitCost`: `numeric_precision=12`, `numeric_scale=6`
- `inventory_count_items.extendedValue`: `numeric_precision=14`, `numeric_scale=6`
- `variance_report_items.unitCost`: `numeric_precision=12`, `numeric_scale=6`
- `variance_report_items.varianceValue`: `numeric_precision=14`, `numeric_scale=6`
- `variance_reports.theoreticalCost`, `actualCost`, `varianceValue`: `numeric_precision=14`, `numeric_scale=6`

---

### Phase 2: Backend Utility Layer

#### Step 2.1: Add High-Precision Money Utilities

**File:** `backend/src/utils/money.ts`

Add the following functions **without modifying existing `*Money` functions** (those are used for 2dp display values):

```typescript
// ==================================================================
// HIGH-PRECISION COST CALCULATION UTILITIES
// Precision: 6 decimal places for unit costs and intermediate values
// ==================================================================

const COST_PRECISION = 6;
const COST_CURRENCY_CONFIG: Parameters<typeof currency>[1] = {
  symbol: '',
  decimal: '.',
  separator: ',',
  precision: COST_PRECISION,
};

/**
 * Create a currency.js instance for cost calculations
 */
function createCostMoney(value: number): currency {
  return currency(value, COST_CURRENCY_CONFIG);
}

/**
 * Round a number to 6 decimal places for cost calculations
 */
export function roundCost(value: number): number {
  if (!isMoneyValid(value)) return 0;
  return createCostMoney(value).value;
}

/**
 * Multiply two numbers with 6 decimal precision
 */
export function multiplyCost(value: number, multiplier: number): number {
  if (!isMoneyValid(value) || !isMoneyValid(multiplier)) return 0;
  return createCostMoney(value).multiply(multiplier).value;
}

/**
 * Add two numbers with 6 decimal precision
 */
export function addCost(a: number, b: number): number {
  if (!isMoneyValid(a) || !isMoneyValid(b)) return 0;
  return createCostMoney(a).add(b).value;
}

/**
 * Subtract two numbers with 6 decimal precision
 */
export function subtractCost(a: number, b: number): number {
  if (!isMoneyValid(a) || !isMoneyValid(b)) return 0;
  return createCostMoney(a).subtract(b).value;
}

/**
 * Divide two numbers with 6 decimal precision
 */
export function divideCost(value: number, divisor: number): number {
  if (!isMoneyValid(value) || !isMoneyValid(divisor) || divisor === 0) return 0;
  return createCostMoney(value).divide(divisor).value;
}

/**
 * Format a cost value with specified decimal places (default 6)
 * Returns a plain number string without currency symbol
 */
export function formatCost(value: number, decimals: number = 6): string {
  if (!isMoneyValid(value)) return '0.' + '0'.repeat(decimals);
  return value.toFixed(decimals);
}
```

**Important:** Do **NOT** modify the existing `DEFAULT_CURRENCY`, `roundMoney`, `addMoney`, `subtractMoney`, `multiplyMoney`, `divideMoney`, or `formatMoney` functions. These are used for display-level monetary values (prices, transaction totals) which must remain at 2 decimal places.

#### Step 2.2: Export New Functions

Ensure the new functions are exported at the end of the file (they already are via `export` keywords).

---

### Phase 3: Backend Calculation Services

#### Step 3.1: Update `costCalculationService.ts`

**File:** `backend/src/services/costCalculationService.ts`

**Import changes:**
```typescript
import { decimalToNumber, multiplyCost, addCost, subtractCost, divideCost, roundCost } from '../utils/money';
```

**Function: `calculateVariantCost(variantId)` (lines 14-45)**

Current code uses `multiplyMoney` and `roundMoney`. Replace with `multiplyCost` and `roundCost`:

```typescript
export async function calculateVariantCost(variantId: number): Promise<number | null> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { stockConsumption: { include: { stockItem: true } } },
  });

  if (!variant || variant.stockConsumption.length === 0) {
    return null;
  }

  let totalCost = 0;
  let hasValidCosts = true;

  for (const consumption of variant.stockConsumption) {
    const standardCost = decimalToNumber(consumption.stockItem.standardCost);

    if (standardCost <= 0) {
      hasValidCosts = false;
      continue;
    }

    const quantity = decimalToNumber(consumption.quantity);
    const ingredientCost = multiplyCost(standardCost, quantity);  // Changed from multiplyMoney
    totalCost = addCost(totalCost, ingredientCost);  // Changed from addMoney
  }

  return hasValidCosts ? roundCost(totalCost) : null;  // Changed from roundMoney
}
```

**Function: `calculateTransactionItemCost(variantId, quantity)` (lines 47-69)**

```typescript
export async function calculateTransactionItemCost(
  variantId: number,
  quantity: number
): Promise<TransactionItemCostResult> {
  const unitCost = await calculateVariantCost(variantId);

  if (unitCost === null) {
    return {
      variantId,
      quantity,
      unitCost: null,
      totalCost: null,
    };
  }

  const totalCost = multiplyCost(unitCost, quantity);  // Changed from multiplyMoney

  return {
    variantId,
    quantity,
    unitCost: roundCost(unitCost),  // Changed from roundMoney
    totalCost: roundCost(totalCost),  // Changed from roundMoney
  };
}
```

**Function: `calculateTransactionCost(items)` (lines 72-103)**

```typescript
export async function calculateTransactionCost(
  items: Array<{ variantId: number; quantity: number }>
): Promise<TransactionCostResult> {
  const itemCosts: TransactionItemCostResult[] = [];
  let totalCost = 0;
  let hasAllCosts = true;

  for (const item of items) {
    const itemCost = await calculateTransactionItemCost(item.variantId, item.quantity);
    itemCosts.push(itemCost);

    if (itemCost.totalCost === null) {
      hasAllCosts = false;
    } else {
      totalCost = addCost(totalCost, itemCost.totalCost);  // Changed from addMoney
    }
  }

  return {
    items: itemCosts,
    totalCost: hasAllCosts ? roundCost(totalCost) : null,  // Changed from roundMoney
    hasAllCosts,
  };
}
```

**Function: `updateVariantTheoreticalCost(variantId)` (lines 105-145)**

This function calculates theoretical cost and margin. **Critical design decision:**
- Use `roundCost` for the theoretical cost (stored at 6dp)
- Use `divideMoney` for margin percentage (display value, stays at 2dp)

```typescript
export async function updateVariantTheoreticalCost(variantId: number): Promise<void> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { select: { taxRate: true } } },
  });

  if (!variant) return;

  const theoreticalCost = await calculateVariantCost(variantId);
  const price = decimalToNumber(variant.price);

  if (theoreticalCost === null || price === 0) {
    await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        theoreticalCost: null,
        currentMargin: null,
        costStatus: 'missing',
        lastCostCalc: new Date(),
      },
    });
    return;
  }

  // Cost at 6dp precision
  const roundedCost = roundCost(theoreticalCost);

  // Margin calculations (display values at 2dp)
  const marginValue = subtractMoney(price, roundedCost);  // Use subtractMoney for 2dp display
  const currentMargin = divideMoney(marginValue, price) * 100;

  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      theoreticalCost: roundedCost,  // Stored at 6dp
      currentMargin: roundMoney(currentMargin),  // Display at 2dp
      costStatus: 'current',
      lastCostCalc: new Date(),
    },
  });
}
```

**Function: `getVariantCostBreakdown(variantId)` (lines 147-196)**

```typescript
export async function getVariantCostBreakdown(variantId: number): Promise<CostBreakdown> {
  // ... existing code ...

  for (const consumption of variant.stockConsumption) {
    const stockItem = consumption.stockItem;
    const standardCost = decimalToNumber(stockItem.standardCost);
    const quantity = decimalToNumber(consumption.quantity);

    if (standardCost > 0 && quantity > 0) {
      const ingredientCost = multiplyCost(standardCost, quantity);  // Changed from multiplyMoney

      ingredientCosts.push({
        stockItemId: stockItem.id,
        stockItemName: stockItem.name,
        quantity,
        standardCost: roundCost(standardCost),  // Changed from roundMoney
        ingredientCost: roundCost(ingredientCost),  // Changed from roundMoney
      });

      totalCost = addCost(totalCost, ingredientCost);  // Changed from addMoney
    }
  }

  // ... rest of function (return statement) ...
}
```

**Function: `recalculateAllVariantCosts()` (lines 209-241)**

No direct changes needed. This function calls `updateVariantTheoreticalCost()` which now uses `roundCost` internally.

---

#### Step 3.2: Update `costHistoryService.ts`

**File:** `backend/src/services/costHistoryService.ts`

**Import changes:**
```typescript
import { decimalToNumber, subtractCost, divideCost, roundCost, roundMoney } from '../utils/money';
```

**Function: `updateIngredientCost(stockItemId, newCost, reason, userId, effectiveFrom?, notes?)` (lines 12-94)**

The `changePercent` calculation should use `divideCost` for precision, but the final `changePercent` is stored at `Decimal(6, 2)` (2 decimal places), so use `roundMoney` for the final storage:

```typescript
export async function updateIngredientCost(
  stockItemId: string,
  newCost: number,
  reason: string,
  userId: number,
  effectiveFrom?: Date,
  notes?: string
): Promise<void> {
  const stockItem = await prisma.stockItem.findUnique({
    where: { id: stockItemId },
  });

  if (!stockItem) {
    throw new Error('Stock item not found');
  }

  const previousCost = decimalToNumber(stockItem.standardCost);
  let changePercent = 0;

  if (previousCost > 0) {
    const change = subtractCost(newCost, previousCost);  // Changed from subtractMoney
    changePercent = divideCost(change, previousCost) * 100;
  } else if (newCost > 0) {
    changePercent = 100;
  }

  // Create cost history record
  await prisma.costHistory.create({
    data: {
      stockItemId,
      previousCost: roundCost(previousCost),  // Changed from roundMoney
      newCost: roundCost(newCost),  // Changed from roundMoney
      changePercent: roundMoney(changePercent),  // Stored at 2dp
      reason,
      effectiveFrom: effectiveFrom || new Date(),
      userId,
      notes,
    },
  });

  // Update stock item
  await prisma.stockItem.update({
    where: { id: stockItemId },
    data: {
      standardCost: roundCost(newCost),  // Changed from roundMoney
      lastCostUpdate: new Date(),
      costUpdateReason: reason,
    },
  });

  // ... rest of function (cascade to variants) ...
}
```

**Function: `revertCostChange(historyId, userId)` (lines 138-163)**

No direct changes needed. This function calls `updateIngredientCost()` which now uses `roundCost` internally.

---

#### Step 3.3: Update `varianceService.ts`

**File:** `backend/src/services/varianceService.ts`

**Import changes:**
```typescript
import { decimalToNumber, multiplyCost, addCost, subtractCost, roundCost, divideCost } from '../utils/money';
```

**Function: `generateVarianceReport(...)` (lines 142-432)**

This is the most complex calculation function. Replace all cost-related arithmetic with `*Cost` functions. Quantities remain at 2dp, so quantity arithmetic can use existing `multiplyMoney`/`addMoney`/`subtractMoney`/`roundMoney`.

**Key calculation sections:**

1. **Theoretical usage calculation:**
```typescript
const usage = multiplyCost(ingredient.quantity, item.quantity);  // Changed from multiplyMoney
theoreticalUsage.set(ingredient.stockItemId, roundCost(current + usage));  // Changed from roundMoney
```

2. **Actual usage:**
```typescript
const begQty = decimalToNumber(starting.quantity);
const additions = decimalToNumber(additionsTotal);
const endQty = decimalToNumber(ending.quantity);

// Quantities are 2dp, use money functions
const actualQty = roundMoney(subtractMoney(addMoney(begQty, additions), endQty));
```

3. **Variance calculations:**
```typescript
const varianceQty = subtractMoney(actualQty, theoreticalQty);  // Quantities at 2dp
const varianceValue = multiplyCost(varianceQty, unitCost);  // VarianceQty (2dp) * unitCost (6dp)
const variancePercent = divideCost(Math.abs(varianceQty), theoreticalQty) * 100;
```

4. **Report totals:**
```typescript
// Costs at 6dp precision
totalTheoretical = addCost(totalTheoretical, multiplyCost(theoreticalQty, unitCost));
totalActual = addCost(totalActual, multiplyCost(actualQty, unitCost));
totalVarianceValue = subtractCost(totalActual, totalTheoretical);
totalVariancePercent = divideCost(Math.abs(totalVarianceValue), totalTheoretical) * 100;
```

**Full replacement:**

Due to the length of this function (290 lines), use a systematic find-and-replace approach:
- Find: `multiplyMoney(` when the first argument is a cost field (standardCost, unitCost, etc.)
- Replace with: `multiplyCost(`
- Find: `addMoney(` when adding cost fields
- Replace with: `addCost(`
- Find: `subtractMoney(` when subtracting cost fields
- Replace with: `subtractCost(`
- Find: `roundMoney(` when rounding cost fields
- Replace with: `roundCost(`

**Critical distinction:**
- **Quantity operations** (e.g., `theoreticalQty`, `actualQty`, `varianceQty`) — keep using `multiplyMoney`/`addMoney`/`subtractMoney`/`roundMoney` (2dp)
- **Cost operations** (e.g., `standardCost`, `unitCost`, `varianceValue`) — use `multiplyCost`/`addCost`/`subtractCost`/`roundCost` (6dp)

---

#### Step 3.4: Update `analyticsService.ts`

**File:** `backend/src/services/analyticsService.ts`

**Import changes:**
```typescript
import { multiplyMoney, addMoney, subtractMoney, divideMoney, roundMoney,
         multiplyCost, addCost, subtractCost, divideCost, roundCost } from '../utils/money';
```

**Function: `aggregateProductPerformance(params)` (lines 42-274)**

Revenue calculation uses `price` (2dp), keep using `multiplyMoney`:
```typescript
productMetrics.totalRevenue = addMoney(productMetrics.totalRevenue,
    multiplyMoney(item.price, item.quantity));
```

No changes needed for revenue calculations.

**Function: `getMarginByProduct(...)` (lines 817-938)**

COGS calculation uses `variantInfo.theoreticalCost` (now 6dp). Replace with `multiplyCost`:
```typescript
const itemRevenue = multiplyMoney(item.price, item.quantity);  // Price at 2dp
metrics.cogs = addCost(metrics.cogs, multiplyCost(variantInfo.theoreticalCost || 0, item.quantity));
```

**Function: `getMarginByCategory(...)` (lines 725-815)**

COGS calculation distributes transaction-level `totalCost` (2dp) to items. This uses `itemRevenue` (2dp) and `txCost` (2dp), so no changes needed.

---

#### Step 3.5: Update `costManagement.ts` Handler

**File:** `backend/src/handlers/costManagement.ts`

**Import changes:**
```typescript
import { decimalToNumber, multiplyCost, roundCost, formatCost } from '../utils/money';
```

**Section: Inventory count `extendedValue` calculation (lines 410-419)**

```typescript
const unitCost = decimalToNumber(stockItem.standardCost);
const extendedValue = multiplyCost(item.quantity, unitCost);  // Changed from raw multiplication
```

**Section: Cost validation in POST `/ingredients/:id/cost` (lines 126-128)**

Add decimal precision validation:

```typescript
// Validate cost is a positive number
if (!cost || typeof cost !== 'number' || cost <= 0) {
  res.status(400).json({ error: i18n.t('errors.costManagement.ingredients.invalidCost') });
  return;
}

// Validate max decimal places (6)
const costStr = String(cost);
if (costStr.includes('.') && costStr.split('.')[1]?.length > 6) {
  res.status(400).json({ error: 'Cost must not exceed 6 decimal places' });
  return;
}
```

---

#### Step 3.6: Update `transactions.ts` Handler

**File:** `backend/src/handlers/transactions.ts`

**Import changes:**
```typescript
import { decimalToNumber, subtractMoney, divideMoney, roundMoney,
         roundCost } from '../utils/money';
import { calculateTransactionCost } from '../services/costCalculationService';
```

**Section: Payment processing cost calculation (lines 219-265)**

The `costResult.totalCost` from `calculateTransactionCost()` is now at 6dp precision. When persisting to `Transaction.totalCost` and `Transaction.grossMargin` (which remain `Decimal(10, 2)`), round the final values:

```typescript
const costResult = await calculateTransactionCost(costInput);

// TransactionItem.unitCost and TransactionItem.totalCost are stored at 6dp (handled by costResult)

// Transaction.totalCost and Transaction.grossMargin are stored at 2dp
const totalCost = costResult.totalCost !== null ? roundMoney(costResult.totalCost) : null;

const grossMargin = totalCost !== null
  ? subtractMoney(calculatedSubtotal, totalCost)
  : null;

const marginPercent = totalCost !== null && calculatedSubtotal > 0
  ? divideMoney(grossMargin!, calculatedSubtotal) * 100
  : null;

// Update transaction record
await prisma.transaction.update({
  where: { id: transaction.id },
  data: {
    totalCost,
    grossMargin,
    marginPercent,
    costCalculatedAt: new Date(),
  },
});
```

**Rationale:** Transaction-level aggregation fields (`totalCost`, `grossMargin`) are display values and should be rounded to 2dp for consistency with other monetary fields. Item-level costs (`TransactionItem.unitCost`, `TransactionItem.totalCost`) preserve the full 6dp precision for accurate historical tracking.

---

### Phase 4: Backend TypeScript Types

#### Step 4.1: Update `backend/src/types/cost.ts`

Add JSDoc annotations to document expected precision. No structural changes needed since types already use `number`.

```typescript
/**
 * Input for updating ingredient cost
 */
export interface CostHistoryInput {
  stockItemId: string;
  /** @precision 6 decimal places */
  newCost: number;
  reason: string;
  effectiveFrom?: Date;
  notes?: string;
}

/**
 * DTO for cost history records
 */
export interface CostHistoryDTO {
  id: number;
  stockItemId: string;
  /** @precision 6 decimal places */
  previousCost: number;
  /** @precision 6 decimal places */
  newCost: number;
  changePercent: number;
  reason: string;
  effectiveFrom: Date;
  userId: number;
  notes?: string;
  createdAt: Date;
}

/**
 * Cost breakdown for a product variant
 */
export interface CostBreakdown {
  variantId: number;
  variantName: string;
  ingredientCosts: IngredientCostDetail[];
  /** @precision 6 decimal places */
  totalCost: number | null;
  hasValidCosts: boolean;
}

/**
 * Detail for a single ingredient in cost breakdown
 */
export interface IngredientCostDetail {
  stockItemId: string;
  stockItemName: string;
  quantity: number;
  /** @precision 6 decimal places */
  standardCost: number;
  /** @precision 6 decimal places */
  ingredientCost: number;
}

// ... other interfaces with similar annotations ...
```

#### Step 4.2: No changes to `shared/types.ts`

The `StockItem` type in shared types does not include cost fields (they are managed through the cost management API). No change needed.

---

### Phase 5: Frontend Changes

#### Step 5.1: Add Cost-Specific Formatter

**File:** `frontend/utils/formatting.ts`

Add a new function alongside the existing `formatCurrency`:

```typescript
/**
 * Format a cost value with specified decimal places (default 6)
 * Uses manual toFixed() for consistency with formatCurrency
 * Output format: €1,234567 (6 decimal places)
 */
export const formatCost = (amount: number | string | null | undefined, decimals: number = 6): string => {
  if (amount === null || amount === undefined) return `€${(0).toFixed(decimals).replace('.', ',')}`;
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return `€${(0).toFixed(decimals).replace('.', ',')}`;
  return `€${numAmount.toFixed(decimals).replace('.', ',')}`;
};
```

#### Step 5.2: Add High-Precision Rounding Function

**File:** `frontend/utils/money.ts`

Add a rounding function for cost values:

```typescript
/**
 * Round a number to specified decimal places (default 6) for cost calculations
 */
export function roundCost(value: number, precision: number = 6): number {
  if (!isMoneyValid(value)) return 0;
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
}
```

#### Step 5.3: Update `CostManagementPanel.tsx`

**File:** `frontend/components/CostManagementPanel.tsx`

**A. Import changes:**
```typescript
import { formatCurrency, formatCost } from '../utils/formatting';
```

**B. Update input field (lines 85-93):**
```tsx
<input
  type="number"
  step="0.000001"
  min="0"
  value={newCost}
  onChange={e => setNewCost(e.target.value)}
  placeholder={t('costManagement.newCostPlaceholder')}
  required
/>
```

**C. Replace `formatCurrency` with `formatCost` for cost fields:**

| Line | Current | New |
|------|---------|-----|
| 81 | `formatCurrency(ingredient.standardCost) / {ingredient.baseUnit}` | `formatCost(ingredient.standardCost) / {ingredient.baseUnit}` |
| 172 | `formatCurrency(ingredient.standardCost)` | `formatCost(ingredient.standardCost)` |
| 176 | `formatCurrency(ingredient.costPerUnit)` | `formatCost(ingredient.costPerUnit)` |
| 205 | `formatCurrency(entry.previousCost)` | `formatCost(entry.previousCost)` |
| 207 | `formatCurrency(entry.newCost)` | `formatCost(entry.newCost)` |
| 261 | `formatCurrency(breakdown.totalCost)` | `formatCost(breakdown.totalCost)` |
| 269 | `formatCurrency(ic.ingredientCost)` | `formatCost(ic.ingredientCost)` |
| 272 | `formatCurrency(ic.standardCost)` | `formatCost(ic.standardCost)` |
| 347 | `formatCurrency(ing.standardCost)` | `formatCost(ing.standardCost)` |
| 469 | `formatCurrency(v.theoreticalCost)` | `formatCost(v.theoreticalCost)` |

**D. Keep `formatCurrency` for price and margin fields:**

| Line | Field | Keep As |
|------|-------|---------|
| 468 | `v.price` | `formatCurrency(v.price)` |
| 471 | `Number(v.currentMargin).toFixed(1)%` | Unchanged |

**E. Update change percentage formatting (line 536):**
```tsx
{changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%
```
Change from `.toFixed(1)` to `.toFixed(2)` to support 2 decimal places for percentages (consistent with backend `Decimal(6,2)`).

#### Step 5.4: Update `VarianceReportPanel.tsx`

**File:** `frontend/components/VarianceReportPanel.tsx`

**Import changes:**
```typescript
import { formatCurrency, formatCost } from '../utils/formatting';
```

**Replace `formatCurrency` with `formatCost` for cost fields:**

| Line | Field | New |
|------|-------|-----|
| 164 | `report.theoreticalCost` | `formatCost(report.theoreticalCost)` |
| 168 | `report.actualCost` | `formatCost(report.actualCost)` |
| 173 | `report.varianceValue` | `formatCost(report.varianceValue)` |
| 231 | `item.unitCost` | `formatCost(item.unitCost)` |
| 233 | `item.varianceValue` | `formatCost(item.varianceValue)` |
| 404 | `r.varianceValue` | `formatCost(r.varianceValue)` |

**Keep `formatCurrency` for display-level values if any.**

**Keep quantity formatting at 2dp:**
```tsx
{theoreticalQty.toFixed(2)}
```
Quantities remain at 2dp, no change needed.

#### Step 5.5: Update `InventoryCountPanel.tsx`

**File:** `frontend/components/InventoryCountPanel.tsx`

**Import changes:**
```typescript
import { formatCurrency, formatCost } from '../utils/formatting';
```

**Replace `formatCurrency` with `formatCost` for cost fields:**

| Line | Field | New |
|------|-------|-----|
| 529 | `item.unitCost` | `formatCost(item.unitCost)` |
| 532 | `item.extendedValue` | `formatCost(item.extendedValue, 2)` or `formatCurrency(item.extendedValue)` |

**Decision:** `extendedValue` is a computed value for inventory valuation. Use `formatCurrency(item.extendedValue)` (2dp) for consistent currency display, or `formatCost(item.extendedValue, 2)` to show full precision. Recommendation: use `formatCurrency` for consistency with financial reporting.

#### Step 5.6: No Changes Needed for `ProfitAnalyticsPanel.tsx`

This panel displays aggregated transaction-level values (revenue, COGS, gross profit) which remain at 2dp precision. No formatting changes needed.

#### Step 5.7: Update i18n Translations

**File:** `frontend/public/locales/en/admin.json`

Add new keys in the `costManagement` section:

```json
{
  "costManagement": {
    // ... existing keys ...
    "newCostPlaceholder": "e.g., 0.123456",
    "costPrecisionInfo": "Up to 6 decimal places supported",
    "costDecimalsLimit": "Cost must not exceed 6 decimal places",
    "standardCost": "Standard Cost (€/unit)",
    "costPerUnit": "Cost per Unit (€)"
  }
}
```

**File:** `frontend/public/locales/it/admin.json`

```json
{
  "costManagement": {
    // ... existing keys ...
    "newCostPlaceholder": "es., 0,123456",
    "costPrecisionInfo": "Supportato fino a 6 cifre decimali",
    "costDecimalsLimit": "Il costo non deve superare 6 cifre decimali",
    "standardCost": "Costo Standard (€/unità)",
    "costPerUnit": "Costo per Unità (€)"
  }
}
```

#### Step 5.8: No Changes to `frontend/services/costManagementService.ts`

The service types already use `number` which supports 6dp values. The API response from the backend will preserve precision (Prisma serializes `Decimal` as JSON string or number). No type changes needed.

---

### Phase 6: Testing and Verification

#### Step 6.1: Unit-Level Backend Tests

**Test 1: High-precision cost calculation**

```typescript
// Test: calculateVariantCost with 6dp costs
const variantId = 1;  // Assume variant with consumption
const theoreticalCost = await calculateVariantCost(variantId);

// Expect: value preserved at 6dp
expect(theoreticalCost).toBeCloseTo(expectedCost, 6);
```

**Test 2: Cost aggregation in variance report**

```typescript
// Test: varianceValue = varianceQty * unitCost (6dp)
const unitCost = 0.123456;
const varianceQty = 2.5;
const expectedVariance = 0.308640;  // 0.123456 * 2.5
```

**Test 3: Historical cost tracking**

```typescript
// Update cost with 6dp value
await updateIngredientCost(stockItemId, 0.123456, 'Test update', 1);

// Verify stored in CostHistory
const history = await prisma.costHistory.findFirst({ where: { stockItemId } });
expect(history.newCost).toBe(0.123456);
```

#### Step 6.2: Integration-Level Tests

**Test Scenario 1: End-to-end cost propagation**

1. Create stock item with `standardCost = 0.123456`
2. Create product variant consuming 2.5 units of this stock item
3. Verify `ProductVariant.theoreticalCost = 0.308640` (0.123456 * 2.5)
4. Process transaction with 3 units of this variant
5. Verify `TransactionItem.unitCost = 0.308640`, `TransactionItem.totalCost = 0.925920`
6. Verify `Transaction.totalCost` is rounded to `0.93` (2dp display)

**Test Scenario 2: Variance report with 6dp costs**

1. Generate variance report using ingredients with 6dp costs
2. Verify `VarianceReportItem.unitCost` preserves 6dp
3. Verify `VarianceReportItem.varianceValue` = `varianceQty * unitCost` (6dp result)
4. Verify report totals aggregate correctly without precision loss

**Test Scenario 3: Historical data compatibility**

1. Existing `CostHistory` records with 4dp values (e.g., `1.2340`)
2. Verify display as `€1,234000` (padded to 6dp)
3. Verify no data loss in migration (values unchanged, trailing zeros added)

#### Step 6.3: Frontend Display Tests

**Test 1: Cost input accepts 6dp values**

```typescript
// Input: 0.123456
// Expected: Value preserved (no truncation)
```

**Test 2: Cost display shows full precision**

```typescript
// Backend returns: standardCost = 0.123456
// Frontend formatCost displays: €0,123456
```

**Test 3: Extended value formatting**

```typescript
// Backend returns: extendedValue = 0.925920 (6dp)
// Frontend formatCurrency displays: €0,93 (2dp) - for inventory valuation
// OR formatCost(..., 6) displays: €0,925920 (6dp) - for detailed view
```

#### Step 6.4: API Serialization Tests

**Test 1: Verify precision in API response**

```bash
curl http://192.168.1.70/api/cost-management/ingredients
```

Expected response:
```json
{
  "standardCost": 0.123456,  // Number (preserves up to ~15 significant digits)
  "costPerUnit": 0.123456
}
```

**Test 2: Verify precision in transaction response**

```bash
curl http://192.168.1.70/api/transactions/{id}
```

Expected response:
```json
{
  "items": [
    {
      "unitCost": 0.308640,  // 6dp preserved
      "totalCost": 0.925920   // 6dp preserved
    }
  ],
  "totalCost": 0.93,  // 2dp for transaction-level aggregation
  "grossMargin": 2.07
}
```

---

### Phase 7: Deployment Plan

#### Step 7.1: Pre-Deployment Checklist

- [ ] Migration file reviewed and tested locally
- [ ] Backend code changes committed to repository
- [ ] Frontend code changes committed to repository
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual verification completed with test data
- [ ] Rollback migration script prepared

#### Step 7.2: Deployment Sequence

1. **Backup database** (optional but recommended):
   ```bash
   docker exec bar_pos_backend_db pg_dump -U postgres bar_pos_db > backup_before_6dp_migration.sql
   ```

2. **Deploy code changes**:
   ```bash
   cd /home/pippo/tev2
   git pull  # Assuming changes are committed
   docker compose up -d --build
   ```

3. **Verify migration applied**:
   ```bash
   docker exec bar_pos_backend npx prisma migrate status
   ```

4. **Verify application health**:
   - Check backend logs: `docker logs bar_pos_backend`
   - Check frontend logs: `docker logs bar_pos_frontend`
   - Test cost management page in browser
   - Test variance report generation

5. **Monitor for errors**:
   - Check for any precision-related errors in logs
   - Verify API responses include correct precision
   - Verify frontend displays correctly

#### Step 7.3: Rollback Plan

**Scenario 1: Immediate rollback before 6dp data entry**

If issues arise before any 6dp data has been entered:

1. Create reverse migration file manually:
   ```sql
   -- migration.sql
   ALTER TABLE "stock_items" ALTER COLUMN "standardCost" TYPE DECIMAL(10,4), ALTER COLUMN "standardCost" SET NOT NULL;
   ALTER TABLE "stock_items" ALTER COLUMN "costPerUnit" TYPE DECIMAL(10,4), ALTER COLUMN "costPerUnit" SET NOT NULL;
   -- ... repeat for all 14 columns, reverting to (10,4) or (10,2)
   ```

2. Revert backend and frontend code changes

3. Rebuild containers:
   ```bash
   docker compose up -d --build
   ```

**Scenario 2: Rollback after 6dp data entry**

If 6dp data has been entered, reverting to (10,4) precision would **truncate** values (data loss). In this case:

- Do NOT revert the schema (keep 6dp precision)
- Revert only the code changes if they contain bugs
- Or fix bugs in place without reverting schema

---

## 4. Files to Modify

### Backend Files

| File | Changes | Lines |
|------|---------|-------|
| `backend/prisma/schema.prisma` | Update 14 Decimal field declarations | ~14 lines |
| `backend/prisma/migrations/YYYYMMDDHHMMSS_*/migration.sql` | Auto-generated by Prisma | ~14 ALTER statements |
| `backend/src/utils/money.ts` | Add `roundCost`, `multiplyCost`, `addCost`, `subtractCost`, `divideCost`, `formatCost` | ~50 lines |
| `backend/src/services/costCalculationService.ts` | Replace `*Money` with `*Cost` in cost calculations | ~20 lines |
| `backend/src/services/costHistoryService.ts` | Replace `subtractMoney`/`divideMoney`/`roundMoney` with `*Cost` equivalents | ~5 lines |
| `backend/src/services/varianceService.ts` | Replace cost-related `*Money` with `*Cost` | ~30 lines |
| `backend/src/services/analyticsService.ts` | Replace COGS-related `multiplyMoney` with `multiplyCost` | ~5 lines |
| `backend/src/handlers/costManagement.ts` | Add 6dp validation; update extendedValue calculation | ~10 lines |
| `backend/src/handlers/transactions.ts` | Round 6dp intermediate costs to 2dp for Transaction-level persistence | ~5 lines |
| `backend/src/types/cost.ts` | Add JSDoc precision annotations | ~20 lines |

### Frontend Files

| File | Changes | Lines |
|------|---------|-------|
| `frontend/utils/formatting.ts` | Add `formatCost()` function | ~10 lines |
| `frontend/utils/money.ts` | Add `roundCost()` function | ~10 lines |
| `frontend/components/CostManagementPanel.tsx` | Change input `step`; replace `formatCurrency` with `formatCost` for costs | ~15 lines |
| `frontend/components/VarianceReportPanel.tsx` | Replace `formatCurrency` with `formatCost` for costs | ~10 lines |
| `frontend/components/InventoryCountPanel.tsx` | Replace `formatCurrency` with `formatCost` for costs | ~5 lines |
| `frontend/public/locales/en/admin.json` | Add cost precision validation messages | ~5 lines |
| `frontend/public/locales/it/admin.json` | Add cost precision validation messages | ~5 lines |

**Total estimated changes:** ~200 lines across 18 files

---

## 5. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| JavaScript floating-point precision errors at 6dp | High (accumulated rounding errors) | Medium | Use `currency.js` with `precision: 6` for all cost arithmetic; never use raw JS multiplication/division |
| API responses truncating 6dp values | High (frontend receives incorrect costs) | Low | Prisma `Decimal` serializes as JSON number (preserves ~15 significant digits); verify with integration tests |
| Existing financial reports showing different numbers | Medium (apparent discrepancies) | Very Low | Existing 4dp values become 6dp with trailing zeros (e.g., `1.2340` → `1.234000`); no actual value change |
| Performance impact of wider DECIMAL columns | Low (query time increase) | Negligible | PostgreSQL DECIMAL is variable-length; performance impact is negligible (<1% on large datasets) |
| Frontend `parseFloat` losing precision | Medium | Very Low | `parseFloat("0.123456")` = `0.123456` (safe within IEEE 754); verify with edge case testing |
| Mixed precision in calculations (6dp cost * 2dp quantity) | High (incorrect results) | Medium | All intermediate calculations use 6dp (`multiplyCost`); only round to 2dp at final display/persistence |
| Migration fails due to existing data constraints | High (deployment blocked) | Very Low | `DECIMAL` type change adds precision, does not remove; safe operation on existing data |
| Frontend input validation rejects valid 6dp values | Medium (user experience issue) | Low | Update `step` attribute to `0.000001` and verify parsing logic |
| Cost history reports showing truncated values | Medium (data inconsistency) | Low | Historical values preserved with trailing zeros; verify with test data |

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Backend:**
- `roundCost(0.123456)` → `0.123456`
- `multiplyCost(0.123456, 2.5)` → `0.308640`
- `addCost(0.123456, 0.234567)` → `0.358023`
- `divideCost(0.308640, 2.5)` → `0.123456`

**Frontend:**
- `formatCost(0.123456)` → `'€0,123456'`
- `formatCost(0.123456, 2)` → `'€0,12'`
- `roundCost(0.123456789)` → `0.123457` (6dp rounding)

### 6.2 Integration Tests

**End-to-End Scenarios:**

1. **Stock Item Creation with 6dp Cost**
   - Input: `standardCost = 0.123456`
   - Verify: Stored as `0.123456` in database
   - Verify: Displayed as `€0,123456` in frontend

2. **Variant Cost Calculation**
   - Input: Stock item `standardCost = 0.123456`, consumption `quantity = 2.5`
   - Expected: `theoreticalCost = 0.308640`
   - Verify: Calculation uses 6dp precision

3. **Transaction with 6dp Costs**
   - Input: Variant with `theoreticalCost = 0.308640`, quantity = 3
   - Expected: `TransactionItem.unitCost = 0.308640`, `TransactionItem.totalCost = 0.925920`
   - Expected: `Transaction.totalCost = 0.93` (2dp display)

4. **Variance Report with 6dp Costs**
   - Input: Stock item `unitCost = 0.123456`, `varianceQty = 2.5`
   - Expected: `varianceValue = 0.308640`
   - Verify: Report totals aggregate correctly

5. **Historical Data Compatibility**
   - Input: Existing `CostHistory` record with `previousCost = 1.2340`
   - Expected: Displayed as `€1,234000`
   - Verify: No data loss in migration

### 6.3 Manual Testing Checklist

- [ ] Navigate to Cost Management page
- [ ] Update stock item cost to `0.123456`
- [ ] Verify cost is accepted and saved
- [ ] Verify cost displays as `€0,123456`
- [ ] Create product variant using this stock item
- [ ] Verify theoretical cost calculated correctly at 6dp
- [ ] Process transaction with this variant
- [ ] Verify transaction item costs at 6dp
- [ ] Verify transaction total cost rounded to 2dp
- [ ] Generate variance report
- [ ] Verify variance values calculated at 6dp
- [ ] Create inventory count
- [ ] Verify extended value calculated correctly
- [ ] View cost history
- [ ] Verify historical costs display with trailing zeros
- [ ] Check profit analytics panel
- [ ] Verify COGS calculations accurate

---

## 7. Deployment Checklist

### Pre-Deployment

- [ ] All code changes reviewed and approved
- [ ] All tests passing (unit + integration)
- [ ] Manual testing completed with test data
- [ ] Migration file reviewed
- [ ] Rollback plan documented
- [ ] Stakeholders notified of deployment window

### Deployment

- [ ] Database backup created (optional)
- [ ] Code changes deployed via `docker compose up -d --build`
- [ ] Verify migration applied successfully
- [ ] Verify backend health (no errors in logs)
- [ ] Verify frontend health (no console errors)
- [ ] Test cost management functionality in browser
- [ ] Test variance report generation
- [ ] Test transaction processing

### Post-Deployment

- [ ] Monitor logs for 24 hours
- [ ] Verify no user-reported issues
- [ ] Verify financial reports accurate
- [ ] Document any unexpected behavior
- [ ] Update user documentation if needed

---

## 8. Conclusion

This implementation plan provides a comprehensive approach to enhancing the stock item management system with 6 decimal place precision for cost and price fields. The changes are:

- **Data-safe:** PostgreSQL `DECIMAL` type changes add precision without truncation
- **Backward compatible:** Existing 4dp values are preserved with trailing zeros
- **Architecturally sound:** Separate precision tiers for unit costs (6dp) and display values (2dp)
- **Testable:** Clear test scenarios for unit, integration, and manual testing
- **Deployable:** Deployment sequence with rollback options

**Estimated implementation time:** 8-12 hours
**Risk level:** Medium (mitigated by careful testing and rollback plan)

The enhancement will enable accurate cost tracking for bulk ingredients, small serving sizes, and high-precision inventory management scenarios while maintaining consistency with existing financial reporting and display standards.

---

## Appendix A: Precision Reference

### Decimal Precision Notation

`Decimal(P, S)` where:
- `P` = Precision (total number of digits)
- `S` = Scale (number of digits after decimal point)

Examples:
- `Decimal(10, 4)` → Max value: `999999.9999` (4 decimal places)
- `Decimal(12, 6)` → Max value: `999999.999999` (6 decimal places)
- `Decimal(14, 6)` → Max value: `9999999.999999` (6 decimal places)

### IEEE 754 Double Precision

JavaScript `Number` type uses IEEE 754 double precision floating-point:
- 64 bits (1 sign bit, 11 exponent bits, 52 mantissa bits)
- ~15-17 significant decimal digits
- Sufficient for 6 decimal place precision in POS scale values

### currency.js Configuration

```typescript
// Display money (prices, totals) - 2dp
{ precision: 2 }

// Cost calculations (unit costs, theoretical costs) - 6dp
{ precision: 6 }
```

---

## Appendix B: Migration SQL Reference

### Generated Migration SQL Structure

```sql
-- StockItem: standardCost (10,4) → (12,6)
-- StockItem: costPerUnit (10,4) → (12,6)
ALTER TABLE "stock_items"
  ALTER COLUMN "standardCost" TYPE DECIMAL(12,6),
  ALTER COLUMN "standardCost" SET NOT NULL,
  ALTER COLUMN "costPerUnit" TYPE DECIMAL(12,6),
  ALTER COLUMN "costPerUnit" SET NOT NULL;

-- CostHistory: previousCost (10,4) → (12,6)
-- CostHistory: newCost (10,4) → (12,6)
ALTER TABLE "cost_history"
  ALTER COLUMN "previousCost" TYPE DECIMAL(12,6),
  ALTER COLUMN "newCost" TYPE DECIMAL(12,6);

-- ProductVariant: theoreticalCost (10,4) → (12,6)
ALTER TABLE "product_variants"
  ALTER COLUMN "theoreticalCost" TYPE DECIMAL(12,6);

-- TransactionItem: unitCost (10,4) → (12,6)
-- TransactionItem: totalCost (10,4) → (12,6)
ALTER TABLE "transaction_items"
  ALTER COLUMN "unitCost" TYPE DECIMAL(12,6),
  ALTER COLUMN "totalCost" TYPE DECIMAL(12,6);

-- InventoryCountItem: unitCost (10,4) → (12,6)
-- InventoryCountItem: extendedValue (10,2) → (14,6)
ALTER TABLE "inventory_count_items"
  ALTER COLUMN "unitCost" TYPE DECIMAL(12,6),
  ALTER COLUMN "extendedValue" TYPE DECIMAL(14,6);

-- VarianceReportItem: unitCost (10,4) → (12,6)
-- VarianceReportItem: varianceValue (10,2) → (14,6)
ALTER TABLE "variance_report_items"
  ALTER COLUMN "unitCost" TYPE DECIMAL(12,6),
  ALTER COLUMN "varianceValue" TYPE DECIMAL(14,6);

-- VarianceReport: theoreticalCost (10,2) → (14,6)
-- VarianceReport: actualCost (10,2) → (14,6)
-- VarianceReport: varianceValue (10,2) → (14,6)
ALTER TABLE "variance_reports"
  ALTER COLUMN "theoreticalCost" TYPE DECIMAL(14,6),
  ALTER COLUMN "actualCost" TYPE DECIMAL(14,6),
  ALTER COLUMN "varianceValue" TYPE DECIMAL(14,6);
```

---

**End of Document**
