# BUG-006: Hardcoded Grid Height Value

## Severity Level
**HIGH**

## File Location
- `frontend/components/EnhancedGridCanvas.tsx` (lines 75-90)
- `frontend/components/EnhancedGridLayout.tsx` (lines 45-60)
- `frontend/hooks/useGridCalculations.ts` (lines 30-50)

## Description

The grid height is hardcoded to `128px` throughout the codebase instead of using the configurable `gridSize.height` value. This makes it impossible for users to customize the grid row height and causes layout inconsistencies when the configured size differs from the hardcoded value.

## Current Broken Code

```tsx
// EnhancedGridCanvas.tsx - Line 75-90
const calculateGridPosition = (pixelY: number) => {
  // BUG: Hardcoded 128 instead of using gridSize.height
  const row = Math.floor(pixelY / 128);
  return row + 1;  // 1-indexed
};

// EnhancedGridLayout.tsx - Line 45-60
const calculateItemHeight = (gridRowSpan: number) => {
  // BUG: Using hardcoded 128px
  return gridRowSpan * 128;
};

// useGridCalculations.ts - Line 30-50
export const useGridCalculations = () => {
  const { gridSize } = useGridContext();
  
  const getTotalHeight = (rows: number) => {
    // BUG: Ignores gridSize.height, uses hardcoded value
    return rows * 128 + (rows - 1) * GRID_GAP;
  };
  
  const snapToGrid = (y: number) => {
    // BUG: Uses hardcoded 128
    const row = Math.round(y / 128);
    return row * 128;
  };
  
  return { getTotalHeight, snapToGrid };
};
```

## Configuration vs Reality

```typescript
// User configures grid size:
const gridConfig = {
  width: 100,   // Used correctly
  height: 80,   // IGNORED - hardcoded 128 used instead!
};

// Expected behavior with 80px height:
// Row 1: 0-80px
// Row 2: 80-160px

// Actual behavior with hardcoded 128px:
// Row 1: 0-128px  ← Wrong!
// Row 2: 128-256px ← Wrong!
```

## Root Cause Analysis

1. **Magic Numbers**: Developers used literal `128` values instead of referencing the configuration
2. **Missing Constants**: No shared constant or utility function for grid calculations
3. **Inconsistent Refactoring**: Grid width uses proper configuration, but height was missed
4. **No Linting Rule**: No ESLint rule to catch magic numbers

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Broken Customization | HIGH | Grid height setting has no effect |
| Layout Misalignment | HIGH | Items don't align to actual grid lines |
| Visual Inconsistency | MEDIUM | Grid lines and items don't match |
| Maintenance Burden | MEDIUM | Must update multiple locations |

## Suggested Fix

### Option 1: Use Grid Size from Context (Recommended)

```tsx
// EnhancedGridCanvas.tsx - Fixed
const calculateGridPosition = (pixelY: number) => {
  const { gridSize } = useGridContext();
  // Use configurable gridSize.height
  const row = Math.floor(pixelY / gridSize.height);
  return row + 1;
};

// EnhancedGridLayout.tsx - Fixed
const calculateItemHeight = (gridRowSpan: number) => {
  const { gridSize } = useGridContext();
  return gridRowSpan * gridSize.height;
};

// useGridCalculations.ts - Fixed
export const useGridCalculations = () => {
  const { gridSize } = useGridContext();
  
  const getTotalHeight = (rows: number) => {
    return rows * gridSize.height + (rows - 1) * GRID_GAP;
  };
  
  const snapToGrid = (y: number) => {
    const row = Math.round(y / gridSize.height);
    return row * gridSize.height;
  };
  
  return { getTotalHeight, snapToGrid };
};
```

### Option 2: Create Utility Functions

```typescript
// utils/gridCalculations.ts
import { useGridContext } from '../contexts/GridContext';

export const useGridUtils = () => {
  const { gridSize } = useGridContext();
  
  return {
    // Convert pixels to grid row
    pixelToRow: (pixelY: number): number => {
      return Math.floor(pixelY / gridSize.height) + 1;
    },
    
    // Convert grid row to pixels
    rowToPixel: (row: number): number => {
      return (row - 1) * gridSize.height;
    },
    
    // Calculate item height from span
    spanToHeight: (span: number): number => {
      return span * gridSize.height;
    },
    
    // Snap Y coordinate to grid
    snapY: (y: number): number => {
      const row = Math.round(y / gridSize.height);
      return row * gridSize.height;
    },
    
    // Calculate total grid height
    getTotalHeight: (rows: number, gap: number = 0): number => {
      return rows * gridSize.height + (rows - 1) * gap;
    },
  };
};

// Usage in components
const { pixelToRow, spanToHeight } = useGridUtils();
const row = pixelToRow(mouseY);
const height = spanToHeight(item.gridRowSpan);
```

### Option 3: Add ESLint Rule

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=128]',
        message: 'Use gridSize.height instead of hardcoded 128. Import from GridContext.',
      },
    ],
  },
};
```

## Testing Strategy

```typescript
// grid-calculations.test.ts
describe('Grid Calculations', () => {
  const mockGridSize = { width: 100, height: 80 };
  
  it('should use configurable grid height', () => {
    const { result } = renderHook(() => useGridUtils(), {
      wrapper: ({ children }) => (
        <GridContext.Provider value={{ gridSize: mockGridSize }}>
          {children}
        </GridContext.Provider>
      ),
    });
    
    // At 80px, should be row 1 (0-indexed: 0, 1-indexed: 1)
    expect(result.current.pixelToRow(80)).toBe(2);
    
    // Height for 2 rows should be 160px
    expect(result.current.spanToHeight(2)).toBe(160);
    
    // Should NOT be using hardcoded 128
    expect(result.current.spanToHeight(2)).not.toBe(256);
  });
  
  it('should respond to grid size changes', () => {
    const { result, rerender } = renderHook(() => useGridUtils(), {
      wrapper: ({ children }) => (
        <GridContext.Provider value={{ gridSize: mockGridSize }}>
          {children}
        </GridContext.Provider>
      ),
    });
    
    expect(result.current.spanToHeight(2)).toBe(160);
    
    // Change grid size
    mockGridSize.height = 100;
    rerender();
    
    expect(result.current.spanToHeight(2)).toBe(200);
  });
});
```

## Migration Script

```bash
# Find all hardcoded 128 values related to grid height
grep -r "128" --include="*.tsx" --include="*.ts" frontend/ | grep -i "height\|row\|grid"

# Replace with gridSize.height (after manual review)
# Use sed or similar tool for bulk replacement
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Find all hardcoded 128 instances | 1 hour |
| Create utility functions | 2 hours |
| Update all components | 2 hours |
| Add ESLint rule | 30 min |
| Testing | 2 hours |
| **Total** | **7.5 hours (1 day)** |

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
