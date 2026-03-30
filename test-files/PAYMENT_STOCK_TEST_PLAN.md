# Payment Transactions & Stock Consumption - Exhaustive Reliability Test Plan

## System Overview

### Payment Flow
- **Primary Endpoint**: `POST /api/transactions/process-payment`
- **Atomic Operation**: Payment + Stock Deduction in single transaction
- **Idempotency**: 24-hour key-based duplicate prevention
- **Optimistic Locking**: Version-based for OrderSession updates

### Stock Consumption Flow
- **Deduction Trigger**: Automatic on payment completion
- **Race Condition Protection**: Atomic `UPDATE ... WHERE quantity >= required`
- **Validation**: Pre-check stock sufficiency before transaction

---

## Test Scenarios

### Category A: Payment Transaction Reliability

#### A1. Basic Payment Processing
- A1.1: Cash payment with single item
- A1.2: Card payment with multiple items
- A1.3: Payment with tip
- A1.4: Payment with discount (admin required)
- A1.5: Payment with mixed tax rates

#### A2. Payment Validation
- A2.1: Empty items array rejection
- A2.2: Invalid item price handling
- A2.3: Subtotal mismatch rejection
- A2.4: Tax mismatch rejection
- A2.5: Missing required fields

#### A3. Idempotency Testing
- A3.1: Duplicate payment prevention (same key)
- A3.2: Different keys allow separate payments
- A3.3: Idempotency key format validation
- A3.4: Idempotency expiration (24h boundary)
- A3.5: Cross-user idempotency isolation

#### A4. Payment Edge Cases
- A4.1: Zero total payment
- A4.2: Maximum value payment
- A4.3: Payment with complimentary status
- A4.4: Payment with invalid till reference
- A4.5: Payment with invalid user reference

---

### Category B: Stock Consumption Reliability

#### B1. Stock Deduction on Payment
- B1.1: Single item stock consumption
- B1.2: Multiple items sharing same stock
- B1.3: Variant with multiple stock dependencies
- B1.4: Product with no stock consumption defined

#### B2. Insufficient Stock Handling
- B2.1: Exact stock exhaustion (boundary)
- B2.2: Insufficient stock rejection
- B2.3: Partial availability (some items in stock)
- B2.4: Zero stock item rejection
- B2.5: Negative quantity prevention

#### B3. Stock Integrity
- B3.1: Stock quantity accuracy after payment
- B3.2: Concurrent payment race condition
- B3.3: Stock rollback on payment failure
- B3.4: Stock consumption audit trail

---

### Category C: Concurrent Operations

#### C1. Race Conditions
- C1.1: Simultaneous payments for same stock
- C1.2: Payment + manual stock adjustment concurrently
- C1.3: Multiple payments from same user
- C1.4: Stock level check vs. actual deduction timing

#### C2. Transaction Isolation
- C2.1: Payment transaction atomicity
- C2.2: Partial failure handling
- C2.3: Deadlock prevention
- C2.4: Connection timeout handling

---

### Category D: Error Handling & Recovery

#### D1. Network Failures
- D1.1: Connection timeout during payment
- D1.2: Network retry with idempotency
- D1.3: Backend unavailability

#### D2. Data Integrity
- D2.1: Orphaned stock consumption detection
- D2.2: Transaction-stock reconciliation
- D2.3: Stock consumption integrity validation
- D2.4: Manual stock adjustment integrity

---

### Category E: Authentication & Authorization

#### E1. Access Control
- E1.1: Admin payment processing
- E1.2: Cashier payment processing
- E1.3: Unauthorized user rejection
- E1.4: Discount authorization (admin only)

---

### Category F: UI/UX Flows

#### F1. Payment Modal
- F1.1: Payment method selection
- F1.2: Tip input handling
- F1.3: Discount input handling
- F1.4: Payment confirmation
- F1.5: Error message display

#### F2. Stock Availability Indicators
- F2.1: Available items display
- F2.2: Unavailable items indication
- F2.3: Real-time stock updates
- F2.4: Out-of-stock prevention

---

## Test Execution Priority

| Priority | Category | Focus Area |
|----------|----------|------------|
| P0 | A1, B1 | Core happy path |
| P1 | A2, B2 | Validation |
| P1 | A3 | Idempotency |
| P2 | C1, C2 | Concurrency |
| P2 | D1, D2 | Error handling |
| P3 | E1 | Authorization |
| P3 | F1, F2 | UI/UX |

---

## Test Environment

- **App URL**: http://192.168.1.70
- **Admin Credentials**: admin / admin123
- **Database**: PostgreSQL (Docker)
- **Browser Automation**: Playwright MCP Server

---

## Test Artifacts Location

All test results will be stored in: `/home/pippo/tev2/test-files/`
