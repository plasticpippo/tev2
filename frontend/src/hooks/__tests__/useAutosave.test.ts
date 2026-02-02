import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutosave } from '../useAutosave';

describe('useAutosave', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with idle status', () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ name: 'test' }, false, { onSave })
      );

      expect(result.current.status).toBe('idle');
      expect(result.current.lastSavedAt).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should not call onSave when isDirty is false', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { rerender } = renderHook(
        ({ data, isDirty }) => useAutosave(data, isDirty, { onSave, debounceMs: 50 }),
        {
          initialProps: { data: { name: 'test' }, isDirty: false },
        }
      );

      // Change data but keep isDirty false
      rerender({ data: { name: 'changed' }, isDirty: false });

      // Wait for potential save
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Debouncing', () => {
    it('should debounce save operations with default 2000ms delay', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      // Change data multiple times rapidly
      rerender({ data: { name: 'change1' } });
      rerender({ data: { name: 'change2' } });
      rerender({ data: { name: 'change3' } });

      // Should not have called onSave yet (before debounce)
      expect(onSave).not.toHaveBeenCalled();

      // Wait for debounce (2000ms default)
      await new Promise(resolve => setTimeout(resolve, 2100));

      // Should only call onSave once with the final data
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({ name: 'change3' });
    });

    it('should use custom debounceMs when provided', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, debounceMs: 100 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      rerender({ data: { name: 'changed' } });

      // Should not call before custom debounce time
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(onSave).not.toHaveBeenCalled();

      // Wait remaining time
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should reset debounce timer when data changes', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, debounceMs: 200 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      // First change
      rerender({ data: { name: 'change1' } });

      // Wait almost full debounce time
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(onSave).not.toHaveBeenCalled();

      // Second change resets timer
      rerender({ data: { name: 'change2' } });

      // Wait another 150ms (total 300ms from first change, but only 150ms from second)
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(onSave).not.toHaveBeenCalled();

      // Wait full 200ms from second change
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({ name: 'change2' });
    });
  });

  describe('Save Status Tracking', () => {
    it('should transition through status states on successful save', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result, rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, debounceMs: 100 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      expect(result.current.status).toBe('idle');

      // Trigger save
      rerender({ data: { name: 'changed' } });

      // During debounce, still idle
      expect(result.current.status).toBe('idle');

      // Wait for debounce and save to complete
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be saved
      expect(result.current.status).toBe('saved');
      expect(result.current.lastSavedAt).not.toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should set status to saving during save operation', async () => {
      let resolveSave: (() => void) = () => {};
      const onSave = vi.fn().mockImplementation(() => {
        return new Promise<void>((resolve) => {
          resolveSave = resolve;
        });
      });

      const { result, rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, debounceMs: 50 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      rerender({ data: { name: 'changed' } });

      // Wait for debounce to trigger save
      await new Promise(resolve => setTimeout(resolve, 100));

      // Status should be saving while promise is pending
      expect(result.current.status).toBe('saving');

      // Resolve the save
      resolveSave();
      await new Promise(resolve => setTimeout(resolve, 50));

      // Status should be saved
      expect(result.current.status).toBe('saved');
    });

    it('should set status to error on save failure', async () => {
      const saveError = new Error('Save failed');
      const onSave = vi.fn().mockRejectedValue(saveError);

      const { result, rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, debounceMs: 50 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      rerender({ data: { name: 'changed' } });

      // Wait for debounce and error to be set
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBe(saveError);
    });
  });

  describe('Dirty State Integration', () => {
    it('should only save when isDirty is true', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { rerender } = renderHook(
        ({ data, isDirty }) => useAutosave(data, isDirty, { onSave, debounceMs: 50 }),
        {
          initialProps: { data: { name: 'test' }, isDirty: false },
        }
      );

      // Change with isDirty = false
      rerender({ data: { name: 'change1' }, isDirty: false });

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(onSave).not.toHaveBeenCalled();

      // Now set isDirty = true and change data
      rerender({ data: { name: 'change2' }, isDirty: true });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({ name: 'change2' });
    });

    it('should reset save trigger when data changes from dirty to clean', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { rerender } = renderHook(
        ({ data, isDirty }) => useAutosave(data, isDirty, { onSave, debounceMs: 200 }),
        {
          initialProps: { data: { name: 'test' }, isDirty: true },
        }
      );

      // Change data (starts debounce)
      rerender({ data: { name: 'changed' }, isDirty: true });

      // Mark as clean before debounce completes
      rerender({ data: { name: 'changed' }, isDirty: false });

      await new Promise(resolve => setTimeout(resolve, 300));

      // Should not save since isDirty is now false
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Manual Save Trigger', () => {
    it('should immediately trigger save when triggerSave is called', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ name: 'test' }, true, { onSave, debounceMs: 100 })
      );

      // triggerSave should skip the debounce - call synchronously then wait
      result.current.triggerSave();

      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({ name: 'test' });
    });

    it('should cancel pending debounce when triggerSave is called', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result, rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, debounceMs: 500 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      // Start a debounced save
      rerender({ data: { name: 'change1' } });

      // Wait a bit but not full debounce
      await new Promise(resolve => setTimeout(resolve, 200));

      // Trigger manual save
      await act(async () => {
        result.current.triggerSave();
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // Should only save once (manual), not twice
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should not trigger save with triggerSave when isDirty is false', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() =>
        useAutosave({ name: 'test' }, false, { onSave })
      );

      await act(async () => {
        result.current.triggerSave();
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Cancellation', () => {
    it('should cancel pending save when cancelPendingSave is called', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { result, rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, debounceMs: 500 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      // Start a debounced save
      rerender({ data: { name: 'changed' } });

      // Cancel it
      await act(async () => {
        result.current.cancelPendingSave();
      });

      // Wait full debounce time
      await new Promise(resolve => setTimeout(resolve, 600));

      expect(onSave).not.toHaveBeenCalled();
    });

    it('should cancel pending save on unmount', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { rerender, unmount } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, debounceMs: 500 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      // Start a debounced save
      rerender({ data: { name: 'changed' } });

      // Unmount before debounce completes
      unmount();

      // Wait full debounce time
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should not call onSave after unmount
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('Callbacks', () => {
    it('should call onSuccess after successful save', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const onSuccess = vi.fn();

      const { rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, onSuccess, debounceMs: 50 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      rerender({ data: { name: 'changed' } });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it('should call onError when save fails', async () => {
      const saveError = new Error('Save failed');
      const onSave = vi.fn().mockRejectedValue(saveError);
      const onError = vi.fn();

      const { rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, onError, debounceMs: 50 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      rerender({ data: { name: 'changed' } });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(saveError);
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid successive saves', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const { rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, debounceMs: 100 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      // Rapid changes
      for (let i = 0; i < 10; i++) {
        rerender({ data: { name: `change${i}` } });
      }

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 200));

      // Should only save once with final value
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalledWith({ name: 'change9' });
    });

    it('should handle save errors gracefully', async () => {
      const onSave = vi.fn().mockRejectedValue(new Error('Network error'));
      const onError = vi.fn();

      const { result, rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, onError, debounceMs: 50 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      rerender({ data: { name: 'changed' } });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('Network error');
      expect(onError).toHaveBeenCalled();
    });

    it('should handle non-Error rejections', async () => {
      const onSave = vi.fn().mockRejectedValue('String error');
      const onError = vi.fn();

      const { result, rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, onError, debounceMs: 50 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      rerender({ data: { name: 'changed' } });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.status).toBe('error');
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error?.message).toBe('String error');
      expect(onError).toHaveBeenCalled();
    });

    it('should work without optional callbacks', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, debounceMs: 50 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      rerender({ data: { name: 'changed' } });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.status).toBe('saved');
    });

    it('should handle null onSave gracefully', async () => {
      const { result, rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { debounceMs: 50 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      rerender({ data: { name: 'changed' } });

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should not throw and should remain idle since no onSave is provided
      expect(result.current.status).toBe('idle');
    });

    it('should update lastSavedAt timestamp on successful save', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const beforeSave = Date.now();

      const { result, rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, debounceMs: 50 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      rerender({ data: { name: 'changed' } });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.lastSavedAt).not.toBeNull();
      expect(result.current.lastSavedAt!.getTime()).toBeGreaterThanOrEqual(beforeSave);
    });

    it('should maintain error state until next successful save', async () => {
      let shouldFail = true;
      const onSave = vi.fn().mockImplementation(() => {
        if (shouldFail) {
          return Promise.reject(new Error('Save failed'));
        }
        return Promise.resolve();
      });

      const { result, rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, debounceMs: 50 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      // First save fails
      rerender({ data: { name: 'change1' } });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.status).toBe('error');
      expect(result.current.error).not.toBeNull();

      // Next save succeeds
      shouldFail = false;
      rerender({ data: { name: 'change2' } });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.status).toBe('saved');
      expect(result.current.error).toBeNull();
    });

    it('should handle complex data types', async () => {
      interface ComplexData {
        nested: { value: number };
        array: string[];
        date: Date;
      }

      const onSave = vi.fn().mockResolvedValue(undefined);
      const initialData: ComplexData = {
        nested: { value: 1 },
        array: ['a', 'b'],
        date: new Date('2024-01-01'),
      };

      const { rerender } = renderHook(
        ({ data }) => useAutosave<ComplexData>(data, true, { onSave, debounceMs: 50 }),
        {
          initialProps: { data: initialData },
        }
      );

      const newData: ComplexData = {
        nested: { value: 2 },
        array: ['a', 'b', 'c'],
        date: new Date('2024-01-02'),
      };

      rerender({ data: newData });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onSave).toHaveBeenCalledWith(newData);
    });
  });

  describe('Integration with DirtyStateManager pattern', () => {
    it('should work with dirty state manager workflow', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      const onSuccess = vi.fn();

      // Simulate DirtyStateManager behavior
      let isDirty = false;
      let currentData = { name: 'initial' };

      const { result, rerender } = renderHook(
        ({ data, dirty }) => useAutosave(data, dirty, { onSave, onSuccess, debounceMs: 50 }),
        {
          initialProps: { data: currentData, dirty: isDirty },
        }
      );

      // User makes changes (simulating DirtyStateManager.update())
      isDirty = true;
      currentData = { name: 'modified' };
      rerender({ data: currentData, dirty: isDirty });

      // Should start debouncing
      expect(result.current.status).toBe('idle');

      // Wait for autosave
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should be saved
      expect(result.current.status).toBe('saved');
      expect(onSave).toHaveBeenCalledWith({ name: 'modified' });
      expect(onSuccess).toHaveBeenCalled();

      // Simulate DirtyStateManager.markSaved() - data is now clean
      isDirty = false;
      rerender({ data: currentData, dirty: isDirty });

      // Make more changes
      isDirty = true;
      currentData = { name: 'modified again' };
      rerender({ data: currentData, dirty: isDirty });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onSave).toHaveBeenCalledTimes(2);
      expect(onSave).toHaveBeenLastCalledWith({ name: 'modified again' });
    });

    it('should allow manual save before debounce completes', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ data }) => useAutosave(data, true, { onSave, debounceMs: 5000 }),
        {
          initialProps: { data: { name: 'test' } },
        }
      );

      // Make changes
      rerender({ data: { name: 'changed' } });

      // Immediately trigger manual save (like pressing Ctrl+S)
      await act(async () => {
        result.current.triggerSave();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(onSave).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe('saved');
    });
  });
});
