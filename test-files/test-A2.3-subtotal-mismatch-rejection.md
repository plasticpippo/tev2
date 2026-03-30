# Test A2.3: Subtotal Mismatch Rejection

**Test Date:** 2026-03-29  
**Test Type:** Backend Validation - Subtotal Calculation  
**Status:** PASSED

---

## Test Objective
Verify that the backend properly validates subtotal calculations and rejects transactions with mismatched subtotals, preventing price manipulation attacks.

---

## Test Execution

### 1. Navigation and Login
- Successfully navigated to http://192.168.1.70
- Logged in with credentials: admin / admin123
- POS screen loaded correctly

### 2. Order Creation
Added multiple items to test subtotal calculation:
- Gin Tonic (Standard): €8.00 × 1 = €8.00
- Beck's (33cl): €4.00 × 1 = €4.00
- Acqua (50cl): €2.00 × 1 = €2.00

**Order Panel Subtotal:** €14.00 (correct)

### 3. Payment Screen Verification
Navigated to payment screen and verified:
- **Subtotal (ex-tax):** €12.40
- **Tax (inclusive):** €1.60
- **Final Total:** €14.00

The system uses **inclusive tax mode** where prices include tax and the subtotal shows the pre-tax amount.

### 4. Backend Validation Test
**Attack Vector:** Modified the payment request via JavaScript fetch interceptor to submit:
- Modified subtotal: €1.00 (vs actual €12.40)
- Modified tax: €0.00 (vs actual €1.60)
- Items remained unchanged with correct prices

**Backend Response:**
```
400 Bad Request
Error: "Subtotal mismatch. Expected: €12.40, Received: €1.00"
```

The transaction was **rejected** and no payment was processed.

---

## Subtotal Calculation Details

### Frontend Calculation (PaymentModal.tsx)
```typescript
// Tax-inclusive mode extracts pre-tax price
const preTaxUnitPrice = roundMoney(divideMoney(item.price, addMoney(1, taxRate)));
const itemSubtotal = multiplyMoney(preTaxUnitPrice, item.quantity);
```

**Formula:** subtotal = Σ(price / (1 + taxRate) × quantity)

### Backend Validation (transactions.ts)
```typescript
// Recalculates expected subtotal from items
for (const item of items) {
  const preTaxPrice = divideMoney(itemPrice, 1 + taxRate);
  itemSubtotal = multiplyMoney(preTaxPrice, itemQuantity);
  calculatedSubtotal = addMoney(calculatedSubtotal, itemSubtotal);
}

// Validates with 1 cent tolerance
const subtotalDifference = Math.abs(subtractMoney(subtotal, calculatedSubtotal));
if (subtotalDifference > 0.01) {
  return res.status(400).json({ error: `Subtotal mismatch...` });
}
```

---

## Security Analysis

### Trust Model
| Component | Trust Level | Validation |
|-----------|-------------|------------|
| Price display | UI-only | Not trusted - display only |
| Subtotal in UI | Calculated | Not trusted - display only |
| Item prices in request | Sent to backend | Validated against database |
| Subtotal in request | Sent to backend | **Recalculated and validated** |

### Manipulation Prevention Mechanisms

1. **No Editable Fields:** Subtotal is displayed in a non-editable `<span>` element (no input fields)

2. **Backend Recalculation:** Server recalculates subtotal from:
   - Item prices (validated against product database)
   - Quantities
   - Tax rates (from product configuration)

3. **Tolerance Threshold:** 1 cent (€0.01) tolerance for floating-point rounding

4. **Rejection on Mismatch:** HTTP 400 with detailed error message

---

## Test Results

| Test Case | Result |
|-----------|--------|
| Correct subtotal accepted | PASS |
| Manipulated subtotal rejected | PASS |
| Backend recalculates from items | PASS |
| Error message indicates expected value | PASS |
| No payment processed on rejection | PASS |

---

## Code References

### Files Analyzed
- `frontend/components/OrderPanel.tsx` - Order display subtotal
- `frontend/components/PaymentModal.tsx` - Payment screen subtotal calculation
- `frontend/contexts/PaymentContext.tsx` - Payment processing
- `frontend/services/transactionService.ts` - API request structure
- `frontend/utils/money.ts` - Money calculation utilities
- `backend/src/handlers/transactions.ts` - Backend validation (lines 98-131, 594-631)
- `backend/src/utils/money.ts` - Server-side money utilities

---

## Conclusion

**Test A2.3 PASSED**

The system correctly implements backend subtotal validation:
- Frontend calculates subtotal for display purposes only
- Backend recalculates subtotal from submitted items
- Mismatched subtotals are rejected with HTTP 400
- The system follows a **zero-trust model** for price calculations
- Manipulation attempts via browser dev tools or API calls are detected and blocked

The validation logic handles:
- Tax-inclusive pricing
- Tax-exclusive pricing  
- No-tax mode
- Floating-point precision (1 cent tolerance)

This prevents attacks where an attacker might:
- Modify subtotal to pay less
- Submit fraudulent prices
- Bypass UI validation
