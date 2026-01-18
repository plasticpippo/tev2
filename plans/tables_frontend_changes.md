# Frontend Changes for Enhanced Table Functionality

## 1. Enhanced Table Context (`frontend/components/TableContext.tsx`)

### 1.1 State Extensions
Add new state variables to manage table items and active table:
```typescript
interface TableContextType {
  // Existing properties
  rooms: Room[];
  tables: Table[];
  layoutMode: LayoutMode;
  selectedRoomId: string | null;
  loading: boolean;
  error: string | null;
  setRooms: (rooms: Room[]) => void;
  setTables: (tables: Table[]) => void;
  setLayoutMode: (mode: LayoutMode) => void;
  setSelectedRoomId: (id: string | null) => void;
  fetchRooms: () => Promise<void>;
  fetchTables: () => Promise<void>;
  addRoom: (room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Room>;
  updateRoom: (id: string, room: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Room>;
  deleteRoom: (id: string) => Promise<void>;
  addTable: (table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Table>;
  updateTable: (id: string, table: Partial<Omit<Table, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Table>;
  deleteTable: (id: string) => Promise<void>;
  updateTablePosition: (id: string, x: number, y: number) => Promise<void>;
  refreshData: () => Promise<void>;
  
  // New properties for table items management
  activeTable: Table | null;                    // Currently selected table in session
  setActiveTable: (table: Table | null) => void;
  addItemsToTable: (tableId: string, items: OrderItem[]) => Promise<Table>;
  updateTableItems: (tableId: string, items: OrderItem[]) => Promise<Table>;
  clearTableItems: (tableId: string) => Promise<Table>;
  switchToTable: (tableId: string) => Promise<void>;
  getTableItems: (tableId: string) => OrderItem[];
}
```

### 1.2 New Context Functions
Implement functions similar to tab management functions:

```typescript
// Add items to a table
const addItemsToTable = useCallback(async (tableId: string, items: OrderItem[]) => {
  try {
    setLoading(true);
    const response = await fetch(`${apiUrl}/api/tables/${tableId}/items`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items })
    });

    if (!response.ok) {
      throw new Error(`Failed to add items to table: ${response.statusText}`);
    }

    const updatedTable = await response.json();
    
    // Update local state
    setTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
    if (activeTable?.id === tableId) {
      setActiveTable(updatedTable);
    }
    
    return updatedTable;
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error adding items to table');
    console.error('Error adding items to table:', err);
    throw err;
  } finally {
    setLoading(false);
  }
}, [activeTable]);

// Update all items on a table
const updateTableItems = useCallback(async (tableId: string, items: OrderItem[]) => {
  try {
    setLoading(true);
    const response = await fetch(`${apiUrl}/api/tables/${tableId}/items`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items })
    });

    if (!response.ok) {
      throw new Error(`Failed to update table items: ${response.statusText}`);
    }

    const updatedTable = await response.json();
    
    // Update local state
    setTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
    if (activeTable?.id === tableId) {
      setActiveTable(updatedTable);
    }
    
    return updatedTable;
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error updating table items');
    console.error('Error updating table items:', err);
    throw err;
  } finally {
    setLoading(false);
  }
}, [activeTable]);

// Clear all items from a table
const clearTableItems = useCallback(async (tableId: string) => {
  try {
    setLoading(true);
    const response = await fetch(`${apiUrl}/api/tables/${tableId}/items`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to clear table items: ${response.statusText}`);
    }

    const updatedTable = await response.json();
    
    // Update local state
    setTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
    if (activeTable?.id === tableId) {
      setActiveTable(updatedTable);
    }
    
    return updatedTable;
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error clearing table items');
    console.error('Error clearing table items:', err);
    throw err;
  } finally {
    setLoading(false);
  }
}, [activeTable]);

// Switch to a different table (load its items into current session)
const switchToTable = useCallback(async (tableId: string) => {
  try {
    setLoading(true);
    const table = await getTableById(tableId);
    setActiveTable(table);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Error switching to table');
    console.error('Error switching to table:', err);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);

// Helper function to get table by ID
const getTableById = useCallback(async (tableId: string): Promise<Table> => {
  const response = await fetch(`${apiUrl}/api/tables/${tableId}`, {
    headers: getAuthHeaders()
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch table: ${response.statusText}`);
  }

  return await response.json();
}, []);

// Get items from a specific table
const getTableItems = useCallback((tableId: string): OrderItem[] => {
  const table = tables.find(t => t.id === tableId);
  return table?.items || [];
}, [tables]);
```

## 2. Enhanced Table Management Component (`frontend/components/TableManagement.tsx`)

### 2.1 Add Table Items Display
Modify the table management interface to show items on each table when expanded:

```tsx
// In the table list view, show items count and basic info
<div className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
  <div>
    <p className="font-semibold">{table.name}</p>
    <p className="text-sm text-slate-400">
      Room: {room?.name || 'Unknown'} | Status: {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
    </p>
    {table.items && table.items.length > 0 && (
      <p className="text-xs text-amber-400 mt-1">
        {table.items.length} item{table.items.length !== 1 ? 's' : ''} | Total: {calculateTableTotal(table.items)}
      </p>
    )}
    <p className="text-xs text-slate-500">Position: ({table.x}, {table.y}) | Size: {table.width}x{table.height}</p>
  </div>
  <div className="flex items-center gap-2">
    <button
      onClick={() => { setEditingTable(table); setIsTableModalOpen(true); }}
      className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 text-sm rounded-md"
    >
      Edit
    </button>
    <button
      onClick={() => setDeletingTable(table)}
      className="bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-3 text-sm rounded-md"
    >
      Delete
    </button>
  </div>
</div>
```

### 2.2 Add Table Actions Modal
Create functionality to allow users to perform actions on tables similar to tabs.

## 3. Table Assignment Context Enhancement (`frontend/contexts/TableAssignmentContext.tsx`)

### 3.1 Extend Table Assignment Context
Enhance the context to support table switching and item management:

```typescript
interface TableAssignmentContextType {
  assignedTable: Table | null;
  setAssignedTable: React.Dispatch<React.SetStateAction<Table | null>>;
  handleTableAssign: (tableId: string) => Promise<void>;
  handleOpenTableAssignment: () => void;
  
  // New functions for enhanced table management
  handleSwitchToTable: (tableId: string) => Promise<void>;  // Switch to a different table
  handleLoadTableItems: (tableId: string) => Promise<void>; // Load items from table to order panel
  handleSaveToTable: (tableId: string) => Promise<void>;    // Save current order to table
  handleClearTable: (tableId: string) => Promise<void>;     // Clear items from table
}
```

### 3.2 Implement Enhanced Functions
```typescript
const handleSwitchToTable = async (tableId: string) => {
  if (tableId) {
    const table = appData.tables.find(t => t.id === tableId);
    if (!table) {
      console.error(`Table with ID ${tableId} not found`);
      return;
    }
    
    // Set the table as assigned
    setAssignedTable(table);
    
    // If there's an active tab, update it with the new table assignment
    if (activeTab && assignedTillId) {
      await api.saveTab({ ...activeTab, tableId });
    }
  }
};

const handleLoadTableItems = async (tableId: string) => {
  // Load items from the specified table into the current order
  const table = appData.tables.find(t => t.id === tableId);
  if (table && table.items) {
    setOrderItems(table.items);
    setAssignedTable(table);
  }
};

const handleSaveToTable = async (tableId: string) => {
  // Save the current order items to the specified table
  if (orderItems.length > 0) {
    await updateTableItems(tableId, orderItems);
  }
};
```

## 4. Enhanced Order Panel (`frontend/components/OrderPanel.tsx`)

### 4.1 Add Table Controls
Add controls to the order panel to manage table assignments:

```tsx
// In the OrderPanel component
<div className="bg-slate-800 rounded-lg p-4 mb-4">
  <div className="flex justify-between items-center mb-2">
    <h3 className="font-bold text-amber-400">Table Assignment</h3>
    {assignedTable ? (
      <div className="flex items-center gap-2">
        <span className="text-green-400">Table: {assignedTable.name}</span>
        <button 
          onClick={onOpenTableAssignment}
          className="text-blue-400 hover:text-blue-300 text-sm"
        >
          Change
        </button>
      </div>
    ) : (
      <button 
        onClick={onOpenTableAssignment}
        className="text-blue-400 hover:text-blue-300 text-sm"
      >
        Assign Table
      </button>
    )}
  </div>
  
  {assignedTable && (
    <div className="flex gap-2 mt-2">
      <button
        onClick={() => handleSaveToTable(assignedTable.id)}
        className="bg-amber-600 hover:bg-amber-500 text-white text-xs py-1 px-2 rounded"
      >
        Save to Table
      </button>
      <button
        onClick={handleClearOrder}
        className="bg-red-700 hover:bg-red-600 text-white text-xs py-1 px-2 rounded"
      >
        Clear Table
      </button>
    </div>
  )}
</div>
```

## 5. Enhanced Table Assignment Modal (`frontend/components/TableAssignmentModal.tsx`)

### 5.1 Add Action Buttons
Add buttons to allow users to load from or save to tables:

```tsx
// In the table assignment modal, add action buttons
{selectedTableId && (
  <div className="flex gap-2 mb-4">
    <button
      onClick={() => loadItemsFromTable(selectedTableId)}
      className="bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 px-2 rounded flex-1"
    >
      Load Items
    </button>
    <button
      onClick={() => saveItemsToTable(selectedTableId)}
      className="bg-green-600 hover:bg-green-500 text-white text-xs py-1 px-2 rounded flex-1"
    >
      Save to Table
    </button>
  </div>
)}
```

## 6. Service Layer Updates (`frontend/services/tableService.ts`)

### 6.1 Add New API Functions
Add service functions for the new table item management endpoints:

```typescript
// Add items to a table
export const addItemsToTable = async (tableId: string, items: OrderItem[]): Promise<Table> => {
  try {
    const response = await fetch(apiUrl(`/api/tables/${tableId}/items`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    const updatedTable = await response.json();
    notifyUpdates();
    return updatedTable;
  } catch (error) {
    console.error('Error adding items to table:', error);
    throw error;
  }
};

// Update all items on a table
export const updateTableItems = async (tableId: string, items: OrderItem[]): Promise<Table> => {
  try {
    const response = await fetch(apiUrl(`/api/tables/${tableId}/items`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ items })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    const updatedTable = await response.json();
    notifyUpdates();
    return updatedTable;
  } catch (error) {
    console.error('Error updating table items:', error);
    throw error;
  }
};

// Clear all items from a table
export const clearTableItems = async (tableId: string): Promise<Table> => {
  try {
    const response = await fetch(apiUrl(`/api/tables/${tableId}/items`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    const updatedTable = await response.json();
    notifyUpdates();
    return updatedTable;
  } catch (error) {
    console.error('Error clearing table items:', error);
    throw error;
  }
};
```

## 7. Visual Table Layout Enhancement (`frontend/components/TableLayoutEditor.tsx`)

### 7.1 Add Visual Indicators for Active Tables
Enhance the table layout editor to show visual indicators for tables with items:

```tsx
// In the TableLayoutEditor component, enhance the table display
{roomTables.map(table => (
  <div
    key={table.id}
    className={`absolute rounded-lg flex items-center justify-center text-white font-bold cursor-pointer border-2 transition-all duration-150
      ${getStatusColor(table.status)}
      ${table.items && table.items.length > 0 ? 'ring-2 ring-yellow-400' : ''}
      ${assignedTable?.id === table.id ? 'ring-4 ring-blue-400 z-20' : ''}
      ${layoutMode === 'edit' || layoutMode === 'drag' ? 'hover:ring-2 hover:ring-amber-400' : ''}
      ${draggingTableId === table.id ? 'ring-4 ring-amber-400 z-10' : ''}`}
    style={{ 
      left: `${table.x}px`, 
      top: `${table.y}px`,
      width: `${table.width}px`,
      height: `${table.height}px`
    }}
    onClick={() => handleTableClick(table)}
    title={`${table.name} - ${getStatusText(table.status)}${table.items ? ` (${table.items.length} items)` : ''}`}
  >
    <div className="text-center p-1">
      <div>{table.name}</div>
      {table.items && table.items.length > 0 && (
        <div className="text-xs bg-black bg-opacity-50 rounded px-1">
          {table.items.length} item{table.items.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  </div>
))}
```

## 8. Integration with Tab Management

### 8.1 Update Tab Management Context
Ensure the tab management system works harmoniously with the enhanced table system:

- When a tab is saved, it can be associated with a table
- When a table is loaded, it can be converted to a tab or merged with current order
- Items can be transferred between tables and tabs

This will create a seamless experience where users can work with either tables or tabs depending on their workflow needs.