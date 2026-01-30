# BUG-007: Deep Copy Performance Issue

## Severity Level
**HIGH**

## File Location
- `frontend/contexts/TableContext.tsx` (lines 120-150)
- `frontend/hooks/useTableHistory.ts` (lines 60-80)

## Description

The application uses `JSON.parse(JSON.stringify(state))` for deep copying state on every action. This is extremely inefficient for large table layouts, causing high CPU usage and UI jank, especially when dragging or resizing multiple items.

## Current Broken Code

```tsx
// TableContext.tsx - Line 120-150
const saveState = useCallback((action: TableAction) => {
  // BUG: Deep copy using JSON on EVERY action
  const stateCopy = JSON.parse(JSON.stringify({
    tables,
    layout,
    metadata
  }));
  
  addToHistory({
    action,
    state: stateCopy,
    timestamp: Date.now(),
  });
}, [tables, layout, metadata, addToHistory]);

// useTableHistory.ts - Line 60-80
export const useTableHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const addToHistory = useCallback((entry: HistoryEntry) => {
    setHistory(prev => {
      // BUG: Another deep copy for history pruning
      const newHistory = JSON.parse(JSON.stringify(
        [...prev, entry].slice(-MAX_HISTORY_SIZE)
      ));
      return newHistory;
    });
  }, []);
  
  const restoreFromHistory = useCallback((index: number) => {
    const entry = history[index];
    // BUG: Yet another deep copy when restoring
    return JSON.parse(JSON.stringify(entry.state));
  }, [history]);
  
  return { addToHistory, restoreFromHistory, history };
};
```

## Performance Impact

```javascript
// Benchmark data for 100 tables with full layout data
const largeLayout = {
  tables: Array(100).fill({
    id: 'uuid',
    name: 'Table Name',
    gridColumn: 1,
    gridRow: 1,
    items: Array(50).fill({ /* product data */ }),
    metadata: { /* nested objects */ }
  })
};

// JSON.stringify/parse performance:
// Small:  ~2ms   (10 tables)
// Medium: ~15ms  (50 tables)  ← Noticeable jank
// Large:  ~80ms  (100 tables) ← Severe jank
// XL:     ~300ms (500 tables) ← Unusable

// During drag operation at 60fps:
// Budget: ~16ms per frame
// JSON copy: 80ms per frame
// Result: 5 frames dropped per update = severe stutter
```

## Root Cause Analysis

1. **Quick but Wrong Solution**: JSON.parse/stringify is easy but computationally expensive
2. **No Optimization Strategy**: No consideration for partial updates or immutable patterns
3. **Multiple Copies**: State is copied multiple times in the call chain
4. **Large State Objects**: Tables include full product data instead of just references

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| UI Jank | HIGH | Frame drops during interactions |
| Battery Drain | HIGH | Excessive CPU usage |
| Poor Mobile Experience | HIGH | Unusable on low-end devices |
| Memory Pressure | MEDIUM | Duplicate objects in memory |

## Suggested Fix

### Option 1: Use Immer for Efficient Immutability (Recommended)

```tsx
// TableContext.tsx - Using Immer
import produce from 'immer';

const TableContextProvider = ({ children }) => {
  const [state, setState] = useState<TableState>(initialState);
  
  // Immer handles immutability efficiently without deep copies
  const updateTable = useCallback((tableId: string, updates: Partial<Table>) => {
    setState(prev => produce(prev, draft => {
      const table = draft.tables.find(t => t.id === tableId);
      if (table) {
        Object.assign(table, updates);
      }
    }));
  }, []);
  
  const moveTable = useCallback((tableId: string, position: Position) => {
    setState(prev => produce(prev, draft => {
      const table = draft.tables.find(t => t.id === tableId);
      if (table) {
        table.gridColumn = position.col;
        table.gridRow = position.row;
      }
    }));
  }, []);
  
  // Save to history only stores reference, not deep copy
  const saveToHistory = useCallback((action: TableAction) => {
    // Immer produces a frozen snapshot efficiently
    addToHistory({
      action,
      state: current(state),  // Immer's current() for snapshot
      timestamp: Date.now(),
    });
  }, []);
  
  return (
    <TableContext.Provider value={{ state, updateTable, moveTable }}>
      {children}
    </TableContext.Provider>
  );
};
```

### Option 2: Manual Optimized Updates

```tsx
// utils/stateUpdates.ts
// Update only changed fields without deep copying everything

export const updateTableInState = (
  state: TableState,
  tableId: string,
  updates: Partial<Table>
): TableState => {
  const tableIndex = state.tables.findIndex(t => t.id === tableId);
  if (tableIndex === -1) return state;
  
  // Only copy the tables array, not the entire state
  const newTables = [...state.tables];
  newTables[tableIndex] = { ...newTables[tableIndex], ...updates };
  
  return {
    ...state,
    tables: newTables,
  };
};

export const moveTableInState = (
  state: TableState,
  tableId: string,
  position: Position
): TableState => {
  return updateTableInState(state, tableId, {
    gridColumn: position.col,
    gridRow: position.row,
  });
};

// TableContext.tsx - Using optimized updates
const moveTable = useCallback((tableId: string, position: Position) => {
  setState(prev => {
    const newState = moveTableInState(prev, tableId, position);
    // Only save reference to state object
    saveToHistory({ type: 'MOVE', tableId, position }, newState);
    return newState;
  });
}, []);
```

### Option 3: Use Normalized State Structure

```typescript
// Store IDs instead of full objects
interface NormalizedState {
  tables: {
    byId: Record<string, Table>;
    allIds: string[];
  };
  products: {
    byId: Record<string, Product>;
    allIds: string[];
  };
  layouts: {
    byId: Record<string, Layout>;
    allIds: string[];
  };
}

// Tables only reference products by ID, not full objects
interface Table {
  id: string;
  name: string;
  productIds: string[];  // ← References instead of full objects
  gridColumn: number;
  gridRow: number;
}

// Benefits:
// 1. Smaller state to copy
// 2. Products can be cached/reused
// 3. Updates to one product don't require copying all tables
```

### Option 4: Debounce History Saving

```tsx
// hooks/useDebouncedHistory.ts
import { useRef, useCallback } from 'react';
import debounce from 'lodash/debounce';

export const useDebouncedHistory = (saveDelay: number = 500) => {
  const pendingStateRef = useRef<TableState | null>(null);
  const pendingActionRef = useRef<TableAction | null>(null);
  
  const debouncedSave = useRef(
    debounce(() => {
      if (pendingStateRef.current && pendingActionRef.current) {
        addToHistory({
          action: pendingActionRef.current,
          state: pendingStateRef.current,
          timestamp: Date.now(),
        });
        pendingStateRef.current = null;
        pendingActionRef.current = null;
      }
    }, saveDelay)
  ).current;
  
  const queueHistorySave = useCallback((state: TableState, action: TableAction) => {
    pendingStateRef.current = state;
    pendingActionRef.current = action;
    debouncedSave();
  }, [debouncedSave]);
  
  return { queueHistorySave };
};

// Usage: During drag, history is only saved when user stops dragging
```

## Testing Strategy

```typescript
// performance.test.ts
describe('State Update Performance', () => {
  it('should update state in under 16ms (60fps)', () => {
    const largeState = generateLargeState(100);  // 100 tables
    
    const start = performance.now();
    const newState = updateTableInState(largeState, 'table-1', { name: 'Updated' });
    const end = performance.now();
    
    expect(end - start).toBeLessThan(16);  // Must maintain 60fps
  });
  
  it('should not create unnecessary object copies', () => {
    const state = generateState(10);
    const tableId = 'table-1';
    
    const newState = updateTableInState(state, tableId, { name: 'New' });
    
    // Unchanged tables should be same reference (structural sharing)
    const unchangedTable = state.tables.find(t => t.id === 'table-2');
    const unchangedInNew = newState.tables.find(t => t.id === 'table-2');
    expect(unchangedInNew).toBe(unchangedTable);
    
    // Changed table should be new object
    const changedTable = state.tables.find(t => t.id === tableId);
    const changedInNew = newState.tables.find(t => t.id === tableId);
    expect(changedInNew).not.toBe(changedTable);
  });
  
  it('should maintain smooth dragging at 60fps', async () => {
    const { result } = renderHook(() => useTableContext());
    
    const frameDurations: number[] = [];
    
    // Simulate 60 drag operations
    for (let i = 0; i < 60; i++) {
      const start = performance.now();
      
      act(() => {
        result.current.moveTable('table-1', { col: i, row: 1 });
      });
      
      frameDurations.push(performance.now() - start);
    }
    
    const avgDuration = frameDurations.reduce((a, b) => a + b, 0) / frameDurations.length;
    expect(avgDuration).toBeLessThan(16);
  });
});
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Install and configure Immer | 1 hour |
| Refactor state updates | 4 hours |
| Update history management | 2 hours |
| Performance testing | 2 hours |
| **Total** | **9 hours (1-2 days)** |

## Related Issues

- [PERF-001: Deep Copy Every Action](./../05-performance/PERF-001-deep-copy-every-action.md)
- [BUG-002: Broken Undo/Redo](./../01-critical/BUG-002-broken-undo-redo.md)

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
