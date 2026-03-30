# Comprehensive Test Plan: Transaction System, Stock Consumption & Recipe/Ingredient Subsystem

**Document Version:** 1.0  
**Date:** 2026-03-29  
**Author:** QA Team  
**Status:** Ready for Execution  

---

## Table of Contents

1. [Document Purpose](#1-document-purpose)
2. [Objectives](#2-objectives)
3. [Scope](#3-scope)
4. [Prerequisites](#4-prerequisites)
5. [Test Strategy](#5-test-strategy)
6. [Acceptance Criteria](#6-acceptance-criteria)
7. [Test Case Design](#7-test-case-design)
8. [Test Data Creation Guidelines](#8-test-data-creation-guidelines)
9. [Test Environment Setup](#9-test-environment-setup)
10. [Test Execution Workflow](#10-test-execution-workflow)
11. [Defect Logging Guidelines](#11-defect-logging-guidelines)
12. [Risk Assessment](#12-risk-assessment)
13. [Schedule](#13-schedule)
14. [Resource Allocation](#14-resource-allocation)
15. [Sign-Off Criteria](#15-sign-off-criteria)
16. [Appendices](#16-appendices)

---

## 1. Document Purpose

This document provides a comprehensive, structured test plan for the Bar POS application's transaction system, with specific focus on:

- Stock consumption during payment processing
- Recipe/ingredient configuration and management
- Inventory depletion and restocking workflows
- Data consistency and integrity across concurrent operations

The plan serves as a blueprint for the QA team to execute exhaustive testing, ensuring production readiness and system reliability.

---

## 2. Objectives

### 2.1 Primary Objectives

| ID | Objective | Success Metric |
|----|-----------|----------------|
| O1 | Verify atomic transaction processing for payments | 100% of payments correctly update stock |
| O2 | Validate stock consumption accuracy | Consumption matches configured recipes exactly |
| O3 | Ensure data integrity under concurrent operations | No negative stock or lost updates |
| O4 | Confirm recipe/ingredient management functionality | CRUD operations work correctly |
| O5 | Validate inventory management workflows | Stock levels accurately tracked |
| O6 | Verify proper error handling and rollback | Failed transactions leave no partial state |

### 2.2 Secondary Objectives

| ID | Objective | Success Metric |
|----|-----------|----------------|
| O7 | Test idempotency mechanism | Duplicate requests handled correctly |
| O8 | Validate authorization controls | Role-based access enforced |
| O9 | Verify audit trail completeness | All stock changes logged |
| O10 | Test edge cases and boundary conditions | System handles gracefully |

---

## 3. Scope

### 3.1 In Scope

#### Transaction System
- Payment processing endpoint (`POST /api/transactions/process-payment`)
- Transaction creation and retrieval
- Order session management
- Idempotency key handling
- Payment validation (subtotal, tax, total)
- Discount application (admin-only)

#### Stock Consumption System
- Automatic stock deduction on payment
- Stock consumption configuration per product variant
- Multi-ingredient recipe handling
- Stock validation before decrement
- Atomic stock updates with rollback

#### Inventory Management
- Stock item CRUD operations
- Manual stock adjustments
- Stock level updates
- Stock integrity validation
- Orphaned reference detection and cleanup

#### Recipe/Ingredient Subsystem
- Product variant configuration
- Stock consumption mapping (recipe definition)
- Ingredient management
- Stock item type handling (Ingredient vs Sellable Good)
- Purchasing unit conversions

### 3.2 Out of Scope

- User authentication mechanisms (covered separately)
- Database backup/restore procedures
- Network security testing
- Performance/load testing beyond concurrency validation
- Mobile application testing
- Third-party integrations

---

## 4. Prerequisites

### 4.1 Environment Requirements

| Requirement | Specification | Status |
|-------------|---------------|--------|
| Application URL | http://192.168.1.70 | Must be accessible |
| PostgreSQL Database | Docker container, port 5432 | Running |
| Backend Container | bar_pos_backend | Running |
| Frontend Container | bar_pos_frontend | Running |
| Nginx Container | bar_pos_nginx | Running |

### 4.2 Access Credentials

| Role | Username | Password | Purpose |
|------|----------|----------|---------|
| Admin | admin | admin123 | Full system access, discount application |
| Cashier | (test user) | (test pass) | Standard POS operations |

### 4.3 Test Tools

| Tool | Purpose | Configuration |
|------|---------|---------------|
| Playwright MCP Server | Browser automation | Pre-configured |
| PostgreSQL Client | Database verification | pgAdmin / psql |
| API Client | Endpoint testing | curl / Postman |
| Log Viewer | Error investigation | Docker logs |

### 4.4 Test Data Requirements

- Minimum 5 products with configured variants
- Minimum 10 stock items (mix of Ingredients and Sellable Goods)
- Stock consumption configurations for all sellable variants
- Sufficient stock levels for testing (100+ units per item)

---

## 5. Test Strategy

### 5.1 Testing Levels

```
+--------------------------------------------------+
|                  E2E Tests (Playwright)          |
|          Full user workflow validation           |
+--------------------------------------------------+
                        |
+--------------------------------------------------+
|              Integration Tests (API)              |
|        Endpoint behavior and data flow           |
+--------------------------------------------------+
                        |
+--------------------------------------------------+
|              Database Verification                |
|         Data integrity and consistency           |
+--------------------------------------------------+
```

### 5.2 Test Types

| Type | Coverage | Method |
|------|----------|--------|
| Functional | Business requirements | E2E via Playwright MCP |
| Integration | Component interaction | API calls + DB verification |
| Concurrency | Race conditions | Parallel requests |
| Boundary | Edge cases | Specific input values |
| Negative | Error handling | Invalid inputs |
| Data Integrity | Consistency | Database queries |

### 5.3 Test Priority Levels

| Priority | Description | Focus Areas |
|----------|-------------|-------------|
| P0 - Critical | Core happy path | Basic payment, stock deduction |
| P1 - High | Validation & security | Idempotency, authorization |
| P2 - Medium | Edge cases | Boundaries, concurrency |
| P3 - Low | UI/UX | Visual indicators, messages |

### 5.4 Testing Approach by Category

#### Category A: Payment Transactions (P0-P1)
- Execute payment flows via Playwright browser automation
- Verify transaction records in database
- Validate stock levels after payment

#### Category B: Stock Consumption (P0-P2)
- Configure recipes with single and multiple ingredients
- Process payments and verify exact consumption
- Test insufficient stock scenarios

#### Category C: Recipe Management (P1-P2)
- Create, update, delete stock consumption configurations
- Verify referential integrity
- Test substitution workflows

#### Category D: Concurrency & Data Integrity (P2)
- Simulate parallel payments from multiple sessions
- Verify atomic rollback on failures
- Check for race conditions

---

## 6. Acceptance Criteria

### 6.1 Payment Transaction Acceptance Criteria

| AC ID | Criteria | Validation Method |
|-------|----------|-------------------|
| AC-TR-01 | Payment creates transaction record with correct totals | DB query |
| AC-TR-02 | Stock deducted atomically within transaction | DB query before/after |
| AC-TR-03 | Idempotency prevents duplicate charges | API response headers |
| AC-TR-04 | Payment validation rejects malformed requests | API error response |
| AC-TR-05 | Discount only applicable by admin users | Authorization check |
| AC-TR-06 | Order session marked completed after payment | DB query |
| AC-TR-07 | Tab deleted after payment (if exists) | DB query |
| AC-TR-08 | Table status updated after payment (if assigned) | DB query |

### 6.2 Stock Consumption Acceptance Criteria

| AC ID | Criteria | Validation Method |
|-------|----------|-------------------|
| AC-SC-01 | Stock deducted by exact configured quantity | Calculation verification |
| AC-SC-02 | Multi-ingredient recipes consume all components | DB query all stock items |
| AC-SC-03 | Insufficient stock prevents payment | Error message + no DB change |
| AC-SC-04 | Stock cannot go negative | DB constraint + validation |
| AC-SC-05 | Failed payment leaves stock unchanged | Before/after comparison |
| AC-SC-06 | Stock adjustments create audit records | DB query adjustment table |

### 6.3 Recipe/Ingredient Acceptance Criteria

| AC ID | Criteria | Validation Method |
|-------|----------|-------------------|
| AC-RC-01 | Stock consumption configurable per variant | UI + DB verification |
| AC-RC-02 | Multiple stock items linkable to one variant | Configuration test |
| AC-RC-03 | Stock item deletion blocked if in use | Error response |
| AC-RC-04 | Orphaned references detectable and cleanup-able | API endpoint test |
| AC-RC-05 | Ingredient vs Sellable Good types handled correctly | Type-based filtering |

### 6.4 Concurrency Acceptance Criteria

| AC ID | Criteria | Validation Method |
|-------|----------|-------------------|
| AC-CN-01 | Concurrent payments for same stock handled correctly | Parallel execution |
| AC-CN-02 | Only one of conflicting payments succeeds | Result verification |
| AC-CN-03 | No negative stock from race conditions | Final stock check |
| AC-CN-04 | Transaction rollback complete on failure | Data consistency check |

---

## 7. Test Case Design

### 7.1 Category A: Payment Transaction Tests

#### A1. Basic Payment Processing

| Test ID | A1.1 |
|---------|------|
| **Name** | Single item cash payment |
| **Priority** | P0 |
| **Preconditions** | Product "Espresso" (variantId: 1) exists with price 2.00, stock configured |
| **Test Steps** | 1. Navigate to POS screen<br>2. Add "Espresso" to order<br>3. Select "Cash" payment<br>4. Confirm payment |
| **Expected Result** | Payment succeeds, transaction created, stock decremented |
| **Verification** | Query transactions table for new record, check stock level |

| Test ID | A1.2 |
|---------|------|
| **Name** | Multiple items card payment |
| **Priority** | P0 |
| **Preconditions** | Multiple products available with stock |
| **Test Steps** | 1. Add 3 different products to order<br>2. Select quantities: 2, 1, 3<br>3. Select "Card" payment<br>4. Confirm payment |
| **Expected Result** | Payment succeeds, all items in transaction, stock deducted correctly |
| **Verification** | Verify transaction.items JSON contains all items with correct quantities |

| Test ID | A1.3 |
|---------|------|
| **Name** | Payment with tip |
| **Priority** | P1 |
| **Preconditions** | Product available, user logged in |
| **Test Steps** | 1. Add product to order<br>2. Add tip amount (e.g., 1.50)<br>3. Complete payment |
| **Expected Result** | Transaction includes tip in total |
| **Verification** | Query transaction record, verify tip field |

| Test ID | A1.4 |
|---------|------|
| **Name** | Payment with discount (admin) |
| **Priority** | P1 |
| **Preconditions** | Admin user logged in, product in order |
| **Test Steps** | 1. Add products totaling 10.00<br>2. Apply discount of 2.00<br>3. Complete payment |
| **Expected Result** | Transaction shows discount, total = 8.00 |
| **Verification** | Verify discount and total fields in transaction |

| Test ID | A1.5 |
|---------|------|
| **Name** | Payment with mixed tax rates |
| **Priority** | P1 |
| **Preconditions** | Products with different tax rates configured |
| **Test Steps** | 1. Add product with 10% tax<br>2. Add product with 22% tax<br>3. Complete payment |
| **Expected Result** | Tax calculated correctly per item, total tax accurate |
| **Verification** | Verify tax calculation matches expected values |

---

#### A2. Payment Validation

| Test ID | A2.1 |
|---------|------|
| **Name** | Empty items array rejection |
| **Priority** | P1 |
| **Preconditions** | User authenticated |
| **Test Steps** | 1. Attempt payment with empty items array via API |
| **Expected Result** | 400 error, "Items array cannot be empty" |
| **Verification** | No transaction created, stock unchanged |

| Test ID | A2.2 |
|---------|------|
| **Name** | Invalid item price handling |
| **Priority** | P1 |
| **Preconditions** | Product exists |
| **Test Steps** | 1. Submit payment with item price differing from configured<br>2. Price differs by more than 0.01 |
| **Expected Result** | 400 error, "Price mismatch" or similar |
| **Verification** | Transaction rejected |

| Test ID | A2.3 |
|---------|------|
| **Name** | Subtotal mismatch rejection |
| **Priority** | P1 |
| **Preconditions** | Products in order |
| **Test Steps** | 1. Submit payment with incorrect subtotal (sum doesn't match items) |
| **Expected Result** | 400 error with expected vs received subtotal |
| **Verification** | Error message shows correct values |

| Test ID | A2.4 |
|---------|------|
| **Name** | Tax calculation mismatch |
| **Priority** | P1 |
| **Preconditions** | Products with tax configured |
| **Test Steps** | 1. Submit payment with incorrect tax amount |
| **Expected Result** | 400 error, tax mismatch detected |
| **Verification** | No transaction created |

| Test ID | A2.5 |
|---------|------|
| **Name** | Missing required fields |
| **Priority** | P1 |
| **Preconditions** | N/A |
| **Test Steps** | 1. Submit payment missing paymentMethod<br>2. Submit payment missing items |
| **Expected Result** | 400 error for each missing field |
| **Verification** | Appropriate error messages returned |

---

#### A3. Idempotency Testing

| Test ID | A3.1 |
|---------|------|
| **Name** | Duplicate payment prevention |
| **Priority** | P1 |
| **Preconditions** | Product available with stock |
| **Test Steps** | 1. Submit payment with idempotency key "test-key-001"<br>2. Immediately submit same payment with same key |
| **Expected Result** | Second request returns 200 with original transaction, X-Idempotent-Replay: true header |
| **Verification** | Only one transaction in DB, stock decremented once |

| Test ID | A3.2 |
|---------|------|
| **Name** | Different keys allow separate payments |
| **Priority** | P1 |
| **Preconditions** | Sufficient stock for 2 orders |
| **Test Steps** | 1. Submit payment with key "key-A"<br>2. Submit same order with key "key-B" |
| **Expected Result** | Both payments succeed (201), two transactions created |
| **Verification** | Both transactions in DB, stock decremented twice |

| Test ID | A3.3 |
|---------|------|
| **Name** | Idempotency key format validation |
| **Priority** | P2 |
| **Preconditions** | N/A |
| **Test Steps** | 1. Submit payment with empty idempotency key<br>2. Submit with special characters in key |
| **Expected Result** | Valid keys accepted, invalid format rejected |
| **Verification** | Appropriate error handling |

| Test ID | A3.4 |
|---------|------|
| **Name** | Idempotency expiration boundary |
| **Priority** | P2 |
| **Preconditions** | Payment from 24+ hours ago |
| **Test Steps** | 1. Find payment with key created 25 hours ago<br>2. Submit new payment with same key |
| **Expected Result** | New payment created (key expired) |
| **Verification** | New transaction created |

| Test ID | A3.5 |
|---------|------|
| **Name** | Cross-user idempotency isolation |
| **Priority** | P2 |
| **Preconditions** | Two different users |
| **Test Steps** | 1. User A submits payment with key "shared-key"<br>2. User B submits payment with same key |
| **Expected Result** | Both payments succeed (keys are user-bound) |
| **Verification** | Two transactions created |

---

#### A4. Payment Edge Cases

| Test ID | A4.1 |
|---------|------|
| **Name** | Zero total payment (complimentary) |
| **Priority** | P2 |
| **Preconditions** | Admin user, product configured |
| **Test Steps** | 1. Add product to order<br>2. Apply 100% discount<br>3. Complete payment |
| **Expected Result** | Transaction created with status "complimentary", total = 0 |
| **Verification** | Stock still deducted, transaction recorded |

| Test ID | A4.2 |
|---------|------|
| **Name** | Maximum value payment |
| **Priority** | P3 |
| **Preconditions** | High-value products |
| **Test Steps** | 1. Add items totaling near DECIMAL(10,2) max<br>2. Complete payment |
| **Expected Result** | Payment processes without overflow |
| **Verification** | Transaction totals accurate |

| Test ID | A4.3 |
|---------|------|
| **Name** | Payment with invalid till reference |
| **Priority** | P2 |
| **Preconditions** | N/A |
| **Test Steps** | 1. Submit payment with non-existent tillId |
| **Expected Result** | 400 error or appropriate handling |
| **Verification** | Transaction not created |

| Test ID | A4.4 |
|---------|------|
| **Name** | Payment with invalid user reference |
| **Priority** | P2 |
| **Preconditions** | N/A |
| **Test Steps** | 1. Submit payment with non-existent userId |
| **Expected Result** | 401/403 error |
| **Verification** | Transaction not created |

---

### 7.2 Category B: Stock Consumption Tests

#### B1. Stock Deduction on Payment

| Test ID | B1.1 |
|---------|------|
| **Name** | Single item stock consumption |
| **Priority** | P0 |
| **Preconditions** | Product "Coffee" configured to consume 20g coffee beans per unit, current stock: 1000g |
| **Test Steps** | 1. Add 1 Coffee to order<br>2. Complete payment |
| **Expected Result** | Coffee beans stock = 980g |
| **Verification** | Query StockItem table, verify quantity |

| Test ID | B1.2 |
|---------|------|
| **Name** | Multiple items sharing same stock |
| **Priority** | P0 |
| **Preconditions** | "Espresso" consumes 10g beans, "Latte" consumes 15g beans, beans stock: 1000g |
| **Test Steps** | 1. Add 2 Espresso and 1 Latte to order<br>2. Complete payment |
| **Expected Result** | Beans stock = 1000 - (2*10) - (1*15) = 965g |
| **Verification** | Calculate and verify exact stock reduction |

| Test ID | B1.3 |
|---------|------|
| **Name** | Variant with multiple stock dependencies |
| **Priority** | P0 |
| **Preconditions** | "Cappuccino" configured with: 20g beans, 150ml milk, 1 cup; all stocks have sufficient quantity |
| **Test Steps** | 1. Add 1 Cappuccino to order<br>2. Complete payment |
| **Expected Result** | All three stock items decremented correctly |
| **Verification** | Query each StockItem, verify quantities |

| Test ID | B1.4 |
|---------|------|
| **Name** | Product with no stock consumption defined |
| **Priority** | P1 |
| **Preconditions** | Product variant exists with empty stockConsumption array |
| **Test Steps** | 1. Add product to order<br>2. Complete payment |
| **Expected Result** | Payment succeeds, no stock changes |
| **Verification** | Transaction created, stock levels unchanged |

---

#### B2. Insufficient Stock Handling

| Test ID | B2.1 |
|---------|------|
| **Name** | Exact stock exhaustion |
| **Priority** | P1 |
| **Preconditions** | Product consumes 10 units, stock = 10 |
| **Test Steps** | 1. Add 1 unit of product to order<br>2. Complete payment |
| **Expected Result** | Payment succeeds, stock = 0 |
| **Verification** | Stock at 0, transaction recorded |

| Test ID | B2.2 |
|---------|------|
| **Name** | Insufficient stock rejection |
| **Priority** | P1 |
| **Preconditions** | Product consumes 10 units, stock = 5 |
| **Test Steps** | 1. Add 1 unit of product to order<br>2. Attempt payment |
| **Expected Result** | Payment fails with "Insufficient stock" error |
| **Verification** | No transaction created, stock unchanged at 5 |

| Test ID | B2.3 |
|---------|------|
| **Name** | Partial availability in multi-item order |
| **Priority** | P1 |
| **Preconditions** | Item A stock: 100 (sufficient), Item B stock: 0 (insufficient) |
| **Test Steps** | 1. Add Item A and Item B to same order<br>2. Attempt payment |
| **Expected Result** | Payment fails for entire order |
| **Verification** | No stock deducted for Item A either |

| Test ID | B2.4 |
|---------|------|
| **Name** | Zero stock item rejection |
| **Priority** | P1 |
| **Preconditions** | Product linked to stock item with quantity = 0 |
| **Test Steps** | 1. Add product to order<br>2. Attempt payment |
| **Expected Result** | Payment fails with insufficient stock error |
| **Verification** | Clear error message indicating which item |

| Test ID | B2.5 |
|---------|------|
| **Name** | Negative quantity prevention |
| **Priority** | P1 |
| **Preconditions** | Stock at 0 |
| **Test Steps** | 1. Attempt manual stock adjustment to -5 via API |
| **Expected Result** | 400 error, stock cannot go negative |
| **Verification** | Stock remains at 0 |

---

#### B3. Stock Integrity

| Test ID | B3.1 |
|---------|------|
| **Name** | Stock quantity accuracy after multiple payments |
| **Priority** | P1 |
| **Preconditions** | Beans stock: 1000g, Coffee consumes 20g |
| **Test Steps** | 1. Process 5 Coffee payments (1 each)<br>2. Verify final stock |
| **Expected Result** | Stock = 1000 - (5 * 20) = 900g |
| **Verification** | Exact calculation matches |

| Test ID | B3.2 |
|---------|------|
| **Name** | Concurrent payment race condition |
| **Priority** | P2 |
| **Preconditions** | Stock: 20 units, Product consumes 10 units |
| **Test Steps** | 1. Initiate two payments simultaneously from different sessions<br>2. Both attempt to purchase 1 unit |
| **Expected Result** | Only one succeeds, one fails with insufficient stock |
| **Verification** | Final stock = 10, one transaction, one error |

| Test ID | B3.3 |
|---------|------|
| **Name** | Stock rollback on payment failure |
| **Priority** | P1 |
| **Preconditions** | Multi-item order, one item will cause failure |
| **Test Steps** | 1. Add valid item and invalid item (no stock)<br>2. Attempt payment |
| **Expected Result** | Transaction rolls back, no stock changes |
| **Verification** | All stock levels unchanged from original |

| Test ID | B3.4 |
|---------|------|
| **Name** | Stock consumption audit trail |
| **Priority** | P2 |
| **Preconditions** | Product configured with stock consumption |
| **Test Steps** | 1. Process payment<br>2. Check StockAdjustment records |
| **Expected Result** | Adjustment record created with correct details |
| **Verification** | Query StockAdjustment table for matching record |

---

### 7.3 Category C: Recipe/Ingredient Management Tests

#### C1. Recipe Configuration

| Test ID | C1.1 |
|---------|------|
| **Name** | Create stock consumption for new variant |
| **Priority** | P1 |
| **Preconditions** | New product variant created, stock items exist |
| **Test Steps** | 1. Navigate to Product Management<br>2. Edit variant<br>3. Add stock consumption: 50ml Milk, 10g Coffee<br>4. Save |
| **Expected Result** | Configuration saved, variant linked to stock items |
| **Verification** | Query StockConsumption table for new records |

| Test ID | C1.2 |
|---------|------|
| **Name** | Update existing stock consumption |
| **Priority** | P1 |
| **Preconditions** | Variant with existing consumption config |
| **Test Steps** | 1. Edit variant consumption from 10g to 15g<br>2. Save changes |
| **Expected Result** | New consumption value saved |
| **Verification** | Future payments use new value |

| Test ID | C1.3 |
|---------|------|
| **Name** | Remove stock consumption from variant |
| **Priority** | P1 |
| **Preconditions** | Variant with multiple consumption items |
| **Test Steps** | 1. Remove one consumption item from variant<br>2. Save |
| **Expected Result** | Item removed from configuration |
| **Verification** | Payment no longer consumes that stock item |

| Test ID | C1.4 |
|---------|------|
| **Name** | Multiple variants linked to same stock item |
| **Priority** | P1 |
| **Preconditions** | Multiple variants configured with same ingredient |
| **Test Steps** | 1. Configure 3 variants to use "Milk"<br>2. Process payments for each<br>3. Verify total consumption |
| **Expected Result** | Each deducts correctly from same stock pool |
| **Verification** | Total deduction matches sum of individual configs |

---

#### C2. Ingredient Management

| Test ID | C2.1 |
|---------|------|
| **Name** | Create new ingredient stock item |
| **Priority** | P1 |
| **Preconditions** | Admin logged in |
| **Test Steps** | 1. Navigate to Inventory Management<br>2. Create new item: type=Ingredient, name="Sugar", quantity=5000, baseUnit="g" |
| **Expected Result** | Item created successfully |
| **Verification** | Query StockItem table, verify record |

| Test ID | C2.2 |
|---------|------|
| **Name** | Create sellable good stock item |
| **Priority** | P1 |
| **Preconditions** | Admin logged in |
| **Test Steps** | 1. Create new item: type="Sellable Good", name="Bottled Water" |
| **Expected Result** | Item created with correct type |
| **Verification** | Type field shows "Sellable Good" |

| Test ID | C2.3 |
|---------|------|
| **Name** | Block deletion of stock item in use |
| **Priority** | P1 |
| **Preconditions** | Stock item linked to product variant |
| **Test Steps** | 1. Attempt to delete stock item used in recipe |
| **Expected Result** | 400 error, "Cannot delete item in use" |
| **Verification** | Item still exists in database |

| Test ID | C2.4 |
|---------|------|
| **Name** | Allow deletion of unused stock item |
| **Priority** | P2 |
| **Preconditions** | Stock item not linked to any variant |
| **Test Steps** | 1. Delete unused stock item |
| **Expected Result** | Item deleted successfully |
| **Verification** | Item removed from database |

---

#### C3. Ingredient Substitution

| Test ID | C3.1 |
|---------|------|
| **Name** | Substitute ingredient in recipe |
| **Priority** | P2 |
| **Preconditions** | Variant uses Ingredient A, Ingredient B exists |
| **Test Steps** | 1. Edit variant consumption<br>2. Remove Ingredient A<br>3. Add Ingredient B with same quantity<br>4. Save |
| **Expected Result** | Configuration updated |
| **Verification** | Future payments consume Ingredient B |

| Test ID | C3.2 |
|---------|------|
| **Name** | Change consumption quantity |
| **Priority** | P1 |
| **Preconditions** | Variant configured with 10g consumption |
| **Test Steps** | 1. Update consumption to 15g<br>2. Process payment<br>3. Verify deduction |
| **Expected Result** | New quantity used for deduction |
| **Verification** | Stock reduced by 15 units |

---

### 7.4 Category D: Inventory Depletion & Restocking Tests

#### D1. Inventory Depletion

| Test ID | D1.1 |
|---------|------|
| **Name** | Low stock indicator |
| **Priority** | P2 |
| **Preconditions** | Stock item at 15 units (above threshold) |
| **Test Steps** | 1. Process payments until stock <= 10<br>2. Check inventory display |
| **Expected Result** | Item shows yellow/low stock indicator |
| **Verification** | Visual indicator present |

| Test ID | D1.2 |
|---------|------|
| **Name** | Out of stock indicator |
| **Priority** | P2 |
| **Preconditions** | Stock item at 5 units |
| **Test Steps** | 1. Process payments until stock = 0<br>2. Check inventory display |
| **Expected Result** | Item shows red/out of stock indicator |
| **Verification** | Visual indicator present |

| Test ID | D1.3 |
|---------|------|
| **Name** | Product unavailable when stock depleted |
| **Priority** | P1 |
| **Preconditions** | All stock for a product depleted |
| **Test Steps** | 1. Attempt to add product to order |
| **Expected Result** | Product shown as unavailable or warning displayed |
| **Verification** | Cannot add to order or clear warning |

---

#### D2. Restocking Operations

| Test ID | D2.1 |
|---------|------|
| **Name** | Manual stock increase |
| **Priority** | P1 |
| **Preconditions** | Stock item at 10 units |
| **Test Steps** | 1. Navigate to Inventory Management<br>2. Select stock item<br>3. Add 50 units with reason "Delivery Received" |
| **Expected Result** | Stock = 60, adjustment record created |
| **Verification** | Query stock and adjustment tables |

| Test ID | D2.2 |
|---------|------|
| **Name** | Manual stock decrease (correction) |
| **Priority** | P1 |
| **Preconditions** | Stock at 100 units |
| **Test Steps** | 1. Adjust stock by -10 with reason "Inventory Count" |
| **Expected Result** | Stock = 90, adjustment record created |
| **Verification** | Negative adjustment recorded |

| Test ID | D2.3 |
|---------|------|
| **Name** | Stock adjustment with purchasing unit conversion |
| **Priority** | P2 |
| **Preconditions** | Stock item has purchasing unit "Case of 24" with multiplier 24 |
| **Test Steps** | 1. Add 2 cases via purchasing unit |
> **Expected Result** | Stock increases by 48 units |
| **Verification** | Correct conversion applied |

| Test ID | D2.4 |
|---------|------|
| **Name** | Stock adjustment audit trail |
| **Priority** | P1 |
| **Preconditions** | Multiple adjustments made |
| **Test Steps** | 1. Navigate to Adjustment History<br>2. View all adjustments |
| **Expected Result** | All adjustments visible with user, timestamp, reason |
| **Verification** | Complete audit trail |

---

### 7.5 Category E: Concurrency & Data Consistency Tests

#### E1. Race Conditions

| Test ID | E1.1 |
|---------|------|
| **Name** | Simultaneous payments for same stock |
| **Priority** | P2 |
| **Preconditions** | Stock: 30 units, Product consumes 20 units |
| **Test Steps** | 1. Open two browser sessions<br>2. Both add same product simultaneously<br>3. Both attempt payment at same time |
| **Expected Result** | One succeeds, one fails with insufficient stock |
| **Verification** | Final stock = 10, one transaction |

| Test ID | E1.2 |
|---------|------|
| **Name** | Payment and manual adjustment concurrently |
| **Priority** | P2 |
| **Preconditions** | Stock: 50 units |
| **Test Steps** | 1. Start payment for product consuming 30 units<br>2. Simultaneously adjust stock by -20 |
| **Expected Result** | Operations don't conflict, both complete or one fails appropriately |
| **Verification** | Final stock consistent |

| Test ID | E1.3 |
|---------|------|
| **Name** | Multiple payments from same user |
| **Priority** | P2 |
| **Preconditions** | User has active order session |
| **Test Steps** | 1. Send two payment requests from same session simultaneously |
| **Expected Result** | Order session version prevents conflict |
| **Verification** | One succeeds, other gets conflict error |

---

#### E2. Data Consistency

| Test ID | E2.1 |
|---------|------|
| **Name** | Transaction-stock consistency check |
| **Priority** | P2 |
| **Preconditions** | Multiple transactions processed |
| **Test Steps** | 1. Calculate expected stock from transactions<br>2. Compare with actual stock levels |
| **Expected Result** | Calculated matches actual |
| **Verification** | Use consumption report endpoint |

| Test ID | E2.2 |
|---------|------|
| **Name** | Orphaned reference detection |
| **Priority** | P2 |
| **Preconditions** | Manual data corruption (stock item deleted without cleanup) |
| **Test Steps** | 1. Call /api/stock-items/orphaned-references |
| **Expected Result** | Orphaned references identified |
| **Verification** | Report shows broken links |

| Test ID | E2.3 |
|---------|------|
| **Name** | Orphaned reference cleanup |
| **Priority** | P2 |
| **Preconditions** | Orphaned references exist |
| **Test Steps** | 1. Call /api/stock-items/cleanup-orphaned |
| **Expected Result** | Invalid references removed |
| **Verification** | No orphaned references after cleanup |

| Test ID | E2.4 |
|---------|------|
| **Name** | Integrity validation |
| **Priority** | P2 |
| **Preconditions** | N/A |
| **Test Steps** | 1. Call /api/stock-items/validate-integrity |
| **Expected Result** | Report on any integrity issues |
| **Verification** | All checks pass or issues identified |

---

### 7.6 Category F: Authorization & Access Control Tests

| Test ID | F1.1 |
|---------|------|
| **Name** | Admin discount application |
| **Priority** | P1 |
| **Preconditions** | Admin user logged in |
| **Test Steps** | 1. Add items to order<br>2. Apply discount |
| **Expected Result** | Discount applied successfully |
| **Verification** | Transaction shows discount |

| Test ID | F1.2 |
|---------|------|
| **Name** | Cashier cannot apply discount |
| **Priority** | P1 |
| **Preconditions** | Cashier user logged in |
| **Test Steps** | 1. Add items to order<br>2. Attempt to apply discount |
| **Expected Result** | Discount option unavailable or rejected |
| **Verification** | No discount applied |

| Test ID | F1.3 |
|---------|------|
| **Name** | Stock adjustment requires admin |
| **Priority** | P1 |
| **Preconditions** | Cashier user logged in |
| **Test Steps** | 1. Attempt manual stock adjustment |
| **Expected Result** | Action denied or not accessible |
| **Verification** | Stock unchanged |

---

## 8. Test Data Creation Guidelines

### 8.1 Stock Items Setup

```
Create the following stock items for testing:

INGREDIENTS:
| Name | Type | Initial Qty | Base Unit | Purpose |
|------|------|-------------|-----------|---------|
| Coffee Beans | Ingredient | 1000 | g | Hot beverages |
| Milk | Ingredient | 5000 | ml | Hot beverages |
| Sugar | Ingredient | 2000 | g | Various |
| Flour | Ingredient | 5000 | g | Food items |
| Olive Oil | Ingredient | 1000 | ml | Food items |

SELLABLE GOODS:
| Name | Type | Initial Qty | Base Unit | Purpose |
|------|------|-------------|-----------|---------|
| Bottled Water | Sellable Good | 100 | units | Direct sale |
| Potato Chips | Sellable Good | 50 | units | Direct sale |
| Napkins | Sellable Good | 200 | units | Direct sale |
```

### 8.2 Products Setup

```
Create products with variants and stock consumption:

PRODUCT: Espresso
- Variant: Single (price: 1.50)
  - Consumes: 10g Coffee Beans
- Variant: Double (price: 2.50)
  - Consumes: 20g Coffee Beans

PRODUCT: Cappuccino
- Variant: Small (price: 2.50)
  - Consumes: 10g Coffee Beans, 100ml Milk
- Variant: Large (price: 3.50)
  - Consumes: 15g Coffee Beans, 200ml Milk

PRODUCT: Sandwich
- Variant: Standard (price: 5.00)
  - Consumes: 100g Flour, 20ml Olive Oil
```

### 8.3 Test User Setup

```
TEST USERS:
| Username | Role | Password | Purpose |
|----------|------|----------|---------|
| testadmin | Admin | Test@123 | Admin operations |
| testcashier | Cashier | Test@123 | Standard POS |
| testmanager | Manager | Test@123 | Reports |
```

---

## 9. Test Environment Setup

### 9.1 Pre-Test Checklist

```bash
# 1. Verify Docker containers running
docker ps | grep bar_pos

# Expected output: 4 containers running
# - bar_pos_nginx
# - bar_pos_frontend  
# - bar_pos_backend
# - bar_pos_backend_db

# 2. Check application accessibility
curl -I http://192.168.1.70

# 3. Verify database connection
docker exec -it bar_pos_backend_db psql -U totalevo_user -d bar_pos -c "SELECT 1"

# 4. Clear previous test data (optional)
# docker exec -it bar_pos_backend_db psql -U totalevo_user -d bar_pos -c "TRUNCATE Transaction, StockAdjustment RESTART IDENTITY"
```

### 9.2 Database State Verification

```sql
-- Verify stock items exist
SELECT id, name, quantity, type FROM "StockItem" ORDER BY name;

-- Verify products with variants
SELECT p.name as product, v.name as variant, v.id as variant_id 
FROM "Product" p 
JOIN "ProductVariant" v ON p.id = v."productId"
ORDER BY p.name, v.name;

-- Verify stock consumption configurations
SELECT v.name as variant, s.name as stock_item, sc.quantity 
FROM "StockConsumption" sc
JOIN "ProductVariant" v ON sc."variantId" = v.id
JOIN "StockItem" s ON sc."stockItemId" = s.id
ORDER BY v.name;

-- Check for orphaned references
SELECT * FROM "StockConsumption" 
WHERE "stockItemId" NOT IN (SELECT id FROM "StockItem");
```

### 9.3 Browser Setup for Playwright MCP

```
1. Ensure Playwright MCP Server is running
2. Navigate to: http://192.168.1.70
3. Login with test credentials
4. Verify POS screen loads correctly
```

---

## 10. Test Execution Workflow

### 10.1 Execution Phases

```
Phase 1: SMOKE TESTS (Day 1 Morning)
+----------------------------------+
| P0 tests: A1.1, A1.2, B1.1      |
| Verify basic functionality      |
+----------------------------------+
           |
           v
Phase 2: CORE FUNCTIONAL (Day 1-2)
+----------------------------------+
| P0-P1 tests: A1, A2, B1, B2, C1 |
| Core payment and stock flows    |
+----------------------------------+
           |
           v
Phase 3: CONCURRENCY (Day 2-3)
+----------------------------------+
| P2 tests: E1, E2                |
| Race conditions and integrity   |
+----------------------------------+
           |
           v
Phase 4: EDGE CASES (Day 3)
+----------------------------------+
| P2-P3 tests: A3, A4, D1, D2     |
| Boundaries and special cases    |
+----------------------------------+
           |
           v
Phase 5: REGRESSION (Day 4)
+----------------------------------+
| Re-run failed tests             |
| Final verification              |
+----------------------------------+
```

### 10.2 Daily Test Execution Process

```
1. Morning Setup
   +------------------------+
   | Verify environment     |
   | Reset test data        |
   | Start logging          |
   +------------------------+

2. Test Execution
   +------------------------+
   | Execute scheduled tests|
   | Document results       |
   | Log defects immediately|
   +------------------------+

3. End of Day
   +------------------------+
   | Update test tracker    |
   | Review defects         |
   | Plan next day          |
   +------------------------+
```

### 10.3 Test Result Documentation

Each test execution must document:

```markdown
## Test Execution: [Test ID]
- **Date/Time**: YYYY-MM-DD HH:MM
- **Tester**: [Name]
- **Environment**: [URL/Build]
- **Status**: PASS/FAIL/BLOCKED
- **Duration**: [minutes]
- **Steps Executed**: [list]
- **Actual Result**: [description]
- **Evidence**: [screenshots/logs]
- **Defects**: [linked defect IDs]
- **Notes**: [observations]
```

---

## 11. Defect Logging Guidelines

### 11.1 Defect Severity Levels

| Severity | Definition | Response Time |
|----------|------------|---------------|
| **Critical** | System unusable, data loss, security breach | Immediate |
| **High** | Major feature broken, no workaround | 4 hours |
| **Medium** | Feature partially working, workaround exists | 24 hours |
| **Low** | Minor issue, cosmetic | Next sprint |

### 11.2 Defect Priority Levels

| Priority | Definition | Scheduling |
|----------|------------|------------|
| **P1** | Must fix before release | Immediate |
| **P2** | Should fix before release | Current sprint |
| **P3** | Nice to have fix | Backlog |
| **P4** | Low impact, schedule permitting | Future |

### 11.3 Defect Report Template

```markdown
# Defect Report: DEF-[sequence]

## Summary
[Brief description of the defect]

## Description
[Detailed description of what happened vs what was expected]

## Environment
- App Version: [version]
- Browser: [browser/version]
- OS: [operating system]
- URL: [specific URL]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Result
[What should have happened]

## Actual Result
[What actually happened]

## Severity: [Critical/High/Medium/Low]
## Priority: [P1/P2/P3/P4]

## Attachments
- [Screenshot]
- [Log file]
- [Database query result]

## Related Test Case
[Test ID]

## Notes
[Any additional information]
```

### 11.4 Defect Tracking

All defects should be tracked with the following information:
- Unique defect ID (DEF-XXX)
- Creation date
- Reporter
- Assigned developer
- Status (New, In Progress, Fixed, Verified, Closed)
- Resolution (Fixed, Won't Fix, Duplicate, Cannot Reproduce)

---

## 12. Risk Assessment

### 12.1 Risk Matrix

| Risk ID | Description | Likelihood | Impact | Risk Level | Mitigation |
|---------|-------------|------------|--------|------------|------------|
| R1 | Race condition causes negative stock | Medium | High | **HIGH** | Use atomic operations, add DB constraint |
| R2 | Payment fails but stock deducted | Low | Critical | **HIGH** | Verify transaction rollback |
| R3 | Idempotency not enforced | Low | High | **MEDIUM** | Test replay scenarios thoroughly |
| R4 | Concurrent payment causes data corruption | Low | Critical | **HIGH** | Test parallel executions |
| R5 | Stock adjustment audit incomplete | Medium | Medium | **MEDIUM** | Verify all adjustments logged |
| R6 | Recipe change affects ongoing orders | Low | Medium | **LOW** | Document configuration change impact |
| R7 | Test environment differs from production | Medium | Medium | **MEDIUM** | Use same configuration |
| R8 | Performance degradation under load | Medium | Medium | **MEDIUM** | Monitor during concurrency tests |

### 12.2 Contingency Plans

| Scenario | Contingency |
|----------|-------------|
| Environment unavailable | Have backup test environment ready |
| Critical defect found | Stop testing, escalate immediately |
| Test data corruption | Have database restore script ready |
| Playwright MCP failure | Use manual testing procedures |

---

## 13. Schedule

### 13.1 Test Schedule Overview

```
WEEK 1: TEST PLANNING & SETUP
+------------------------------------------+
| Day 1 | Environment setup, test data prep |
| Day 2 | Test data verification, dry run    |
+------------------------------------------+

WEEK 2: TEST EXECUTION
+------------------------------------------+
| Day 1 | Phase 1: Smoke tests (P0)         |
| Day 2 | Phase 2: Core functional (P0-P1)  |
| Day 3 | Phase 3: Concurrency tests (P2)   |
| Day 4 | Phase 4: Edge cases (P2-P3)       |
| Day 5 | Phase 5: Regression & retesting   |
+------------------------------------------+

WEEK 3: DEFECT VERIFICATION & REPORTING
+------------------------------------------+
| Day 1-2 | Verify fixes for critical defects |
| Day 3   | Final regression                  |
| Day 4   | Test report compilation           |
| Day 5   | Sign-off meeting                  |
+------------------------------------------+
```

### 13.2 Detailed Daily Schedule

| Day | Date | Activities | Tests Planned |
|-----|------|------------|---------------|
| 1 | T+0 | Environment setup | N/A |
| 2 | T+1 | Data setup, verification | N/A |
| 3 | T+2 | Smoke tests | A1.1, A1.2, B1.1, B1.3 |
| 4 | T+3 | Core payment tests | A1.3-A1.5, A2.1-A2.5 |
| 5 | T+4 | Idempotency tests | A3.1-A3.5 |
| 6 | T+5 | Stock consumption tests | B1.2-B1.4, B2.1-B2.5 |
| 7 | T+6 | Stock integrity tests | B3.1-B3.4 |
| 8 | T+7 | Recipe management tests | C1.1-C1.4, C2.1-C2.4 |
| 9 | T+8 | Inventory tests | D1.1-D1.3, D2.1-D2.4 |
| 10 | T+9 | Concurrency tests | E1.1-E1.3, E2.1-E2.4 |
| 11 | T+10 | Authorization tests | F1.1-F1.3 |
| 12 | T+11 | Edge cases | A4.1-A4.4, C3.1-C3.2 |
| 13 | T+12 | Regression | All failed tests |
| 14 | T+13 | Final verification | P0 tests |
| 15 | T+14 | Report & sign-off | N/A |

---

## 14. Resource Allocation

### 14.1 Team Requirements

| Role | Count | Responsibilities |
|------|-------|-------------------|
| Test Lead | 1 | Planning, coordination, reporting |
| QA Engineer | 2 | Test execution, defect logging |
| DB Administrator | 1 | Database setup, data verification |
| Developer Support | 1 | Fix verification, clarifications |

### 14.2 Tool Requirements

| Tool | Purpose | License |
|------|---------|---------|
| Playwright MCP | Browser automation | Existing |
| PostgreSQL Client | DB queries | Existing |
| Docker | Environment management | Existing |
| Markdown Editor | Documentation | Existing |

### 14.3 Environment Resources

| Resource | Specification | Purpose |
|----------|---------------|---------|
| Test Database | PostgreSQL Docker | Test data storage |
| Application Server | Docker container | Test execution |
| Browser | Chrome/Firefox | UI testing |

---

## 15. Sign-Off Criteria

### 15.1 Entry Criteria for Sign-Off

| Criterion | Requirement |
|-----------|-------------|
| Test Execution | 100% of planned tests executed |
| P0 Tests | 100% pass rate |
| P1 Tests | 100% pass rate |
| P2 Tests | >= 95% pass rate |
| P3 Tests | >= 90% pass rate |
| Critical Defects | All resolved and verified |
| High Defects | All resolved or accepted risk |
| Documentation | Complete test report submitted |

### 15.2 Test Report Requirements

The final test report must include:

1. **Executive Summary**
   - Overall test results
   - Pass/fail statistics
   - Key findings

2. **Test Coverage Report**
   - Tests executed vs planned
   - Coverage by category
   - Coverage by priority

3. **Defect Summary**
   - Total defects found
   - By severity and priority
   - Resolution status

4. **Risk Assessment Update**
   - Residual risks
   - Recommendations

5. **Sign-Off Recommendation**
   - Go/No-Go recommendation
   - Conditions (if any)

### 15.3 Sign-Off Form

```
TEST COMPLETION SIGN-OFF

Project: Bar POS Transaction & Stock System
Test Plan Version: 1.0
Test Period: [Start Date] - [End Date]

TEST METRICS:
- Total Tests Planned: [number]
- Tests Executed: [number]
- Tests Passed: [number]
- Tests Failed: [number]
- Tests Blocked: [number]
- Pass Rate: [percentage]

DEFECT METRICS:
- Total Defects Found: [number]
- Critical: [number] (All Fixed: Y/N)
- High: [number] (All Fixed: Y/N)
- Medium: [number] (Fixed: [number])
- Low: [number] (Fixed: [number])

RECOMMENDATION:
[ ] APPROVED for Production Release
[ ] APPROVED with Conditions: [specify]
[ ] NOT APPROVED - Issues: [specify]

Signatures:

Test Lead: ________________ Date: ________
QA Manager: ________________ Date: ________
Development Lead: ________________ Date: ________
Product Owner: ________________ Date: ________
```

---

## 16. Appendices

### Appendix A: API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/transactions/process-payment` | POST | Atomic payment processing |
| `/api/transactions` | GET | List transactions |
| `/api/transactions/:id` | GET | Get transaction details |
| `/api/transactions/reconcile` | GET | Reconcile transactions |
| `/api/stock-items` | GET/POST | Stock item management |
| `/api/stock-items/:id` | GET/PUT/DELETE | Single stock item |
| `/api/stock-items/update-levels` | PUT | Batch stock update |
| `/api/stock-items/orphaned-references` | GET | Find orphaned refs |
| `/api/stock-items/cleanup-orphaned` | POST | Remove orphaned refs |
| `/api/stock-items/validate-integrity` | GET | Integrity check |
| `/api/stock-adjustments` | GET/POST | Stock adjustments |
| `/api/consumption-reports/itemised` | GET | Consumption report |
| `/api/products` | GET/POST | Product management |
| `/api/products/:id` | GET/PUT/DELETE | Single product |
| `/api/order-sessions/current` | GET/POST/PUT | Order session management |

### Appendix B: Database Tables Reference

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `Transaction` | Payment records | id, items, total, status, userId |
| `StockItem` | Inventory items | id, name, quantity, type, baseUnit |
| `StockConsumption` | Recipe definitions | variantId, stockItemId, quantity |
| `StockAdjustment` | Adjustment audit | id, stockItemId, quantity, reason, userId |
| `Product` | Product definitions | id, name, categoryId |
| `ProductVariant` | Product variations | id, productId, name, price |
| `OrderSession` | Active orders | id, userId, items, status, version |

### Appendix C: Error Code Reference

| Error Code | Message | Cause |
|------------|---------|-------|
| 400 | "Items array cannot be empty" | Empty order |
| 400 | "Subtotal mismatch" | Price calculation error |
| 400 | "Insufficient stock for item [name]" | Stock exhaustion |
| 400 | "Cannot delete item in use" | Referential integrity |
| 401 | "Unauthorized" | Invalid/expired token |
| 403 | "Forbidden: Admin required" | Role-based restriction |
| 409 | "CONFLICT: Order session was modified" | Concurrent modification |

### Appendix D: Test Execution Checklist

```
PRE-TEST CHECKLIST:
[ ] Docker containers running
[ ] Application accessible at http://192.168.1.70
[ ] Admin login working (admin/admin123)
[ ] Database connection verified
[ ] Test data loaded
[ ] Playwright MCP available

DAILY CHECKLIST:
[ ] Environment status verified
[ ] Previous day's defects reviewed
[ ] Test data reset (if needed)
[ ] Test execution log started
[ ] Breaks scheduled

POST-TEST CHECKLIST:
[ ] All test results documented
[ ] Defects logged with evidence
[ ] Test tracker updated
[ ] Database state captured
[ ] Next day's tests prepared
```

---

**Document End**

*This test plan is a living document and should be updated as testing progresses and new information becomes available.*
