import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Save status types for tracking the autosave lifecycle
 */
export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Options for configuring the useAutosave hook
 */
export interface UseAutosaveOptions<T> {
  /** Debounce delay in milliseconds (default: 2000ms) */
  debounceMs?: number;
  /** Callback function to execute when saving data */
  onSave?: (data: T) => Promise<void>;
  /** Callback function called when an error occurs during save */
  onError?: (error: Error) => void;
  /** Callback function called when save completes successfully */
  onSuccess?: () => void;
}

/**
 * Return type for the useAutosave hook
 */
export interface UseAutosaveReturn {
  /** Current save status */
  status: AutosaveStatus;
  /** Timestamp of the last successful save */
  lastSavedAt: Date | null;
  /** Error object if the last save failed */
  error: Error | null;
  /** Manually trigger a save operation */
  triggerSave: () => void;
  /** Cancel any pending save operation */
  cancelPendingSave: () => void;
}

/**
 * Custom hook for autosaving data with debouncing and dirty state management.
 *
 * This hook addresses performance issues by:
 * - Debouncing save operations to prevent excessive API calls
 * - Tracking save status throughout the lifecycle
 * - Canceling pending saves on unmount to prevent memory leaks
 * - Only triggering saves when data is dirty
 * - Providing manual save triggers for immediate persistence
 *
 * @template T - The type of data being saved
 * @param data - The data to autosave
 * @param isDirty - Whether the data has unsaved changes
 * @param options - Configuration options for the autosave behavior
 * @returns Object containing save status and control functions
 *
 * @example
 * ```typescript
 * const { status, lastSavedAt, error, triggerSave, cancelPendingSave } = useAutosave(
 *   formData,
 *   dirtyStateManager.isDirty(),
 *   {
 *     debounceMs: 2000,
 *     onSave: async (data) => {
 *       await api.save(data);
 *       dirtyStateManager.markSaved();
 *     },
 *     onError: (err) => console.error('Save failed:', err),
 *     onSuccess: () => console.log('Saved successfully'),
 *   }
 * );
 * ```
 */
export function useAutosave<T>(
  data: T,
  isDirty: boolean,
  options: UseAutosaveOptions<T>
): UseAutosaveReturn {
  const { debounceMs = 2000, onSave, onError, onSuccess } = options;

  // State for tracking save status and metadata
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Refs for managing the debounce timeout and abort controller
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const pendingDataRef = useRef<T | null>(null);
  const isSavingRef = useRef(false);

  /**
   * Cancel any pending save operation
   */
  const cancelPendingSave = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    pendingDataRef.current = null;

    // Only reset status if we're not currently saving
    if (!isSavingRef.current && isMountedRef.current) {
      setStatus('idle');
    }
  }, []);

  /**
   * Execute the save operation
   */
  const executeSave = useCallback(
    async (dataToSave: T) => {
      if (!onSave || isSavingRef.current) {
        return;
      }

      // Abort any previous save operation
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      isSavingRef.current = true;

      if (isMountedRef.current) {
        setStatus('saving');
        setError(null);
      }

      try {
        await onSave(dataToSave);

        // Check if the component is still mounted and the operation wasn't aborted
        if (isMountedRef.current && !abortControllerRef.current.signal.aborted) {
          setStatus('saved');
          setLastSavedAt(new Date());
          setError(null);
          onSuccess?.();
        }
      } catch (err) {
        // Check if the component is still mounted and the operation wasn't aborted
        if (isMountedRef.current && !abortControllerRef.current.signal.aborted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setStatus('error');
          setError(error);
          onError?.(error);
        }
      } finally {
        isSavingRef.current = false;
        abortControllerRef.current = null;
      }
    },
    [onSave, onError, onSuccess]
  );

  /**
   * Manually trigger a save operation
   */
  const triggerSave = useCallback(() => {
    // Cancel any pending debounced save
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    // Only save if dirty
    if (isDirty) {
      executeSave(data);
    }
  }, [data, isDirty, executeSave]);

  /**
   * Effect to handle data changes and trigger debounced saves
   */
  useEffect(() => {
    // Reset mounted flag when effect re-runs (shouldn't happen often for this hook)
    isMountedRef.current = true;

    // Only trigger autosave if data is dirty and we have a save handler
    if (!isDirty || !onSave) {
      return;
    }

    // Don't schedule a new save if one is already in progress
    // The pending data will be saved after the current operation completes
    if (isSavingRef.current) {
      pendingDataRef.current = data;
      return;
    }

    // Cancel any existing pending save
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Schedule a new debounced save
    debounceTimeoutRef.current = setTimeout(() => {
      debounceTimeoutRef.current = null;
      executeSave(data);
    }, debounceMs);

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [data, isDirty, debounceMs, onSave, executeSave]);

  /**
   * Effect to handle pending saves after a save operation completes
   */
  useEffect(() => {
    // If we have pending data and we're not currently saving, save it
    if (pendingDataRef.current && !isSavingRef.current && isDirty) {
      const pendingData = pendingDataRef.current;
      pendingDataRef.current = null;
      executeSave(pendingData);
    }
  }, [status, isDirty, executeSave]);

  /**
   * Effect to handle component unmount
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      cancelPendingSave();
    };
  }, [cancelPendingSave]);

  return {
    status,
    lastSavedAt,
    error,
    triggerSave,
    cancelPendingSave,
  };
}

export default useAutosave;
