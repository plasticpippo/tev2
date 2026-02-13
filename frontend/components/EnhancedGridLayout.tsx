import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { produce } from 'immer';
import { useTranslation } from 'react-i18next';
import EnhancedGridCanvas from './EnhancedGridCanvas';
import EnhancedGridItem from './EnhancedGridItem';
import type { ProductVariant } from '../../shared/types';
import HelpGuide from './HelpGuide';

// Enhanced interfaces based on the plan
export interface EnhancedGridItemData {
  id: string;
  variantId: number;
  productId: number;
  name: string;
  price: number;
  backgroundColor: string;
  textColor: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  borderRadius?: number;
  zIndex?: number;
  locked?: boolean;
}

export interface EnhancedProductGridLayout {
  id?: string | number;
  name: string;
  tillId: number;
  columns: number;
  gridSize: { width: number; height: number };
  gutter: number;
  containerPadding: { x: number; y: number };
  version: string;
  gridItems: EnhancedGridItemData[];
  isDefault: boolean;
  filterType?: 'all' | 'favorites' | 'category';
  categoryId?: number | null;
  metadata?: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    lastModifiedBy: string;
  };
}

interface HistoryEntry {
  timestamp: Date;
  action: 'add' | 'remove' | 'move' | 'resize' | 'update' | 'clear';
  beforeState: EnhancedProductGridLayout;
  afterState: EnhancedProductGridLayout;
  affectedItems: string[];
}

class LayoutHistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex: number = -1;
  
  push(entry: HistoryEntry): void {
    // Remove any redo history if we're not at the end
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }
    
    this.history.push(entry);
    this.currentIndex = this.history.length - 1;
    
    // Limit history to prevent memory issues
    if (this.history.length > 50) {
      this.history.shift();
      this.currentIndex--;
    }
  }
  
  undo(): HistoryEntry | null {
    if (this.canUndo()) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }
  
  redo(): HistoryEntry | null {
    if (this.canRedo()) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }
  
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }
  
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }
  
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}

interface EnhancedGridLayoutProps {
  layout: EnhancedProductGridLayout;
  onUpdateLayout: (updatedLayout: EnhancedProductGridLayout) => void;
  disabled?: boolean;
  showGridLines?: boolean;
  snapToGrid?: boolean;
  enableKeyboardNavigation?: boolean;
  enableHistory?: boolean;
}

const EnhancedGridLayout: React.FC<EnhancedGridLayoutProps> = ({
  layout,
  onUpdateLayout,
  disabled = false,
  showGridLines = true,
  snapToGrid = true,
  enableKeyboardNavigation = true,
  enableHistory = true,
}) => {
  const { t } = useTranslation();
  const [historyManager] = useState(() => new LayoutHistoryManager());
  const [isDragging, setIsDragging] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Memoize grid items to prevent unnecessary re-renders
  const memoizedGridItems = useMemo(() => layout.gridItems, [layout.gridItems]);

  // Reset history when layout changes externally (e.g., loading a different saved layout)
  const previousLayoutIdRef = useRef<string | number | undefined>(layout.id);
  useEffect(() => {
    const currentLayoutId = layout.id;
    if (currentLayoutId !== previousLayoutIdRef.current) {
      historyManager.clear();
      previousLayoutIdRef.current = currentLayoutId;
    }
  }, [layout.id, historyManager]);

  // Deep copy helper for layout state using Immer for better performance
  const deepCopyLayout = useCallback((layoutToCopy: EnhancedProductGridLayout): EnhancedProductGridLayout => {
    return produce(layoutToCopy, draft => {
      // No mutations needed - Immer creates an efficient immutable copy
    });
  }, []);

  // Save state to history for undo/redo functionality
  const saveToHistory = useCallback((action: HistoryEntry['action'], affectedItems: string[], beforeState: EnhancedProductGridLayout, afterState: EnhancedProductGridLayout) => {
    if (!enableHistory) return;

    const newEntry: HistoryEntry = {
      timestamp: new Date(),
      action,
      beforeState,
      afterState,
      affectedItems,
    };

    historyManager.push(newEntry);
  }, [enableHistory, historyManager]);

  // Handle moving an item on the grid
  const handleMoveItem = useCallback((id: string, newX: number, newY: number) => {
    if (disabled) return;

    // Capture state BEFORE mutation
    const beforeState = deepCopyLayout(layout);

    const updatedItems = layout.gridItems.map(item =>
      item.id === id ? { ...item, x: Math.max(0, newX), y: Math.max(0, newY) } : item
    );

    const updatedLayout = { ...layout, gridItems: updatedItems };
    onUpdateLayout(updatedLayout);

    // Capture state AFTER mutation
    const afterState = deepCopyLayout(updatedLayout);
    saveToHistory('move', [id], beforeState, afterState);
  }, [layout, onUpdateLayout, disabled, saveToHistory, deepCopyLayout]);

  // Handle updating an item's properties
  const handleUpdateItem = useCallback((id: string, updates: Partial<EnhancedGridItemData>) => {
    if (disabled) return;

    // Capture state BEFORE mutation
    const beforeState = deepCopyLayout(layout);

    const updatedItems = layout.gridItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );

    const updatedLayout = { ...layout, gridItems: updatedItems };
    onUpdateLayout(updatedLayout);

    // Capture state AFTER mutation
    const afterState = deepCopyLayout(updatedLayout);
    saveToHistory('update', [id], beforeState, afterState);
  }, [layout, onUpdateLayout, disabled, saveToHistory, deepCopyLayout]);

  // Handle resizing an item
  const handleResizeItem = useCallback((id: string, updates: Partial<EnhancedGridItemData>) => {
    if (disabled) return;

    // Capture state BEFORE mutation
    const beforeState = deepCopyLayout(layout);

    const updatedItems = layout.gridItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );

    const updatedLayout = { ...layout, gridItems: updatedItems };
    onUpdateLayout(updatedLayout);

    // Capture state AFTER mutation
    const afterState = deepCopyLayout(updatedLayout);
    saveToHistory('resize', [id], beforeState, afterState);
  }, [layout, onUpdateLayout, disabled, saveToHistory, deepCopyLayout]);

  // Handle adding a new item to the grid
  const handleAddItem = useCallback((item: Omit<EnhancedGridItemData, 'id' | 'x' | 'y'>, x: number, y: number) => {
    if (disabled) return;

    // Capture state BEFORE mutation
    const beforeState = deepCopyLayout(layout);

    const newItem: EnhancedGridItemData = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: Math.max(0, x),
      y: Math.max(0, y),
    };

    const updatedItems = [...layout.gridItems, newItem];
    const updatedLayout = { ...layout, gridItems: updatedItems };
    onUpdateLayout(updatedLayout);

    // Capture state AFTER mutation
    const afterState = deepCopyLayout(updatedLayout);
    saveToHistory('add', [newItem.id], beforeState, afterState);
  }, [layout, onUpdateLayout, disabled, saveToHistory, deepCopyLayout]);

  // Handle removing an item from the grid
  const handleRemoveItem = useCallback((id: string) => {
    if (disabled) return;

    // Capture state BEFORE mutation
    const beforeState = deepCopyLayout(layout);

    const updatedItems = layout.gridItems.filter(item => item.id !== id);
    const updatedLayout = { ...layout, gridItems: updatedItems };
    onUpdateLayout(updatedLayout);

    // Capture state AFTER mutation
    const afterState = deepCopyLayout(updatedLayout);
    saveToHistory('remove', [id], beforeState, afterState);
  }, [layout, onUpdateLayout, disabled, saveToHistory, deepCopyLayout]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enableKeyboardNavigation) return;

    // Undo/Redo shortcuts
    if (e.ctrlKey) {
      switch (e.key) {
        case 'z':
          if (!e.shiftKey) {
            e.preventDefault();
            handleUndoRef.current();
          } else {
            // Redo with Ctrl+Shift+Z
            e.preventDefault();
            handleRedoRef.current();
          }
          break;
        case 'y':
          // Redo with Ctrl+Y
          e.preventDefault();
          handleRedoRef.current();
          break;
        case '+':
        case '=':
          e.preventDefault();
          setZoomLevel(prev => Math.min(prev + 0.1, 2)); // Max 200% zoom
          break;
        case '-':
          e.preventDefault();
          setZoomLevel(prev => Math.max(prev - 0.1, 0.5)); // Min 50% zoom
          break;
        case '0':
          e.preventDefault();
          setZoomLevel(1); // Reset zoom
          break;
      }
    }

    // Move selected item with arrow keys
    // Check if event was already handled to prevent duplicate processing
    if (e.defaultPrevented) return;
    
    if (selectedItem && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const currentGridItems = layoutGridItemsRef.current;
      const item = currentGridItems.find((i: EnhancedGridItemData) => i.id === selectedItem);
      if (item) {
        let newX = item.x;
        let newY = item.y;
        const moveAmount = e.shiftKey ? 2 : 1; // Larger moves with shift

        switch (e.key) {
          case 'ArrowUp':
            newY = Math.max(0, item.y - moveAmount);
            break;
          case 'ArrowDown':
            newY = item.y + moveAmount;
            break;
          case 'ArrowLeft':
            newX = Math.max(0, item.x - moveAmount);
            break;
          case 'ArrowRight':
            newX = item.x + moveAmount;
            break;
        }

        handleMoveItemRef.current(selectedItem, newX, newY);
      }
    }
  }, [selectedItem, enableKeyboardNavigation]);

  // Handle undo action
  const handleUndo = useCallback(() => {
    const entry = historyManager.undo();
    if (entry) {
      onUpdateLayout(entry.beforeState);
    }
  }, [historyManager, onUpdateLayout]);

  // Handle redo action
  const handleRedo = useCallback(() => {
    const entry = historyManager.redo();
    if (entry) {
      onUpdateLayout(entry.afterState);
    }
  }, [historyManager, onUpdateLayout]);

  // Handle clear grid
  const handleClearGrid = useCallback(() => {
    if (disabled) return;

    // Capture state BEFORE mutation
    const beforeState = deepCopyLayout(layout);

    const updatedLayout = { ...layout, gridItems: [] };
    onUpdateLayout(updatedLayout);

    // Capture state AFTER mutation
    const afterState = deepCopyLayout(updatedLayout);
    saveToHistory('clear', [], beforeState, afterState);
  }, [layout, onUpdateLayout, disabled, saveToHistory, deepCopyLayout]);

  // Use refs to avoid stale closure issues with keyboard handler
  const handleUndoRef = useRef(handleUndo);
  const handleRedoRef = useRef(handleRedo);
  const handleMoveItemRef = useRef(handleMoveItem);
  const layoutGridItemsRef = useRef(layout.gridItems);

  useEffect(() => {
    handleUndoRef.current = handleUndo;
    handleRedoRef.current = handleRedo;
    handleMoveItemRef.current = handleMoveItem;
    layoutGridItemsRef.current = layout.gridItems;
  }, [handleUndo, handleRedo, handleMoveItem, layout.gridItems]);

  return (
    <div
      className="bg-slate-700 p-4 rounded-lg"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-amber-200 flex items-center">
          {t('enhancedGridLayout.title')}
          <HelpGuide feature="grid-layout" title={t('enhancedGridLayout.help.gridLayoutTitle')} description={t('enhancedGridLayout.help.gridLayoutDescription')} position="right" />
        </h3>
        
        {/* Toolbar with undo/redo and zoom controls */}
        <div className="flex space-x-2">
          <button
            onClick={handleUndo}
            disabled={!historyManager.canUndo() || disabled}
            className={`px-3 py-1 rounded ${historyManager.canUndo() && !disabled
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'} transition-colors duration-200 flex items-center`}
            aria-label={t('enhancedGridLayout.undo')}
          >
            ↶ {t('enhancedGridLayout.undo')}
            <HelpGuide feature="undo-redo" title={t('enhancedGridLayout.help.undoTitle')} description={t('enhancedGridLayout.help.undoDescription')} position="bottom" />
          </button>
          
          <button
            onClick={handleRedo}
            disabled={!historyManager.canRedo() || disabled}
            className={`px-3 py-1 rounded ${historyManager.canRedo() && !disabled
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'} transition-colors duration-200 flex items-center`}
            aria-label={t('enhancedGridLayout.redo')}
          >
            ↷ {t('enhancedGridLayout.redo')}
            <HelpGuide feature="undo-redo" title={t('enhancedGridLayout.help.redoTitle')} description={t('enhancedGridLayout.help.redoDescription')} position="bottom" />
          </button>
          
          <button
            onClick={() => setZoomLevel(1)}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors duration-200 flex items-center"
            aria-label={t('enhancedGridLayout.resetZoom')}
          >
            {Math.round(zoomLevel * 100)}%
            <HelpGuide feature="zoom" title={t('enhancedGridLayout.help.zoomTitle')} description={t('enhancedGridLayout.help.zoomDescription')} position="bottom" />
          </button>
          
          <button
            onClick={handleClearGrid}
            disabled={disabled || layout.gridItems.length === 0}
            className={`px-3 py-1 rounded ${!disabled && layout.gridItems.length > 0
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'} transition-colors duration-200 flex items-center`}
            aria-label={t('enhancedGridLayout.clear')}
          >
            {t('enhancedGridLayout.clear')}
            <HelpGuide feature="clear-grid" title={t('enhancedGridLayout.help.clearGridTitle')} description={t('enhancedGridLayout.help.clearGridDescription')} position="bottom" />
          </button>
        </div>
      </div>
      
      <div
        className="overflow-auto"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
      >
        <EnhancedGridCanvas
          gridItems={memoizedGridItems}
          handleMoveItem={handleMoveItem}
          handleUpdateItem={handleUpdateItem}
          handleResizeItem={handleResizeItem}
          columns={layout.columns}
          gridSize={layout.gridSize}
          gutter={layout.gutter}
          containerPadding={layout.containerPadding}
          snapToGrid={snapToGrid}
          showGridLines={showGridLines}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setIsDragging(false)}
          disabled={disabled}
        />
      </div>
      
      <div className="mt-2 text-sm text-slate-400 flex justify-between">
        <span className="flex items-center">
          {t('enhancedGridLayout.dragDropInfo')}
          <HelpGuide feature="drag-and-drop" title={t('enhancedGridLayout.help.dragDropTitle')} description={t('enhancedGridLayout.help.dragDropDescription')} position="top" />
        </span>
        <span className="flex items-center">
          {t('enhancedGridLayout.keyboardInfo')}
          <HelpGuide feature="keyboard-nav" title={t('enhancedGridLayout.help.keyboardNavTitle')} description={t('enhancedGridLayout.help.keyboardNavDescription')} position="top" />
        </span>
      </div>
    </div>
  );
};

export default EnhancedGridLayout;