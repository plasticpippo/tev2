# Tables Feature - Technical Documentation

## Overview

The Tables feature provides comprehensive restaurant floor management with visual layout editing capabilities. This feature allows users to create rooms, design table layouts visually, assign customers to tables, and track table status in real-time.

## Database Schema

### Room Model
```prisma
model Room {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name        String
 description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  tables      Table[]

  @@map("rooms")
}
```

The Room model represents different areas in a restaurant (e.g., dining room, terrace, private room). Each room can contain multiple tables and has a unique UUID identifier.

### Table Model
```prisma
model Table {
  id          String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name        String
 x           Float    @default(0)
  y           Float    @default(0)
  width       Float    @default(100)
  height      Float    @default(100)
  status      String   @default("available") // available, occupied, reserved, unavailable
  roomId      String   @db.Uuid
  room        Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  tabs        Tab[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("tables")
  @@index([roomId])
}
```

The Table model represents individual tables in a room with positional information for visual layout, dimensions, and status tracking. Each table is linked to a room and can be associated with a tab.

### Tab Model Integration
```prisma
model Tab {
  id        Int      @id @default(autoincrement())
  name      String
  items     Json
  createdAt DateTime @default(now())
  tillId    Int
  tillName  String
  tableId   String?  @db.Uuid
  table     Table?   @relation(fields: [tableId], references: [id], onDelete: SetNull)

  @@map("tabs")
  @@index([tableId])
}
```

The Tab model has been enhanced with an optional `tableId` field to link tabs to specific tables, enabling table assignment functionality.

## API Endpoints

### Room Management Endpoints

#### `GET /api/rooms`
Retrieve all rooms in the system.

**Response:**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Main Dining",
    "description": "Main dining area with tables 1-10",
    "createdAt": "2025-11-04T10:00:00.000Z",
    "updatedAt": "2025-11-04T10:0:00.000Z"
  }
]
```

#### `GET /api/rooms/:id`
Retrieve a specific room by ID.

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "name": "Main Dining",
  "description": "Main dining area with tables 1-10",
  "createdAt": "2025-11-04T10:00:00.000Z",
  "updatedAt": "2025-11-04T10:00:00.000Z"
}
```

#### `POST /api/rooms`
Create a new room.

**Request Body:**
```json
{
  "name": "Main Dining",
  "description": "Main dining area with tables 1-10"
}
```

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "name": "Main Dining",
  "description": "Main dining area with tables 1-10",
  "createdAt": "2025-11-04T10:00:00.000Z",
  "updatedAt": "2025-11-04T10:00:00.000Z"
}
```

#### `PUT /api/rooms/:id`
Update an existing room.

**Request Body:**
```json
{
  "name": "Main Dining Room",
  "description": "Main dining area with tables 1-12"
}
```

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "name": "Main Dining Room",
  "description": "Main dining area with tables 1-12",
  "createdAt": "2025-11-04T10:00:00.000Z",
  "updatedAt": "2025-11-04T12:00:00.000Z"
}
```

#### `DELETE /api/rooms/:id`
Delete a room. Cannot delete rooms that have assigned tables.

**Response:**
- 204 No Content on success
- 400 Bad Request if room has assigned tables

### Table Management Endpoints

#### `GET /api/tables`
Retrieve all tables with room information.

**Response:**
```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "name": "Table 1",
    "x": 50,
    "y": 100,
    "width": 80,
    "height": 80,
    "status": "available",
    "roomId": "b2c3d4e5-f678-9012-3456-7890abcdef12",
    "createdAt": "2025-11-04T10:00:00.000Z",
    "updatedAt": "2025-11-04T10:00:00.000Z",
    "room": {
      "id": "b2c3d4e5-f678-9012-3456-7890abcdef12",
      "name": "Main Dining",
      "description": "Main dining area with tables 1-10"
    }
  }
]
```

#### `GET /api/tables/:id`
Retrieve a specific table by ID.

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "name": "Table 1",
  "x": 50,
  "y": 100,
  "width": 80,
  "height": 80,
  "status": "available",
  "roomId": "b2c3d4e5-f678-9012-3456-7890abcdef12",
  "createdAt": "2025-11-04T10:00:00.000Z",
  "updatedAt": "2025-11-04T10:00.000Z",
  "room": {
    "id": "b2c3d4e5-f678-9012-3456-7890abcdef12",
    "name": "Main Dining",
    "description": "Main dining area with tables 1-10"
  }
}
```

#### `POST /api/tables`
Create a new table.

**Request Body:**
```json
{
  "name": "Table 1",
  "roomId": "b2c3d4e5-f678-9012-3456-7890abcdef12",
  "x": 50,
  "y": 100,
  "width": 80,
  "height": 80,
  "status": "available"
}
```

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "name": "Table 1",
  "x": 50,
  "y": 100,
  "width": 80,
  "height": 80,
  "status": "available",
  "roomId": "b2c3d4e5-f678-9012-3456-7890abcdef12",
  "createdAt": "2025-11-04T10:00:00.000Z",
  "updatedAt": "2025-11-04T10:00:00.000Z",
  "room": {
    "id": "b2c3d4e5-f678-9012-3456-7890abcdef12",
    "name": "Main Dining",
    "description": "Main dining area with tables 1-10"
  }
}
```

#### `PUT /api/tables/:id`
Update an existing table.

**Request Body:**
```json
{
  "name": "Table 1A",
  "roomId": "b2c3d4e5-f678-9012-3456-7890abcdef12",
  "x": 75,
  "y": 125,
  "width": 100,
  "height": 100,
  "status": "occupied"
}
```

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "name": "Table 1A",
  "x": 75,
  "y": 125,
  "width": 100,
  "height": 100,
  "status": "occupied",
  "roomId": "b2c3d4e5-f678-9012-3456-7890abcdef12",
  "createdAt": "2025-11-04T10:00:00.000Z",
  "updatedAt": "2025-11-04T12:00:00.000Z",
  "room": {
    "id": "b2c3d4e5-f678-9012-3456-7890abcdef12",
    "name": "Main Dining",
    "description": "Main dining area with tables 1-10"
  }
}
```

#### `PUT /api/tables/:id/position`
Update only the position of a table (for drag-and-drop functionality).

**Request Body:**
```json
{
  "positionX": 100,
  "positionY": 150
}
```

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "name": "Table 1A",
  "x": 100,
  "y": 150,
  "width": 100,
  "height": 100,
  "status": "occupied",
 "roomId": "b2c3d4e5-f678-9012-3456-7890abcdef12",
  "createdAt": "2025-11-04T10:00:00.000Z",
  "updatedAt": "2025-11-04T12:30:00.000Z",
  "room": {
    "id": "b2c3d4e5-f678-9012-3456-7890abcdef12",
    "name": "Main Dining",
    "description": "Main dining area with tables 1-10"
  }
}
```

#### `DELETE /api/tables/:id`
Delete a table. Cannot delete tables that have associated tabs.

**Response:**
- 204 No Content on success
- 400 Bad Request if table has associated tabs

## Frontend Components

### Table Context (`TableContext.tsx`)
The `TableContext` provides global state management for rooms and tables across the application. It handles data fetching, updates, and state management for the table management system.

**Key Functions:**
- `loadRooms()` - Fetch and load all rooms
- `loadTables()` - Fetch and load all tables
- `addRoom(roomData)` - Add a new room
- `updateRoom(id, roomData)` - Update an existing room
- `deleteRoom(id)` - Delete a room
- `addTable(tableData)` - Add a new table
- `updateTable(id, tableData)` - Update an existing table
- `deleteTable(id)` - Delete a table
- `updateTablePosition(id, x, y)` - Update table position (for drag-and-drop)

### Table Management Component (`TableManagement.tsx`)
The main interface for managing rooms and tables, featuring:

- **Three tabs**: Layout editor, room management, and table management
- **Room management**: Create, edit, and delete rooms
- **Table management**: Create, edit, and delete tables
- **Visual layout editor**: Drag-and-drop interface for arranging tables

**Key Features:**
- Room selection dropdown
- Layout mode selector (View, Edit, Drag)
- Responsive design for different screen sizes
- Virtual keyboard integration for touch screens
- Confirmation modals for delete operations

### Table Layout Editor (`TableLayoutEditor.tsx`)
A visual canvas for designing room layouts with drag-and-drop functionality:

- **Drag-and-drop**: Move tables around the canvas
- **Status indicators**: Visual representation of table status (available, occupied, reserved, unavailable)
- **Boundary checking**: Prevents tables from being dragged outside the canvas
- **Mode indicators**: Shows current layout mode
- **Responsive design**: Adapts to different screen sizes

**Visual Status Colors:**
- Green: Available
- Red: Occupied
- Yellow: Reserved
- Gray: Unavailable

### Integration with Existing Components

#### Tab Manager Integration
The Tab Manager component has been enhanced to support table assignment:

- New "Table" column showing which table each tab is assigned to
- Ability to assign tabs to tables during creation
- Visual indicators for table status in the tab list
- Option to transfer tabs between tables

#### Transaction History Integration
The Transaction History component now includes table information:

- New "Table" column showing which table was used for each transaction
- Filtering options by table
- Enhanced transaction details showing table assignment

#### Order Panel Integration
The Order Panel shows current table assignment:

- Clear display of which table the current order is assigned to
- Option to change table assignment during the ordering process
- Visual feedback when switching between tables

## Visual Layout Editor

The visual layout editor provides an intuitive interface for designing restaurant floor plans:

### Layout Modes
1. **View Mode**: Read-only view of the layout
2. **Edit Mode**: Allows dragging and repositioning tables
3. **Drag Mode**: Alternative mode for table manipulation

### Features
- **Drag-and-Drop**: Move tables by clicking and dragging them to new positions
- **Visual Feedback**: Tables highlight when being dragged
- **Boundary Checking**: Tables cannot be moved outside the canvas area
- **Status Indicators**: Color-coded table representations based on status
- **Tooltips**: Hover over tables to see their name and status
- **Responsive Design**: Works well on different screen sizes

### Best Practices for Layout Design
1. **Plan Ahead**: Design your layout before implementing it in the system
2. **Leave Space**: Ensure adequate space between tables for customer comfort and staff movement
3. **Accessibility**: Consider wheelchair accessibility and clear pathways
4. **Traffic Flow**: Design layouts that allow efficient movement of staff and customers
5. **Group Similar Tables**: Group tables of similar sizes together when possible
6. **Consider Views**: Position tables to take advantage of views or other attractive features

## Integration with Tab System

The tables feature seamlessly integrates with the existing tab system:

### Table-Tab Relationship
- Each tab can be associated with a specific table
- Tables can have multiple tabs over time (but only one active tab at a time)
- When a tab is closed, the table status updates to "available"
- When a new tab is opened at a table, the table status updates to "occupied"

### Workflow Integration
1. **Table Selection**: Users can select a table from the visual layout when creating a new tab
2. **Status Updates**: Table status automatically updates based on tab activity
3. **Tab Transfer**: Tabs can be transferred between tables when needed
4. **Reporting**: Transaction reports include table assignment information

### Benefits of Integration
- **Improved Customer Service**: Staff can easily see which tables are occupied
- **Better Organization**: Clear tracking of which orders belong to which tables
- **Enhanced Reporting**: Detailed analytics on table utilization
- **Streamlined Operations**: Simplified workflow for restaurant staff

## Best Practices for Managing Tables and Rooms

### Room Management
1. **Logical Grouping**: Create rooms based on logical areas (dining room, bar area, terrace)
2. **Clear Naming**: Use descriptive names that staff can easily understand
3. **Regular Updates**: Update room descriptions as the physical layout changes
4. **Plan for Growth**: Design rooms with future expansion in mind

### Table Management
1. **Consistent Naming**: Use a consistent naming convention (e.g., "Table 1", "Corner Booth")
2. **Appropriate Sizing**: Set table dimensions that reflect real-world proportions
3. **Status Accuracy**: Ensure table status is always up-to-date
4. **Regular Review**: Periodically review and adjust table layouts based on usage patterns

### Layout Design
1. **Staff Efficiency**: Design layouts that optimize staff workflow
2. **Customer Experience**: Consider sightlines and privacy when positioning tables
3. **Flexibility**: Design layouts that can be easily modified as needed
4. **Safety**: Ensure adequate spacing for emergency exits and safe movement

### Performance Considerations
1. **Limit Table Count**: Avoid creating too many tables in a single room for performance
2. **Optimize Layouts**: Regularly clean up unused or obsolete layouts
3. **Monitor Usage**: Track which tables and rooms are most/least used
4. **Regular Maintenance**: Periodically review and update the table system

## Troubleshooting

### Common Issues
1. **Tables Not Saving**: Ensure all required fields are filled when creating tables
2. **Drag-and-Drop Not Working**: Check that you're in the correct layout mode
3. **Room Deletion Failing**: You cannot delete rooms that still have tables assigned
4. **Table Deletion Failing**: You cannot delete tables that have open tabs

### Performance Tips
1. **Large Layouts**: For rooms with many tables, consider splitting them into multiple rooms
2. **Browser Compatibility**: Ensure the browser supports HTML5 drag-and-drop functionality
3. **Network Issues**: The system uses local caching to maintain responsiveness during network issues

## Security Considerations

### Access Control
- Only authorized users can create, modify, or delete rooms and tables
- Role-based permissions ensure appropriate access levels
- All API endpoints require authentication

### Data Validation
- All inputs are validated both on the frontend and backend
- SQL injection protection through parameterized queries
- Proper sanitization of user inputs

This documentation provides a comprehensive overview of the tables feature implementation, covering database schema, API endpoints, frontend components, and integration with the existing tab system. For additional details, refer to the source code and implementation files.