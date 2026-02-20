# Payment Method Migration Guide

## Overview

This document describes the database migration and code changes required to fix duplicate payment methods caused by case inconsistency. The issue resulted in duplicate entries (`CASH`, `Cash`, `CARD`, `Card`) and an unnecessary "Other" payment method in the database.

**Date:** February 20, 2026  
**Migration ID:** `20260220000000_normalize_payment_methods`

---

## Table of Contents

1. [Problem Description](#problem-description)
2. [Root Cause Analysis](#root-cause-analysis)
3. [Files Changed](#files-changed)
4. [Migration Details](#migration-details)
5. [Update Instructions for Other Machines](#update-instructions-for-other-machines)
6. [Verification Steps](#verification-steps)
7. [Prevention Measures](#prevention-measures)
8. [Troubleshooting](#troubleshooting)

---

## Problem Description

### Symptoms

The application exhibited the following issues:

1. **Duplicate Payment Methods**: Transactions table contained multiple variations of the same payment method:
   - `CASH` (uppercase)
   - `Cash` (Title Case)
   - `CARD` (uppercase)
   - `Card` (Title Case)

2. **Invalid Payment Method**: The database contained an "Other" payment method that was not intended to be used.

3. **Inconsistent Reporting**: Analytics and transaction reports showed fragmented data due to case-sensitive grouping of payment methods.

### Impact

- Transaction reports showed incorrect payment method breakdowns
- Filtering by payment method required case-insensitive queries
- Data integrity issues in financial records
- Potential confusion for users viewing transaction history

---

## Root Cause Analysis

### Primary Cause

The [`PaymentModal.tsx`](frontend/components/PaymentModal.tsx:185) component was sending payment method values in **UPPERCASE** format (`CASH`, `CARD`) while the constants file defined them in **Title Case** (`Cash`, `Card`).

### Contributing Factors

1. **No Backend Validation**: The backend did not validate or normalize payment method values before storing them in the database.

2. **Inconsistent Constants Usage**: The frontend constants in [`constants.ts`](frontend/shared/constants.ts:1) were not consistently used across all components.

3. **Missing Enum Type**: Payment methods were stored as free-form strings instead of an enumerated type with constrained values.

### Code Evidence

**Before Fix** - PaymentModal.tsx was sending uppercase values:
```tsx
// Lines 185 and 191 - Payment buttons
<button onClick={() => onConfirmPayment('CASH', tip, discount, discountReason)}>
  {t('payment.payWithCash')}
</button>
<button onClick={() => onConfirmPayment('CARD', tip, discount, discountReason)}>
  {t('payment.payWithCard')}
</button>
```

**After Fix** - PaymentModal.tsx now sends Title Case values:
```tsx
// Lines 185 and 191 - Payment buttons
<button onClick={() => onConfirmPayment('Cash', tip, discount, discountReason)}>
  {t('payment.payWithCash')}
</button>
<button onClick={() => onConfirmPayment('Card', tip, discount, discountReason)}>
  {t('payment.payWithCard')}
</button>
```

---

## Files Changed

### 1. Frontend Component

**File:** [`frontend/components/PaymentModal.tsx`](frontend/components/PaymentModal.tsx)

**Changes:**
- Line 185: Changed `'CASH'` to `'Cash'`
- Line 191: Changed `'CARD'` to `'Card'`

**Purpose:** Ensures payment method values are sent in Title Case format to match the constants definition.

### 2. Frontend Constants

**File:** [`frontend/shared/constants.ts`](frontend/shared/constants.ts)

**Changes:**
- Removed `'Other'` from the `PAYMENT_METHODS` array
- Payment methods now only contain: `['Cash', 'Card']`

**Before:**
```typescript
export const PAYMENT_METHODS = [
  'Cash',
  'Card',
  'Other',  // Removed
];
```

**After:**
```typescript
export const PAYMENT_METHODS = [
  'Cash',
  'Card',
];
```

### 3. Database Migration

**File:** [`backend/prisma/migrations/20260220000000_normalize_payment_methods/migration.sql`](backend/prisma/migrations/20260220000000_normalize_payment_methods/migration.sql)

**Purpose:** Normalizes existing payment method data in the database.

---

## Migration Details

### SQL Commands

The migration file [`migration.sql`](backend/prisma/migrations/20260220000000_normalize_payment_methods/migration.sql) contains the following commands:

```sql
-- Normalize payment methods to Title Case
UPDATE transactions SET "paymentMethod" = 'Cash' WHERE UPPER("paymentMethod") = 'CASH';
UPDATE transactions SET "paymentMethod" = 'Card' WHERE UPPER("paymentMethod") = 'CARD';
-- Convert 'Other' payment method to 'Cash' as 'Other' is being removed
UPDATE transactions SET "paymentMethod" = 'Cash' WHERE "paymentMethod" = 'Other';
```

### Migration Logic

| Original Value | Converted To | Reason |
|---------------|--------------|--------|
| `CASH` | `Cash` | Case normalization |
| `cash` | `Cash` | Case normalization |
| `CARD` | `Card` | Case normalization |
| `card` | `Card` | Case normalization |
| `Other` | `Cash` | Default fallback for removed option |

### Data Impact

- **No data loss**: All transactions are preserved
- **No downtime required**: Migration runs quickly on typical transaction volumes
- **Idempotent**: Running the migration multiple times produces the same result

---

## Update Instructions for Other Machines

### Prerequisites

- Docker and Docker Compose installed
- Access to the application repository
- Database backup completed (recommended)

### Step-by-Step Deployment

#### Step 1: Backup the Database

```bash
# Create a backup before migration
docker exec -t tev2-postgres-1 pg_dump -U totalevo_user bar_pos > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Step 2: Pull Latest Changes

```bash
git pull origin main
# or
git pull origin master
```

#### Step 3: Rebuild and Restart Containers

```bash
# Stop existing containers
docker compose down

# Rebuild and start containers
docker compose up -d --build
```

#### Step 4: Verify Migration Ran

```bash
# Check migration status
docker exec -it tev2-backend-1 npx prisma migrate status

# Or check the database directly
docker exec -it tev2-postgres-1 psql -U totalevo_user -d bar_pos -c \
  "SELECT DISTINCT \"paymentMethod\" FROM transactions;"
```

#### Step 5: Verify Application

1. Open the application in a browser
2. Navigate to the POS interface
3. Create a test transaction with each payment method
4. Verify the payment method is stored correctly

### Manual Migration (If Needed)

If the automatic migration fails, run the SQL commands manually:

```bash
docker exec -it tev2-postgres-1 psql -U totalevo_user -d bar_pos << 'EOF'
-- Normalize payment methods to Title Case
UPDATE transactions SET "paymentMethod" = 'Cash' WHERE UPPER("paymentMethod") = 'CASH';
UPDATE transactions SET "paymentMethod" = 'Card' WHERE UPPER("paymentMethod") = 'CARD';
-- Convert 'Other' payment method to 'Cash'
UPDATE transactions SET "paymentMethod" = 'Cash' WHERE "paymentMethod" = 'Other';
EOF
```

---

## Verification Steps

### 1. Check Payment Method Values

```sql
-- Should only return 'Cash' and 'Card'
SELECT DISTINCT "paymentMethod" FROM transactions ORDER BY "paymentMethod";
```

**Expected Result:**
```
 paymentMethod
---------------
 Card
 Cash
(2 rows)
```

### 2. Verify No Uppercase Values Remain

```sql
-- Should return 0 rows
SELECT COUNT(*) FROM transactions WHERE "paymentMethod" IN ('CASH', 'CARD', 'Other');
```

**Expected Result:**
```
 count
-------
     0
(1 row)
```

### 3. Check Frontend Constants

```bash
# Verify constants file
grep -A5 "PAYMENT_METHODS" frontend/shared/constants.ts
```

**Expected Output:**
```typescript
export const PAYMENT_METHODS = [
  'Cash',
  'Card',
];
```

### 4. Test New Transactions

1. Create a new transaction using Cash payment
2. Create a new transaction using Card payment
3. Verify both are stored with correct casing:

```sql
SELECT "paymentMethod", "createdAt" FROM transactions 
ORDER BY "createdAt" DESC LIMIT 5;
```

---

## Prevention Measures

### 1. Use Constants Consistently

Always import and use the `PAYMENT_METHODS` constant from [`constants.ts`](frontend/shared/constants.ts):

```typescript
import { PAYMENT_METHODS } from '../shared/constants';

// Use the constant instead of hardcoded strings
const handlePayment = (method: string) => {
  if (PAYMENT_METHODS.includes(method)) {
    // Process payment
  }
};
```

### 2. Backend Validation (Recommended)

Add backend validation to normalize payment methods before storage:

```typescript
// In backend/src/handlers/transactions.ts
const VALID_PAYMENT_METHODS = ['Cash', 'Card'];

function normalizePaymentMethod(method: string): string {
  const normalized = method.charAt(0).toUpperCase() + method.slice(1).toLowerCase();
  if (!VALID_PAYMENT_METHODS.includes(normalized)) {
    throw new Error(`Invalid payment method: ${method}`);
  }
  return normalized;
}
```

### 3. Database Enum Type (Future Enhancement)

Consider using a PostgreSQL ENUM type for payment methods:

```sql
CREATE TYPE payment_method AS ENUM ('Cash', 'Card');

ALTER TABLE transactions 
  ALTER COLUMN "paymentMethod" TYPE payment_method 
  USING "paymentMethod"::payment_method;
```

**Benefits:**
- Database-level constraint prevents invalid values
- Automatic type checking
- Better performance for queries

### 4. TypeScript Enum (Alternative)

Define a TypeScript enum for type safety:

```typescript
// In shared/types.ts
export enum PaymentMethod {
  Cash = 'Cash',
  Card = 'Card'
}

// Usage in components
import { PaymentMethod } from '../shared/types';

<button onClick={() => onConfirmPayment(PaymentMethod.Cash, ...)}>
```

### 5. Add Unit Tests

Create tests to verify payment method handling:

```typescript
describe('Payment Methods', () => {
  it('should only accept valid payment methods', () => {
    expect(PAYMENT_METHODS).toEqual(['Cash', 'Card']);
  });

  it('should reject invalid payment methods', () => {
    expect(VALID_PAYMENT_METHODS.includes('Other')).toBe(false);
    expect(VALID_PAYMENT_METHODS.includes('CASH')).toBe(false);
  });
});
```

---

## Troubleshooting

### Migration Fails with "relation not found"

**Cause:** The transactions table may not exist or has a different name.

**Solution:**
```bash
# Check table exists
docker exec -it tev2-postgres-1 psql -U totalevo_user -d bar_pos -c "\dt transactions"
```

### Duplicate Values Still Appear After Migration

**Cause:** Migration may not have run or new transactions were created with old code.

**Solution:**
1. Verify the frontend code is updated
2. Rebuild the frontend container: `docker compose up -d --build frontend`
3. Re-run the migration manually

### "Other" Payment Method Still Appears

**Cause:** The migration may have been skipped or rolled back.

**Solution:**
```sql
-- Check for remaining "Other" values
SELECT COUNT(*) FROM transactions WHERE "paymentMethod" = 'Other';

-- If found, run the update manually
UPDATE transactions SET "paymentMethod" = 'Cash' WHERE "paymentMethod" = 'Other';
```

### Application Shows Old Payment Methods

**Cause:** Browser cache or old frontend build.

**Solution:**
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Rebuild frontend: `docker compose up -d --build frontend`
3. Check that the correct container is running: `docker compose ps`

---

## Rollback Procedure

If issues arise after migration, follow these steps to rollback:

### Step 1: Stop the Application

```bash
docker compose down
```

### Step 2: Restore Database Backup

```bash
# Restore from backup file
cat backup_YYYYMMDD_HHMMSS.sql | docker exec -i tev2-postgres-1 psql -U totalevo_user bar_pos
```

### Step 3: Checkout Previous Code Version

```bash
git checkout <previous-commit-hash>
```

### Step 4: Restart Application

```bash
docker compose up -d --build
```

---

## Summary

| Aspect | Details |
|--------|---------|
| **Issue** | Duplicate payment methods due to case inconsistency |
| **Root Cause** | Frontend sending uppercase values, no backend validation |
| **Fix** | Normalized to Title Case, removed "Other" option |
| **Migration** | `20260220000000_normalize_payment_methods` |
| **Downtime** | None required |
| **Data Loss** | None |

---

## Contact

For questions or issues related to this migration, please contact the development team or create an issue in the project repository.
