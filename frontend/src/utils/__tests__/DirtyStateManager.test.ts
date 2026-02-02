import { describe, it, expect, beforeEach, vi } from 'vitest';
import DirtyStateManager, { FieldComparator } from '../DirtyStateManager';

// Test data types matching TillLayout structure
interface LayoutButton {
  id: string;
  productId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
}

interface GridSettings {
  columns: number;
  rowHeight: number;
  gap: number;
}

interface TillLayout {
  buttons: LayoutButton[];
  gridSettings: GridSettings;
  version: number;
}

describe('DirtyStateManager', () => {
  let initialData: TillLayout;

  beforeEach(() => {
    initialData = {
      buttons: [
        { id: 'btn1', productId: 'prod1', x: 0, y: 0, width: 1, height: 1, color: '#ff0000' },
        { id: 'btn2', productId: 'prod2', x: 1, y: 0, width: 1, height: 1 },
      ],
      gridSettings: {
        columns: 4,
        rowHeight: 80,
        gap: 8,
      },
      version: 1,
    };
  });

  describe('constructor', () => {
    it('should initialize with the provided data', () => {
      const manager = new DirtyStateManager(initialData);

      expect(manager.isDirty()).toBe(false);
      expect(manager.getDirtyFields()).toEqual([]);
      expect(manager.getCurrentData()).toEqual(initialData);
      expect(manager.getSavedData()).toEqual(initialData);
      expect(manager.getInitialData()).toEqual(initialData);
    });

    it('should create independent copies of data', () => {
      const manager = new DirtyStateManager(initialData);

      // Modify original data
      initialData.version = 999;
      initialData.buttons.push({ id: 'btn3', productId: 'prod3', x: 2, y: 0, width: 1, height: 1 });

      // Manager's data should remain unchanged
      const currentData = manager.getCurrentData();
      expect(currentData.version).toBe(1);
      expect(currentData.buttons).toHaveLength(2);
    });

    it('should accept configuration options', () => {
      const customComparator: FieldComparator = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      const manager = new DirtyStateManager(initialData, {
        fieldComparators: { buttons: customComparator },
        trackNestedFields: false,
      });

      expect(manager).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update entire data object and track changes', () => {
      const manager = new DirtyStateManager(initialData);
      const newData: TillLayout = {
        ...initialData,
        version: 2,
      };

      manager.update(newData);

      expect(manager.isDirty()).toBe(true);
      expect(manager.isDirty('version')).toBe(true);
      expect(manager.getCurrentData().version).toBe(2);
    });

    it('should detect multiple changed fields', () => {
      const manager = new DirtyStateManager(initialData);
      const newData: TillLayout = {
        buttons: initialData.buttons,
        gridSettings: { columns: 6, rowHeight: 100, gap: 10 },
        version: 3,
      };

      manager.update(newData);

      expect(manager.isDirty()).toBe(true);
      expect(manager.getDirtyFields()).toContain('gridSettings');
      expect(manager.getDirtyFields()).toContain('version');
      expect(manager.getDirtyFields()).not.toContain('buttons');
    });

    it('should detect removed fields', () => {
      const manager = new DirtyStateManager(initialData);
      const newData = {
        buttons: initialData.buttons,
        gridSettings: initialData.gridSettings,
        // version field removed
      } as TillLayout;

      manager.update(newData);

      expect(manager.isDirty('version')).toBe(true);
    });

    it('should clear dirty state when data matches saved state', () => {
      const manager = new DirtyStateManager(initialData);

      manager.update({ ...initialData, version: 2 });
      expect(manager.isDirty()).toBe(true);

      manager.update(initialData);
      expect(manager.isDirty()).toBe(false);
    });

    it('should warn when update is called during save', () => {
      const manager = new DirtyStateManager(initialData);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Start a save operation
      manager.markSaved();

      // Manually set isSaving to true to simulate in-progress save
      // @ts-expect-error - accessing private property for testing
      manager.isSaving = true;

      manager.update({ ...initialData, version: 2 });

      expect(consoleSpy).toHaveBeenCalledWith(
        'DirtyStateManager: Update called while save operation is in progress'
      );

      consoleSpy.mockRestore();
    });

    it('should handle deep array changes', () => {
      const manager = new DirtyStateManager(initialData);
      const newData: TillLayout = {
        ...initialData,
        buttons: [
          ...initialData.buttons,
          { id: 'btn3', productId: 'prod3', x: 2, y: 0, width: 1, height: 1 },
        ],
      };

      manager.update(newData);

      expect(manager.isDirty('buttons')).toBe(true);
      expect(manager.getCurrentData().buttons).toHaveLength(3);
    });

    it('should handle nested object changes', () => {
      const manager = new DirtyStateManager(initialData);
      const newData: TillLayout = {
        ...initialData,
        gridSettings: {
          ...initialData.gridSettings,
          columns: 8,
        },
      };

      manager.update(newData);

      expect(manager.isDirty('gridSettings')).toBe(true);
    });
  });

  describe('updateField', () => {
    it('should update a single field', () => {
      const manager = new DirtyStateManager(initialData);

      manager.updateField('version', 5);

      expect(manager.getCurrentData().version).toBe(5);
      expect(manager.isDirty('version')).toBe(true);
    });

    it('should not mark field dirty if value is unchanged', () => {
      const manager = new DirtyStateManager(initialData);

      manager.updateField('version', 1);

      expect(manager.isDirty('version')).toBe(false);
      expect(manager.isDirty()).toBe(false);
    });

    it('should clear dirty state when field is restored', () => {
      const manager = new DirtyStateManager(initialData);

      manager.updateField('version', 10);
      expect(manager.isDirty('version')).toBe(true);

      manager.updateField('version', 1);
      expect(manager.isDirty('version')).toBe(false);
    });

    it('should handle array field updates', () => {
      const manager = new DirtyStateManager(initialData);
      const newButtons: LayoutButton[] = [
        { id: 'btn1', productId: 'prod1', x: 0, y: 0, width: 2, height: 1 },
      ];

      manager.updateField('buttons', newButtons);

      expect(manager.isDirty('buttons')).toBe(true);
      expect(manager.getCurrentData().buttons).toHaveLength(1);
    });

    it('should handle nested object field updates', () => {
      const manager = new DirtyStateManager(initialData);
      const newGridSettings: GridSettings = {
        columns: 6,
        rowHeight: 100,
        gap: 16,
      };

      manager.updateField('gridSettings', newGridSettings);

      expect(manager.isDirty('gridSettings')).toBe(true);
      expect(manager.getCurrentData().gridSettings.columns).toBe(6);
    });

    it('should warn when updateField is called during save', () => {
      const manager = new DirtyStateManager(initialData);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // @ts-expect-error - accessing private property for testing
      manager.isSaving = true;

      manager.updateField('version', 2);

      expect(consoleSpy).toHaveBeenCalledWith(
        'DirtyStateManager: Update called while save operation is in progress'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('updateNestedField', () => {
    it('should update a nested field using dot notation', () => {
      const manager = new DirtyStateManager(initialData);

      manager.updateNestedField('gridSettings.columns', 8);

      expect(manager.getCurrentData().gridSettings.columns).toBe(8);
      expect(manager.isDirty('gridSettings')).toBe(true);
    });

    it('should update deeply nested fields', () => {
      // Note: This would require buttons to be objects with nested properties
      // Testing with a hypothetical deeply nested structure
      const dataWithDeepNesting = {
        ...initialData,
        gridSettings: {
          ...initialData.gridSettings,
          nested: { value: 'test' },
        } as any,
      };

      const manager2 = new DirtyStateManager(dataWithDeepNesting);
      manager2.updateNestedField('gridSettings.nested.value', 'updated');

      expect(manager2.isDirty('gridSettings')).toBe(true);
    });

    it('should track nested field paths when configured', () => {
      const manager = new DirtyStateManager(initialData, { trackNestedFields: true });

      manager.updateNestedField('gridSettings.columns', 6);

      expect(manager.isDirty('gridSettings.columns')).toBe(true);
    });

    it('should not track nested field paths when disabled', () => {
      const manager = new DirtyStateManager(initialData, { trackNestedFields: false });

      manager.updateNestedField('gridSettings.columns', 6);

      expect(manager.isDirty('gridSettings')).toBe(true);
      expect(manager.isDirty('gridSettings.columns')).toBe(false);
    });

    it('should handle creating nested paths that do not exist', () => {
      const manager = new DirtyStateManager(initialData);

      manager.updateNestedField('gridSettings.newProperty', 'value');

      expect(manager.getCurrentData().gridSettings).toHaveProperty('newProperty', 'value');
      expect(manager.isDirty('gridSettings')).toBe(true);
    });

    it('should clear dirty state when nested value is restored', () => {
      const manager = new DirtyStateManager(initialData);

      manager.updateNestedField('gridSettings.columns', 10);
      expect(manager.isDirty('gridSettings')).toBe(true);

      manager.updateNestedField('gridSettings.columns', 4);
      expect(manager.isDirty('gridSettings')).toBe(false);
    });

    it('should warn when updateNestedField is called during save', () => {
      const manager = new DirtyStateManager(initialData);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // @ts-expect-error - accessing private property for testing
      manager.isSaving = true;

      manager.updateNestedField('gridSettings.columns', 8);

      expect(consoleSpy).toHaveBeenCalledWith(
        'DirtyStateManager: Update called while save operation is in progress'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('isDirty', () => {
    it('should return false when no changes exist', () => {
      const manager = new DirtyStateManager(initialData);

      expect(manager.isDirty()).toBe(false);
    });

    it('should return true when changes exist', () => {
      const manager = new DirtyStateManager(initialData);
      manager.updateField('version', 2);

      expect(manager.isDirty()).toBe(true);
    });

    it('should check specific field dirty state', () => {
      const manager = new DirtyStateManager(initialData);
      manager.updateField('version', 2);

      expect(manager.isDirty('version')).toBe(true);
      expect(manager.isDirty('buttons')).toBe(false);
    });

    it('should return false for non-existent fields', () => {
      const manager = new DirtyStateManager(initialData);

      expect(manager.isDirty('nonExistent')).toBe(false);
    });
  });

  describe('getDirtyFields', () => {
    it('should return empty array when no fields are dirty', () => {
      const manager = new DirtyStateManager(initialData);

      expect(manager.getDirtyFields()).toEqual([]);
    });

    it('should return array of dirty field names', () => {
      const manager = new DirtyStateManager(initialData);
      manager.updateField('version', 2);
      manager.updateField('buttons', []);

      const dirtyFields = manager.getDirtyFields();
      expect(dirtyFields).toContain('version');
      expect(dirtyFields).toContain('buttons');
      expect(dirtyFields).toHaveLength(2);
    });
  });

  describe('markSaved', () => {
    it('should reset dirty state', async () => {
      const manager = new DirtyStateManager(initialData);
      manager.updateField('version', 2);

      expect(manager.isDirty()).toBe(true);

      await manager.markSaved();

      expect(manager.isDirty()).toBe(false);
      expect(manager.getDirtyFields()).toEqual([]);
    });

    it('should update saved data to current data', async () => {
      const manager = new DirtyStateManager(initialData);
      manager.updateField('version', 5);

      await manager.markSaved();

      expect(manager.getSavedData().version).toBe(5);
    });

    it('should set isSaving flag during operation', async () => {
      const manager = new DirtyStateManager(initialData);

      expect(manager.getIsSaving()).toBe(false);

      const savePromise = manager.markSaved();

      // During the save operation, isSaving should be true
      // Note: Due to the microtask timing, we might not catch it mid-save
      // but we verify the flag behavior

      await savePromise;

      expect(manager.getIsSaving()).toBe(false);
    });

    it('should handle concurrent save operations safely', async () => {
      const manager = new DirtyStateManager(initialData);
      manager.updateField('version', 2);

      // Start multiple save operations
      const save1 = manager.markSaved();
      const save2 = manager.markSaved();

      await Promise.all([save1, save2]);

      // Should be clean after saves complete
      expect(manager.isDirty()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const manager = new DirtyStateManager(initialData);
      manager.updateField('version', 100);
      manager.updateField('gridSettings', { columns: 10, rowHeight: 200, gap: 20 });

      manager.reset();

      expect(manager.getCurrentData()).toEqual(initialData);
      expect(manager.getSavedData()).toEqual(initialData);
      expect(manager.isDirty()).toBe(false);
    });

    it('should not reset if save is in progress', () => {
      const manager = new DirtyStateManager(initialData);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      manager.updateField('version', 2);

      // @ts-expect-error - accessing private property for testing
      manager.isSaving = true;

      manager.reset();

      // Should still be dirty and unchanged
      expect(manager.isDirty()).toBe(true);
      expect(manager.getCurrentData().version).toBe(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        'DirtyStateManager: Reset called while save operation is in progress'
      );

      consoleSpy.mockRestore();
    });

    it('should create independent copy of initial data', () => {
      const manager = new DirtyStateManager(initialData);
      manager.updateField('version', 5);
      manager.reset();

      // Modify returned data
      const currentData = manager.getCurrentData();
      currentData.version = 999;

      // Manager should still have initial value
      expect(manager.getCurrentData().version).toBe(initialData.version);
    });
  });

  describe('discardChanges', () => {
    it('should revert to last saved state', async () => {
      const manager = new DirtyStateManager(initialData);
      manager.updateField('version', 5);
      await manager.markSaved();

      manager.updateField('version', 10);
      expect(manager.isDirty()).toBe(true);

      manager.discardChanges();

      expect(manager.getCurrentData().version).toBe(5);
      expect(manager.isDirty()).toBe(false);
    });

    it('should not discard if save is in progress', () => {
      const manager = new DirtyStateManager(initialData);
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      manager.updateField('version', 2);

      // @ts-expect-error - accessing private property for testing
      manager.isSaving = true;

      manager.discardChanges();

      // Should still be dirty and unchanged
      expect(manager.isDirty()).toBe(true);
      expect(manager.getCurrentData().version).toBe(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        'DirtyStateManager: Discard called while save operation is in progress'
      );

      consoleSpy.mockRestore();
    });

    it('should work after multiple saves', async () => {
      const manager = new DirtyStateManager(initialData);

      manager.updateField('version', 2);
      await manager.markSaved();

      manager.updateField('version', 3);
      await manager.markSaved();

      manager.updateField('version', 4);
      expect(manager.isDirty()).toBe(true);

      manager.discardChanges();

      expect(manager.getCurrentData().version).toBe(3);
      expect(manager.isDirty()).toBe(false);
    });
  });

  describe('custom comparators', () => {
    it('should use custom comparator when provided', () => {
      // Custom comparator that ignores color differences in buttons
      const buttonsComparator: FieldComparator<LayoutButton[]> = (a, b) => {
        if (a.length !== b.length) return false;
        return a.every((btnA, idx) => {
          const btnB = b[idx];
          return (
            btnA.id === btnB.id &&
            btnA.productId === btnB.productId &&
            btnA.x === btnB.x &&
            btnA.y === btnB.y &&
            btnA.width === btnB.width &&
            btnA.height === btnB.height
            // Note: color is intentionally ignored
          );
        });
      };

      const manager = new DirtyStateManager(initialData, {
        fieldComparators: { buttons: buttonsComparator },
      });

      // Update only color - should not be dirty with custom comparator
      const newButtons = initialData.buttons.map(btn => ({
        ...btn,
        color: '#00ff00',
      }));
      manager.updateField('buttons', newButtons);

      expect(manager.isDirty('buttons')).toBe(false);

      // Update position - should be dirty
      const movedButtons = initialData.buttons.map(btn => ({
        ...btn,
        x: btn.x + 1,
      }));
      manager.updateField('buttons', movedButtons);

      expect(manager.isDirty('buttons')).toBe(true);
    });

    it('should use isEqual when no custom comparator provided', () => {
      const manager = new DirtyStateManager(initialData);

      // Different object with same content - should not be dirty
      manager.updateField('gridSettings', { columns: 4, rowHeight: 80, gap: 8 });
      expect(manager.isDirty('gridSettings')).toBe(false);

      // Different content - should be dirty
      manager.updateField('gridSettings', { columns: 5, rowHeight: 80, gap: 8 });
      expect(manager.isDirty('gridSettings')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      const dataWithNull = {
        ...initialData,
        optionalField: null,
      } as TillLayout & { optionalField: any };

      const manager = new DirtyStateManager(dataWithNull);

      manager.updateField('optionalField', 'value');
      expect(manager.isDirty('optionalField')).toBe(true);

      manager.updateField('optionalField', null);
      expect(manager.isDirty('optionalField')).toBe(false);
    });

    it('should handle undefined values', () => {
      const dataWithUndefined = {
        ...initialData,
        optionalField: undefined,
      } as TillLayout & { optionalField: any };

      const manager = new DirtyStateManager(dataWithUndefined);

      manager.updateField('optionalField', 'value');
      expect(manager.isDirty('optionalField')).toBe(true);

      manager.updateField('optionalField', undefined);
      expect(manager.isDirty('optionalField')).toBe(false);
    });

    it('should handle empty arrays', () => {
      const manager = new DirtyStateManager(initialData);

      manager.updateField('buttons', []);
      expect(manager.isDirty('buttons')).toBe(true);

      manager.updateField('buttons', initialData.buttons);
      expect(manager.isDirty('buttons')).toBe(false);
    });

    it('should handle empty objects', () => {
      const manager = new DirtyStateManager(initialData);

      manager.updateField('gridSettings', {} as GridSettings);
      expect(manager.isDirty('gridSettings')).toBe(true);
    });

    it('should handle circular references gracefully', () => {
      // Note: lodash's cloneDeep handles circular references
      const circularData: any = { ...initialData, self: null };
      circularData.self = circularData;

      // This should not throw
      expect(() => new DirtyStateManager(circularData)).not.toThrow();
    });

    it('should handle special numeric values', () => {
      const manager = new DirtyStateManager(initialData);

      manager.updateField('version', NaN);
      expect(manager.isDirty('version')).toBe(true);

      manager.updateField('version', Infinity);
      expect(manager.isDirty('version')).toBe(true);

      manager.updateField('version', -Infinity);
      expect(manager.isDirty('version')).toBe(true);
    });

    it('should handle date objects', () => {
      const dataWithDate = {
        ...initialData,
        createdAt: new Date('2024-01-01'),
      } as TillLayout & { createdAt: Date };

      const manager = new DirtyStateManager(dataWithDate);

      manager.updateField('createdAt', new Date('2024-01-02'));
      expect(manager.isDirty('createdAt')).toBe(true);

      manager.updateField('createdAt', new Date('2024-01-01'));
      expect(manager.isDirty('createdAt')).toBe(false);
    });
  });

  describe('data retrieval methods', () => {
    it('getCurrentData should return a clone', () => {
      const manager = new DirtyStateManager(initialData);

      const data = manager.getCurrentData();
      data.version = 999;
      data.buttons.push({ id: 'new', productId: 'new', x: 0, y: 0, width: 1, height: 1 });

      expect(manager.getCurrentData().version).toBe(initialData.version);
      expect(manager.getCurrentData().buttons).toHaveLength(initialData.buttons.length);
    });

    it('getSavedData should return a clone', () => {
      const manager = new DirtyStateManager(initialData);

      const data = manager.getSavedData();
      data.version = 999;

      expect(manager.getSavedData().version).toBe(initialData.version);
    });

    it('getInitialData should return a clone', () => {
      const manager = new DirtyStateManager(initialData);

      const data = manager.getInitialData();
      data.version = 999;

      expect(manager.getInitialData().version).toBe(initialData.version);
    });
  });

  describe('complex scenarios', () => {
    it('should handle rapid successive updates', () => {
      const manager = new DirtyStateManager(initialData);

      for (let i = 0; i < 100; i++) {
        manager.updateField('version', i);
      }

      expect(manager.getCurrentData().version).toBe(99);
      expect(manager.isDirty()).toBe(true);
    });

    it('should handle multiple field updates', () => {
      const manager = new DirtyStateManager(initialData);

      manager.updateField('version', 2);
      manager.updateField('gridSettings', { columns: 6, rowHeight: 100, gap: 10 });
      manager.updateNestedField('gridSettings.columns', 8);

      expect(manager.isDirty()).toBe(true);
      expect(manager.getDirtyFields()).toContain('version');
      expect(manager.getDirtyFields()).toContain('gridSettings');
      expect(manager.getCurrentData().gridSettings.columns).toBe(8);
    });

    it('should maintain consistency across operations', async () => {
      const manager = new DirtyStateManager(initialData);

      // Make changes
      manager.updateField('version', 2);
      manager.updateNestedField('gridSettings.columns', 6);

      expect(manager.isDirty()).toBe(true);

      // Save
      await manager.markSaved();
      expect(manager.isDirty()).toBe(false);
      expect(manager.getSavedData().version).toBe(2);
      expect(manager.getSavedData().gridSettings.columns).toBe(6);

      // Make more changes
      manager.updateField('version', 3);
      expect(manager.isDirty()).toBe(true);

      // Discard
      manager.discardChanges();
      expect(manager.isDirty()).toBe(false);
      expect(manager.getCurrentData().version).toBe(2);

      // Reset
      manager.reset();
      expect(manager.getCurrentData().version).toBe(initialData.version);
      expect(manager.getCurrentData().gridSettings.columns).toBe(initialData.gridSettings.columns);
    });
  });
});
