# BUG-008: Missing useMemo Dependencies

## Severity Level
**HIGH**

## File Location
- `frontend/components/EnhancedGridCanvas.tsx` (lines 180-210)
- `frontend/components/GridLines.tsx` (lines 25-45)

## Description

The `gridLines` useMemo hook is missing `gridSize.height` from its dependency array. This causes the grid lines to not recalculate when the grid height configuration changes, leading to visual misalignment between the grid lines and the actual grid cells.

## Current Broken Code

```tsx
// EnhancedGridCanvas.tsx - Line 180-210
const EnhancedGridCanvas: React.FC<Props> = ({ gridSize, tables }) => {
  // BUG: Missing gridSize.height in dependencies!
  const gridLines = useMemo(() => {
    const lines = [];
    const maxRow = Math.max(...tables.map(t => t.gridRow + (t.gridRowSpan || 1) - 1), 10);
    
    for (let row = 1; row <= maxRow; row++) {
      lines.push({
        type: 'horizontal',
        position: row * gridSize.height,  // Uses height here
        row,
      });
    }
    
    return lines;
  }, [tables, gridSize.width]);  // ← gridSize.height is MISSING!
  
  return (
    <div className="grid-canvas">
      {gridLines.map(line => (
        <div
          key={`h-${line.row}`}
          className="grid-line horizontal"
          style={{ top: line.position }}
        />
      ))}
    </div>
  );
};

// GridLines.tsx - Line 25-45
const GridLines: React.FC<GridLinesProps> = ({ 
  rows, 
  columns, 
  gridSize 
}) => {
  // BUG: Missing gridSize dependency entirely
  const horizontalLines = useMemo(() => {
    return Array.from({ length: rows + 1 }, (_, i) => ({
      top: i * gridSize.height,
      left: 0,
      width: '100%',
    }));
  }, [rows]);  // ← gridSize completely missing!
  
  const verticalLines = useMemo(() => {
    return Array.from({ length: columns + 1 }, (_, i) => ({
      left: i * gridSize.width,
      top: 0,
      height: '100%',
    }));
  }, [columns]);  // ← gridSize completely missing!
  
  return (
    <svg className="grid-lines">
      {/* Render lines */}
    </svg>
  );
};
```

## Bug Behavior

```
Initial state (gridSize.height = 80px):
├─────────────────┤ ← Line at 0px
│   Row 1         │
├─────────────────┤ ← Line at 80px
│   Row 2         │
├─────────────────┤ ← Line at 160px

After changing gridSize.height to 100px:
├─────────────────┤ ← Line still at 80px (WRONG!)
│   Row 1         │   (now 100px tall)
│                 │
├─────────────────┤ ← Line still at 160px (WRONG!)
│   Row 2         │

Lines don't match actual cell positions!
```

## Root Cause Analysis

1. **Incomplete Dependency Array**: Developer remembered `gridSize.width` but forgot `gridSize.height`
2. **No ESLint Rule**: Missing or disabled `react-hooks/exhaustive-deps` rule
3. **Object Destructuring Confusion**: Might have destructured incorrectly, missing nested properties

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Visual Misalignment | HIGH | Grid lines don't match actual cells |
| User Confusion | HIGH | Items appear between grid lines |
| Broken Customization | HIGH | Grid height setting appears broken |
| Code Quality | MEDIUM | Pattern may exist elsewhere |

## Suggested Fix

### Option 1: Add Missing Dependencies (Immediate Fix)

```tsx
// EnhancedGridCanvas.tsx - Fixed
const gridLines = useMemo(() => {
  const lines = [];
  const maxRow = Math.max(...tables.map(t => t.gridRow + (t.gridRowSpan || 1) - 1), 10);
  
  for (let row = 1; row <= maxRow; row++) {
    lines.push({
      type: 'horizontal',
      position: row * gridSize.height,
      row,
    });
  }
  
  return lines;
  // FIXED: Added gridSize.height to dependencies
}, [tables, gridSize.width, gridSize.height]);

// Or more concisely:
}, [tables, gridSize]);  // Use entire object (if stable reference)
```

```tsx
// GridLines.tsx - Fixed
const horizontalLines = useMemo(() => {
  return Array.from({ length: rows + 1 }, (_, i) => ({
    top: i * gridSize.height,
    left: 0,
    width: '100%',
  }));
  // FIXED: Added gridSize
}, [rows, gridSize]);

const verticalLines = useMemo(() => {
  return Array.from({ length: columns + 1 }, (_, i) => ({
    left: i * gridSize.width,
    top: 0,
    height: '100%',
  }));
  // FIXED: Added gridSize
}, [columns, gridSize]);
```

### Option 2: Destructure for Clarity

```tsx
// EnhancedGridCanvas.tsx - Better approach
const EnhancedGridCanvas: React.FC<Props> = ({ gridSize, tables }) => {
  // Destructure for clear dependency tracking
  const { width: gridWidth, height: gridHeight } = gridSize;
  
  const gridLines = useMemo(() => {
    const lines = [];
    const maxRow = Math.max(
      ...tables.map(t => t.gridRow + (t.gridRowSpan || 1) - 1), 
      10
    );
    
    for (let row = 1; row <= maxRow; row++) {
      lines.push({
        type: 'horizontal',
        position: row * gridHeight,  // Now uses local variable
        row,
      });
    }
    
    return lines;
    // Clear dependencies using destructured values
  }, [tables, gridWidth, gridHeight]);
  
  // ... rest of component
};
```

### Option 3: Custom Hook for Grid Lines

```tsx
// hooks/useGridLines.ts
import { useMemo } from 'react';

interface UseGridLinesOptions {
  tables: Table[];
  gridSize: { width: number; height: number };
  minRows?: number;
}

export const useGridLines = ({ tables, gridSize, minRows = 10 }: UseGridLinesOptions) => {
  return useMemo(() => {
    const maxRow = Math.max(
      ...tables.map(t => t.gridRow + (t.gridRowSpan || 1) - 1),
      minRows
    );
    
    const horizontalLines = [];
    for (let row = 0; row <= maxRow; row++) {
      horizontalLines.push({
        top: row * gridSize.height,
        row,
      });
    }
    
    const maxCol = Math.max(
      ...tables.map(t => t.gridColumn + (t.gridColumnSpan || 1) - 1),
      minRows
    );
    
    const verticalLines = [];
    for (let col = 0; col <= maxCol; col++) {
      verticalLines.push({
        left: col * gridSize.width,
        col,
      });
    }
    
    return { horizontalLines, verticalLines, maxRow, maxCol };
  }, [tables, gridSize, minRows]);  // All dependencies explicit
};

// Usage in component
const { horizontalLines, verticalLines } = useGridLines({ tables, gridSize });
```

## ESLint Configuration

```javascript
// .eslintrc.js - Ensure this rule is enabled
module.exports = {
  rules: {
    'react-hooks/exhaustive-deps': ['error', {
      // Optional: Add any exceptions here
      additionalHooks: '(useRecoilCallback|useRecoilTransaction_UNSTABLE)',
    }],
  },
};
```

## Testing Strategy

```typescript
// grid-lines.test.tsx
describe('Grid Lines', () => {
  it('should recalculate when grid height changes', () => {
    const { rerender, container } = render(
      <EnhancedGridCanvas 
        gridSize={{ width: 100, height: 80 }} 
        tables={mockTables}
      />
    );
    
    const linesAt80 = container.querySelectorAll('.grid-line');
    const positionsAt80 = Array.from(linesAt80).map(line => 
      parseInt(line.style.top, 10)
    );
    
    // Change grid height
    rerender(
      <EnhancedGridCanvas 
        gridSize={{ width: 100, height: 100 }} 
        tables={mockTables}
      />
    );
    
    const linesAt100 = container.querySelectorAll('.grid-line');
    const positionsAt100 = Array.from(linesAt100).map(line => 
      parseInt(line.style.top, 10)
    );
    
    // Positions should have changed
    expect(positionsAt100).not.toEqual(positionsAt80);
    
    // Verify new positions are correct
    expect(positionsAt100[1]).toBe(100);  // First line at 100px
    expect(positionsAt100[2]).toBe(200);  // Second line at 200px
  });
  
  it('should use correct dependencies in useMemo', () => {
    // Spy on useMemo to verify dependencies
    const useMemoSpy = jest.spyOn(React, 'useMemo');
    
    render(
      <EnhancedGridCanvas 
        gridSize={{ width: 100, height: 80 }} 
        tables={mockTables}
      />
    );
    
    // Find the useMemo call for gridLines
    const gridLinesMemo = useMemoSpy.mock.calls.find(
      call => call[1]?.includes('gridSize') || call[1]?.includes('tables')
    );
    
    expect(gridLinesMemo?.[1]).toContainEqual(expect.objectContaining({
      height: expect.any(Number),
      width: expect.any(Number),
    }));
    
    useMemoSpy.mockRestore();
  });
});
```

## Regression Testing Checklist

- [ ] Grid lines recalculate when `gridSize.height` changes
- [ ] Grid lines recalculate when `gridSize.width` changes
- [ ] Grid lines recalculate when tables are added/removed
- [ ] Grid lines recalculate when table positions change
- [ ] Performance remains acceptable with many tables

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Add missing dependencies | 30 min |
| Verify ESLint rules are enabled | 15 min |
| Create custom hook (optional) | 1 hour |
| Write tests | 1 hour |
| **Total** | **2.75 hours** |

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
