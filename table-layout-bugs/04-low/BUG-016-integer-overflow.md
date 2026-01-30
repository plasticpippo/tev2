# BUG-016: Integer Overflow in Position Coordinates

## Severity Level
**LOW**

## File Location
- `frontend/components/DraggableProductButton.tsx` (lines 40-80)
- `frontend/utils/gridCalculations.ts` (lines 25-60)
- `backend/src/validators/layoutValidator.ts` (lines 30-50)

## Description

Position and dimension values (x, y, width, height) for grid items are not properly bounded, allowing integer overflow or extreme values that can cause layout rendering issues, performance degradation, or unexpected behavior when values exceed safe integer ranges.

## Current Vulnerable Code

```tsx
// frontend/components/DraggableProductButton.tsx - Line 40-80
export const DraggableProductButton: React.FC<Props> = ({
  product,
  position,
  onPositionChange,
}) => {
  const handleDrag = (event: DraggableEvent, data: DraggableData) => {
    // BUG: No bounds checking on position values
    onPositionChange({
      x: data.x,
      y: data.y,
    });
  };
  
  const handleResize = (width: number, height: number) => {
    // BUG: Accepts any dimensions including negatives and extreme values
    onPositionChange({
      width,
      height,
    });
  };
  
  return (
    <Draggable
      position={{ x: position.x, y: position.y }}
      onDrag={handleDrag}
    >
      <div style={{
        // BUG: Can cause layout issues with extreme values
        width: position.width,
        height: position.height,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}>
        {product.name}
      </div>
    </Draggable>
  );
};
```

```typescript
// frontend/utils/gridCalculations.ts - Line 25-60
export const calculateGridPosition = (
  pixelX: number,
  pixelY: number,
  cellSize: number
): GridPosition => {
  // BUG: No validation of input values
  const gridX = Math.round(pixelX / cellSize);
  const gridY = Math.round(pixelY / cellSize);
  
  // BUG: Can return extremely large values
  return { x: gridX, y: gridY };
};

export const snapToGrid = (
  x: number,
  y: number,
  gridSize: number
): Position => {
  // BUG: Math operations can overflow
  const snappedX = Math.round(x / gridSize) * gridSize;
  const snappedY = Math.round(y / gridSize) * gridSize;
  
  return { x: snappedX, y: snappedY };
};

export const calculateDimensions = (
  items: LayoutItem[]
): Dimensions => {
  // BUG: Summing many items can overflow
  const totalWidth = items.reduce((sum, item) => sum + item.width, 0);
  const totalHeight = items.reduce((sum, item) => sum + item.height, 0);
  
  return { width: totalWidth, height: totalHeight };
};
```

```typescript
// backend/src/validators/layoutValidator.ts - Line 30-50
export const validateLayoutItem = (item: LayoutItem): ValidationResult => {
  const errors: string[] = [];
  
  // BUG: Weak validation allows overflow values
  if (item.x < 0) errors.push('X position cannot be negative');
  if (item.y < 0) errors.push('Y position cannot be negative');
  if (item.width <= 0) errors.push('Width must be positive');
  if (item.height <= 0) errors.push('Height must be positive');
  
  // BUG: No upper bounds checking
  // Number.MAX_SAFE_INTEGER is 9007199254740991
  // No check for: item.x > Number.MAX_SAFE_INTEGER
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

## Overflow Scenarios

```typescript
// Scenario 1: Dragging far beyond viewport
const extremePosition = {
  x: 999999999999999999999, // Way beyond safe integer
  y: 999999999999999999999,
};
// Results in: { x: 1000000000000000000000, y: 1000000000000000000000 }
// JavaScript precision lost, becomes inaccurate

// Scenario 2: Multiplication overflow
const gridSize = 1000000;
const gridX = 1000000;
const pixelX = gridX * gridSize; // 1,000,000,000,000 - still safe

const gridX2 = 10000000;
const pixelX2 = gridX2 * gridSize; // 10,000,000,000,000 - precision lost

// Scenario 3: Division by zero or near-zero
const cellSize = 0.0000001;
const pixelX = 1;
const gridX = Math.round(pixelX / cellSize); // 10000000

// Scenario 4: NaN propagation
const badPosition = {
  x: parseInt('invalid'), // NaN
  y: 100,
};
// NaN spreads through calculations

// Scenario 5: Infinity
const infiniteSize = 1 / 0; // Infinity
const position = {
  width: infiniteSize,
  height: infiniteSize,
};
```

## Root Cause Analysis

1. **No Bounds Validation**: Input values not checked against safe ranges
2. **Implicit Trust in User Input**: Drag coordinates accepted without limits
3. **Missing Type Constraints**: TypeScript doesn't prevent large numbers
4. **No Overflow Detection**: Calculations proceed regardless of magnitude
5. **Weak Backend Validation**: Server accepts values that cause rendering issues

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| UI Breakage | LOW | Extreme values break layout rendering |
| Performance | LOW | Large coordinates cause scroll/performance issues |
| Data Corruption | LOW | Precision loss in stored positions |
| Browser Crash | LOW | Very extreme values may freeze browser |

## Suggested Fix

### Option 1: Comprehensive Bounds Checking (Recommended)

```typescript
// frontend/utils/bounds.ts
export const SAFE_INTEGER = Number.MAX_SAFE_INTEGER; // 9007199254740991
export const MAX_POSITION = 100000; // Reasonable max for UI
export const MAX_DIMENSION = 10000; // Reasonable max size
export const MIN_DIMENSION = 10; // Minimum clickable size
export const MAX_GRID_SIZE = 1000; // Maximum grid cells

export interface Bounds {
  min?: number;
  max?: number;
  allowNegative?: boolean;
}

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const isValidNumber = (value: unknown): value is number => {
  return (
    typeof value === 'number' &&
    !isNaN(value) &&
    isFinite(value) &&
    Math.abs(value) <= SAFE_INTEGER
  );
};

export const sanitizeCoordinate = (
  value: number,
  bounds: Bounds = {}
): number => {
  const { min = 0, max = MAX_POSITION, allowNegative = false } = bounds;
  
  if (!isValidNumber(value)) {
    return min;
  }
  
  let sanitized = value;
  
  // Handle negative values
  if (!allowNegative && sanitized < 0) {
    sanitized = 0;
  }
  
  // Clamp to bounds
  sanitized = clamp(sanitized, allowNegative ? -max : min, max);
  
  return sanitized;
};

export const sanitizeDimension = (value: number): number => {
  if (!isValidNumber(value)) {
    return MIN_DIMENSION;
  }
  
  return clamp(value, MIN_DIMENSION, MAX_DIMENSION);
};
```

```typescript
// frontend/utils/gridCalculations.ts - Fixed
import { 
  clamp, 
  isValidNumber, 
  MAX_POSITION, 
  MAX_DIMENSION,
  MIN_DIMENSION 
} from './bounds';

export const calculateGridPosition = (
  pixelX: number,
  pixelY: number,
  cellSize: number
): GridPosition => {
  // Validate inputs
  if (!isValidNumber(pixelX) || !isValidNumber(pixelY) || !isValidNumber(cellSize)) {
    return { x: 0, y: 0 };
  }
  
  // Prevent division by very small numbers
  const safeCellSize = Math.max(cellSize, 1);
  
  const gridX = Math.round(pixelX / safeCellSize);
  const gridY = Math.round(pixelY / safeCellSize);
  
  // Clamp to safe ranges
  return {
    x: clamp(gridX, 0, MAX_GRID_SIZE),
    y: clamp(gridY, 0, MAX_GRID_SIZE),
  };
};

export const snapToGrid = (
  x: number,
  y: number,
  gridSize: number
): Position => {
  if (!isValidNumber(x) || !isValidNumber(y) || !isValidNumber(gridSize)) {
    return { x: 0, y: 0 };
  }
  
  const safeGridSize = Math.max(gridSize, 1);
  
  const snappedX = Math.round(x / safeGridSize) * safeGridSize;
  const snappedY = Math.round(y / safeGridSize) * safeGridSize;
  
  return {
    x: clamp(snappedX, 0, MAX_POSITION),
    y: clamp(snappedY, 0, MAX_POSITION),
  };
};

export const calculateDimensions = (
  items: LayoutItem[]
): Dimensions => {
  // Use bounded accumulation to prevent overflow
  let totalWidth = 0;
  let totalHeight = 0;
  
  for (const item of items) {
    const width = sanitizeDimension(item.width);
    const height = sanitizeDimension(item.height);
    
    // Check for potential overflow before adding
    if (totalWidth > MAX_DIMENSION - width) {
      totalWidth = MAX_DIMENSION;
    } else {
      totalWidth += width;
    }
    
    if (totalHeight > MAX_DIMENSION - height) {
      totalHeight = MAX_DIMENSION;
    } else {
      totalHeight += height;
    }
  }
  
  return { width: totalWidth, height: totalHeight };
};
```

```tsx
// frontend/components/DraggableProductButton.tsx - Fixed
import { 
  sanitizeCoordinate, 
  sanitizeDimension,
  MAX_POSITION 
} from '../utils/bounds';

export const DraggableProductButton: React.FC<Props> = ({
  product,
  position,
  onPositionChange,
}) => {
  const handleDrag = (event: DraggableEvent, data: DraggableData) => {
    // Sanitize position values
    const sanitizedX = sanitizeCoordinate(data.x);
    const sanitizedY = sanitizeCoordinate(data.y);
    
    onPositionChange({
      x: sanitizedX,
      y: sanitizedY,
    });
  };
  
  const handleResize = (width: number, height: number) => {
    // Sanitize dimensions
    const sanitizedWidth = sanitizeDimension(width);
    const sanitizedHeight = sanitizeDimension(height);
    
    onPositionChange({
      width: sanitizedWidth,
      height: sanitizedHeight,
    });
  };
  
  // Ensure position values are safe for rendering
  const safePosition = {
    x: sanitizeCoordinate(position.x),
    y: sanitizeCoordinate(position.y),
    width: sanitizeDimension(position.width),
    height: sanitizeDimension(position.height),
  };
  
  return (
    <Draggable
      position={{ x: safePosition.x, y: safePosition.y }}
      onDrag={handleDrag}
      bounds={{ 
        left: 0, 
        top: 0, 
        right: MAX_POSITION, 
        bottom: MAX_POSITION 
      }}
    >
      <div style={{
        width: safePosition.width,
        height: safePosition.height,
        transform: `translate(${safePosition.x}px, ${safePosition.y}px)`,
      }}>
        {product.name}
      </div>
    </Draggable>
  );
};
```

### Option 2: Backend Validation with Strict Bounds

```typescript
// backend/src/validators/layoutValidator.ts - Fixed
import { z } from 'zod';

const LayoutItemSchema = z.object({
  id: z.string().uuid(),
  x: z.number()
    .int()
    .min(0, 'X position must be non-negative')
    .max(100000, 'X position exceeds maximum allowed'),
  y: z.number()
    .int()
    .min(0, 'Y position must be non-negative')
    .max(100000, 'Y position exceeds maximum allowed'),
  width: z.number()
    .int()
    .min(10, 'Width must be at least 10')
    .max(10000, 'Width exceeds maximum allowed'),
  height: z.number()
    .int()
    .min(10, 'Height must be at least 10')
    .max(10000, 'Height exceeds maximum allowed'),
});

const LayoutSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  items: z.array(LayoutItemSchema)
    .max(1000, 'Too many items in layout'),
});

export const validateLayout = (data: unknown): z.infer<typeof LayoutSchema> => {
  return LayoutSchema.parse(data);
};

export const validatePartialItem = (data: unknown): Partial<LayoutItem> => {
  return LayoutItemSchema.partial().parse(data);
};
```

### Option 3: Safe Math Operations Utility

```typescript
// frontend/utils/safeMath.ts
export class MathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MathError';
  }
}

export const safeAdd = (a: number, b: number): number => {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new MathError('Cannot add non-finite numbers');
  }
  
  const result = a + b;
  
  if (!Number.isFinite(result)) {
    throw new MathError('Addition overflow');
  }
  
  return result;
};

export const safeMultiply = (a: number, b: number): number => {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new MathError('Cannot multiply non-finite numbers');
  }
  
  const result = a * b;
  
  if (!Number.isFinite(result)) {
    throw new MathError('Multiplication overflow');
  }
  
  return result;
};

export const safeDivide = (a: number, b: number): number => {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new MathError('Cannot divide non-finite numbers');
  }
  
  if (b === 0) {
    throw new MathError('Division by zero');
  }
  
  const result = a / b;
  
  if (!Number.isFinite(result)) {
    throw new MathError('Division overflow');
  }
  
  return result;
};
```

## Testing Strategy

```typescript
// bounds.test.ts
describe('Bounds Utilities', () => {
  describe('isValidNumber', () => {
    it('should reject NaN', () => {
      expect(isValidNumber(NaN)).toBe(false);
    });
    
    it('should reject Infinity', () => {
      expect(isValidNumber(Infinity)).toBe(false);
      expect(isValidNumber(-Infinity)).toBe(false);
    });
    
    it('should reject unsafe integers', () => {
      expect(isValidNumber(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
    });
    
    it('should accept valid numbers', () => {
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(100)).toBe(true);
      expect(isValidNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
    });
  });
  
  describe('sanitizeCoordinate', () => {
    it('should clamp to max bound', () => {
      expect(sanitizeCoordinate(999999999)).toBe(100000);
    });
    
    it('should reject negative values', () => {
      expect(sanitizeCoordinate(-100)).toBe(0);
    });
    
    it('should handle NaN', () => {
      expect(sanitizeCoordinate(NaN)).toBe(0);
    });
    
    it('should allow negatives when specified', () => {
      expect(sanitizeCoordinate(-100, { allowNegative: true })).toBe(-100);
    });
  });
  
  describe('calculateDimensions', () => {
    it('should prevent overflow with many items', () => {
      const items = Array(1000).fill({ width: 100, height: 100 });
      const dims = calculateDimensions(items);
      
      expect(dims.width).toBeLessThanOrEqual(10000);
      expect(dims.height).toBeLessThanOrEqual(10000);
    });
  });
});
```

## Visual Boundaries

```tsx
// frontend/components/GridBoundary.tsx
export const GridBoundary: React.FC = ({ children }) => {
  return (
    <div 
      className="grid-boundary"
      style={{
        position: 'relative',
        width: MAX_POSITION,
        height: MAX_POSITION,
        overflow: 'hidden', // Clip anything beyond bounds
      }}
    >
      {children}
    </div>
  );
};
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Create bounds utilities | 45 min |
| Update grid calculations | 30 min |
| Fix DraggableProductButton | 30 min |
| Add backend validation | 30 min |
| Testing | 45 min |
| **Total** | **3 hours** |

## Related Issues

- [BUG-017: Console Log in Production](./BUG-017-console-log-production.md)
- [Data Validation Guidelines](../../docs/validation.md)

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
