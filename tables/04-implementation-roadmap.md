# Implementation Roadmap: Tables vs Tabs

## Executive Summary

This document provides a step-by-step implementation roadmap for making tables work like tabs. The roadmap is organized into phases with clear dependencies, estimated effort, and acceptance criteria.

## Table of Contents

1. [Phase 1: Backend Changes](#phase-1-backend-changes)
2. [Phase 2: Frontend Changes](#phase-2-frontend-changes)
3. [Phase 3: Testing and Validation](#phase-3-testing-and-validation)
4. [Phase 4: Documentation and Deployment](#phase-4-documentation-and-deployment)
5. [Risk Assessment](#risk-assessment)
6. [Rollback Plan](#rollback-plan)

---

## Phase 1: Backend Changes

**Estimated Effort:** 3-4 days
**Priority:** Critical
**Dependencies:** None

### 1.1 Database Schema Updates

**Task:** Add till context to Table model, table association to Transaction model, and owner tracking to Tab model.

**Steps:**
1. Create migration file for Table till context
2. Create migration file for Transaction table association
3. Create migration file for Tab owner tracking
4. Run migrations in development environment
5. Verify schema changes in Prisma Studio
6. Test migration rollback

**Files to Modify:**
- [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)
- Create migration files in [`backend/prisma/migrations/`](../backend/prisma/migrations/)

**Acceptance Criteria:**
- [ ] Table model has `tillId` and `tillName` fields
- [ ] Transaction model has `tableId` and `tableName` fields
- [ ] Tab model has `ownerId` field
- [ ] All migrations run successfully
- [ ] Prisma Studio shows new fields
- [ ] Migration rollback works

**Estimated Time:** 2-3 hours

---

### 1.2 Create Activity Logging Service

**Task:** Implement activity logging service for tracking tab and table changes.

**Steps:**
1. Create `activityLogService.ts` file
2. Implement `logActivity` function
3. Implement `getActivityLogs` function
4. Add error handling
5. Write unit tests

**Files to Create:**
- [`backend/src/services/activityLogService.ts`](../backend/src/services/activityLogService.ts)

**Acceptance Criteria:**
- [ ] `logActivity` function creates activity log entries
- [ ] `getActivityLogs` function retrieves logs with filters
- [ ] Error handling prevents logging failures from breaking main flow
- [ ] Unit tests pass

**Estimated Time:** 2-3 hours

---

### 1.3 Add Tab Ownership Verification Middleware

**Task:** Create middleware to verify tab ownership before allowing modifications.

**Steps:**
1. Add `verifyTabOwnership` function to authorization middleware
2. Implement ownership check logic
3. Add error responses for unauthorized access
4. Write unit tests

**Files to Modify:**
- [`backend/src/middleware/authorization.ts`](../backend/src/middleware/authorization.ts)

**Acceptance Criteria:**
- [ ] Middleware verifies tab ownership
- [ ] Returns 403 for unauthorized access
- [ ] Returns 404 for non-existent tabs
- [ ] Unit tests pass

**Estimated Time:** 1-2 hours

---

### 1.4 Add Authentication to Tabs Handler

**Task:** Apply authentication middleware to all tabs endpoints.

**Steps:**
1. Import `authenticateToken` middleware
2. Apply to GET /api/tabs
3. Apply to GET /api/tabs/:id
4. Apply to POST /api/tabs
5. Apply to PUT /api/tabs/:id
6. Apply to DELETE /api/tabs/:id
7. Add ownership verification to PUT and DELETE
8. Add ownerId to tab creation
9. Test all endpoints

**Files to Modify:**
- [`backend/src/handlers/tabs.ts`](../backend/src/handlers/tabs.ts)

**Acceptance Criteria:**
- [ ] All endpoints require authentication
- [ ] PUT and DELETE verify ownership
- [ ] New tabs include ownerId
- [ ] Unauthorized requests return 401
- [ ] Forbidden requests return 403
- [ ] All tests pass

**Estimated Time:** 2-3 hours

---

### 1.5 Add Table Item Management Endpoints

**Task:** Implement CRUD endpoints for managing items on tables.

**Steps:**
1. Implement GET /api/tables/:id/items
2. Implement POST /api/tables/:id/items
3. Implement PUT /api/tables/:id/items
4. Implement DELETE /api/tables/:id/items
5. Add item validation
6. Add activity logging
7. Write unit tests

**Files to Modify:**
- [`backend/src/handlers/tables.ts`](../backend/src/handlers/tables.ts)

**Acceptance Criteria:**
- [ ] GET endpoint returns table items
- [ ] POST endpoint adds items to table
- [ ] PUT endpoint updates table items
- [ ] DELETE endpoint clears table items
- [ ] All endpoints validate items
- [ ] All endpoints log activity
- [ ] Unit tests pass

**Estimated Time:** 4-5 hours

---

### 1.6 Add Table-Tab Conversion Endpoints

**Task:** Implement endpoints for converting tables to tabs and assigning tabs to tables.

**Steps:**
1. Implement POST /api/tables/:id/convert-to-tab
2. Implement POST /api/tabs/:id/assign-to-table/:tableId
3. Add validation
4. Add activity logging
5. Handle data migration
6. Write unit tests

**Files to Modify:**
- [`backend/src/handlers/tables.ts`](../backend/src/handlers/tables.ts)
- [`backend/src/handlers/tabs.ts`](../backend/src/handlers/tabs.ts)

**Acceptance Criteria:**
- [ ] Table to tab conversion works
- [ ] Tab to table assignment works
- [ ] Items are properly migrated
- [ ] Table status is updated
- [ ] Activity is logged
- [ ] Unit tests pass

**Estimated Time:** 3-4 hours

---

### 1.7 Update Transaction Handler

**Task:** Add table association to transaction creation.

**Steps:**
1. Update POST /api/transactions to accept tableId and tableName
2. Update transaction creation to include table fields
3. Add validation
4. Write unit tests

**Files to Modify:**
- [`backend/src/handlers/transactions.ts`](../backend/src/handlers/transactions.ts)

**Acceptance Criteria:**
- [ ] Transaction creation accepts tableId and tableName
- [ ] Table fields are saved to database
- [ ] Validation works correctly
- [ ] Unit tests pass

**Estimated Time:** 1-2 hours

---

### 1.8 Update Table Deletion Logic

**Task:** Add check for items before allowing table deletion.

**Steps:**
1. Update DELETE /api/tables/:id
2. Add check for table items
3. Return error if items exist
4. Add activity logging
5. Write unit tests

**Files to Modify:**
- [`backend/src/handlers/tables.ts`](../backend/src/handlers/tables.ts)

**Acceptance Criteria:**
- [ ] Tables with items cannot be deleted
- [ ] Appropriate error message returned
- [ ] Activity is logged
- [ ] Unit tests pass

**Estimated Time:** 1 hour

---

### 1.9 Update Backend Type Definitions

**Task:** Update TypeScript types to reflect schema changes.

**Steps:**
1. Update Table interface
2. Update Transaction interface
3. Update Tab interface
4. Verify type safety

**Files to Modify:**
- [`backend/src/types.ts`](../backend/src/types.ts)

**Acceptance Criteria:**
- [ ] All interfaces match schema
- [ ] No TypeScript errors
- [ ] Types are exported correctly

**Estimated Time:** 30 minutes

---

### Phase 1 Summary

**Total Estimated Time:** 17-23 hours (2-3 days)

**Dependencies:**
- 1.1 must be completed before 1.2-1.9
- 1.2 must be completed before 1.5-1.8
- 1.3 must be completed before 1.4

**Deliverables:**
- Updated database schema
- Activity logging service
- Tab ownership verification middleware
- Authenticated tabs handler
- Table item management endpoints
- Table-tab conversion endpoints
- Updated transaction handler
- Updated table deletion logic
- Updated type definitions

---

## Phase 2: Frontend Changes

**Estimated Effort:** 4-5 days
**Priority:** Critical
**Dependencies:** Phase 1 complete

### 2.1 Update Shared Type Definitions

**Task:** Update TypeScript types to match backend schema changes.

**Steps:**
1. Update Table interface
2. Update Transaction interface
3. Update Tab interface
4. Verify type safety

**Files to Modify:**
- [`shared/types.ts`](../shared/types.ts)

**Acceptance Criteria:**
- [ ] All interfaces match backend types
- [ ] No TypeScript errors
- [ ] Types are exported correctly

**Estimated Time:** 30 minutes

---

### 2.2 Create Table Item Management Service

**Task:** Implement service functions for table item management.

**Steps:**
1. Create `tableService.ts` file (or update existing)
2. Implement `getTableItems` function
3. Implement `addItemsToTable` function
4. Implement `updateTableItems` function
5. Implement `clearTableItems` function
6. Implement `convertTableToTab` function
7. Implement `assignTabToTable` function
8. Add error handling
9. Write unit tests

**Files to Create/Modify:**
- [`frontend/services/tableService.ts`](../frontend/services/tableService.ts)

**Acceptance Criteria:**
- [ ] All functions implemented
- [ ] Error handling works
- [ ] Unit tests pass
- [ ] Functions are exported

**Estimated Time:** 3-4 hours

---

### 2.3 Update Transaction Service

**Task:** Update transaction service to support table association.

**Steps:**
1. Update `createTransaction` function signature
2. Add tableId and tableName parameters
3. Update API call
4. Write unit tests

**Files to Modify:**
- [`frontend/services/transactionService.ts`](../frontend/services/transactionService.ts)

**Acceptance Criteria:**
- [ ] Function accepts table parameters
- [ ] API call includes table fields
- [ ] Unit tests pass

**Estimated Time:** 1 hour

---

### 2.4 Update TableContext

**Task:** Add item management functions to TableContext.

**Steps:**
1. Add new functions to interface
2. Implement `getTableItems`
3. Implement `addItemsToTable`
4. Implement `updateTableItems`
5. Implement `clearTableItems`
6. Implement `convertTableToTab`
7. Implement `assignTabToTable`
8. Add optimistic updates
9. Add error handling
10. Add toast notifications

**Files to Modify:**
- [`frontend/components/TableContext.tsx`](../frontend/components/TableContext.tsx)

**Acceptance Criteria:**
- [ ] All functions implemented
- [ ] Optimistic updates work
- [ ] Error handling works
- [ ] Toast notifications shown
- [ ] No TypeScript errors

**Estimated Time:** 4-5 hours

---

### 2.5 Update TableManagement Component

**Task:** Add item management UI to TableManagement component.

**Steps:**
1. Add state for item management
2. Add handler for viewing table items
3. Add handler for clearing table items
4. Add handler for converting to tab
5. Create TableItemsModal component
6. Update table list UI
7. Add visual indicators for tables with items
8. Test all functionality

**Files to Modify:**
- [`frontend/components/TableManagement.tsx`](../frontend/components/TableManagement.tsx)

**Acceptance Criteria:**
- [ ] Can view table items
- [ ] Can clear table items
- [ ] Can convert table to tab
- [ ] Visual indicators show tables with items
- [ ] Modal displays items correctly
- [ ] All functionality works

**Estimated Time:** 5-6 hours

---

### 2.6 Update OrderPanel Component

**Task:** Add table-specific actions to OrderPanel component.

**Steps:**
1. Update props interface
2. Add handler for loading table items
3. Add handler for saving to table
4. Update button rendering
5. Add table-specific buttons
6. Test all functionality

**Files to Modify:**
- [`frontend/components/OrderPanel.tsx`](../frontend/components/OrderPanel.tsx)

**Acceptance Criteria:**
- [ ] Can load table items
- [ ] Can save to table
- [ ] Buttons display correctly
- [ ] All functionality works

**Estimated Time:** 3-4 hours

---

### 2.7 Update PaymentModal Component

**Task:** Add table-specific payment handling to PaymentModal component.

**Steps:**
1. Update props interface
2. Add handler for clearing table items
3. Add clear items checkbox
4. Update payment confirmation
5. Test all functionality

**Files to Modify:**
- [`frontend/components/PaymentModal.tsx`](../frontend/components/PaymentModal.tsx)

**Acceptance Criteria:**
- [ ] Can clear table items after payment
- [ ] Checkbox works correctly
- [ ] Payment confirmation works
- [ ] All functionality works

**Estimated Time:** 2-3 hours

---

### 2.8 Update TabManager Component

**Task:** Add table assignment UI to TabManager component.

**Steps:**
1. Update props interface
2. Add handler for assigning tab to table
3. Add table assignment button
4. Update tab list UI
5. Test all functionality

**Files to Modify:**
- [`frontend/components/TabManager.tsx`](../frontend/components/TabManager.tsx)

**Acceptance Criteria:**
- [ ] Can assign tab to table
- [ ] Button displays correctly
- [ ] All functionality works

**Estimated Time:** 2-3 hours

---

### 2.9 Update MainPOSInterface Component

**Task:** Add table item management handlers to MainPOSInterface component.

**Steps:**
1. Add handler for loading table items
2. Add handler for saving to table
3. Add handler for clearing table items
4. Update OrderPanel props
5. Update PaymentModal props
6. Test all functionality

**Files to Modify:**
- [`frontend/components/MainPOSInterface.tsx`](../frontend/components/MainPOSInterface.tsx)

**Acceptance Criteria:**
- [ ] All handlers implemented
- [ ] Props passed correctly
- [ ] All functionality works

**Estimated Time:** 2-3 hours

---

### 2.10 Add Visual Indicators for Tables

**Task:** Add visual indicators in table layout to show tables with items.

**Steps:**
1. Update TableLayoutEditor component
2. Add visual styling for tables with items
3. Display item count and total
4. Test visual appearance

**Files to Modify:**
- [`frontend/components/TableLayoutEditor.tsx`](../frontend/components/TableLayoutEditor.tsx)

**Acceptance Criteria:**
- [ ] Tables with items are visually distinct
- [ ] Item count displayed
- [ ] Total displayed
- [ ] Visual appearance is good

**Estimated Time:** 2-3 hours

---

### 2.11 Add Table Status Auto-Update

**Task:** Automatically update table status based on item presence.

**Steps:**
1. Add effect to TableContext
2. Check table items
3. Update status accordingly
4. Test auto-update

**Files to Modify:**
- [`frontend/components/TableContext.tsx`](../frontend/components/TableContext.tsx)

**Acceptance Criteria:**
- [ ] Status updates automatically
- [ ] Updates happen correctly
- [ ] No infinite loops

**Estimated Time:** 1-2 hours

---

### 2.12 Add Quick Actions for Tables

**Task:** Add quick action menu for tables in layout.

**Steps:**
1. Create TableQuickActions component
2. Add view items action
3. Add clear items action
4. Add convert to tab action
5. Add edit table action
6. Integrate with TableLayoutEditor
7. Test all actions

**Files to Create/Modify:**
- [`frontend/components/TableLayoutEditor.tsx`](../frontend/components/TableLayoutEditor.tsx)

**Acceptance Criteria:**
- [ ] Quick actions menu works
- [ ] All actions function correctly
- [ ] Menu displays properly

**Estimated Time:** 3-4 hours

---

### Phase 2 Summary

**Total Estimated Time:** 30-40 hours (4-5 days)

**Dependencies:**
- All tasks depend on Phase 1 completion
- 2.1 must be completed before 2.2-2.12
- 2.2 must be completed before 2.4
- 2.4 must be completed before 2.5-2.9

**Deliverables:**
- Updated type definitions
- Table item management service
- Updated transaction service
- Updated TableContext
- Updated TableManagement component
- Updated OrderPanel component
- Updated PaymentModal component
- Updated TabManager component
- Updated MainPOSInterface component
- Visual indicators for tables
- Table status auto-update
- Quick actions for tables

---

## Phase 3: Testing and Validation

**Estimated Effort:** 2-3 days
**Priority:** High
**Dependencies:** Phase 2 complete

### 3.1 Backend Unit Tests

**Task:** Write comprehensive unit tests for all backend changes.

**Steps:**
1. Write tests for activity logging service
2. Write tests for tab ownership middleware
3. Write tests for table item endpoints
4. Write tests for table-tab conversion endpoints
5. Write tests for updated transaction handler
6. Write tests for updated table deletion
7. Run all tests
8. Fix any failures

**Files to Create:**
- [`backend/src/__tests__/activityLogService.test.ts`](../backend/src/__tests__/activityLogService.test.ts)
- [`backend/src/__tests__/authorization.test.ts`](../backend/src/__tests__/authorization.test.ts)
- [`backend/src/__tests__/tables.test.ts`](../backend/src/__tests__/tables.test.ts)
- [`backend/src/__tests__/tabs.test.ts`](../backend/src/__tests__/tabs.test.ts)
- [`backend/src/__tests__/transactions.test.ts`](../backend/src/__tests__/transactions.test.ts)

**Acceptance Criteria:**
- [ ] All unit tests pass
- [ ] Test coverage > 80%
- [ ] No critical bugs found

**Estimated Time:** 6-8 hours

---

### 3.2 Frontend Unit Tests

**Task:** Write comprehensive unit tests for all frontend changes.

**Steps:**
1. Write tests for table service
2. Write tests for TableContext
3. Write tests for TableManagement component
4. Write tests for OrderPanel component
5. Write tests for PaymentModal component
6. Write tests for TabManager component
7. Run all tests
8. Fix any failures

**Files to Create:**
- [`frontend/services/__tests__/tableService.test.ts`](../frontend/services/__tests__/tableService.test.ts)
- [`frontend/components/__tests__/TableContext.test.tsx`](../frontend/components/__tests__/TableContext.test.tsx)
- [`frontend/components/__tests__/TableManagement.test.tsx`](../frontend/components/__tests__/TableManagement.test.tsx)
- [`frontend/components/__tests__/OrderPanel.test.tsx`](../frontend/components/__tests__/OrderPanel.test.tsx)
- [`frontend/components/__tests__/PaymentModal.test.tsx`](../frontend/components/__tests__/PaymentModal.test.tsx)
- [`frontend/components/__tests__/TabManager.test.tsx`](../frontend/components/__tests__/TabManager.test.tsx)

**Acceptance Criteria:**
- [ ] All unit tests pass
- [ ] Test coverage > 80%
- [ ] No critical bugs found

**Estimated Time:** 6-8 hours

---

### 3.3 Integration Tests

**Task:** Write integration tests for table-tab workflows.

**Steps:**
1. Write test for creating table with items
2. Write test for loading table items
3. Write test for saving to table
4. Write test for converting table to tab
5. Write test for assigning tab to table
6. Write test for paying with table
7. Write test for clearing table items
8. Run all tests
9. Fix any failures

**Files to Create:**
- [`backend/src/__tests__/integration/tableTabIntegration.test.ts`](../backend/src/__tests__/integration/tableTabIntegration.test.ts)

**Acceptance Criteria:**
- [ ] All integration tests pass
- [ ] Workflows work end-to-end
- [ ] No critical bugs found

**Estimated Time:** 4-5 hours

---

### 3.4 E2E Tests with Playwright

**Task:** Write end-to-end tests using Playwright MCP Server.

**Steps:**
1. Write test for table item management
2. Write test for table-tab conversion
3. Write test for payment with table
4. Write test for table status updates
5. Run all tests
6. Fix any failures

**Files to Create:**
- [`test-files/table-item-management.test.md`](../test-files/table-item-management.test.md)
- [`test-files/table-tab-conversion.test.md`](../test-files/table-tab-conversion.test.md)
- [`test-files/table-payment.test.md`](../test-files/table-payment.test.md)
- [`test-files/table-status-update.test.md`](../test-files/table-status-update.test.md)

**Acceptance Criteria:**
- [ ] All E2E tests pass
- [ ] User workflows work correctly
- [ ] No critical bugs found

**Estimated Time:** 4-5 hours

---

### 3.5 Manual Testing

**Task:** Perform manual testing of all features.

**Steps:**
1. Test table creation with items
2. Test table item viewing
3. Test table item editing
4. Test table item clearing
5. Test table to tab conversion
6. Test tab to table assignment
7. Test payment with table
8. Test table status updates
9. Test visual indicators
10. Test quick actions
11. Document any issues found

**Files to Create:**
- [`test-files/manual-testing-checklist.md`](../test-files/manual-testing-checklist.md)

**Acceptance Criteria:**
- [ ] All features work as expected
- [ ] No critical bugs found
- [ ] User experience is good
- [ ] Issues documented

**Estimated Time:** 4-5 hours

---

### Phase 3 Summary

**Total Estimated Time:** 24-31 hours (3-4 days)

**Dependencies:**
- All tasks depend on Phase 2 completion
- 3.1 and 3.2 can be done in parallel
- 3.3 depends on 3.1
- 3.4 depends on 3.2
- 3.5 depends on 3.4

**Deliverables:**
- Backend unit tests
- Frontend unit tests
- Integration tests
- E2E tests
- Manual testing checklist
- Bug fixes

---

## Phase 4: Documentation and Deployment

**Estimated Effort:** 1-2 days
**Priority:** Medium
**Dependencies:** Phase 3 complete

### 4.1 Update API Documentation

**Task:** Update API documentation with new endpoints.

**Steps:**
1. Document table item endpoints
2. Document table-tab conversion endpoints
3. Document updated transaction endpoint
4. Document updated tabs endpoints
5. Add examples
6. Review documentation

**Files to Create/Update:**
- [`docs/api-documentation.md`](../docs/api-documentation.md)

**Acceptance Criteria:**
- [ ] All new endpoints documented
- [ ] All updated endpoints documented
- [ ] Examples provided
- [ ] Documentation is clear

**Estimated Time:** 2-3 hours

---

### 4.2 Update User Documentation

**Task:** Update user documentation with new features.

**Steps:**
1. Document table item management
2. Document table-tab conversion
3. Document payment with tables
4. Add screenshots
5. Review documentation

**Files to Create/Update:**
- [`docs/user-guide.md`](../docs/user-guide.md)

**Acceptance Criteria:**
- [ ] All new features documented
- [ ] Screenshots included
- [ ] Documentation is clear
- [ ] User can follow instructions

**Estimated Time:** 2-3 hours

---

### 4.3 Create Deployment Checklist

**Task:** Create checklist for deploying changes.

**Steps:**
1. Create deployment checklist
2. Include database migration steps
3. Include backend deployment steps
4. Include frontend deployment steps
5. Include rollback steps
6. Review checklist

**Files to Create:**
- [`docs/deployment-checklist.md`](../docs/deployment-checklist.md)

**Acceptance Criteria:**
- [ ] All deployment steps documented
- [ ] Rollback steps documented
- [ ] Checklist is complete

**Estimated Time:** 1-2 hours

---

### 4.4 Deploy to Staging

**Task:** Deploy changes to staging environment.

**Steps:**
1. Run database migrations
2. Deploy backend
3. Deploy frontend
4. Verify deployment
5. Run smoke tests
6. Fix any issues

**Acceptance Criteria:**
- [ ] Deployment successful
- [ ] Smoke tests pass
- [ ] No critical issues

**Estimated Time:** 2-3 hours

---

### 4.5 Deploy to Production

**Task:** Deploy changes to production environment.

**Steps:**
1. Schedule deployment window
2. Notify users
3. Run database migrations
4. Deploy backend
5. Deploy frontend
6. Verify deployment
7. Run smoke tests
8. Monitor for issues
9. Fix any issues

**Acceptance Criteria:**
- [ ] Deployment successful
- [ ] Smoke tests pass
- [ ] No critical issues
- [ ] Users notified

**Estimated Time:** 2-3 hours

---

### Phase 4 Summary

**Total Estimated Time:** 9-14 hours (1-2 days)

**Dependencies:**
- All tasks depend on Phase 3 completion
- 4.4 must be completed before 4.5

**Deliverables:**
- Updated API documentation
- Updated user documentation
- Deployment checklist
- Staging deployment
- Production deployment

---

## Risk Assessment

### High Risk Items

1. **Database Migration Failures**
   - **Risk:** Migrations may fail or cause data corruption
   - **Mitigation:** Test migrations thoroughly in development, backup database before migration
   - **Impact:** High

2. **Breaking Changes to Existing Functionality**
   - **Risk:** Changes may break existing tabs or tables
   - **Mitigation:** Comprehensive testing, gradual rollout
   - **Impact:** High

3. **Performance Issues**
   - **Risk:** New features may impact performance
   - **Mitigation:** Performance testing, optimization
   - **Impact:** Medium

### Medium Risk Items

4. **Authentication Issues**
   - **Risk:** New authentication may block legitimate users
   - **Mitigation:** Thorough testing, clear error messages
   - **Impact:** Medium

5. **Data Loss**
   - **Risk:** Items may be lost during conversion
   - **Mitigation:** Data validation, transaction safety
   - **Impact:** Medium

### Low Risk Items

6. **UI/UX Issues**
   - **Risk:** New UI may be confusing
   - **Mitigation:** User testing, documentation
   - **Impact:** Low

---

## Rollback Plan

### Pre-Deployment Checklist

- [ ] Database backup created
- [ ] Current version tagged in git
- [ ] Rollback procedures documented
- [ ] Team notified of deployment

### Rollback Triggers

1. Critical bugs affecting core functionality
2. Data corruption or loss
3. Performance degradation > 50%
4. Security vulnerabilities

### Rollback Steps

1. **Database Rollback**
   ```bash
   # Restore from backup
   psql -U totalevo_user -d bar_pos < backup.sql
   ```

2. **Backend Rollback**
   ```bash
   # Revert to previous version
   git checkout <previous-tag>
   docker compose up -d --build backend
   ```

3. **Frontend Rollback**
   ```bash
   # Revert to previous version
   git checkout <previous-tag>
   docker compose up -d --build frontend
   ```

4. **Verification**
   - Verify core functionality works
   - Verify no data loss
   - Verify performance is acceptable

---

## Total Project Timeline

| Phase | Estimated Time | Dependencies |
|--------|---------------|---------------|
| Phase 1: Backend Changes | 17-23 hours (2-3 days) | None |
| Phase 2: Frontend Changes | 30-40 hours (4-5 days) | Phase 1 |
| Phase 3: Testing and Validation | 24-31 hours (3-4 days) | Phase 2 |
| Phase 4: Documentation and Deployment | 9-14 hours (1-2 days) | Phase 3 |
| **Total** | **80-108 hours (10-14 days)** | - |

---

## Success Criteria

The implementation will be considered successful when:

1. Tables can store and manage items like tabs
2. Tables have till context
3. Transactions record table association
4. Tabs have authentication and ownership tracking
5. Table-tab conversion works bidirectionally
6. All unit tests pass (>80% coverage)
7. All integration tests pass
8. All E2E tests pass
9. Manual testing confirms functionality
10. Documentation is complete and accurate
11. Deployment to production is successful
12. No critical bugs in production for 7 days

---

## Next Steps

1. Review and approve this roadmap
2. Assign tasks to team members
3. Set up development environment
4. Begin Phase 1 implementation
5. Track progress and adjust timeline as needed
