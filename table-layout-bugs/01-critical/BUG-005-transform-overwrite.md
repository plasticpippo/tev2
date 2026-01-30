# BUG-005: Transform Overwrite on Resize

## Severity Level
**CRITICAL**

## File Location
- `frontend/components/EnhancedGridItem.tsx` (lines 85-110)
- `frontend/hooks/useResize.ts` (lines 40-65)

## Description

When a user drags an item to a new position and then resizes it, the resize transform overwrites the drag transform in CSS. This causes the item to visually "snap back" to its original position while being resized, creating a confusing user experience.

## Current Broken Code

```tsx
// EnhancedGridItem.tsx - Line 85-110
const EnhancedGridItem: React.FC<Props> = ({ item, isDragging, isResizing }) => {
  const dragTransform = useDrag(item);  // Returns { x: 100, y: 50 }
  const resizeTransform = useResize(item);  // Returns { width: 200, height: 150 }
  
  return (
    <div
      className="grid-item"
      style={{
        // BUG: These transforms overwrite each other!
        transform: isDragging 
          ? `translate(${dragTransform.x}px, ${dragTransform.y}px)` 
          : undefined,
        transform: isResizing  // ← This overwrites the previous transform!
          ? `scale(${resizeTransform.scaleX}, ${resizeTransform.scaleY})`
          : undefined,
      }}
    >
      {item.content}
    </div>
  );
};

// useResize.ts - Line 40-65
export const useResize = (item: GridItem) => {
  const [transform, setTransform] = useState({ 
    scaleX: 1, 
    scaleY: 1 
  });
  
  useEffect(() => {
    if (isResizing) {
      // Calculates scale based on current size vs original
      setTransform({
        scaleX: currentWidth / originalWidth,
        scaleY: currentHeight / originalHeight,
      });
    }
  }, [currentWidth, currentHeight, isResizing]);
  
  return transform;
};
```

## Bug Behavior

```
Step 1: Item at original position    Step 2: User drags to new position
┌─────────┐                         
│  Item   │                           ╔═════════╗
└─────────┘                           ║  Item   ║  ← Dragged here
                                      ╚═════════╝
                                      (transform: translate(100px, 50px))

Step 3: User starts resizing         Step 4: BUG - Item snaps back!
╔═════════╗                         ┌─────────┐
║  Item   ║ ←╮                       │  Item   │ ← Now here (wrong!)
╚═════════╝  │ resizing              └─────────┘
             │                       transform was OVERWRITTEN
                                     with scale() only
```

## Root Cause Analysis

1. **CSS Transform Overwrite**: The `style` object has `transform` defined twice - the second one completely replaces the first
2. **No Transform Composition**: The code doesn't combine translate and scale transforms
3. **State Separation**: Drag and resize states are managed separately without coordination

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Broken UX | CRITICAL | Items appear to jump around during resize |
| User Confusion | HIGH | Users can't predict where item will end up |
| Layout Corruption | HIGH | Visual position doesn't match actual position |
| Accessibility | MEDIUM | Motion sickness from unexpected jumps |

## Suggested Fix

### Option 1: Combine Transforms (Recommended)

```tsx
// EnhancedGridItem.tsx - Fixed
const EnhancedGridItem: React.FC<Props> = ({ item, isDragging, isResizing }) => {
  const dragTransform = useDrag(item);
  const resizeTransform = useResize(item);
  
  // Combine transforms into a single string
  const getTransform = () => {
    const transforms: string[] = [];
    
    if (isDragging) {
      transforms.push(`translate(${dragTransform.x}px, ${dragTransform.y}px)`);
    }
    
    if (isResizing) {
      transforms.push(`scale(${resizeTransform.scaleX}, ${resizeTransform.scaleY})`);
    }
    
    return transforms.length > 0 ? transforms.join(' ') : undefined;
  };
  
  return (
    <div
      className="grid-item"
      style={{
        transform: getTransform(),  // Single combined transform
      }}
    >
      {item.content}
    </div>
  );
};
```

### Option 2: Use CSS Custom Properties

```tsx
// EnhancedGridItem.tsx - Using CSS variables
const EnhancedGridItem: React.FC<Props> = ({ item, isDragging, isResizing }) => {
  const dragTransform = useDrag(item);
  const resizeTransform = useResize(item);
  
  return (
    <div
      className="grid-item"
      style={{
        '--translate-x': isDragging ? `${dragTransform.x}px` : '0px',
        '--translate-y': isDragging ? `${dragTransform.y}px` : '0px',
        '--scale-x': isResizing ? resizeTransform.scaleX : 1,
        '--scale-y': isResizing ? resizeTransform.scaleY : 1,
      } as React.CSSProperties}
    >
      {item.content}
    </div>
  );
};

// CSS
.grid-item {
  transform: 
    translate(var(--translate-x, 0px), var(--translate-y, 0px))
    scale(var(--scale-x, 1), var(--scale-y, 1));
  transition: transform 0.1s ease-out;
}
```

## Testing Strategy

```typescript
// transform-behavior.test.tsx
describe('Drag and Resize Transforms', () => {
  it('should maintain position when resizing after drag', () => {
    const { container } = render(<EnhancedGridItem item={testItem} />);
    const item = container.firstChild as HTMLElement;
    
    // Simulate drag
    fireEvent.mouseDown(item);
    fireEvent.mouseMove(window, { clientX: 100, clientY: 50 });
    fireEvent.mouseUp(window);
    
    // Start resize
    const resizeHandle = screen.getByTestId('resize-handle');
    fireEvent.mouseDown(resizeHandle);
    fireEvent.mouseMove(window, { clientX: 150, clientY: 100 });
    
    // Get transform
    const transform = item.style.transform;
    
    // Should contain BOTH translate and scale
    expect(transform).toMatch(/translate/);
    expect(transform).toMatch(/scale/);
    
    // Should not have overwritten (only one transform type)
    const transformCount = (transform.match(/transform/g) || []).length;
    expect(transformCount).toBeLessThanOrEqual(1);  // Single transform property
  });
});
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Combine transform logic | 2 hours |
| Test all interaction combinations | 2 hours |
| Verify cross-browser compatibility | 1 hour |
| Update tests | 1 hour |
| **Total** | **6 hours** |

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.2.0
