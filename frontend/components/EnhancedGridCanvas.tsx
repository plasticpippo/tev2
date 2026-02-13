import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/formatting';
import type { ProductVariant } from '../../shared/types';
import ProductGridItem from './ProductGridItem';

interface EnhancedGridItem {
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

interface EnhancedGridCanvasProps {
  gridItems: EnhancedGridItem[];
  handleMoveItem: (id: string, newX: number, newY: number) => void;
  handleUpdateItem: (id: string, updates: Partial<EnhancedGridItem>) => void;
  handleResizeItem?: (id: string, updates: Partial<EnhancedGridItem>) => void; // Optional resize handler for history tracking
  columns: number;
  gridSize: { width: number; height: number };
  gutter: number;
  containerPadding: { x: number; y: number };
  snapToGrid?: boolean;
  showGridLines?: boolean;
  onDragStart?: (itemId: string) => void;
  onDragEnd?: (itemId: string) => void;
  disabled?: boolean;
}

const EnhancedGridCanvas: React.FC<EnhancedGridCanvasProps> = ({
  gridItems,
  handleMoveItem,
  handleUpdateItem,
  handleResizeItem,
  columns = 6,
  gridSize = { width: 120, height: 128 },
  gutter = 8,
  containerPadding = { x: 16, y: 16 },
  snapToGrid = true,
  showGridLines = true,
  onDragStart,
  onDragEnd,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [draggingItem, setDraggingItem] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [dragPreviewPosition, setDragPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  const [resizingItem, setResizingItem] = useState<{ id: string; direction: string; startX: number; startY: number; startWidth: number; startHeight: number; startXPos: number; startYPos: number } | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [keyboardFocusedItem, setKeyboardFocusedItem] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Refs for resize handlers to avoid stale closures
  const resizingItemRef = useRef(resizingItem);
  const gridItemsRef = useRef(gridItems);
  
  // Keep refs in sync with state
  useEffect(() => {
    resizingItemRef.current = resizingItem;
  }, [resizingItem]);
  
  useEffect(() => {
    gridItemsRef.current = gridItems;
  }, [gridItems]);

  const calculatePositionFromMouse = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    let x = clientX - rect.left - containerPadding.x;
    let y = clientY - rect.top - containerPadding.y;
    
    // Apply snap-to-grid if enabled
    if (snapToGrid) {
      x = Math.max(0, Math.floor(x / (gridSize.width + gutter)));
      y = Math.max(0, Math.floor(y / (gridSize.height + gutter))); // Use configurable grid height
    } else {
      x = Math.max(0, Math.round(x / (gridSize.width + gutter)));
      y = Math.max(0, Math.round(y / (gridSize.height + gutter))); // Use configurable grid height
    }
    
    return { x, y };
  };

  const handleDragStart = (e: React.DragEvent, item: EnhancedGridItem) => {
    if (disabled || item.locked) return;
    
    e.dataTransfer.setDragImage(new Image(), 0, 0); // Hide default drag image
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    setDraggingItem({ id: item.id, offsetX, offsetY });
    setIsDragging(true);
    onDragStart?.(item.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingItem || !canvasRef.current) return;
    
    const { x, y } = calculatePositionFromMouse(e.clientX, e.clientY);
    // Only update local preview state, not parent state
    // This prevents excessive re-renders (60+ fps during drag)
    setDragPreviewPosition({ x, y });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingItem) return;
    
    const { x, y } = calculatePositionFromMouse(e.clientX, e.clientY);
    // Only call handleMoveItem on drop, not during dragOver
    handleMoveItem(draggingItem.id, x, y);
    
    setDraggingItem(null);
    setDragPreviewPosition(null);
    setIsDragging(false);
    onDragEnd?.(draggingItem.id);
  };

  // Memoize grid lines to prevent recalculation on every render
  const gridLines = useMemo(() => {
    if (!showGridLines) return null;
    
    const lines = [];
    const totalWidth = columns * gridSize.width + (columns - 1) * gutter;
    const totalRows = Math.ceil(gridItems.reduce((max, item) => Math.max(max, item.y + item.height), 0) + 2);
    const totalHeight = totalRows * gridSize.height + (totalRows - 1) * gutter; // Using configurable grid height per grid unit
    
    // Vertical lines
    for (let i = 0; i <= columns; i++) {
      lines.push(
        <div
          key={`v-${i}`}
          className="absolute bg-gray-700 opacity-30 pointer-events-none"
          style={{
            left: `${containerPadding.x + i * (gridSize.width + gutter)}px`,
            top: `${containerPadding.y}px`,
            width: '1px',
            height: `${totalHeight}px`,
          }}
        />
      );
    }
    
    // Horizontal lines
    for (let i = 0; i <= totalRows; i++) {
      lines.push(
        <div
          key={`h-${i}`}
          className="absolute bg-gray-700 opacity-30 pointer-events-none"
          style={{
            left: `${containerPadding.x}px`,
            top: `${containerPadding.y + i * (gridSize.height + gutter)}px`,
            width: `${totalWidth}px`,
            height: '1px',
          }}
        />
      );
    }
    
    return lines;
  }, [showGridLines, columns, gridSize.width, gridSize.height, gutter, containerPadding.x, containerPadding.y, gridItems]);

  const handleResizeStart = (e: React.MouseEvent, item: EnhancedGridItem, direction: string) => {
    if (disabled || item.locked) return;
    
    e.stopPropagation(); // Prevent item dragging when clicking on resize handle
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    setResizingItem({
      id: item.id,
      direction,
      startX,
      startY,
      startWidth: item.width,
      startHeight: item.height,
      startXPos: item.x,
      startYPos: item.y
    });
    
    // Prevent default behavior to avoid text selection during resize
    e.preventDefault();
  };

  // Use ref-based handler to avoid stale closures in event listeners
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const currentResizingItem = resizingItemRef.current;
    if (!currentResizingItem || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const deltaX = currentX - currentResizingItem.startX;
    const deltaY = currentY - currentResizingItem.startY;
    
    const item = gridItemsRef.current.find(i => i.id === currentResizingItem.id);
    if (!item) return;
    
    // Calculate new dimensions based on resize direction
    let newWidth = currentResizingItem.startWidth;
    let newHeight = currentResizingItem.startHeight;
    let newX = currentResizingItem.startXPos;
    let newY = currentResizingItem.startYPos;
    
    // Adjust dimensions based on resize direction
    switch(currentResizingItem.direction) {
      case 'se': // Southeast (bottom-right)
        newWidth = Math.max(1, currentResizingItem.startWidth + Math.round(deltaX / (gridSize.width + gutter)));
        newHeight = Math.max(1, currentResizingItem.startHeight + Math.round(deltaY / (gridSize.height + gutter))); // Use configurable grid height
        break;
      case 'ne': // Northeast (top-right)
        newWidth = Math.max(1, currentResizingItem.startWidth + Math.round(deltaX / (gridSize.width + gutter)));
        newHeight = Math.max(1, currentResizingItem.startHeight - Math.round(deltaY / (gridSize.height + gutter))); // Use configurable grid height
        newY = currentResizingItem.startYPos - (newHeight - currentResizingItem.startHeight);
        break;
      case 'sw': // Southwest (bottom-left)
        newWidth = Math.max(1, currentResizingItem.startWidth - Math.round(deltaX / (gridSize.width + gutter)));
        newX = currentResizingItem.startXPos - (newWidth - currentResizingItem.startWidth);
        newHeight = Math.max(1, currentResizingItem.startHeight + Math.round(deltaY / (gridSize.height + gutter))); // Use configurable grid height
        break;
      case 'nw': // Northwest (top-left)
        newWidth = Math.max(1, currentResizingItem.startWidth - Math.round(deltaX / (gridSize.width + gutter)));
        newHeight = Math.max(1, currentResizingItem.startHeight - Math.round(deltaY / (gridSize.height + gutter))); // Use configurable grid height
        newX = currentResizingItem.startXPos - (newWidth - currentResizingItem.startWidth);
        newY = currentResizingItem.startYPos - (newHeight - currentResizingItem.startHeight);
        break;
      case 'e': // East (right edge)
        newWidth = Math.max(1, currentResizingItem.startWidth + Math.round(deltaX / (gridSize.width + gutter)));
        break;
      case 'w': // West (left edge)
        newWidth = Math.max(1, currentResizingItem.startWidth - Math.round(deltaX / (gridSize.width + gutter)));
        newX = currentResizingItem.startXPos - (newWidth - currentResizingItem.startWidth);
        break;
      case 'n': // North (top edge)
        newHeight = Math.max(1, currentResizingItem.startHeight - Math.round(deltaY / (gridSize.height + gutter))); // Use configurable grid height
        newY = currentResizingItem.startYPos - (newHeight - currentResizingItem.startHeight);
        break;
      case 's': // South (bottom edge)
        newHeight = Math.max(1, currentResizingItem.startHeight + Math.round(deltaY / (gridSize.height + gutter))); // Use configurable grid height
        break;
    }
    
    // Make sure new position and size are valid
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    
    // Update item with new dimensions
    if (handleResizeItem) {
      handleResizeItem(currentResizingItem.id, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY
      });
    } else {
      handleUpdateItem(currentResizingItem.id, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY
      });
    }
  }, [gridSize.width, gridSize.height, gutter, handleResizeItem, handleUpdateItem]);

  const handleMouseUp = () => {
    if (resizingItem) {
      setResizingItem(null);
    }
  };

  // Add event listeners when resizing starts
  // Using refs for handlers to avoid stale closures and unnecessary re-registrations
  useEffect(() => {
    if (resizingItem) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingItem, handleMouseMove]); // handleMouseMove is now stable with useCallback

  return (
    <div 
      ref={canvasRef}
      className="relative bg-slate-900 rounded-lg p-4 min-h-[500px] border-2 border-dashed border-slate-500"
      style={{ 
        width: '100%', 
        minHeight: '500px',
        padding: `${containerPadding.y}px ${containerPadding.x}px`,
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      tabIndex={0}
      role="grid"
      aria-label={t('enhancedGridCanvas.gridAriaLabel')}
    >
      {/* Render grid lines */}
      {gridLines}
      
      {/* Render grid items */}
      {gridItems.map((item) => {
        const isCurrentlyDragging = draggingItem?.id === item.id;
        const isHovered = hoveredItem === item.id;
        const isFocused = keyboardFocusedItem === item.id;
        
        // Calculate dimensions separately to ensure isolation
        const calculatedWidth = item.width * gridSize.width + (item.width - 1) * gutter;
        // Use configurable grid height per grid unit to match the sales view proportions
        // This ensures consistency with the ProductGrid component
        const calculatedHeight = item.height * gridSize.height; // Each grid unit uses configurable height
        const calculatedLeft = containerPadding.x + item.x * (gridSize.width + gutter);
        const calculatedTop = containerPadding.y + item.y * (gridSize.height + gutter);
        
        return (
          <div
            key={item.id}
            className={`
              absolute rounded-lg p-3 text-left shadow-md transition focus:outline-none focus:ring-2 focus:ring-amber-500 relative overflow-hidden flex flex-col justify-between
              ${item.backgroundColor}
              ${isCurrentlyDragging ? 'opacity-80 scale-95 z-50' : 'z-10'}
              ${isHovered && !isCurrentlyDragging ? 'ring-2 ring-blue-400' : ''}
              ${isFocused ? 'ring-2 ring-yellow-400' : ''}
              ${resizingItem?.id === item.id ? 'ring-2 ring-green-500 ring-dashed' : ''}
              ${item.locked ? 'cursor-not-allowed opacity-70' : 'cursor-move'}
            `}
            style={{
              left: `${calculatedLeft}px`,
              top: `${calculatedTop}px`,
              width: `${calculatedWidth}px`,
              height: `${calculatedHeight}px`,
              transform: isCurrentlyDragging
                ? `translate(${(draggingItem!.offsetX - gridSize.width / 2)}px, ${(draggingItem!.offsetY - gridSize.height / 2)}px)`
                : 'none',
              transformOrigin: 'center',
              ...(item.rotation && { transform: `rotate(${item.rotation}deg)` }),
              ...(item.borderRadius && { borderRadius: `${item.borderRadius}px` }),
              zIndex: isCurrentlyDragging ? 50 : (item.zIndex || 10),
            }}
            draggable={!disabled && !item.locked}
            onDragStart={(e) => handleDragStart(e, item)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            onFocus={() => setKeyboardFocusedItem(item.id)}
            onBlur={() => setKeyboardFocusedItem(null)}
            role="gridcell"
            aria-label={t('enhancedGridCanvas.productAriaLabel', { 
              name: item.name, 
              price: formatCurrency(item.price), 
              x: item.x, 
              y: item.y, 
              width: item.width, 
              height: item.height 
            })}
            tabIndex={0}
          >
            <p className={`font-bold ${item.textColor}`}>{item.name}</p>
            <div>
              <p className={`text-sm ${item.textColor} opacity-80`}>{formatCurrency(item.price)}</p>
            </div>
            
            {/* Resize handles */}
            {!item.locked && (
              <div className="group absolute inset-0 cursor-move">
                {/* Top edge handle */}
                <div
                  className="absolute top-0 left-1/2 -mt-1 -ml-2 w-4 h-2 cursor-n-resize bg-blue-500 rounded-sm opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'n')}
                  aria-label={t('enhancedGridCanvas.resizeTopEdge')}
                ></div>
                
                {/* Right edge handle */}
                <div
                  className="absolute right-0 top-1/2 -mr-1 -mt-2 w-2 h-4 cursor-e-resize bg-blue-500 rounded-sm opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'e')}
                  aria-label={t('enhancedGridCanvas.resizeRightEdge')}
                ></div>
                
                {/* Bottom edge handle */}
                <div
                  className="absolute bottom-0 left-1/2 -mb-1 -ml-2 w-4 h-2 cursor-s-resize bg-blue-500 rounded-sm opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 's')}
                  aria-label={t('enhancedGridCanvas.resizeBottomEdge')}
                ></div>
                
                {/* Left edge handle */}
                <div
                  className="absolute left-0 top-1/2 -ml-1 -mt-2 w-2 h-4 cursor-w-resize bg-blue-500 rounded-sm opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'w')}
                  aria-label={t('enhancedGridCanvas.resizeLeftEdge')}
                ></div>
                
                {/* Top-right corner handle */}
                <div
                  className="absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 cursor-ne-resize bg-blue-500 rounded opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'ne')}
                  aria-label={t('enhancedGridCanvas.resizeTopRightCorner')}
                ></div>
                
                {/* Top-left corner handle */}
                <div
                  className="absolute top-0 left-0 -mt-1 -ml-1 w-3 h-3 cursor-nw-resize bg-blue-500 rounded opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'nw')}
                  aria-label={t('enhancedGridCanvas.resizeTopLeftCorner')}
                ></div>
                
                {/* Bottom-right corner handle */}
                <div
                  className="absolute bottom-0 right-0 -mb-1 -mr-1 w-3 h-3 cursor-se-resize bg-blue-500 rounded opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'se')}
                  aria-label={t('enhancedGridCanvas.resizeBottomRightCorner')}
                ></div>
                
                {/* Bottom-left corner handle */}
                <div
                  className="absolute bottom-0 left-0 -mb-1 -ml-1 w-3 h-3 cursor-sw-resize bg-blue-500 rounded opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'sw')}
                  aria-label={t('enhancedGridCanvas.resizeBottomLeftCorner')}
                ></div>
              </div>
            )}
          </div>
        );
      })}
      
      {gridItems.length === 0 && (
        <div 
          className="absolute inset-0 flex items-center justify-center text-slate-400 pointer-events-none"
          style={{ padding: `${containerPadding.y}px ${containerPadding.x}px` }}
        >
          {t('enhancedGridCanvas.dragProductsHere')}
        </div>
      )}
      
      {/* Drop indicator when dragging over the canvas */}
      {draggingItem && (
        <div 
          className="absolute border-2 border-dashed border-green-400 bg-green-400 bg-opacity-10 pointer-events-none"
          style={{
            left: `${containerPadding.x}px`,
            top: `${containerPadding.y}px`,
            width: `${columns * gridSize.width + (columns - 1) * gutter}px`,
            height: `${Math.max(400, (Math.max(...gridItems.map(i => i.y + i.height), 3) * gridSize.height +
                                  Math.max(0, Math.max(...gridItems.map(i => i.y + i.height), 3) - 1) * gutter))}px`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default EnhancedGridCanvas;