# BUG-002: Broken Undo/Redo Functionality

## Severity Level
**CRITICAL**

## File Location
- `frontend/hooks/useTableHistory.ts` (lines 25-60)
- `frontend/contexts/TableContext.tsx` (lines 150-180)

## Description

The undo/redo functionality is completely broken because the `saveToHistory` function captures stale state. Both the `before` and `after` snapshots in the history entry contain the same state reference, making it impossible to restore previous states.

## Current Broken Code

```typescript
// useTableHistory.ts - Line 35-50
const saveToHistory = useCallback((action: TableAction) => {
  const newEntry: HistoryEntry = {
    id: generateId(),
    timestamp: Date.now(),
    action,
    // BUG: Both before and after reference the same state object!
    before: tables,  // Current state reference
    after: tables,   // SAME reference - not the updated state!
  };
  
  setHistory(prev => [...prev.slice(0, currentIndex + 1), newEntry]);
  setCurrentIndex(prev => prev + 1);
}, [tables, currentIndex]);

// TableContext.tsx - Line 165
const moveTable = useCallback((tableId: string, newPosition: Position) => {
  // State update happens here
  dispatch({ type: 'MOVE_TABLE', payload: { tableId, newPosition } });
  
  // But saveToHistory is called AFTER dispatch, 
  // yet it captures the old 'tables' reference from closure
  saveToHistory({ type: 'MOVE', tableId, newPosition });
}, [dispatch, saveToHistory]);
```

## Root Cause Analysis

1. **Stale Closure**: The `saveToHistory` callback captures the `tables` state from its closure, but React state updates are asynchronous
2. **Reference Equality**: Even if timing were correct, both `before` and `after` would still point to the same object reference
3. **Missing State Snapshot**: The function doesn't properly snapshot the state before and after the action

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Feature Broken | CRITICAL | Undo/redo doesn't work at all |
| Data Loss Risk | HIGH | Users can't recover from mistakes |
| User Frustration | HIGH | Users lose work when they try to undo |
| Trust Erosion | MEDIUM | Users lose confidence in the application |

## Reproduction Steps

```typescript
// Test case showing the bug
const { moveTable, undo, canUndo } = useTableContext();

// Initial: Table A at position (1, 1)
expect(canUndo).toBe(false);

// Move table to (2, 2)
moveTable('table-a', { col: 2, row: 2 });
expect(canUndo).toBe(true);

// Try to undo
undo();

// BUG: Table is still at (2, 2) instead of (1, 1)!
// Because before and after were the same reference
```

## Suggested Fix

### Solution 1: Use Functional Updates with Proper Snapshots

```typescript
// useTableHistory.ts - Fixed version
interface HistoryEntry {
  id: string;
  timestamp: number;
  action: TableAction;
  before: Table[];  // Deep clone of state before
  after: Table[];   // Deep clone of state after
}

const useTableHistory = (tables: Table[]) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const tablesRef = useRef(tables);
  
  // Keep ref in sync
  useEffect(() => {
    tablesRef.current = tables;
  }, [tables]);
  
  // Capture state BEFORE action
  const captureBeforeState = useCallback(() => {
    return JSON.parse(JSON.stringify(tablesRef.current));
  }, []);
  
  // Save history entry with proper before/after
  const saveToHistory = useCallback((
    action: TableAction, 
    beforeState: Table[]
  ) => {
    const newEntry: HistoryEntry = {
      id: generateId(),
      timestamp: Date.now(),
      action,
      before: beforeState,                    // State before action
      after: JSON.parse(JSON.stringify(tablesRef.current)), // State after
    };
    
    setHistory(prev => [...prev.slice(0, currentIndex + 1), newEntry]);
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);
  
  // Undo function
  const undo = useCallback(() => {
    if (currentIndex < 0) return;
    
    const entry = history[currentIndex];
    // Restore the 'before' state
    dispatch({ type: 'RESTORE_STATE', payload: entry.before });
    setCurrentIndex(prev => prev - 1);
  }, [currentIndex, history, dispatch]);
  
  // Redo function
  const redo = useCallback(() => {
    if (currentIndex >= history.length - 1) return;
    
    const entry = history[currentIndex + 1];
    // Restore the 'after' state
    dispatch({ type: 'RESTORE_STATE', payload: entry.after });
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, history, dispatch]);
  
  return {
    saveToHistory,
    undo,
    redo,
    canUndo: currentIndex >= 0,
    canRedo: currentIndex < history.length - 1,
    captureBeforeState,
  };
};
```

### Solution 2: Use Reducer Pattern with History Integration

```typescript
// tableReducer.ts
interface StateWithHistory {
  present: TableState;
  past: TableState[];
  future: TableState[];
}

const historyReducer = (state: StateWithHistory, action: Action) => {
  switch (action.type) {
    case 'MOVE_TABLE':
    case 'ADD_TABLE':
    case 'DELETE_TABLE':
    case 'RESIZE_TABLE': {
      // Calculate new present state
      const newPresent = tableReducer(state.present, action);
      
      return {
        past: [...state.past, state.present],  // Save current to past
        present: newPresent,                    // New state
        future: [],                            // Clear redo stack
      };
    }
    
    case 'UNDO': {
      if (state.past.length === 0) return state;
      
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    
    case 'REDO': {
      if (state.future.length === 0) return state;
      
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }
    
    default:
      return {
        ...state,
        present: tableReducer(state.present, action),
      };
  }
};
```

### Solution 3: Simpler Fix with Immediate State Capture

```typescript
// TableContext.tsx - Minimal fix
const TableContextProvider = ({ children }) => {
  const [tables, dispatch] = useReducer(tableReducer, []);
  const tablesRef = useRef(tables);
  const pendingActionRef = useRef<{ action: TableAction; before: Table[] } | null>(null);
  
  // Update ref on every render
  tablesRef.current = tables;
  
  // Capture before state and perform action
  const performAction = useCallback((action: TableAction) => {
    const beforeState = JSON.parse(JSON.stringify(tablesRef.current));
    
    // Dispatch the action
    dispatch(action);
    
    // Store for history after state updates
    pendingActionRef.current = { action, before: beforeState };
  }, [dispatch]);
  
  // Save to history when tables change
  useEffect(() => {
    if (pendingActionRef.current) {
      const { action, before } = pendingActionRef.current;
      saveToHistory(action, before);
      pendingActionRef.current = null;
    }
  }, [tables]);
  
  const moveTable = useCallback((tableId: string, newPosition: Position) => {
    performAction({
      type: 'MOVE_TABLE',
      payload: { tableId, newPosition }
    });
  }, [performAction]);
  
  // ... rest of provider
};
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Implement proper state snapshotting | 3 hours |
| Update saveToHistory hook | 2 hours |
| Update all action handlers | 2 hours |
| Comprehensive testing | 3 hours |
| **Total** | **10 hours (1-2 days)** |

## Testing Strategy

```typescript
// useTableHistory.test.ts
describe('useTableHistory', () => {
  it('should properly undo a table move', () => {
    const { result } = renderHook(() => useTableHistory([]));
    
    // Add a table
    act(() => {
      result.current.saveToHistory(
        { type: 'ADD', tableId: 't1' },
        []
      );
    });
    
    // Verify history entry has different before/after
    expect(result.current.history[0].before).not.toBe(result.current.history[0].after);
    expect(result.current.history[0].before).toHaveLength(0);
    expect(result.current.history[0].after).toHaveLength(1);
    
    // Test undo
    act(() => {
      result.current.undo();
    });
    
    // State should be restored
    expect(result.current.canUndo).toBe(false);
  });
  
  it('should handle multiple undo/redo operations', () => {
    const { result } = renderHook(() => useTableHistory([]));
    
    // Perform 3 actions
    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current.saveToHistory(
          { type: 'ADD', tableId: `t${i}` },
          result.current.history.length > 0 
            ? result.current.history[result.current.history.length - 1].after 
            : []
        );
      });
    }
    
    // Undo twice
    act(() => result.current.undo());
    act(() => result.current.undo());
    expect(result.current.currentIndex).toBe(0);
    
    // Redo once
    act(() => result.current.redo());
    expect(result.current.currentIndex).toBe(1);
  });
});
```

## Related Issues

- [PERF-001: Deep Copy Performance](./../05-performance/PERF-001-deep-copy-every-action.md)
- [BUG-014: Dirty State Management](./../03-medium/BUG-014-dirty-state-management.md)

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.2.0
