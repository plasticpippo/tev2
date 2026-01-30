import React, { useState, useRef } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import type { ProductVariant, Product } from '@shared/types';
import { formatCurrency } from '../../../utils/formatting';

interface DraggableProductButtonProps {
  variant: ProductVariant;
  product: Product;
  onClick?: () => void; // For normal POS mode (adding to order)
  isMakable?: boolean; // Whether variant can be made (stock available)
}

export const DraggableProductButton: React.FC<DraggableProductButtonProps> = ({
  variant,
  product,
  onClick,
  isMakable = true
}) => {
  const { isEditMode, getButtonPosition } = useLayout();
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const position = getButtonPosition(variant.id);

  const handleClick = () => {
    // Only allow clicks in normal mode (not edit mode)
    if (!isEditMode && onClick && isMakable) {
      onClick();
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('variantId', variant.id.toString());
    
    // Make the drag image semi-transparent
    if (buttonRef.current) {
      const dragImage = buttonRef.current.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.7';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 60, 40);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // If no position saved, render outside the grid (will be hidden or at end)
  const gridStyle: React.CSSProperties = position ? {
    gridColumn: position.gridColumn,
    gridRow: position.gridRow,
  } : {
    // No grid positioning - will render in document flow after positioned items
    display: isEditMode ? 'none' : 'block'  // Hide unpositioned buttons in edit mode
  };

  return (
    <div
      ref={buttonRef}
      draggable={isEditMode}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      style={gridStyle}
      className={`
        relative
        ${variant.backgroundColor}
        rounded-lg
        p-3
        flex
        flex-col
        justify-between
        transition-all
        ${isEditMode ? 'cursor-move' : (isMakable ? 'cursor-pointer hover:brightness-110' : 'cursor-not-allowed')}
        ${isDragging ? 'opacity-50' : 'opacity-100'}
        ${isEditMode ? 'ring-2 ring-yellow-500 ring-opacity-50' : ''}
        ${!isMakable && !isEditMode ? 'opacity-50' : ''}
        h-40
        shadow-md
      `}
    >
      {/* Edit mode indicator */}
      {isEditMode && (
        <div className="absolute top-1 right-1 text-yellow-400 text-xs font-bold">
          ⋮⋮
        </div>
      )}

      {/* Out of stock overlay (only in normal mode) */}
      {!isMakable && !isEditMode && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center rounded-lg">
          <span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">
            OUT OF STOCK
          </span>
        </div>
      )}

      {/* Product name */}
      <p className={`font-bold ${variant.textColor} text-2xl`}>
        {product.name}
      </p>

      {/* Variant info */}
      <div>
        <p className={`text-lg font-semibold ${variant.textColor}`}>
          {variant.name}
        </p>
        <p className={`text-lg ${variant.textColor} opacity-80`}>
          {formatCurrency(variant.price)}
        </p>
      </div>

      {/* Favourite indicator */}
      {variant.isFavourite && !isEditMode && (
        <div className="absolute top-1 left-1">
          <span className="text-yellow-400 text-sm">FAV</span>
        </div>
      )}
    </div>
  );
};