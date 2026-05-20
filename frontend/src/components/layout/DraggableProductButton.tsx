import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLayout } from '../../contexts/LayoutContext';
import { useViewport } from '../../hooks/useViewport';
import type { ProductVariant, Product } from '@shared/types';
import { formatCurrency } from '../../../utils/formatting';

function remapPosition(col: number, row: number, gridColumns: number): { col: number; row: number } {
  if (col <= gridColumns) return { col, row };
  const newCol = ((col - 1) % gridColumns) + 1;
  const newRow = row + Math.floor((col - 1) / gridColumns);
  return { col: newCol, row: newRow };
}

export function resolveRemappedPositions(
  positions: { variantId: number; gridColumn: number; gridRow: number }[],
  gridColumns: number
): Map<number, { gridColumn: number; gridRow: number }> {
  const result = new Map<number, { gridColumn: number; gridRow: number }>();
  const occupied = new Set<string>();

  for (const pos of positions) {
    let remapped = remapPosition(pos.gridColumn, pos.gridRow, gridColumns);
    let key = `${remapped.col},${remapped.row}`;
    while (occupied.has(key)) {
      remapped = { col: remapped.col + 1, row: remapped.row };
      if (remapped.col > gridColumns) {
        remapped = { col: 1, row: remapped.row + 1 };
      }
      key = `${remapped.col},${remapped.row}`;
    }
    occupied.add(key);
    result.set(pos.variantId, { gridColumn: remapped.col, gridRow: remapped.row });
  }

  return result;
}

const TOUCH_DRAG_CONFIG = {
  LONG_PRESS_DURATION: 500,
  SCROLL_EDGE_DISTANCE: 50,
  CANCEL_MOVE_THRESHOLD: 10,
  SCROLL_UPDATE_INTERVAL: 16,
  SCROLL_SPEED_DIVISOR: 5,
} as const;

interface DraggableProductButtonProps {
  variant: ProductVariant;
  product: Product;
  onClick?: () => void;
  isMakable?: boolean;
  gridStyle?: React.CSSProperties;
}

const useTouchDrag = (
  buttonRef: React.RefObject<HTMLDivElement>,
  isEditMode: boolean,
  variantId: number,
  onDragStart: () => void,
  onDragEnd: () => void
) => {
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const isTouchDraggingRef = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const touchCurrentPos = useRef<{ x: number; y: number } | null>(null);
  const dragElementRef = useRef<HTMLElement | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);
  onDragStartRef.current = onDragStart;
  onDragEndRef.current = onDragEnd;

  const cleanupDragElement = useCallback(() => {
    if (dragElementRef.current && document.body.contains(dragElementRef.current)) {
      document.body.removeChild(dragElementRef.current);
    }
    dragElementRef.current = null;
  }, []);

  useEffect(() => {
    const element = buttonRef.current;
    if (!element || !isEditMode) return;

    const findScrollContainer = (el: HTMLElement): HTMLElement | null => {
      let current: HTMLElement | null = el;
      while (current) {
        const { overflowY } = getComputedStyle(current);
        if (overflowY === 'auto' || overflowY === 'scroll') return current;
        current = current.parentElement;
      }
      return null;
    };

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      touchCurrentPos.current = { x: touch.clientX, y: touch.clientY };

      longPressTimerRef.current = setTimeout(() => {
        isTouchDraggingRef.current = true;
        setIsTouchDragging(true);
        onDragStartRef.current();

        const dragElement = element.cloneNode(true) as HTMLElement;
        dragElement.style.position = 'fixed';
        dragElement.style.zIndex = '9999';
        dragElement.style.opacity = '0.8';
        dragElement.style.pointerEvents = 'none';
        dragElement.style.transform = 'scale(1.05)';
        dragElement.style.width = `${element.offsetWidth}px`;
        document.body.appendChild(dragElement);
        dragElementRef.current = dragElement;
      }, TOUCH_DRAG_CONFIG.LONG_PRESS_DURATION);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartPos.current) return;

      const touch = e.touches[0];
      touchCurrentPos.current = { x: touch.clientX, y: touch.clientY };

      const dx = touch.clientX - touchStartPos.current.x;
      const dy = touch.clientY - touchStartPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (!isTouchDraggingRef.current && distance > TOUCH_DRAG_CONFIG.CANCEL_MOVE_THRESHOLD && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (dragElementRef.current) {
        const width = dragElementRef.current.offsetWidth;
        const height = dragElementRef.current.offsetHeight;
        dragElementRef.current.style.left = `${touch.clientX - width / 2}px`;
        dragElementRef.current.style.top = `${touch.clientY - height / 2}px`;
      }

      if (isTouchDraggingRef.current) {
        e.preventDefault();

        const customEvent = new CustomEvent('touchDragOver', {
          detail: { x: touch.clientX, y: touch.clientY, variantId },
          bubbles: true
        });
        element.dispatchEvent(customEvent);

        const scrollContainer = findScrollContainer(element);
        if (scrollContainer) {
          const EDGE = TOUCH_DRAG_CONFIG.SCROLL_EDGE_DISTANCE;
          const rect = scrollContainer.getBoundingClientRect();
          if (touch.clientY < rect.top + EDGE) {
            const speed = Math.max(1, (EDGE - (touch.clientY - rect.top)) / TOUCH_DRAG_CONFIG.SCROLL_SPEED_DIVISOR);
            if (!scrollIntervalRef.current) {
              scrollIntervalRef.current = setInterval(() => {
                scrollContainer.scrollTop -= speed;
              }, TOUCH_DRAG_CONFIG.SCROLL_UPDATE_INTERVAL);
            }
          } else if (touch.clientY > rect.bottom - EDGE) {
            const speed = Math.max(1, (EDGE - (rect.bottom - touch.clientY)) / TOUCH_DRAG_CONFIG.SCROLL_SPEED_DIVISOR);
            if (!scrollIntervalRef.current) {
              scrollIntervalRef.current = setInterval(() => {
                scrollContainer.scrollTop += speed;
              }, TOUCH_DRAG_CONFIG.SCROLL_UPDATE_INTERVAL);
            }
          } else if (scrollIntervalRef.current) {
            clearInterval(scrollIntervalRef.current);
            scrollIntervalRef.current = null;
          }
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }

      if (isTouchDraggingRef.current) {
        cleanupDragElement();

        const touch = e.changedTouches[0];
        const customEvent = new CustomEvent('touchDrop', {
          detail: { x: touch.clientX, y: touch.clientY, variantId },
          bubbles: true
        });
        element.dispatchEvent(customEvent);

        isTouchDraggingRef.current = false;
        setIsTouchDragging(false);
        onDragEndRef.current();
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
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      cleanupDragElement();
    };
  }, [isEditMode, variantId, buttonRef, cleanupDragElement]);

  return isTouchDragging;
};

export const DraggableProductButton: React.FC<DraggableProductButtonProps> = ({
  variant,
  product,
  onClick,
  isMakable = true,
  gridStyle: gridStyleProp
}) => {
  const { t } = useTranslation();
  const { isEditMode } = useLayout();
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useViewport();

  const gridStyle = gridStyleProp || {};

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

    if (buttonRef.current) {
      const dragImage = buttonRef.current.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.7';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, buttonRef.current.offsetWidth / 2, buttonRef.current.offsetHeight / 2);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleMouseDragEnd = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (!isEditMode && onClick && isMakable) {
      onClick();
    }
  };

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
            {t('productGrid.outOfStock')}
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
          {t('productGrid.fav')}
        </div>
      )}
    </div>
  );
};