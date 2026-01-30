# BUG-014: Unreliable Dirty State Management for Unsaved Changes

## Severity Level
**MEDIUM**

## File Location
- `frontend/contexts/LayoutContext.tsx` (lines 80-150)
- `frontend/components/LayoutEditor.tsx` (lines 180-220)
- `frontend/hooks/useAutosave.ts` (lines 20-50)

## Description

The dirty state tracking (indicating unsaved changes) is unreliable and inconsistent across the application. Multiple approaches to tracking modifications exist simultaneously, leading to false positives, false negatives, and race conditions. Users may lose work due to incorrect dirty state or be annoyed by unnecessary confirmation dialogs.

## Current Vulnerable Code

```tsx
// frontend/contexts/LayoutContext.tsx - Line 80-150
interface LayoutContextState {
  layout: Layout | null;
  isDirty: boolean;  // BUG: Single boolean doesn't track what changed
  originalLayout: Layout | null;
}

export const LayoutProvider: React.FC = ({ children }) => {
  const [layout, setLayout] = useState<Layout | null>(null);
  const [originalLayout, setOriginalLayout] = useState<Layout | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  
  // BUG: Deep equality check on every render
  useEffect(() => {
    if (layout && originalLayout) {
      const dirty = JSON.stringify(layout) !== JSON.stringify(originalLayout);
      setIsDirty(dirty);
    }
  }, [layout, originalLayout]);
  
  const updateLayout = useCallback((updates: Partial<Layout>) => {
    setLayout((prev) => {
      if (!prev) return null;
      // BUG: No check if value actually changed
      return { ...prev, ...updates };
    });
  }, []);
  
  const updateItem = useCallback((itemId: string, itemUpdates: Partial<LayoutItem>) => {
    setLayout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        items: prev.items.map((item) =>
          // BUG: Creating new array even if item unchanged
          item.id === itemId ? { ...item, ...itemUpdates } : item
        ),
      };
    });
  }, []);
  
  const saveLayout = async () => {
    if (!layout) return;
    
    await api.post('/layouts', layout);
    // BUG: Race condition - what if layout changed during save?
    setOriginalLayout(layout);
    setIsDirty(false);
  };
  
  return (
    <LayoutContext.Provider
      value={{ layout, isDirty, updateLayout, updateItem, saveLayout }}
    >
      {children}
    </LayoutContext.Provider>
  );
};
```

```tsx
// frontend/components/LayoutEditor.tsx - Line 180-220
export const LayoutEditor: React.FC = () => {
  const { layout, isDirty, saveLayout } = useLayoutContext();
  // BUG: Duplicate dirty tracking
  const [localDirty, setLocalDirty] = useState(false);
  
  const handleNameChange = (name: string) => {
    updateLayout({ name });
    setLocalDirty(true); // BUG: Redundant with context tracking
  };
  
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    // BUG: Using wrong dirty state
    if (localDirty || isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  }, [localDirty, isDirty]);
  
  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [handleBeforeUnload]);
  
  // BUG: Navigation guard uses different logic
  const handleNavigateAway = () => {
    if (isDirty) {
      return confirm('You have unsaved changes. Leave anyway?');
    }
    return true;
  };
  
  return (
    <div>
      {/* BUG: Inconsistent dirty indicator */}
      <button disabled={!isDirty} onClick={saveLayout}>
        {isDirty ? 'Save Changes*' : 'Saved'}
      </button>
      {/* BUG: Another component might check localDirty */}
      {localDirty && <span className="unsaved-indicator">Unsaved</span>}
    </div>
  );
};
```

```typescript
// frontend/hooks/useAutosave.ts - Line 20-50
export const useAutosave = (layout: Layout, isDirty: boolean) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (!isDirty || isSaving) return;
    
    // BUG: No debouncing - saves on every change
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveLayout(layout);
        setLastSaved(new Date());
      } catch (error) {
        // BUG: Error not handled, dirty state not restored
        console.error('Autosave failed:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [layout, isDirty, isSaving]); // BUG: layout object changes on every render
  
  return { lastSaved, isSaving };
};
```

## Issues Demonstration

```typescript
// Problem 1: False positive on non-changing updates
updateLayout({ name: 'Same Name' }); // Name unchanged but marks as dirty

// Problem 2: Array reference changes trigger unnecessary re-renders
updateItem('item-1', { x: 5 }); // New items array even if x was already 5

// Problem 3: Race condition in save
saveLayout(); // Async operation
updateLayout({ name: 'New Name' }); // User makes change during save
// After save completes, originalLayout is outdated

// Problem 4: Nested object comparison fails
const layout1 = { config: { grid: { columns: 3 } } };
const layout2 = { config: { grid: { columns: 3 } } };
JSON.stringify(layout1) === JSON.stringify(layout2); // true (lucky)
// But key order matters in JSON.stringify!
```

## Root Cause Analysis

1. **Multiple Truth Sources**: Context and local state both track dirty
2. **Reference Equality Issues**: Object spread creates new references unnecessarily
3. **No Deep Comparison**: Shallow comparison misses nested changes
4. **Async Race Conditions**: Save operation and edits can interleave
5. **No Change Debouncing**: Every keystroke triggers re-renders and comparisons

## Impact/Consequences

| Impact | Severity | Description |
|--------|----------|-------------|
| Data Loss | HIGH | False negatives allow navigation without warning |
| User Annoyance | MEDIUM | False positives show unnecessary dialogs |
| Performance | MEDIUM | Constant deep equality checks are expensive |
| Race Conditions | MEDIUM | Concurrent saves can corrupt state |

## Suggested Fix

### Option 1: Proper Dirty Tracking with Change History (Recommended)

```typescript
// frontend/lib/dirtyState.ts
import { isEqual } from 'lodash';

export interface DirtyState<T> {
  original: T;
  current: T;
  dirtyFields: Set<string>;
  lastSaved: Date | null;
}

export class DirtyStateManager<T extends Record<string, any>> {
  private state: DirtyState<T>;
  private fieldComparators: Map<string, (a: any, b: any) => boolean>;
  
  constructor(initialData: T) {
    this.state = {
      original: this.deepClone(initialData),
      current: this.deepClone(initialData),
      dirtyFields: new Set(),
      lastSaved: null,
    };
    this.fieldComparators = new Map();
  }
  
  setFieldComparator(field: string, comparator: (a: any, b: any) => boolean) {
    this.fieldComparators.set(field, comparator);
  }
  
  private deepClone(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }
  
  update(updates: Partial<T>): void {
    const newCurrent = { ...this.state.current, ...updates };
    
    // Check each updated field
    Object.keys(updates).forEach((key) => {
      const comparator = this.fieldComparators.get(key) || isEqual;
      const isDirty = !comparator(
        this.state.original[key],
        newCurrent[key]
      );
      
      if (isDirty) {
        this.state.dirtyFields.add(key);
      } else {
        this.state.dirtyFields.delete(key);
      }
    });
    
    this.state.current = newCurrent;
  }
  
  updateField<K extends keyof T>(field: K, value: T[K]): void {
    const comparator = this.fieldComparators.get(field as string) || isEqual;
    const isDirty = !comparator(this.state.original[field], value);
    
    this.state.current = { ...this.state.current, [field]: value };
    
    if (isDirty) {
      this.state.dirtyFields.add(field as string);
    } else {
      this.state.dirtyFields.delete(field as string);
    }
  }
  
  updateNestedField(path: string, value: any): void {
    const keys = path.split('.');
    const newCurrent = this.deepClone(this.state.current);
    let target: any = newCurrent;
    
    for (let i = 0; i < keys.length - 1; i++) {
      target = target[keys[i]];
    }
    
    const lastKey = keys[keys.length - 1];
    target[lastKey] = value;
    
    // Check if the entire path is dirty
    const originalValue = this.getNestedValue(this.state.original, path);
    const isDirty = !isEqual(originalValue, value);
    
    this.state.current = newCurrent;
    
    if (isDirty) {
      this.state.dirtyFields.add(path);
    } else {
      this.state.dirtyFields.delete(path);
    }
  }
  
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }
  
  isDirty(): boolean {
    return this.state.dirtyFields.size > 0;
  }
  
  isFieldDirty(field: string): boolean {
    return this.state.dirtyFields.has(field);
  }
  
  getDirtyFields(): string[] {
    return Array.from(this.state.dirtyFields);
  }
  
  getCurrent(): T {
    return this.state.current;
  }
  
  markSaved(): void {
    this.state.original = this.deepClone(this.state.current);
    this.state.dirtyFields.clear();
    this.state.lastSaved = new Date();
  }
  
  reset(): void {
    this.state.current = this.deepClone(this.state.original);
    this.state.dirtyFields.clear();
  }
  
  discardChanges(): void {
    this.state.current = this.deepClone(this.state.original);
    this.state.dirtyFields.clear();
  }
  
  getLastSaved(): Date | null {
    return this.state.lastSaved;
  }
}
```

```tsx
// frontend/contexts/LayoutContext.tsx - Fixed
import { DirtyStateManager } from '../lib/dirtyState';

interface LayoutContextState {
  layout: Layout;
  dirtyState: DirtyStateManager<Layout>;
  isDirty: boolean;
  dirtyFields: string[];
  save: () => Promise<void>;
  update: (updates: Partial<Layout>) => void;
  updateItem: (itemId: string, updates: Partial<LayoutItem>) => void;
  reset: () => void;
}

export const LayoutProvider: React.FC = ({ children }) => {
  const [dirtyState, setDirtyState] = useState<DirtyStateManager<Layout> | null>(null);
  const [, forceUpdate] = useState({}); // Force re-render on dirty state change
  
  const loadLayout = useCallback(async (layoutId: string) => {
    const layout = await api.get(`/layouts/${layoutId}`);
    const manager = new DirtyStateManager(layout);
    
    // Custom comparator for items array
    manager.setFieldComparator('items', (a, b) => {
      if (a.length !== b.length) return false;
      return a.every((item: LayoutItem, i: number) => 
        item.id === b[i].id &&
        item.x === b[i].x &&
        item.y === b[i].y &&
        item.width === b[i].width &&
        item.height === b[i].height
      );
    });
    
    setDirtyState(manager);
  }, []);
  
  const update = useCallback((updates: Partial<Layout>) => {
    if (!dirtyState) return;
    dirtyState.update(updates);
    forceUpdate({}); // Trigger re-render
  }, [dirtyState]);
  
  const updateItem = useCallback((itemId: string, updates: Partial<LayoutItem>) => {
    if (!dirtyState) return;
    
    const currentItems = dirtyState.getCurrent().items;
    const itemIndex = currentItems.findIndex((i) => i.id === itemId);
    
    if (itemIndex === -1) return;
    
    const updatedItem = { ...currentItems[itemIndex], ...updates };
    
    // Only update if actually changed
    if (!isEqual(currentItems[itemIndex], updatedItem)) {
      const newItems = [...currentItems];
      newItems[itemIndex] = updatedItem;
      dirtyState.update({ items: newItems });
      forceUpdate({});
    }
  }, [dirtyState]);
  
  const save = useCallback(async () => {
    if (!dirtyState || !dirtyState.isDirty()) return;
    
    const currentLayout = dirtyState.getCurrent();
    
    try {
      await api.put(`/layouts/${currentLayout.id}`, currentLayout);
      dirtyState.markSaved();
      forceUpdate({});
    } catch (error) {
      // Don't clear dirty state on error - allows retry
      throw error;
    }
  }, [dirtyState]);
  
  const reset = useCallback(() => {
    dirtyState?.reset();
    forceUpdate({});
  }, [dirtyState]);
  
  const value = useMemo(() => {
    if (!dirtyState) return null;
    
    return {
      layout: dirtyState.getCurrent(),
      dirtyState,
      isDirty: dirtyState.isDirty(),
      dirtyFields: dirtyState.getDirtyFields(),
      save,
      update,
      updateItem,
      reset,
    };
  }, [dirtyState, save, update, updateItem, reset]);
  
  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};
```

### Option 2: Immer-based Immutable State Management

```typescript
// frontend/hooks/useDirtyState.ts
import { useState, useCallback, useRef } from 'react';
import { produce } from 'immer';
import { isEqual } from 'lodash';

interface UseDirtyStateOptions<T> {
  onDirtyChange?: (isDirty: boolean) => void;
  debounceMs?: number;
}

export function useDirtyState<T extends Record<string, any>>(
  initialData: T,
  options: UseDirtyStateOptions<T> = {}
) {
  const { onDirtyChange, debounceMs = 0 } = options;
  
  const originalRef = useRef<T>(JSON.parse(JSON.stringify(initialData)));
  const [current, setCurrent] = useState<T>(initialData);
  const [isDirty, setIsDirty] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const checkDirty = useCallback((newData: T) => {
    const dirty = !isEqual(originalRef.current, newData);
    setIsDirty(dirty);
    onDirtyChange?.(dirty);
  }, [onDirtyChange]);
  
  const update = useCallback((updater: (draft: T) => void) => {
    const newData = produce(current, updater);
    
    if (debounceMs > 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setCurrent(newData);
        checkDirty(newData);
      }, debounceMs);
    } else {
      setCurrent(newData);
      checkDirty(newData);
    }
  }, [current, checkDirty, debounceMs]);
  
  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    update((draft) => {
      draft[field] = value;
    });
  }, [update]);
  
  const save = useCallback(() => {
    originalRef.current = JSON.parse(JSON.stringify(current));
    setIsDirty(false);
    onDirtyChange?.(false);
  }, [current, onDirtyChange]);
  
  const reset = useCallback(() => {
    setCurrent(JSON.parse(JSON.stringify(originalRef.current)));
    setIsDirty(false);
    onDirtyChange?.(false);
  }, [onDirtyChange]);
  
  const discard = useCallback(() => {
    reset();
  }, [reset]);
  
  return {
    data: current,
    original: originalRef.current,
    isDirty,
    update,
    setField,
    save,
    reset,
    discard,
  };
}
```

```tsx
// Usage
const LayoutEditor = () => {
  const { 
    data: layout, 
    isDirty, 
    update, 
    setField, 
    save, 
    reset 
  } = useDirtyState(initialLayout, {
    debounceMs: 300,
    onDirtyChange: (dirty) => {
      // Update browser tab indicator
      document.title = dirty ? '* Layout Editor' : 'Layout Editor';
    },
  });
  
  return (
    <div>
      <input
        value={layout.name}
        onChange={(e) => setField('name', e.target.value)}
      />
      <button disabled={!isDirty} onClick={save}>
        Save
      </button>
      <button disabled={!isDirty} onClick={reset}>
        Reset
      </button>
    </div>
  );
};
```

### Option 3: Form Library Integration

```bash
npm install react-hook-form
# or
npm install formik
```

```tsx
// Using react-hook-form
import { useForm, useWatch } from 'react-hook-form';
import { useEffect } from 'react';
import { isEqual } from 'lodash';

const LayoutEditor = ({ initialLayout }: { initialLayout: Layout }) => {
  const {
    register,
    handleSubmit,
    formState: { isDirty, dirtyFields },
    watch,
    reset,
  } = useForm({
    defaultValues: initialLayout,
  });
  
  const watchedValues = watch();
  
  // Warn before unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);
  
  const onSubmit = async (data: Layout) => {
    await api.put(`/layouts/${data.id}`, data);
    reset(data); // Reset form with saved values
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      
      {isDirty && (
        <div className="dirty-indicator">
          Unsaved changes: {Object.keys(dirtyFields).join(', ')}
        </div>
      )}
      
      <button type="submit" disabled={!isDirty}>
        Save
      </button>
      <button type="button" onClick={() => reset()} disabled={!isDirty}>
        Discard
      </button>
    </form>
  );
};
```

## Testing Strategy

```typescript
// dirtyState.test.ts
describe('DirtyStateManager', () => {
  it('should track field-level dirty state', () => {
    const manager = new DirtyStateManager({ name: 'Test', value: 10 });
    
    expect(manager.isDirty()).toBe(false);
    
    manager.updateField('name', 'Test'); // Same value
    expect(manager.isDirty()).toBe(false);
    
    manager.updateField('name', 'Changed');
    expect(manager.isDirty()).toBe(true);
    expect(manager.isFieldDirty('name')).toBe(true);
    expect(manager.isFieldDirty('value')).toBe(false);
  });
  
  it('should handle nested updates', () => {
    const manager = new DirtyStateManager({
      config: { grid: { columns: 3 } },
    });
    
    manager.updateNestedField('config.grid.columns', 4);
    expect(manager.isDirty()).toBe(true);
    
    manager.markSaved();
    expect(manager.isDirty()).toBe(false);
  });
  
  it('should reset to original values', () => {
    const manager = new DirtyStateManager({ name: 'Original' });
    manager.updateField('name', 'Changed');
    
    manager.reset();
    
    expect(manager.getCurrent().name).toBe('Original');
    expect(manager.isDirty()).toBe(false);
  });
  
  it('should handle array field comparisons', () => {
    const manager = new DirtyStateManager({ items: [{ id: '1', x: 0 }] });
    
    manager.setFieldComparator('items', (a, b) => 
      JSON.stringify(a) === JSON.stringify(b)
    );
    
    manager.update({ items: [{ id: '1', x: 0 }] }); // Same
    expect(manager.isDirty()).toBe(false);
    
    manager.update({ items: [{ id: '1', x: 1 }] }); // Changed
    expect(manager.isDirty()).toBe(true);
  });
});
```

## Estimated Effort to Fix

| Task | Effort |
|------|--------|
| Create DirtyStateManager class | 2 hours |
| Refactor LayoutContext | 1.5 hours |
| Update all components using dirty state | 1 hour |
| Add proper beforeunload handling | 30 min |
| Testing | 1 hour |
| **Total** | **6 hours** |

## Related Issues

- [BUG-013: Alert Blocking UI](./BUG-013-alert-blocking.md)
- [State Management Guidelines](../../docs/state-management.md)

## Fix Status
- **Status**: Open
- **Assigned To**: Unassigned
- **Target Release**: v1.3.0
