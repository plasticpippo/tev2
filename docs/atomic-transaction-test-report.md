# Atomic Transaction Implementation - Code Analysis Report

**Date:** 2026-03-17  
**File Analyzed:** `backend/src/handlers/transactions.ts`  
**Endpoint:** `POST /api/transactions/process-payment`

---

## Executive Summary

The atomic transaction implementation uses Prisma's `$transaction` API which provides ACID guarantees. **The backend code is correctly implemented** for atomic transactions. However, there are potential issues with race conditions in concurrent scenarios.

---

## Code Analysis: How It Works

### 1. Transaction Structure (Lines 152-208)

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. Create the transaction
  const transaction = await tx.transaction.create({...});
  
  // 2. Decrement stock levels
  if (consumptions.size > 0) {
    for (const [stockItemId, quantity] of consumptions) {
      const stockItem = await tx.stockItem.findUnique({ where: { id: stockItemId } });
      if (stockItem && stockItem.quantity < quantity) {
        throw new Error(`Insufficient stock for item ${stockItem.name}`);
      }
      await tx.stockItem.update({
        where: { id: stockItemId },
        data: { quantity: { decrement: quantity } }
      });
    }
  }
  
  // 3. Complete order session
  // 4. Delete tab if exists
  // 5. Update table status if assigned
  
  return transaction;
});
```

---

## Test Scenarios Analysis

### Test 1: Successful Payment with Stock Deduction

**Expected Behavior:**
- ✅ Transaction created
- ✅ Stock decremented
- ✅ Order session completed
- ✅ Tab deleted (if exists)
- ✅ Table status updated (if exists)

**Code Verification:**
- Lines 155-172: Transaction creation ✅
- Lines 175-186: Stock decrement with quantity check ✅
- Lines 189-192: Order session completion ✅
- Lines 195-197: Tab deletion ✅
- Lines 200-205: Table status update ✅

**Status:** ✅ CORRECTLY IMPLEMENTED

---

### Test 2: Rollback on Insufficient Stock

**Expected Behavior:**
- Payment fails with error
- Stock NOT decremented (unchanged)
- NO transaction created

**Code Verification:**
```typescript
// Lines 177-180
const stockItem = await tx.stockItem.findUnique({ where: { id: stockItemId } });
if (stockItem && stockItem.quantity < quantity) {
  throw new Error(`Insufficient stock for item ${stockItem.name}`);
}
```

When `throw` is called inside `$transaction`:
- ✅ Entire transaction is rolled back
- ✅ No transaction record created
- ✅ No stock changes applied

**Error Handling (Lines 238-242):**
```typescript
if (error instanceof Error) {
  if (error.message.includes('Insufficient stock')) {
    return res.status(400).json({ error: error.message });
  }
}
```

**Status:** ✅ CORRECTLY IMPLEMENTED

---

### Test 3: Concurrent Payments (Race Condition) - POTENTIAL ISSUE

**Expected Behavior:**
- Only ONE payment should succeed when stock = 2 and two payments require 2 units each
- The other should fail with insufficient stock

**Potential Problem:**
The code performs a **non-locking read** to check stock:
```typescript
const stockItem = await tx.stockItem.findUnique({ where: { id: stockItemId } });
if (stockItem && stockItem.quantity < quantity) {
  throw new Error(`Insufficient stock for item ${stockItem.name}`);
}
await tx.stockItem.update({
  where: { id: stockItemId },
  data: { quantity: { decrement: quantity } }
});
```

**Race Condition Scenario:**
1. Request A reads stock = 2
2. Request B reads stock = 2 (before A updates)
3. Both pass the check (2 >= 2)
4. Both decrement to 0 and -2

**Mitigation:**
Prisma's `$transaction` with PostgreSQL uses **SERIALIZABLE** isolation by default, which should prevent this. However, the check-then-update pattern is NOT atomic.

**Recommended Fix:**
Use `SELECT ... FOR UPDATE` or atomic operations:

```typescript
// Option 1: Use decrement with a where clause that includes quantity check
const updated = await tx.stockItem.updateMany({
  where: { 
    id: stockItemId,
    quantity: { gte: quantity } // Only update if sufficient stock
  },
  data: { quantity: { decrement: quantity } }
});

if (updated.count === 0) {
  throw new Error(`Insufficient stock for item ${stockItem.name}`);
}
```

---

## 5-7 Potential Sources of Problems Analyzed

| # | Potential Problem | Likelihood | Evidence |
|---|-------------------|------------|----------|
| 1 | `$transaction` not used correctly | LOW | Code shows proper `$transaction` usage ✅ |
| 2 | Insufficient stock check happens outside transaction | LOW | Check is inside transaction ✅ |
| 3 | Error not caught properly | LOW | Try-catch wraps entire operation ✅ |
| 4 | Race condition in concurrent requests | **HIGH** | Non-locking read pattern ⚠️ |
| 5 | Frontend doesn't call `/process-payment` | MEDIUM | Need to verify frontend integration |
| 6 | Database connection issues | LOW | Prisma handles this ✅ |
| 7 | Stock consumption not configured for products | MEDIUM | Depends on product setup |

---

## Most Likely Issues

### 1. Race Condition (HIGH likelihood)
The check-then-update pattern is vulnerable to race conditions in concurrent scenarios. While Prisma's `$transaction` provides ACID, the application-level check happens before the update without row-level locking.

### 2. Frontend Integration (MEDIUM likelihood)
Need to verify:
- Does the frontend call `/api/transactions/process-payment`?
- Or does it call the regular `/api/transactions` endpoint?

---

## Recommendations

### Immediate Fix for Race Condition

Replace the check-then-update pattern with an atomic update:

```typescript
// In transactions.ts, replace lines 175-186 with:

if (consumptions.size > 0) {
  for (const [stockItemId, quantity] of consumptions) {
    // Atomic update - only succeeds if sufficient stock
    const updated = await tx.stockItem.updateMany({
      where: { 
        id: stockItemId,
        quantity: { gte: quantity }
      },
      data: { quantity: { decrement: quantity } }
    });
    
    if (updated.count === 0) {
      // Either stock item doesn't exist or insufficient quantity
      const stockItem = await tx.stockItem.findUnique({ where: { id: stockItemId } });
      throw new Error(`Insufficient stock for item ${stockItem?.name || 'Unknown'}`);
    }
  }
}
```

### For Frontend Testing

The user needs to verify from the browser:
1. Check Network tab for `/api/transactions/process-payment` calls
2. If not called, frontend might be using the regular `/api/transactions` endpoint (non-atomic)

---

## Conclusion

| Test | Backend Code | Risk |
|------|--------------|------|
| Test 1: Successful Payment | ✅ Correct | LOW |
| Test 2: Rollback | ✅ Correct | LOW |
| Test 3: Race Condition | ⚠️ Needs Fix | **HIGH** |

**Verdict:** The atomic transaction is correctly implemented for basic scenarios. However, **concurrent payments can lead to negative stock** due to the non-atomic check-then-update pattern. The recommended fix should be applied.

---

## Comprehensive Code Review - 2026-03-18

### Summary

A comprehensive code review was conducted across three critical files to assess the atomic transaction implementation. The review confirms the previous findings and identifies additional critical issues in the Prisma schema that undermine data integrity guarantees. While the transaction handlers use Prisma's `$transaction()` API correctly, several TOCTOU (Time-of-Check to Time-of-Use) race conditions and schema deficiencies were discovered that require immediate attention.

### Files Reviewed

| File | Purpose | Lines Reviewed |
|------|---------|----------------|
| [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts) | Payment processing and transaction creation | 138-208, 238-242 |
| [`backend/src/handlers/stockItems.ts`](backend/src/handlers/stockItems.ts) | Stock item management and level updates | 111-119, 287-290 |
| [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) | Database schema definition | Full file |

---

### Issues Found

| Severity | File:Line | Issue | Status |
|----------|-----------|-------|--------|
| **CRITICAL** | `transactions.ts:138-150` | Race condition - Stock consumption calculated OUTSIDE transaction (TOCTOU) | Unfixed |
| **CRITICAL** | `schema.prisma` | `StockItem.quantity` has no `>= 0` constraint - allows negative inventory | Unfixed |
| **CRITICAL** | `schema.prisma` | `Transaction` model lacks version field for optimistic locking | Unfixed |
| **CRITICAL** | `schema.prisma` | `OrderSession` lacks version field for concurrent modification detection | Unfixed |
| **WARNING** | `transactions.ts:196-199` | Silent failure - Order session completion errors ignored via `updateMany` | Unfixed |
| **WARNING** | `stockItems.ts:111-119` | TOCTOU race condition - stock validation happens outside transaction | Unfixed |
| **WARNING** | `stockItems.ts:287-290` | Direct stock update without transaction in PUT /:id endpoint | Unfixed |
| **WARNING** | `schema.prisma` | `StockConsumption` missing composite index on `[stockItemId, variantId]` | Unfixed |
| **WARNING** | `schema.prisma` | `StockItem` missing index on `quantity` for low-stock queries | Unfixed |
| **WARNING** | `schema.prisma` | `Transaction` missing index on `tillId` for till-based reporting | Unfixed |
| **SUGGESTION** | `schema.prisma` | `Transaction.items` uses `Json` type - consider structured relation | Open |

---

### Detailed Findings

#### 1. Transactions Handler (`backend/src/handlers/transactions.ts`)

**CRITICAL: Race Condition - Stock Consumption Calculated Outside Transaction (Lines 138-150)**

The code queries product variants and their stock consumption configurations **before** entering the `$transaction()` block. This creates a classic TOCTOU vulnerability:

```typescript
// Lines 138-150 - OUTSIDE transaction
const productVariants = await prisma.productVariant.findMany({
  where: { id: { in: variantIds } },
  include: { stockConsumptions: { include: { stockItem: true } } }
});

// Stock consumption map built here...
// Then transaction starts at line 152
```

**Attack Vector:**
1. Request A queries product variants, reads stock configuration
2. Request B modifies stock consumption configuration (different endpoint)
3. Request A enters transaction with stale consumption data
4. Stock deduction uses incorrect/outdated consumption values

**WARNING: Silent Failure - Order Session Completion (Lines 196-199)**

```typescript
// Uses updateMany which silently succeeds even when no matching records exist
await tx.orderSession.updateMany({
  where: { id: orderId },
  data: { status: 'COMPLETED', completedAt: new Date() }
});
```

If the order session was already completed or deleted, `updateMany` returns `{ count: 0 }` but doesn't throw an error. This could mask data integrity issues.

#### 2. Stock Items Handler (`backend/src/handlers/stockItems.ts`)

**WARNING: TOCTOU Race Condition (Lines 111-119)**

Stock validation occurs outside the transaction boundary:

```typescript
// Lines 111-119 - Validation OUTSIDE transaction
const stockItem = await prisma.stockItem.findUnique({ where: { id } });
if (stockItem.quantity < minQuantity) {
  // Validation happens here, before transaction
}

// Transaction starts later
await prisma.$transaction(async (tx) => {
  // Stock could have changed between validation and this point
});
```

**WARNING: Direct Stock Update Without Transaction (Lines 287-290)**

The PUT /:id endpoint updates quantity directly without transaction protection:

```typescript
// Lines 287-290
const updated = await prisma.stockItem.update({
  where: { id },
  data: { quantity: newQuantity }
});
```

This bypasses the transaction boundary and could lead to inconsistent state if concurrent modifications occur.

#### 3. Prisma Schema (`backend/prisma/schema.prisma`)

**CRITICAL: Missing Quantity Constraint**

```prisma
model StockItem {
  quantity    Decimal   @db.Decimal(10, 3)
  // No @check constraint for quantity >= 0
}
```

Without a database-level constraint, nothing prevents negative inventory values. Even with proper application-level checks, race conditions can result in negative stock.

**CRITICAL: Missing Version Fields for Optimistic Locking**

Neither `Transaction` nor `OrderSession` models have a `version` field:

```prisma
model Transaction {
  id        String   @id @default(uuid())
  // Missing: version Int @default(0)
}

model OrderSession {
  id     String   @id @default(uuid())
  // Missing: version Int @default(0)
}
```

Without optimistic locking, concurrent modifications to the same record can result in lost updates.

**WARNING: Missing Database Indexes**

```prisma
// Missing in StockConsumption:
// @@index([stockItemId, variantId])

// Missing in StockItem:
// @@index([quantity])  // For low-stock queries

// Missing in Transaction:
// @@index([tillId])    // For till-based reporting
```

---

### Positive Findings

Despite the issues identified, several aspects of the implementation are correct:

| Component | Implementation | Assessment |
|-----------|----------------|------------|
| Transaction Wrapper | Proper `$transaction()` usage wraps all critical operations | ✅ Correct |
| Stock Validation | Atomic decrement using `updateMany` with `quantity: { gte: quantity }` where clause | ✅ Correct |
| Error Handling | Appropriate HTTP status codes (400 for validation, 500 for server errors) | ✅ Correct |
| Rollback Behavior | Transaction rollback works correctly when errors are thrown | ✅ Correct |
| `/update-levels` Endpoint | Correctly uses `$transaction()` for batch updates | ✅ Correct |
| Atomic Decrement | Uses `{ decrement: quantity }` for safe stock reduction | ✅ Correct |
| Double-Check Pattern | Stock validation inside transaction provides safety net | ✅ Correct |

---

### Consolidated Verdict

**Overall Assessment: PARTIALLY COMPLIANT - CRITICAL FIXES REQUIRED**

The atomic transaction implementation demonstrates proper use of Prisma's `$transaction()` API and includes several safety mechanisms. However, the implementation has fundamental flaws that undermine its effectiveness:

| Category | Status | Impact |
|----------|--------|--------|
| Transaction Boundary | ⚠️ Partial | Stock consumption calculated outside transaction |
| Race Condition Protection | ⚠️ Insufficient | Multiple TOCTOU vulnerabilities |
| Data Integrity | ❌ Failed | No database-level quantity constraint |
| Concurrency Control | ❌ Missing | No optimistic locking |
| Error Handling | ⚠️ Partial | Silent failures possible |

**Risk Level: HIGH**

The combination of TOCTOU vulnerabilities and missing database constraints means that:
1. Concurrent payments can result in negative stock
2. Stock consumption configuration changes during payment processing can cause incorrect deductions
3. Concurrent order session modifications can result in lost updates
4. No database-level protection against data corruption

---

### Prioritized Recommendations

#### Priority 1: CRITICAL (Immediate Fix Required)

1. **Move Stock Consumption Calculation Inside Transaction**
   - File: [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:138)
   - Move lines 138-150 inside the `$transaction()` block
   - Estimated effort: 2 hours

2. **Add Database Constraint for Non-Negative Quantity**
   - File: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
   - Add migration: `ALTER TABLE "StockItem" ADD CONSTRAINT "quantity_non_negative" CHECK ("quantity" >= 0)`
   - Estimated effort: 1 hour

3. **Add Version Fields for Optimistic Locking**
   - Files: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
   - Add `version Int @default(0)` to `Transaction` and `OrderSession` models
   - Update handlers to use version-based optimistic locking
   - Estimated effort: 4 hours

#### Priority 2: HIGH (Fix Within Sprint)

4. **Fix TOCTOU in Stock Items Handler**
   - File: [`backend/src/handlers/stockItems.ts`](backend/src/handlers/stockItems.ts:111)
   - Move stock validation inside transaction boundary
   - Estimated effort: 2 hours

5. **Wrap PUT /:id in Transaction**
   - File: [`backend/src/handlers/stockItems.ts`](backend/src/handlers/stockItems.ts:287)
   - Use `$transaction()` for direct stock updates
   - Estimated effort: 1 hour

6. **Add Error Handling for Order Session Completion**
   - File: [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:196)
   - Check `updateMany` result count and throw if zero
   - Estimated effort: 1 hour

#### Priority 3: MEDIUM (Schedule for Next Sprint)

7. **Add Missing Database Indexes**
   - File: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
   - Add indexes for `StockConsumption`, `StockItem`, and `Transaction`
   - Estimated effort: 1 hour

8. **Consider Structured Relations for Transaction Items**
   - File: [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
   - Evaluate converting `items` from `Json` to proper relations
   - Estimated effort: 8 hours (requires data migration)

---

### Testing Recommendations

After implementing fixes, the following tests should be performed:

1. **Concurrency Test**: Simulate 10+ concurrent payments for the same product with limited stock
2. **Boundary Test**: Attempt to set stock quantity to negative values
3. **Race Condition Test**: Modify stock consumption configuration during active payment processing
4. **Recovery Test**: Verify rollback behavior when stock constraint violations occur
