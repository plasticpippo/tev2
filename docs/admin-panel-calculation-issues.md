# Admin Panel Calculation Issues Documentation

This document provides a comprehensive summary of all calculation-related issues identified in the POS (Point of Sale) system's admin panel. The issues are organized by severity level with detailed descriptions, impacts, and recommended fixes.

---

## Table of Contents

1. [Critical Severity Issues](#critical-severity-issues)
2. [High Severity Issues](#high-severity-issues)
3. [Medium Severity Issues](#medium-severity-issues)
4. [Low Severity Issues](#low-severity-issues)
5. [Consistency Issues](#consistency-issues)
6. [Summary and Prioritized Recommendations](#summary-and-prioritized-recommendations)
7. [Implementation Approach](#implementation-approach)

---

## Critical Severity Issues

### Backend Issues

#### 1. Missing Server-Side Subtotal Validation

**File:** [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:64-67)

**Lines:** 64-67, 118

**Description:** The backend does not validate the subtotal sent by the frontend. It accepts the transaction data without verifying if the line item prices and quantities match the claimed subtotal.

**Impact:** 
- Frontend can manipulate prices and quantities
- Incorrect transaction totals can be recorded
- Potential financial loss or incorrect reporting
- No audit trail for discrepancies

**Suggested Fix:**

```typescript
// Add validation function in transactions.ts
function validateTransactionItems(items: TransactionItem[], subtotal: number): boolean {
  const calculatedSubtotal = items.reduce((sum, item) => {
    const itemTotal = Number((item.price * item.quantity).toFixed(2));
    return sum + itemTotal;
  }, 0);
  
  return Math.abs(calculatedSubtotal - subtotal) < 0.01; // Allow 1 cent tolerance
}

// Use in handler
if (!validateTransactionItems(req.body.items, req.body.subtotal)) {
  return res.status(400).json({ 
    error: 'Invalid transaction: subtotal mismatch' 
  });
}
```

---

#### 2. No Tax Calculation/Validation

**File:** [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:64-67)

**Lines:** 64-67, 118

**Description:** The backend does not calculate or validate the tax amount sent by the frontend. It accepts the frontend-calculated tax without verification.

**Impact:**
- Tax amounts may be incorrect
- Compliance issues with tax reporting
- Potential tax revenue loss
- No audit trail for tax calculations

**Suggested Fix:**

```typescript
// Add tax calculation function
function calculateTax(subtotal: number, taxRate: number): number {
  return Number((subtotal * taxRate).toFixed(2));
}

function validateTax(subtotal: number, taxRate: number, claimedTax: number): boolean {
  const calculatedTax = calculateTax(subtotal, taxRate);
  return Math.abs(calculatedTax - claimedTax) < 0.01;
}

// Use in handler
const calculatedTax = calculateTax(req.body.subtotal, req.body.taxRate);
if (!validateTax(req.body.subtotal, req.body.taxRate, req.body.tax)) {
  return res.status(400).json({ 
    error: 'Invalid transaction: tax calculation mismatch' 
  });
}
```

---

#### 3. Floating-Point Precision in Daily Closing Service

**File:** [`backend/src/services/dailyClosingService.ts`](backend/src/services/dailyClosingService.ts:48-50)

**Lines:** 48-50, 60, 71

**Description:** Monetary calculations in daily closing use floating-point arithmetic without proper rounding, leading to precision errors in totals.

**Impact:**
- Incorrect daily closing totals
- Cash reconciliation discrepancies
- Financial reporting inaccuracies
- Potential audit failures

**Suggested Fix:**

```typescript
// Use helper functions
function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function addMoney(...values: number[]): number {
  return roundMoney(values.reduce((sum, v) => sum + v, 0));
}

// Apply to calculations
const grossSales = addMoney(...transactions.map(t => roundMoney(t.total)));
const totalDiscounts = addMoney(...transactions.map(t => roundMoney(t.discount || 0)));
const netSales = grossSales - totalDiscounts;
```

---

### Frontend Issues

No Critical severity issues found in the frontend.

---

## High Severity Issues

### Backend Issues

#### 4. Missing Numeric Validation for Monetary Values

**File:** [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:64-67)

**Lines:** 64-67

**Description:** No validation to ensure monetary values are proper numbers. Non-numeric or malformed values could be stored.

**Impact:**
- Database errors
- Calculation failures
- Potential security issues with type coercion

**Suggested Fix:**

```typescript
function validateNumeric(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    throw new Error(`Invalid ${fieldName}: must be a valid number`);
  }
  return value;
}

// Use for all monetary fields
const subtotal = validateNumeric(req.body.subtotal, 'subtotal');
const tax = validateNumeric(req.body.tax, 'tax');
const total = validateNumeric(req.body.total, 'total');
```

---

#### 5. Incomplete Payment Method Handling (Dashboard)

**File:** [`frontend/components/dashboard/TotalSalesTicker.tsx`](frontend/components/dashboard/TotalSalesTicker.tsx:23-35), [`frontend/components/dashboard/TillStatus.tsx`](frontend/components/dashboard/TillStatus.tsx:18-27)

**Lines:** 23-35 in TotalSalesTicker, 18-27 in TillStatus

**Description:** Dashboard components only handle Cash and Card payment methods, ignoring other payment types.

**Impact:**
- Incomplete sales reporting
- Missing payment method data in dashboards
- Incorrect financial summaries

**Suggested Fix:**

```typescript
// TotalSalesTicker.tsx - handle all payment methods
const paymentMethods = ['cash', 'card', 'bank_transfer', 'other', 'split'];
const salesByMethod = transactions.reduce((acc, tx) => {
  if (tx.paymentMethod && paymentMethods.includes(tx.paymentMethod)) {
    acc[tx.paymentMethod] = (acc[tx.paymentMethod] || 0) + tx.total;
  }
  return acc;
}, {} as Record<string, number>);

// TillStatus.tsx - handle all payment methods
const handlePaymentMethod = (method: string, total: number) => {
  const normalizedMethod = method?.toLowerCase() || 'other';
  if (normalizedMethod === 'cash') cashTotal += total;
  else if (normalizedMethod === 'card') cardTotal += total;
  else otherTotal += total; // Handle all other methods
};
```

---

### Frontend Issues

#### 6. Floating-Point Arithmetic Errors in PaymentModal

**File:** [`frontend/components/PaymentModal.tsx`](frontend/components/PaymentModal.tsx:34-43)

**Lines:** 34-43

**Description:** The PaymentModal performs floating-point arithmetic on monetary values without proper rounding, causing calculation errors.

**Impact:**
- Incorrect change calculation
- Overcharging or undercharging customers
- Potential financial discrepancies

**Suggested Fix:**

```typescript
// Helper functions
const round = (value: number): number => Math.round(value * 100) / 100;
const multiply = (a: number, b: number): number => round(a * b);
const subtract = (a: number, b: number): number => round(a - b);
const add = (a: number, b: number): number => round(a + b);

// Apply to calculations
const subtotal = items.reduce((sum, item) => 
  add(sum, multiply(item.price, item.quantity)), 0);
const discountAmount = multiply(subtotal, discount / 100);
const taxableAmount = subtract(subtotal, discountAmount);
const tax = multiply(taxableAmount, effectiveTaxRate);
const total = add(taxableAmount, tax);
```

---

#### 7. No Null/Undefined Checks for Daily Closing Summary

**File:** [`frontend/components/DailyClosingSummaryView.tsx`](frontend/components/DailyClosingSummaryView.tsx)

**Description:** No null/undefined checks for `closing.summary`, nested payment methods data, or nested tills data.

**Impact:**
- Application crashes when data is missing
- Poor user experience with error messages
- Potential data display issues

**Suggested Fix:**

```typescript
// Add safe navigation helpers
const get = <T,>(obj: T | null | undefined, path: string, defaultValue: any = 0): any => {
  if (!obj) return defaultValue;
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue;
    result = (result as any)[key];
  }
  return result ?? defaultValue;
};

// Use in component
const summary = closing?.summary;
const paymentMethods = get(summary, 'paymentMethods', {});
const tills = get(summary, 'tills', []);
const totalSales = get(summary, 'totalSales', 0);
```

---

#### 8. Missing Validation for effectiveTaxRate

**File:** [`frontend/components/PaymentModal.tsx`](frontend/components/PaymentModal.tsx:37)

**Lines:** 37, 42

**Description:** The `effectiveTaxRate` value is used without validation, potentially causing NaN or undefined calculations.

**Impact:**
- Calculation failures
- Incorrect tax amounts
- Potential crashes

**Suggested Fix:**

```typescript
const effectiveTaxRate = taxRate !== undefined && taxRate !== null 
  ? Number(taxRate) 
  : 0;

if (isNaN(effectiveTaxRate) || effectiveTaxRate < 0) {
  console.error('Invalid tax rate:', taxRate);
  // Use default or show error
}
```

---

## Medium Severity Issues

### Backend Issues

#### 9. Floating-Point Precision Issues in Analytics Service

**File:** [`backend/src/services/analyticsService.ts`](backend/src/services/analyticsService.ts:145)

**Lines:** 145, 164, 189, 338, 342, 356, 375

**Description:** Monetary calculations in the analytics service use floating-point arithmetic without proper rounding.

**Impact:**
- Inaccurate analytics data
- Incorrect trend analysis
- Misleading business insights

**Suggested Fix:**

```typescript
// Add at top of file
const round = (value: number): number => Math.round(value * 100) / 100;

// Apply to all monetary calculations
const revenue = round(item.quantity * item.price);
const averageOrderValue = round(totalRevenue / totalOrders);
const growthRate = round(((currentPeriod - previousPeriod) / previousPeriod) * 100);
```

---

#### 10. Hour Bucket Calculation Ignores Start Minutes

**File:** [`backend/src/services/analyticsService.ts`](backend/src/services/analyticsService.ts:305)

**Lines:** 305, 313-317

**Description:** Hour bucket calculations use floor division on hours, ignoring the start minutes of the time range.

**Impact:**
- Incorrect hourly analytics
- Data assigned to wrong time buckets
- Inaccurate peak hour identification

**Suggested Fix:**

```typescript
// Instead of:
const hourBucket = new Date(timestamp).getHours();

// Use:
const date = new Date(timestamp);
const hourBucket = date.getHours() + (date.getMinutes() / 60);

// Or create proper time boundaries
function getHourBucket(startTime: Date, endTime: Date): number {
  const midTime = new Date((startTime.getTime() + endTime.getTime()) / 2);
  return midTime.getHours();
}
```

---

#### 11. Percentage Calculation Edge Cases

**File:** [`backend/src/services/analyticsService.ts`](backend/src/services/analyticsService.ts:397-399)

**Lines:** 397-399, 410-412

**Description:** Percentage calculations don't handle division by zero or negative values properly.

**Impact:**
- NaN or Infinity values in analytics
- Incorrect percentage displays
- Potential crashes in frontend

**Suggested Fix:**

```typescript
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return round(((current - previous) / Math.abs(previous)) * 100);
}
```

---

#### 12. Array Index Assumption in Hourly Comparison

**File:** [`backend/src/services/analyticsService.ts`](backend/src/services/analyticsService.ts:395)

**Line:** 395

**Description:** Code assumes arrays have data at specific indices without checking array length.

**Impact:**
- Undefined values in calculations
- Incorrect comparisons
- Potential runtime errors

**Suggested Fix:**

```typescript
// Instead of:
const previousValue = previousHourlyData[hourIndex]?.value || 0;

// Add length validation
if (hourIndex >= 0 && hourIndex < previousHourlyData.length) {
  previousValue = previousHourlyData[hourIndex].value || 0;
}
```

---

#### 13. No Rounding in Average Calculations

**File:** [`backend/src/services/analyticsService.ts`](backend/src/services/analyticsService.ts:164)

**Lines:** 164, 356, 375

**Description:** Average calculations don't round results, leading to long decimal values.

**Impact:**
- Display of impractical decimal places
- Potential accumulation of floating-point errors

**Suggested Fix:**

```typescript
const averageOrderValue = round(totalOrders > 0 
  ? totalRevenue / totalOrders 
  : 0);
```

---

#### 14. Floating-Point Arithmetic in Transactions Handler

**File:** [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:118)

**Lines:** 118, 135

**Description:** Calculations in the transactions handler use floating-point arithmetic without rounding.

**Impact:**
- Small discrepancies in transaction totals
- Potential accumulation of errors over time

**Suggested Fix:**

```typescript
// Apply rounding to all calculations
const lineTotal = round(item.price * item.quantity);
const transactionTotal = round(items.reduce((sum, i) => sum + round(i.price * i.quantity), 0));
```

---

#### 15. No Negative Value Prevention for Core Fields

**File:** [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts:64-67)

**Lines:** 64-67

**Description:** No validation to prevent negative values for prices, quantities, discounts, etc.

**Impact:**
- Invalid transaction data
- Potential financial calculation errors

**Suggested Fix:**

```typescript
function validatePositive(value: number, fieldName: string): void {
  if (value < 0) {
    throw new Error(`${fieldName} cannot be negative`);
  }
}

validatePositive(price, 'price');
validatePositive(quantity, 'quantity');
validatePositive(discount, 'discount');
```

---

### Frontend Issues

#### 16. Floating-Point Precision in Dashboard Components

**File:** [`frontend/components/dashboard/TotalSalesTicker.tsx`](frontend/components/dashboard/TotalSalesTicker.tsx:23-35)

**Lines:** 23-35

**Description:** Dashboard components perform calculations without rounding, leading to display of long decimal numbers.

**Impact:**
- Confusing displays for users
- Potential display layout issues
- User trust issues

**Suggested Fix:**

```typescript
// Apply rounding to display values
const formatCurrency = (value: number): string => {
  const rounded = Math.round((value || 0) * 100) / 100;
  return rounded.toFixed(2);
};

// Use in JSX
<span>€{formatCurrency(totalSales)}</span>
```

---

#### 17. Discount Not Applied Proportionally to Tax

**File:** [`frontend/components/PaymentModal.tsx`](frontend/components/PaymentModal.tsx:52-53)

**Lines:** 52-53

**Description:** Discount is subtracted from subtotal before tax calculation, but the implementation may not handle all edge cases correctly.

**Impact:**
- Incorrect tax calculations on discounted orders
- Potential tax overpayment or underpayment

**Suggested Fix:**

```typescript
// Correct order of operations
const subtotal = items.reduce((sum, item) => 
  add(sum, multiply(item.price, item.quantity)), 0);
const discountAmount = multiply(subtotal, discount / 100);
const taxableAmount = subtract(subtotal, discountAmount); // Tax base after discount
const tax = multiply(taxableAmount, effectiveTaxRate); // Tax on discounted amount
const total = add(taxableAmount, tax);
```

---

#### 18. No Rounding on Final Total

**File:** [`frontend/components/PaymentModal.tsx`](frontend/components/PaymentModal.tsx:53)

**Line:** 53

**Description:** Final total calculation doesn't apply rounding, potentially showing many decimal places.

**Impact:**
- Confusing user interface
- Potential payment processing issues

**Suggested Fix:**

```typescript
const total = round(add(taxableAmount, tax));
```

---

#### 19. Missing Null/Undefined Safety in Dashboard

**File:** [`frontend/components/dashboard/TillStatus.tsx`](frontend/components/dashboard/TillStatus.tsx:18-27)

**Lines:** 18-27

**Description:** Dashboard components don't handle null/undefined values gracefully.

**Impact:**
- Potential runtime errors
- Broken UI when data is missing

**Suggested Fix:**

```typescript
// Add safe access
const safeTransactions = transactions || [];
const cashTotal = safeTransactions
  .filter(t => t.paymentMethod?.toLowerCase() === 'cash')
  .reduce((sum, t) => sum + (t.total || 0), 0);
```

---

## Low Severity Issues

### Backend Issues

#### 20. Unsafe Till Key Generation

**File:** [`backend/src/services/dailyClosingService.ts`](backend/src/services/dailyClosingService.ts:63)

**Line:** 63

**Description:** Till key generation doesn't sanitize or validate till identifiers.

**Impact:**
- Potential key collisions
- Incorrect data aggregation
- Security concerns with special characters

**Suggested Fix:**

```typescript
function generateTillKey(tillId: string): string {
  const sanitized = String(tillId).replace(/[^a-zA-Z0-9-_]/g, '_');
  return `till_${sanitized}`;
}
```

---

#### 21. No Payment Method Validation

**File:** [`backend/src/services/dailyClosingService.ts`](backend/src/services/dailyClosingService.ts:53-60)

**Lines:** 53-60

**Description:** No validation of payment method values in daily closing calculations.

**Impact:**
- Unknown payment methods ignored
- Incomplete daily totals
- Data inconsistencies

**Suggested Fix:**

```typescript
const VALID_PAYMENT_METHODS = ['cash', 'card', 'bank_transfer', 'other', 'split'];

function normalizePaymentMethod(method: string | null | undefined): string {
  if (!method) return 'other';
  const normalized = method.toLowerCase();
  return VALID_PAYMENT_METHODS.includes(normalized) ? normalized : 'other';
}
```

---

#### 22. Missing Discount Tracking

**File:** [`backend/src/services/dailyClosingService.ts`](backend/src/services/dailyClosingService.ts:35-42)

**Lines:** 35-42

**Description:** Discount amounts are not tracked separately in daily closing summaries.

**Impact:**
- No visibility into discount trends
- Difficulty tracking promotional effectiveness
- Incomplete financial reporting

**Suggested Fix:**

```typescript
const dailySummary = {
  grossSales: round(totalSales),
  totalDiscounts: round(transactions.reduce((sum, t) => 
    sum + (t.discount || 0), 0)),
  netSales: round(totalSales - totalDiscounts),
  // ... other fields
};
```

---

### Frontend Issues

#### 23. Array Mutation Side Effect in TillStatus

**File:** [`frontend/components/dashboard/TillStatus.tsx`](frontend/components/dashboard/TillStatus.tsx:30)

**Line:** 30

**Description:** The component mutates the transactions array directly, causing potential side effects.

**Impact:**
- Unexpected behavior
- Potential bugs in other components using same data
- Difficult to debug

**Suggested Fix:**

```typescript
// Use immutable operations
const sortedTills = [...tills].sort((a, b) => 
  (a.name || '').localeCompare(b.name || ''));
```

---

#### 24. No Validation for Negative Item Prices/Quantities

**File:** [`frontend/components/PaymentModal.tsx`](frontend/components/PaymentModal.tsx:30)

**Lines:** 30, 35

**Description:** No validation to ensure item prices and quantities are positive numbers.

**Impact:**
- Invalid calculations
- Potential security issues
- Data integrity problems

**Suggested Fix:**

```typescript
const validateItems = (items: any[]): void => {
  for (const item of items) {
    if (item.price < 0 || item.quantity < 0) {
      throw new Error('Invalid item: price and quantity must be positive');
    }
  }
};
```

---

## Consistency Issues

### 1. Transaction Totals Discrepancy

**Description:** Frontend sends a `total` field that the backend ignores and recalculates independently.

**Issue:** 
- Frontend: Sends pre-calculated `total`
- Backend: Recalculates total from line items

**Impact:** 
- Inconsistency between frontend and backend totals
- Potential disputes if calculations differ

**Suggested Fix:**

```typescript
// Backend should validate and accept or recalculate
// Option 1: Trust but validate
const calculatedTotal = calculateTotal(items, taxRate, discount);
if (Math.abs(calculatedTotal - receivedTotal) > 0.01) {
  // Log warning but use calculated value
  console.warn('Total mismatch, using calculated value');
}
```

---

### 2. Tax Calculations Not Validated

**Description:** No backend validation of frontend-calculated tax amounts.

**Issue:**
- Frontend calculates tax
- Backend accepts without verification

**Impact:**
- Tax discrepancies
- Compliance issues

**Suggested Fix:**

```typescript
// Backend should always calculate tax
const expectedTax = calculateTax(subtotal, taxRate);
if (Math.abs(expectedTax - receivedTax) > 0.01) {
  throw new Error('Tax calculation mismatch');
}
```

---

### 3. Status Determination Logic Differs

**Description:** Frontend and backend use different logic to determine transaction status.

**Frontend:** `total === 0 && discount > 0`
**Backend:** `finalTotal <= 0`

**Impact:**
- Different status shown to users vs stored in database
- Confusion in reporting

**Suggested Fix:**

```typescript
// Standardize status calculation
function determineStatus(subtotal: number, discount: number, tax: number): string {
  const finalTotal = subtotal - discount + tax;
  if (finalTotal <= 0) return 'cancelled';
  if (discount > 0 && subtotal - discount <= 0) return 'cancelled';
  return 'completed';
}
```

---

### 4. No Explicit Rounding

**Description:** No explicit rounding during calculations - only display formatting.

**Issue:**
- Calculations use floating-point arithmetic
- Rounding only applied at display time

**Impact:**
- Accumulation of floating-point errors
- Potential display/calculation mismatches

**Suggested Fix:**

```typescript
// Apply rounding at each calculation step
const roundAtEachStep = true; // Configuration option

function calculateWithRounding(value: number): number {
  return roundAtEachStep ? round(value) : value;
}
```

---

## Summary and Prioritized Recommendations

### Priority 1: Critical Fixes (Immediate Action Required)

1. **Add server-side subtotal validation** - Prevents frontend manipulation of transaction totals
2. **Add tax calculation/validation on backend** - Ensures tax compliance and accuracy
3. **Fix floating-point precision in daily closing** - Ensures accurate financial reporting

### Priority 2: High Priority (Next Sprint)

4. **Add numeric validation for all monetary fields** - Prevents invalid data entry
5. **Handle all payment methods in dashboard** - Complete financial visibility
6. **Fix floating-point errors in PaymentModal** - Accurate customer transactions
7. **Add null/undefined checks in DailyClosingSummaryView** - Prevent crashes

### Priority 3: Medium Priority (Within Current Quarter)

8. **Fix floating-point precision in Analytics Service** - Accurate business insights
9. **Fix hour bucket calculations** - Correct time-based analytics
10. **Handle percentage calculation edge cases** - Prevent NaN/Infinity
11. **Add array index safety checks** - Prevent runtime errors
12. **Apply rounding to all average calculations** - Clean data presentation
13. **Add negative value prevention** - Data integrity

### Priority 4: Low Priority (Backlog)

14. **Sanitize till key generation** - Minor data quality
15. **Validate payment methods** - Minor data quality
16. **Add discount tracking** - Reporting enhancement
17. **Fix array mutation side effects** - Code quality
18. **Add item validation** - Data integrity

### Priority 5: Consistency (Ongoing)

19. **Standardize total calculation** - Ensure frontend/backend alignment
20. **Standardize tax validation** - Ensure frontend/backend alignment
21. **Standardize status determination** - Ensure frontend/backend alignment
22. **Implement explicit rounding strategy** - Consistent calculations throughout

---

## Implementation Approach

### Phase 1: Critical Fixes (Week 1-2)

1. Create shared utility functions for money calculations:
   - `roundMoney(value: number): number`
   - `addMoney(...values: number[]): number`
   - `subtractMoney(a: number, b: number): number`
   - `multiplyMoney(a: number, b: number): number`

2. Implement backend validation in transactions handler:
   - Subtotal validation
   - Tax calculation and validation
   - Numeric validation
   - Negative value prevention

3. Test critical paths thoroughly

### Phase 2: Frontend Fixes (Week 3-4)

1. Apply rounding utilities in PaymentModal
2. Add null/undefined safety in dashboard components
3. Handle all payment methods
4. Add proper validation

### Phase 3: Analytics Fixes (Week 5-6)

1. Fix floating-point precision in analytics service
2. Fix hour bucket calculations
3. Add edge case handling for percentages
4. Add array safety checks

### Phase 4: Consistency (Week 7-8)

1. Audit all frontend/backend calculations
2. Standardize status determination
3. Document calculation standards
4. Add integration tests for calculations

### Testing Strategy

1. **Unit Tests**: Test each utility function with edge cases
2. **Integration Tests**: Test frontend/backend communication
3. **E2E Tests**: Test complete transaction flows
4. **Regression Tests**: Ensure fixes don't break existing functionality

### Code Review Checklist

- [ ] All monetary calculations use rounding utilities
- [ ] All monetary values validated for type and range
- [ ] Null/undefined handling for all data access
- [ ] Payment method handling covers all cases
- [ ] Frontend and backend calculations produce same results

---

## Appendix: Utility Functions Reference

```typescript
// backend/src/utils/money.ts

/**
 * Rounds a monetary value to 2 decimal places
 */
export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Adds multiple monetary values
 */
export function addMoney(...values: number[]): number {
  return roundMoney(values.reduce((sum, v) => sum + v, 0));
}

/**
 * Subtracts monetary values
 */
export function subtractMoney(a: number, b: number): number {
  return roundMoney(a - b);
}

/**
 * Multiplies monetary values
 */
export function multiplyMoney(a: number, b: number): number {
  return roundMoney(a * b);
}

/**
 * Calculates percentage with edge case handling
 */
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return roundMoney(((current - previous) / Math.abs(previous)) * 100);
}

/**
 * Validates a numeric value
 */
export function validateNumeric(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
    throw new Error(`Invalid ${fieldName}: must be a valid number`);
  }
  return value;
}

/**
 * Validates a positive number
 */
export function validatePositive(value: number, fieldName: string): void {
  if (value < 0) {
    throw new Error(`${fieldName} cannot be negative`);
  }
}
```

---

## Recommended npm Package for Currency Calculations

While the manual utility functions in the [Appendix](#appendix-utility-functions-reference) provide a solid foundation for handling floating-point precision issues, using a dedicated library is recommended for more robust and maintainable solutions. The following sections provide guidance on selecting and implementing a currency calculation library.

### Primary Recommendation: currency.js

A lightweight, purpose-built library for handling currency calculations that solves common floating-point precision issues.

**Installation:**

```bash
npm install currency.js
```

**Bundle Size:** 1.8 KB gzipped

**Why it's recommended for POS systems:**
- Purpose-built for currency operations
- Automatic precision handling (avoids 0.1 + 0.2 = 0.30000000000000004)
- Built-in formatting support
- Excellent TypeScript support
- Minimal bundle size impact

---

### Quick Usage Examples

#### Basic Operations

```typescript
import currency from 'currency.js';

// Solves 0.1 + 0.2 = 0.30000000000000004
currency(0.1).add(0.2).value; // 0.30

// Multiplication with precision
currency(19.99).multiply(2).value; // 39.98

// Subtraction
currency(100).subtract(25.50).value; // 74.50
```

#### POS Transaction Example

```typescript
import currency from 'currency.js';

interface CartItem {
  price: number;
  qty: number;
}

const items: CartItem[] = [
  { price: 12.99, qty: 2 },
  { price: 5.50, qty: 1 }
];

// Calculate subtotal with proper precision
const subtotal = items.reduce((sum, item) => 
  sum.add(currency(item.price).multiply(item.qty)), 
  currency(0)
);

// Calculate 22% VAT
const tax = subtotal.multiply(0.22);

// Calculate total
const total = subtotal.add(tax);

// Format for display (Euro)
total.format(); // "€35.48"
```

#### Split Payment Example

```typescript
import currency from 'currency.js';

const total = currency(100);
const splitCount = 3;

// Distribute evenly
const splits = total.distribute(splitCount);
// [currency(33.33), currency(33.33), currency(33.34)]

// Each person's share
splits[0].format(); // "€33.33"
splits[2].format(); // "€33.34" (remainder handling)
```

---

### Comparison Table

| Package | Bundle Size | Best For | POS Fit | Key Features |
|---------|-------------|----------|---------|-------------|
| **currency.js** | 1.8 KB | Currency/money | 5/5 | Formatting, distribute, immutable |
| **big.js** | 2.8 KB | Simple math | 4/5 | Simple API, arbitrary precision |
| **decimal.js** | 6.4 KB | Complex calculations | 4/5 | Full math operations, trigonometry |
| **dinero.js** | 1.9 KB | Multi-currency | 4/5 | Multi-currency, currency conversion |

**Recommendation for POS:** currency.js is the optimal choice due to its:
- Smallest bundle size among purpose-built currency libraries
- Built-in formatting with currency symbols
- `distribute()` method for split payments (common in POS scenarios)
- Immutable operations (prevents accidental mutations)
- TypeScript support out of the box

---

### Migration Steps

#### Step 1: Install in Both Frontend and Backend

```bash
# Frontend
cd frontend && npm install currency.js

# Backend
cd backend && npm install currency.js
```

#### Step 2: Create Shared Utility Functions

Create a new utility file to wrap currency.js:

```typescript
// frontend/src/utils/currency.ts
import currency from 'currency.js';

// Configure default currency (Euro)
const defaultCurrency = {
  symbol: '€',
  decimal: '.',
  separator: ',',
  precision: 2
};

export const formatCurrency = (value: number): string => {
  return currency(value, defaultCurrency).format();
};

export const add = (a: number, b: number): number => {
  return currency(a).add(b).value;
};

export const subtract = (a: number, b: number): number => {
  return currency(a).subtract(b).value;
};

export const multiply = (a: number, b: number): number => {
  return currency(a).multiply(b).value;
};

export const divide = (a: number, b: number): number => {
  return currency(a).divide(b).value;
};

export const distribute = (value: number, count: number): number[] => {
  return currency(value).distribute(count).map(c => c.value);
};
```

#### Step 3: Update Affected Files

**Frontend files to update:**
- `frontend/components/PaymentModal.tsx` - Replace manual rounding with currency.js
- `frontend/components/DailyClosingSummaryView.tsx` - Use formatting utilities
- `frontend/components/dashboard/TotalSalesTicker.tsx` - Use formatting utilities
- `frontend/components/dashboard/TillStatus.tsx` - Use formatting utilities

**Backend files to update:**
- `backend/src/handlers/transactions.ts` - Replace manual rounding
- `backend/src/services/dailyClosingService.ts` - Replace manual rounding
- `backend/src/services/analyticsService.ts` - Replace manual rounding

#### Step 4: Gradual Migration

1. Start with PaymentModal (most critical for customer-facing accuracy)
2. Update daily closing service (financial reporting)
3. Update analytics service (business insights)
4. Update dashboard components (display only)

---

### Why currency.js Over Alternatives

1. **Purpose-built for currency:** Unlike big.js or decimal.js which are general-purpose math libraries, currency.js is designed specifically for money calculations.

2. **Smallest relevant bundle:** At 1.8 KB gzipped, it adds minimal overhead compared to using a general-purpose library.

3. **Built-in formatting:** No need for additional formatting libraries:
   ```typescript
   currency(1234.56).format(); // "€1,234.56"
   ```

4. **`distribute()` for split payments:** Essential for POS scenarios where a bill needs to be split among multiple people:
   ```typescript
   currency(100).distribute(3); // Handles remainder automatically
   ```

5. **Excellent TypeScript support:** Full type definitions included, no additional packages needed.

6. **Immutable operations:** Each operation returns a new instance, preventing accidental mutations:
   ```typescript
   const a = currency(10);
   const b = a.add(5); // a is still 10, b is 15
   ```

---

### Additional Considerations

#### Server-Side Validation

Even when using currency.js on the frontend, always implement server-side validation in the backend as documented in the Critical Issues section. The backend should:

1. Recalculate totals independently
2. Compare with frontend-submitted values
3. Reject requests with significant discrepancies (>0.01)

#### Database Storage

Store monetary values as integers (cents) in the database to avoid floating-point issues at rest:

```typescript
// Before storing
const storedValue = Math.round(currencyAmount * 100);

// After retrieving
const displayValue = storedValue / 100;
```

#### Testing

Test edge cases with currency.js:

```typescript
import currency from 'currency.js';

// Test: 0.1 + 0.2
console.assert(currency(0.1).add(0.2).value === 0.3);

// Test: Very large numbers
console.assert(currency(9999999.99).add(0.01).value === 10000000);

// Test: Very small numbers
console.assert(currency(0.01).subtract(0.01).value === 0);

// Test: Division
console.assert(currency(10).divide(3).value === 3.33);
```

---

*Document Version: 1.1*
*Last Updated: 2026-02-22*
*Author: Documentation Specialist*
