import React, { useState, useRef, useEffect } from 'react';
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
  const [draggingItem, setDraggingItem] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [resizingItem, setResizingItem] = useState<{ id: string; direction: string; startX: number; startY: number; startWidth: number; startHeight: number; startXPos: number; startYPos: number } | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [keyboardFocusedItem, setKeyboardFocusedItem] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const calculatePositionFromMouse = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const rect = canvasRef.current.getBoundingClientRect();
    let x = clientX - rect.left - containerPadding.x;
    let y = clientY - rect.top - containerPadding.y;
    
    // Apply snap-to-grid if enabled
    if (snapToGrid) {
      x = Math.max(0, Math.floor(x / (gridSize.width + gutter)));
      y = Math.max(0, Math.floor(y / (128 + gutter))); // Use fixed 128px height
    } else {
      x = Math.max(0, Math.round(x / (gridSize.width + gutter)));
      y = Math.max(0, Math.round(y / (128 + gutter))); // Use fixed 128px height
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
    const item = gridItems.find(i => i.id === draggingItem.id);
    
    if (item) {
      handleMoveItem(item.id, x, y);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingItem) return;
    
    const { x, y } = calculatePositionFromMouse(e.clientX, e.clientY);
    handleMoveItem(draggingItem.id, x, y);
    
    setDraggingItem(null);
    setIsDragging(false);
    onDragEnd?.(draggingItem.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent, item: EnhancedGridItem) => {
    if (disabled || item.locked) return;
    
    // Prevent default behavior for arrow keys to avoid scrolling
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }
    
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
      case ' ':
      case 'Enter':
        setKeyboardFocusedItem(item.id);
        return;
      default:
        return;
    }
    
    handleMoveItem(item.id, newX, newY);
  };

  // Generate grid lines for visualization
  const renderGridLines = () => {
    if (!showGridLines) return null;
    
    const lines = [];
    const totalWidth = columns * gridSize.width + (columns - 1) * gutter;
    const totalRows = Math.ceil(gridItems.reduce((max, item) => Math.max(max, item.y + item.height), 0) + 2);
    const totalHeight = totalRows * 128 + (totalRows - 1) * gutter; // Using 128px per grid unit
    
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
  };

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

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizingItem || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const deltaX = currentX - resizingItem.startX;
    const deltaY = currentY - resizingItem.startY;
    
    const item = gridItems.find(i => i.id === resizingItem.id);
    if (!item) return;
    
    // Calculate new dimensions based on resize direction
    let newWidth = resizingItem.startWidth;
    let newHeight = resizingItem.startHeight;
    let newX = resizingItem.startXPos;
    let newY = resizingItem.startYPos;
    
    // Adjust dimensions based on resize direction
    switch(resizingItem.direction) {
      case 'se': // Southeast (bottom-right)
        newWidth = Math.max(1, resizingItem.startWidth + Math.round(deltaX / (gridSize.width + gutter)));
        newHeight = Math.max(1, resizingItem.startHeight + Math.round(deltaY / (128 + gutter))); // Use fixed 128px height
        break;
      case 'ne': // Northeast (top-right)
        newWidth = Math.max(1, resizingItem.startWidth + Math.round(deltaX / (gridSize.width + gutter)));
        newHeight = Math.max(1, resizingItem.startHeight - Math.round(deltaY / (128 + gutter))); // Use fixed 128px height
        newY = resizingItem.startYPos - (newHeight - resizingItem.startHeight);
        break;
      case 'sw': // Southwest (bottom-left)
        newWidth = Math.max(1, resizingItem.startWidth - Math.round(deltaX / (gridSize.width + gutter)));
        newX = resizingItem.startXPos - (newWidth - resizingItem.startWidth);
        newHeight = Math.max(1, resizingItem.startHeight + Math.round(deltaY / (128 + gutter))); // Use fixed 128px height
        break;
      case 'nw': // Northwest (top-left)
        newWidth = Math.max(1, resizingItem.startWidth - Math.round(deltaX / (gridSize.width + gutter)));
        newHeight = Math.max(1, resizingItem.startHeight - Math.round(deltaY / (128 + gutter))); // Use fixed 128px height
        newX = resizingItem.startXPos - (newWidth - resizingItem.startWidth);
        newY = resizingItem.startYPos - (newHeight - resizingItem.startHeight);
        break;
      case 'e': // East (right edge)
        newWidth = Math.max(1, resizingItem.startWidth + Math.round(deltaX / (gridSize.width + gutter)));
        break;
      case 'w': // West (left edge)
        newWidth = Math.max(1, resizingItem.startWidth - Math.round(deltaX / (gridSize.width + gutter)));
        newX = resizingItem.startXPos - (newWidth - resizingItem.startWidth);
        break;
      case 'n': // North (top edge)
        newHeight = Math.max(1, resizingItem.startHeight - Math.round(deltaY / (128 + gutter))); // Use fixed 128px height
        newY = resizingItem.startYPos - (newHeight - resizingItem.startHeight);
        break;
      case 's': // South (bottom edge)
        newHeight = Math.max(1, resizingItem.startHeight + Math.round(deltaY / (128 + gutter))); // Use fixed 128px height
        break;
    }
    
    // Make sure new position and size are valid
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);
    
    // Update item with new dimensions
    if (handleResizeItem) {
      handleResizeItem(resizingItem.id, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY
      });
    } else {
      handleUpdateItem(resizingItem.id, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY
      });
    }
  };

  const handleMouseUp = () => {
    if (resizingItem) {
      setResizingItem(null);
    }
  };

  // Add event listeners when resizing starts
  useEffect(() => {
    if (resizingItem) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingItem]);

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
      aria-label="Product grid layout"
    >
      {/* Render grid lines */}
      {renderGridLines()}
      
      {/* Render grid items */}
      {gridItems.map((item) => {
        const isCurrentlyDragging = draggingItem?.id === item.id;
        const isHovered = hoveredItem === item.id;
        const isFocused = keyboardFocusedItem === item.id;
        
        // Calculate dimensions separately to ensure isolation
        const calculatedWidth = item.width * gridSize.width + (item.width - 1) * gutter;
        // Use a fixed height of 128px per grid unit to match the sales view proportions (h-32 equivalent)
        // This ensures consistency with the ProductGrid component which uses h-32 (128px)
        const calculatedHeight = item.height * 128; // Each grid unit is 128px high
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
            onKeyDown={(e) => handleKeyDown(e, item)}
            role="gridcell"
            aria-label={`Product ${item.name}, price ${formatCurrency(item.price)}, position ${item.x}, ${item.y}, ${item.width} by ${item.height} grid units`}
            tabIndex={0}
          >
            <p className={`font-bold ${item.textColor}`}>{item.name}</p>
            <div>
              <p className={`text-sm font-semibold ${item.textColor}`}>{item.name}</p>
              <p className={`text-sm ${item.textColor} opacity-80`}>{formatCurrency(item.price)}</p>
            </div>
            
            {/* Resize handles */}
            {!item.locked && (
              <div className="group absolute inset-0 cursor-move">
                {/* Top edge handle */}
                <div
                  className="absolute top-0 left-1/2 -mt-1 -ml-2 w-4 h-2 cursor-n-resize bg-blue-500 rounded-sm opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'n')}
                  aria-label="Resize top edge"
                ></div>
                
                {/* Right edge handle */}
                <div
                  className="absolute right-0 top-1/2 -mr-1 -mt-2 w-2 h-4 cursor-e-resize bg-blue-500 rounded-sm opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'e')}
                  aria-label="Resize right edge"
                ></div>
                
                {/* Bottom edge handle */}
                <div
                  className="absolute bottom-0 left-1/2 -mb-1 -ml-2 w-4 h-2 cursor-s-resize bg-blue-500 rounded-sm opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 's')}
                  aria-label="Resize bottom edge"
                ></div>
                
                {/* Left edge handle */}
                <div
                  className="absolute left-0 top-1/2 -ml-1 -mt-2 w-2 h-4 cursor-w-resize bg-blue-500 rounded-sm opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'w')}
                  aria-label="Resize left edge"
                ></div>
                
                {/* Top-right corner handle */}
                <div
                  className="absolute top-0 right-0 -mt-1 -mr-1 w-3 h-3 cursor-ne-resize bg-blue-500 rounded opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'ne')}
                  aria-label="Resize top-right corner"
                ></div>
                
                {/* Top-left corner handle */}
                <div
                  className="absolute top-0 left-0 -mt-1 -ml-1 w-3 h-3 cursor-nw-resize bg-blue-500 rounded opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'nw')}
                  aria-label="Resize top-left corner"
                ></div>
                
                {/* Bottom-right corner handle */}
                <div
                  className="absolute bottom-0 right-0 -mb-1 -mr-1 w-3 h-3 cursor-se-resize bg-blue-500 rounded opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'se')}
                  aria-label="Resize bottom-right corner"
                ></div>
                
                {/* Bottom-left corner handle */}
                <div
                  className="absolute bottom-0 left-0 -mb-1 -ml-1 w-3 h-3 cursor-sw-resize bg-blue-500 rounded opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleResizeStart(e, item, 'sw')}
                  aria-label="Resize bottom-left corner"
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
          Drag products here to arrange them on the grid
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
            height: `${Math.max(400, (Math.max(...gridItems.map(i => i.y + i.height), 3) * 128 +
                                  Math.max(0, Math.max(...gridItems.map(i => i.y + i.height), 3) - 1) * gutter))}px`,
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default EnhancedGridCanvas;