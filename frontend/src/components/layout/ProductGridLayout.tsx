import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLayout } from '../../contexts/LayoutContext';
import { DraggableProductButton } from './DraggableProductButton';
import { CategoryTabs } from '../CategoryTabs';
import AvailableProductsPanel from '../../../components/AvailableProductsPanel';
import { useViewport, GRID_COLUMNS_DESKTOP } from '../../hooks/useViewport';
import { resolveRemappedPositions } from './DraggableProductButton';
import type { Product, ProductVariant, Category } from '@shared/types';

// Grid cell component with touch support
interface GridDropCellProps {
  col: number;
  row: number;
  isEditMode: boolean;
  isHighlighted: boolean;
  onDragOver: (col: number, row: number) => void;
  onDragLeave: () => void;
  onDrop: (variantId: number, col: number, row: number) => void;
}

const GridDropCell: React.FC<GridDropCellProps> = ({
  col,
  row,
  isEditMode,
  isHighlighted,
  onDragOver,
  onDragLeave,
  onDrop
}) => {
  const cellRef = useRef<HTMLDivElement>(null);
  const [isTouchHighlighted, setIsTouchHighlighted] = useState(false);

  // Handle touch drag events from DraggableProductButton
  useEffect(() => {
    const cell = cellRef.current;
    if (!cell || !isEditMode) return;

    const handleTouchDragOver = (e: CustomEvent) => {
      const { x, y } = e.detail;
      const rect = cell.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        setIsTouchHighlighted(true);
        onDragOver(col, row);
      } else {
        setIsTouchHighlighted(false);
      }
    };

    const handleTouchDrop = (e: CustomEvent) => {
      const { x, y, variantId } = e.detail;
      const rect = cell.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        onDrop(variantId, col, row);
        setIsTouchHighlighted(false);
      }
    };

    cell.addEventListener('touchDragOver', handleTouchDragOver as EventListener);
    cell.addEventListener('touchDrop', handleTouchDrop as EventListener);

    return () => {
      cell.removeEventListener('touchDragOver', handleTouchDragOver as EventListener);
      cell.removeEventListener('touchDrop', handleTouchDrop as EventListener);
    };
  }, [isEditMode, col, row, onDragOver, onDrop]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver(col, row);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const variantId = e.dataTransfer.getData('variantId');
    if (variantId) {
      onDrop(Number(variantId), col, row);
    }
    onDragLeave();
  };

  return (
    <div
      ref={cellRef}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
      onDrop={handleDrop}
      className={`product-grid-cell ${isEditMode ? 'edit-mode' : ''} ${(isHighlighted || isTouchHighlighted) ? 'highlighted' : ''}`}
      style={{
        gridColumn: col,
        gridRow: row
      }}
    />
  );
};

interface ProductGridLayoutProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (variant: ProductVariant, product: Product) => void;
  makableVariantIds: Set<number>;
  assignedTillId: number | null;
}

export const ProductGridLayout: React.FC<ProductGridLayoutProps> = ({
  products,
  categories,
  onAddToCart,
  makableVariantIds,
  assignedTillId
}) => {
  const { t } = useTranslation('pos');
  const gridWrapperRef = useRef<HTMLDivElement>(null);
  const {
    currentCategoryId,
    getCurrentCategoryLayout,
    updateButtonPosition,
    isEditMode
  } = useLayout();

  const [dragOverCell, setDragOverCell] = useState<{ col: number; row: number } | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [activeFilterType, setActiveFilterType] = useState<'all' | 'favorites' | 'category'>('all');
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const { currentGridColumns, isMobile } = useViewport(gridWrapperRef);

  // Filter products by visible categories for this till
  const visibleProducts = useMemo(() => {
    if (!assignedTillId) return products;
    
    const visibleCategoryIds = categories
      .filter(c => !c.visibleTillIds || c.visibleTillIds.length === 0 || c.visibleTillIds.includes(assignedTillId))
      .map(c => c.id);
    
    return products.filter(p => visibleCategoryIds.includes(p.categoryId));
  }, [products, categories, assignedTillId]);

  // Get items to render based on current category filter
  const itemsToRender = useMemo(() => {
    if (currentCategoryId === 'favourites') {
      return visibleProducts.flatMap((product: Product) =>
        product.variants
          .filter((variant: ProductVariant) => variant.isFavourite)
          .map((variant: ProductVariant) => ({ product, variant }))
      );
    }

    if (currentCategoryId === 'all') {
      return visibleProducts.flatMap((product: Product) =>
        product.variants.map((variant: ProductVariant) => ({ product, variant }))
      );
    }

    // Specific category
    const filteredProducts = visibleProducts.filter((p: Product) => p.categoryId === currentCategoryId);
    return filteredProducts.flatMap((product: Product) =>
      product.variants.map((variant: ProductVariant) => ({ product, variant }))
    );
  }, [visibleProducts, currentCategoryId]);

  // Get current category layout
  const categoryLayout = getCurrentCategoryLayout();

  // Calculate grid rows needed (minimum 5 rows)
  // Use the highest positioned row, NOT the item count
  const maxRow = useMemo(() =>
    categoryLayout?.positions.reduce((max, pos) =>
      Math.max(max, pos.gridRow), 0
    ) || 0
  , [categoryLayout]);

  const remappedMaxRow = useMemo(() => {
    if (!categoryLayout?.positions.length || currentGridColumns >= GRID_COLUMNS_DESKTOP) {
      return maxRow;
    }
    let effectiveMax = maxRow;
    for (const pos of categoryLayout.positions) {
      if (pos.gridColumn > currentGridColumns) {
        const extraRows = Math.floor((pos.gridColumn - 1) / currentGridColumns);
        const newRow = pos.gridRow + extraRows;
        if (newRow > effectiveMax) effectiveMax = newRow;
      }
    }
    return effectiveMax;
  }, [categoryLayout, maxRow, currentGridColumns]);

  const positionedVariantIds = useMemo(() => new Set(
    categoryLayout?.positions.map(p => p.variantId) || []
  ), [categoryLayout]);

  const resolvedPositions = useMemo(() => {
    if (!categoryLayout?.positions.length) return new Map<number, React.CSSProperties>();
    const resolved = resolveRemappedPositions(categoryLayout.positions, currentGridColumns);
    const styleMap = new Map<number, React.CSSProperties>();
    for (const [variantId, pos] of resolved) {
      styleMap.set(variantId, { gridColumn: pos.gridColumn, gridRow: pos.gridRow });
    }
    return styleMap;
  }, [categoryLayout, currentGridColumns]);

  const { positionedItems, unpositionedItems } = useMemo(() => {
    const positioned: typeof itemsToRender = [];
    const unpositioned: typeof itemsToRender = [];
    for (const item of itemsToRender) {
      if (positionedVariantIds.has(item.variant.id)) {
        positioned.push(item);
      } else {
        unpositioned.push(item);
      }
    }
    return { positionedItems: positioned, unpositionedItems: unpositioned };
  }, [itemsToRender, positionedVariantIds]);

  const tempPositions = useMemo(() => {
    const tempPosMap = new Map<number, React.CSSProperties>();
    let tempRow = maxRow + 1;
    let tempCol = 1;

    unpositionedItems.forEach(({ variant }) => {
      tempPosMap.set(variant.id, {
        gridColumn: tempCol,
        gridRow: tempRow,
      });

      tempCol++;
      if (tempCol > currentGridColumns) {
        tempCol = 1;
        tempRow++;
      }
    });

    return tempPosMap;
  }, [unpositionedItems, maxRow, currentGridColumns]);

  // Don't calculate based on item count - this causes auto-compacting
  // Just use the max row position or minimum (5), plus rows needed for temp positions
  const tempPositionsCount = tempPositions.size;
  const tempRowsNeeded = tempPositionsCount > 0
    ? Math.ceil(tempPositionsCount / currentGridColumns)
    : 0;
  const gridRows = Math.max(remappedMaxRow + tempRowsNeeded, 5);
   
  // Debug logging for grid calculations
  useEffect(() => {
    if (import.meta.env.DEV && isEditMode) {
      console.log('Grid Debug Info:', {
        maxRow,
        gridRows,
        itemCount: itemsToRender.length,
        positions: categoryLayout?.positions,
        currentGridColumns,
        windowWidth: typeof document !== 'undefined' ? document.documentElement.clientWidth : 'N/A'
      });
    }
  }, [isEditMode, gridRows, maxRow, itemsToRender.length, categoryLayout, currentGridColumns]);

  const handleProductClick = (variant: ProductVariant, product: Product) => {
    if (!isEditMode) {
      onAddToCart(variant, product);
    }
  };
  
  const handleAddItemToGrid = (_product: Product, variant: ProductVariant) => {
    const categoryLayout = getCurrentCategoryLayout();
    const existingPositions = categoryLayout?.positions || [];

    let newRow = 1;
    let newCol = 1;
    let positionFound = false;

    while (!positionFound) {
      const positionExists = existingPositions.some(pos =>
        pos.gridRow === newRow && pos.gridColumn === newCol
      );

      if (!positionExists) {
        positionFound = true;
      } else {
        newCol++;
        if (newCol > GRID_COLUMNS_DESKTOP) {
          newCol = 1;
          newRow++;
        }
      }
    }

    updateButtonPosition(variant.id, newCol, newRow);
  };

  // Create grid cells for drop zones - responsive column count
  const renderGridCells = () => {
    const cells = [];
    for (let row = 1; row <= gridRows; row++) {
      for (let col = 1; col <= currentGridColumns; col++) {
        const isHighlighted = dragOverCell?.col === col && dragOverCell?.row === row;

        cells.push(
          <GridDropCell
            key={`cell-${col}-${row}`}
            col={col}
            row={row}
            isEditMode={isEditMode}
            isHighlighted={isHighlighted}
            onDragOver={(c, r) => setDragOverCell({ col: c, row: r })}
            onDragLeave={() => setDragOverCell(null)}
            onDrop={(variantId, c, r) => {
              updateButtonPosition(variantId, c, r);
              setDragOverCell(null);
            }}
          />
        );
      }
    }
    return cells;
  };

  // Allow editing for favourites AND numbered categories
  const showEditGrid = isEditMode && (
    currentCategoryId === 'favourites' ||
    typeof currentCategoryId === 'number'
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg">
      {/* Header with category tabs */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-amber-400 mb-3">{t('productGrid.title')}</h2>
        
        {/* Category filter tabs */}
        <CategoryTabs
          categories={categories}
          assignedTillId={assignedTillId}
        />
      </div>

	{/* Product grid area */}
			<div className="flex-1 overflow-y-auto overflow-x-hidden">
				<div ref={gridWrapperRef} className="relative w-full h-full p-4 product-grid-wrapper">
                      {/* Available Products Panel in edit mode - placed before the grid */}
                      {isEditMode && currentCategoryId !== 'all' && (
                        <div className="mb-6 z-20">
                          <AvailableProductsPanel
                            products={products}
                            categories={categories}
                            showFavoritesOnly={showFavoritesOnly}
                            setShowFavoritesOnly={setShowFavoritesOnly}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            activeFilterType={activeFilterType}
                            setActiveFilterType={setActiveFilterType}
                            activeCategoryId={activeCategoryId}
                            setActiveCategoryId={setActiveCategoryId}
                            handleAddItemToGrid={handleAddItemToGrid}
                          />
                        </div>
                      )}
            
                {/* Edit mode grid overlay - CSS Grid cells for perfect alignment */}
                {showEditGrid && (
                  <div className="absolute inset-0 pointer-events-none z-0 product-grid-lines">
                    {Array.from({ length: gridRows * currentGridColumns }, (_, i) => (
                      <div key={`line-${i}`} className="grid-line-cell" />
                    ))}
                    <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 sm:px-3 py-1 rounded-md text-[0.625rem] sm:text-xs font-bold max-w-[calc(100%-1rem)] truncate">
                      {t('productGrid.columnGrid')} • {
                        currentCategoryId === 'favourites'
                          ? t('productGrid.favourites')
                          : typeof currentCategoryId === 'number'
                            ? categories.find(c => c.id === currentCategoryId)?.name
                            : currentCategoryId
                      } • {currentGridColumns} {isMobile ? t('productGrid.colsMobile') : t('productGrid.cols')}
                    </div>
                  </div>
                )}
            
                      {/* Warning only for 'all' in edit mode */}
                      {isEditMode && currentCategoryId === 'all' && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/80">
                          <div className="bg-amber-500 text-black px-6 py-4 rounded-lg max-w-xs sm:max-w-md text-center">
                            <p className="font-bold text-lg mb-2"><span className="alert-icon" aria-label="Warning">!</span> {t('productGrid.editModeDisabled')}</p>
                            <p className="text-sm">
                              {t('productGrid.editModeDisabledMessage')}
                            </p>
                          </div>
                        </div>
                      )}
            
          {/* Product grid - fixed 4-column responsive CSS grid */}
          <div className="product-grid-container relative z-10">
            {/* Drop zone cells */}
            {isEditMode && renderGridCells()}

            {/* Product buttons - only positioned items */}
            {positionedItems.map(({ product, variant }: { product: Product, variant: ProductVariant }) => {
              return (
                <DraggableProductButton
                  key={variant.id}
                  variant={variant}
                  product={product}
                  onClick={() => handleProductClick(variant, product)}
                  isMakable={makableVariantIds.has(variant.id)}
                  gridStyle={resolvedPositions.get(variant.id)}
                />
              );
            })}

            {/* Temp-positioned unpositioned items (shown outside edit mode too) */}
            {!isEditMode && unpositionedItems.map(({ product, variant }: { product: Product, variant: ProductVariant }) => (
              <DraggableProductButton
                key={variant.id}
                variant={variant}
                product={product}
                onClick={() => handleProductClick(variant, product)}
                isMakable={makableVariantIds.has(variant.id)}
                gridStyle={tempPositions.get(variant.id)}
              />
            ))}

            {/* Edit-mode unplaced section - only in edit mode */}
            {isEditMode && unpositionedItems.length > 0 && (
              <>
                <h3 className="product-grid-section-header">{t('productGrid.unplacedProducts')}</h3>
                {unpositionedItems.map(({ product, variant }) => (
                  <DraggableProductButton
                    key={`${variant.id}-unplaced`}
                    variant={variant}
                    product={product}
                    isMakable={makableVariantIds.has(variant.id)}
                  />
                ))}
              </>
            )}
          </div>
            
                      {/* Empty state */}
                      {itemsToRender.length === 0 && (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                          {t('productGrid.noProductsInCategory')}
                        </div>
                      )}
                    </div>
                  </div>
    </div>
  );
};