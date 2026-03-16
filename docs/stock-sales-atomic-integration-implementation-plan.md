# Stock-Sales Atomic Integration Implementation Plan

## Document Information

| Attribute | Value |
|-----------|-------|
| **Document Version** | 1.0 |
| **Created** | 2026-03-16 |
| **Author** | Technical Documentation |
| **Status** | Ready for Implementation |

---

## Executive Summary

### Current State

Atomic transactions for stock deduction are **already implemented** in the codebase. The implementation can be found in:

- **File:** [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:309-378)
- **Key Features:**
  - Prisma `$transaction` wrapper for atomicity (line 311)
  - Optimistic locking using `version` field on StockItem (line 337-354)
  - Retry logic for deadlock handling (lines 18-53, 310)
  - Error handling for `INSUFFICIENT_STOCK` and `VERSION_CONFLICT` (lines 400-414)

### Problem Statement

Currently, there is **no explicit way to mark products that should NOT track inventory**. This creates issues for:

- **Entry fees** - One-time payments that don't consume physical inventory
- **Digital products** - Items like digital downloads or services
- **Special events** - Products sold without stock consumption

Without a `trackInventory` flag, all products with stock consumption defined will always deduct stock, even when they shouldn't.

### Solution Overview

This implementation plan addresses three key enhancements:

1. **Add `trackInventory` flag** to ProductVariant - Allow products to opt-out of inventory tracking
2. **Verify atomic transaction implementation** - Ensure existing code handles all edge cases correctly
3. **Add reconciliation logging** - Create audit trail for failed stock operations

---

## Three Major Components to Implement

### Component 1: Add trackInventory Flag to ProductVariant

#### 1.1 Database Schema Changes

**File:** [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:57-75)

**Current ProductVariant model:**
```prisma
model ProductVariant {
  id               Int                @id @default(autoincrement())
  productId        Int
  name             String
  price            Float
  costPrice        Decimal?           @db.Decimal(10, 4)
  isFavourite      Boolean?           @default(false)
  backgroundColor  String
  textColor        String
  taxRateId        Int?
  product          Product            @relation(fields: [productId], references: [id])
  taxRate          TaxRate?           @relation(fields: [taxRateId], references: [id], onDelete: SetNull)
  stockConsumption StockConsumption[]
  variantLayouts   VariantLayout[]
  sharedLayoutPositions SharedLayoutPosition[]

  @@index([taxRateId])
  @@map("product_variants")
}
```

**Modified ProductVariant model:**
```prisma
model ProductVariant {
  id               Int                @id @default(autoincrement())
  productId        Int
  name             String
  price            Float
  costPrice        Decimal?           @db.Decimal(10, 4)
  isFavourite      Boolean?           @default(false)
  trackInventory   Boolean            @default(true)  // NEW FIELD
  backgroundColor  String
  textColor        String
  taxRateId        Int?
  product          Product            @relation(fields: [productId], references: [id])
  taxRate          TaxRate?           @relation(fields: [taxRateId], references: [id], onDelete: SetNull)
  stockConsumption StockConsumption[]
  variantLayouts   VariantLayout[]
  sharedLayoutPositions SharedLayoutPosition[]

  @@index([taxRateId])
  @@map("product_variants")
}
```

#### 1.2 Migration File

**File:** `backend/prisma/migrations/YYYYMMDDHHMMSS_add_track_inventory_flag/migration.sql`

```sql
-- Add trackInventory column to product_variants table
ALTER TABLE "product_variants" ADD COLUMN "trackInventory" BOOLEAN NOT NULL DEFAULT true;

-- Create index for trackInventory queries (useful for filtering products)
CREATE INDEX "product_variants_track_inventory_idx" ON "product_variants" ("trackInventory");
```

**Generate migration command:**
```bash
cd backend
npx prisma migrate dev --name add_track_inventory_flag
```

#### 1.3 Backend API Updates

**File:** [`backend/src/handlers/products.ts`](backend/src/handlers/products.ts:1-536)

**Changes required in:**

1. **GET /api/products** (lines 42-68) - Include `trackInventory` in response:
```typescript
// In formatProductVariant function (line 15)
function formatProductVariant(variant: any) {
  return {
    id: variant.id,
    productId: variant.productId,
    name: variant.name,
    price: Number(variant.price),
    costPrice: variant.costPrice !== null ? Number(variant.costPrice) : null,
    isFavourite: variant.isFavourite,
    trackInventory: variant.trackInventory !== false,  // NEW: Default to true
    backgroundColor: variant.backgroundColor,
    textColor: variant.textColor,
    stockConsumption: variant.stockConsumption || [],
    taxRateId: variant.taxRateId,
    // ... rest of fields
  };
}
```

2. **POST /api/products** (lines 106-247) - Accept `trackInventory` in creation:
```typescript
// In variant creation (around line 207)
variants: {
  create: variants.map(v => ({
    name: v.name,
    price: v.price,
    costPrice: (v as any).costPrice !== undefined ? (v as any).costPrice : null,
    isFavourite: v.isFavourite || false,
    trackInventory: (v as any).trackInventory !== false,  // NEW
    backgroundColor: v.backgroundColor,
    textColor: v.textColor,
    taxRateId: (v as any).taxRateId || null,
    stockConsumption: {
      create: v.stockConsumption.map((sc: { stockItemId: string; quantity: number }) => ({
        stockItemId: sc.stockItemId,
        quantity: sc.quantity
      }))
    }
  }))
}
```

3. **PUT /api/products/:id** (lines 250-465) - Handle `trackInventory` updates:
```typescript
// In variant update (around line 419)
variants: {
  create: variants.map(v => ({
    name: v.name,
    price: v.price,
    costPrice: (v as any).costPrice !== undefined ? (v as any).costPrice : null,
    isFavourite: v.isFavourite || false,
    trackInventory: (v as any).trackInventory !== false,  // NEW
    backgroundColor: v.backgroundColor,
    textColor: v.textColor,
    taxRateId: (v as any).taxRateId || null,
    stockConsumption: {
      create: v.stockConsumption.map((sc) => ({
        stockItemId: sc.stockItemId,
        quantity: sc.quantity
      }))
    }
  }))
}
```

#### 1.4 Transaction Handler Update

**File:** [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:309-378)

**Modify stock deduction logic to check `trackInventory`:**

The frontend already builds stock deductions from order items. We need to modify the logic to check if the variant has `trackInventory = true`. This can be done in two places:

**Option A: Backend checks trackInventory (Recommended)**

The frontend already knows which variants have `trackInventory = true`. Filter before sending:

The frontend already knows which variants have `trackInventory = true`. Filter before sending:

```typescript
// In frontend/contexts/PaymentContext.tsx
orderItems.forEach(item => {
  const product = appData.products.find(p => p.id === item.productId);
  const variant = product?.variants.find(v => v.id === item.variantId);
  
  // Only process stock consumption if variant tracks inventory
  if (variant && variant.trackInventory !== false) {
    variant.stockConsumption.forEach(sc => {
      // ... existing logic
    });
  }
});
```

**Recommendation:** Implement Option B (frontend filtering) for simplicity, as it reduces backend complexity and keeps the logic where product metadata is already available.

#### 1.5 Frontend Updates

**File:** [`frontend/components/ProductManagement.tsx`](frontend/components/ProductManagement.tsx:1-536)

**Add toggle for inventory tracking in VariantForm:**

```typescript
// In VariantForm component, around line 103-110 (after isFavourite checkbox)
<div className="flex items-center gap-2">
  <input
    type="checkbox"
    checked={variant.trackInventory !== false}
    onChange={(e) => onUpdate({ ...variant, trackInventory: e.target.checked })}
    className="h-4 w-4 rounded text-blue-500 bg-slate-800 border-slate-600 focus:ring-blue-500"
  />
  <span className="text-sm font-medium text-slate-400">
    {t('products.trackInventory')}
  </span>
</div>
```

**Add translation keys:**

**File:** `frontend/public/locales/en/common.json`
```json
{
  "products": {
    "trackInventory": "Track inventory",
    "trackInventoryDescription": "When enabled, stock will be automatically deducted when this product is sold"
  }
}
```

**File:** `frontend/public/locales/it/common.json`
```json
{
  "products": {
    "trackInventory": "Traccia inventario",
    "trackInventoryDescription": "Se abilitato, le scorte verranno automaticamente detratte alla vendita"
  }
}
```

---

### Component 2: Verify Existing Atomic Transaction

#### 2.1 Review Current Implementation

**File:** [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:309-378)

The current implementation includes:

1. **Retry Helper** (lines 18-53):
   - Handles Prisma P2034 (deadlock) errors
   - Exponential backoff with jitter
   - Maximum 3 retries

2. **Transaction Wrapper** (lines 310-378):
   - Uses `prisma.$transaction` for atomicity
   - Processes stock deductions before transaction creation
   - Uses optimistic locking with version field

3. **Optimistic Locking** (lines 336-354):
   - Fetches current stock item with version
   - Updates only if version matches
   - Throws `VERSION_CONFLICT` if update count is 0

4. **Error Handling** (lines 400-414):
   - `INSUFFICIENT_STOCK`: Returns 400
   - `VERSION_CONFLICT`: Returns 409

#### 2.2 Verification Checklist

| # | Checkpoint | Location | Status |
|---|------------|----------|--------|
| 1 | Version field exists on StockItem | schema.prisma:180 | [ ] |
| 2 | Transaction uses $transaction | transactions.ts:311 | [ ] |
| 3 | Optimistic locking implemented | transactions.ts:336-354 | [ ] |
| 4 | Retry logic for deadlocks | transactions.ts:18-53, 310 | [ ] |
| 5 | INSUFFICIENT_STOCK handling | transactions.ts:330-334, 400-406 | [ ] |
| 6 | VERSION_CONFLICT handling | transactions.ts:350-354, 408-414 | [ ] |

#### 2.3 Test Scenarios to Verify

**Test 2.3.1: Transaction succeeds when stock available**

```
Prerequisites:
- StockItem.quantity = 100
- StockItem.version = 0

Action:
- Create transaction requiring 10 units

Expected:
- Transaction created successfully
- StockItem.quantity = 90
- StockItem.version = 1
```

**Test 2.3.2: Transaction fails when insufficient stock**

```
Prerequisites:
- StockItem.quantity = 5

Action:
- Create transaction requiring 10 units

Expected:
- HTTP 400 response
- Error: "Insufficient stock"
- StockItem.quantity = 5 (unchanged)
- No transaction created
```

**Test 2.3.3: Transaction fails with version conflict (race condition)**

```
Prerequisites:
- StockItem.quantity = 10
- StockItem.version = 0

Action:
- Simulate concurrent transactions:
  1. Transaction A reads version 0
  2. Transaction B reads version 0
  3. Transaction A updates (version becomes 1)
  4. Transaction B tries to update with version 0

Expected:
- First transaction succeeds
- Second transaction fails with HTTP 409
- Error: "Concurrent modification detected"
```

**Test 2.3.4: Products without stock consumption work correctly**

```
Prerequisites:
- Product has no stockConsumption defined

Action:
- Create transaction for this product

Expected:
- Transaction created successfully
- No stock deduction attempted
```

#### 2.4 Optional Enhancement: SERIALIZABLE Isolation

For extra safety in high-contention scenarios, consider adding SERIALIZABLE isolation level:

```typescript
// In transactions.ts, around line 311
return await prisma.$transaction(
  async (tx) => {
    // Transaction logic here
  },
  {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable  // Optional: for extra safety
  }
);
```

**Note:** This is optional and may impact performance. The current optimistic locking approach is sufficient for most use cases.

---

### Component 3: Add Reconciliation Logging

#### 3.1 Database Schema Changes

**File:** [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:1-337)

**Add StockReconciliation model:**

```prisma
model StockReconciliation {
  id            String    @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  transactionId Int?     // Optional link to transaction
  status        String    // PENDING, RESOLVED, MANUAL
  details       Json      // Additional error details
  errorType     String?   // INSUFFICIENT_STOCK, VERSION_CONFLICT, etc.
  errorMessage  String?   // Human-readable error message
  createdAt     DateTime  @default(now())
  resolvedAt    DateTime?
  resolvedBy    Int?      // User ID who resolved
  resolution    String?   // How it was resolved
  
  // Relations
  transaction   Transaction? @relation(fields: [transactionId], references: [id])

  @@index([status])
  @@index([transactionId])
  @@index([createdAt])
  @@map("stock_reconciliations")
}
```

#### 3.2 Migration File

**File:** `backend/prisma/migrations/YYYYMMDDHHMMSS_add_stock_reconciliation/migration.sql`

```sql
-- Create stock_reconciliations table
CREATE TABLE "stock_reconciliations" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "transactionId" INTEGER,
  "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  "details" JSONB,
  "errorType" VARCHAR(50),
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "resolvedAt" TIMESTAMP,
  "resolvedBy" INTEGER,
  "resolution" TEXT,
  CONSTRAINT "stock_reconciliations_transactionId_fkey" 
    FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX "stock_reconciliations_status_idx" ON "stock_reconciliations" ("status");
CREATE INDEX "stock_reconciliations_transactionId_idx" ON "stock_reconciliations" ("transactionId");
CREATE INDEX "stock_reconciliations_createdAt_idx" ON "stock_reconciliations" ("createdAt");
```

#### 3.3 Transaction Handler Update

**File:** [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:395-434)

**Add reconciliation logging on failures:**

```typescript
// In catch block, after error handling
catch (error) {
  // Check for specific error codes
  if (error instanceof Error) {
    const err = error as Error & { code?: string };
    
    if (err.code === 'INSUFFICIENT_STOCK' || err.code === 'VERSION_CONFLICT') {
      // Log to reconciliation table
      try {
        await prisma.stockReconciliation.create({
          data: {
            transactionId: null, // Transaction failed during stock deduction
            status: 'PENDING',
            errorType: err.code,
            errorMessage: err.message,
            details: {
              stockDeductions: stockDeductions,
              correlationId: (req as any).correlationId
            }
          }
        });
      } catch (reconciliationError) {
        // Log error but don't fail the original error response
        logError('Failed to create reconciliation record', {
          error: reconciliationError instanceof Error ? reconciliationError.message : 'Unknown',
          originalError: err.message
        });
      }
    }
  }
  // ... existing error handling
}
```

#### 3.4 Admin API Endpoints

**File:** New file `backend/src/handlers/stockReconciliations.ts`

```typescript
import express, { Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import { rateLimiter } from '../middleware/rateLimiter';
import { logError } from '../utils/logger';
import i18n from '../i18n';

export const reconciliationsRouter = express.Router();

// GET /api/stock-reconciliations - Get all reconciliation records
reconciliationsRouter.get('/', rateLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, fromDate, toDate, limit = 50, offset = 0 } = req.query;
    
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate as string);
      if (toDate) where.createdAt.lte = new Date(toDate as string);
    }
    
    const reconciliations = await prisma.stockReconciliation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      include: {
        transaction: {
          select: { id: true, total: true, createdAt: true }
        }
      }
    });
    
    const total = await prisma.stockReconciliation.count({ where });
    
    res.json({
      reconciliations,
      metadata: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching reconciliations', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:stockReconciliations.fetchFailed') });
  }
});

// PUT /api/stock-reconciliations/:id/resolve - Resolve a reconciliation
reconciliationsRouter.put('/:id/resolve', rateLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    
    const reconciliation = await prisma.stockReconciliation.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: req.user?.id,
        resolution
      }
    });
    
    res.json(reconciliation);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error resolving reconciliation', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:stockReconciliations.resolveFailed') });
  }
});

// POST /api/stock-reconciliations/:id/escalate - Escalate to manual
reconciliationsRouter.post('/:id/escalate', rateLimiter, authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const reconciliation = await prisma.stockReconciliation.update({
      where: { id },
      data: {
        status: 'MANUAL'
      }
    });
    
    res.json(reconciliation);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error escalating reconciliation', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:stockReconciliations.escalateFailed') });
  }
});

export default reconciliationsRouter;
```

#### 3.5 Router Registration

**File:** [`backend/src/router.ts`](backend/src/router.ts:1-80)

```typescript
import reconciliationsRouter from './handlers/stockReconciliations';

// Add after other routes
router.use('/stock-reconciliations', reconciliationsRouter);
```

---

## Implementation Phases

### Phase 1: Database Schema Changes (Priority: High)

| Task | File | Lines | Effort |
|------|------|-------|--------|
| Add trackInventory field to ProductVariant | backend/prisma/schema.prisma | 57-75 | 1 hour |
| Create migration for trackInventory | backend/prisma/migrations/20260316000000_add_track_inventory_flag/migration.sql | - | 30 min |
| Add StockReconciliation model | backend/prisma/schema.prisma | (new) | 1 hour |
| Create migration for StockReconciliation | backend/prisma/migrations/20260316000001_add_stock_reconciliation/migration.sql | - | 30 min |

**Commands:**
```bash
cd backend
npx prisma migrate dev --name add_track_inventory_flag
npx prisma migrate dev --name add_stock_reconciliation
```

### Phase 2: Backend API Updates (Priority: High)

| Task | File | Lines | Effort |
|------|------|-------|--------|
| Update formatProductVariant function | backend/src/handlers/products.ts | 15-39 | 1 hour |
| Update POST /products handler | backend/src/handlers/products.ts | 106-247 | 1 hour |
| Update PUT /products/:id handler | backend/src/handlers/products.ts | 250-465 | 1 hour |
| Update transaction handler (optional) | backend/src/handlers/transactions.ts | 309-378 | 2 hours |
| Create reconciliations handler | backend/src/handlers/stockReconciliations.ts | (new) | 2 hours |
| Register reconciliations router | backend/src/router.ts | (new) | 30 min |

### Phase 3: Frontend Updates (Priority: Medium)

| Task | File | Lines | Effort |
|------|------|-------|--------|
| Add trackInventory to VariantForm | frontend/components/ProductManagement.tsx | 100-115 | 1 hour |
| Add translation keys (EN) | frontend/public/locales/en/common.json | - | 30 min |
| Add translation keys (IT) | frontend/public/locales/it/common.json | - | 30 min |
| Update frontend types | frontend/shared/types.ts | (if needed) | 30 min |

### Phase 4: Testing and Verification (Priority: High)

| Task | Description | Effort |
|------|-------------|--------|
| Test stock deduction with trackInventory=true | Verify stock is deducted | 1 hour |
| Test stock deduction with trackInventory=false | Verify stock is NOT deducted | 1 hour |
| Test insufficient stock scenario | Verify error handling | 1 hour |
| Test concurrent transactions | Verify optimistic locking | 1 hour |
| Test reconciliation logging | Verify records created | 1 hour |

---

## Testing Strategy

### 4.1 Test Cases for trackInventory

#### TC-001: Product with trackInventory=true (default)

```
Setup:
- Product: Coffee
- Variant: Espresso
- trackInventory: true (default)
- StockItem: Coffee Beans, quantity: 100

Action:
- Create order: 2 x Espresso
- Each Espresso consumes 10g Coffee Beans

Expected Result:
- Transaction created
- StockItem quantity: 80 (100 - 2*10)
- No errors
```

#### TC-002: Product with trackInventory=false

```
Setup:
- Product: Entry Fee
- Variant: Standard Entry
- trackInventory: false
- StockItem: None defined

Action:
- Create order: 1 x Standard Entry

Expected Result:
- Transaction created
- No stock deduction attempted
- No errors
```

#### TC-003: Mixed products (some track, some don't)

```
Setup:
- Product A (trackInventory: true): Consumes stock
- Product B (trackInventory: false): No stock consumption
- StockItem for Product A: quantity: 50

Action:
- Create order: 1 x Product A + 1 x Product B

Expected Result:
- Transaction created
- StockItem quantity: decreased by consumption amount
- Product B: No stock check
```

### 4.2 Test Cases for Atomic Transactions

#### TC-004: Concurrent transactions - First wins

```
Setup:
- StockItem: quantity: 10, version: 0

Action:
- Transaction A: Requires 10 units (reads version 0)
- Transaction B: Requires 10 units (reads version 0)
- Process A first, then B

Expected Result:
- Transaction A: Success, quantity: 0, version: 1
- Transaction B: HTTP 409, VERSION_CONFLICT error
- No transaction created for B
```

#### TC-005: Insufficient stock with trackInventory=false product

```
Setup:
- Product A: trackInventory: true, stockItem.quantity: 5
- Product B: trackInventory: false

Action:
- Create order: 10 x Product A + 1 x Product B

Expected Result:
- HTTP 400 error
- "Insufficient stock"
- No transactions created
- Stock unchanged
```

### 4.3 Test Cases for Reconciliation Logging

#### TC-006: Reconciliation created on stock failure

```
Setup:
- StockItem: quantity: 5
- Order requires: 10 units

Action:
- Attempt transaction

Expected Result:
- Transaction fails
- StockReconciliation record created:
  - status: PENDING
  - errorType: INSUFFICIENT_STOCK
  - details: { stockDeductions: [...] }
```

#### TC-007: Admin can view reconciliations

```
Setup:
- StockReconciliation records exist

Action:
- Admin calls GET /api/stock-reconciliations

Expected Result:
- Returns list of reconciliation records
- Includes pagination metadata
```

---

## File Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `backend/prisma/migrations/YYYYMMDDHHMMSS_add_track_inventory_flag/migration.sql` | Migration for trackInventory field |
| `backend/prisma/migrations/YYYYMMDDHHMMSS_add_stock_reconciliation/migration.sql` | Migration for StockReconciliation table |
| `backend/src/handlers/stockReconciliations.ts` | Admin API for reconciliation management |

### Files to Modify

| File | Modifications |
|------|---------------|
| `backend/prisma/schema.prisma` | Add trackInventory to ProductVariant, add StockReconciliation model |
| `backend/src/handlers/products.ts` | Handle trackInventory in CRUD operations |
| `backend/src/handlers/transactions.ts` | Add reconciliation logging on failures |
| `backend/src/router.ts` | Register reconciliations router |
| `backend/src/types.ts` | Update types if needed |
| `frontend/components/ProductManagement.tsx` | Add trackInventory toggle UI |
| `frontend/public/locales/en/common.json` | Add translation keys |
| `frontend/public/locales/it/common.json` | Add translation keys |

---

## Appendix: Error Codes Reference

| Error Code | HTTP Status | Description | Action |
|------------|-------------|-------------|--------|
| INSUFFICIENT_STOCK | 400 | Not enough inventory | Reduce order quantity or restock |
| VERSION_CONFLICT | 409 | Concurrent modification | Retry transaction |
| P2034 | 500 | Deadlock (Prisma) | Automatic retry (3 attempts) |

---

## References

- [Prisma Transactions Documentation](https://www.prisma.io/docs/guides/performance-and-optimization/prisma-transactions)
- [Optimistic Locking Pattern](https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html)
- [Existing Implementation: docs/stock-transaction-atomic-integration-plan.md](docs/stock-transaction-atomic-integration-plan.md)
