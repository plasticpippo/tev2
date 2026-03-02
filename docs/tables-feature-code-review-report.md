# Tables Feature Code Review Report

**Date:** March 2, 2026  
**Reviewer:** Documentation Specialist  
**Files Analyzed:** `backend/src/handlers/tables.ts`, `backend/src/handlers/tabs.ts`, `backend/src/utils/tableValidation.ts`

---

## Executive Summary

This report documents issues identified during a code review of the tables feature implementation. The review compared the tables feature code against the tabs feature code, which handles similar functionality. A total of **6 issues** were identified across 3 severity levels:

| Severity | Count |
|----------|-------|
| CRITICAL | 2 |
| WARNING | 2 |
| SUGGESTION | 2 |

---

## CRITICAL Issues

### Issue #1: Status Transition Validation Bypass in PUT /api/tables/:id

**File:** [`backend/src/handlers/tables.ts`](backend/src/handlers/tables.ts:180)  
**Lines:** 180-196

#### Current Problematic Code

```typescript
const updatedTable = await prisma.table.update({
  where: { id },
  data: {
    ...(sanitizedName !== undefined && { name: sanitizedName }),
    ...(roomId !== undefined && { roomId }),
    ...(x !== undefined && { x: parseFloat(x.toString()) }),
    ...(y !== undefined && { y: parseFloat(y.toString()) }),
    ...(width !== undefined && { width: parseFloat(width.toString()) }),
    ...(height !== undefined && { height: parseFloat(height.toString()) }),
    ...(status !== undefined && { status }),  // <-- Direct assignment without validation
    ...(capacity !== undefined && { capacity: parseInt(capacity.toString(), 10) }),
    ...(items !== undefined && { items }),
  },
  include: {
    room: true,
  },
});
```

#### Expected Behavior

The PUT `/api/tables/:id` endpoint should validate status transitions before applying them, just like the dedicated status endpoint does. Looking at how [`PUT /api/tables/:id/status`](backend/src/handlers/tables.ts:313) handles it:

```typescript
// From tables.ts lines 312-316
// Validate status transition
const validation = validateTableStatusUpdate(table.status, status);
if (!validation.isValid) {
  return res.status(400).json({ error: validation.error });
}
```

#### Recommended Fix

Add status transition validation to the general PUT endpoint when the status field is provided:

```typescript
// Before the prisma.table.update call, add:
if (status !== undefined) {
  const validation = validateTableStatusUpdate(table.status, status);
  if (!validation.isValid) {
    return res.status(400).json({ error: validation.error });
  }
}
```

---

### Issue #2: Items JSON Not Parsed in GET /api/tables

**File:** [`backend/src/handlers/tables.ts`](backend/src/handlers/tables.ts:32)  
**Lines:** 21-39 (entire endpoint)

#### Current Problematic Code

```typescript
// GET /api/tables - Retrieve all tables with room information
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const tables = await prisma.table.findMany({
      include: {
        room: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    res.json(tables);  // <-- Tables returned without parsing items JSON
  } catch (error) {
    // ...
  }
});
```

#### Expected Behavior

The tables endpoint should parse the `items` JSON field just like the tabs endpoint does. Compare with [`tabs.ts` lines 54-58](backend/src/handlers/tabs.ts:54):

```typescript
// From tabs.ts lines 54-58
const tabsWithParsedItems = tabs.map(tab => ({
  ...tab,
  items: safeJsonParse(tab.items, [], { id: String(tab.id), field: 'items' }),
  createdAt: tab.createdAt.toISOString()
}));
```

The `items` field is stored as JSON in the database (see [POST handler line 115](backend/src/handlers/tables.ts:115) and [PUT handler line 191](backend/src/handlers/tables.ts:191)), but it is never parsed back when retrieved.

#### Recommended Fix

Import `safeJsonParse` from the jsonParser utility and parse the items field:

```typescript
import { safeJsonParse } from '../utils/jsonParser';

// Inside the GET endpoint:
const tablesWithParsedItems = tables.map(table => ({
  ...table,
  items: safeJsonParse(table.items, [], { id: table.id, field: 'items' })
}));

res.json(tablesWithParsedItems);
```

The same fix should be applied to [`GET /api/tables/:id`](backend/src/handlers/tables.ts:42).

---

## WARNING Issues

### Issue #3: Silent Error Handling in updateTableStatus

**File:** [`backend/src/handlers/tabs.ts`](backend/src/handlers/tabs.ts:26)  
**Lines:** 26-30

#### Current Problematic Code

```typescript
async function updateTableStatus(tableId: string | null, status: string): Promise<void> {
  if (!tableId) return;
  
  try {
    await prisma.table.update({
      where: { id: tableId },
      data: { status }
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating table status', {
      correlationId: undefined,
    });
    // <-- Error is silently swallowed, no re-throw or proper handling
  }
}
```

#### Expected Behavior

When table status updates fail, the error should be properly propagated so calling functions can handle failures appropriately. The current implementation logs the error but continues silently, which can lead to inconsistent state between tabs and tables.

Compare with the proper error handling in [tabs.ts DELETE handler](backend/src/handlers/tabs.ts:304-308):

```typescript
} catch (error) {
  logError(error instanceof Error ? error : i18n.t('tabs.log.deleteError'), {
    correlationId: (req as any).correlationId,
  });
  res.status(500).json({ error: i18n.t('tabs.deleteFailed') });
}
```

#### Recommended Fix

The `updateTableStatus` function should either:

1. Re-throw the error to let callers handle it:

```typescript
} catch (error) {
  logError(error instanceof Error ? error : 'Error updating table status', {
    correlationId: undefined,
  });
  throw error;  // Re-throw so caller knows update failed
}
```

2. Or return a boolean to indicate success/failure:

```typescript
async function updateTableStatus(tableId: string | null, status: string): Promise<boolean> {
  if (!tableId) return true;
  
  try {
    await prisma.table.update({
      where: { id: tableId },
      data: { status }
    });
    return true;
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating table status', {
      correlationId: undefined,
    });
    return false;
  }
}
```

---

### Issue #4: Inconsistent Authorization on GET Endpoints

**File:** [`backend/src/handlers/tables.ts`](backend/src/handlers/tables.ts:21)  
**Lines:** 21-39

#### Current Problematic Code

```typescript
// GET /api/tables - Only uses authentication, no ownership verification
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  // Returns ALL tables from all businesses
});

// GET /api/tables/:id - Only uses authentication, no ownership verification  
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  // Returns ANY table if user knows the ID
});
```

Compare with the write endpoints that properly verify ownership:

```typescript
// PUT /api/tables/:id - Has ownership verification
router.put('/:id', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {

// DELETE /api/tables/:id - Has ownership verification
router.delete('/:id', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
```

#### Expected Behavior

Read endpoints should also verify table ownership to ensure users can only access tables they own or are authorized to view. This prevents unauthorized access to tables from other businesses.

#### Recommended Fix

Apply `verifyTableOwnership` middleware to GET endpoints:

```typescript
router.get('/', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {

router.get('/:id', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
```

Note: The `verifyTableOwnership` middleware should be reviewed to ensure it works correctly for read operations (it may need modification if it currently blocks all requests without explicit ownership).

---

## SUGGESTION Issues

### Issue #5: Duplicate TABLE_STATUS Constants

**File:** [`backend/src/handlers/tabs.ts`](backend/src/handlers/tabs.ts:10)  
**Lines:** 10-15

#### Current Problematic Code

```typescript
// In tabs.ts - Lines 10-15
const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  BILL_REQUESTED: 'bill_requested'
} as const;

// In tableValidation.ts - Lines 68-74
export const TABLE_STATUS_TRANSITIONS: Record<string, string[]> = {
  'available': ['occupied', 'reserved', 'unavailable'],
  'occupied': ['available', 'bill_requested'],
  'bill_requested': ['available', 'occupied'],
  'reserved': ['occupied', 'available'],
  'unavailable': ['available']
};
```

#### Expected Behavior

Status constants should be defined in a single location and reused throughout the codebase to ensure consistency and ease of maintenance.

#### Recommended Fix

Consolidate status definitions into a shared location:

```typescript
// backend/src/utils/tableStatus.ts (new file)
export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  UNAVAILABLE: 'unavailable',
  BILL_REQUESTED: 'bill_requested'
} as const;

export type TableStatus = typeof TABLE_STATUS[keyof typeof TABLE_STATUS];

export const TABLE_STATUS_TRANSITIONS: Record<string, TableStatus[]> = {
  [TABLE_STATUS.AVAILABLE]: [TABLE_STATUS.OCCUPIED, TABLE_STATUS.RESERVED, TABLE_STATUS.UNAVAILABLE],
  [TABLE_STATUS.OCCUPIED]: [TABLE_STATUS.AVAILABLE, TABLE_STATUS.BILL_REQUESTED],
  [TABLE_STATUS.BILL_REQUESTED]: [TABLE_STATUS.AVAILABLE, TABLE_STATUS.OCCUPIED],
  [TABLE_STATUS.RESERVED]: [TABLE_STATUS.OCCUPIED, TABLE_STATUS.AVAILABLE],
  [TABLE_STATUS.UNAVAILABLE]: [TABLE_STATUS.AVAILABLE]
};
```

Then import and use in both files:

```typescript
// In tabs.ts
import { TABLE_STATUS } from '../utils/tableStatus';

// In tableValidation.ts  
import { TABLE_STATUS, TABLE_STATUS_TRANSITIONS } from './tableStatus';
```

---

### Issue #6: bill_requested Status Never Set Automatically

**File:** [`backend/src/handlers/tables.ts`](backend/src/handlers/tables.ts:286)  
**Lines:** 286-331

#### Current Problematic Code

The [`PUT /api/tables/:id/status`](backend/src/handlers/tables.ts:296) endpoint accepts `bill_requested` as a valid status:

```typescript
const validStatuses = ['available', 'occupied', 'reserved', 'unavailable', 'bill_requested'];
```

However, there is no code in `tabs.ts` that ever sets a table's status to `bill_requested`. Compare with how tables are automatically set to `occupied` when a tab is created ([tabs.ts line 172](backend/src/handlers/tabs.ts:172)):

```typescript
// When a tab is created, table is automatically set to occupied
if (tableId) {
  await updateTableStatus(tableId, TABLE_STATUS.OCCUPIED);
}
```

#### Expected Behavior

When a tab is closed/paid (indicating the customer requested to pay), the associated table should automatically transition to `bill_requested` status, allowing staff to easily identify tables waiting for payment.

#### Recommended Fix

Add a function to handle tab closure and set the table to `bill_requested`:

```typescript
// In tabs.ts - Add when a tab is closed/paid
async function closeTabWithBillRequest(tabId: number, tableId: string) {
  // Update tab to closed/paid status
  await prisma.tab.update({
    where: { id: tabId },
    data: { /* closed/paid data */ }
  });
  
  // Set table to bill_requested so staff knows payment is pending
  await updateTableStatus(tableId, TABLE_STATUS.BILL_REQUESTED);
}
```

Alternatively, modify the existing tab update logic to check if the tab items have been fully paid and automatically transition the status.

---

## Summary of Recommendations

| Issue | Priority | Estimated Effort |
|-------|----------|------------------|
| #1: Status transition validation bypass | CRITICAL | Low |
| #2: Items JSON not parsed | CRITICAL | Low |
| #3: Silent error handling | WARNING | Low |
| #4: Inconsistent authorization | WARNING | Medium |
| #5: Duplicate constants | SUGGESTION | Medium |
| #6: bill_requested never auto-set | SUGGESTION | Medium |

---

## Related Files

- [`backend/src/handlers/tables.ts`](backend/src/handlers/tables.ts) - Tables API endpoints
- [`backend/src/handlers/tabs.ts`](backend/src/handlers/tabs.ts) - Tabs API endpoints (reference implementation)
- [`backend/src/utils/tableValidation.ts`](backend/src/utils/tableValidation.ts) - Table validation utilities
- [`backend/src/utils/jsonParser.ts`](backend/src/utils/jsonParser.ts) - JSON parsing utilities
- [`backend/src/middleware/authorization.ts`](backend/src/middleware/authorization.ts) - Authorization middleware
