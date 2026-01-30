# BUG-019: Text Overflow in Layout Components

## Severity Level
**LOW**

## File Location
- `frontend/components/DraggableProductButton.tsx` (lines 60-100)
- `frontend/components/LayoutGrid.tsx` (lines 40-80)
- `frontend/components/LayoutList.tsx` (lines 55-90)

## Description

Product names and layout labels are not properly constrained within their containers, causing text overflow issues. Long product names break the grid layout, overlap adjacent elements, or are clipped without indication. This creates a poor visual experience and can make the interface unusable with real-world data.

## Current Vulnerable Code

```tsx
// frontend/components/DraggableProductButton.tsx - Line 60-100
export const DraggableProductButton: React.FC<Props> = ({
  product,
  position,
}) => {
  return (
    <Draggable position={{ x: position.x, y: position.y }}>
      <button
        style={{
          position: 'absolute',
          width: position.width,
          height: position.height,
          // BUG: No text overflow handling
          fontSize: '14px',
          padding: '8px',
        }}
      >
        {/* BUG: Raw product name without constraints */}
        {product.name}
      </button>
    </Draggable>
  );
};
```

```tsx
// frontend/components/LayoutGrid.tsx - Line 40-80
export const LayoutGrid: React.FC<Props> = ({ layouts }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {layouts.map((layout) => (
        <div key={layout.id} className="border p-4 rounded">
          {/* BUG: No text truncation on title */}
          <h3 className="text-lg font-bold">
            {layout.name}
          </h3>
          
          {/* BUG: Description can overflow */}
          <p className="text-gray-600 mt-2">
            {layout.description}
          </p>
          
          {/* BUG: Item count with long text */}
          <div className="mt-2">
            {layout.items.length} items in this layout configuration
          </div>
        </div>
      ))}
    </div>
  );
};
```

```tsx
// frontend/components/LayoutList.tsx - Line 55-90
export const LayoutList: React.FC<Props> = ({ layouts }) => {
  return (
    <ul className="divide-y">
      {layouts.map((layout) => (
        <li key={layout.id} className="py-3 flex justify-between">
          <div className="flex-1">
            {/* BUG: Flex child can expand beyond container */}
            <span className="font-medium">{layout.name}</span>
            
            {/* BUG: Metadata can push other content */}
            <span className="ml-2 text-sm text-gray-500">
              {layout.createdAt.toLocaleDateString()} by {layout.createdBy}
            </span>
          </div>
          
          {/* BUG: Actions can be pushed off-screen */}
          <div className="flex space-x-2">
            <button>Edit</button>
            <button>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
};
```

## Overflow Scenarios

```css
/* What happens with long text: */

/* Scenario 1: Product name overflow */
.product-button {
  width: 100px;
  height: 60px;
  /* No overflow control */
}
/* 
  Product name: "Super Premium Organic Fair Trade Dark Chocolate Espresso Beans"
  Result: Text extends beyond button, overlaps adjacent buttons
*/

/* Scenario 2: Grid card expansion */
.grid-card {
  /* No max-width or overflow */
}
/*
  Layout name: "Winter Holiday Season 2024 Special Promotional Display Configuration"
  Result: Card expands, breaks grid alignment
*/

/* Scenario 3: List item push */
.list-item {
  display: flex;
}
.list-item-text {
  /* No text truncation */
}
/*
  Long name + long description pushes action buttons off visible area
  User can't access Edit/Delete buttons
*/
```

## Root Cause Analysis

1. **No Text Constraints**: Missing CSS overflow properties
2. **Dynamic Content Ignored**: Design doesn't account for real data lengths
3. **No Truncation Strategy**: No ellipsis or fade-out effects
4. **Missing Tooltips**: Truncated text has no hover reveal
5. **Container Flexibility**: Layout containers expand instead of constraining

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Visual Breakage | LOW | Layouts break with long text |
| Usability | LOW | Buttons/text become inaccessible |
| Mobile Experience | LOW | Worse on small screens |
| Professionalism | LOW | Appears unpolished |

## Suggested Fix

### Option 1: CSS Text Overflow Utilities (Recommended)

```css
/* frontend/styles/text-overflow.css */

/* Base truncation utility */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Multi-line truncation */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Fixed width truncation */
.truncate-fixed {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* Break long words */
.break-words {
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

/* Container that prevents expansion */
.min-w-0 {
  min-width: 0;
}
```

```tsx
// frontend/components/DraggableProductButton.tsx - Fixed
import '../../styles/text-overflow.css';

export const DraggableProductButton: React.FC<Props> = ({
  product,
  position,
}) => {
  return (
    <Draggable position={{ x: position.x, y: position.y }}>
      <button
        className="product-button truncate"
        style={{
          position: 'absolute',
          width: position.width,
          height: position.height,
          fontSize: '14px',
          padding: '8px',
          // Ensure content doesn't overflow
          overflow: 'hidden',
          textAlign: 'left',
        }}
        title={product.name} /* Tooltip for full text */
      >
        {product.name}
      </button>
    </Draggable>
  );
};
```

```tsx
// frontend/components/LayoutGrid.tsx - Fixed
export const LayoutGrid: React.FC<Props> = ({ layouts }) => {
  return (
    <div className="grid grid-cols-3 gap-4">
      {layouts.map((layout) => (
        <div key={layout.id} className="border p-4 rounded min-w-0">
          {/* Truncated title with tooltip */}
          <h3 
            className="text-lg font-bold truncate" 
            title={layout.name}
          >
            {layout.name}
          </h3>
          
          {/* Multi-line clamped description */}
          <p className="text-gray-600 mt-2 line-clamp-2" title={layout.description}>
            {layout.description}
          </p>
          
          {/* Constrained item count */}
          <div className="mt-2 text-sm text-gray-500 truncate">
            {layout.items.length} items
          </div>
        </div>
      ))}
    </div>
  );
};
```

```tsx
// frontend/components/LayoutList.tsx - Fixed
export const LayoutList: React.FC<Props> = ({ layouts }) => {
  return (
    <ul className="divide-y">
      {layouts.map((layout) => (
        <li key={layout.id} className="py-3 flex justify-between min-w-0">
          <div className="flex-1 min-w-0">
            {/* Truncated name */}
            <span 
              className="font-medium truncate block"
              title={layout.name}
            >
              {layout.name}
            </span>
            
            {/* Metadata on separate line for mobile */}
            <span className="text-sm text-gray-500 truncate block">
              {layout.createdAt.toLocaleDateString()} by {layout.createdBy}
            </span>
          </div>
          
          {/* Fixed-width actions that don't shrink */}
          <div className="flex space-x-2 flex-shrink-0 ml-4">
            <button className="px-3 py-1 text-sm">Edit</button>
            <button className="px-3 py-1 text-sm">Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
};
```

### Option 2: Smart Text Component with Auto-Resizing

```tsx
// frontend/components/ui/SmartText/SmartText.tsx
import React, { useRef, useEffect, useState } from 'react';

interface SmartTextProps {
  text: string;
  maxLines?: number;
  className?: string;
}

export const SmartText: React.FC<SmartTextProps> = ({
  text,
  maxLines = 1,
  className = '',
}) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    const element = textRef.current;
    if (!element) return;
    
    // Check if text is actually truncated
    setIsTruncated(element.scrollWidth > element.clientWidth);
  }, [text]);
  
  return (
    <span
      ref={textRef}
      className={`${className} ${maxLines === 1 ? 'truncate' : `line-clamp-${maxLines}`}`}
      title={isTruncated ? text : undefined}
    >
      {text}
    </span>
  );
};
```

```tsx
// Usage
<SmartText text={product.name} maxLines={1} className="font-medium" />
<SmartText text={layout.description} maxLines={2} className="text-gray-600" />
```

### Option 3: Text with Expand/Collapse

```tsx
// frontend/components/ui/ExpandableText/ExpandableText.tsx
import React, { useState } from 'react';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxLength = 100,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (text.length <= maxLength) {
    return <span>{text}</span>;
  }
  
  const displayText = isExpanded ? text : text.slice(0, maxLength);
  
  return (
    <span>
      {displayText}
      {!isExpanded && '... '}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-500 hover:underline"
      >
        {isExpanded ? 'Show less' : 'Show more'}
      </button>
    </span>
  );
};
```

### Option 4: Responsive Text Scaling

```css
/* Auto-scaling text for product buttons */
.auto-scale-text {
  container-type: inline-size;
}

.auto-scale-text > * {
  font-size: clamp(10px, 3cqw, 14px);
}
```

```tsx
// Product button with auto-scaling
<button className="product-button auto-scale-text">
  <span>{product.name}</span>
</button>
```

## Character Limits and Validation

```typescript
// frontend/utils/textLimits.ts
export const TEXT_LIMITS = {
  PRODUCT_NAME_MAX: 50,
  LAYOUT_NAME_MAX: 60,
  LAYOUT_DESCRIPTION_MAX: 200,
  BUTTON_TEXT_MAX: 30,
};

export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};

// Backend validation
export const validateProductName = (name: string): boolean => {
  return name.length > 0 && name.length <= TEXT_LIMITS.PRODUCT_NAME_MAX;
};
```

## Testing Strategy

```typescript
// textOverflow.test.tsx
import { render, screen } from '@testing-library/react';
import { SmartText } from './SmartText';

describe('SmartText', () => {
  it('should truncate long text', () => {
    const longText = 'A'.repeat(200);
    
    render(<SmartText text={longText} maxLines={1} />);
    
    const element = screen.getByText(longText);
    expect(element).toHaveClass('truncate');
    expect(element).toHaveAttribute('title', longText);
  });
  
  it('should not add title for short text', () => {
    const shortText = 'Short';
    
    render(<SmartText text={shortText} maxLines={1} />);
    
    const element = screen.getByText(shortText);
    expect(element).not.toHaveAttribute('title');
  });
});

describe('Text limits', () => {
  it('should truncate text correctly', () => {
    const text = 'This is a very long product name';
    const truncated = truncateText(text, 20);
    
    expect(truncated).toBe('This is a very lon...');
    expect(truncated.length).toBeLessThanOrEqual(20);
  });
});
```

## Visual Regression Testing

```typescript
// storybook/TextOverflow.stories.tsx
export default {
  title: 'Components/TextOverflow',
  component: DraggableProductButton,
};

export const ShortName = () => (
  <DraggableProductButton product={{ name: 'Coffee' }} />
);

export const LongName = () => (
  <DraggableProductButton 
    product={{ name: 'Super Premium Organic Fair Trade Dark Chocolate Espresso Beans' }} 
  />
);

export const VeryLongName = () => (
  <DraggableProductButton 
    product={{ name: 'A'.repeat(200) }} 
  />
);
```

## CSS Framework Integration

```css
/* Tailwind CSS classes */
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .text-pretty {
    text-wrap: pretty;
  }
}
```

```tsx
// Using Tailwind for truncation
<div className="truncate" title={longText}>{longText}</div>
<div className="line-clamp-2" title={longText}>{longText}</div>
<div className="break-words">{veryLongWord}</div>
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Create text overflow utilities | 30 min |
| Update DraggableProductButton | 30 min |
| Update LayoutGrid | 30 min |
| Update LayoutList | 30 min |
| Create SmartText component | 1 hour |
| Visual regression testing | 1 hour |
| **Total** | **4 hours** |

## Related Issues

- [BUG-016: Integer Overflow](./BUG-016-integer-overflow.md)
- [CSS Best Practices](../../docs/css-guidelines.md)

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
