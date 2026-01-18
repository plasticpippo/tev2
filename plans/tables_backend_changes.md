# Backend Changes for Enhanced Table Functionality

## 1. Database Schema Modifications

### 1.1 Update Table Model in Prisma Schema
Modify the `backend/prisma/schema.prisma` file to add items field to the Table model:

```prisma
model Table {
  id        String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name      String
  x         Float    @default(0)
  y         Float    @default(0)
  width     Float    @default(100)
  height    Float    @default(100)
  status    String   @default("available") // "available", "occupied", "reserved", "unavailable"
  roomId    String   @db.Uuid
  items     Json?    // Store order items directly on the table (nullable for backward compatibility)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  tabs      Tab[]    // Existing relationship
}
```

### 1.2 Create Database Migration
Create a new migration to add the `items` field to the existing `tables` table.

## 2. Enhanced Table Handler (`backend/src/handlers/tables.ts`)

### 2.1 Modify GET Endpoints to Include Items
- Update `GET /api/tables` to include parsed items in response
- Update `GET /api/tables/:id` to include parsed items in response

### 2.2 Enhance POST Endpoint
- Update `POST /api/tables` to accept initial items when creating a table
- Validate item structure when provided

### 2.3 Enhance PUT Endpoint  
- Update `PUT /api/tables/:id` to allow updating table items
- Add validation for item structure

### 2.4 Add New Item Management Endpoints
- `POST /api/tables/:id/items` - Add items to a table
- `PUT /api/tables/:id/items/:itemId` - Update specific item on a table
- `DELETE /api/tables/:id/items/:itemId` - Remove specific item from a table
- `PUT /api/tables/:id/items` - Replace all items on a table
- `DELETE /api/tables/:id/items` - Clear all items from a table

## 3. Implementation Details

### 3.1 Enhanced Table Handler Code Structure
```typescript
// Import necessary modules
import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';
import { validateOrderItems } from '../utils/validation'; // New utility function

const router = Router();

// Enhanced GET endpoints to include items
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

    // Parse items JSON if they exist
    const tablesWithParsedItems = tables.map(table => ({
      ...table,
      items: table.items ? (typeof table.items === 'string' ? JSON.parse(table.items) : table.items) : []
    }));

    res.json(tablesWithParsedItems);
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Enhanced POST endpoint to accept items
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { name, capacity, roomId, positionX, positionY, status, width, height, items } = req.body;

    // Validate required fields
    if (!name || roomId === undefined) {
      return res.status(400).json({ error: 'Name and roomId are required' });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Validate items if provided
    if (items && Array.isArray(items)) {
      const validationResult = validateOrderItems(items);
      if (!validationResult.isValid) {
        return res.status(400).json({ error: `Invalid items: ${validationResult.error}` });
      }
    }

    const newTable = await prisma.table.create({
      data: {
        name,
        roomId,
        x: positionX || 0,
        y: positionY || 0,
        width: width || 100,
        height: height || 100,
        status: status || 'available',
        items: items ? JSON.stringify(items) : undefined
      },
      include: {
        room: true,
      },
    });

    res.status(201).json({
      ...newTable,
      items: items || []
    });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Failed to create table', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Additional endpoints for item management...
```

### 3.2 New Utility Function for Item Validation
Create `backend/src/utils/validation.ts`:
```typescript
interface OrderItem {
  id: string;
  variantId: number;
  productId: number;
  name: string;
  price: number;
  quantity: number;
  effectiveTaxRate: number;
}

export function validateOrderItems(items: any[]): { isValid: boolean; error?: string } {
  if (!Array.isArray(items)) {
    return { isValid: false, error: 'Items must be an array' };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (typeof item !== 'object' || item === null) {
      return { isValid: false, error: `Item at index ${i} must be an object` };
    }

    // Validate required fields
    if (typeof item.id !== 'string') {
      return { isValid: false, error: `Item at index ${i} must have a string id` };
    }
    
    if (typeof item.variantId !== 'number') {
      return { isValid: false, error: `Item at index ${i} must have a numeric variantId` };
    }
    
    if (typeof item.productId !== 'number') {
      return { isValid: false, error: `Item at index ${i} must have a numeric productId` };
    }
    
    if (typeof item.name !== 'string') {
      return { isValid: false, error: `Item at index ${i} must have a string name` };
    }
    
    if (typeof item.price !== 'number') {
      return { isValid: false, error: `Item at index ${i} must have a numeric price` };
    }
    
    if (typeof item.quantity !== 'number') {
      return { isValid: false, error: `Item at index ${i} must have a numeric quantity` };
    }
    
    if (typeof item.effectiveTaxRate !== 'number') {
      return { isValid: false, error: `Item at index ${i} must have a numeric effectiveTaxRate` };
    }
  }

  return { isValid: true };
}
```

### 3.3 Item Management Endpoints Implementation
```typescript
// POST /api/tables/:id/items - Add items to a table
router.post('/:id/items', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Validate items
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    const validationResult = validateOrderItems(items);
    if (!validationResult.isValid) {
      return res.status(400).json({ error: `Invalid items: ${validationResult.error}` });
    }

    // Get existing items and append new ones
    const existingItems = table.items ? (typeof table.items === 'string' ? JSON.parse(table.items) : table.items) : [];
    const updatedItems = [...existingItems, ...items];

    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        items: JSON.stringify(updatedItems),
        status: updatedItems.length > 0 ? 'occupied' : 'available'
      },
      include: {
        room: true,
      },
    });

    res.json({
      ...updatedTable,
      items: updatedItems
    });
  } catch (error) {
    console.error('Error adding items to table:', error);
    res.status(500).json({ error: 'Failed to add items to table', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// PUT /api/tables/:id/items - Replace all items on a table
router.put('/:id/items', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    // Validate items
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    const validationResult = validateOrderItems(items);
    if (!validationResult.isValid) {
      return res.status(400).json({ error: `Invalid items: ${validationResult.error}` });
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        items: JSON.stringify(items),
        status: items.length > 0 ? 'occupied' : 'available'
      },
      include: {
        room: true,
      },
    });

    res.json({
      ...updatedTable,
      items
    });
  } catch (error) {
    console.error('Error updating table items:', error);
    res.status(500).json({ error: 'Failed to update table items', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// DELETE /api/tables/:id/items - Clear all items from a table
router.delete('/:id/items', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const table = await prisma.table.findUnique({
      where: { id },
    });

    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const updatedTable = await prisma.table.update({
      where: { id },
      data: {
        items: null,
        status: 'available'
      },
      include: {
        room: true,
      },
    });

    res.json({
      ...updatedTable,
      items: []
    });
  } catch (error) {
    console.error('Error clearing table items:', error);
    res.status(500).json({ error: 'Failed to clear table items', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});
```

## 4. Update Router Registration

Update `backend/src/router.ts` to register the updated tables router with the enhanced functionality.

## 5. Testing Strategy

### 5.1 Unit Tests
- Test all new endpoints for proper validation
- Test error handling for invalid inputs
- Test database operations
- Test item validation utilities

### 5.2 Integration Tests
- Test complete workflows of adding, updating, and removing items from tables
- Test integration with existing tab system
- Test table status updates based on item presence