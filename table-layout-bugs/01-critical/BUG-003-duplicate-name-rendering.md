# BUG-003: Duplicate Product Name Rendering

## Severity Level
**CRITICAL**

## File Location
- `frontend/components/EnhancedGridCanvas.tsx` (line 407)
- `frontend/components/EnhancedGridItem.tsx` (lines 120-135)

## Description

The product name is being rendered twice in the grid canvas - once by the parent `EnhancedGridCanvas` component and once by the child `EnhancedGridItem` component. This causes visual duplication where users see overlapping or repeated text.

## Current Broken Code

```tsx
// EnhancedGridCanvas.tsx - Line 400-415
const renderGridItem = (item: GridItem) => {
  return (
    <div 
      key={item.id}
      className="grid-item"
      style={{
        gridColumn: item.gridColumn,
        gridRow: item.gridRow,
      }}
    >
      {/* First render of product name */}
      <span className="product-name">{item.product.name}</span>
      
      {/* Child component renders name again! */}
      <EnhancedGridItem 
        item={item}
        showName={true}  // This causes duplicate rendering
      />
    </div>
  );
};

// EnhancedGridItem.tsx - Line 120-135
export const EnhancedGridItem: React.FC<EnhancedGridItemProps> = ({ 
  item, 
  showName 
}) => {
  return (
    <div className="grid-item-content">
      {showName && (
        // Second render of the same product name
        <div className="item-name">{item.product.name}</div>
      )}
      <div className="item-price">${item.product.price}</div>
    </div>
  );
};
```

## Visual Impact

```
┌─────────────────┐
│   Product Name  │  ← Rendered by EnhancedGridCanvas
│   Product Name  │  ← Rendered by EnhancedGridItem (DUPLICATE!)
│     $19.99      │
└─────────────────┘
```

## Root Cause Analysis

1. **Double Responsibility**: Both parent and child components are responsible for rendering the name
2. **Confusing Props**: The `showName` prop in `EnhancedGridItem` suggests it can optionally render the name, but it's always `true`
3. **Legacy Code**: One of the renders is likely leftover from a refactoring that wasn't completed

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Visual Glitch | HIGH | Duplicate text looks unprofessional |
| Layout Issues | HIGH | Extra text can push content out of bounds |
| Performance | MEDIUM | Unnecessary rendering operations |
| Accessibility | MEDIUM | Screen readers announce twice |

## Suggested Fix

### Option 1: Remove Duplicate from Parent (Recommended)

```tsx
// EnhancedGridCanvas.tsx - Fixed
const renderGridItem = (item: GridItem) => {
  return (
    <div 
      key={item.id}
      className="grid-item"
      style={{
        gridColumn: item.gridColumn,
        gridRow: item.gridRow,
      }}
    >
      {/* REMOVED: Parent no longer renders name */}
      
      {/* Child component handles all rendering */}
      <EnhancedGridItem 
        item={item}
        showName={true}
      />
    </div>
  );
};
```

### Option 2: Remove Rendering from Child

```tsx
// EnhancedGridItem.tsx - Fixed
export const EnhancedGridItem: React.FC<EnhancedGridItemProps> = ({ 
  item,
  showName  // Remove or deprecate this prop
}) => {
  return (
    <div className="grid-item-content">
      {/* REMOVED: Child no longer renders name */}
      <div className="item-price">${item.product.price}</div>
    </div>
  );
};

// EnhancedGridCanvas.tsx - Parent handles name
const renderGridItem = (item: GridItem) => {
  return (
    <div className="grid-item">
      <span className="product-name">{item.product.name}</span>
      <EnhancedGridItem item={item} />
    </div>
  );
};
```

### Option 3: Conditional Rendering Based on Layout Mode

```tsx
// EnhancedGridCanvas.tsx - Context-aware rendering
const renderGridItem = (item: GridItem, mode: 'compact' | 'full') => {
  const showNameInParent = mode === 'compact';
  
  return (
    <div className="grid-item">
      {showNameInParent && (
        <span className="product-name">{item.product.name}</span>
      )}
      <EnhancedGridItem 
        item={item}
        showName={!showNameInParent}  // Only one renders the name
      />
    </div>
  );
};
```

## CSS Fix for Immediate Relief

If a quick fix is needed before code changes:

```css
/* Hide duplicate name in grid items */
.grid-item .product-name + .grid-item-content .item-name {
  display: none;
}

/* Or using :nth-of-type */
.grid-item .product-name:nth-of-type(2) {
  display: none;
}
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Identify all duplicate rendering locations | 30 min |
| Remove duplicate from parent or child | 1 hour |
| Update component interfaces if needed | 30 min |
| Test all grid display modes | 1 hour |
| **Total** | **3 hours** |

## Testing Strategy

```typescript
// EnhancedGridCanvas.test.tsx
import { render, screen } from '@testing-library/react';
import { EnhancedGridCanvas } from './EnhancedGridCanvas';

describe('EnhancedGridCanvas', () => {
  it('should render product name only once per item', () => {
    const items = [
      {
        id: '1',
        product: { name: 'Test Product', price: 19.99 },
        gridColumn: 1,
        gridRow: 1,
      }
    ];
    
    render(<EnhancedGridCanvas items={items} />);
    
    const names = screen.getAllByText('Test Product');
    expect(names).toHaveLength(1);  // Should only appear once
  });
  
  it('should handle items without names gracefully', () => {
    const items = [
      {
        id: '1',
        product: { name: '', price: 19.99 },
        gridColumn: 1,
        gridRow: 1,
      }
    ];
    
    render(<EnhancedGridCanvas items={items} />);
    
    // Should not crash, should not render empty name elements
    const container = screen.getByTestId('grid-canvas');
    expect(container).toBeInTheDocument();
  });
});
```

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.2.0
