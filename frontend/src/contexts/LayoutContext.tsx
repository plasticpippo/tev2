import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import {
  ButtonPosition,
  CategoryLayout,
  TillLayout,
  SharedLayout,
  VariantLayoutPosition
} from '../types/layout.types';
import {
  getTillLayout,
  saveTillLayout,
  resetTillLayout,
  getSharedLayouts,
  createSharedLayout,
  loadSharedLayoutToTill
} from '../../services/layoutService';
import { sanitizeName, SanitizationError } from '../../utils/sanitization';
import { useToast } from '../../contexts/ToastContext';
import { DirtyStateManager } from '../utils/DirtyStateManager';

interface LayoutContextValue {
  // State
  isEditMode: boolean;
  currentCategoryId: number | 'favourites' | 'all';
  currentTillLayout: TillLayout;
  isDirty: boolean;
  isSaving: boolean;
  isLoading: boolean;

  // Actions
  enterEditMode: () => void;
  exitEditMode: () => void;
  setCurrentCategory: (categoryId: number | 'favourites' | 'all') => void;
  updateButtonPosition: (variantId: number, gridColumn: number, gridRow: number) => void;
  saveLayout: () => Promise<void>;
  resetLayout: () => Promise<void>;
  discardChanges: () => void;
  loadLayoutForCategory: (categoryId: number) => Promise<void>;

  // Shared layouts
  sharedLayouts: SharedLayout[];
  refreshSharedLayouts: (categoryId?: number) => Promise<void>;
  saveAsSharedLayout: (name: string) => Promise<void>;
  loadSharedLayout: (sharedLayoutId: number) => Promise<void>;

  // Helpers
  getCurrentCategoryLayout: () => CategoryLayout | undefined;
  getButtonPosition: (variantId: number) => ButtonPosition | undefined;

  // Dirty state tracking (new for BUG-014)
  getDirtyFields: () => string[];
  isFieldDirty: (field: string) => boolean;
}

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

interface LayoutProviderProps {
  children: ReactNode;
  tillId: number | null;
  initialCategoryId?: number | 'favourites' | 'all';
}

// Default/empty layout
const createDefaultLayout = (tillId: number): TillLayout => ({
  tillId: tillId || 0,
  layouts: []
});

export const LayoutProvider: React.FC<LayoutProviderProps> = ({
  children,
  tillId,
  initialCategoryId = 'favourites'
}) => {
  const { addToast } = useToast();

  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<number | 'favourites' | 'all'>(initialCategoryId);
  const [currentTillLayout, setCurrentTillLayout] = useState<TillLayout>(createDefaultLayout(tillId || 0));
  // isDirty is now computed from DirtyStateManager for backward compatibility
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sharedLayouts, setSharedLayouts] = useState<SharedLayout[]>([]);

  // DirtyStateManager for field-level dirty tracking (BUG-014)
  const dirtyStateManagerRef = useRef<DirtyStateManager<TillLayout> | null>(null);

  // Initialize DirtyStateManager
  useEffect(() => {
    dirtyStateManagerRef.current = new DirtyStateManager<TillLayout>(createDefaultLayout(tillId || 0));
  }, []);

  // Update DirtyStateManager and isDirty state when currentTillLayout changes
  const updateDirtyState = useCallback((newLayout: TillLayout) => {
    if (dirtyStateManagerRef.current) {
      dirtyStateManagerRef.current.update(newLayout);
      setIsDirty(dirtyStateManagerRef.current.isDirty());
    }
  }, []);

  // Refs for cleanup and request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Update tillId when it changes
  useEffect(() => {
    if (tillId) {
      setCurrentTillLayout(prev => {
        const newLayout = { ...prev, tillId };
        // Update dirty state after state change
        setTimeout(() => updateDirtyState(newLayout), 0);
        return newLayout;
      });
    }
  }, [tillId, updateDirtyState]);

  // Load layout for a specific category from API - defined before useEffect to avoid hoisting issues
  const loadLayoutForCategory = useCallback(async (categoryId: number | 'favourites') => {
    if (!tillId) return;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    // Capture the controller for this specific request to avoid race conditions
    const currentController = abortControllerRef.current;

    // Convert 'favourites' to special ID
    const categoryIdToFetch = categoryId === 'favourites' ? -1 : categoryId;

    setIsLoading(true);
    try {
      const layouts = await getTillLayout(tillId, categoryIdToFetch, currentController.signal);

      // Don't update state if component unmounted or request was aborted
      if (!isMountedRef.current || currentController.signal.aborted) {
        return;
      }

      const positions: ButtonPosition[] = layouts.map(l => ({
        variantId: l.variantId,
        gridColumn: l.gridColumn,
        gridRow: l.gridRow
      }));

      setCurrentTillLayout(prev => {
        // Update or add the category layout
        const existingIndex = prev.layouts.findIndex(l => l.categoryId === categoryIdToFetch);
        const newLayouts = [...prev.layouts];

        if (existingIndex >= 0) {
          newLayouts[existingIndex] = { categoryId: categoryIdToFetch, positions };
        } else {
          newLayouts.push({ categoryId: categoryIdToFetch, positions });
        }

        const newLayout = { ...prev, layouts: newLayouts };
        
        // Update DirtyStateManager to reflect loaded state as clean
        if (dirtyStateManagerRef.current) {
          dirtyStateManagerRef.current.update(newLayout);
          // Use setTimeout to avoid state updates during render
          setTimeout(() => {
            if (dirtyStateManagerRef.current) {
              setIsDirty(dirtyStateManagerRef.current.isDirty());
            }
          }, 0);
        }
        
        return newLayout;
      });
    } catch (error) {
      // Don't log or update state if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      if (!isMountedRef.current) {
        return;
      }
      console.error('Error loading layout:', error);
    } finally {
      // Only clear loading state if this request wasn't aborted
      // Use the captured controller to avoid race conditions with newer requests
      if (isMountedRef.current && !currentController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [tillId]); // Removed currentTillLayout to prevent infinite loop

  // Load layout when category changes (including favourites)
  useEffect(() => {
    if (currentCategoryId === 'favourites' && tillId) {
      loadLayoutForCategory('favourites');
    } else if (typeof currentCategoryId === 'number' && tillId) {
      loadLayoutForCategory(currentCategoryId);
    }
  }, [currentCategoryId, tillId, loadLayoutForCategory]);

  // Enter edit mode
  const enterEditMode = useCallback(() => {
    setIsEditMode(true);
    // Initialize DirtyStateManager with current state as baseline
    if (dirtyStateManagerRef.current) {
      dirtyStateManagerRef.current.update(currentTillLayout);
      setIsDirty(false);
    }
  }, [currentTillLayout]);

  // Exit edit mode
  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
    // isDirty is now managed by DirtyStateManager
  }, []);

  // Set current category
  const setCurrentCategory = useCallback((categoryId: number | 'favourites' | 'all') => {
    setCurrentCategoryId(categoryId);
  }, []);

  // Get current category layout
  const getCurrentCategoryLayout = useCallback((): CategoryLayout | undefined => {
    // Convert 'favourites' to special ID
    const categoryIdToUse = currentCategoryId === 'favourites'
      ? -1
      : typeof currentCategoryId === 'number'
        ? currentCategoryId
        : undefined;

    if (categoryIdToUse === undefined) return undefined;

    return currentTillLayout.layouts.find(l => l.categoryId === categoryIdToUse);
  }, [currentTillLayout, currentCategoryId]);

  // Get button position for a specific variant
  const getButtonPosition = useCallback((variantId: number): ButtonPosition | undefined => {
    const categoryLayout = getCurrentCategoryLayout();
    return categoryLayout?.positions.find(p => p.variantId === variantId);
  }, [getCurrentCategoryLayout]);

  // Update button position
  const updateButtonPosition = useCallback((
    variantId: number,
    gridColumn: number,
    gridRow: number
  ) => {
    // Convert favourites to -1
    const categoryIdToUse = currentCategoryId === 'favourites'
      ? -1
      : currentCategoryId;

    if (typeof categoryIdToUse !== 'number') {
      console.warn('Cannot update position: currentCategoryId is not valid');
      return;
    }

    setCurrentTillLayout(prevLayout => {
      const newLayouts = prevLayout.layouts.map(categoryLayout => {
        if (categoryLayout.categoryId !== categoryIdToUse) {
          return categoryLayout;
        }

        // Check if position already exists for this variant
        const existingPositionIndex = categoryLayout.positions.findIndex(
          p => p.variantId === variantId
        );

        let newPositions: ButtonPosition[];

        if (existingPositionIndex >= 0) {
          // Update existing position
          newPositions = [...categoryLayout.positions];
          newPositions[existingPositionIndex] = { variantId, gridColumn, gridRow };
        } else {
          // Add new position
          newPositions = [
            ...categoryLayout.positions,
            { variantId, gridColumn, gridRow }
          ];
        }

        return {
          ...categoryLayout,
          positions: newPositions
        };
      });

      // If category doesn't exist yet, add it
      const categoryExists = newLayouts.some(l => l.categoryId === categoryIdToUse);
      if (!categoryExists) {
        newLayouts.push({
          categoryId: categoryIdToUse,
          positions: [{ variantId, gridColumn, gridRow }]
        });
      }

      const newTillLayout = {
        ...prevLayout,
        layouts: newLayouts
      };

      // Update DirtyStateManager with new layouts - verifies values actually changed
      if (dirtyStateManagerRef.current) {
        dirtyStateManagerRef.current.update(newTillLayout);
        setIsDirty(dirtyStateManagerRef.current.isDirty());
      }

      return newTillLayout;
    });
  }, [currentCategoryId]);

  // Save layout to API
  const saveLayout = useCallback(async () => {
    if (!tillId) {
      console.error('Cannot save: missing tillId');
      return;
    }

    // Race condition protection: prevent save if already saving
    if (dirtyStateManagerRef.current?.getIsSaving()) {
      console.warn('Save operation already in progress, skipping');
      return;
    }

    // Convert favourites to -1
    const categoryIdToSave = currentCategoryId === 'favourites'
      ? -1
      : currentCategoryId;

    if (typeof categoryIdToSave !== 'number') {
      console.error('Cannot save: invalid categoryId');
      return;
    }

    const categoryLayout = getCurrentCategoryLayout();
    if (!categoryLayout) {
      console.error('Cannot save: no layout for current category');
      return;
    }

    setIsSaving(true);
    try {
      const positions: VariantLayoutPosition[] = categoryLayout.positions.map(p => ({
        variantId: p.variantId,
        gridColumn: p.gridColumn,
        gridRow: p.gridRow
      }));

      await saveTillLayout(tillId, categoryIdToSave, positions);

      // Use dirtyStateManager.markSaved() with race condition protection
      if (dirtyStateManagerRef.current) {
        await dirtyStateManagerRef.current.markSaved();
        setIsDirty(dirtyStateManagerRef.current.isDirty());
      }

      // Show success message
      const categoryName = currentCategoryId === 'favourites' ? 'Favourites' : 'category';
      addToast(`Layout saved successfully for ${categoryName}!`, 'success');
    } catch (error) {
      console.error('Error saving layout:', error);
      addToast(`Failed to save layout: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [tillId, currentCategoryId, currentTillLayout, getCurrentCategoryLayout, addToast]);

  // Reset layout to default (delete from API)
  const resetLayout = useCallback(async () => {
    if (!tillId) {
      console.error('Cannot reset: missing tillId');
      return;
    }

    // Convert favourites to -1
    const categoryIdToReset = currentCategoryId === 'favourites'
      ? -1
      : currentCategoryId;

    if (typeof categoryIdToReset !== 'number') {
      console.error('Cannot reset: invalid categoryId');
      return;
    }

    setIsSaving(true);
    try {
      await resetTillLayout(tillId, categoryIdToReset);

      // Remove this category from current layout
      setCurrentTillLayout(prev => {
        const newTillLayout = {
          ...prev,
          layouts: prev.layouts.filter(l => l.categoryId !== categoryIdToReset)
        };

        // Update DirtyStateManager with reset data
        if (dirtyStateManagerRef.current) {
          dirtyStateManagerRef.current.reset();
          dirtyStateManagerRef.current.update(newTillLayout);
          setIsDirty(dirtyStateManagerRef.current.isDirty());
        }

        return newTillLayout;
      });

      addToast('Layout reset to default!', 'success');
    } catch (error) {
      console.error('Error resetting layout:', error);
      addToast(`Failed to reset layout: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [tillId, currentCategoryId, addToast]);

  // Discard changes and revert to saved
  const discardChanges = useCallback(() => {
    if (dirtyStateManagerRef.current) {
      // Use dirtyStateManager.discardChanges() to revert to saved state
      dirtyStateManagerRef.current.discardChanges();
      // Update currentTillLayout to match the saved state
      setCurrentTillLayout(dirtyStateManagerRef.current.getCurrentData());
      setIsDirty(dirtyStateManagerRef.current.isDirty());
    }
    exitEditMode();
  }, [exitEditMode]);

  // Get dirty fields array
  const getDirtyFields = useCallback((): string[] => {
    return dirtyStateManagerRef.current?.getDirtyFields() || [];
  }, []);

  // Check if a specific field is dirty
  const isFieldDirty = useCallback((field: string): boolean => {
    return dirtyStateManagerRef.current?.isDirty(field) || false;
  }, []);

  // Refresh shared layouts list
  const refreshSharedLayouts = useCallback(async (categoryId?: number) => {
    try {
      const layouts = await getSharedLayouts(categoryId);
      setSharedLayouts(layouts);
    } catch (error) {
      console.error('Error fetching shared layouts:', error);
    }
  }, []);

  // Save current layout as shared layout
  const saveAsSharedLayout = useCallback(async (name: string) => {
    if (!tillId) {
      console.error('Cannot save as shared: missing tillId');
      return;
    }

    // Sanitize layout name
    let sanitizedName: string;
    try {
      sanitizedName = sanitizeName(name);
    } catch (error) {
      if (error instanceof SanitizationError) {
        addToast(`Invalid layout name: ${error.message}`, 'error');
        return;
      }
      throw error;
    }

    // Convert favourites to -1
    const categoryIdToUse = currentCategoryId === 'favourites'
      ? -1
      : currentCategoryId;

    if (typeof categoryIdToUse !== 'number') {
      console.error('Cannot save as shared: invalid categoryId');
      return;
    }

    const categoryLayout = getCurrentCategoryLayout();
    if (!categoryLayout || categoryLayout.positions.length === 0) {
      addToast('Cannot save empty layout as shared layout', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const positions: VariantLayoutPosition[] = categoryLayout.positions.map(p => ({
        variantId: p.variantId,
        gridColumn: p.gridColumn,
        gridRow: p.gridRow
      }));

      await createSharedLayout(sanitizedName, categoryIdToUse, positions);

      addToast(`Shared layout "${sanitizedName}" created successfully!`, 'success');

      // Refresh shared layouts list
      await refreshSharedLayouts(categoryIdToUse);
    } catch (error) {
      console.error('Error creating shared layout:', error);
      addToast(`Failed to create shared layout: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [tillId, currentCategoryId, getCurrentCategoryLayout, refreshSharedLayouts, addToast]);

  // Load shared layout into current till
  const loadSharedLayout = useCallback(async (sharedLayoutId: number) => {
    if (!tillId) {
      console.error('Cannot load shared layout: missing tillId');
      return;
    }

    setIsSaving(true);
    try {
      const loadedLayouts = await loadSharedLayoutToTill(sharedLayoutId, tillId);

      // Find the category of the loaded layout
      if (loadedLayouts.length > 0) {
        const categoryId = loadedLayouts[0].categoryId;

        // Convert special ID -1 back to 'favourites'
        const categoryToLoad = categoryId === -1 ? 'favourites' : categoryId;

        // Reload the layout for this category
        if (typeof categoryToLoad === 'number' || categoryToLoad === 'favourites') {
          await loadLayoutForCategory(categoryToLoad);

          // Switch to this category
          setCurrentCategory(categoryToLoad);
        }

        addToast('Shared layout loaded successfully!', 'success');
      }
    } catch (error) {
      console.error('Error loading shared layout:', error);
      addToast(`Failed to load shared layout: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [tillId, loadLayoutForCategory, setCurrentCategory, addToast]);

  const value: LayoutContextValue = {
    isEditMode,
    currentCategoryId,
    currentTillLayout,
    isDirty,
    isSaving,
    isLoading,
    enterEditMode,
    exitEditMode,
    setCurrentCategory,
    updateButtonPosition,
    saveLayout,
    resetLayout,
    discardChanges,
    loadLayoutForCategory,
    sharedLayouts,
    refreshSharedLayouts,
    saveAsSharedLayout,
    loadSharedLayout,
    getCurrentCategoryLayout,
    getButtonPosition,
    getDirtyFields,
    isFieldDirty
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};

// Custom hook to use layout context
export const useLayout = (): LayoutContextValue => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
