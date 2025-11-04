# Tables Feature Implementation Plan

## Overview

This document outlines the comprehensive implementation plan for the tables feature in the POS system. The tables feature will allow for visual layout editing, room assignment, and integration with the existing tab system to provide a complete restaurant management solution.

## 1. Detailed Architecture Overview

### 1.1 System Architecture
The tables feature will integrate seamlessly with the existing architecture:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend        │    │   Database      │
│   (React)       │◄──►│   (Express.js)   │◄──►│   (PostgreSQL)  │
└─────────────────┘    └──────────────────┘    └─────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Table Layout   │    │  Table API       │    │  Table Schema   │
│  Components     │    │  Handlers        │    │  Models         │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### 1.2 Component Architecture
- **Frontend**: React components for visual table layout, table management, and integration with existing tab system
- **Backend**: Express.js API endpoints for table operations and layout management
- **Database**: Prisma ORM models for tables, rooms, and layouts
- **Integration**: Seamless connection with existing tab system and order flow

## 2. Database Schema Changes

### 2.1 New Database Models

#### Room Model
```prisma
model Room {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  layout      Json?    // Stores visual layout configuration
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt()
  
  tables      Table[]
  
  @@map("rooms")
}
```

#### Table Model
```prisma
model Table {
  id          Int      @id @default(autoincrement())
  name        String   // e.g., "Table 1", "Corner Booth"
  number      Int      // numeric identifier
  shape       String   // "round", "square", "rectangle", "custom"
  capacity    Int      // number of seats
  positionX   Float    // x coordinate for visual layout
  positionY   Float    // y coordinate for visual layout
  width       Float    // width for visual representation
  height      Float    // height for visual representation
 color       String? // visual color for the table
  status      String   // "available", "occupied", "reserved", "closed"
  roomId      Int
 tabId       Int?     // reference to associated tab
 createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt()
  
  room        Room     @relation(fields: [roomId], references: [id])
  tab         Tab?     @relation(fields: [tabId], references: [id])
  
  @@map("tables")
}
```

### 2.2 Modified Existing Models

#### Tab Model (enhanced)
```prisma
model Tab {
  id        Int      @id @default(autoincrement())
  name      String
  items     Json
  createdAt DateTime @default(now())
  tillId    Int
  tillName  String
 tableId   Int?     // NEW: Link to table
  
  table     Table?   @relation(fields: [tableId], references: [id]) // NEW: Relationship to table
  
  @@map("tabs")
}
```

## 3. Backend API Structure

### 3.1 API Endpoints

#### Rooms API
- `GET /api/rooms` - Get all rooms with their layouts
- `GET /api/rooms/:id` - Get a specific room with its layout
- `POST /api/rooms` - Create a new room
- `PUT /api/rooms/:id` - Update a room and its layout
- `DELETE /api/rooms/:id` - Delete a room

#### Tables API
- `GET /api/tables` - Get all tables with their status and room assignments
- `GET /api/tables/:id` - Get a specific table
- `POST /api/tables` - Create a new table
- `PUT /api/tables/:id` - Update a table (including position, status, etc.)
- `DELETE /api/tables/:id` - Delete a table
- `PUT /api/tables/:id/status` - Update table status (available, occupied, etc.)

#### Table Layout API
- `PUT /api/rooms/:id/layout` - Update room layout configuration
- `GET /api/rooms/:id/layout` - Get room layout configuration

### 3.2 API Handler Structure

```
backend/src/handlers/
├── rooms.ts          # Room management handlers
├── tables.ts         # Table management handlers
└── tableLayouts.ts   # Layout management handlers
```

### 3.3 Request/Response Examples

#### Create Room Request
```json
{
  "name": "Main Dining",
  "description": "Main dining area with tables 1-10",
  "layout": {
    "scale": 1.0,
    "backgroundImage": null,
    "gridSize": 20
  }
}
```

#### Create Table Request
```json
{
  "name": "Table 1",
  "number": 1,
  "shape": "round",
  "capacity": 4,
  "positionX": 100,
  "positionY": 150,
  "width": 80,
  "height": 80,
  "color": "#4ade80",
  "roomId": 1
}
```

## 4. Frontend Component Structure

### 4.1 Core Components

#### Table Management Components
```
frontend/components/
├── tables/
│   ├── TableManagement.tsx          # Main table management interface
│   ├── TableLayoutEditor.tsx        # Visual layout editor
│   ├── TableList.tsx                # List view of tables
│   ├── TableCard.tsx                # Individual table card component
│   ├── RoomManagement.tsx           # Room management interface
│   ├── TableStatusIndicator.tsx     # Table status display
│   └── TableReservationModal.tsx    # Modal for table reservations
```

#### Visual Layout Components
```
frontend/components/
├── visual-layout/
│   ├── VisualLayoutCanvas.tsx       # Canvas for visual layout editing
│   ├── TableShape.tsx              # Visual representation of tables
│   ├── LayoutToolbar.tsx           # Toolbar for layout operations
│   ├── LayoutGrid.tsx              # Grid overlay for precise positioning
│   └── LayoutControls.tsx          # Controls for zoom, pan, etc.
```

### 4.2 Component Hierarchy

```
TableManagement
├── RoomSelector
├── LayoutCanvas
│   ├── LayoutGrid
│   ├── TableShape (multiple instances)
│   └── LayoutControls
├── TableList
│   └── TableCard (multiple instances)
└── TableStatusIndicator
```

### 4.3 Key Component Interfaces

#### TableShape Props
```typescript
interface TableShapeProps {
  table: Table;
  isSelected: boolean;
  onSelect: (tableId: number) => void;
 onMove: (tableId: number, x: number, y: number) => void;
  onResize: (tableId: number, width: number, height: number) => void;
  onClick: (tableId: number) => void;
}
```

#### VisualLayoutCanvas Props
```typescript
interface VisualLayoutCanvasProps {
  roomId: number;
  tables: Table[];
  roomLayout: RoomLayout;
  onTableMove: (tableId: number, x: number, y: number) => void;
  onTableResize: (tableId: number, width: number, height: number) => void;
  onTableSelect: (tableId: number) => void;
  onTableClick: (tableId: number) => void;
  readOnly?: boolean;
}
```

## 5. Integration Points with Existing System

### 5.1 Tab System Integration

#### Linking Tables to Tabs
- Modify existing Tab system to include optional tableId reference
- Update TabManager component to show table assignments
- Add table status updates when tabs are created/closed

#### Tab Creation Flow Enhancement
```
1. User selects a table from visual layout
2. System checks table availability
3. If available, creates new tab linked to table
4. Updates table status to "occupied"
5. Opens tab for order entry
```

#### Tab Management Updates
- Add table information to TabManager modal
- Show which tables are currently assigned to tabs
- Allow tab transfer between tables
- Update table status when tabs are closed

### 5.2 Order Flow Integration

#### Order Assignment to Tables
- When creating orders, optionally assign to specific tables
- Track which orders belong to which tables
- Visual indicators on layout showing active orders
- Ability to move orders between tables

### 5.3 Existing Component Modifications

#### Modified Components
- `TabManager.tsx` - Add table assignment functionality
- `OrderPanel.tsx` - Show current table assignment
- `PaymentModal.tsx` - Handle table-specific payments

## 6. Implementation Phases

### Phase 1: Database and Backend Foundation (Week 1)
- [ ] Add Room and Table models to Prisma schema
- [ ] Create database migration for new models
- [ ] Implement Rooms API handlers
- [ ] Implement Tables API handlers
- [ ] Create API endpoints for room and table operations
- [ ] Add integration to Tab model (tableId reference)
- [ ] Write backend unit tests

### Phase 2: Core Frontend Components (Week 2)
- [ ] Create RoomManagement component
- [ ] Create TableList and TableCard components
- [ ] Create basic TableManagement interface
- [ ] Implement API service functions for new endpoints
- [ ] Add routing for table management pages
- [ ] Write frontend unit tests

### Phase 3: Visual Layout Editor (Week 3)
- [ ] Create VisualLayoutCanvas component
- [ ] Implement TableShape component with drag/resize
- [ ] Add layout tools (grid, zoom, pan)
- [ ] Implement room layout saving/loading
- [ ] Add visual styling for different table states
- [ ] Write canvas interaction tests

### Phase 4: Tab Integration (Week 4)
- [ ] Modify Tab model and API to include tableId
- [ ] Update TabManager to show table assignments
- [ ] Implement table-to-tab linking functionality
- [ ] Add table status updates based on tab state
- [ ] Update OrderPanel to show table info
- [ ] Test tab-table integration thoroughly

### Phase 5: Advanced Features and Polish (Week 5)
- [ ] Add table reservation functionality
- [ ] Implement table splitting/merging
- [ ] Add table status indicators
- [ ] Create table-specific reporting
- [ ] Add keyboard shortcuts for layout editing
- [ ] Performance optimization for large layouts

### Phase 6: Testing and Deployment (Week 6)
- [ ] End-to-end integration testing
- [ ] User acceptance testing
- [ ] Performance testing with large table layouts
- [ ] Security review
- [ ] Documentation updates
- [ ] Deployment preparation

## 7. Testing Strategy

### 7.1 Unit Testing
- **Backend**: Test all API endpoints using Jest
- **Frontend**: Test individual components with React Testing Library
- **Database**: Test Prisma queries and relationships

### 7.2 Integration Testing
- Test API endpoint interactions with database
- Test frontend component interactions
- Test tab-table integration flows

### 7.3 End-to-End Testing
- Use Playwright for comprehensive UI testing
- Test complete table management workflows
- Test integration with existing tab system
- Test visual layout functionality

### 7.4 Performance Testing
- Test with large numbers of tables (100+)
- Test layout rendering performance
- Test API response times under load

### 7.5 Test Coverage Targets
- Backend: 90%+ line coverage
- Frontend: 85%+ line coverage
- Critical paths: 100% coverage

## 8. Deployment Considerations

### 8.1 Database Migration Strategy
- Create proper Prisma migration for schema changes
- Ensure zero-downtime migration process
- Backup existing data before migration
- Test migration on staging environment first

### 8.2 Environment Configuration
- Add environment variables for new features if needed
- Ensure compatibility with existing configuration
- Update Docker Compose for any new services

### 8.3 Rollout Strategy
- Deploy to staging first for testing
- Gradual rollout to production (canary deployment)
- Monitor system performance after deployment
- Prepare rollback plan if issues arise

### 8.4 Monitoring and Observability
- Add logging for new table operations
- Monitor API performance for new endpoints
- Track usage of new table features
- Set up alerts for any table-related errors

## 9. Security Considerations

### 9.1 Data Validation
- Validate all table layout data inputs
- Sanitize JSON layout configurations
- Implement proper access controls for table operations

### 9.2 Authorization
- Ensure only authorized users can modify table layouts
- Implement role-based access for table management
- Secure all new API endpoints

## 10. Performance Considerations

### 10.1 Frontend Performance
- Optimize canvas rendering for large layouts
- Implement virtualization for table lists
- Use memoization for layout components

### 10.2 Backend Performance
- Optimize database queries for table operations
- Implement caching for room layouts
- Use proper indexing for table lookups

## 11. Future Enhancements

### 11.1 Planned Extensions
- Table reservation system with time slots
- Integration with external reservation systems
- Advanced layout templates
- Table utilization analytics
- Mobile-friendly table management

### 11.2 Potential Integrations
- POS hardware integration for table-side ordering
- Integration with restaurant management systems
- Customer-facing table status displays

This implementation plan provides a comprehensive roadmap for developing the tables feature while maintaining integration with the existing system architecture and following best practices for scalability and maintainability.