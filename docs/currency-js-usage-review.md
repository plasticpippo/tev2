# Comprehensive Code Review: Currency.js Usage Report

## Executive Summary

This report reviews all monetary calculations across the codebase to ensure they properly use the currency.js module for precise floating-point arithmetic. The review covers both backend (Node.js/TypeScript) and frontend (React/TypeScript) components.

---

## 1. Currency.js Utility Modules

### Backend: `backend/src/utils/money.ts`

| Function | Purpose | Uses currency.js |
|----------|---------|------------------|
| `isMoneyValid()` | Validates monetary values | No |
| `roundMoney()` | Rounds to 2 decimal places | Yes |
| `addMoney()` | Safely adds two values | Yes |
| `subtractMoney()` | Safely subtracts values | Yes |
| `multiplyMoney()` | Multiplies by a factor | Yes |
| `divideMoney()` | Divides by a divisor | Yes |
| `formatMoney()` | Formats as currency string | No |
| `distributeMoney()` | Distributes into equal parts | Yes |

**Configuration:**
- Symbol: '€'
- Precision: 2 decimal places
- Decimal separator: '.'
- Thousands separator: ','

### Frontend: `frontend/utils/money.ts`

| Function | Purpose | Uses currency.js |
|----------|---------|------------------|
| `isMoneyValid()` | Validates monetary values | No |
| `roundMoney()` | Rounds to 2 decimal places | Yes |
| `addMoney()` | Safely adds two values | Yes |
| `subtractMoney()` | Safely subtracts values | Yes |
| `multiplyMoney()` | Multiplies by a factor | Yes |
| `divideMoney()` | Divides by a divisor | Yes |
| `formatMoney()` | Formats as currency string | No |
| `distributeMoney()` | Distributes into equal parts | Yes |
| `getSafe()` | Safe object getter | No |

---

## 2. Backend Analysis

### 2.1 HANDLERS

#### ✅ COMPLIANT: `dailyClosings.ts` + `dailyClosingService.ts`

The daily closing handler correctly delegates all monetary calculations to the service layer, which properly uses money utilities:

- Uses `addMoney()` for accumulating gross sales, discounts, tax, tips
- Uses `subtractMoney()` for net sales calculation
- No raw JavaScript arithmetic on monetary values

#### ⚠️ PARTIALLY COMPLIANT: `transactions.ts`

**Correctly uses money utilities for:**
- Item-level calculations (lines 174-188)
- Price × quantity calculations
- Tax calculations

**Issues found:**
| Line | Issue | Severity |
|------|-------|----------|
| 192 | Raw subtraction for comparison: `subtotal - calculatedSubtotal` | Medium |
| 204 | Raw subtraction for comparison: `tax - calculatedTax` | Medium |
| 228 | Raw addition: `validatedSubtotal + validatedTax + tip` | HIGH |
| 245 | Raw subtraction: `preDiscountTotal - discountAmount` | **CRITICAL** |

The critical issue at **line 245** stores the final total directly to the database, potentially introducing floating-point errors.

#### ⚠️ ISSUE: `products.ts`

- Does not import money utilities
- Uses raw JavaScript multiplication for tax rate conversion (line 28):
  ```typescript
  (Number(variant.taxRate.rate) * 100).toFixed(2) + '%'
  ```
- Risk: Low-Medium (display-only, `.toFixed()` masks errors)

#### ✅ COMPLIANT: `stockItems.ts`

- No monetary calculations performed
- Only integer quantity operations

### 2.2 SERVICES

#### ✅ COMPLIANT: `dailyClosingService.ts`

All monetary calculations correctly use money utilities:
- 6 uses of `addMoney()`
- 1 use of `subtractMoney()`

#### ⚠️ ISSUE: `analyticsService.ts`

**Correctly uses money utilities for:**
- Average calculations (`divideMoney`, `roundMoney`)
- Revenue summation (`addMoney`, `roundMoney`)
- Hourly totals (`addMoney`)

**Issues found:**
| Line | Issue | Severity |
|------|-------|----------|
| 146 | Raw multiplication: `item.price * item.quantity` | **CRITICAL** |
| 414-415 | Raw subtraction: `hour1.total - hour2.total` | Medium |
| 425-428 | Raw subtraction: `period1.totalSales - period2.totalSales` | Medium |

The critical issue at **line 146** affects revenue calculations.

---

## 3. Frontend Analysis

### 3.1 COMPONENTS

#### ✅ COMPLIANT: `PaymentModal.tsx`

- Correctly imports all money utility functions
- Uses money utilities for all tax/total calculations
- Only uses raw JavaScript for non-monetary operations (clamping with `Math.max`/`Math.min`)

#### 🔴 CRITICAL ISSUES: `OrderPanel.tsx`

- **Does NOT import money utilities**
- Line 36 uses raw arithmetic:
  ```typescript
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  ```
- HIGH floating-point precision risk

#### 🔴 CRITICAL ISSUES: `PaymentContext.tsx`

- **Does NOT import money utilities**
- Multiple lines use raw arithmetic:
  - Line 36: `item.price * item.quantity`
  - Line 38: `itemTotal / (1 + item.effectiveTaxRate)`
  - Line 40: `itemTotal - itemSubtotal`
  - Line 43: `itemTotal * item.effectiveTaxRate`
  - Lines 49-50: `subtotal + tax`, `totalBeforeDiscount - discount + tip`
- CRITICAL floating-point precision risk

---

## 4. Summary of Issues

### Critical Issues (Require Immediate Fix)

| File | Line | Issue |
|------|------|-------|
| `backend/src/handlers/transactions.ts` | 245 | Raw subtraction for final total (stored in DB) |
| `backend/src/services/analyticsService.ts` | 146 | Raw multiplication for revenue |
| `frontend/components/OrderPanel.tsx` | 36 | Raw arithmetic for subtotal |
| `frontend/contexts/PaymentContext.tsx` | 36-50 | Multiple raw arithmetic operations |

### High Priority Issues

| File | Line | Issue |
|------|------|-------|
| `backend/src/handlers/transactions.ts` | 228 | Raw addition for pre-discount total |
| `backend/src/services/analyticsService.ts` | 414-428 | Raw subtraction for comparisons |

### Medium Priority Issues

| File | Line | Issue |
|------|------|-------|
| `backend/src/handlers/transactions.ts` | 192, 204 | Raw subtraction for validation comparison |
| `backend/src/handlers/products.ts` | 28 | Raw multiplication for tax rate display |
| `backend/src/services/analyticsService.ts` | 425-428 | Raw subtraction for period comparison |

---

## 5. Compliance Matrix

| Component | Status | Notes |
|-----------|--------|-------|
| `dailyClosingService.ts` | ✅ Compliant | All calculations use money utilities |
| `dailyClosings.ts` | ✅ Compliant | Delegates to service |
| `products.ts` | ⚠️ Minor Issue | Tax rate display only |
| `stockItems.ts` | ✅ Compliant | No monetary calculations |
| `transactions.ts` | ⚠️ Partial | Core calculations use utilities, final total does not |
| `analyticsService.ts` | ⚠️ Partial | Revenue calculation uses raw arithmetic |
| `PaymentModal.tsx` | ✅ Compliant | All calculations use money utilities |
| `OrderPanel.tsx` | 🔴 Non-Compliant | Raw arithmetic throughout |
| `PaymentContext.tsx` | 🔴 Non-Compliant | Raw arithmetic throughout |

---

## 6. Recommendations

### Immediate Actions Required

1. **Fix `transactions.ts` line 245**: Replace with `subtractMoney(preDiscountTotal, discountAmount)`

2. **Fix `analyticsService.ts` line 146**: Replace with `multiplyMoney(item.price, item.quantity)`

3. **Fix `OrderPanel.tsx` line 36**: Import and use `multiplyMoney` and `addMoney`

4. **Fix `PaymentContext.tsx`**: Import and use all money utility functions for calculations

### Code Consistency

- `PaymentModal.tsx` correctly uses money utilities but `PaymentContext.tsx` (which it depends on) does not
- Backend has inconsistent usage between transactions and analytics
- Consider adding linting rules to enforce money utility usage

---

## 7. Floating-Point Error Examples

Without currency.js, these errors occur:
- `0.1 + 0.2` = `0.30000000000000004` (not `0.3`)
- `19.99 * 3` = `59.96999999999999` (not `59.97`)
- `10.10 - 10.00` = `0.10000000000000009` (not `0.10`)

These small errors can accumulate in financial calculations and cause:
- Incorrect transaction totals
- Validation failures
- Reconciliation discrepancies
- Incorrect analytics reports

---

Report generated: 2026-02-28
Review scope: Backend handlers, services, and frontend components performing monetary calculations
