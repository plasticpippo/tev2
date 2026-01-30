# BUG-004: Conflicting Keyboard Event Handlers

## Severity Level
**CRITICAL**

## File Location
- `frontend/components/EnhancedGridLayout.tsx` (lines 180-220)
- `frontend/components/EnhancedGridCanvas.tsx` (lines 300-340)

## Description

Both `EnhancedGridLayout` and `EnhancedGridCanvas` components register keyboard event handlers for arrow keys. When a user presses an arrow key, both handlers fire simultaneously, causing unexpected behavior such as items moving twice, focus jumping erratically, or the application becoming unresponsive.

## Current Broken Code

```tsx
// EnhancedGridLayout.tsx - Line 180-220
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!selectedItem) return;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        moveItem(selectedItem.id, { x: 0, y: -1 });
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveItem(selectedItem.id, { x: 0, y: 1 });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        moveItem(selectedItem.id, { x: -1, y: 0 });
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveItem(selectedItem.id, { x: 1, y: 0 });
        break;
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedItem, moveItem]);

// EnhancedGridCanvas.tsx - Line 300-340
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!focusedItem) return;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        // BUG: Also tries to handle arrow keys!
        nudgeItem(focusedItem.id, 'up');
        break;
      case 'ArrowDown':
        e.preventDefault();
        nudgeItem(focusedItem.id, 'down');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        nudgeItem(focusedItem.id, 'left');
        break;
      case 'ArrowRight':
        e.preventDefault();
        nudgeItem(focusedItem.id, 'right');
        break;
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [focusedItem, nudgeItem]);
```

## Bug Behavior

When user presses Arrow Right:
1. EnhancedGridLayout moves item right by 1 grid unit
2. EnhancedGridCanvas ALSO nudges item right by 1 unit
3. **Result**: Item moves 2 units instead of 1

```
Before:     After Expected:     After Actual (Bug):
┌──┬──┬──┐  ┌──┬──┬──┐         ┌──┬──┬──┐
│  │▓▓│  │  │  │  │▓▓│         │  │  │  │
└──┴──┴──┘  └──┴──┴──┘         └──┴──┴──┘
            (moved 1 right)      (moved 2 right!)
                              ▓▓ is now out of view
```

## Root Cause Analysis

1. **Event Bubbling**: Both components attach listeners to `window`, so both receive all events
2. **Missing Coordination**: No mechanism to determine which component should handle the event
3. **No Stop Propagation**: Neither handler checks if the event was already handled
4. **Parent-Child Conflict**: EnhancedGridLayout (parent) and EnhancedGridCanvas (child) don't communicate about focus state

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Broken Navigation | CRITICAL | Items move unpredictably |
| User Frustration | HIGH | Can't position items accurately |
| Accessibility | HIGH | Keyboard users cannot use the feature |
| Data Corruption | MEDIUM | Items can be moved out of bounds |

## Suggested Fix

### Option 1: Centralize Keyboard Handling in Parent (Recommended)

```tsx
// EnhancedGridLayout.tsx - Centralized handler
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Only handle if we're in the right mode
    if (!selectedItem || editMode !== 'keyboard') return;
    
    // Prevent duplicate handling
    if (e.defaultPrevented) return;
    
    const moves: Record<string, { x: number; y: number }> = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };
    
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      moveItem(selectedItem.id, move);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [selectedItem, editMode, moveItem]);

// EnhancedGridCanvas.tsx - Remove own handler
// Delete the useEffect that adds keyboard listeners
```

### Option 2: Use React Context for Coordination

```tsx
// contexts/KeyboardContext.tsx
interface KeyboardContextType {
  registerHandler: (id: string, handler: KeyboardHandler) => void;
  unregisterHandler: (id: string) => void;
  setActiveHandler: (id: string | null) => void;
}

const KeyboardContext = createContext<KeyboardContextType | null>(null);

export const KeyboardProvider: React.FC = ({ children }) => {
  const handlers = useRef<Map<string, KeyboardHandler>>(new Map());
  const activeHandler = useRef<string | null>(null);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeHandler.current) {
        const handler = handlers.current.get(activeHandler.current);
        handler?.(e);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const value = {
    registerHandler: (id, handler) => handlers.current.set(id, handler),
    unregisterHandler: (id) => handlers.current.delete(id),
    setActiveHandler: (id) => { activeHandler.current = id; },
  };
  
  return (
    <KeyboardContext.Provider value={value}>
      {children}
    </KeyboardContext.Provider>
  );
};

// EnhancedGridLayout.tsx
const { registerHandler, setActiveHandler } = useKeyboardContext();

useEffect(() => {
  const id = 'grid-layout';
  registerHandler(id, handleKeyDown);
  
  return () => {
    setActiveHandler(null);
    unregisterHandler(id);
  };
}, []);

// When focused:
setActiveHandler('grid-layout');
```

## Testing Strategy

```typescript
// keyboard-handlers.test.tsx
describe('Keyboard Navigation', () => {
  it('should move item exactly one unit with arrow key', async () => {
    const moveItem = jest.fn();
    render(<EnhancedGridLayout onMoveItem={moveItem} />);
    
    // Select an item
    await userEvent.click(screen.getByTestId('grid-item-1'));
    
    // Press arrow right
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    
    // Should only be called once
    expect(moveItem).toHaveBeenCalledTimes(1);
    expect(moveItem).toHaveBeenCalledWith('item-1', { x: 1, y: 0 });
  });
  
  it('should not trigger both handlers on same keypress', () => {
    const layoutHandler = jest.fn();
    const canvasHandler = jest.fn();
    
    render(
      <EnhancedGridLayout onKeyDown={layoutHandler}>
        <EnhancedGridCanvas onKeyDown={canvasHandler} />
      </EnhancedGridLayout>
    );
    
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    
    // Only one handler should fire
    const totalCalls = layoutHandler.mock.calls.length + 
                       canvasHandler.mock.calls.length;
    expect(totalCalls).toBe(1);
  });
});
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Remove duplicate handler from canvas | 1 hour |
| Centralize handling in layout component | 2 hours |
| Add proper focus/target checks | 1 hour |
| Comprehensive keyboard testing | 2 hours |
| **Total** | **6 hours** |

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.2.0
