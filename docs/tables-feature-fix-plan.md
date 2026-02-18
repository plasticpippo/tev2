# Tables Feature Fix Plan

## Executive Summary

This document outlines a comprehensive fix plan for the tables feature in the POS application. The primary issue is that **table status is not being updated when a table is assigned to an order/tab** - it only updates after payment completion. This creates a poor user experience where tables appear "available" even when they have active orders.

### Problem Statement

The current implementation has a critical flaw in the table status lifecycle:

1. **Current Behavior**: Table status remains `available` when assigned to a tab, only changing to `available` after payment
2. **Expected Behavior**: Table status should become `occupied` when assigned to a tab, and return to `available` after payment

### Impact

- Staff cannot see which tables are in use at a glance
- Risk of double-assigning tables
- Poor operational visibility
- Inconsistent user experience

---

## Current Architecture Analysis

### Database Schema

The Table model in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma:128) has:

```prisma
model Table {
  id        String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name      String
  x         Float    @default(0)
  y         Float    @default(0)
  width     Float    @default(100)
  height    Float    @default(100)
  status    String   @default("available")
  roomId    String   @db.Uuid
  capacity  Int?
  items     Json?
  ownerId   Int?     @map("owner_id")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  owner     User?    @relation(fields: [ownerId], references: [id])
  tabs      Tab[]

  @@index([roomId])
  @@index([ownerId])
  @@map("tables")
}
```

The Table has a `status` field (String) and is linked to Tabs via `tableId`.

### Backend Handlers

#### Tables Handler ([`backend/src/handlers/tables.ts`](backend/src/handlers/tables.ts))

- CRUD operations for tables
- Status can be set on create/update
- **No automatic status management**
- No validation of status transitions

#### Tabs Handler ([`backend/src/handlers/tabs.ts`](backend/src/handlers/tabs.ts))

- Create/update tabs with `tableId`
- **Does NOT update table status** when a tab is created or updated with a table assignment
- Only validates that the table exists

#### Transactions Handler ([`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts))

- Creates transactions (payments)
- **Does NOT interact with tables at all**
- No table status update on payment

### Frontend Contexts

#### TableAssignmentContext ([`frontend/contexts/TableAssignmentContext.tsx`](frontend/contexts/TableAssignmentContext.tsx))

- `handleTableAssign()` - assigns table to current session
- Updates tab with `tableId` via API
- **Does NOT update table status**

#### PaymentContext ([`frontend/contexts/PaymentContext.tsx`](frontend/contexts/PaymentContext.tsx))

- `handleConfirmPayment()` - processes payment
- **Line 152-154**: Updates table status to `available` after payment
- Deletes the active tab
- This is the ONLY place table status is updated!

#### TabManagementContext ([`frontend/contexts/TabManagementContext.tsx`](frontend/contexts/TabManagementContext.tsx))

- `handleCreateTab()` - creates new tab with optional `tableId`
- `handleAddToTab()` - adds items to existing tab
- `handleSaveTab()` - saves current order to active tab
- **None of these update table status**

---

## Phase 1: Critical Fixes

### 1.1 Backend: Update Table Status on Tab Assignment

**File**: [`backend/src/handlers/tabs.ts`](backend/src/handlers/tabs.ts)

**Changes Required**:

1. Add helper function to update table status
2. Update `POST /api/tabs` to set table status to `occupied`
3. Update `PUT /api/tabs/:id` to handle table assignment changes
4. Update `DELETE /api/tabs/:id` to reset table status if no other tabs exist

**Code Changes**:

```typescript
// Add at the top of tabs.ts after imports
const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  BILL_REQUESTED: 'bill_requested'
} as const;

// Helper function to update table status
async function updateTableStatus(tableId: string | null, status: string): Promise<void> {
  if (!tableId) return;
  
  await prisma.table.update({
    where: { id: tableId },
    data: { status }
  });
}

// Helper function to check if table has other active tabs
async function tableHasOtherTabs(tableId: string, excludeTabId?: number): Promise<boolean> {
  const where: any = { tableId };
  if (excludeTabId) {
    where.id = { not: excludeTabId };
  }
  const count = await prisma.tab.count({ where });
  return count > 0;
}
```

**Modify POST /api/tabs** (around line 126):

```typescript
// After creating the tab, update table status if tableId is provided
const tab = await prisma.tab.create({
  data: {
    name: name.trim(),
    items: JSON.stringify(items || []),
    tillId,
    tillName,
    tableId: tableId || null,
    createdAt: new Date()
  }
});

// NEW: Update table status to occupied
if (tableId) {
  await updateTableStatus(tableId, TABLE_STATUS.OCCUPIED);
}
```

**Modify PUT /api/tabs/:id** (around line 203):

```typescript
// Get the existing tab to check for table assignment changes
const existingTab = await prisma.tab.findUnique({
  where: { id: Number(id) }
});

const tab = await prisma.tab.update({
  where: { id: Number(id) },
  data: {
    name: name !== undefined ? name.trim() : undefined,
    items: JSON.stringify(items || []),
    tillId,
    tillName,
    tableId: tableId || null
  }
});

// NEW: Handle table status changes
if (existingTab?.tableId !== tableId) {
  // If table was unassigned, check if it has other tabs
  if (existingTab?.tableId) {
    const hasOtherTabs = await tableHasOtherTabs(existingTab.tableId, Number(id));
    if (!hasOtherTabs) {
      await updateTableStatus(existingTab.tableId, TABLE_STATUS.AVAILABLE);
    }
  }
  // If new table assigned, set to occupied
  if (tableId) {
    await updateTableStatus(tableId, TABLE_STATUS.OCCUPIED);
  }
}
```

**Modify DELETE /api/tabs/:id** (around line 224):

```typescript
// Get the tab before deleting to check table assignment
const tab = await prisma.tab.findUnique({
  where: { id: Number(id) }
});

await prisma.tab.delete({
  where: { id: Number(id) }
});

// NEW: Update table status if this was the last tab for the table
if (tab?.tableId) {
  const hasOtherTabs = await tableHasOtherTabs(tab.tableId);
  if (!hasOtherTabs) {
    await updateTableStatus(tab.tableId, TABLE_STATUS.AVAILABLE);
  }
}
```

### 1.2 Backend: Add Table Status Validation

**File**: [`backend/src/utils/tableValidation.ts`](backend/src/utils/tableValidation.ts)

**Add status transition validation**:

```typescript
// Valid table status transitions
export const TABLE_STATUS_TRANSITIONS: Record<string, string[]> = {
  'available': ['occupied'],
  'occupied': ['available', 'bill_requested'],
  'bill_requested': ['available', 'occupied']
};

export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const allowedTransitions = TABLE_STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions?.includes(newStatus) ?? false;
}

export function validateTableStatusUpdate(
  currentStatus: string,
  newStatus: string
): { isValid: boolean; error?: string } {
  if (currentStatus === newStatus) {
    return { isValid: true }; // No change needed
  }
  
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    return {
      isValid: false,
      error: `Invalid status transition from '${currentStatus}' to '${newStatus}'`
    };
  }
  
  return { isValid: true };
}
```

### 1.3 Frontend: Update TableAssignmentContext

**File**: [`frontend/contexts/TableAssignmentContext.tsx`](frontend/contexts/TableAssignmentContext.tsx)

**Modify `handleTableAssign`** (around line 32):

```typescript
const handleTableAssign = async (tableId: string) => {
  try {
    if (tableId) {
      // Get the full table object from appData
      const table = appData.tables.find(t => t.id === tableId);
      if (!table) {
        console.error(`Table with ID ${tableId} not found`);
        return;
      }
      
      // Check if table is already occupied by another tab
      if (table.status === 'occupied') {
        const occupiedTab = appData.tabs.find(t => t.tableId === tableId);
        if (occupiedTab && (!activeTab || occupiedTab.id !== activeTab.id)) {
          console.warn(`Table ${table.name} is already occupied by another tab`);
          // Optionally show a warning to the user
          return;
        }
      }
      
      setAssignedTable(table);
      
      // If there's an active tab, update it with the new table assignment
      if (activeTab && assignedTillId) {
        await api.saveTab({ ...activeTab, tableId });
      }
      
      // NEW: Update table status to occupied
      // Note: This is handled by the backend now, but we can also update locally for immediate feedback
      // The backend will handle the actual status update via the tabs handler
    } else {
      // Clear table assignment
      setAssignedTable(null);
      if (activeTab && assignedTillId) {
        await api.saveTab({ ...activeTab, tableId: undefined });
      }
    }
  } catch (error) {
    console.error('Error handling table assignment:', error);
  }
};
```

### 1.4 Frontend: Ensure Payment Updates Table Status

**File**: [`frontend/contexts/PaymentContext.tsx`](frontend/contexts/PaymentContext.tsx)

The current implementation at lines 152-154 already updates table status to `available` after payment. This is correct, but we should ensure it's robust:

```typescript
// Update table status to available after payment (existing code - verify it's correct)
if (assignedTable) {
  try {
    await api.saveTable({ ...assignedTable, status: 'available' });
    clearTableAssignment();
  } catch (error) {
    console.error('Failed to update table status after payment:', error);
    // Don't block payment completion if table status update fails
  }
}
```

---

## Phase 2: Important Improvements

### 2.1 Backend: Atomic Table Status Updates

**File**: [`backend/src/handlers/tabs.ts`](backend/src/handlers/tabs.ts)

Add transaction-based updates to prevent race conditions:

```typescript
import { Prisma } from '@prisma/client';

// Use Prisma transactions for atomic updates
async function updateTableStatusAtomic(
  tx: Prisma.TransactionClient,
  tableId: string,
  expectedCurrentStatus: string,
  newStatus: string
): Promise<boolean> {
  try {
    const result = await tx.table.updateMany({
      where: {
        id: tableId,
        status: expectedCurrentStatus
      },
      data: { status: newStatus }
    });
    return result.count > 0;
  } catch {
    return false;
  }
}
```

### 2.2 Backend: Add Table Status Endpoint

**File**: [`backend/src/handlers/tables.ts`](backend/src/handlers/tables.ts)

Add a dedicated endpoint for status updates:

```typescript
// PUT /api/tables/:id/status - Update only table status
router.put('/:id/status', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Validate status value
    const validStatuses = ['available', 'occupied', 'bill_requested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status value',
        validValues: validStatuses
      });
    }

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: i18n.t('errors:tables.notFound') });
    }

    // Validate status transition
    const validation = validateTableStatusUpdate(table.status, status);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: { status },
      include: { room: true },
    });

    res.json(updatedTable);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating table status', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors:tables.statusUpdateFailed') });
  }
});
```

### 2.3 Frontend: Add Visual Feedback for Table Status

**Files**: Frontend components that display tables

Add visual indicators for table status:

```typescript
// Table status color mapping
const TABLE_STATUS_COLORS = {
  available: 'bg-green-500',
  occupied: 'bg-red-500',
  bill_requested: 'bg-yellow-500'
};

const TABLE_STATUS_LABELS = {
  available: 'Available',
  occupied: 'Occupied',
  bill_requested: 'Bill Requested'
};
```

### 2.4 Frontend: Add "Request Bill" Feature

This would allow staff to mark a table as "bill_requested" when customers are ready to pay:

```typescript
// In TableAssignmentContext or a new context
const handleRequestBill = async () => {
  if (!assignedTable) return;
  
  try {
    await api.updateTableStatus(assignedTable.id, 'bill_requested');
    // Update local state
  } catch (error) {
    console.error('Failed to request bill:', error);
  }
};
```

---

## Phase 3: Future Enhancements

### 3.1 Real-time Synchronization

**Description**: Implement WebSocket or SSE for real-time table status updates across all clients.

**Implementation Notes**:
- Use Socket.io or native WebSockets
- Broadcast table status changes to all connected clients
- Implement optimistic updates with rollback on failure

### 3.2 Table Transfer Feature

**Description**: Allow transferring a table assignment from one table to another.

**Implementation Notes**:
- Add `POST /api/tabs/:id/transfer` endpoint
- Update old table status to `available`
- Update new table status to `occupied`
- Maintain order history

### 3.3 Reservation Integration

**Description**: Integrate table status with a reservation system.

**Implementation Notes**:
- Add `reserved` status
- Link tables to reservation records
- Auto-update status based on reservation times

### 3.4 Table Capacity Utilization

**Description**: Track and display table capacity vs. party size.

**Implementation Notes**:
- Use existing `capacity` field
- Add party size to tab/order
- Show capacity warnings in UI

---

## Implementation Checklist

### Phase 1 - Critical Fixes

- [ ] **Backend: tabs.ts** - Add `updateTableStatus` helper function
- [ ] **Backend: tabs.ts** - Update `POST /api/tabs` to set table status to `occupied`
- [ ] **Backend: tabs.ts** - Update `PUT /api/tabs/:id` to handle table assignment changes
- [ ] **Backend: tabs.ts** - Update `DELETE /api/tabs/:id` to reset table status
- [ ] **Backend: tableValidation.ts** - Add status transition validation
- [ ] **Frontend: TableAssignmentContext.tsx** - Add occupied table check
- [ ] **Frontend: PaymentContext.tsx** - Verify table status update on payment

### Phase 2 - Important Improvements

- [ ] **Backend: tabs.ts** - Add atomic transaction support
- [ ] **Backend: tables.ts** - Add `PUT /api/tables/:id/status` endpoint
- [ ] **Frontend: tableService.ts** - Add `updateTableStatus` function
- [ ] **Frontend: UI Components** - Add visual status indicators
- [ ] **Frontend: UI Components** - Add "Request Bill" button

### Testing

- [ ] Test table status changes to `occupied` when tab is created with tableId
- [ ] Test table status changes to `occupied` when tab is updated with new tableId
- [ ] Test table status changes to `available` when tab is deleted
- [ ] Test table status changes to `available` after payment
- [ ] Test invalid status transitions are rejected
- [ ] Test race conditions with concurrent table assignments
- [ ] Test UI visual feedback for all status states

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Race condition on table assignment | Medium | High | Use atomic updates with status check |
| Status sync issues | Low | Medium | Add status validation on backend |
| Breaking existing functionality | Low | High | Comprehensive testing before deployment |
| Performance impact | Low | Low | Status updates are single-row operations |

---

## Rollback Plan

If issues arise after deployment:

1. **Immediate**: Revert backend changes to tabs.ts - table status will remain `available` (original behavior)
2. **Short-term**: Add feature flag to disable automatic status updates
3. **Long-term**: Fix issues and re-deploy with additional tests

---

## Conclusion

This fix plan addresses the critical issue of table status not being updated when assigned to orders. The implementation is designed to be:

- **Minimal**: No database schema changes required
- **Safe**: Status transitions are validated
- **Backward Compatible**: Existing functionality is preserved
- **Testable**: Clear test cases defined

The Phase 1 fixes should be implemented first to resolve the core issue, with Phase 2 improvements added for better user experience and reliability.