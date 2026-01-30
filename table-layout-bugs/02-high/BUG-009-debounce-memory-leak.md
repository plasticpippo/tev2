# BUG-009: Debounce Memory Leak

## Severity Level
**HIGH**

## File Location
- `frontend/hooks/useTableHistory.ts` (lines 90-110)
- `frontend/contexts/TableContext.tsx` (lines 250-270)

## Description

The `updateTimeoutRef` used for debouncing history saves is not cleared when the component unmounts. This causes memory leaks and can lead to errors when the callback tries to update state on an unmounted component.

## Current Broken Code

```tsx
// useTableHistory.ts - Line 90-110
export const useTableHistory = () => {
  // BUG: Timeout ref not cleaned up on unmount
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  const debouncedSave = useCallback((entry: HistoryEntry) => {
    // Clear existing timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Set new timeout
    updateTimeoutRef.current = setTimeout(() => {
      setHistory(prev => [...prev, entry]);
    }, 500);
  }, []);
  
  // BUG: No useEffect to clear timeout on unmount!
  
  return { debouncedSave, history };
};

// TableContext.tsx - Line 250-270
const TableContextProvider = ({ children }) => {
  const { debouncedSave } = useTableHistory();
  const [state, setState] = useState(initialState);
  
  const updateTable = useCallback((tableId: string, updates: Partial<Table>) => {
    setState(prev => /* update logic */);
    debouncedSave({ action: 'UPDATE', tableId, updates });
  }, [debouncedSave]);
  
  // BUG: Component can unmount while timeout is pending
  
  return (
    <TableContext.Provider value={{ state, updateTable }}>
      {children}
    </TableContext.Provider>
  );
};
```

## Memory Leak Pattern

```
1. User navigates to Table Editor
   → TableContext mounts
   → useTableHistory initializes

2. User makes several edits quickly
   → Multiple timeouts scheduled (but cleared by debounce)
   → Final timeout scheduled for 500ms

3. User navigates away BEFORE timeout fires
   → TableContext unmounts
   → ❌ Timeout NOT cleared!
   → ❌ Timeout callback still pending

4. Timeout fires after unmount
   → setHistory called on unmounted component
   → ⚠️ React warning: "Can't perform state update on unmounted component"
   → 💧 Memory leak: closure retains references

5. Repeat navigation
   → More timeouts accumulate
   → Memory usage grows
```

## Root Cause Analysis

1. **Missing Cleanup**: No `useEffect` cleanup function to clear pending timeouts
2. **Stale Closures**: Callbacks capture state that persists after unmount
3. **No Unmount Check**: Callbacks don't check if component is still mounted

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Memory Leak | HIGH | Accumulates with each navigation |
| Console Warnings | MEDIUM | React warnings about state updates |
| Potential Crashes | MEDIUM | In extreme cases, can cause app slowdown |
| Poor Practice | MEDIUM | Anti-pattern that may spread to other code |

## Suggested Fix

### Option 1: Standard Cleanup Pattern (Recommended)

```tsx
// useTableHistory.ts - Fixed
export const useTableHistory = () => {
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  // FIXED: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);
  
  const debouncedSave = useCallback((entry: HistoryEntry) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      setHistory(prev => [...prev, entry]);
    }, 500);
  }, []);
  
  return { debouncedSave, history };
};
```

### Option 2: Use Established Library

```tsx
// hooks/useTableHistory.ts - Using use-debounce library
import { useDebouncedCallback } from 'use-debounce';

export const useTableHistory = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  
  // Library handles cleanup automatically
  const debouncedSave = useDebouncedCallback(
    (entry: HistoryEntry) => {
      setHistory(prev => [...prev, entry]);
    },
    500
  );
  
  return { debouncedSave, history };
};
```

## Testing Strategy

```typescript
// debounce-cleanup.test.tsx
describe('useTableHistory cleanup', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('should clear timeout on unmount', () => {
    const { result, unmount } = renderHook(() => useTableHistory());
    
    act(() => {
      result.current.debouncedSave({ action: 'TEST', id: '1' });
    });
    
    unmount();
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(console.error).not.toHaveBeenCalled();
  });
});
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Add cleanup useEffect | 30 min |
| Audit other hooks | 1 hour |
| Write tests | 1 hour |
| **Total** | **2.5 hours** |

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
