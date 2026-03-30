# Investigation Report: Discount Recording Inconsistency

**Date:** 2026-03-30  
**Investigator:** AI Assistant  
**Status:** Investigation Complete  

---

## 1. Problem Statement

This investigation was initiated to verify a theory about how discounted transactions are recorded in the system across two different views:

**Theory to verify:**
1. In the **dashboard**, discounted amounts are subtracted from total revenue.
2. In the **analytics**, discounted amounts are added to total revenue.
3. Orders that are **fully complimentary** or **partially discounted** should not affect either the dashboard or analytics totals.

---

## 2. Key Definitions

| Term | Definition | Example from Data |
|------|------------|-------------------|
| **Regular Transaction** | A transaction with no discount applied. `discount = 0` and `status = 'completed'` | Transaction #513: subtotal=15.96, tax=3.04, total=19, discount=0 |
| **Partially Discounted Transaction** | A transaction where a discount is applied but does not cover the full pre-discount amount. `discount > 0` and `total > 0` and `status = 'completed'` | Transaction #492: subtotal=10.72, tax=1.28, total=1, discount=11, status='completed' |
| **Complimentary Transaction** | A transaction where the discount equals or exceeds the pre-discount total, resulting in a final total of 0. `total = 0` and `discount > 0` and `status = 'complimentary'` | Transaction #514: subtotal=15.12, tax=2.88, total=0, discount=18, status='complimentary' |
| **Pre-Discount Total** | The sum of subtotal + tax + tip before any discount is applied | For Transaction #492: 10.72 + 1.28 + 0 = 12.00 |
| **Gross Sales** | The total sales amount before discounts (used for reporting) | Calculated as sum of pre-discount totals |
| **Net Sales** | The actual revenue after discounts are applied | Calculated as gross sales - total discounts |

---

## 3. Methodology

### 3.1 Code Analysis
I examined the following source files to understand how discounts are handled:

1. **Dashboard Component:** `/home/pippo/tev2/frontend/components/dashboard/TotalSalesTicker.tsx`
2. **Daily Closing Service:** `/home/pippo/tev2/backend/src/services/dailyClosingService.ts`
3. **Analytics Service:** `/home/pippo/tev2/backend/src/services/analyticsService.ts`
4. **Transaction Handler:** `/home/pippo/tev2/backend/src/handlers/transactions.ts`
5. **Money Utilities:** `/home/pippo/tev2/backend/src/utils/money.ts`

### 3.2 Data Extraction
I queried the production database to obtain:
- Sample transactions from each category (regular, partially discounted, complimentary)
- Aggregate counts and totals for verification

### 3.3 Sample Data

From the database query results:

**Regular Transactions (No Discount):**
| ID | Subtotal | Tax | Tip | Total | Discount | Status |
|----|----------|-----|-----|-------|----------|--------|
| 513 | 15.96 | 3.04 | 0 | 19 | 0 | completed |
| 512 | 6.72 | 1.28 | 0 | 8 | 0 | completed |
| 511 | 6.72 | 1.28 | 0 | 8 | 0 | completed |

**Partially Discounted Transactions:**
| ID | Subtotal | Tax | Tip | Total | Discount | Status |
|----|----------|-----|-----|-------|----------|--------|
| 492 | 10.72 | 1.28 | 0 | 1 | 11 | completed |
| 463 | 12.40 | 1.60 | 0 | 4 | 10 | completed |
| 460 | 16.00 | 0 | 0 | 10 | 8 | completed |

**Complimentary Transactions (Fully Discounted):**
| ID | Subtotal | Tax | Tip | Total | Discount | Status |
|----|----------|-----|-----|-------|----------|--------|
| 514 | 15.12 | 2.88 | 0 | 0 | 18 | complimentary |
| 503 | 6.72 | 1.28 | 0 | 0 | 8 | complimentary |
| 469 | 6.72 | 1.28 | 0 | 0 | 8 | complimentary |

**Aggregate Data:**
- Total Transactions: 511
- No Discount: 478 (93.5%)
- Partially Discounted: 4 (0.8%)
- Complimentary: 35 (6.8%)
- Sum of all totals: 6,298
- Sum of all discounts: 2,018

---

## 4. Findings

### 4.1 Dashboard (TotalSalesTicker.tsx)

**Location:** Lines 19-28

**Code Analysis:**
```typescript
const dailyStats = useMemo(() => {
  const todaysTransactions = transactions.filter(t => isWithinBusinessDay(t.createdAt, businessDayStart));
  
  // grossSales is the sum of all transaction totals (before discounts)
  const grossSales = roundMoney(todaysTransactions.reduce((sum, t) => addMoney(sum, t.total), 0));
  // totalDiscounts is the sum of all discounts
  const totalDiscounts = roundMoney(todaysTransactions.reduce((sum, t) => addMoney(sum, t.discount || 0), 0));
  // netSales = grossSales - totalDiscounts (this matches backend calculation)
  const netSales = roundMoney(grossSales - totalDiscounts);
```

**Finding:**
- **The theory is INCORRECT for the dashboard.**
- The dashboard calculates `grossSales` as the sum of `t.total` (the **final** total after discount), not the pre-discount amount.
- The `totalDiscounts` is correctly summed from all `t.discount` values.
- The `netSales` is calculated as `grossSales - totalDiscounts`.

**Example Calculation:**
For a partially discounted transaction (ID #492):
- Subtotal: 10.72, Tax: 1.28, Discount: 11, Total: 1
- Pre-discount total: 10.72 + 1.28 = 12.00
- The dashboard adds `total = 1` to grossSales, not 12.00
- The dashboard adds `discount = 11` to totalDiscounts

This means for partially discounted transactions, the dashboard:
1. Adds the AFTER-discount total (1) to grossSales
2. Subtracts the full discount (11) from netSales
3. Net effect: 1 - 11 = -10 (which is incorrect)

---

### 4.2 Analytics (analyticsService.ts)

#### 4.2.1 Hourly Sales Analytics

**Location:** Lines 374-408

**Code Analysis:**
```typescript
for (const transaction of transactions) {
  const txTotal = decimalToNumber(transaction.total);
  const txSubtotal = decimalToNumber(transaction.subtotal);
  const txTax = decimalToNumber(transaction.tax);
  const txTip = decimalToNumber(transaction.tip);
  const txDiscount = decimalToNumber(transaction.discount);

  // For complimentary orders (total is 0 but discount > 0), use pre-discount amount for gross sales
  const isComplimentary = transaction.status === 'complimentary' || (txTotal === 0 && txDiscount > 0);
  const grossAmount = isComplimentary
    ? addMoney(addMoney(txSubtotal, txTax), txTip) // Pre-discount total for complimentary
    : txTotal; // Regular orders use actual total

  totalSales = addMoney(totalSales, grossAmount);
}
```

**Finding:**
- **The theory is INCORRECT for hourly sales analytics.**
- For regular and partially discounted transactions, `grossAmount = txTotal` (the after-discount total).
- For complimentary transactions, `grossAmount = subtotal + tax + tip` (the pre-discount total).
- The analytics does NOT add the discount to revenue; it uses the actual total for non-complimentary orders.

#### 4.2.2 Product Performance Analytics

**Location:** Lines 184-187

**Code Analysis:**
```typescript
const productMetrics = productMetricsMap.get(prodId)!;
productMetrics.totalQuantity += item.quantity;
productMetrics.totalRevenue = addMoney(productMetrics.totalRevenue, multiplyMoney(item.price, item.quantity));
productMetrics.transactionCount += 1;
```

**Finding:**
- Product performance analytics uses `item.price * item.quantity` for revenue.
- This is the **pre-discount** price of items sold.
- Discounts are NOT factored into product-level revenue calculations.
- This means product revenue totals will be higher than actual revenue when discounts exist.

---

### 4.3 Daily Closing Service (dailyClosingService.ts)

**Location:** Lines 60-116

**Code Analysis:**
```typescript
for (const transaction of transactions) {
  const txTotal = decimalToNumber(transaction.total);
  const txSubtotal = decimalToNumber(transaction.subtotal);
  const txTax = decimalToNumber(transaction.tax);
  const txTip = decimalToNumber(transaction.tip);
  const txDiscount = decimalToNumber(transaction.discount);

  // For complimentary orders (total is 0 but discount > 0), use pre-discount amount for gross sales
  const isComplimentary = transaction.status === 'complimentary' || (txTotal === 0 && txDiscount > 0);
  const grossAmount = isComplimentary
    ? addMoney(addMoney(txSubtotal, txTax), txTip) // Pre-discount total for complimentary
    : txTotal; // Regular orders use actual total

  // Track gross sales (total before discount)
  summary.grossSales = addMoney(summary.grossSales, grossAmount);

  // Track discounts
  summary.totalDiscounts = addMoney(summary.totalDiscounts, txDiscount || 0);
}

// Calculate net sales (gross - discounts)
summary.netSales = subtractMoney(summary.grossSales, summary.totalDiscounts);
```

**Finding:**
- The daily closing service uses the same logic as hourly sales analytics.
- For complimentary orders, `grossAmount = subtotal + tax + tip`.
- For regular/partially discounted orders, `grossAmount = total`.
- Net sales is calculated as `grossSales - totalDiscounts`.

---

### 4.4 Complimentary Orders

**Theory Point 3:** "Orders that are fully complimentary or partially discounted should not affect either the dashboard or analytics totals."

**Finding:**
- **The theory is INCORRECT.**
- Complimentary orders DO affect totals, but in different ways across different views:

**Dashboard:**
- `total` is 0 for complimentary orders
- `discount` is the full pre-discount amount
- Effect on grossSales: adds 0
- Effect on netSales: 0 - discount = negative contribution

**Analytics & Daily Closing:**
- Uses pre-discount total for `grossAmount`
- Then subtracts `discount` from netSales
- Net effect: (subtotal + tax + tip) - discount = 0
- This correctly results in 0 for complimentary orders

**Example for Transaction #514:**
- Subtotal: 15.12, Tax: 2.88, Discount: 18, Total: 0
- Pre-discount total: 15.12 + 2.88 = 18.00

| View | grossSales Contribution | totalDiscounts Contribution | netSales Effect |
|------|------------------------|----------------------------|-----------------|
| Dashboard | 0 | 18 | 0 - 18 = -18 |
| Analytics/Daily Closing | 18 | 18 | 18 - 18 = 0 |

---

## 5. Anomalies and Edge Cases

### 5.1 Dashboard Calculation Error for Partially Discounted Transactions

**Issue:** The dashboard incorrectly calculates `grossSales` as the sum of `total` (after-discount amount), then subtracts `totalDiscounts` to get `netSales`.

**Impact:** For partially discounted transactions, this results in double-counting discounts:
- `total` already has the discount subtracted
- Subtracting `discount` again results in negative contributions

**Example (Transaction #492):**
- Pre-discount: 12.00
- Discount: 11
- Total (stored): 1

**Dashboard calculation:**
- grossSales adds: 1
- totalDiscounts adds: 11
- netSales effect: 1 - 11 = -10

**Expected behavior:**
- grossSales should add: 12 (pre-discount total)
- totalDiscounts should add: 11
- netSales effect: 12 - 11 = 1 (matches stored total)

### 5.2 Product Revenue Inflation

**Issue:** Product performance analytics uses `item.price * item.quantity` without factoring in discounts.

**Impact:** When discounts exist, product revenue totals will be higher than actual revenue collected.

**Example:** If a 10 discount is applied to an order with items totaling 12, the product analytics will show 12 revenue, but the actual revenue collected is 2.

### 5.3 Inconsistent Gross Sales Definition

**Issue:** Different components use different definitions of "gross sales":
- **Dashboard:** Uses stored `total` (after discount)
- **Analytics/Daily Closing:** Uses pre-discount total for complimentary, after-discount for others
- **Product Analytics:** Uses pre-discount item prices

---

## 6. Recommendations

### 6.1 Critical: Fix Dashboard Gross Sales Calculation

**Location:** `/home/pippo/tev2/frontend/components/dashboard/TotalSalesTicker.tsx`

**Recommendation:** The dashboard should calculate grossSales using the same logic as the backend services. For consistency, use:
```typescript
// For each transaction, calculate pre-discount total
const preDiscountTotal = addMoney(addMoney(t.subtotal, t.tax), t.tip);
const grossSales = roundMoney(todaysTransactions.reduce((sum, t) => addMoney(sum, preDiscountTotal), 0));
```

**Verification:** After fix, netSales should equal sum of all `total` values for regular and partially discounted transactions, plus 0 for complimentary transactions.

### 6.2 High: Standardize Gross Sales Definition

**Recommendation:** Create a shared utility function for calculating "pre-discount total" that all services use consistently. This should be documented as the standard definition of gross sales.

### 6.3 Medium: Consider Discount Allocation to Products

**Recommendation:** For product performance analytics, consider whether discounts should be proportionally allocated to products based on their share of the order total. This would make product revenue metrics more accurate.

### 6.4 Testing Requirements

Before implementing any fixes, create test cases covering:
1. Regular transactions (no discount)
2. Partially discounted transactions
3. Fully complimentary transactions
4. Mixed transaction sets

Verify that:
- Dashboard grossSales = sum of pre-discount totals
- Dashboard totalDiscounts = sum of all discounts
- Dashboard netSales = grossSales - totalDiscounts
- Analytics totals match dashboard totals
- Product analytics align with actual revenue

---

## 7. Summary

| Theory Point | Finding | Evidence |
|--------------|---------|----------|
| 1. Dashboard subtracts discounts from revenue | **INCORRECT** | Dashboard uses after-discount `total` for grossSales, then subtracts discounts, causing double-counting |
| 2. Analytics adds discounts to revenue | **INCORRECT** | Analytics uses after-discount total for non-complimentary, pre-discount for complimentary |
| 3. Complimentary/discounted orders don't affect totals | **INCORRECT** | Complimentary orders DO affect totals; dashboard has negative contribution bug |

**Actual Behavior:**

| Transaction Type | Dashboard grossSales | Dashboard netSales | Analytics grossAmount |
|------------------|---------------------|-------------------|----------------------|
| Regular (no discount) | `total` | `total - 0 = total` | `total` |
| Partially Discounted | `total` (after discount) | `total - discount` (double-counted) | `total` (after discount) |
| Complimentary | `0` | `0 - discount` (negative!) | `subtotal + tax + tip` (pre-discount) |

The core issue is that the dashboard incorrectly uses the stored `total` field (which already has discounts subtracted) as the basis for grossSales, then subtracts discounts again to calculate netSales. This results in discounts being applied twice for partially discounted transactions, and negative contributions for complimentary transactions.

---

## 8. Appendix: Code References

### A. Transaction Storage (transactions.ts, lines 166-169)
```typescript
const discountAmount = discount || 0;
const preDiscountTotal = addMoney(addMoney(calculatedSubtotal, validatedTax), tip || 0);
const finalTotal = subtractMoney(preDiscountTotal, discountAmount);
const finalStatus = finalTotal <= 0 && discountAmount > 0 ? 'complimentary' : 'completed';
```

### B. Dashboard Calculation (TotalSalesTicker.tsx, lines 24-28)
```typescript
const grossSales = roundMoney(todaysTransactions.reduce((sum, t) => addMoney(sum, t.total), 0));
const totalDiscounts = roundMoney(todaysTransactions.reduce((sum, t) => addMoney(sum, t.discount || 0), 0));
const netSales = roundMoney(grossSales - totalDiscounts);
```

### C. Analytics Gross Amount (analyticsService.ts, lines 394-399)
```typescript
const isComplimentary = transaction.status === 'complimentary' || (txTotal === 0 && txDiscount > 0);
const grossAmount = isComplimentary
  ? addMoney(addMoney(txSubtotal, txTax), txTip) // Pre-discount total for complimentary
  : txTotal; // Regular orders use actual total
```

---

**Report End**
