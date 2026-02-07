# Backend Changes Requirements: Tables vs Tabs

## Executive Summary

This document details the backend changes required to make tables work like tabs. The changes include database schema updates, new API endpoints, middleware additions, and service layer modifications.

## Table of Contents

1. [Database Schema Changes](#database-schema-changes)
2. [API Endpoint Specifications](#api-endpoint-specifications)
3. [Middleware Changes](#middleware-changes)
4. [Service Layer Changes](#service-layer-changes)
5. [Type Definitions](#type-definitions)

---

## Database Schema Changes

### 1. Add Till Context to Table Model

**File:** [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma:108-129)

**Current Schema:**
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

**Required Changes:**
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
  tillId    Int?     // NEW: Track which till is serving this table
  tillName  String?  // NEW: Till name for display purposes
  ownerId   Int?     @map("owner_id")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  owner     User?    @relation(fields: [ownerId], references: [id])
  tabs      Tab[]

  @@index([roomId])
  @@index([ownerId])
  @@index([tillId])  // NEW: Index for till queries
  @@map("tables")
}
```

**Migration Required:**
```sql
-- Migration file: backend/prisma/migrations/YYYYMMDDHHMMSS_add_till_context_to_tables/migration.sql

ALTER TABLE "tables" 
ADD COLUMN "tillId" INTEGER,
ADD COLUMN "tillName" VARCHAR(255);

CREATE INDEX "tables_tillId_idx" ON "tables"("tillId");
```

### 2. Add Table Association to Transaction Model

**File:** [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma:79-95)

**Current Schema:**
```prisma
model Transaction {
  id            Int      @id @default(autoincrement())
  items         Json
  subtotal      Float
  tax           Float
  tip           Float
  total         Float
  paymentMethod String
  userId        Int
  userName      String
  tillId        Int
  tillName      String
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])

  @@map("transactions")
}
```

**Required Changes:**
```prisma
model Transaction {
  id            Int      @id @default(autoincrement())
  items         Json
  subtotal      Float
  tax           Float
  tip           Float
  total         Float
  paymentMethod String
  userId        Int
  userName      String
  tillId        Int
  tillName      String
  tableId       String?  @db.Uuid  // NEW: Track which table this transaction is for
  tableName     String?            // NEW: Table name for display purposes
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])

  @@index([tableId])  // NEW: Index for table queries
  @@map("transactions")
}
```

**Migration Required:**
```sql
-- Migration file: backend/prisma/migrations/YYYYMMDDHHMMSS_add_table_association_to_transactions/migration.sql

ALTER TABLE "transactions" 
ADD COLUMN "tableId" UUID,
ADD COLUMN "tableName" VARCHAR(255);

CREATE INDEX "transactions_tableId_idx" ON "transactions"("tableId");
```

### 3. Add Owner Tracking to Tab Model

**File:** [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma:131-143)

**Current Schema:**
```prisma
model Tab {
  id        Int      @id @default(autoincrement())
  name      String
  items     Json
  createdAt DateTime @default(now())
  tillId    Int
  tillName  String
  tableId   String?  @db.Uuid
  table     Table?   @relation(fields: [tableId], references: [id])

  @@index([tableId])
  @@map("tabs")
}
```

**Required Changes:**
```prisma
model Tab {
  id        Int      @id @default(autoincrement())
  name      String
  items     Json
  createdAt DateTime @default(now())
  tillId    Int
  tillName  String
  tableId   String?  @db.Uuid
  ownerId   Int?     @map("owner_id")  // NEW: Track who created/owns this tab
  table     Table?   @relation(fields: [tableId], references: [id])
  owner     User?    @relation(fields: [ownerId], references: [id])  // NEW: Owner relation

  @@index([tableId])
  @@index([ownerId])  // NEW: Index for owner queries
  @@map("tabs")
}
```

**Migration Required:**
```sql
-- Migration file: backend/prisma/migrations/YYYYMMDDHHMMSS_add_owner_to_tabs/migration.sql

ALTER TABLE "tabs" 
ADD COLUMN "ownerId" INTEGER;

CREATE INDEX "tabs_ownerId_idx" ON "tabs"("ownerId");

-- Add foreign key constraint
ALTER TABLE "tabs" 
ADD CONSTRAINT "tabs_ownerId_fkey" 
FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL;
```

---

## API Endpoint Specifications

### 1. Tables Handler - Item Management Endpoints

**File:** [`backend/src/handlers/tables.ts`](../backend/src/handlers/tables.ts)

#### 1.1 GET /api/tables/:id/items - Get Table Items

**Purpose:** Retrieve items currently assigned to a table.

**Authentication:** Required

**Authorization:** Table ownership verification required

**Request:**
```http
GET /api/tables/:id/items
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Table 1",
  "items": [
    {
      "id": "string",
      "variantId": 1,
      "productId": 1,
      "name": "Product Name",
      "price": 10.99,
      "quantity": 2,
      "effectiveTaxRate": 0.1
    }
  ],
  "tillId": 1,
  "tillName": "Till 1"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Table not found"
}
```

**Implementation:**
```typescript
// GET /api/tables/:id/items - Get table items
router.get('/:id/items', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const table = await prisma.table.findUnique({
      where: { id },
      include: {
        room: true,
      },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Parse items JSON if it exists
    const items = table.items 
      ? (typeof table.items === 'string' ? JSON.parse(table.items) : table.items)
      : [];

    res.json({
      id: table.id,
      name: table.name,
      items,
      tillId: table.tillId,
      tillName: table.tillName,
    });
  } catch (error) {
    console.error('Error fetching table items:', error);
    res.status(500).json({ error: 'Failed to fetch table items' });
  }
});
```

#### 1.2 POST /api/tables/:id/items - Add Items to Table

**Purpose:** Add items to a table's order.

**Authentication:** Required

**Authorization:** Table ownership verification required

**Request:**
```http
POST /api/tables/:id/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "id": "string",
      "variantId": 1,
      "productId": 1,
      "name": "Product Name",
      "price": 10.99,
      "quantity": 2,
      "effectiveTaxRate": 0.1
    }
  ],
  "tillId": 1,
  "tillName": "Till 1"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Table 1",
  "items": [...],
  "tillId": 1,
  "tillName": "Till 1",
  "status": "occupied"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "All items must have valid id, variantId, productId, price, and quantity"
}
```

**Implementation:**
```typescript
// POST /api/tables/:id/items - Add items to table
router.post('/:id/items', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items, tillId, tillName } = req.body;

    // Validate items array
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    for (const item of items) {
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        return res.status(400).json({ error: 'All items must have a valid name' });
      }
      if (!item.id || !item.variantId || !item.productId || 
          typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return res.status(400).json({ error: 'All items must have valid id, variantId, productId, price, and quantity' });
      }
    }

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Get existing items
    const existingItems = table.items 
      ? (typeof table.items === 'string' ? JSON.parse(table.items) : table.items)
      : [];

    // Merge items (add quantities for matching items)
    const mergedItems = [...existingItems];
    for (const newItem of items) {
      const existingIndex = mergedItems.findIndex(
        item => item.variantId === newItem.variantId
      );
      if (existingIndex >= 0) {
        mergedItems[existingIndex].quantity += newItem.quantity;
      } else {
        mergedItems.push(newItem);
      }
    }

    // Update table with merged items and till context
    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        items: JSON.stringify(mergedItems),
        tillId: tillId || table.tillId,
        tillName: tillName || table.tillName,
        status: 'occupied',
      },
      include: {
        room: true,
      },
    });

    // Log activity
    await logActivity(req.user!.id, req.user!.username, 'Items Added to Table', {
      tableId: id,
      tableName: table.name,
      itemsAdded: items,
    });

    res.json(updatedTable);
  } catch (error) {
    console.error('Error adding items to table:', error);
    res.status(500).json({ error: 'Failed to add items to table' });
  }
});
```

#### 1.3 PUT /api/tables/:id/items - Update Table Items

**Purpose:** Replace all items on a table.

**Authentication:** Required

**Authorization:** Table ownership verification required

**Request:**
```http
PUT /api/tables/:id/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [...],
  "tillId": 1,
  "tillName": "Till 1"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Table 1",
  "items": [...],
  "tillId": 1,
  "tillName": "Till 1",
  "status": "occupied"
}
```

**Implementation:**
```typescript
// PUT /api/tables/:id/items - Update table items
router.put('/:id/items', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items, tillId, tillName } = req.body;

    // Validate items array
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    for (const item of items) {
      if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
        return res.status(400).json({ error: 'All items must have a valid name' });
      }
      if (!item.id || !item.variantId || !item.productId || 
          typeof item.price !== 'number' || typeof item.quantity !== 'number') {
        return res.status(400).json({ error: 'All items must have valid id, variantId, productId, price, and quantity' });
      }
    }

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Update table with new items and till context
    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        items: JSON.stringify(items),
        tillId: tillId || table.tillId,
        tillName: tillName || table.tillName,
        status: items.length > 0 ? 'occupied' : 'available',
      },
      include: {
        room: true,
      },
    });

    // Log activity
    await logActivity(req.user!.id, req.user!.username, 'Table Items Updated', {
      tableId: id,
      tableName: table.name,
      itemsCount: items.length,
    });

    res.json(updatedTable);
  } catch (error) {
    console.error('Error updating table items:', error);
    res.status(500).json({ error: 'Failed to update table items' });
  }
});
```

#### 1.4 DELETE /api/tables/:id/items - Clear Table Items

**Purpose:** Remove all items from a table.

**Authentication:** Required

**Authorization:** Table ownership verification required

**Request:**
```http
DELETE /api/tables/:id/items
Authorization: Bearer <token>
```

**Response (204 No Content):**

**Implementation:**
```typescript
// DELETE /api/tables/:id/items - Clear table items
router.delete('/:id/items', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Clear items and reset status
    await prisma.table.update({
      where: { id },
      data: {
        items: null,
        status: 'available',
      },
    });

    // Log activity
    await logActivity(req.user!.id, req.user!.username, 'Table Items Cleared', {
      tableId: id,
      tableName: table.name,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error clearing table items:', error);
    res.status(500).json({ error: 'Failed to clear table items' });
  }
});
```

### 2. Tables Handler - Table-Tab Conversion Endpoints

#### 2.1 POST /api/tables/:id/convert-to-tab - Convert Table to Tab

**Purpose:** Convert a table's order to a new tab.

**Authentication:** Required

**Authorization:** Table ownership verification required

**Request:**
```http
POST /api/tables/:id/convert-to-tab
Authorization: Bearer <token>
Content-Type: application/json

{
  "tabName": "John D."
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "name": "John D.",
  "items": [...],
  "createdAt": "2026-02-07T01:00:00.000Z",
  "tillId": 1,
  "tillName": "Till 1",
  "tableId": "uuid"
}
```

**Implementation:**
```typescript
// POST /api/tables/:id/convert-to-tab - Convert table to tab
router.post('/:id/convert-to-tab', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tabName } = req.body;

    // Validate tab name
    if (!tabName || typeof tabName !== 'string' || tabName.trim() === '') {
      return res.status(400).json({ error: 'Tab name is required and must be a non-empty string' });
    }

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Get table items
    const items = table.items 
      ? (typeof table.items === 'string' ? JSON.parse(table.items) : table.items)
      : [];

    if (items.length === 0) {
      return res.status(400).json({ error: 'Cannot convert table with no items to tab' });
    }

    // Check for duplicate tab name
    const existingTab = await prisma.tab.findFirst({
      where: { name: tabName.trim() }
    });

    if (existingTab) {
      return res.status(409).json({ error: 'A tab with this name already exists' });
    }

    // Create new tab with table's items
    const tab = await prisma.tab.create({
      data: {
        name: tabName.trim(),
        items: JSON.stringify(items),
        tillId: table.tillId || req.user!.id, // Fallback to user's default till
        tillName: table.tillName || 'Default Till',
        tableId: id,
        ownerId: req.user!.id,
      },
    });

    // Clear table items and reset status
    await prisma.table.update({
      where: { id },
      data: {
        items: null,
        status: 'available',
      },
    });

    // Log activity
    await logActivity(req.user!.id, req.user!.username, 'Table Converted to Tab', {
      tableId: id,
      tableName: table.name,
      tabId: tab.id,
      tabName: tab.name,
    });

    res.status(201).json(tab);
  } catch (error) {
    console.error('Error converting table to tab:', error);
    res.status(500).json({ error: 'Failed to convert table to tab' });
  }
});
```

#### 2.2 POST /api/tabs/:id/assign-to-table/:tableId - Assign Tab to Table

**Purpose:** Assign a tab's items to a table.

**Authentication:** Required

**Authorization:** Tab ownership verification required

**Request:**
```http
POST /api/tabs/:id/assign-to-table/:tableId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Table 1",
  "items": [...],
  "tillId": 1,
  "tillName": "Till 1",
  "status": "occupied"
}
```

**Implementation:**
```typescript
// POST /api/tabs/:id/assign-to-table/:tableId - Assign tab to table
tabsRouter.post('/:id/assign-to-table/:tableId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, tableId } = req.params;

    // Get tab
    const tab = await prisma.tab.findUnique({
      where: { id: Number(id) },
    });

    if (!tab) {
      return res.status(404).json({ error: 'Tab not found' });
    }

    // Verify tab ownership
    if (tab.ownerId && tab.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'You do not have permission to modify this tab' });
    }

    // Get table
    const table = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Get tab items
    const items = typeof tab.items === 'string' ? JSON.parse(tab.items) : tab.items;

    if (items.length === 0) {
      return res.status(400).json({ error: 'Cannot assign tab with no items to table' });
    }

    // Get existing table items
    const existingItems = table.items 
      ? (typeof table.items === 'string' ? JSON.parse(table.items) : table.items)
      : [];

    // Merge items
    const mergedItems = [...existingItems];
    for (const tabItem of items) {
      const existingIndex = mergedItems.findIndex(
        item => item.variantId === tabItem.variantId
      );
      if (existingIndex >= 0) {
        mergedItems[existingIndex].quantity += tabItem.quantity;
      } else {
        mergedItems.push(tabItem);
      }
    }

    // Update table with merged items
    const updatedTable = await prisma.table.update({
      where: { id: tableId },
      data: {
        items: JSON.stringify(mergedItems),
        tillId: tab.tillId,
        tillName: tab.tillName,
        status: 'occupied',
      },
      include: {
        room: true,
      },
    });

    // Update tab to link to table
    await prisma.tab.update({
      where: { id: Number(id) },
      data: {
        tableId: tableId,
      },
    });

    // Log activity
    await logActivity(req.user!.id, req.user!.username, 'Tab Assigned to Table', {
      tabId: tab.id,
      tabName: tab.name,
      tableId: tableId,
      tableName: table.name,
    });

    res.json(updatedTable);
  } catch (error) {
    console.error('Error assigning tab to table:', error);
    res.status(500).json({ error: 'Failed to assign tab to table' });
  }
});
```

### 3. Transactions Handler - Table Association

#### 3.1 Update POST /api/transactions to Include Table Association

**File:** [`backend/src/handlers/transactions.ts`](../backend/src/handlers/transactions.ts)

**Current Implementation:**
```typescript
transactionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      items, subtotal, tax, tip, total, paymentMethod,
      userId, userName, tillId, tillName
    } = req.body as Omit<Transaction, 'id' | 'createdAt'>;
    
    // ... validation ...
    
    const transaction = await prisma.transaction.create({
      data: {
        items: JSON.stringify(items),
        subtotal,
        tax,
        tip,
        total,
        paymentMethod,
        userId,
        userName,
        tillId,
        tillName,
        createdAt: new Date()
      }
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction. Please check your data and try again.' });
  }
});
```

**Required Changes:**
```typescript
transactionsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const {
      items, subtotal, tax, tip, total, paymentMethod,
      userId, userName, tillId, tillName,
      tableId, tableName  // NEW: Table association fields
    } = req.body as Omit<Transaction, 'id' | 'createdAt'> & { tableId?: string; tableName?: string };
    
    // ... existing validation ...
    
    const transaction = await prisma.transaction.create({
      data: {
        items: JSON.stringify(items),
        subtotal,
        tax,
        tip,
        total,
        paymentMethod,
        userId,
        userName,
        tillId,
        tillName,
        tableId: tableId || null,  // NEW: Include table association
        tableName: tableName || null,  // NEW: Include table name
        createdAt: new Date()
      }
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction. Please check your data and try again.' });
  }
});
```

### 4. Tabs Handler - Add Authentication

**File:** [`backend/src/handlers/tabs.ts`](../backend/src/handlers/tabs.ts)

**Required Changes:**

Add authentication middleware import:
```typescript
import { authenticateToken } from '../middleware/auth';
```

Apply authentication to all endpoints:
```typescript
// GET /api/tabs - Get all tabs
tabsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  // ... existing code ...
});

// GET /api/tabs/:id - Get a specific tab
tabsRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  // ... existing code ...
});

// POST /api/tabs - Create a new tab
tabsRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  // ... existing code ...
  // Add ownerId to tab creation
  const tab = await prisma.tab.create({
    data: {
      name: name.trim(),
      items: JSON.stringify(items || []),
      tillId,
      tillName,
      tableId: tableId || null,
      ownerId: req.user!.id,  // NEW: Set owner
      createdAt: new Date()
    }
  });
  // ... existing code ...
});

// PUT /api/tabs/:id - Update a tab
tabsRouter.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  // ... existing code ...
  // Add ownership verification
  const tab = await prisma.tab.findUnique({
    where: { id: Number(id) }
  });

  if (!tab) {
    return res.status(404).json({ error: 'Tab not found' });
  }

  if (tab.ownerId && tab.ownerId !== req.user!.id) {
    return res.status(403).json({ error: 'You do not have permission to modify this tab' });
  }

  // ... existing update code ...
});

// DELETE /api/tabs/:id - Delete a tab
tabsRouter.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Add ownership verification
    const tab = await prisma.tab.findUnique({
      where: { id: Number(id) }
    });

    if (!tab) {
      return res.status(404).json({ error: 'Tab not found' });
    }

    if (tab.ownerId && tab.ownerId !== req.user!.id) {
      return res.status(403).json({ error: 'You do not have permission to delete this tab' });
    }
    
    await prisma.tab.delete({
      where: { id: Number(id) }
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting tab:', error);
    res.status(500).json({ error: 'Failed to delete tab' });
  }
});
```

### 5. Tables Handler - Update Deletion Logic

**File:** [`backend/src/handlers/tables.ts`](../backend/src/handlers/tables.ts)

**Current Implementation:**
```typescript
// DELETE /api/tables/:id - Delete table
router.delete('/:id', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Check if table is associated with any tabs
    const tabs = await prisma.tab.findMany({
      where: {
        tableId: id,
      },
    });

    if (tabs.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete table with open tabs. Please close or reassign tabs first.',
        tabCount: tabs.length
      });
    }

    await prisma.table.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});
```

**Required Changes:**
```typescript
// DELETE /api/tables/:id - Delete table
router.delete('/:id', authenticateToken, verifyTableOwnership, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Check if table is associated with any tabs
    const tabs = await prisma.tab.findMany({
      where: {
        tableId: id,
      },
    });

    if (tabs.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete table with open tabs. Please close or reassign tabs first.',
        tabCount: tabs.length
      });
    }

    // NEW: Check if table has items
    const items = table.items 
      ? (typeof table.items === 'string' ? JSON.parse(table.items) : table.items)
      : [];

    if (items.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete table with items. Please clear items first.',
        itemCount: items.length
      });
    }

    await prisma.table.delete({
      where: { id },
    });

    // Log activity
    await logActivity(req.user!.id, req.user!.username, 'Table Deleted', {
      tableId: id,
      tableName: table.name,
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});
```

---

## Middleware Changes

### 1. Add Tab Ownership Verification Middleware

**File:** [`backend/src/middleware/authorization.ts`](../backend/src/middleware/authorization.ts)

**New Middleware:**
```typescript
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export const verifyTabOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    
    const tab = await prisma.tab.findUnique({
      where: { id: Number(id) },
    });

    if (!tab) {
      return res.status(404).json({ error: 'Tab not found' });
    }

    // Allow if no owner set (legacy tabs) or if user is the owner
    if (!tab.ownerId || tab.ownerId === req.user!.id) {
      req.tab = tab;
      return next();
    }

    return res.status(403).json({ 
      error: 'You do not have permission to access this tab' 
    });
  } catch (error) {
    console.error('Error verifying tab ownership:', error);
    return res.status(500).json({ error: 'Failed to verify tab ownership' });
  }
};
```

---

## Service Layer Changes

### 1. Add Activity Logging Service

**File:** [`backend/src/services/activityLogService.ts`](../backend/src/services/activityLogService.ts) (NEW FILE)

```typescript
import { prisma } from '../prisma';

export interface ActivityLogData {
  action: string;
  details: any;
  userId: number;
  userName: string;
}

export const logActivity = async (
  userId: number,
  userName: string,
  action: string,
  details: any
) => {
  try {
    await prisma.orderActivityLog.create({
      data: {
        action,
        details: JSON.stringify(details),
        userId,
        userName,
      },
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - logging failures shouldn't break the main flow
  }
};

export const getActivityLogs = async (filters?: {
  userId?: number;
  action?: string;
  limit?: number;
}) => {
  try {
    const where: any = {};
    
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    
    if (filters?.action) {
      where.action = filters.action;
    }

    const logs = await prisma.orderActivityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 100,
    });

    return logs.map(log => ({
      ...log,
      details: typeof log.details === 'string' ? JSON.parse(log.details) : log.details,
    }));
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
};
```

---

## Type Definitions

### 1. Update Backend Types

**File:** [`backend/src/types.ts`](../backend/src/types.ts)

**Add Table Till Context:**
```typescript
export interface Table {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'available' | 'occupied' | 'reserved' | 'unavailable';
  roomId: string;
  items?: OrderItem[];
  tillId?: number;  // NEW
  tillName?: string;  // NEW
  ownerId?: number;
  createdAt: string;
  updatedAt: string;
  room: Room;
  tabs: Tab[];
}
```

**Add Transaction Table Association:**
```typescript
export interface Transaction {
  id: number;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
  paymentMethod: string;
  userId: number;
  userName: string;
  tillId: number;
  tillName: string;
  tableId?: string;  // NEW
  tableName?: string;  // NEW
  createdAt: string;
}
```

**Add Tab Owner:**
```typescript
export interface Tab {
  id: number;
  name: string;
  items: OrderItem[];
  createdAt: string;
  tillId: number;
  tillName: string;
  tableId?: string;
  ownerId?: number;  // NEW
}
```

---

## Summary of Changes

### Database Schema Changes
1. Add `tillId` and `tillName` to Table model
2. Add `tableId` and `tableName` to Transaction model
3. Add `ownerId` to Tab model

### New API Endpoints
1. GET /api/tables/:id/items - Get table items
2. POST /api/tables/:id/items - Add items to table
3. PUT /api/tables/:id/items - Update table items
4. DELETE /api/tables/:id/items - Clear table items
5. POST /api/tables/:id/convert-to-tab - Convert table to tab
6. POST /api/tabs/:id/assign-to-table/:tableId - Assign tab to table

### Modified API Endpoints
1. POST /api/transactions - Add table association
2. All /api/tabs/* endpoints - Add authentication and ownership verification
3. DELETE /api/tables/:id - Add items check

### New Middleware
1. verifyTabOwnership - Verify tab ownership

### New Services
1. activityLogService - Log and retrieve activity logs

### Type Updates
1. Table interface - Add till context
2. Transaction interface - Add table association
3. Tab interface - Add owner field
