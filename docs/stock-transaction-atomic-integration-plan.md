# Stock-Transaction Atomic Integration Plan

## Using $transaction + Optimistic Locking

**Document Version:** 1.0  
**Created:** 2026-03-15  
**Author:** Implementation Planning  
**Status:** Ready for Review

---

## 1. Executive Summary

### Problem Statement

The current payment flow has a **race condition** between transaction creation and stock deduction:

```
Current Flow (Problematic):
┌─────────────────────┐     ┌──────────────────────┐
│  Frontend           │     │  Backend             │
│                     │     │                      │
│  1. Call POST       │────>│  Create Transaction │
│     /transactions   │     │  (Success - DB)     │
│                     │     │                      │
│  2. Call PUT        │────>│  Deduct Stock       │
│     /update-levels  │     │  (May FAIL!)        │
└─────────────────────┘     └──────────────────────┘
                                    │
                                    ▼
                         Transaction exists but
                         inventory NOT decremented
```

### Root Cause

- Two separate database operations without atomicity
- No transaction rollback if stock deduction fails
- Frontend must handle the failure case manually

### Solution

Combine both operations into a single atomic transaction using:
1. **Prisma `$transaction`** - Ensures both operations succeed or both fail
2. **Optimistic Locking** - Prevents race conditions in concurrent sales

---

## 2. Database Schema Changes

### 2.1 Add Version Field for Optimistic Locking

**File:** `backend/prisma/schema.prisma`

**Current StockItem model:**
```prisma
model StockItem {
  name                   String
  quantity               Int
  type                   String
  baseUnit               String
  // ... other fields
}
```

**Modified StockItem model:**
```prisma
model StockItem {
  name                   String
  quantity               Int
  version                Int       @default(0)  // NEW: Optimistic locking
  type                   String
  baseUnit               String
  // ... other fields
}
```

**Rationale:**
- The `version` field starts at 0
- Each stock deduction increments the version
- Update operations include the expected version in the WHERE clause
- If version doesn't match, the update affects 0 rows → conflict detected

### 2.2 Create Migration File

**File:** `backend/prisma/migrations/YYYYMMDDHHMMSS_add_stock_item_version/migration.sql`

```sql
-- Add version column for optimistic locking
ALTER TABLE "stock_items" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

-- Create index for version lookups (optional, for performance)
CREATE INDEX "stock_items_version_idx" ON "stock_items" ("version");
```

**Migration Command:**
```bash
cd backend
npx prisma migrate dev --name add_stock_item_version
```

---

## 3. Backend Implementation

### 3.1 Modify POST /api/transactions

**File:** `backend/src/handlers/transactions.ts`

#### 3.1.1 Extend Transaction Request Type

The request body needs to optionally accept stock deduction data:

```typescript
interface StockDeductionItem {
  stockItemId: string;
  quantity: number;
}

interface TransactionRequest {
  // Existing fields
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  discount?: number;
  discountReason?: string;
  paymentMethod: string;
  userId: number;
  userName: string;
  tillId: number;
  tillName: string;
  tableId?: string;
  tableName?: string;
  
  // NEW: Optional stock deduction data
  stockDeductions?: StockDeductionItem[];
}
```

#### 3.1.2 Implement Atomic Transaction with Optimistic Locking

```typescript
// POST /api/transactions - Create new transaction with optional stock deduction
transactionsRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    // ... existing validation code (lines 65-246) ...

    // Extract stock deductions from request
    const stockDeductions = (req.body as any).stockDeductions || [];

    // If stock deductions provided, process atomically
    if (stockDeductions.length > 0) {
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Step 1: Create the transaction
          const transaction = await tx.transaction.create({
            data: {
              items: JSON.stringify(items),
              subtotal: validatedSubtotal,
              tax: validatedTax,
              tip,
              total: finalTotal,
              paymentMethod,
              userId,
              userName,
              tillId,
              tillName,
              discount: discountAmount,
              discountReason: discountReasonText,
              status,
              createdAt: new Date()
            }
          });

          // Step 2: Process stock deductions with optimistic locking
          // Group deductions by stockItemId to combine quantities
          const deductionMap = new Map<string, number>();
          for (const deduction of stockDeductions) {
            const current = deductionMap.get(deduction.stockItemId) || 0;
            deductionMap.set(deduction.stockItemId, current + deduction.quantity);
          }

          // Process each unique stock item
          for (const [stockItemId, totalQuantity] of deductionMap) {
            // First, get current stock item with version
            const stockItem = await tx.stockItem.findUnique({
              where: { id: stockItemId }
            });

            if (!stockItem) {
              throw new Error(`Stock item not found: ${stockItemId}`);
            }

            // Check if sufficient stock available
            if (stockItem.quantity < totalQuantity) {
              const error = new Error(`Insufficient stock for item ${stockItem.name}`) as any;
              error.code = 'INSUFFICIENT_STOCK';
              error.details = {
                stockItemId,
                stockItemName: stockItem.name,
                required: totalQuantity,
                available: stockItem.quantity
              };
              throw error;
            }

            // Optimistic lock update: Only update if version matches
            const updated = await tx.stockItem.updateMany({
              where: {
                id: stockItemId,
                version: stockItem.version  // Only if version hasn't changed
              },
              data: {
                quantity: {
                  decrement: totalQuantity
                },
                version: {
                  increment: 1
                }
              }
            });

            // If no rows updated, version conflict occurred
            if (updated.count === 0) {
              const error = new Error(`Stock item ${stockItem.name} was modified by another transaction`) as any;
              error.code = 'VERSION_CONFLICT';
              throw error;
            }
          }

          return transaction;
        });

        // Log payment success
        logPaymentEvent(
          'PROCESSED',
          finalTotal,
          'EUR',
          true,
          {
            orderId: result.id,
            paymentMethod,
            itemCount: items.length,
            correlationId: (req as any).correlationId,
          }
        );

        return res.status(201).json(result);

      } catch (transactionError: any) {
        // Handle specific transaction errors
        if (transactionError.code === 'INSUFFICIENT_STOCK') {
          return res.status(400).json({
            error: i18n.t('errors:stockItems.insufficientStockDetailed', {
              name: transactionError.details?.stockItemName,
              id: transactionError.details?.stockItemId,
              required: transactionError.details?.required,
              available: transactionError.details?.available
            }),
            code: 'INSUFFICIENT_STOCK',
            details: transactionError.details
          });
        }

        if (transactionError.code === 'VERSION_CONFLICT') {
          // P2034 is Prisma's transaction error code for serialization failure
          // But VERSION_CONFLICT is our custom code for optimistic locking failures
          return res.status(409).json({
            error: i18n.t('errors:stockItems.versionConflict'),
            code: 'VERSION_CONFLICT'
          });
        }

        // Handle Prisma P2034 (deadlock) with retry
        if (transactionError.code === 'P2034') {
          logWarn('Deadlock detected in transaction, may retry', {
            correlationId: (req as any).correlationId,
            error: transactionError.message
          });
          // Re-throw for retry logic at outer level
          throw transactionError;
        }

        // Re-throw other errors
        throw transactionError;
      }
    }

    // Original flow: No stock deductions (backward compatible)
    const transaction = await prisma.transaction.create({
      data: {
        items: JSON.stringify(items),
        subtotal: validatedSubtotal,
        tax: validatedTax,
        tip,
        total: finalTotal,
        paymentMethod,
        userId,
        userName,
        tillId,
        tillName,
        discount: discountAmount,
        discountReason: discountReasonText,
        status,
        createdAt: new Date()
      }
    });

    // ... existing success logging ...
    res.status(201).json(transaction);

  } catch (error) {
    // ... existing error handling ...
  }
});
```

#### 3.1.3 Retry Logic for Deadlocks

Add a retry mechanism for handling Prisma P2034 errors (deadlocks):

```typescript
// Helper function for retry logic
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Only retry on P2034 (deadlock) or VERSION_CONFLICT
      if (error.code !== 'P2034' && error.code !== 'VERSION_CONFLICT') {
        throw error;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 50;
      logWarn(`Transaction retry attempt ${attempt + 1}/${maxRetries}`, {
        delay,
        error: error.message
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
```

### 3.2 Update Stock Item Response Type

**File:** `backend/src/types.ts`

```typescript
export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  version: number;  // ADD: For optimistic locking
  type: string;
  baseUnit: string;
  // ... other fields
}
```

### 3.3 API Endpoint Changes Summary

| Endpoint | Change |
|----------|--------|
| `POST /transactions` | Accepts optional `stockDeductions` array; processes atomically |
| Response (Success) | Returns created transaction |
| Response (Insufficient Stock, 400) | Returns error with stock item details |
| Response (Version Conflict, 409) | Returns conflict error for retry |

---

## 4. Frontend Implementation

### 4.1 Modify PaymentContext.tsx

**File:** `frontend/contexts/PaymentContext.tsx`

#### 4.1.1 Build Stock Deductions Data

Instead of making a separate API call after transaction creation, build the stock deductions and include them in the transaction request:

```typescript
const handleConfirmPayment = async (
  paymentMethod: string, 
  tip: number, 
  discount: number, 
  discountReason: string
) => {
  // ... existing validation code ...

  try {
    // ... existing calculation code ...

    // Build stock deductions from order items
    const stockDeductions: { stockItemId: string; quantity: number }[] = [];
    const consumptions = new Map<string, number>();
    
    orderItems.forEach(item => {
      const product = appData.products.find(p => p.id === item.productId);
      const variant = product?.variants.find(v => v.id === item.variantId);
      
      if (variant) {
        variant.stockConsumption.forEach(sc => {
          // Validate UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          const isUUIDFormat = uuidRegex.test(sc.stockItemId);
          const stockItemExists = appData.stockItems.some(si => si.id === sc.stockItemId);
          
          if (isUUIDFormat && stockItemExists) {
            const currentQty = consumptions.get(sc.stockItemId) || 0;
            consumptions.set(sc.stockItemId, currentQty + (sc.quantity * item.quantity));
          } else {
            // Log warning for invalid references (non-blocking)
            console.warn(`Invalid stock reference for variant ${variant.id}: ${sc.stockItemId}`);
          }
        });
      }
    });

    // Convert Map to array
    stockDeductions.push(...Array.from(consumptions.entries()).map(([stockItemId, quantity]) => ({
      stockItemId,
      quantity
    })));

    // Build transaction data with optional stock deductions
    const transactionData = {
      items: orderItems,
      subtotal,
      tax,
      tip,
      discount,
      discountReason: discountReason || undefined,
      status,
      total,
      paymentMethod,
      userId: currentUser.id,
      userName: currentUser.name,
      tillId: assignedTillId,
      tillName: currentTillName,
      tableId: assignedTable?.id,
      tableName: assignedTable?.name,
      // NEW: Include stock deductions
      stockDeductions: stockDeductions.length > 0 ? stockDeductions : undefined
    };

    // SINGLE API CALL - atomic transaction
    await api.saveTransaction(transactionData);

    // ... rest of cleanup code (delete tab, update order session, etc.) ...

  } catch (error) {
    // Enhanced error handling
    console.error(t('paymentContext.paymentProcessingFailed'), error);
    
    // Check for specific error types
    if (error && typeof error === 'object') {
      const err = error as any;
      
      if (err.code === 'INSUFFICIENT_STOCK') {
        // Show specific error with stock details
        alert(
          t('paymentContext.insufficientStockError', {
            itemName: err.details?.stockItemName || 'Unknown',
            required: err.details?.required || 0,
            available: err.details?.available || 0
          })
        );
      } else if (err.code === 'VERSION_CONFLICT') {
        // Version conflict - suggest retry
        alert(t('paymentContext.stockConflictRetry'));
      } else {
        alert(error instanceof Error ? error.message : t('paymentContext.paymentProcessingFailedMessage'));
      }
    } else {
      alert(t('paymentContext.paymentProcessingFailedMessage'));
    }
  }
};
```

#### 4.1.2 Remove Separate Stock Update Call

**Remove lines 128-158** (the separate `api.updateStockLevels` call) since stock deduction is now included in the transaction request.

### 4.2 Add Translation Keys

**File:** `frontend/public/locales/en/common.json`

```json
{
  "paymentContext": {
    "insufficientStockError": "Insufficient stock for {{itemName}}. Required: {{required}}, Available: {{available}}",
    "stockConflictRetry": "Stock was modified by another transaction. Please try again.",
    "paymentProcessingFailed": "Payment processing failed",
    "paymentProcessingFailedMessage": "An error occurred while processing the payment. Please try again."
  }
}
```

**File:** `frontend/public/locales/it/common.json`

```json
{
  "paymentContext": {
    "insufficientStockError": "Stock insufficiente per {{itemName}}. Richiesto: {{required}}, Disponibile: {{available}}",
    "stockConflictRetry": "Il stock e stato modificato da un'altra transazione. Riprova.",
    "paymentProcessingFailed": "Elaborazione pagamento fallita",
    "paymentProcessingFailedMessage": "Si e verificato un errore durante l'elaborazione del pagamento. Riprova."
  }
}
```

### 4.3 API Service Update

**File:** `frontend/services/apiService.ts`

The existing `saveTransaction` function should continue to work as-is since it passes the entire request body to the backend. No changes required unless specific typing is needed.

---

## 5. Error Handling

### 5.1 Error Types and Responses

| Error Code | HTTP Status | Cause | User Message |
|------------|-------------|-------|--------------|
| `INSUFFICIENT_STOCK` | 400 | Not enough inventory | "Insufficient stock for [item]. Required: X, Available: Y" |
| `VERSION_CONFLICT` | 409 | Concurrent modification | "Stock was modified by another transaction. Please try again." |
| `P2034` (Prisma) | 500 | Deadlock | Retry automatically (3 attempts) |
| Generic Error | 500 | Other failures | "Payment processing failed. Please try again." |

### 5.2 Retry Strategy

```
Retry Flow:
┌─────────────────┐
│  First Attempt  │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Success │
    └─────────┘
         │
    ┌────▼────┐
    │ Error   │──P2034/VERSION_CONFLICT──> Wait 100ms ──┐
    │         │                                         │
    └─────────┘                                         │
         │                                              ▼
    ┌────▼────┐                                   ┌──────────┐
    │ Retry 2 │                                   │ Retry 3  │
    └────────┬┘                                   └────┬─────┘
         │                                          │
    ┌────▼────┐                                    ▼
    │ Success │◄─────────────── Wait 200ms ───────────────┘
    └─────────┘                                              │
         │                                                   ▼
    ┌────▼────┐                                         ┌──────────┐
    │ Failed  │────────────> (After 3 retries) ──> Error Message
    └─────────┘
```

### 5.3 Backend Logging

Add structured logging for debugging:

```typescript
// In transaction handler
logInfo('Stock deduction processing', {
  transactionId: transaction.id,
  stockDeductions: stockDeductions.map(d => ({
    stockItemId: d.stockItemId,
    quantity: d.quantity
  })),
  correlationId: req.correlationId
});

logError('Stock deduction failed', {
  error: error.message,
  code: error.code,
  stockItemId: error.details?.stockItemId,
  correlationId: req.correlationId
});
```

---

## 6. Testing Plan

### 6.1 Test Scenarios

#### Test 1: Successful Sale with Stock Deduction

**Objective:** Verify transaction is created and stock is deducted atomically.

**Steps:**
1. Ensure product has stock consumption defined
2. Verify initial stock level (e.g., 100 units)
3. Create a sale transaction with the product
4. Verify transaction created successfully
5. Verify stock level decreased correctly (e.g., to 99 units)

**Expected Result:**
- Transaction exists in database
- StockItem.quantity = 99
- StockItem.version = 1

#### Test 2: Insufficient Stock Scenario

**Objective:** Verify transaction fails and is not created when stock is insufficient.

**Steps:**
1. Set StockItem.quantity to 5
2. Attempt to create transaction requiring 10 units
3. Verify error returned with INSUFFICIENT_STOCK code
4. Verify no transaction was created
5. Verify stock quantity unchanged (still 5)

**Expected Result:**
- HTTP 400 response
- Error message: "Insufficient stock for [item]"
- No transaction in database
- Stock quantity = 5

#### Test 3: Product Without Stock (Digital/Entry Fee)

**Objective:** Verify products without stock consumption work correctly.

**Steps:**
1. Create a "Digital Product" with no stockConsumption
2. Create a transaction for this product
3. Verify transaction created successfully

**Expected Result:**
- Transaction created successfully
- No stock deduction attempted
- Works without `stockDeductions` in request

#### Test 4: Concurrent Sales (Race Condition)

**Objective:** Verify optimistic locking prevents race conditions.

**Steps:**
1. Set StockItem.quantity = 10
2. Create two concurrent sales, each requiring 10 units
3. First sale should succeed (stock = 0)
4. Second sale should fail with VERSION_CONFLICT

**Expected Result:**
- First transaction: Success, stock = 0
- Second transaction: HTTP 409, VERSION_CONFLICT error

#### Test 5: Mixed Products (With and Without Stock)

**Objective:** Verify transaction with mixed product types.

**Steps:**
1. Create order with:
   - Product A: Has stock consumption (quantity: 2 per unit)
   - Product B: No stock consumption
2. Order quantity: 3 of each product
3. Verify stock deducted only for Product A (3 * 2 = 6 units)

**Expected Result:**
- Transaction created
- StockItem for Product A decreased by 6
- No errors

### 6.2 Manual Testing Checklist

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| 1 | Normal sale with stock | Transaction created, stock deducted | [ ] |
| 2 | Insufficient stock | Error returned, no transaction | [ ] |
| 3 | Product without stock | Transaction created, no stock error | [ ] |
| 4 | Concurrent sales | One succeeds, one conflicts | [ ] |
| 5 | Mixed products | Correct stock deduction | [ ] |
| 6 | Retry on conflict | Transaction succeeds on retry | [ ] |
| 7 | Deadlock retry | Transaction succeeds after retry | [ ] |

---

## 7. Implementation Checklist

### Phase 1: Database Changes

- [ ] Add `version` field to StockItem model in schema.prisma
- [ ] Create migration file
- [ ] Run migration

### Phase 2: Backend Changes

- [ ] Update StockItem type in types.ts
- [ ] Modify POST /transactions handler:
  - [ ] Accept stockDeductions in request
  - [ ] Add $transaction wrapper
  - [ ] Implement optimistic locking logic
  - [ ] Add retry logic for P2034
  - [ ] Handle INSUFFICIENT_STOCK error
  - [ ] Handle VERSION_CONFLICT error
- [ ] Add new translation keys

### Phase 3: Frontend Changes

- [ ] Modify PaymentContext.tsx:
  - [ ] Build stockDeductions array
  - [ ] Include in transaction request
  - [ ] Remove separate updateStockLevels call
  - [ ] Add error handling for new error types
- [ ] Add translation keys

### Phase 4: Testing

- [ ] Run manual tests
- [ ] Verify backward compatibility
- [ ] Test error scenarios

---

## 8. Backward Compatibility

The implementation maintains full backward compatibility:

1. **Without stockDeductions:** The handler works exactly as before (original flow)
2. **Frontend unchanged:** Existing frontends will continue to work (no stock deduction)
3. **API versioning:** The stockDeductions field is optional

---

## 9. Performance Considerations

1. **Transaction Scope:** The $transaction keeps the lock duration minimal
2. **Optimistic Locking:** No pessimistic locks required (better concurrency)
3. **Batch Updates:** Stock deductions are grouped to minimize database round trips
4. **Index on Version:** Optional index for faster version lookups

---

## 10. Rollback Plan

If issues arise:

1. **Revert Migration:** `npx prisma migrate revert`
2. **Backend Rollback:** Revert transactions.ts changes
3. **Frontend Rollback:** Revert PaymentContext.tsx changes

---

## 11. References

- [Prisma Transactions Documentation](https://www.prisma.io/docs/guides/performance-and-optimization/prisma-transactions)
- [Optimistic Locking Pattern](https://martinfowler.com/eaaCatalog/optimisticOfflineLock.html)
- [PostgreSQL Advisory Locks](https://www.postgresql.org/docs/current/explicit-locking.html) (for future reference)

---

## 12. Appendix: Sample API Calls

### Create Transaction with Stock Deduction

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "items": [
      {
        "id": 1,
        "productId": 1,
        "variantId": 1,
        "name": "Espresso",
        "price": 2.50,
        "quantity": 2
      }
    ],
    "subtotal": 5.00,
    "tax": 0.00,
    "tip": 0.00,
    "total": 5.00,
    "paymentMethod": "CASH",
    "userId": 1,
    "userName": "Admin",
    "tillId": 1,
    "tillName": "Main Till",
    "stockDeductions": [
      {
        "stockItemId": "550e8400-e29b-41d4-a716-446655440000",
        "quantity": 20
      }
    ]
  }'
```

### Successful Response

```json
{
  "id": 123,
  "items": "[...]",
  "subtotal": 5.00,
  "tax": 0.00,
  "tip": 0.00,
  "total": 5.00,
  "paymentMethod": "CASH",
  "userId": 1,
  "userName": "Admin",
  "tillId": 1,
  "tillName": "Main Till",
  "status": "completed",
  "createdAt": "2026-03-15T10:00:00.000Z"
}
```

### Insufficient Stock Error Response

```json
{
  "error": "Insufficient stock for Coffee Beans. Required: 20, Available: 15",
  "code": "INSUFFICIENT_STOCK",
  "details": {
    "stockItemId": "550e8400-e29b-41d4-a716-446655440000",
    "stockItemName": "Coffee Beans",
    "required": 20,
    "available": 15
  }
}
```

### Version Conflict Error Response

```json
{
  "error": "Stock item Coffee Beans was modified by another transaction",
  "code": "VERSION_CONFLICT"
}
```
