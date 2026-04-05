# Implementation Plan: Receipt Issuance from Payment Modal

**Document Version:** 1.1  
**Created:** 2026-04-04  
**Last Updated:** 2026-04-04  
**Status:** Pending Approval

---

## 1. Executive Summary

This plan details the integration of a receipt issuance feature directly into the existing payment modal workflow. The feature introduces three administrative configuration options and supports per-user preference overrides, with robust error handling via a background retry queue.

### Difficulty Assessment: Medium

| Complexity Level | Description |
|------------------|-------------|
| **Low** | Settings infrastructure, database schema, frontend settings UI - follows existing patterns |
| **Medium** | Payment modal integration, transaction handler modifications |
| **Medium-High** | Retry queue system, background worker, async coordination |

---

## 2. Requirements Analysis

### 2.1 Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | Administrators can enable/disable receipt issuance capability from the payment modal globally |
| FR-2 | Administrators can configure whether the receipt issuance option is pre-selected by default |
| FR-3 | Administrators can configure whether receipts are issued immediately or created as drafts first |
| FR-4 | Individual users can override the default receipt issuance preference |
| FR-5 | Receipt issuance option is available for all payment methods (Cash, Card, Complimentary) |
| FR-6 | If receipt issuance fails post-payment, the system queues it for automatic retry |
| FR-7 | Users are notified of pending/failed receipt generation |

### 2.2 Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-1 | Receipt issuance must not block payment processing (async where possible) |
| NFR-2 | System must handle concurrent payment/receipt requests safely |
| NFR-3 | UI must remain responsive during receipt generation |
| NFR-4 | Audit trail must capture all receipt-related actions from payment modal |

---

## 3. Implementation Tickets

### Ticket #1: Database Schema & Migration

**Title:** Add database schema for receipt-from-payment-modal feature

**Complexity:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** None

**Description:**  
Create Prisma schema changes and migration script for all new database fields.

**Acceptance Criteria:**
- [ ] `Settings` model has `allowReceiptFromPaymentModal`, `receiptIssueDefaultSelected`, `receiptIssueMode` fields
- [ ] `User` model has `receiptFromPaymentDefault` field
- [ ] `Receipt` model has `issuedFromPaymentModal`, `generationStatus`, `generationAttempts`, `lastGenerationAttempt`, `generationError` fields
- [ ] `ReceiptGenerationQueue` model created with all required fields and indexes
- [ ] Migration script runs successfully without data loss
- [ ] Prisma client regenerated

**Files to Modify:**
- `backend/prisma/schema.prisma`

**Commands to Run:**
```bash
cd backend
npx prisma migrate dev --name add_receipt_from_payment_modal
npx prisma generate
```

---

### Ticket #2: Backend Types Extension

**Title:** Extend backend TypeScript types for new settings and API payloads

**Complexity:** Low  
**Estimated Time:** 1 hour  
**Dependencies:** Ticket #1

**Description:**  
Update TypeScript interfaces to include new settings fields and extend payment request/response types.

**Acceptance Criteria:**
- [ ] `Settings` interface includes `receiptFromPaymentModal` nested object
- [ ] `ProcessPaymentRequest` interface includes optional `issueReceipt` field
- [ ] `ProcessPaymentResponse` interface includes optional `receipt` object
- [ ] Types exported correctly for use in handlers

**Files to Modify:**
- `backend/src/types.ts`
- `backend/src/types/settings.ts` (if exists)

---

### Ticket #3: Settings Handler Extension

**Title:** Extend settings handler for receipt-from-modal settings

**Complexity:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Ticket #1, Ticket #2

**Description:**  
Modify the settings handler to include new fields in GET/PUT operations with proper validation.

**Acceptance Criteria:**
- [ ] GET `/api/settings` returns new receipt-from-modal settings
- [ ] PUT `/api/settings` accepts and validates new settings
- [ ] `receiptIssueMode` validation: must be "immediate" or "draft"
- [ ] Settings cache cleared on update
- [ ] Existing tests pass

**Files to Modify:**
- `backend/src/handlers/settings.ts`

---

### Ticket #4: User Preference API Endpoints

**Title:** Add API endpoints for user receipt preference management

**Complexity:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Ticket #1

**Description:**  
Create endpoints to get and update user-specific receipt preferences.

**Acceptance Criteria:**
- [ ] GET `/api/users/:id/receipt-preference` returns user's preference
- [ ] PUT `/api/users/:id/receipt-preference` updates user's preference
- [ ] Users can only update their own preference (unless admin)
- [ ] Null value allowed (falls back to global default)
- [ ] Proper error handling for invalid user ID

**Files to Modify:**
- `backend/src/handlers/users.ts` (or create new handler)

---

### Ticket #5: Payment Modal Receipt Service

**Title:** Create paymentModalReceiptService for receipt orchestration

**Complexity:** Medium  
**Estimated Time:** 4 hours  
**Dependencies:** Ticket #1, Ticket #2

**Description:**  
Create new service that handles receipt creation logic when triggered from payment modal.

**Acceptance Criteria:**
- [ ] `canIssueReceiptFromPaymentModal()` checks feature enabled and user permissions
- [ ] `getUserReceiptPreference()` returns user override or global default
- [ ] `createReceiptFromPayment(transactionId, issueMode)` creates receipt from transaction
- [ ] Handles both "immediate" and "draft" modes correctly
- [ ] Sets `issuedFromPaymentModal = true` on created receipts
- [ ] Proper error handling with specific error codes

**Files to Create:**
- `backend/src/services/paymentModalReceiptService.ts`

---

### Ticket #6: Transaction Handler Modification

**Title:** Modify processPayment endpoint to support receipt issuance

**Complexity:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Ticket #5

**Description:**  
Extend the transaction payment handler to accept receipt issuance parameter and trigger receipt creation.

**Acceptance Criteria:**
- [ ] POST `/api/transactions/process-payment` accepts `issueReceipt` boolean
- [ ] On successful payment, if `issueReceipt: true`, calls paymentModalReceiptService
- [ ] Response includes receipt info (id, number, status, pdfUrl)
- [ ] Payment success not blocked by receipt creation failure
- [ ] Idempotency maintained for duplicate requests

**Files to Modify:**
- `backend/src/handlers/transactions.ts`

---

### Ticket #7: Receipt Generation Queue Table

**Title:** Implement ReceiptGenerationQueue database model and service

**Complexity:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Ticket #1

**Description:**  
Create the queue service for managing failed receipt generation attempts.

**Acceptance Criteria:**
- [ ] `addToQueue(receiptId)` adds receipt to retry queue
- [ ] `getNextPending()` retrieves next item to process
- [ ] `markProcessing(queueId)` sets status to processing
- [ ] `markCompleted(queueId)` sets status to completed
- [ ] `markFailed(queueId, error)` increments attempts, sets nextAttemptAt with exponential backoff
- [ ] Query uses proper indexing for performance

**Files to Create:**
- `backend/src/services/receiptQueueService.ts`

---

### Ticket #8: Receipt Retry API Endpoints

**Title:** Add receipt retry and pending endpoints

**Complexity:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Ticket #7

**Description:**  
Add API endpoints for manual retry and fetching pending receipts.

**Acceptance Criteria:**
- [ ] GET `/api/receipts/pending` returns pending/failed receipts for current user
- [ ] POST `/api/receipts/:id/retry` triggers immediate retry for failed receipt
- [ ] Proper authorization (user can only see/retry their own receipts, admin can see all)
- [ ] Returns updated receipt status after retry

**Files to Modify:**
- `backend/src/handlers/receiptHandler.ts`

---

### Ticket #9: Receipt Generation Background Worker

**Title:** Implement background worker for automatic receipt retry

**Complexity:** Medium-High  
**Estimated Time:** 4 hours  
**Dependencies:** Ticket #7, Ticket #8

**Description:**  
Create background job that polls the queue and retries failed receipt generations.

**Acceptance Criteria:**
- [ ] Worker polls queue at configurable interval (default: 30 seconds)
- [ ] Processes items where `nextAttemptAt <= now()` and `status = 'pending'`
- [ ] Exponential backoff: 1m, 5m, 15m, 1h, 6h between attempts
- [ ] Max 5 attempts before marking as permanently failed
- [ ] Updates `Receipt.generationStatus` appropriately
- [ ] Graceful shutdown handling
- [ ] Logging for debugging

**Files to Create:**
- `backend/src/jobs/receiptGenerationWorker.ts`

---

### Ticket #10: Frontend Settings Types

**Title:** Extend frontend TypeScript types for new settings

**Complexity:** Low  
**Estimated Time:** 1 hour  
**Dependencies:** None (can run parallel with backend tickets)

**Description:**  
Update frontend TypeScript interfaces to include new settings fields.

**Acceptance Criteria:**
- [ ] `Settings` interface includes `receiptFromPaymentModal` object
- [ ] Types match backend response structure
- [ ] Exported from appropriate barrel file

**Files to Modify:**
- `frontend/types/settings.ts` (or equivalent)
- `frontend/services/settingService.ts`

---

### Ticket #11: Frontend Settings UI

**Title:** Add receipt settings section to Settings Modal

**Complexity:** Low  
**Estimated Time:** 3 hours  
**Dependencies:** Ticket #10, Ticket #3

**Description:**  
Add UI controls for the three new receipt settings in the admin settings modal.

**Acceptance Criteria:**
- [ ] New "Receipt from Payment" section in settings modal
- [ ] Toggle switch for "Allow receipt from payment modal"
- [ ] Toggle switch for "Default selected" (shown when main toggle is enabled)
- [ ] Radio buttons for "Issue mode" (Immediate/Draft)
- [ ] Settings save correctly via API
- [ ] Proper loading states and error handling
- [ ] Follows existing UI patterns (similar to EmailSettings toggle)

**Files to Modify:**
- `frontend/components/SettingsModal.tsx`
- `frontend/components/ReceiptSettings.tsx` (new component, recommended)

---

### Ticket #12: User Preference UI

**Title:** Add user receipt preference to user profile/settings

**Complexity:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Ticket #4, Ticket #10

**Description:**  
Add UI for users to set their personal receipt preference override.

**Acceptance Criteria:**
- [ ] Checkbox/toggle in user profile section
- [ ] Three options: "Use global default", "Always issue receipt", "Never issue receipt"
- [ ] Saves via user preference API
- [ ] Shows current global default value for context

**Files to Modify:**
- `frontend/components/UserProfile.tsx` (or equivalent)
- `frontend/services/userService.ts`

---

### Ticket #13: Transaction Service Extension

**Title:** Extend frontend transactionService for receipt parameter

**Complexity:** Low  
**Estimated Time:** 1 hour  
**Dependencies:** Ticket #10

**Description:**  
Update the transaction service to support the new `issueReceipt` parameter.

**Acceptance Criteria:**
- [ ] `ProcessPaymentData` interface includes `issueReceipt?: boolean`
- [ ] `processPayment()` function passes the parameter to API
- [ ] Response type includes receipt info

**Files to Modify:**
- `frontend/services/transactionService.ts`

---

### Ticket #14: Payment Context Update

**Title:** Modify PaymentContext to handle receipt issuance

**Complexity:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Ticket #13

**Description:**  
Update PaymentContext's handleConfirmPayment to accept and process receipt issuance parameter.

**Acceptance Criteria:**
- [ ] `handleConfirmPayment()` accepts `issueReceipt` parameter
- [ ] Passes parameter to `transactionService.processPayment()`
- [ ] Handles receipt response data
- [ ] Shows appropriate success message based on receipt status
- [ ] Handles pending/queued receipt status gracefully

**Files to Modify:**
- `frontend/contexts/PaymentContext.tsx`

---

### Ticket #15: Payment Modal UI - Receipt Checkbox

**Title:** Add receipt issuance checkbox to PaymentModal

**Complexity:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Ticket #14, Ticket #11, Ticket #12

**Description:**  
Add the "Issue Receipt" checkbox to the payment modal with proper state management.

**Acceptance Criteria:**
- [ ] Checkbox visible only when feature enabled in settings
- [ ] Default state based on user preference or global default
- [ ] Checkbox above payment buttons
- [ ] Proper styling matching existing modal design
- [ ] State passed to `onConfirmPayment()`
- [ ] Checkbox hidden for complimentary orders when appropriate (based on settings)

**Files to Modify:**
- `frontend/components/PaymentModal.tsx`

---

### Ticket #16: Payment Success with Receipt Feedback

**Title:** Show receipt status in payment success flow

**Complexity:** Medium  
**Estimated Time:** 2 hours  
**Dependencies:** Ticket #15

**Description:**  
Display appropriate feedback when receipt is issued or queued after payment.

**Acceptance Criteria:**
- [ ] Success message includes receipt number if issued immediately
- [ ] Shows "Receipt queued" message if async generation
- [ ] Shows "Receipt saved as draft" message in draft mode
- [ ] Loading indicator during receipt processing
- [ ] Error handling for receipt failures (payment still succeeds)

**Files to Modify:**
- `frontend/components/PaymentModal.tsx`
- `frontend/components/PaymentSuccess.tsx` (if exists)

---

### Ticket #17: Receipt Status Notification Badge

**Title:** Add notification indicator for pending receipts

**Complexity:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Ticket #8

**Description:**  
Add a badge/indicator showing count of pending or failed receipts requiring attention.

**Acceptance Criteria:**
- [ ] Badge in navigation bar or admin panel
- [ ] Shows count of receipts with `generationStatus = 'pending' or 'failed'`
- [ ] Clicking badge navigates to receipt list filtered to pending/failed
- [ ] Polls for updates or uses existing refresh mechanism
- [ ] Badge updates when receipts are processed

**Files to Modify:**
- `frontend/components/NavBar.tsx` (or equivalent)
- `frontend/components/ReceiptStatusBadge.tsx` (new component)

---

### Ticket #18: Receipt List - Generation Status Column

**Title:** Add generation status to receipt list view

**Complexity:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Ticket #8

**Description:**  
Display the new generation status field in the receipt list to show pending/failed states.

**Acceptance Criteria:**
- [ ] New column showing generation status (Pending, Completed, Failed)
- [ ] Retry button for failed receipts
- [ ] Visual indicator for pending receipts (spinner or badge)
- [ ] Filter by generation status

**Files to Modify:**
- `frontend/components/ReceiptList.tsx` (or equivalent)

---

### Ticket #19: Unit Tests - Backend Services

**Title:** Add unit tests for new backend services

**Complexity:** Medium  
**Estimated Time:** 4 hours  
**Dependencies:** Tickets #5, #7, #9

**Description:**  
Write unit tests for the new paymentModalReceiptService and receiptQueueService.

**Acceptance Criteria:**
- [ ] Tests for `paymentModalReceiptService`:
  - Preference resolution logic
  - Receipt creation flow
  - Immediate vs draft mode handling
- [ ] Tests for `receiptQueueService`:
  - Queue add/get/update operations
  - Exponential backoff calculation
  - Max attempts handling
- [ ] 80%+ code coverage for new services

**Files to Create:**
- `backend/src/__tests__/services/paymentModalReceiptService.test.ts`
- `backend/src/__tests__/services/receiptQueueService.test.ts`

---

### Ticket #20: Integration Tests - Payment with Receipt

**Title:** Add integration tests for payment with receipt flow

**Complexity:** Medium  
**Estimated Time:** 3 hours  
**Dependencies:** Tickets #6, #8

**Description:**  
Write integration tests for the complete payment-with-receipt flow.

**Acceptance Criteria:**
- [ ] Test: Payment with `issueReceipt: true` creates receipt
- [ ] Test: Payment with `issueReceipt: false` does not create receipt
- [ ] Test: Immediate mode issues receipt synchronously
- [ ] Test: Draft mode creates draft only
- [ ] Test: Receipt creation failure does not block payment
- [ ] Test: Idempotency with receipt parameter

**Files to Create:**
- `backend/src/__tests__/integration/payment-receipt.test.ts`

---

### Ticket #21: E2E Tests - Payment Modal Receipt

**Title:** Add end-to-end tests for receipt from payment modal

**Complexity:** Medium  
**Estimated Time:** 4 hours  
**Dependencies:** All previous tickets

**Description:**  
Write E2E tests using Playwright MCP to verify the complete user flow.

**Acceptance Criteria:**
- [ ] E2E-RPM-01: Issue receipt immediately after payment
- [ ] E2E-RPM-02: Draft mode creates draft only
- [ ] E2E-RPM-03: Feature disabled hides checkbox
- [ ] E2E-RPM-04: User preference override works
- [ ] E2E-RPM-05: All payment methods work
- [ ] Tests use Playwright MCP server (not npm playwright package)

**Files to Create:**
- `test-files/e2e/receipt-from-payment-modal.spec.ts`

---

### Ticket #22: Worker Integration and Startup

**Title:** Integrate receipt generation worker with application startup

**Complexity:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** Ticket #9

**Description:**  
Wire up the background worker to start with the application and handle graceful shutdown.

**Acceptance Criteria:**
- [ ] Worker starts with backend application
- [ ] Configurable via environment variable (enable/disable)
- [ ] Graceful shutdown on SIGTERM/SIGINT
- [ ] In-progress items marked back to pending on shutdown
- [ ] Health check endpoint shows worker status

**Files to Modify:**
- `backend/src/index.ts` (or main entry point)
- `backend/src/jobs/index.ts` (if job registry exists)

---

### Ticket #23: Documentation

**Title:** Update documentation for receipt from payment modal feature

**Complexity:** Low  
**Estimated Time:** 2 hours  
**Dependencies:** All previous tickets

**Description:**  
Update API documentation and user guide for the new feature.

**Acceptance Criteria:**
- [ ] API docs updated with new endpoints and parameters
- [ ] Settings documentation includes new options
- [ ] User guide for enabling/configuring the feature
- [ ] Troubleshooting guide for common issues

**Files to Create/Modify:**
- `docs/api/receipt-from-payment-modal.md`
- `docs/user-guide/receipt-settings.md`

---

## 4. Ticket Dependency Graph

```
Ticket #1 (DB Schema)
    │
    ├──► Ticket #2 (Types)
    │        │
    │        └──► Ticket #5 (Receipt Service)
    │                 │
    │                 └──► Ticket #6 (Transaction Handler)
    │
    ├──► Ticket #3 (Settings Handler)
    │        │
    │        └──► Ticket #11 (Settings UI) ──► Ticket #15 (Payment Modal UI)
    │                                            │
    ├──► Ticket #4 (User Pref API)               │
    │        │                                   │
    │        └──► Ticket #12 (User Pref UI) ─────┘
    │                                             │
    ├──► Ticket #7 (Queue Service)                │
    │        │                                    │
    │        ├──► Ticket #8 (Retry API) ──────────┼──► Ticket #17 (Notification Badge)
    │        │                                    │          │
    │        └──► Ticket #9 (Worker)             │          └──► Ticket #18 (Receipt List)
    │                 │                          │
    │                 └──► Ticket #22 (Startup)  │
    │                                            │
Ticket #10 (Frontend Types) ──► Ticket #13 ──────┘
                                       │
                                       └──► Ticket #14 (Payment Context)
                                                │
                                                └──► Ticket #16 (Success Feedback)

Parallel Testing Track:
Ticket #5, #7, #9 ──► Ticket #19 (Unit Tests)
Ticket #6, #8 ──► Ticket #20 (Integration Tests)
All tickets ──► Ticket #21 (E2E Tests)
All tickets ──► Ticket #23 (Documentation)
```

---

## 5. Sprint Planning Recommendation

### Sprint 1: Foundation (10 hours)
- Ticket #1: Database Schema & Migration (2h)
- Ticket #2: Backend Types Extension (1h)
- Ticket #3: Settings Handler Extension (2h)
- Ticket #4: User Preference API Endpoints (2h)
- Ticket #10: Frontend Settings Types (1h)
- Ticket #13: Transaction Service Extension (1h)

### Sprint 2: Core Backend (10 hours)
- Ticket #5: Payment Modal Receipt Service (4h)
- Ticket #6: Transaction Handler Modification (3h)
- Ticket #7: Receipt Generation Queue Table (3h)

### Sprint 3: Retry System (8 hours)
- Ticket #8: Receipt Retry API Endpoints (2h)
- Ticket #9: Receipt Generation Background Worker (4h)
- Ticket #22: Worker Integration and Startup (2h)

### Sprint 4: Frontend Settings (6 hours)
- Ticket #11: Frontend Settings UI (3h)
- Ticket #12: User Preference UI (2h)

### Sprint 5: Payment Modal Integration (8 hours)
- Ticket #14: Payment Context Update (3h)
- Ticket #15: Payment Modal UI - Receipt Checkbox (3h)
- Ticket #16: Payment Success with Receipt Feedback (2h)

### Sprint 6: Notifications & Polish (7 hours)
- Ticket #17: Receipt Status Notification Badge (3h)
- Ticket #18: Receipt List - Generation Status Column (2h)
- Ticket #23: Documentation (2h)

### Sprint 7: Testing (11 hours)
- Ticket #19: Unit Tests - Backend Services (4h)
- Ticket #20: Integration Tests - Payment with Receipt (3h)
- Ticket #21: E2E Tests - Payment Modal Receipt (4h)

---

## 6. Risk Mitigation Summary

| Risk | Mitigation |
|------|------------|
| Retry queue complexity | Start with manual retry (Ticket #8), add automatic worker later (Ticket #9) |
| Async coordination issues | Payment always succeeds first; receipt queued on failure |
| Frontend state management | Follow existing PaymentModal patterns closely |
| Testing edge cases | Focus on happy path first, add edge cases in testing sprint |

---

## 7. Database Schema Modifications (Reference)

### 7.1 Settings Table Extensions

```prisma
model Settings {
  // ... existing fields ...

  // Receipt from Payment Modal Settings
  allowReceiptFromPaymentModal Boolean @default(false)
  receiptIssueDefaultSelected   Boolean @default(false)
  receiptIssueMode              String  @default("immediate") // "immediate" | "draft"
}
```

### 7.2 User Table Extensions

```prisma
model User {
  // ... existing fields ...

  // User receipt preferences
  receiptFromPaymentDefault Boolean? // null = use global setting
}
```

### 7.3 Receipt Table Extensions

```prisma
model Receipt {
  // ... existing fields ...

  // Payment modal origin tracking
  issuedFromPaymentModal Boolean @default(false)

  // Async processing status
  generationStatus       String    @default("pending") // "pending" | "completed" | "failed"
  generationAttempts     Int       @default(0)
  lastGenerationAttempt  DateTime?
  generationError        String?
}
```

### 7.4 New Receipt Generation Queue Table

```prisma
model ReceiptGenerationQueue {
  id              Int      @id @default(autoincrement())
  receiptId       Int      @unique
  receipt         Receipt  @relation(fields: [receiptId], references: [id])
  status          String   @default("pending") // "pending" | "processing" | "completed" | "failed"
  attempts        Int      @default(0)
  maxAttempts     Int      @default(5)
  nextAttemptAt   DateTime @default(now())
  lastError       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([status, nextAttemptAt])
}
```

---

## 8. Testing Strategy Summary

| Test Type | Coverage |
|-----------|----------|
| Unit Tests | Service logic, preference resolution, queue operations |
| Integration Tests | API endpoints, payment-receipt flow, retry mechanism |
| E2E Tests | Complete user flows via Playwright MCP |

---

## 9. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Tech Lead | | | |
| Security Review | | | |

---

**Document Status:** Pending Approval - No code implementation until approved.
