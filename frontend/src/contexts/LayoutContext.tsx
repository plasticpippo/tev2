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
}

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

interface LayoutProviderProps {
  children: ReactNode;
  tillId: number | null;
  initialCategoryId?: number | 'favourites' | 'all';
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ 
  children, 
  tillId,
  initialCategoryId = 'favourites'
}) => {
  const { addToast } = useToast();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState<number | 'favourites' | 'all'>(initialCategoryId);
  const [currentTillLayout, setCurrentTillLayout] = useState<TillLayout>({
    tillId: tillId || 0,
    layouts: []
  });
  const [savedTillLayout, setSavedTillLayout] = useState<TillLayout>({
    tillId: tillId || 0,
    layouts: []
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sharedLayouts, setSharedLayouts] = useState<SharedLayout[]>([]);

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
      setCurrentTillLayout(prev => ({ ...prev, tillId }));
      setSavedTillLayout(prev => ({ ...prev, tillId }));
    }
  }, [tillId]);

  // Load layout for a specific category from API - defined before useEffect to avoid hoisting issues
  const loadLayoutForCategory = useCallback(async (categoryId: number | 'favourites') => {
    if (!tillId) return;

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    // Convert 'favourites' to special ID
    const categoryIdToFetch = categoryId === 'favourites' ? -1 : categoryId;

    setIsLoading(true);
    try {
      const layouts = await getTillLayout(tillId, categoryIdToFetch, abortControllerRef.current.signal);

      // Don't update state if component unmounted or request was aborted
      if (!isMountedRef.current || abortControllerRef.current.signal.aborted) {
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

        return { ...prev, layouts: newLayouts };
      });

      setSavedTillLayout(prev => {
        const existingIndex = prev.layouts.findIndex(l => l.categoryId === categoryIdToFetch);
        const newLayouts = [...prev.layouts];

        if (existingIndex >= 0) {
          newLayouts[existingIndex] = { categoryId: categoryIdToFetch, positions };
        } else {
          newLayouts.push({ categoryId: categoryIdToFetch, positions });
        }

        return { ...prev, layouts: newLayouts };
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
      if (isMountedRef.current && !abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [tillId]);

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
    setIsDirty(false);
  }, []);

  // Exit edit mode
  const exitEditMode = useCallback(() => {
    setIsEditMode(false);
    setIsDirty(false);
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

      return {
        ...prevLayout,
        layouts: newLayouts
      };
    });

    setIsDirty(true);
  }, [currentCategoryId]);

  // Save layout to API
  const saveLayout = useCallback(async () => {
    if (!tillId) {
      console.error('Cannot save: missing tillId');
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
      
      // Update saved layout to match current
      setSavedTillLayout(currentTillLayout);
      setIsDirty(false);
      
      // Show success message
      const categoryName = currentCategoryId === 'favourites' ? 'Favourites' : 'category';
      addToast(`Layout saved successfully for ${categoryName}!`, 'success');
    } catch (error) {
      console.error('Error saving layout:', error);
      addToast(`Failed to save layout: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [tillId, currentCategoryId, currentTillLayout, getCurrentCategoryLayout]);

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
      
      // Remove this category from current and saved layouts
      setCurrentTillLayout(prev => ({
        ...prev,
        layouts: prev.layouts.filter(l => l.categoryId !== categoryIdToReset)
      }));
      
      setSavedTillLayout(prev => ({
        ...prev,
        layouts: prev.layouts.filter(l => l.categoryId !== categoryIdToReset)
      }));
      
      setIsDirty(false);
      addToast('Layout reset to default!', 'success');
    } catch (error) {
      console.error('Error resetting layout:', error);
      addToast(`Failed to reset layout: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }, [tillId, currentCategoryId]);

  // Discard changes and revert to saved
  const discardChanges = useCallback(() => {
    setCurrentTillLayout(savedTillLayout);
    setIsDirty(false);
    exitEditMode();
  }, [savedTillLayout, exitEditMode]);

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
  }, [tillId, currentCategoryId, getCurrentCategoryLayout, refreshSharedLayouts]);

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
  }, [tillId, loadLayoutForCategory, setCurrentCategory]);

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
    getButtonPosition
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