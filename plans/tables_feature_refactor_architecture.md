# Tables Feature Refactor Architecture Plan

## Overview
The goal is to refactor the tables feature to work more like the tabs feature, allowing tables to have persistent state and assignment capabilities similar to tabs. This means users should be able to create, save, load, and switch between different tables during an order session.

## Current State Analysis

### Tabs Feature Capabilities
- Create named tabs with items
- Load existing tabs and their items
- Add items to existing tabs
- Save changes to tabs
- Close tabs
- Transfer items between tabs

### Tables Feature Capabilities
- Create physical table locations
- Assign tables to orders/tabs
- Track table status (available, occupied, etc.)
- Visual layout management

## Proposed Enhanced Tables Architecture

### 1. Backend Changes

#### 1.1 Enhanced Table Model
We need to enhance the Table model to support item storage similar to tabs:

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
  items     Json     // Store order items directly on the table
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  tabs      Tab[]    // Existing relationship
}
```

#### 1.2 New API Endpoints for Table Items Management
- `POST /api/tables/:id/items` - Add items to a table
- `PUT /api/tables/:id/items/:itemId` - Update specific item on a table
- `DELETE /api/tables/:id/items/:itemId` - Remove specific item from a table
- `PUT /api/tables/:id/items` - Replace all items on a table
- `DELETE /api/tables/:id/items` - Clear all items from a table

#### 1.3 Modified Table Endpoints
- `GET /api/tables` - Include items in the response
- `GET /api/tables/:id` - Include items in the response
- `POST /api/tables` - Support creating tables with initial items
- `PUT /api/tables/:id` - Support updating table with items

### 2. Frontend Changes

#### 2.1 Enhanced Table Context
The `TableContext` needs to be enhanced to manage table items similar to how `TabManagementContext` manages tab items:

- Add functions to manage table items (add, update, remove)
- Add state to track active table (similar to activeTab)
- Add functions to switch between tables
- Add functions to save/load table state

#### 2.2 Table Management Interface
Enhance the `TableManagement` component to include:
- Table item display similar to tab items
- Ability to create tables with initial items
- Ability to load tables and their items into the current order session
- Table status indicators showing if a table has items/orders

#### 2.3 Order Panel Integration
Modify the `OrderPanel` to:
- Show current table assignment
- Allow switching between tables
- Show table-specific order history

### 3. Data Flow & State Management

#### 3.1 Table Session State
- `activeTable`: The currently selected table in the order session
- `tableItems`: Items associated with the active table
- `tableHistory`: Recent tables accessed during the session

#### 3.2 Synchronization Logic
- When switching to a table, load its items into the order panel
- When saving changes to a table, sync with backend
- When creating a new order for a table, update table status
- When clearing an order from a table, update table status

### 4. Key Features Implementation

#### 4.1 Table Creation with Items
Users should be able to create tables that can hold items immediately, similar to creating tabs.

#### 4.2 Table Loading/Switching
Users should be able to load existing tables with their items into the current order session, similar to loading tabs.

#### 4.3 Table Item Management
Users should be able to manage items directly on tables, including adding, removing, and updating items.

#### 4.4 Table Status Management
Automatic status updates based on table item presence:
- `empty`: No items on the table
- `occupied`: Items present on the table
- `reserved`: Reserved but no items yet
- `unavailable`: Unavailable for use

### 5. Integration Points

#### 5.1 With Tab System
- Tables can still be associated with tabs
- A tab can be linked to a specific table
- Items can be transferred between tables and tabs

#### 5.2 With Order System
- Orders can be initiated from tables
- Table items become part of the order process
- Payment can be processed per table

### 6. Migration Strategy

#### 6.1 Schema Migration
- Add `items` field to the `Table` model
- Run Prisma migration to update database schema

#### 6.2 Data Migration
- Existing tables will have empty items arrays initially
- No data loss for existing table information

#### 6.3 Frontend Migration
- Maintain backward compatibility
- Gradually introduce enhanced table features
- Preserve existing table layout functionality

### 7. Security Considerations
- Ensure proper authentication/authorization for table item operations
- Validate item data before storing
- Prevent unauthorized access to other tables' items

### 8. Performance Considerations
- Optimize table item queries to prevent performance issues
- Implement proper indexing on tables
- Consider pagination for tables with many items

### 9. Testing Strategy
- Unit tests for new table item management functions
- Integration tests for table-tab interactions
- End-to-end tests for table switching workflows
- Regression tests to ensure existing functionality remains intact