# Frontend Changes Requirements: Tables vs Tabs

## Executive Summary

This document details the frontend changes required to make tables work like tabs. The changes include component updates, context modifications, service layer additions, and UI enhancements.

## Table of Contents

1. [Type Definitions](#type-definitions)
2. [Service Layer Changes](#service-layer-changes)
3. [Context Changes](#context-changes)
4. [Component Changes](#component-changes)
5. [UI/UX Enhancements](#uiux-enhancements)

---

## Type Definitions

### 1. Update Shared Types

**File:** [`shared/types.ts`](../shared/types.ts)

**Update Table Interface:**
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
  items?: OrderItem[];  // Changed from any[] to OrderItem[]
  tillId?: number;  // NEW
  tillName?: string;  // NEW
  ownerId?: number;
  createdAt: string;
  updatedAt: string;
  room: Room;
  tabs: Tab[];
}
```

**Update Transaction Interface:**
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

**Update Tab Interface:**
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

## Service Layer Changes

### 1. Add Table Item Management Functions

**File:** [`frontend/services/tableService.ts`](../frontend/services/tableService.ts) (NEW FILE or UPDATE)

**New Functions:**

```typescript
import { apiBase } from './apiBase';
import type { Table, OrderItem } from '@shared/types';

// Get table items
export const getTableItems = async (tableId: string): Promise<{
  id: string;
  name: string;
  items: OrderItem[];
  tillId?: number;
  tillName?: string;
}> => {
  const response = await fetch(`${apiBase}/tables/${tableId}/items`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch table items');
  }

  return response.json();
};

// Add items to table
export const addItemsToTable = async (
  tableId: string,
  items: OrderItem[],
  tillId: number,
  tillName: string
): Promise<Table> => {
  const response = await fetch(`${apiBase}/tables/${tableId}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    },
    body: JSON.stringify({ items, tillId, tillName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add items to table');
  }

  return response.json();
};

// Update table items
export const updateTableItems = async (
  tableId: string,
  items: OrderItem[],
  tillId: number,
  tillName: string
): Promise<Table> => {
  const response = await fetch(`${apiBase}/tables/${tableId}/items`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    },
    body: JSON.stringify({ items, tillId, tillName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update table items');
  }

  return response.json();
};

// Clear table items
export const clearTableItems = async (tableId: string): Promise<void> => {
  const response = await fetch(`${apiBase}/tables/${tableId}/items`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to clear table items');
  }
};

// Convert table to tab
export const convertTableToTab = async (
  tableId: string,
  tabName: string
): Promise<Tab> => {
  const response = await fetch(`${apiBase}/tables/${tableId}/convert-to-tab`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    },
    body: JSON.stringify({ tabName }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to convert table to tab');
  }

  return response.json();
};

// Assign tab to table
export const assignTabToTable = async (
  tabId: number,
  tableId: string
): Promise<Table> => {
  const response = await fetch(`${apiBase}/tabs/${tabId}/assign-to-table/${tableId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to assign tab to table');
  }

  return response.json();
};
```

### 2. Update Transaction Service

**File:** [`frontend/services/transactionService.ts`](../frontend/services/transactionService.ts) (UPDATE)

**Update createTransaction function:**
```typescript
export const createTransaction = async (
  transaction: Omit<Transaction, 'id' | 'createdAt'> & { tableId?: string; tableName?: string }
): Promise<Transaction> => {
  const response = await fetch(`${apiBase}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transaction),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create transaction');
  }

  return response.json();
};
```

---

## Context Changes

### 1. Update TableContext

**File:** [`frontend/components/TableContext.tsx`](../frontend/components/TableContext.tsx)

**Add Item Management Functions:**

```typescript
interface TableContextType {
  // ... existing properties ...
  
  // NEW: Item management functions
  getTableItems: (tableId: string) => Promise<{
    id: string;
    name: string;
    items: OrderItem[];
    tillId?: number;
    tillName?: string;
  }>;
  addItemsToTable: (tableId: string, items: OrderItem[], tillId: number, tillName: string) => Promise<Table>;
  updateTableItems: (tableId: string, items: OrderItem[], tillId: number, tillName: string) => Promise<Table>;
  clearTableItems: (tableId: string) => Promise<void>;
  convertTableToTab: (tableId: string, tabName: string) => Promise<Tab>;
  assignTabToTable: (tabId: number, tableId: string) => Promise<Table>;
}
```

**Implement New Functions:**

```typescript
export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ... existing state ...

  // NEW: Get table items
  const getTableItems = useCallback(async (tableId: string) => {
    try {
      setLoading(true);
      const data = await getTableItems(tableId);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching table items';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error fetching table items:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // NEW: Add items to table
  const addItemsToTable = useCallback(async (
    tableId: string,
    items: OrderItem[],
    tillId: number,
    tillName: string
  ) => {
    try {
      setLoading(true);
      const updatedTable = await addItemsToTable(tableId, items, tillId, tillName);
      setTables(prev => prev.map(table => 
        table.id === tableId ? updatedTable : table
      ));
      addToast(`Items added to table "${updatedTable.name}"`, 'success');
      return updatedTable;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding items to table';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error adding items to table:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // NEW: Update table items
  const updateTableItems = useCallback(async (
    tableId: string,
    items: OrderItem[],
    tillId: number,
    tillName: string
  ) => {
    try {
      setLoading(true);
      const updatedTable = await updateTableItems(tableId, items, tillId, tillName);
      setTables(prev => prev.map(table => 
        table.id === tableId ? updatedTable : table
      ));
      addToast(`Table "${updatedTable.name}" updated`, 'success');
      return updatedTable;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error updating table items';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error updating table items:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // NEW: Clear table items
  const clearTableItems = useCallback(async (tableId: string) => {
    try {
      setLoading(true);
      await clearTableItems(tableId);
      setTables(prev => prev.map(table => 
        table.id === tableId 
          ? { ...table, items: undefined, status: 'available' as const }
          : table
      ));
      addToast('Table items cleared', 'success');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error clearing table items';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error clearing table items:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // NEW: Convert table to tab
  const convertTableToTab = useCallback(async (tableId: string, tabName: string) => {
    try {
      setLoading(true);
      const tab = await convertTableToTab(tableId, tabName);
      // Update table status
      setTables(prev => prev.map(table => 
        table.id === tableId 
          ? { ...table, items: undefined, status: 'available' as const }
          : table
      ));
      addToast(`Table converted to tab "${tab.name}"`, 'success');
      return tab;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error converting table to tab';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error converting table to tab:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // NEW: Assign tab to table
  const assignTabToTable = useCallback(async (tabId: number, tableId: string) => {
    try {
      setLoading(true);
      const updatedTable = await assignTabToTable(tabId, tableId);
      setTables(prev => prev.map(table => 
        table.id === tableId ? updatedTable : table
      ));
      addToast(`Tab assigned to table "${updatedTable.name}"`, 'success');
      return updatedTable;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error assigning tab to table';
      setError(errorMessage);
      addToast(errorMessage, 'error');
      console.error('Error assigning tab to table:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  return (
    <TableContext.Provider
      value={{
        // ... existing values ...
        getTableItems,
        addItemsToTable,
        updateTableItems,
        clearTableItems,
        convertTableToTab,
        assignTabToTable,
      }}
    >
      {children}
    </TableContext.Provider>
  );
};
```

---

## Component Changes

### 1. Update TableManagement Component

**File:** [`frontend/components/TableManagement.tsx`](../frontend/components/TableManagement.tsx)

**Add Item Management UI:**

```typescript
// Add new state for item management
const [selectedTableForItems, setSelectedTableForItems] = useState<Table | null>(null);
const [isTableItemsModalOpen, setIsTableItemsModalOpen] = useState(false);

// Add handler for viewing table items
const handleViewTableItems = (table: Table) => {
  setSelectedTableForItems(table);
  setIsTableItemsModalOpen(true);
};

// Add handler for clearing table items
const handleClearTableItems = async (table: Table) => {
  if (confirm(`Are you sure you want to clear all items from table "${table.name}"?`)) {
    try {
      await clearTableItems(table.id);
      refreshData();
    } catch (error) {
      console.error('Error clearing table items:', error);
    }
  }
};

// Add handler for converting table to tab
const handleConvertToTab = async (table: Table) => {
  const tabName = prompt(`Enter tab name for table "${table.name}":`, table.name);
  if (tabName && tabName.trim()) {
    try {
      await convertTableToTab(table.id, tabName.trim());
      refreshData();
    } catch (error) {
      console.error('Error converting table to tab:', error);
    }
  }
};
```

**Update Table List UI:**

```typescript
// In the tables tab, update the table item rendering
{roomTables.map(table => {
  const room = rooms.find(r => r.id === table.roomId);
  const hasItems = table.items && table.items.length > 0;
  
  return (
    <div key={table.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
      <div>
        <p className="font-semibold">{table.name}</p>
        <p className="text-sm text-slate-400">
          Room: {room?.name || 'Unassigned'} | Status: {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
        </p>
        {hasItems && (
          <p className="text-xs text-amber-400 mt-1">
            {table.items!.length} item(s) - Total: {formatCurrency(
              table.items!.reduce((sum, item) => sum + item.price * item.quantity, 0)
            )}
          </p>
        )}
        <p className="text-xs text-slate-500">Position: ({table.x}, {table.y}) | Size: {table.width}x{table.height}</p>
      </div>
      <div className="flex items-center gap-2">
        {hasItems && (
          <>
            <button
              onClick={() => handleViewTableItems(table)}
              className="btn btn-info text-sm flex items-center gap-1"
              title="View table items"
            >
              View Items
              <span className="text-xs">👁</span>
            </button>
            <button
              onClick={() => handleClearTableItems(table)}
              className="btn btn-warning text-sm flex items-center gap-1"
              title="Clear table items"
            >
              Clear Items
              <span className="text-xs">🗑</span>
            </button>
            <button
              onClick={() => handleConvertToTab(table)}
              className="btn btn-success text-sm flex items-center gap-1"
              title="Convert to tab"
            >
              To Tab
              <span className="text-xs">📋</span>
            </button>
          </>
        )}
        <button
          onClick={() => { setEditingTable(table); setIsTableModalOpen(true); }}
          className="btn btn-info text-sm flex items-center gap-1"
          title="Edit table details"
        >
          Edit
          <span className="text-xs">✎</span>
        </button>
        <button
          onClick={() => setDeletingTable(table)}
          className="btn btn-danger text-sm flex items-center gap-1"
          title="Delete this table"
        >
          Delete
          <span className="text-xs">✕</span>
        </button>
      </div>
    </div>
  );
})}
```

**Add Table Items Modal:**

```typescript
// New component for viewing/managing table items
const TableItemsModal: React.FC<{
  table: Table;
  onClose: () => void;
  onLoadItems: (items: OrderItem[]) => void;
}> = ({ table, onClose, onLoadItems }) => {
  const { updateTableItems, clearTableItems } = useTableContext();
  const [items, setItems] = useState<OrderItem[]>(table.items || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setItems(items.filter(item => item.id !== itemId));
    } else {
      setItems(items.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTableItems(table.id, items, table.tillId || 1, table.tillName || 'Default');
      onClose();
    } catch (error) {
      console.error('Error saving table items:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadToOrder = () => {
    onLoadItems(items);
    onClose();
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-400">Table: {table.name}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700 transition">&times;</button>
        </div>
        
        <div className="flex-grow overflow-y-auto pb-4">
          {items.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No items on this table</p>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="bg-slate-900 p-3 rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-slate-400">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                    <button 
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      className="w-10 h-10 bg-slate-700 rounded-full text-lg font-bold flex-shrink-0 flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-slate-700 pt-4">
            <div className="flex justify-between text-xl mb-4">
              <span>Total</span>
              <span className="font-bold">{formatCurrency(total)}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleLoadToOrder}
                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-md transition"
              >
                Load to Order
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-md transition disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add modal to component JSX
{isTableItemsModalOpen && selectedTableForItems && (
  <TableItemsModal
    table={selectedTableForItems}
    onClose={() => {
      setIsTableItemsModalOpen(false);
      setSelectedTableForItems(null);
    }}
    onLoadItems={(items) => {
      // This will be passed from parent or handled via context
      console.log('Load items to order:', items);
    }}
  />
)}
```

### 2. Update OrderPanel Component

**File:** [`frontend/components/OrderPanel.tsx`](../frontend/components/OrderPanel.tsx)

**Add Table Item Management:**

```typescript
interface OrderPanelProps {
  orderItems: OrderItem[];
  user: User;
  onUpdateQuantity: (orderItemId: string, newQuantity: number) => void;
  onClearOrder: () => void;
  onPayment: () => void;
  onOpenTabs: () => void;
  onLogout: () => void;
  activeTab: Tab | null;
  onSaveTab: () => void;
  assignedTable: Table | null;
  onOpenTableAssignment: () => void;
  // NEW: Props for table item management
  onLoadTableItems: (tableId: string) => void;
  onSaveToTable: () => void;
}
```

**Update Button Rendering:**

```typescript
// Update renderNoTabButtons to include table-specific actions
const renderNoTabButtons = (
  onOpenTabs: () => void,
  onClearOrder: () => void,
  onOpenTableAssignment: () => void,
  onPayment: () => void,
  orderItems: OrderItem[],
  assignedTable: Table | null,
  onLoadTableItems: (tableId: string) => void,
  onSaveToTable: () => void
) => (
  <>
    <div className="grid grid-cols-2 gap-2">
      <button
        onClick={onOpenTabs}
        className={`btn btn-info w-full ${orderItems.length === 0 ? 'col-span-2' : ''}`}
      >
        {orderItems.length > 0 ? 'Tabs' : 'View Open Tabs'}
      </button>
      {orderItems.length > 0 && (
        <button onClick={onClearOrder} className="btn btn-danger w-full">
          Clear
        </button>
      )}
    </div>
    
    <div className="space-y-2">
      {/* Assign to Table button */}
      {orderItems.length > 0 && (
        <button
          onClick={onOpenTableAssignment}
          className={`btn w-full ${
            assignedTable
              ? 'btn-primary'
              : 'btn-secondary'
          }`}
        >
          {assignedTable ? `TABLE: ${assignedTable.name}` : 'ASSIGN TABLE'}
        </button>
      )}
      
      {/* NEW: Save to Table button */}
      {assignedTable && orderItems.length > 0 && (
        <button
          onClick={onSaveToTable}
          className="btn btn-success w-full"
        >
          Save to Table
        </button>
      )}
      
      {/* NEW: Load Table Items button */}
      {assignedTable && assignedTable.items && assignedTable.items.length > 0 && (
        <button
          onClick={() => onLoadTableItems(assignedTable.id)}
          className="btn btn-info w-full"
        >
          Load Table Items ({assignedTable.items.length})
        </button>
      )}
      
      {orderItems.length > 0 && (
        <button
          onClick={onPayment}
          className="btn btn-success w-full"
        >
          Payment
        </button>
      )}
    </div>
  </>
);
```

### 3. Update PaymentModal Component

**File:** [`frontend/components/PaymentModal.tsx`](../frontend/components/PaymentModal.tsx)

**Add Table-Specific Payment Handling:**

```typescript
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderItems: OrderItem[];
  taxSettings: TaxSettings;
  onConfirmPayment: (paymentMethod: string, tip: number) => void;
  assignedTable?: { name: string; id: string } | null;  // Updated to include id
  onClearTableItems?: () => void;  // NEW: Optional callback to clear table items
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  orderItems, 
  taxSettings, 
  onConfirmPayment, 
  assignedTable,
  onClearTableItems 
}) => {
  // ... existing code ...

  const handleConfirmPayment = (paymentMethod: string) => {
    onConfirmPayment(paymentMethod, tip);
    
    // NEW: Clear table items after payment if table is assigned
    if (assignedTable && onClearTableItems) {
      onClearTableItems();
    }
  };

  // ... existing code ...

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md p-6 border border-slate-700 max-h-[90vh] flex flex-col">
        {/* ... existing header ... */}
        
        <div className="flex-grow overflow-y-auto pb-4">
        
        {assignedTable && (
            <div className="mb-4 bg-green-900 p-3 rounded-md border-green-700">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-bold text-green-200">Table: {assignedTable.name}</p>
                        <p className="text-sm text-green-300">Payment for assigned table</p>
                    </div>
                    {/* NEW: Clear table items checkbox */}
                    <label className="flex items-center gap-2 text-sm text-green-200">
                        <input
                            type="checkbox"
                            checked={true}
                            onChange={(e) => {
                                if (!e.target.checked && onClearTableItems) {
                                    onClearTableItems();
                                }
                            }}
                            className="w-4 h-4"
                        />
                        Clear items after payment
                    </label>
                </div>
            </div>
        )}
        
        {/* ... existing tip and total sections ... */}
        
        </div>

        <div className="pt-4 border-t border-slate-700 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={() => handleConfirmPayment('CASH')}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 text-lg rounded-md transition"
            >
              Pay with CASH
            </button>
            <button
              onClick={() => handleConfirmPayment('CARD')}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 text-lg rounded-md transition"
            >
              Pay with CARD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 4. Update TabManager Component

**File:** [`frontend/components/TabManager.tsx`](../frontend/components/TabManager.tsx)

**Add Table Assignment UI:**

```typescript
interface TabManagerProps {
  isOpen: boolean;
  onClose: () => void;
  tabs: Tab[];
  onCreateTab: (name: string) => void;
  onAddToTab: (tabId: number) => void;
  onLoadTab: (tabId: number) => void;
  onCloseTab: (tabId: number) => void;
  onOpenTransfer: (tabId: number) => void;
  currentOrder: OrderItem[];
  // NEW: Props for table assignment
  tables: Table[];
  onAssignTabToTable: (tabId: number, tableId: string) => void;
}
```

**Add Table Assignment Button:**

```typescript
// In the tab list rendering, add table assignment button
{[...tabs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(tab => {
  const tabTotal = tab.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <div key={tab.id} className="bg-slate-900 p-3 rounded-md flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-bold text-white">{tab.name}</p>
          <p className="text-sm text-slate-300">{formatCurrency(tabTotal)}</p>
        </div>
        <div className="flex items-center gap-2">
          {canAddToTabs ? (
            <button
              onClick={() => onAddToTab(tab.id)}
              className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md text-sm transition"
            >
              Add to Tab
            </button>
          ) : tab.items.length === 0 ? (
            <button
              onClick={() => onCloseTab(tab.id)}
              className="bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm transition"
            >
              Close Tab
            </button>
          ) : (
            <>
              <button
                onClick={() => onOpenTransfer(tab.id)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-4 rounded-md text-sm transition"
              >
                Transfer
              </button>
              <button
                onClick={() => onLoadTab(tab.id)}
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-4 rounded-md text-sm transition"
              >
                Load Tab
              </button>
            </>
          )}
          {/* NEW: Assign to Table button */}
          {tab.items.length > 0 && (
            <button
              onClick={() => {
                const tableId = prompt('Enter table ID to assign this tab:');
                if (tableId) {
                  onAssignTabToTable(tab.id, tableId);
                }
              }}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md text-sm transition"
              title="Assign tab to table"
            >
              To Table
            </button>
          )}
        </div>
      </div>
      {tab.tableId && (
        <div className="flex justify-between items-center text-xs mt-1">
          <span className="text-green-400">Table: {tab.tableId}</span>
        </div>
      )}
    </div>
  );
})}
```

### 5. Update MainPOSInterface Component

**File:** [`frontend/components/MainPOSInterface.tsx`](../frontend/components/MainPOSInterface.tsx)

**Add Table Item Management Handlers:**

```typescript
export const MainPOSInterface: React.FC = () => {
  const {
    // ... existing context values ...
    assignedTable,
    // NEW: Table context functions
    getTableItems,
    addItemsToTable,
    updateTableItems,
    clearTableItems,
  } = useAppContext();

  // NEW: Handler for loading table items
  const handleLoadTableItems = async (tableId: string) => {
    try {
      const tableData = await getTableItems(tableId);
      // Add table items to current order
      tableData.items.forEach(item => {
        handleAddToCart(item);
      });
      addToast(`Loaded ${tableData.items.length} items from table`, 'success');
    } catch (error) {
      addToast('Failed to load table items', 'error');
    }
  };

  // NEW: Handler for saving to table
  const handleSaveToTable = async () => {
    if (!assignedTable) return;
    
    try {
      await addItemsToTable(
        assignedTable.id,
        orderItems,
        assignedTillId || 1,
        currentTillName || 'Default'
      );
      clearOrder(true);
      addToast(`Order saved to table "${assignedTable.name}"`, 'success');
    } catch (error) {
      addToast('Failed to save to table', 'error');
    }
  };

  // NEW: Handler for clearing table items after payment
  const handleClearTableItems = async () => {
    if (!assignedTable) return;
    
    try {
      await clearTableItems(assignedTable.id);
      addToast(`Table "${assignedTable.name}" items cleared`, 'success');
    } catch (error) {
      addToast('Failed to clear table items', 'error');
    }
  };

  // ... existing code ...

  return (
    <>
      {/* ... existing JSX ... */}
      
      <OrderPanel
        orderItems={orderItems}
        user={currentUser}
        onUpdateQuantity={handleUpdateQuantity}
        onClearOrder={() => clearOrder(true)}
        onPayment={() => setIsPaymentModalOpen(true)}
        onOpenTabs={() => setIsTabsModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        onSaveTab={handleSaveTab}
        assignedTable={assignedTable}
        onOpenTableAssignment={handleOpenTableAssignment}
        // NEW: Pass table item management handlers
        onLoadTableItems={handleLoadTableItems}
        onSaveToTable={handleSaveToTable}
      />
      
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderItems={orderItems}
        taxSettings={appData.settings!.tax}
        onConfirmPayment={handleConfirmPayment}
        assignedTable={assignedTable}
        // NEW: Pass clear table items handler
        onClearTableItems={handleClearTableItems}
      />
      
      {/* ... existing JSX ... */}
    </>
  );
};
```

---

## UI/UX Enhancements

### 1. Visual Indicators for Tables with Items

Add visual indicators in the table layout to show which tables have active orders:

```typescript
// In TableLayoutEditor component
const renderTable = (table: Table) => {
  const hasItems = table.items && table.items.length > 0;
  const total = hasItems 
    ? table.items!.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0;

  return (
    <div
      className={`absolute rounded-lg border-2 cursor-pointer transition-all ${
        hasItems 
          ? 'bg-green-900 border-green-500 shadow-lg shadow-green-500/50' 
          : 'bg-slate-700 border-slate-600'
      }`}
      style={{
        left: `${table.x}px`,
        top: `${table.y}px`,
        width: `${table.width}px`,
        height: `${table.height}px`,
      }}
    >
      <div className="p-2 h-full flex flex-col justify-between">
        <div>
          <p className="font-bold text-white text-sm">{table.name}</p>
          <p className="text-xs text-slate-300">{table.status}</p>
        </div>
        {hasItems && (
          <div className="bg-green-800 rounded p-1 text-center">
            <p className="text-xs text-green-200 font-bold">
              {table.items!.length} items
            </p>
            <p className="text-xs text-green-300">
              {formatCurrency(total)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 2. Table Status Auto-Update

Automatically update table status based on item presence:

```typescript
// In TableContext, add effect to auto-update status
useEffect(() => {
  tables.forEach(table => {
    const hasItems = table.items && table.items.length > 0;
    const expectedStatus = hasItems ? 'occupied' : 'available';
    
    if (table.status !== expectedStatus) {
      updateTable(table.id, { status: expectedStatus as Table['status'] });
    }
  });
}, [tables, updateTable]);
```

### 3. Quick Actions for Tables

Add quick action buttons in the table layout:

```typescript
// Add quick action menu for tables
const TableQuickActions: React.FC<{ table: Table }> = ({ table }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { getTableItems, clearTableItems, convertTableToTab } = useTableContext();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-2 right-2 w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center hover:bg-slate-500"
      >
        ⋮
      </button>
      
      {isOpen && (
        <div className="absolute top-10 right-0 bg-slate-800 rounded-lg shadow-xl border border-slate-700 py-2 z-50 min-w-[150px]">
          {table.items && table.items.length > 0 && (
            <>
              <button
                onClick={() => {
                  getTableItems(table.id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-700 text-sm"
              >
                View Items
              </button>
              <button
                onClick={() => {
                  clearTableItems(table.id);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-700 text-sm text-red-400"
              >
                Clear Items
              </button>
              <button
                onClick={() => {
                  const tabName = prompt('Enter tab name:', table.name);
                  if (tabName) {
                    convertTableToTab(table.id, tabName);
                    setIsOpen(false);
                  }
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-700 text-sm"
              >
                Convert to Tab
              </button>
            </>
          )}
          <button
            onClick={() => {
              // Open edit modal
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-slate-700 text-sm"
          >
            Edit Table
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## Summary of Changes

### Type Definitions
1. Update Table interface to include till context and typed items
2. Update Transaction interface to include table association
3. Update Tab interface to include owner field

### Service Layer
1. Add table item management functions (get, add, update, clear)
2. Add table-tab conversion functions
3. Update transaction service to support table association

### Context Changes
1. Add item management functions to TableContext
2. Implement optimistic updates for table operations
3. Add error handling and toast notifications

### Component Changes
1. TableManagement - Add item management UI
2. OrderPanel - Add table-specific actions
3. PaymentModal - Add table payment handling
4. TabManager - Add table assignment UI
5. MainPOSInterface - Add table item management handlers

### UI/UX Enhancements
1. Visual indicators for tables with items
2. Auto-update table status
3. Quick action menus for tables
4. Improved table layout visualization
