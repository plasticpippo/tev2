import React, { useState, useCallback, useMemo } from 'react';
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
  const [historyManager] = useState(() => new LayoutHistoryManager());
  const [isDragging, setIsDragging] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Memoize grid items to prevent unnecessary re-renders
  const memoizedGridItems = useMemo(() => layout.gridItems, [layout.gridItems]);

  // Save state to history for undo/redo functionality
  const saveToHistory = useCallback((action: HistoryEntry['action'], affectedItems: string[]) => {
    if (!enableHistory) return;
    
    const newEntry: HistoryEntry = {
      timestamp: new Date(),
      action,
      beforeState: layout,
      afterState: { ...layout, gridItems: [...layout.gridItems] },
      affectedItems,
    };
    
    historyManager.push(newEntry);
  }, [layout, enableHistory, historyManager]);

  // Handle moving an item on the grid
  const handleMoveItem = useCallback((id: string, newX: number, newY: number) => {
    if (disabled) return;
    
    const updatedItems = layout.gridItems.map(item =>
      item.id === id ? { ...item, x: Math.max(0, newX), y: Math.max(0, newY) } : item
    );
    
    const updatedLayout = { ...layout, gridItems: updatedItems };
    onUpdateLayout(updatedLayout);
    saveToHistory('move', [id]);
  }, [layout, onUpdateLayout, disabled, saveToHistory]);

  // Handle updating an item's properties
  const handleUpdateItem = useCallback((id: string, updates: Partial<EnhancedGridItemData>) => {
    if (disabled) return;
    
    const updatedItems = layout.gridItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    
    const updatedLayout = { ...layout, gridItems: updatedItems };
    onUpdateLayout(updatedLayout);
    saveToHistory('update', [id]);
  }, [layout, onUpdateLayout, disabled, saveToHistory]);

  // Handle resizing an item
  const handleResizeItem = useCallback((id: string, updates: Partial<EnhancedGridItemData>) => {
    if (disabled) return;
    
    const updatedItems = layout.gridItems.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
    
    const updatedLayout = { ...layout, gridItems: updatedItems };
    onUpdateLayout(updatedLayout);
    saveToHistory('resize', [id]);
  }, [layout, onUpdateLayout, disabled, saveToHistory]);

  // Handle adding a new item to the grid
  const handleAddItem = useCallback((item: Omit<EnhancedGridItemData, 'id' | 'x' | 'y'>, x: number, y: number) => {
    if (disabled) return;
    
    const newItem: EnhancedGridItemData = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: Math.max(0, x),
      y: Math.max(0, y),
    };
    
    const updatedItems = [...layout.gridItems, newItem];
    const updatedLayout = { ...layout, gridItems: updatedItems };
    onUpdateLayout(updatedLayout);
    saveToHistory('add', [newItem.id]);
  }, [layout, onUpdateLayout, disabled, saveToHistory]);

  // Handle removing an item from the grid
  const handleRemoveItem = useCallback((id: string) => {
    if (disabled) return;
    
    const updatedItems = layout.gridItems.filter(item => item.id !== id);
    const updatedLayout = { ...layout, gridItems: updatedItems };
    onUpdateLayout(updatedLayout);
    saveToHistory('remove', [id]);
  }, [layout, onUpdateLayout, disabled, saveToHistory]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enableKeyboardNavigation) return;
    
    // Undo/Redo shortcuts
    if (e.ctrlKey) {
      switch (e.key) {
        case 'z':
          if (!e.shiftKey) {
            e.preventDefault();
            const entry = historyManager.undo();
            if (entry) {
              onUpdateLayout(entry.beforeState);
            }
          } else {
            // Redo with Ctrl+Shift+Z
            e.preventDefault();
            const entry = historyManager.redo();
            if (entry) {
              onUpdateLayout(entry.afterState);
            }
          }
          break;
        case 'y':
          // Redo with Ctrl+Y
          e.preventDefault();
          const redoEntry = historyManager.redo();
          if (redoEntry) {
            onUpdateLayout(redoEntry.afterState);
          }
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
    if (selectedItem && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
      const item = layout.gridItems.find(i => i.id === selectedItem);
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
        
        handleMoveItem(selectedItem, newX, newY);
      }
    }
  }, [selectedItem, layout.gridItems, enableKeyboardNavigation, historyManager, onUpdateLayout, handleMoveItem]);

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
    
    const updatedLayout = { ...layout, gridItems: [] };
    onUpdateLayout(updatedLayout);
    saveToHistory('clear', []);
  }, [layout, onUpdateLayout, disabled, saveToHistory]);

  return (
    <div
      className="bg-slate-700 p-4 rounded-lg"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-amber-200 flex items-center">
          Enhanced Grid Layout
          <HelpGuide feature="grid-layout" title="Grid Layout Canvas" description="Drag and drop items to arrange them on the grid. Use toolbar buttons to manage your layout." position="right" />
        </h3>
        
        {/* Toolbar with undo/redo and zoom controls */}
        <div className="flex space-x-2">
          <button
            onClick={handleUndo}
            disabled={!historyManager.canUndo() || disabled}
            className={`px-3 py-1 rounded ${historyManager.canUndo() && !disabled
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'} transition-colors duration-200 flex items-center`}
            aria-label="Undo"
          >
            ↶ Undo
            <HelpGuide feature="undo-redo" title="Undo Action" description="Revert the last action performed on the grid layout. Use Ctrl+Z to undo." position="bottom" />
          </button>
          
          <button
            onClick={handleRedo}
            disabled={!historyManager.canRedo() || disabled}
            className={`px-3 py-1 rounded ${historyManager.canRedo() && !disabled
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'} transition-colors duration-200 flex items-center`}
            aria-label="Redo"
          >
            ↷ Redo
            <HelpGuide feature="undo-redo" title="Redo Action" description="Reapply the last undone action. Use Ctrl+Y or Ctrl+Shift+Z to redo." position="bottom" />
          </button>
          
          <button
            onClick={() => setZoomLevel(1)}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors duration-200 flex items-center"
            aria-label="Reset zoom"
          >
            {Math.round(zoomLevel * 100)}%
            <HelpGuide feature="zoom" title="Zoom Level" description="Current zoom level of the grid. Click to reset to 100%. Use Ctrl+Plus/Minus to adjust." position="bottom" />
          </button>
          
          <button
            onClick={handleClearGrid}
            disabled={disabled || layout.gridItems.length === 0}
            className={`px-3 py-1 rounded ${!disabled && layout.gridItems.length > 0
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'} transition-colors duration-200 flex items-center`}
            aria-label="Clear grid"
          >
            Clear
            <HelpGuide feature="clear-grid" title="Clear Grid" description="Remove all items from the grid. This action cannot be undone." position="bottom" />
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
          Drag and drop items to rearrange them on the grid
          <HelpGuide feature="drag-and-drop" title="Drag and Drop" description="Drag products from the panel to the grid or move existing items by dragging them." position="top" />
        </span>
        <span className="flex items-center">
          Use arrow keys to move selected items
          <HelpGuide feature="keyboard-nav" title="Keyboard Navigation" description="Select an item and use arrow keys to move it. Hold Shift for larger movements." position="top" />
        </span>
      </div>
    </div>
  );
};

export default EnhancedGridLayout;