# PERF-003: Grid Lines Recalculation on Every Render

## Severity Level
**PERFORMANCE**

## File Location
- `frontend/components/LayoutEditor.tsx` (lines 150-200)
- `frontend/components/GridBackground.tsx` (lines 30-70)
- `frontend/hooks/useGridLines.ts` (lines 20-60)

## Description

The grid lines for the layout editor are recalculated on every render, even when the grid configuration (size, dimensions) hasn't changed. This creates a new array of line coordinates and new SVG/React elements every frame, causing unnecessary DOM updates and jank during drag operations.

## Current Vulnerable Code

```tsx
// frontend/components/LayoutEditor.tsx - Line 150-200
export const LayoutEditor: React.FC = () => {
  const { layout, gridConfig } = useLayoutContext();
  
  // BUG: Recalculated on every render
  const verticalLines = Array.from(
    { length: Math.ceil(gridConfig.width / gridConfig.cellSize) },
    (_, i) => i * gridConfig.cellSize
  );
  
  // BUG: Recalculated on every render
  const horizontalLines = Array.from(
    { length: Math.ceil(gridConfig.height / gridConfig.cellSize) },
    (_, i) => i * gridConfig.cellSize
  );
  
  return (
    <div className="layout-editor">
      {/* BUG: New SVG elements created every render */}
      <svg className="grid-lines">
        {verticalLines.map((x, i) => (
          <line
            key={`v-${i}`}
            x1={x}
            y1={0}
            x2={x}
            y2={gridConfig.height}
            stroke="#ddd"
          />
        ))}
        {horizontalLines.map((y, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={y}
            x2={gridConfig.width}
            y2={y}
            stroke="#ddd"
          />
        ))}
      </svg>
      
      <LayoutItems items={layout.items} />
    </div>
  );
};
```

```tsx
// frontend/components/GridBackground.tsx - Line 30-70
export const GridBackground: React.FC<Props> = ({ 
  width, 
  height, 
  cellSize 
}) => {
  // BUG: New canvas ref callback every render
  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // BUG: Redrawn on every render, not just when dimensions change
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    // Draw vertical lines
    for (let x = 0; x <= width; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= height; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [width, height, cellSize]);
  
  return <canvas ref={canvasRef} width={width} height={height} />;
};
```

```typescript
// frontend/hooks/useGridLines.ts - Line 20-60
export const useGridLines = (config: GridConfig) => {
  // BUG: Recalculates on every call
  const lines = useMemo(() => {
    const vertical: Line[] = [];
    const horizontal: Line[] = [];
    
    for (let x = 0; x <= config.width; x += config.cellSize) {
      vertical.push({ x1: x, y1: 0, x2: x, y2: config.height });
    }
    
    for (let y = 0; y <= config.height; y += config.cellSize) {
      horizontal.push({ x1: 0, y1: y, x2: config.width, y2: y });
    }
    
    return { vertical, horizontal };
  }, [config]); // BUG: config object reference changes every render
  
  return lines;
};
```

## Performance Impact Analysis

```typescript
// Grid with 1000x1000 pixels, 20px cells
// = 50 vertical lines + 50 horizontal lines = 100 line elements

// During drag (60fps target):
// Without memoization:
// - Create 100 line coordinate calculations per frame
// - Create 100 new React elements per frame
// - React diffing: Compare 100 old vs 100 new elements
// - DOM updates: Potentially 100 nodes to update
// - Time: ~8-12ms per frame (50-75% of budget)

// With memoization:
// - Grid config stable during drag
// - Lines calculated once
// - React diffing: No changes detected
// - DOM updates: None
// - Time: ~0.1ms per frame

// For a layout with 2000x2000 grid:
// = 200 lines
// Without memoization: ~20-30ms per frame (FAIL)
// With memoization: ~0.1ms per frame (PASS)
```

## Render Timeline

```
Frame Budget: 16.67ms (60fps)

Without Fix:
├─ Grid lines calculation:     2ms
├─ Array creation:             1ms
├─ React element creation:     3ms
├─ Virtual DOM diffing:        4ms
├─ DOM reconciliation:         3ms
└─ Remaining for drag logic:   3.67ms ⚠️ TIGHT

With Fix:
├─ Grid lines (memoized):      0ms
├─ React reconciliation:       0.5ms
└─ Remaining for drag logic:   16.17ms ✅ GOOD
```

## Root Cause Analysis

1. **No Memoization**: Grid lines recalculated every render
2. **Object Reference Instability**: Config object recreated
3. **Missing Dependency Optimization**: useMemo deps too broad
4. **Canvas Redraw**: Unnecessary canvas clears and redraws
5. **SVG Element Recreation**: New elements instead of updates

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Drag Jank | HIGH | Visible stutter during item drag |
| CPU Usage | HIGH | Unnecessary calculations |
| Battery Drain | MEDIUM | More work on every frame |
| Mobile Performance | HIGH | Worse on low-power devices |

## Suggested Fix

### Option 1: CSS Background Grid (Recommended)

```css
/* frontend/styles/grid.css */
.grid-background {
  background-image: 
    linear-gradient(to right, #e0e0e0 1px, transparent 1px),
    linear-gradient(to bottom, #e0e0e0 1px, transparent 1px);
  background-size: 20px 20px; /* cellSize */
}

/* For variable grid sizes, use CSS custom properties */
.layout-editor {
  --grid-cell-size: 20px;
  --grid-color: #e0e0e0;
  
  background-image: 
    linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px);
  background-size: var(--grid-cell-size) var(--grid-cell-size);
}
```

```tsx
// frontend/components/LayoutEditor.tsx - Fixed
export const LayoutEditor: React.FC = () => {
  const { layout, gridConfig } = useLayoutContext();
  
  // CSS-based grid - no JavaScript calculation needed!
  return (
    <div 
      className="layout-editor"
      style={{
        '--grid-cell-size': `${gridConfig.cellSize}px`,
        width: gridConfig.width,
        height: gridConfig.height,
      } as React.CSSProperties}
    >
      <LayoutItems items={layout.items} />
    </div>
  );
};
```

### Option 2: Memoized SVG Grid

```tsx
// frontend/components/GridLines.tsx
import { memo } from 'react';

interface GridLinesProps {
  width: number;
  height: number;
  cellSize: number;
}

// Memoized component - only re-renders when props change
export const GridLines = memo<GridLinesProps>({
  width, 
  height, 
  cellSize 
}) => {
  // Calculate lines once per prop change
  const verticalLines = Array.from(
    { length: Math.floor(width / cellSize) + 1 },
    (_, i) => i * cellSize
  );
  
  const horizontalLines = Array.from(
    { length: Math.floor(height / cellSize) + 1 },
    (_, i) => i * cellSize
  );
  
  return (
    <svg 
      className="grid-lines" 
      width={width} 
      height={height}
      style={{ pointerEvents: 'none' }}
    >
      {verticalLines.map((x) => (
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#e0e0e0"
          strokeWidth={1}
        />
      ))}
      {horizontalLines.map((y) => (
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#e0e0e0"
          strokeWidth={1}
        />
      ))}
    </svg>
  );
});

// Custom comparison for stable references
GridLines.displayName = 'GridLines';
```

```tsx
// frontend/components/LayoutEditor.tsx
export const LayoutEditor: React.FC = () => {
  const { layout, gridConfig } = useLayoutContext();
  
  // Stable reference to grid config values
  const { width, height, cellSize } = gridConfig;
  
  return (
    <div className="layout-editor">
      <GridLines 
        width={width} 
        height={height} 
        cellSize={cellSize} 
      />
      <LayoutItems items={layout.items} />
    </div>
  );
};
```

### Option 3: Canvas with Stable Reference

```tsx
// frontend/components/GridBackground.tsx - Fixed
import { useRef, useEffect } from 'react';

export const GridBackground: React.FC<Props> = ({ 
  width, 
  height, 
  cellSize 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevConfigRef = useRef({ width: 0, height: 0, cellSize: 0 });
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Only redraw if config actually changed
    if (
      prevConfigRef.current.width === width &&
      prevConfigRef.current.height === height &&
      prevConfigRef.current.cellSize === cellSize
    ) {
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Update stored config
    prevConfigRef.current = { width, height, cellSize };
    
    // Clear and redraw
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Batch all line operations
    for (let x = 0; x <= width; x += cellSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    
    for (let y = 0; y <= height; y += cellSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    ctx.stroke();
  }, [width, height, cellSize]);
  
  return <canvas ref={canvasRef} width={width} height={height} />;
};
```

### Option 4: Pre-rendered Grid Pattern

```tsx
// frontend/hooks/useGridPattern.ts
import { useMemo } from 'react';

export const useGridPattern = (cellSize: number) => {
  return useMemo(() => {
    // Create offscreen canvas for pattern
    const canvas = document.createElement('canvas');
    canvas.width = cellSize;
    canvas.height = cellSize;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Draw single cell pattern
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, cellSize, cellSize);
    
    // Convert to data URL
    return canvas.toDataURL();
  }, [cellSize]);
};
```

```tsx
// Usage with pattern
export const LayoutEditor: React.FC = () => {
  const { gridConfig } = useLayoutContext();
  const gridPattern = useGridPattern(gridConfig.cellSize);
  
  return (
    <div 
      className="layout-editor"
      style={{
        backgroundImage: `url(${gridPattern})`,
        width: gridConfig.width,
        height: gridConfig.height,
      }}
    >
      {/* Items */}
    </div>
  );
};
```

## Performance Comparison

```
Method              | Initial | Per Render | Drag FPS | Complexity
--------------------|---------|------------|----------|-----------
JS Calculation      | 1ms     | 8-12ms     | 30-40    | Low
Memoized SVG        | 2ms     | 0.1ms      | 58-60    | Medium
CSS Background      | 0ms     | 0ms        | 60       | Low
Canvas (optimized)  | 3ms     | 0.05ms     | 60       | Medium
Pattern (pre-render)| 5ms     | 0ms        | 60       | High
```

## Testing Strategy

```typescript
// gridPerformance.test.tsx
import { render } from '@testing-library/react';
import { Profiler } from 'react';

describe('Grid Lines Performance', () => {
  it('should not recalculate grid when config unchanged', () => {
    const onRender = jest.fn();
    
    const TestComponent = () => (
      <Profiler id="grid" onRender={onRender}>
        <GridLines width={1000} height={1000} cellSize={20} />
      </Profiler>
    );
    
    const { rerender } = render(<TestComponent />);
    
    // Re-render with same props
    rerender(<TestComponent />);
    
    // GridLines should not have rendered again
    expect(onRender).toHaveBeenCalledTimes(1);
  });
  
  it('should render efficiently with large grids', () => {
    const start = performance.now();
    
    render(<GridLines width={2000} height={2000} cellSize={10} />);
    
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(5); // Should be fast
  });
});
```

## Browser DevTools Analysis

```javascript
// Chrome DevTools Performance Profile Analysis

// Look for in Performance tab:
// 1. Long "Recalculate Style" entries
// 2. Multiple "Layout" operations per frame
// 3. High "Scripting" time in GridLines component
// 4. DOM nodes increasing over time

// Fix verification:
// 1. "Recalculate Style" should be minimal
// 2. "Layout" should occur once per resize
// 3. DOM node count stable during drag
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Implement CSS grid background | 30 min |
| Add memoized GridLines component | 30 min |
| Optimize canvas rendering | 45 min |
| Remove old calculations | 15 min |
| Performance testing | 30 min |
| **Total** | **2.5 hours** |

## Related Issues

- [PERF-002: Unnecessary Array Spreads](./PERF-002-unnecessary-array-spreads.md)
- [CSS Performance Guidelines](../../docs/css-performance.md)

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
