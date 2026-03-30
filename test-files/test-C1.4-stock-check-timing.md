# Test C1.4: Stock Level Check vs. Actual Deduction Timing

**Test Date:** 2026-03-30  
**Test Executor:** Kilo (Automated Testing Agent)  
**Test Environment:** http://192.168.1.70  

---

## Test Objective

Verify WHEN stock availability is checked versus WHEN stock is actually deducted during the payment process.

---

## Test Setup

### Initial Stock Configuration
- **Stock Item:** Gin Gordon's
- **Initial Quantity:** 5750 ml
- **Adjusted Quantity for Test:** 100 ml (reduced by 5650 ml)

### Product Tested
- **Product:** Gin Tonic (Standard)
- **Stock Required per Unit:** 60 ml of Gin Gordon's
- **Quantity Added to Order:** 3 units
- **Total Stock Required:** 180 ml (3 × 60 ml)
- **Stock Available:** 100 ml
- **Deficit:** 80 ml (insufficient stock)

---

## Test Execution Steps

### Step 1: Navigation and Login
- Navigated to http://192.168.1.70
- Already logged in as Admin User

### Step 2: Stock Adjustment
- Navigated to Admin Panel > Inventory
- Selected Gin Gordon's stock item
- Created stock adjustment: -5650 ml
- Reason: "Test C1.4 - Setting low stock for timing test"
- Result: Stock reduced from 5750 ml to 100 ml

### Step 3: Create Order with Insufficient Stock
- Switched to POS screen
- Added 1 Gin Tonic to order (no warning displayed)
- Increased quantity to 2 using + button (no warning displayed)
- Increased quantity to 3 using + button (no warning displayed)
- **Observation:** At no point during order creation was there any stock warning

### Step 4: Payment Process
- Clicked "Payment" button - payment modal opened (no stock warning)
- Payment modal displayed with:
  - Subtotal: €20.16
  - Tax: €3.84
  - Final Total: €24.00
- Clicked "Pay with CASH" button

### Step 5: Stock Check Triggered
**STOCK CHECK OCCURRED AT PAYMENT PROCESSING TIME**

An alert dialog appeared with the message:
> "Insufficient stock for item Gin Gordon's. Available: 100, Requested: 180"

### Step 6: Payment Rejected
- After accepting the dialog, the payment modal remained open
- The order was not completed
- The order items remained in the current order
- Console errors logged:
  - "Failed to load resource: the server responded with a status of 400 (Bad Request)"
  - "transactionService.errorProcessingPayment Error: Insufficient stock for item Gin Gordon's..."
  - "Payment processing failed Error: Insufficient stock for item Gin Gordon's. Available: 100, Requested: 180"

### Step 7: Cleanup
- Navigated back to Admin Panel > Inventory
- Restored Gin Gordon's stock to original level: +5650 ml
- Reason: "Test C1.4 - Restoring stock after test"
- Final stock: 5750 ml (restored to original)

---

## Test Findings

### When Stock Check Occurs

| Checkpoint | Stock Checked? | Details |
|------------|----------------|---------|
| Adding item to order | NO | No validation when adding items |
| Increasing quantity in order | NO | No validation when adjusting quantities |
| Clicking "Payment" button | NO | Payment modal opens without validation |
| Processing payment (CASH/CARD) | **YES** | Stock validated before transaction completes |

### Stock Deduction Timing

| Event | Stock Deducted? | Details |
|-------|-----------------|---------|
| Adding item to order | NO | Stock not reserved or deducted |
| During order editing | NO | Stock not affected |
| Payment button click | NO | Stock not checked or deducted |
| **Payment processing** | **N/A** | Deduction would occur here, but blocked by insufficient stock error |

### Warnings and Errors

1. **No Preventive Warnings:** 
   - No warning when adding items that exceed available stock
   - No warning when increasing quantities beyond stock levels
   - No warning when clicking Payment button

2. **Error at Payment Processing:**
   - Alert dialog: "Insufficient stock for item Gin Gordon's. Available: 100, Requested: 180"
   - HTTP 400 Bad Request response
   - Payment transaction rejected
   - Order remains in pending state

---

## Key Observations

### Stock Check Timing
**Stock availability is checked at PAYMENT PROCESSING time, not at order creation time.**

This means:
1. Users can add unlimited quantities to an order regardless of stock levels
2. Users can proceed to the payment screen without any stock validation
3. Stock validation only occurs when the actual payment is submitted
4. No stock reservation mechanism exists during order creation

### Stock Deduction Timing
**Stock would be deducted at payment processing time (transactional), but was blocked due to insufficient stock.**

If stock had been sufficient:
- Stock would be deducted as part of the payment transaction
- This is a transactional approach where stock is only consumed upon successful payment

### Race Condition Potential
The late validation approach creates a potential race condition:
- Multiple users could add the same low-stock item to their orders
- Each user would be able to proceed to payment
- Only at payment processing would they discover the stock issue
- First successful payment would deduct stock, leaving subsequent payments to fail

---

## Test Result

| Test Criteria | Result | Notes |
|---------------|--------|-------|
| Stock check at add to order | FAIL | No validation performed |
| Stock check at quantity increase | FAIL | No validation performed |
| Stock check at payment button | FAIL | No validation performed |
| Stock check at payment processing | PASS | Stock validated before transaction |
| Preventive warning system | FAIL | No early warnings provided |
| Stock deduction timing | PASS | Deducted at payment (transactional) |
| Error handling | PASS | Clear error message displayed |

---

## Recommendations

1. **Add Stock Validation at Order Creation:**
   - Validate stock when adding items to order
   - Show warning or prevent adding if insufficient stock
   - Display current stock levels in product selection

2. **Implement Stock Reservation:**
   - Reserve stock when items are added to order
   - Release reservation if order is cancelled/timed out
   - Prevent overselling in high-concurrency scenarios

3. **Add Visual Stock Indicators:**
   - Show stock levels on product cards
   - Highlight low-stock items
   - Disable products with zero stock

4. **Improve Error UX:**
   - Show stock shortage earlier in the flow
   - Display available quantity vs. requested quantity
   - Suggest reducing quantity to match available stock

---

## Conclusion

The system implements a **payment-time stock validation** approach, where stock availability is only checked when processing the actual payment. This is a transactional approach that prevents stock from being deducted for incomplete orders, but it creates a poor user experience as users can spend time building an order only to discover at payment that items are unavailable.

**Stock Check Timing:** Payment processing time  
**Stock Deduction Timing:** Payment processing time (transactional)  
**Early Warning System:** Not implemented  
**Race Condition Protection:** None (no stock reservation)
