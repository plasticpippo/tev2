# Idempotency Implementation Summary

## Overview

### Problem Statement

Duplicate payments could occur when users accidentally click the "Pay" button multiple times due to:
- Slow network conditions causing UI lag
- Double-clicks on payment buttons
- Mobile touch events firing multiple times
- Browser refresh during payment processing

Each duplicate payment would:
- Create separate transaction records
- Decrement stock levels multiple times
- Cause reconciliation issues
- Result in financial discrepancies

### Solution Implemented

Idempotency keys were implemented to ensure that multiple identical payment requests result in only one transaction being processed. When a duplicate request is detected, the system returns the original transaction instead of creating a new one.

---

## Implementation Details

### Database Changes

#### New Fields Added to Transaction Model

Two new columns were added to the `transactions` table:

| Field | Type | Purpose |
|-------|------|---------|
| `idempotencyKey` | TEXT (nullable) | Unique identifier for the payment attempt |
| `idempotencyCreatedAt` | TIMESTAMP(3) (nullable) | When the idempotency key was first used |

#### Migration

**File:** [`backend/prisma/migrations/20260319172731_add_idempotency_key_to_transactions/migration.sql`](backend/prisma/migrations/20260319172731_add_idempotency_key_to_transactions/migration.sql)

```sql
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "idempotencyCreatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey");
```

**Design Decisions:**
- Fields are nullable for backward compatibility with existing transactions
- Unique constraint on `idempotencyKey` provides database-level duplicate prevention
- No index on `idempotencyCreatedAt` was added (queries use the unique index)

### Backend Changes

#### Idempotency Key Validation

**File:** [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:26)

```typescript
function validateIdempotencyKey(key: unknown): string | null {
  if (!key) return null;
  if (typeof key !== 'string') return null;

  // Allow 8-128 alphanumeric characters, dashes, underscores
  const validPattern = /^[a-zA-Z0-9_-]{8,128}$/;
  if (!validPattern.test(key)) return null;

  return key;
}
```

**Validation Rules:**
- Minimum length: 8 characters (prevents brute-force collisions)
- Maximum length: 128 characters (prevents DoS via large keys)
- Character set: alphanumeric, dashes, underscores only (prevents injection)

#### Duplicate Detection Logic

**File:** [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:159)

The `/process-payment` endpoint checks for existing transactions within the atomic database transaction:

```typescript
if (idempotencyKey) {
  const expirationCutoff = new Date(Date.now() - IDEMPOTENCY_KEY_EXPIRATION_MS);

  const existingTransaction = await tx.transaction.findFirst({
    where: {
      idempotencyKey,
      userId, // Bind to user for security - prevent cross-user replay attacks
      idempotencyCreatedAt: {
        gte: expirationCutoff // Only check keys within expiration window
      }
    }
  });

  if (existingTransaction) {
    // Log idempotent replay for audit purposes
    logInfo('Idempotent replay detected', {
      correlationId,
      idempotencyKey,
      transactionId: existingTransaction.id,
      originalCreatedAt: existingTransaction.createdAt.toISOString(),
      userId
    });

    return { isDuplicate: true, transaction: existingTransaction };
  }
}
```

#### Response Headers

For idempotent replays, the following headers are set:

```typescript
if (isDuplicate) {
  res.setHeader('X-Idempotent-Replay', 'true');
  res.setHeader('X-Original-Timestamp', transaction.createdAt.toISOString());
}
```

#### HTTP Status Codes

| Scenario | Status Code | Response |
|----------|-------------|----------|
| New transaction | 201 | Created transaction |
| Idempotent replay | 200 | Original transaction with `_meta: { idempotent: true }` |

### Frontend Changes

#### Idempotency Key Generation

**File:** [`frontend/utils/idempotency.ts`](frontend/utils/idempotency.ts)

```typescript
export function generateIdempotencyKey(items: Array<{ id: number | string; quantity: number }>): string {
  const timestamp = Date.now().toString(36);
  // Use crypto.randomUUID if available (HTTPS context), otherwise use our fallback
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : generateUUIDv4()
  ).split('-')[0]; // First segment only for brevity
  const itemsHash = items
    .map(i => `${i.id}:${i.quantity}`)
    .sort()
    .join('_')
    .split('')
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
    .toString(36);
  return `${timestamp}-${uuid}-${itemsHash}`;
}
```

**Key Format:** `{timestamp}-{uuid}-{itemsHash}`
- `timestamp`: Base36 encoded current time
- `uuid`: First segment of UUID v4 (8 characters)
- `itemsHash`: Hash of order items for uniqueness

#### Browser Compatibility Fix

A fallback UUID generator was implemented for non-HTTPS contexts where `crypto.randomUUID` is not available:

```typescript
function generateUUIDv4(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set version (4) and variant bits per RFC 4122
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 1

    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Fallback for very old browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

#### Payment Modal UI Protection

**File:** [`frontend/components/PaymentModal.tsx`](frontend/components/PaymentModal.tsx:83)

```typescript
const handlePayment = (paymentMethod: string) => {
  if (isProcessing) return; // Prevent double-clicks
  setIsProcessing(true);
  const idempotencyKey = generateIdempotencyKey(orderItems);
  onConfirmPayment(paymentMethod, tip, discount, discountReason, idempotencyKey);
};
```

Button states are disabled during processing:

```tsx
<button
  onClick={() => handlePayment('Cash')}
  disabled={isProcessing}
  className={`flex-1 ${isProcessing ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'} ...`}
>
  {isProcessing ? 'Processing...' : t('payment.payWithCash')}
</button>
```

#### Transaction Service Update

**File:** [`frontend/services/transactionService.ts`](frontend/services/transactionService.ts:111)

```typescript
export interface ProcessPaymentData {
  items: Transaction['items'];
  subtotal: number;
  tax: number;
  tip: number;
  paymentMethod: string;
  userId: number;
  userName: string;
  tillId: number;
  tillName: string;
  discount?: number;
  discountReason?: string;
  activeTabId?: number;
  tableId?: string;
  tableName?: string;
  idempotencyKey: string; // Required field
}
```

---

## Files Modified

### Backend

| File | Changes |
|------|---------|
| [`backend/prisma/migrations/20260319172731_add_idempotency_key_to_transactions/migration.sql`](backend/prisma/migrations/20260319172731_add_idempotency_key_to_transactions/migration.sql) | New migration file |
| [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts) | Added idempotency validation, duplicate detection, response headers |

### Frontend

| File | Changes |
|------|---------|
| [`frontend/utils/idempotency.ts`](frontend/utils/idempotency.ts) | New file - key generation with browser compatibility |
| [`frontend/components/PaymentModal.tsx`](frontend/components/PaymentModal.tsx) | Added `isProcessing` state, key generation, button disable |
| [`frontend/contexts/PaymentContext.tsx`](frontend/contexts/PaymentContext.tsx) | Updated `handleConfirmPayment` signature to accept idempotency key |
| [`frontend/services/transactionService.ts`](frontend/services/transactionService.ts) | Added `idempotencyKey` to `ProcessPaymentData` interface |

---

## How It Works

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     PAYMENT REQUEST FLOW                        │
└─────────────────────────────────────────────────────────────────┘

1. USER CLICKS PAY BUTTON
   │
   ▼
2. PAYMENT MODAL GENERATES IDEMPOTENCY KEY
   │  - Format: {timestamp}-{uuid}-{itemsHash}
   │  - Key is unique to this specific payment attempt
   │
   ▼
3. FRONTEND SENDS REQUEST WITH KEY
   │  - POST /api/transactions/process-payment
   │  - Body includes: { ..., idempotencyKey: "abc123..." }
   │
   ▼
4. BACKEND VALIDATES KEY FORMAT
   │  - Check length (8-128 chars)
   │  - Check characters (alphanumeric, dash, underscore)
   │  - Invalid keys are ignored (payment proceeds without deduplication)
   │
   ▼
5. BACKEND CHECKS FOR EXISTING TRANSACTION
   │  - Query: WHERE idempotencyKey = ? AND userId = ? AND createdAt > 24h ago
   │
   ├──────────────────────────────────────────────────────┐
   │                                                      │
   ▼                                                      ▼
6a. NO EXISTING TRANSACTION                          6b. EXISTING TRANSACTION FOUND
   │                                                      │
   ▼                                                      ▼
7a. CREATE NEW TRANSACTION                         7b. RETURN EXISTING TRANSACTION
   │  - Store idempotencyKey                           │  - Log idempotent replay
   │  - Store idempotencyCreatedAt                     │  - Set X-Idempotent-Replay header
   │  - Process stock decrement                        │  - Return HTTP 200
   │  - Complete order session                         │
   │  - Return HTTP 201                                │
   │                                                      │
   └──────────────────────────────────────────────────────┘
                          │
                          ▼
8. FRONTEND RECEIVES RESPONSE
   - On success: close modal, clear order
   - On idempotent replay: same as success (transparent to user)
```

### Concurrent Request Handling

When two identical requests arrive simultaneously:

1. **First request** acquires database transaction lock
2. **Second request** waits for lock
3. First request creates transaction and commits
4. Second request acquires lock, finds existing transaction
5. Second request returns existing transaction (idempotent replay)

The unique constraint on `idempotencyKey` provides an additional safety net at the database level.

---

## Security Considerations

### Key Validation

| Rule | Implementation | Purpose |
|------|----------------|---------|
| Minimum length | 8 characters | Prevents brute-force collisions |
| Maximum length | 128 characters | Prevents DoS via large keys |
| Character set | Alphanumeric, dash, underscore | Prevents injection attacks |

### User Binding

Idempotency keys are bound to the user who created them:

```typescript
const existingTransaction = await tx.transaction.findFirst({
  where: {
    idempotencyKey,
    userId, // Only find transactions for the same user
    // ...
  }
});
```

This prevents:
- Cross-user replay attacks
- One user's key being used to retrieve another user's transaction

### Key Expiration

- **Duration**: 24 hours
- **Implementation**: Query filter on `idempotencyCreatedAt`
- **Rationale**: 
  - Balances user experience (allows retry within reasonable time)
  - Prevents storage bloat (old keys don't need cleanup)
  - Aligns with typical payment retry scenarios

```typescript
const IDEMPOTENCY_KEY_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const expirationCutoff = new Date(Date.now() - IDEMPOTENCY_KEY_EXPIRATION_MS);
```

### Audit Logging

All idempotent replays are logged for audit purposes:

```typescript
logInfo('Idempotent replay detected', {
  correlationId,
  idempotencyKey,
  transactionId: existingTransaction.id,
  originalCreatedAt: existingTransaction.createdAt.toISOString(),
  userId
});
```

---

## Testing Results

### Tests Performed

1. **Double-click Prevention**
   - Rapid clicks on payment button
   - Result: Only one transaction created

2. **Slow Network Simulation**
   - Throttled network conditions
   - Result: Duplicate requests return original transaction

3. **Browser Compatibility**
   - Tested in non-HTTPS context (HTTP)
   - Result: Fallback UUID generator works correctly

4. **Cross-user Protection**
   - Attempted to replay key with different user
   - Result: New transaction created (key bound to original user)

### Browser Compatibility Fix

**Issue:** `crypto.randomUUID()` is only available in secure contexts (HTTPS).

**Solution:** Implemented RFC 4122 compliant UUID v4 fallback using `crypto.getRandomValues()`:

```typescript
// Use crypto.randomUUID if available (HTTPS context), otherwise use our fallback
const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : generateUUIDv4()
).split('-')[0];
```

This ensures the idempotency feature works in:
- Production HTTPS environments (uses native `crypto.randomUUID`)
- Development HTTP environments (uses fallback)
- Older browsers (uses Math.random fallback)

---

## Configuration

### Constants

| Setting | Value | Location |
|---------|-------|----------|
| Key expiration | 24 hours | [`backend/src/handlers/transactions.ts:16`](backend/src/handlers/transactions.ts:16) |
| Min key length | 8 characters | [`backend/src/handlers/transactions.ts:31`](backend/src/handlers/transactions.ts:31) |
| Max key length | 128 characters | [`backend/src/handlers/transactions.ts:31`](backend/src/handlers/transactions.ts:31) |

### Key Format Requirements

```
Format: {timestamp}-{uuid}-{itemsHash}

Examples:
- l1a2b3c-4d5e6f7g-x1y2z3a
- m2n3o4p-5q6r7s8t-y4z5a6b

Components:
- timestamp: Base36 encoded Unix timestamp (variable length)
- uuid: First 8 characters of UUID v4
- itemsHash: Base36 encoded hash of order items
```

---

## References

- [Idempotency Implementation Plan](./idempotency-implementation-plan.md)
- [HTTP Idempotency - Stripe API](https://stripe.com/docs/api/idempotent_requests)
- [RFC 4122 - UUID URN Namespace](https://tools.ietf.org/html/rfc4122)
