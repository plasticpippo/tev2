# Inventory-to-Transaction Integrity Audit Report

**Report ID:** INV-AUDIT-2026-002
**Date:** 2026-04-12
**Classification:** HIGH
**Scope:** Full re-audit of inventory deduction lifecycle, incorporating findings from INV-AUDIT-2026-001 and verifying all previously reported fixes. Deep-dive into new code paths including transaction void, recipe versioning, receipt lifecycle, and all six StockItem.quantity write paths.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Previous Findings Reconciliation](#2-previous-findings-reconciliation)
3. [System Architecture (Updated)](#3-system-architecture-updated)
4. [All Inventory Write Paths](#4-all-inventory-write-paths)
5. [New Findings](#5-new-findings)
6. [Complete File Audit Matrix](#6-complete-file-audit-matrix)
7. [Proposed Fixes With Exact Code](#7-proposed-fixes-with-exact-code)

---

## 1. Executive Summary

This is the second exhaustive audit (INV-AUDIT-2026-002) of the inventory-to-transaction integrity lifecycle. It re-examines every finding from INV-AUDIT-2026-001 (the original 12-finding report) and conducts a fresh deep-dive into all code paths that have been added or modified since.

### Audit Scope

| Area | Files Examined |
|------|---------------|
| Prisma schema | `schema.prisma` (765 lines) |
| Backend handlers | `transactions.ts` (798 lines), `stockItems.ts` (556 lines), `stockAdjustments.ts` (263 lines), `products.ts` (547 lines), `consumptionReports.ts` (188 lines) |
| Backend services | `costCalculationService.ts` (241 lines), `dailyClosingService.ts` (151 lines), `analyticsService.ts` (1018 lines), `receiptService.ts`, `varianceService.ts` |
| Frontend services | `transactionService.ts` (200 lines), `inventoryService.ts` (136 lines) |
| Frontend components | `TransactionHistory.tsx`, `PaymentContext.tsx`, `PaymentModal.tsx` |
| Migrations | All migration SQL files checked for CHECK constraints |

### Summary of Current Findings

| Severity | Count | Description |
|----------|-------|-------------|
| **HIGH** | 3 | Issues that create significant risk of data inconsistency |
| **MEDIUM** | 5 | Issues that represent design weaknesses or future risks |
| **LOW** | 3 | Cosmetic or minor concerns |
| **RESOLVED** | 6 | Issues from INV-AUDIT-2026-001 that have been fixed |
| **TOTAL OPEN** | 11 | |

### Key Conclusion

The sole active payment path (`POST /api/transactions/process-payment`) correctly performs atomic inventory deduction inside a Prisma database transaction with proper insufficient-stock checks. Six of the original twelve findings have been resolved, including the three CRITICAL issues. However, **three HIGH-severity gaps remain**: (1) transaction void restores stock using the *current* recipe rather than the recipe at time of sale, causing incorrect restorations when recipes change; (2) the `POST /stock-adjustments` endpoint can drive stock below zero with no sufficiency check; and (3) there is no database-level CHECK constraint preventing negative stock quantities. Additionally, several analytics and reporting endpoints use `{ not: 'voided' }` instead of a positive-status allowlist, risking inclusion of future or pending transaction states.

---

## 2. Previous Findings Reconciliation

The original report (INV-AUDIT-2026-001) contained 12 findings. Below is the disposition of each:

### RESOLVED Findings (6 of 12)

| Original ID | Title | Resolution |
|-------------|-------|------------|
| **CRITICAL-1** | POST /transactions creates sales without inventory deduction | **FIXED.** The dead `POST /` endpoint has been removed from `transactions.ts` (file reduced from 948 to 798 lines). The frontend `saveTransaction()` dead code has also been removed from `transactionService.ts`. |
| **CRITICAL-2** | No transaction void/cancel mechanism with stock restoration | **FIXED.** `POST /api/transactions/:id/void` added at lines 636-795. Performs atomic stock restoration inside `prisma.$transaction()`, creates `StockAdjustment` audit records, and sets status to `voided` with reason/user tracking. |
| **HIGH-2** | Recipe replacement destroys historical recipe data | **FIXED.** `StockConsumptionVersion` model added to schema. Product update handler (lines 416-444) now snapshots existing recipes into version history before deletion. |
| **HIGH-3** | Transaction items stored as JSON with no relational integrity | **FIXED.** `TransactionItem` model added to schema with proper foreign keys and indexes. `process-payment` handler now creates `TransactionItem` records (lines 296-308). |
| **MEDIUM-5** | Dead code exposes unnecessary attack surface | **FIXED.** Dead `saveTransaction()` removed from frontend. Dead `POST /` backend endpoint removed. |
| **HIGH-1** | Orphaned update-levels endpoint permits untracked deductions | **PARTIALLY FIXED.** The endpoint now requires a `reason` field and creates `StockAdjustment` records for every deduction. However, the frontend `updateStockLevels()` function remains dead code (see MEDIUM-1 below). |

### STILL OPEN Findings (6 of 12, re-categorized)

| Original ID | Original Severity | New Severity | Title | Current Status |
|-------------|-------------------|--------------|-------|----------------|
| **CRITICAL-3** | CRITICAL | **MEDIUM** | Items with no recipe sold without stock deduction | Still by-design. Variants with zero `StockConsumption` records trigger no inventory movement. See NEW-5. |
| **MEDIUM-1** | MEDIUM | **MEDIUM** | No DB constraint preventing negative stock | Still open. No `CHECK (quantity >= 0)` in schema or migrations. See NEW-1. |
| **MEDIUM-2** | MEDIUM | **LOW** | Reconciliation endpoint non-functional | `validate-integrity` endpoint exists but is diagnostic-only, not corrective. |
| **MEDIUM-3** | MEDIUM | **MEDIUM** | Cost calculation failure is non-blocking | Still open. Cost calculation errors are caught and logged but do not prevent the transaction. |
| **MEDIUM-4** | MEDIUM | **LOW** | Idempotency key is optional | `idempotencyKey` field is optional in schema. Frontend generates one, but API callers can omit it. |
| **MEDIUM-6** | MEDIUM | **LOW** | Complimentary transactions deduct stock silently | Still open. Complimentary transactions go through `process-payment` with full stock deduction. No visual indicator in inventory reports. |

---

## 3. System Architecture (Updated)

### 3.1 Data Models

```
Category 1:N Product 1:N ProductVariant
ProductVariant 1:N StockConsumption N:1 StockItem
StockConsumptionVersion (historical snapshots of StockConsumption)
Transaction (items as Json) 1:N TransactionItem
TransactionItem (relational: productId, variantId, quantity, unitCost, totalCost)
Receipt N:1 Transaction
StockAdjustment N:1 StockItem
StockAdjustment.created as audit trail for void restorations
```

### 3.2 Transaction Status Lifecycle

```
              process-payment
  [new] ──────────────────────> completed
                                    |
                                    |  POST /:id/void (ADMIN only)
                                    v
                                voided
                                  (stock restored)
```

Additional status: `complimentary` (total=0, discount>0). Only `completed` and `complimentary` can be voided. Voided transactions are excluded from analytics, closings, and consumption reports.

### 3.3 Active Payment Flow (Updated)

```
Frontend: PaymentModal.tsx
  -> PaymentContext.tsx -> handleConfirmPayment()
  -> transactionService.ts -> processPayment()
  -> POST /api/transactions/process-payment
  -> prisma.$transaction() {
       1. Idempotency key check
       2. Cost calculation (calculateTransactionCost)
       3. Collect StockConsumption records per item
       4. Create Transaction record (with cost/margin/void fields)
       5. Create TransactionItem records (normalized relational rows)
       6. Decrement StockItem.quantity (with insufficient-stock guard)
       7. Complete active OrderSession (optimistic locking)
       8. Delete Tab (if activeTabId provided)
       9. Update Table status to 'available'
     }
  -> Post-transaction: Optional receipt creation
```

### 3.4 Transaction Void Flow (NEW)

```
Frontend: TransactionHistory.tsx
  -> voidTransaction(transactionId, reason)
  -> POST /api/transactions/:id/void
  -> prisma.$transaction() {
       1. Fetch transaction, verify not already voided
       2. Parse items JSON
       3. For each item: fetch CURRENT recipe (StockConsumption)
       4. Compute restoration quantities per stock item
       5. Increment StockItem.quantity for each
       6. Create StockAdjustment record (audit trail)
       7. Update transaction: status='voided', voidedAt, voidReason, voidedBy
     }
```

---

## 4. All Inventory Write Paths

Every code path that modifies `StockItem.quantity`, verified by searching for `stockItem.*update`, `quantity.*decrement`, `quantity.*increment`, `StockItem.*quantity` across the entire backend:

| # | Path | File & Lines | Trigger | Atomic? | Sufficiency Check? | Audit Trail? |
|---|------|-------------|---------|---------|-------------------|-------------|
| A | Transaction creation | `transactions.ts:313-318` | Sale event | Yes (inside `$transaction`) | Yes (`quantity: { gte: quantity }` in `updateMany`) | Via TransactionItem |
| B | Transaction void | `transactions.ts:719-721` | Admin void | Yes (inside `$transaction`) | No upper-bound check | Yes (StockAdjustment created at lines 725-734) |
| C | Stock item PUT | `stockItems.ts:303-306` | Direct edit | No | `>=0` validated in app code only | **None** |
| D | Bulk stock level update | `stockItems.ts:169-200` | Manual API | Yes (inside `$transaction`) | Yes (pre-check + in-tx check) | Yes (StockAdjustment) |
| E | Stock adjustment POST | `stockAdjustments.ts:72-95` | Manual adjustment | Yes (inside `$transaction`) | **No** (increment can be negative, driving quantity below zero) | Yes (StockAdjustment) |
| F | Cost history update | `costHistoryService.ts:64-71` | Cost update | Yes (inside `$transaction`) | N/A (updates `standardCost`, not `quantity`) | Via CostHistory |

### Critical Analysis of Path E: Stock Adjustment POST

**File:** `backend/src/handlers/stockAdjustments.ts`, lines 72-81

```typescript
await tx.stockItem.update({
  where: { id: stockItemId },
  data: {
    quantity: {
      increment: quantity // This can be positive or negative
    }
  }
});
```

The comment on line 78 explicitly states "This can be positive or negative." There is no check that `stockItem.quantity + quantity >= 0` after the increment. A negative increment will silently drive the stock below zero.

**Contrast with Path A** (transaction creation), which uses:
```typescript
const updateResult = await tx.stockItem.updateMany({
  where: { id: stockItemId, quantity: { gte: quantity } },
  data: { quantity: { decrement: quantity } }
});
if (updateResult.count === 0) {
  throw new Error(`Insufficient stock for item ${stockItemId}`);
}
```

Path A correctly guards against negative stock. Path E does not.

---

## 5. New Findings

---

### NEW-1 (HIGH): No Database-Level Constraint Prevents Negative Stock Quantities

**File:** `backend/prisma/schema.prisma` line 254; initial migration `20251030152931_init/migration.sql`
**Severity:** HIGH
**Status:** Open

#### Evidence

The `StockItem` model defines quantity as a bare `Int` with no constraints:

```prisma
model StockItem {
  // ...
  quantity Int
  // ...
}
```

The initial migration SQL:
```sql
CREATE TABLE "stock_items" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    ...
    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);
```

No `CHECK (quantity >= 0)` constraint exists. A search across all migration SQL files for `CHECK.*quantity` returned zero results.

The application-level validation in `validateStockItemQuantity` (validation.ts:219) rejects negative values for create/update, but this only applies to the `POST /stock-items` and `PUT /stock-items/:id` endpoints. It does NOT apply to:
- Stock adjustments via `POST /stock-adjustments` (Path E above)
- Transaction void stock restoration (Path B)
- Bulk stock level updates (Path D - protected by its own in-transaction check)

The system even has a diagnostic endpoint that actively looks for negative quantities (`stockItems.ts:507-512`), confirming the developers are aware negative quantities can occur.

#### Impact

Any of the unprotected write paths can produce `StockItem.quantity < 0`. Once negative, subsequent transaction sales will still succeed (the `updateMany` with `quantity: { gte: qty }` will match rows where quantity is negative but >= qty for small values).

#### Proposed Fix

Create a new migration:

```sql
-- File: backend/prisma/migrations/YYYYMMDDHHMMSS_add_stock_quantity_check/migration.sql

ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_quantity_non_negative" CHECK ("quantity" >= 0);
```

Then apply:
```bash
cd backend && npx prisma migrate dev --name add_stock_quantity_check
```

This is a one-way migration. If negative quantities already exist, they must be corrected before applying.

---

### NEW-2 (HIGH): Transaction Void Restores Stock Using Current Recipes, Not Recipes at Time of Sale

**File:** `backend/src/handlers/transactions.ts`, lines 676-706
**Severity:** HIGH
**Status:** Open

#### Root Cause

When voiding a transaction, the handler fetches the *current* `StockConsumption` records for each sold variant:

```typescript
// Line 682-689
const product = await tx.product.findUnique({
  where: { id: item.productId },
  include: {
    variants: {
      where: { id: item.variantId },
      include: { stockConsumption: true },  // <-- CURRENT recipes
    },
  },
});
```

If a recipe has been modified between the time of sale and the time of void, the wrong quantities will be restored.

#### Example Scenario

1. **Day 1:** Espresso has recipe: Coffee Beans 10g, Water 50ml. Transaction #42 sells 1 Espresso. Stock deducted: Beans -10, Water -50.
2. **Day 3:** Manager updates Espresso recipe to: Coffee Beans 14g, Water 60ml.
3. **Day 5:** Admin voids Transaction #42. System reads *current* recipe and restores: Beans +14, Water +60.
4. **Result:** Net drift of Beans +4, Water +10 -- inventory is now permanently overstated.

#### The Fix Already Exists But Is Not Used

The `StockConsumptionVersion` model was specifically designed to store historical recipe snapshots. The `TransactionItem` model stores `unitCost` and `totalCost` at time of sale. However, the void handler does not use either of these to reconstruct the original recipe.

#### Proposed Fix

**Option A (Recommended): Snapshot recipe ingredients in TransactionItem at sale time**

Add a `recipeSnapshot` JSON field to `TransactionItem`:

```prisma
model TransactionItem {
  // ... existing fields ...
  recipeSnapshot Json? // Snapshot of StockConsumption records at time of sale
}
```

During `process-payment`, when creating `TransactionItem` records:

```typescript
// In transactions.ts, inside the TransactionItem create loop (around line 296-308):
recipeSnapshot: itemConsumptions.map(sc => ({
  stockItemId: sc.stockItemId,
  stockItemName: sc.stockItemName,
  quantity: sc.quantity,
})),
```

During void, use the snapshot instead of fetching current recipes:

```typescript
// Replace lines 676-706 with:
for (const item of items) {
  if (!item.productId || !item.variantId) continue;

  // Fetch the TransactionItem to get the recipe snapshot
  const transactionItem = await tx.transactionItem.findFirst({
    where: {
      transactionId: Number(id),
      variantId: item.variantId,
      productId: item.productId,
    },
  });

  if (transactionItem?.recipeSnapshot) {
    const snapshot = transactionItem.recipeSnapshot as Array<{
      stockItemId: string;
      quantity: number;
    }>;
    for (const sc of snapshot) {
      const current = restorations.get(sc.stockItemId);
      const restorationQty = sc.quantity * item.quantity;
      if (current) {
        current.quantity += restorationQty;
      } else {
        restorations.set(sc.stockItemId, { name: '', quantity: restorationQty });
      }
    }
  } else {
    // Fallback to current recipe if no snapshot exists (for pre-migration transactions)
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      include: {
        variants: {
          where: { id: item.variantId },
          include: { stockConsumption: true },
        },
      },
    });

    if (product && product.variants[0]) {
      for (const sc of product.variants[0].stockConsumption) {
        const current = restorations.get(sc.stockItemId);
        const restorationQty = sc.quantity * item.quantity;
        if (current) {
          current.quantity += restorationQty;
        } else {
          restorations.set(sc.stockItemId, { name: '', quantity: restorationQty });
        }
      }
    }
  }
}
```

**Option B: Query StockConsumptionVersion by timestamp**

Use the `StockConsumptionVersion` table to find the recipe that was active at the time of the transaction:

```typescript
// For each item in the voided transaction:
const versions = await tx.stockConsumptionVersion.findMany({
  where: {
    variantId: item.variantId,
    replacedAt: { lte: transaction.createdAt },
  },
  orderBy: { replacedAt: 'desc' },
});
```

This is less reliable because versions are only created on replacement, not on every transaction.

---

### NEW-3 (HIGH): Stock Adjustment Endpoint Can Drive Quantity Below Zero

**File:** `backend/src/handlers/stockAdjustments.ts`, lines 72-81
**Severity:** HIGH
**Status:** Open

#### Evidence

The `POST /stock-adjustments` endpoint uses `increment` which accepts both positive and negative values:

```typescript
await tx.stockItem.update({
  where: { id: stockItemId },
  data: {
    quantity: {
      increment: quantity // Can be negative, no lower-bound check
    }
  }
});
```

There is no validation that `stockItem.quantity + quantity >= 0`.

#### Proposed Fix

Add a sufficiency check inside the transaction:

```typescript
// In stockAdjustments.ts, replace lines 72-81 with:
const stockAdjustment = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
  const currentItem = await tx.stockItem.findUnique({
    where: { id: stockItemId },
  });

  if (!currentItem) {
    throw new Error('Stock item not found');
  }

  const newQuantity = currentItem.quantity + quantity;
  if (newQuantity < 0) {
    throw new Error(
      `Insufficient stock: ${itemName} has ${currentItem.quantity} units, cannot adjust by ${quantity}`
    );
  }

  await tx.stockItem.update({
    where: { id: stockItemId },
    data: {
      quantity: newQuantity,
    },
  });

  return tx.stockAdjustment.create({
    data: {
      stockItemId,
      itemName,
      quantity,
      reason,
      userId,
      userName,
      createdAt: new Date(),
    },
  });
});
```

---

### NEW-4 (MEDIUM): Inconsistent Transaction Status Filtering Across Analytics

**Files:** `analyticsService.ts`, `dailyClosingService.ts`, `consumptionReports.ts`
**Severity:** MEDIUM
**Status:** Open

#### Evidence

Different modules filter transaction statuses inconsistently:

| Module | Filter | What It Includes |
|--------|--------|-----------------|
| `aggregateProductPerformance` | `{ not: 'voided' }` | `completed`, `complimentary`, `pending`, any future status |
| `aggregateHourlySales` | `{ not: 'voided' }` | `completed`, `complimentary`, `pending`, any future status |
| `getProfitSummary` | `status: 'completed'` | Only `completed` |
| `getMarginByCategory` | `status: 'completed'` | Only `completed` |
| `getMarginByProduct` | `status: 'completed'` | Only `completed` |
| `getMarginTrend` | `status: 'completed'` | Only `completed` |
| `dailyClosingService` | `{ not: 'voided' }` | `completed`, `complimentary`, `pending`, any future status |
| `consumptionReports` | `{ not: 'voided' }` | `completed`, `complimentary`, `pending`, any future status |
| `varianceService` | `status: 'completed'` | Only `completed` |

The `{ not: 'voided' }` approach is fragile. If a `pending` status is ever introduced (or any other non-terminal status), those transactions would be incorrectly included in revenue, hourly sales, daily closings, and consumption reports. The profit analytics and variance service correctly use a positive allowlist (`status: 'completed'`), but even these exclude `complimentary` transactions.

#### Proposed Fix

Define a shared constant for valid reportable statuses and use it everywhere:

```typescript
// In a shared file, e.g., backend/src/constants/transactionStatuses.ts
export const REPORTABLE_STATUSES = ['completed', 'complimentary'] as const;
export const PROFIT_STATUSES = ['completed'] as const;

// Prisma where clause helper:
export const reportableWhere = () => ({
  status: { in: REPORTABLE_STATUSES },
});
```

Then replace all instances of `{ not: 'voided' }` with `{ in: ['completed', 'complimentary'] }` in:
- `analyticsService.ts` lines 111, 356
- `dailyClosingService.ts` lines 46-47
- `consumptionReports.ts` line 39

---

### NEW-5 (MEDIUM): Items With No Recipe Are Sold Silently (Reclassified from CRITICAL-3)

**File:** `backend/src/handlers/transactions.ts`, lines 254-268
**Severity:** MEDIUM
**Status:** Open (by design, but lacks guardrails)

#### Evidence

During `process-payment`, the stock consumption collection loop:

```typescript
// Lines 254-268
for (const item of items) {
  if (item.variantId) {
    const variantConsumptions = await tx.stockConsumption.findMany({
      where: { variantId: item.variantId },
      include: { stockItem: true },
    });
    for (const consumption of variantConsumptions) {
      // ... accumulate consumptions
    }
  }
}
```

If a variant has zero `StockConsumption` records, the loop body simply does nothing for that item. The sale completes successfully with no inventory deduction. The `TransactionItem` is still created, but `unitCost` and `totalCost` will be `null`.

The `validate-integrity` endpoint (`stockItems.ts:516-526`) reports variants without consumption records, but this is diagnostic-only and not enforced at sale time.

#### Proposed Fix

Add a warning or validation during payment processing:

```typescript
// After the stock consumption collection loop (around line 268):
const itemsWithoutRecipes = items.filter(item => {
  if (!item.variantId) return true;
  return !consumptions.has(item.variantId);
});

if (itemsWithoutRecipes.length > 0) {
  // Option A: Log a warning (non-blocking)
  logWarn('Transaction includes items without recipes', {
    transactionId: newTransaction.id,
    items: itemsWithoutRecipes.map(i => ({ productId: i.productId, variantId: i.variantId })),
  });

  // Option B: Block the transaction (strict mode)
  // throw new Error(`Cannot complete sale: items missing recipes: ${itemsWithoutRecipes.map(i => i.name).join(', ')}`);
}
```

---

### NEW-6 (MEDIUM): Cost Calculation Failure Is Non-Blocking (Reclassified from MEDIUM-3)

**File:** `backend/src/handlers/transactions.ts`, lines 213-229
**Severity:** MEDIUM
**Status:** Open

#### Evidence

```typescript
// Lines 213-229
let costResult: TransactionCostResult | null = null;
try {
  costResult = await calculateTransactionCost(costItems);
} catch (costError) {
  logError('Cost calculation failed during payment processing', {
    error: costError instanceof Error ? costError.message : String(costError),
    correlationId: (req as any).correlationId,
  });
}
```

If cost calculation fails, the transaction proceeds without cost data. `totalCost`, `grossMargin`, and `marginPercent` will all be `null`. This means profit reports will have gaps.

This is likely intentional (to not block sales), but it should be documented and monitored. The `costCoveragePercent` metric in `getProfitSummary` already tracks this.

#### Proposed Fix

No code change required. Add monitoring/alerting when `costCoveragePercent` drops below a threshold. This is a documentation/ops concern.

---

### NEW-7 (MEDIUM): Receipt Void Is Decoupled From Transaction Void

**Files:** `receiptService.ts:387-430`, `receiptHandler.ts:355-410`
**Severity:** MEDIUM
**Status:** Open (likely by design)

#### Evidence

- Voiding a **transaction** restores stock and marks the transaction as `voided`. The associated receipt status is unchanged.
- Voiding a **receipt** changes the receipt status to `voided`. The underlying transaction status and stock are unchanged.

There is no cross-status synchronization between receipts and transactions. This means:
1. A transaction can be voided (stock restored) while its receipt remains in `issued` status.
2. A receipt can be voided while the transaction remains `completed`.

For fiscal compliance in many jurisdictions, voiding a transaction should automatically void associated receipts. The reverse (voiding a receipt should prompt consideration of voiding the transaction) is less clear-cut.

#### Proposed Fix

When voiding a transaction, also void associated receipts:

```typescript
// In transactions.ts void handler, after line 747 (status update):
// Also void all associated receipts
const associatedReceipts = await tx.receipt.findMany({
  where: { transactionId: Number(id), status: { not: 'voided' } },
});

for (const receipt of associatedReceipts) {
  await tx.receipt.update({
    where: { id: receipt.id },
    data: {
      status: 'voided',
      voidedAt: new Date(),
      voidReason: `Automatically voided: transaction #${id} voided - ${reason.trim()}`,
      voidedBy: authenticatedUserId,
    },
  });
}
```

---

### NEW-8 (LOW): Direct Stock Item PUT Sets Quantity Without Audit Trail

**File:** `backend/src/handlers/stockItems.ts`, lines 280-306
**Severity:** LOW
**Status:** Open

#### Evidence

The `PUT /stock-items/:id` endpoint allows directly setting `quantity` to any non-negative value:

```typescript
if (quantity !== undefined) updateData.quantity = quantity;

const stockItem = await prisma.stockItem.update({
  where: { id },
  data: updateData,
});
```

No `StockAdjustment` record is created when the quantity changes. There is no audit trail of who changed the quantity, when, or why. This is the only quantity-modifying path that does not create an adjustment record.

#### Proposed Fix

When `quantity` changes via PUT, create a StockAdjustment record:

```typescript
// After the stockItem.update(), if quantity changed:
if (quantity !== undefined && existingStockItem && quantity !== existingStockItem.quantity) {
  const delta = quantity - existingStockItem.quantity;
  await prisma.stockAdjustment.create({
    data: {
      stockItemId: id,
      itemName: existingStockItem.name,
      quantity: delta,
      reason: `Direct quantity edit: ${existingStockItem.quantity} -> ${quantity}`,
      userId: req.user!.id,
      userName: req.user!.username,
    },
  });
}
```

This requires fetching the current stock item before the update.

---

### NEW-9 (LOW): Frontend `updateStockLevels` Remains Dead Code

**File:** `frontend/services/inventoryService.ts`, lines 64-101
**Severity:** LOW
**Status:** Open

#### Evidence

`updateStockLevels()` is exported from `inventoryService.ts` and re-exported from `apiService.ts` line 59. However, a search of the entire frontend codebase shows zero components or contexts that call this function.

The backend endpoint `PUT /stock-items/update-levels` is functional and now properly requires a reason and creates adjustment records. But since no frontend code calls it, it is effectively dead code exposed as an API endpoint.

#### Proposed Fix

Either:
- Build a UI for bulk stock updates that uses this endpoint, or
- Remove the frontend function and consider deprecating the backend endpoint.

---

### NEW-10 (LOW): Idempotency Key Is Optional (Reclassified from MEDIUM-4)

**File:** `backend/prisma/schema.prisma` line 155
**Severity:** LOW
**Status:** Open

#### Evidence

```prisma
idempotencyKey String? @unique
```

The frontend always generates an idempotency key. However, the API does not require it. Direct API callers can omit the key, bypassing duplicate-transaction protection.

This is low severity because the frontend is the only client and always provides a key. But for API robustness, consider making it required.

#### Proposed Fix

Add validation at the top of the `process-payment` handler:

```typescript
if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
  return res.status(400).json({ error: 'idempotencyKey is required' });
}
```

---

### NEW-11 (LOW): Transaction Void Items Without productId/variantId Are Skipped Silently

**File:** `backend/src/handlers/transactions.ts`, line 680
**Severity:** LOW
**Status:** Open

#### Evidence

In the void handler:

```typescript
for (const item of items) {
  if (!item.productId || !item.variantId) continue;
  // ...
}
```

Items without `productId` or `variantId` are silently skipped. If such items were somehow recorded in a transaction (e.g., custom/manual items), their stock would have been deducted at sale time but not restored on void.

This is unlikely in practice because the `process-payment` handler requires variant IDs for stock deduction. But for robustness, a warning should be logged.

---

## 6. Complete File Audit Matrix

| File | Lines | Inventory Impact | Issues Found |
|------|-------|-----------------|-------------|
| `prisma/schema.prisma` | 765 | Defines all models | No CHECK constraint on stock quantity |
| `transactions.ts` | 798 | Primary: creates transactions, decrements stock, voids with restoration | NEW-2 (recipe drift on void), NEW-11 (skipped items) |
| `stockItems.ts` | 556 | Secondary: CRUD, bulk update, integrity checks | NEW-8 (no audit trail on PUT) |
| `stockAdjustments.ts` | 263 | Secondary: manual adjustments | NEW-3 (can go negative) |
| `products.ts` | 547 | Indirect: recipe management | Recipe versioning implemented correctly |
| `consumptionReports.ts` | 188 | Read-only: reports consumption | NEW-4 (status filter inconsistency) |
| `costCalculationService.ts` | 241 | Read-only: calculates costs | Works correctly, non-blocking on failure |
| `dailyClosingService.ts` | 151 | Read-only: daily summaries | NEW-4 (status filter inconsistency) |
| `analyticsService.ts` | 1018 | Read-only: product performance, hourly, profit | NEW-4 (status filter inconsistency) |
| `varianceService.ts` | ~320 | Read-only: variance reports | Correctly uses `status: 'completed'` |
| `receiptService.ts` | ~430 | Receipt lifecycle only | NEW-7 (decoupled from transaction void) |
| `transactionService.ts` (frontend) | 200 | Calls process-payment, void | Dead `updateStockLevels` reference removed |
| `inventoryService.ts` (frontend) | 136 | Stock management UI calls | NEW-9 (dead `updateStockLevels`) |

---

## 7. Proposed Fixes With Exact Code

### Fix Priority Matrix

| Priority | Finding ID | Title | Effort |
|----------|-----------|-------|--------|
| 1 | NEW-1 | Add DB CHECK constraint for non-negative stock | Small (1 migration) |
| 2 | NEW-3 | Add sufficiency check in stock adjustment POST | Small (5 lines) |
| 3 | NEW-2 | Snapshot recipes at sale time for void restoration | Medium (new field + migration + logic) |
| 4 | NEW-4 | Standardize status filtering across all modules | Small (constant + find-replace) |
| 5 | NEW-7 | Auto-void receipts on transaction void | Small (5 lines in void handler) |
| 6 | NEW-5 | Log warning for items without recipes | Small (3 lines) |
| 7 | NEW-8 | Add audit trail to stock item PUT | Small (10 lines) |
| 8 | NEW-10 | Make idempotency key required | Small (3 lines) |
| 9 | NEW-9 | Remove or use dead `updateStockLevels` | Small (cleanup) |
| 10 | NEW-11 | Log warning for skipped void items | Small (2 lines) |
| 11 | NEW-6 | Monitor cost calculation coverage | Ops concern |

---

### Fix 1: Database CHECK Constraint (NEW-1)

```sql
-- File: backend/prisma/migrations/YYYYMMDDHHMMSS_add_stock_quantity_check/migration.sql

-- First, correct any existing negative quantities
UPDATE "stock_items" SET "quantity" = 0 WHERE "quantity" < 0;

-- Add the constraint
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_quantity_non_negative"
  CHECK ("quantity" >= 0);
```

```bash
cd backend
npx prisma migrate dev --name add_stock_quantity_check
```

---

### Fix 2: Stock Adjustment Sufficiency Check (NEW-3)

**File:** `backend/src/handlers/stockAdjustments.ts`

Replace lines 72-95:

```typescript
const stockAdjustment = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
  const currentItem = await tx.stockItem.findUnique({
    where: { id: stockItemId },
  });

  if (!currentItem) {
    throw new Error('NOT_FOUND');
  }

  const newQuantity = currentItem.quantity + quantity;
  if (newQuantity < 0) {
    throw new Error(
      `INSUFFICIENT_STOCK:${itemName}:${currentItem.quantity}:${quantity}`
    );
  }

  await tx.stockItem.update({
    where: { id: stockItemId },
    data: {
      quantity: newQuantity,
    },
  });

  return tx.stockAdjustment.create({
    data: {
      stockItemId,
      itemName,
      quantity,
      reason,
      userId,
      userName,
      createdAt: new Date(),
    },
  });
});
```

Update the error handler to catch these specific errors:

```typescript
} catch (error) {
  if (error instanceof Error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Stock item not found' });
    }
    if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
      const parts = error.message.split(':');
      return res.status(400).json({
        error: `Insufficient stock for ${parts[1]}: available ${parts[2]}, cannot adjust by ${parts[3]}`
      });
    }
  }
  logError(error instanceof Error ? error : 'Error creating stock adjustment', {
    correlationId: (req as any).correlationId,
  });
  res.status(500).json({ error: i18n.t('errors:stockAdjustments.createFailed') });
}
```

---

### Fix 3: Recipe Snapshot for Void Restoration (NEW-2)

**Step 1:** Add `recipeSnapshot` field to `TransactionItem` in `schema.prisma`:

```prisma
model TransactionItem {
  id              Int      @id @default(autoincrement())
  transactionId   Int
  transaction     Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  productId       Int
  variantId       Int
  productName     String
  variantName     String
  price           Decimal  @db.Decimal(10, 2)
  quantity        Int
  effectiveTaxRate Decimal? @db.Decimal(10, 4)
  unitCost        Decimal? @db.Decimal(10, 4)
  totalCost       Decimal? @db.Decimal(10, 4)
  recipeSnapshot  Json?    // <-- NEW: [{ stockItemId, stockItemName, quantity }]

  @@index([transactionId])
  @@index([variantId])
  @@index([productId])
  @@map("transaction_items")
}
```

**Step 2:** Create migration:

```bash
cd backend && npx prisma migrate dev --name add_recipe_snapshot_to_transaction_items
```

**Step 3:** Populate `recipeSnapshot` during `process-payment` in `transactions.ts`.

In the TransactionItem creation block (around line 296-308), capture the recipe:

```typescript
const itemConsumptions = await tx.stockConsumption.findMany({
  where: { variantId: item.variantId },
  include: { stockItem: { select: { id: true, name: true } } },
});

const recipeSnapshot = itemConsumptions.map(sc => ({
  stockItemId: sc.stockItemId,
  stockItemName: sc.stockItem.name,
  quantity: sc.quantity,
}));

// Inside the TransactionItem create:
{
  data: {
    transactionId: newTransaction.id,
    productId: item.productId,
    variantId: item.variantId!,
    productName: item.name,
    variantName: item.variantName || '',
    price: item.price,
    quantity: item.quantity,
    effectiveTaxRate: item.effectiveTaxRate
      ? new Prisma.Decimal(item.effectiveTaxRate)
      : null,
    unitCost: itemCostResult?.unitCost
      ? new Prisma.Decimal(itemCostResult.unitCost)
      : null,
    totalCost: itemCostResult?.totalCost
      ? new Prisma.Decimal(itemCostResult.totalCost)
      : null,
    recipeSnapshot: recipeSnapshot.length > 0 ? recipeSnapshot : null,
  },
}
```

**Step 4:** Update void handler to use the snapshot. Replace lines 676-706:

```typescript
for (const item of items) {
  if (!item.productId || !item.variantId) continue;

  // Try to find the TransactionItem with recipe snapshot
  const transactionItem = await tx.transactionItem.findFirst({
    where: {
      transactionId: Number(id),
      variantId: item.variantId,
      productId: item.productId,
    },
  });

  if (transactionItem?.recipeSnapshot && Array.isArray(transactionItem.recipeSnapshot)) {
    // Use the snapshotted recipe from time of sale
    const snapshot = transactionItem.recipeSnapshot as Array<{
      stockItemId: string;
      quantity: number;
    }>;
    for (const sc of snapshot) {
      const current = restorations.get(sc.stockItemId);
      const restorationQty = sc.quantity * item.quantity;
      if (current) {
        current.quantity += restorationQty;
      } else {
        restorations.set(sc.stockItemId, { name: '', quantity: restorationQty });
      }
    }
  } else {
    // Fallback: use current recipe (for pre-migration transactions)
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      include: {
        variants: {
          where: { id: item.variantId },
          include: { stockConsumption: true },
        },
      },
    });

    if (product && product.variants[0]) {
      for (const sc of product.variants[0].stockConsumption) {
        const current = restorations.get(sc.stockItemId);
        const restorationQty = sc.quantity * item.quantity;
        if (current) {
          current.quantity += restorationQty;
        } else {
          restorations.set(sc.stockItemId, { name: '', quantity: restorationQty });
        }
      }
    }
  }
}
```

---

### Fix 4: Standardize Status Filtering (NEW-4)

**File:** Create `backend/src/constants/transactionStatuses.ts`:

```typescript
export const REPORTABLE_STATUSES = ['completed', 'complimentary'] as const;
export const PROFIT_REPORTABLE_STATUSES = ['completed'] as const;
```

**Then replace in these files:**

`analyticsService.ts` line 111:
```typescript
// Before:
whereClause.status = { not: 'voided' };
// After:
whereClause.status = { in: REPORTABLE_STATUSES };
```

`analyticsService.ts` line 356:
```typescript
// Before:
status: { not: 'voided' },
// After:
status: { in: REPORTABLE_STATUSES },
```

`dailyClosingService.ts` lines 46-47:
```typescript
// Before:
status: { not: 'voided' }
// After:
status: { in: REPORTABLE_STATUSES }
```

`consumptionReports.ts` line 39:
```typescript
// Before:
transactionWhere.status = { not: 'voided' };
// After:
transactionWhere.status = { in: REPORTABLE_STATUSES };
```

---

### Fix 5: Auto-Void Receipts on Transaction Void (NEW-7)

**File:** `backend/src/handlers/transactions.ts`

After line 747 (the transaction status update), add:

```typescript
// Auto-void all associated non-voided receipts
const associatedReceipts = await tx.receipt.findMany({
  where: {
    transactionId: Number(id),
    status: { not: 'voided' },
  },
});

for (const receipt of associatedReceipts) {
  await tx.receipt.update({
    where: { id: receipt.id },
    data: {
      status: 'voided',
      voidedAt: new Date(),
      voidReason: `Auto-voided: transaction #${id} voided - ${reason.trim()}`,
      voidedBy: authenticatedUserId,
      version: { increment: 1 },
    },
  });
}
```

---

### Fix 6: Audit Trail on Direct Stock Item PUT (NEW-8)

**File:** `backend/src/handlers/stockItems.ts`

Before the `prisma.stockItem.update()` call (around line 303), fetch the current state:

```typescript
const existingStockItem = await prisma.stockItem.findUnique({
  where: { id },
});

if (!existingStockItem) {
  return res.status(404).json({ error: i18n.t('errors:stockItems.notFound') });
}

const stockItem = await prisma.stockItem.update({
  where: { id },
  data: updateData,
});

// Create audit trail if quantity changed
if (quantity !== undefined && quantity !== existingStockItem.quantity) {
  const delta = quantity - existingStockItem.quantity;
  await prisma.stockAdjustment.create({
    data: {
      stockItemId: id,
      itemName: existingStockItem.name,
      quantity: delta,
      reason: `Direct quantity edit: ${existingStockItem.quantity} -> ${quantity}`,
      userId: req.user!.id,
      userName: req.user!.username,
    },
  });
}
```

---

### Fix 7: Make Idempotency Key Required (NEW-10)

**File:** `backend/src/handlers/transactions.ts`

At the top of the `process-payment` handler (around line 64), add:

```typescript
const { idempotencyKey } = req.body;

if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.trim() === '') {
  return res.status(400).json({ error: 'idempotencyKey is required' });
}
```

---

## Appendix A: Transaction Status Filtering Reference

The following table shows every location that queries transactions and the filter used, for future reference:

| File | Line | Filter | Correct? |
|------|------|--------|----------|
| `transactions.ts` GET / | 432 | `status: req.query.status` (optional filter) | Yes (user-facing list) |
| `transactions.ts` GET /:id | 604 | None (fetch by ID) | Yes (single record) |
| `transactions.ts` POST /:id/void | 654 | None (fetch by ID) | Yes (needs any status to check) |
| `analyticsService.ts` | 111 | `{ not: 'voided' }` | **No** - use `{ in: REPORTABLE_STATUSES }` |
| `analyticsService.ts` | 349 | `{ not: 'voided' }` | **No** - use `{ in: REPORTABLE_STATUSES }` |
| `analyticsService.ts` | 637 | `'completed'` | Yes |
| `analyticsService.ts` | 735 | `'completed'` | Yes |
| `analyticsService.ts` | 828 | `'completed'` | Yes |
| `analyticsService.ts` | 963 | `'completed'` | Yes |
| `dailyClosingService.ts` | 46 | `{ not: 'voided' }` | **No** - use `{ in: REPORTABLE_STATUSES }` |
| `consumptionReports.ts` | 39 | `{ not: 'voided' }` | **No** - use `{ in: REPORTABLE_STATUSES }` |
| `varianceService.ts` | 227 | `'completed'` | Yes |

## Appendix B: Inventory Deduction Verification Flow

The following pseudocode describes the complete flow from "user clicks Pay" to "stock is deducted":

```
1. Frontend: PaymentModal -> processPayment(data)
2. POST /api/transactions/process-payment
3. Inside prisma.$transaction():
   a. Check idempotency key uniqueness
   b. For each order item:
      - Fetch StockConsumption records where variantId = item.variantId
      - Accumulate (stockItemId, totalQuantity) in a Map
   c. For each (stockItemId, quantity) in Map:
      - UPDATE stock_items SET quantity = quantity - ? WHERE id = ? AND quantity >= ?
      - If rowCount === 0: THROW insufficient stock error (ROLLBACK)
   d. INSERT INTO transactions (items, totals, cost fields)
   e. INSERT INTO transaction_items (one per order line)
   f. UPDATE order_sessions SET status='completed'
   g. DELETE tabs WHERE id = activeTabId
   h. UPDATE tables SET status='available'
4. IF transaction commits:
   - Return transaction to frontend
   - Optionally trigger receipt creation
5. IF transaction rolls back:
   - Return error to frontend
   - No stock was deducted (atomic rollback)
```

---

*End of Report INV-AUDIT-2026-002*
