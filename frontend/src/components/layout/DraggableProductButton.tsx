import React, { useState, useRef, useEffect } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import type { ProductVariant, Product } from '@shared/types';
import { formatCurrency } from '../../../utils/formatting';

// Must match ProductGridLayout constants
const MOBILE_BREAKPOINT = 768;
const GRID_COLUMNS_MOBILE = 3;

interface DraggableProductButtonProps {
  variant: ProductVariant;
  product: Product;
  onClick?: () => void; // For normal POS mode (adding to order)
  isMakable?: boolean; // Whether variant can be made (stock available)
  isPositioned?: boolean; // Whether the button has a saved position in the grid
}

// Custom hook for touch drag support
const useTouchDrag = (
  buttonRef: React.RefObject<HTMLDivElement>,
  isEditMode: boolean,
  variantId: number,
  onDragStart: () => void,
  onDragEnd: () => void
) => {
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const touchCurrentPos = useRef<{ x: number; y: number } | null>(null);
  const dragElementRef = useRef<HTMLElement | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const element = buttonRef.current;
    if (!element || !isEditMode) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      touchCurrentPos.current = { x: touch.clientX, y: touch.clientY };

      // Long press to initiate drag (500ms)
      longPressTimerRef.current = setTimeout(() => {
        setIsTouchDragging(true);
        onDragStart();

        // Create a visual drag element
        const dragElement = element.cloneNode(true) as HTMLElement;
        dragElement.style.position = 'fixed';
        dragElement.style.zIndex = '9999';
        dragElement.style.opacity = '0.8';
        dragElement.style.pointerEvents = 'none';
        dragElement.style.transform = 'scale(1.05)';
        dragElement.style.width = `${element.offsetWidth}px`;
        document.body.appendChild(dragElement);
        dragElementRef.current = dragElement;
      }, 500);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartPos.current) return;

      const touch = e.touches[0];
      touchCurrentPos.current = { x: touch.clientX, y: touch.clientY };

      // Cancel long press if moved too much before drag starts
      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (!isTouchDragging && distance > 10 && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      // Update drag element position
      if (dragElementRef.current) {
        const width = dragElementRef.current.offsetWidth;
        const height = dragElementRef.current.offsetHeight;
        dragElementRef.current.style.left = `${touch.clientX - width / 2}px`;
        dragElementRef.current.style.top = `${touch.clientY - height / 2}px`;
      }

      // Dispatch custom event for grid cells to detect
      const customEvent = new CustomEvent('touchDragOver', {
        detail: { x: touch.clientX, y: touch.clientY, variantId },
        bubbles: true
      });
      element.dispatchEvent(customEvent);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Clear long press timer
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (isTouchDragging) {
        // Remove drag element
        if (dragElementRef.current) {
          document.body.removeChild(dragElementRef.current);
          dragElementRef.current = null;
        }

        // Dispatch custom drop event
        const touch = e.changedTouches[0];
        const customEvent = new CustomEvent('touchDrop', {
          detail: { x: touch.clientX, y: touch.clientY, variantId },
          bubbles: true
        });
        element.dispatchEvent(customEvent);

        setIsTouchDragging(false);
        onDragEnd();
      }

      touchStartPos.current = null;
      touchCurrentPos.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (dragElementRef.current) {
        document.body.removeChild(dragElementRef.current);
      }
    };
  }, [isEditMode, variantId, isTouchDragging, onDragStart, onDragEnd, buttonRef]);

  return isTouchDragging;
};

export const DraggableProductButton: React.FC<DraggableProductButtonProps> = ({
  variant,
  product,
  onClick,
  isMakable = true
}) => {
  const { isEditMode, getButtonPosition } = useLayout();
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const position = getButtonPosition(variant.id);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClick = () => {
    // Only allow clicks in normal mode (not edit mode)
    if (!isEditMode && onClick && isMakable) {
      onClick();
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Use touch drag hook for mobile support
  const isTouchDragging = useTouchDrag(
    buttonRef,
    isEditMode,
    variant.id,
    handleDragStart,
    handleDragEnd
  );

  const handleMouseDragStart = (e: React.DragEvent<HTMLDivElement>) => {
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

  const handleMouseDragEnd = () => {
    setIsDragging(false);
  };

  // Calculate grid positioning:
  // - In edit mode: always apply position, but clamp to current grid columns on mobile
  // - In normal mode on desktop: apply saved position
  // - In normal mode on mobile: let products flow naturally (no position)
  let gridStyle: React.CSSProperties = {};

  if (position) {
    if (isEditMode) {
      // In edit mode, always apply position but clamp column on mobile
      const clampedColumn = isMobile
        ? Math.min(position.gridColumn, GRID_COLUMNS_MOBILE)
        : position.gridColumn;
      gridStyle = {
        gridColumn: clampedColumn,
        gridRow: position.gridRow,
      };
    } else if (!isMobile) {
      // Normal mode on desktop: use saved position
      gridStyle = {
        gridColumn: position.gridColumn,
        gridRow: position.gridRow,
      };
    }
    // Normal mode on mobile: no position, flows naturally
  }

  const isActivelyDragging = isDragging || isTouchDragging;

  return (
    <div
      ref={buttonRef}
      draggable={isEditMode && !isMobile}
      onDragStart={handleMouseDragStart}
      onDragEnd={handleMouseDragEnd}
      onClick={handleClick}
      style={gridStyle}
      data-theme-color={variant.themeColor}
      data-variant-id={variant.id}
      className={`product-variant-btn product-grid-button ${isEditMode ? 'edit-mode' : ''} ${isActivelyDragging ? 'dragging' : ''} ${!isMakable && !isEditMode ? 'disabled' : ''}`}
    >
      {/* Edit mode indicator */}
      {isEditMode && (
        <div className="product-grid-drag-handle">
          ⋮⋮
        </div>
      )}

      {/* Out of stock overlay (only in normal mode) */}
      {!isMakable && !isEditMode && (
        <div className="product-grid-overlay">
          <span className="product-grid-overlay-text">
            OUT OF STOCK
          </span>
        </div>
      )}

      {/* Product name */}
      <p className="product-grid-name">
        {product.name}
      </p>

      {/* Variant info */}
      <div>
        <p className="product-grid-variant">
          {variant.name}
        </p>
        <p className="product-grid-price">
          {formatCurrency(variant.price)}
        </p>
      </div>

      {/* Favourite indicator */}
      {variant.isFavourite && !isEditMode && (
        <div className="product-grid-fav">
          FAV
        </div>
      )}
    </div>
  );
};