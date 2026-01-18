# Tables Data Flow and State Management Design

## 1. Overall State Architecture

### 1.1 Core State Stores
- **Global Data Context** (`GlobalDataContext`): Contains all tables, rooms, and their basic information
- **Table Context** (`TableContext`): Manages table-specific state including items and active table
- **Order Context** (`OrderContext`): Manages current order items and active tab
- **Table Assignment Context** (`TableAssignmentContext`): Manages current table assignment

### 1.2 State Relationships
```
Global Data Context (all tables/rooms)
    ↓ (filtered subset)
Table Context (active room tables, active table)
    ↓ (current table items)
Order Context (current order items)
    ↓ (synced to active table)
Table Assignment Context (current assigned table)
```

## 2. Data Flow Patterns

### 2.1 Table Selection Flow
```
User selects table → TableAssignmentContext → TableContext → OrderContext
```

### 2.2 Item Management Flow
```
Order changes → OrderContext → TableContext → Backend API → GlobalDataContext updates
```

### 2.3 Table Switching Flow
```
User switches table → TableContext.switchToTable() → Update OrderContext.items → Update UI
```

## 3. State Management Implementation

### 3.1 Table Context State Structure
```typescript
interface TableContextState {
  // Existing state
  rooms: Room[];
  tables: Table[]; // Now includes items array
  layoutMode: LayoutMode;
  selectedRoomId: string | null;
  loading: boolean;
  error: string | null;
  
  // New state for enhanced functionality
  activeTable: Table | null; // Currently active table in session
  tableHistory: Table[]; // Recently accessed tables
  tableOperations: { // Track ongoing operations
    isAddingItems: boolean;
    isUpdatingItems: boolean;
    isClearingItems: boolean;
  };
}
```

### 3.2 State Synchronization Mechanisms

#### 3.2.1 Active Table Synchronization
When the active table changes, synchronize with other contexts:

```typescript
// When activeTable changes in TableContext
useEffect(() => {
  if (activeTable) {
    // Update OrderContext with table items
    setOrderItems(activeTable.items || []);
    
    // Update TableAssignmentContext
    setAssignedTable(activeTable);
  }
}, [activeTable]);
```

#### 3.2.2 Order Items to Table Sync
When order items change, optionally sync back to active table:

```typescript
// When orderItems change in OrderContext
useEffect(() => {
  if (activeTable && shouldSyncToTable) {
    // Debounced update to prevent excessive API calls
    debouncedUpdateTableItems(activeTable.id, orderItems);
  }
}, [orderItems, activeTable]);
```

## 4. Data Consistency Patterns

### 4.1 Optimistic Updates
For better UX, implement optimistic updates:

```typescript
const updateTableItemsOptimistic = async (tableId: string, newItems: OrderItem[]) => {
  // Optimistically update local state
  setTables(prev => prev.map(t => 
    t.id === tableId ? { ...t, items: newItems } : t
  ));
  
  if (activeTable?.id === tableId) {
    setActiveTable(prev => prev ? { ...prev, items: newItems } : null);
  }
  
  try {
    // Actually update on backend
    const response = await updateTableItemsAPI(tableId, newItems);
    // If successful, response is already in sync
  } catch (error) {
    // Revert on error
    console.error('Failed to update table items, reverting optimistic update');
    // Fetch fresh data to ensure consistency
    await refreshTableData(tableId);
  }
};
```

### 4.2 Conflict Resolution
Handle potential conflicts between table and order states:

```typescript
const resolveTableOrderConflict = (tableItems: OrderItem[], orderItems: OrderItem[]) => {
  // Strategy: Merge items with conflict resolution
  const mergedItems = [...tableItems];
  
  orderItems.forEach(orderItem => {
    const existingIndex = mergedItems.findIndex(item => item.id === orderItem.id);
    if (existingIndex >= 0) {
      // Resolve conflict: use the one with more recent timestamp or merge quantities
      mergedItems[existingIndex] = {
        ...mergedItems[existingIndex],
        quantity: mergedItems[existingIndex].quantity + orderItem.quantity
      };
    } else {
      mergedItems.push(orderItem);
    }
  });
  
  return mergedItems;
};
```

## 5. Event Handling and Side Effects

### 5.1 Table Assignment Events
```typescript
// When table is assigned
const handleTableAssign = (tableId: string) => {
  // 1. Update table assignment context
  setAssignedTable(findTableById(tableId));
  
  // 2. Update table context active table
  switchToTable(tableId);
  
  // 3. Update UI to reflect new table assignment
  updateUIForTable(tableId);
  
  // 4. Update table status to occupied if it has items
  if (getTableItems(tableId).length > 0) {
    updateTableStatus(tableId, 'occupied');
  }
};
```

### 5.2 Order Completion Events
```typescript
// When order is completed/paid
const handleOrderCompletion = () => {
  if (assignedTable) {
    // Clear items from table
    clearTableItems(assignedTable.id);
    
    // Update table status to available
    updateTableStatus(assignedTable.id, 'available');
    
    // Clear table assignment
    setAssignedTable(null);
  }
};
```

## 6. Caching and Performance

### 6.1 Table Items Caching
Cache table items to reduce API calls:

```typescript
const tableItemsCache = new Map<string, { items: OrderItem[], timestamp: number }>();

const getCachedTableItems = (tableId: string) => {
  const cached = tableItemsCache.get(tableId);
  if (cached && Date.now() - cached.timestamp < CACHE_TIMEOUT) {
    return cached.items;
  }
  return null;
};

const setTableItemsCache = (tableId: string, items: OrderItem[]) => {
  tableItemsCache.set(tableId, { items, timestamp: Date.now() });
};
```

### 6.2 Debounced Updates
Prevent excessive API calls:

```typescript
const debouncedUpdateTableItems = useCallback(
  debounce((tableId: string, items: OrderItem[]) => {
    updateTableItemsAPI(tableId, items);
  }, DEBOUNCE_DELAY),
  []
);
```

## 7. Error Handling and Recovery

### 7.1 Network Error Handling
```typescript
const handleNetworkError = (error: Error, operation: string) => {
  // Log error
  console.error(`Network error in ${operation}:`, error);
  
  // Show user-friendly message
  showErrorToast(`Failed to ${operation}. Please try again.`);
  
  // Attempt recovery
  if (operation.includes('update')) {
    // Try to refresh data to recover state
    refreshTableData();
  }
};
```

### 7.2 Data Validation
Validate data before processing:

```typescript
const validateTableData = (table: Table): boolean => {
  if (!table.id || typeof table.id !== 'string') return false;
  if (!table.name || typeof table.name !== 'string') return false;
  if (table.items && !Array.isArray(table.items)) return false;
  
  if (table.items) {
    for (const item of table.items) {
      if (!isValidOrderItem(item)) return false;
    }
  }
  
  return true;
};
```

## 8. State Initialization

### 8.1 Context Initialization Flow
```typescript
// During app initialization
const initializeTableState = async () => {
  // 1. Load basic table/room data from GlobalDataContext
  const initialData = await loadInitialTableData();
  
  // 2. Initialize TableContext with basic data
  setTables(initialData.tables);
  setRooms(initialData.rooms);
  
  // 3. Restore any persisted active table from session/local storage
  const persistedTableId = getPersistedActiveTableId();
  if (persistedTableId) {
    try {
      await switchToTable(persistedTableId);
    } catch (error) {
      console.warn('Could not restore persisted table state:', error);
      // Continue with no active table
    }
  }
};
```

## 9. Memory Management

### 9.1 Cleanup Unnecessary State
```typescript
// Clean up table history to prevent memory leaks
useEffect(() => {
  const cleanupInterval = setInterval(() => {
    if (tableHistory.length > MAX_HISTORY_SIZE) {
      setTableHistory(prev => prev.slice(-MAX_HISTORY_SIZE));
    }
  }, CLEANUP_INTERVAL);

  return () => clearInterval(cleanupInterval);
}, []);
```

This comprehensive data flow and state management design ensures that the enhanced table functionality works seamlessly with the existing tab system while providing the tab-like behavior requested.