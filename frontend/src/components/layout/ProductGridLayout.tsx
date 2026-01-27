import React, { useState, useMemo, useEffect } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import { DraggableProductButton } from './DraggableProductButton';
import { CategoryTabs } from '../CategoryTabs';
import type { Product, ProductVariant, Category } from '../../../../shared/types';

const GRID_COLUMNS = 4;

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
  const { 
    currentCategoryId, 
    getCurrentCategoryLayout, 
    updateButtonPosition,
    isEditMode 
  } = useLayout();
  
  const [dragOverCell, setDragOverCell] = useState<{ col: number; row: number } | null>(null);

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
      return visibleProducts.flatMap(product =>
        product.variants
          .filter(variant => variant.isFavourite)
          .map(variant => ({ product, variant }))
      );
    }

    if (currentCategoryId === 'all') {
      return visibleProducts.flatMap(product =>
        product.variants.map(variant => ({ product, variant }))
      );
    }

    // Specific category
    const filteredProducts = visibleProducts.filter(p => p.categoryId === currentCategoryId);
    return filteredProducts.flatMap(product =>
      product.variants.map(variant => ({ product, variant }))
    );
  }, [visibleProducts, currentCategoryId]);

  // Get current category layout
  const categoryLayout = getCurrentCategoryLayout();

  // Calculate grid rows needed (minimum 5 rows)
  // Use the highest positioned row, NOT the item count
  const maxRow = categoryLayout?.positions.reduce((max, pos) =>
    Math.max(max, pos.gridRow), 0
  ) || 0;
  
  // Don't calculate based on item count - this causes auto-compacting
  // Just use the max row position or minimum (5)
  const gridRows = Math.max(maxRow, 5);
  
  // Debug logging for grid calculations
  useEffect(() => {
    if (isEditMode) {
      console.log('Grid Debug Info:', {
        maxRow,
        gridRows,
        itemCount: itemsToRender.length,
        positions: categoryLayout?.positions
      });
    }
  }, [isEditMode, gridRows, maxRow, itemsToRender.length, categoryLayout]);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, col: number, row: number) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell({ col, row });
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, col: number, row: number) => {
    e.preventDefault();
    
    if (!isEditMode) return;

    const variantId = e.dataTransfer.getData('variantId');
    if (variantId) {
      updateButtonPosition(Number(variantId), col, row);
    }
    
    setDragOverCell(null);
  };

  const handleProductClick = (variant: ProductVariant, product: Product) => {
    if (!isEditMode) {
      onAddToCart(variant, product);
    }
  };

  // Create grid cells for drop zones
  const renderGridCells = () => {
    const cells = [];
    for (let row = 1; row <= gridRows; row++) {
      for (let col = 1; col <= GRID_COLUMNS; col++) {
        const isHighlighted = dragOverCell?.col === col && dragOverCell?.row === row;
        
        cells.push(
          <div
            key={`cell-${col}-${row}`}
            onDragOver={(e) => handleDragOver(e, col, row)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col, row)}
            className={`
              border-2 border-dashed rounded-lg transition-colors
              ${isEditMode ? 'border-slate-600 bg-slate-800/30' : 'border-transparent'}
              ${isHighlighted ? 'bg-yellow-500/20 border-yellow-500' : ''}
            `}
            style={{
              gridColumn: col,
              gridRow: row,
              minHeight: '128px'
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
        <h2 className="text-2xl font-bold text-amber-400 mb-3">Products</h2>
        
        {/* Category filter tabs */}
        <CategoryTabs
          categories={categories}
          assignedTillId={assignedTillId}
        />
      </div>

      {/* Product grid area */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative w-full h-full p-4">
          {/* Edit mode grid overlay */}
          {showEditGrid && (
            <div
              className="absolute inset-0 pointer-events-none z-0 p-4"
              style={{
                backgroundImage: `
                  repeating-linear-gradient(0deg, transparent, transparent calc(25% - 1px), rgba(100, 116, 139, 0.3) calc(25% - 1px), rgba(100, 116, 139, 0.3) 25%),
                  repeating-linear-gradient(90deg, transparent, transparent calc(25% - 1px), rgba(100, 116, 139, 0.3) calc(25% - 1px), rgba(100, 116, 139, 0.3) 25%)
                `,
                backgroundSize: '100% 128px, calc(100% / 4) 100%'
              }}
            >
              <div className="absolute top-2 left-2 bg-yellow-500 text-black px-3 py-1 rounded-md text-xs font-bold">
                4-COLUMN GRID • {
                  currentCategoryId === 'favourites'
                    ? 'Favourites'
                    : typeof currentCategoryId === 'number'
                      ? categories.find(c => c.id === currentCategoryId)?.name
                      : currentCategoryId
                }
              </div>
            </div>
          )}

          {/* Warning only for 'all' in edit mode */}
          {isEditMode && currentCategoryId === 'all' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/80">
              <div className="bg-amber-500 text-black px-6 py-4 rounded-lg max-w-md text-center">
                <p className="font-bold text-lg mb-2">⚠️ Edit Mode Disabled</p>
                <p className="text-sm">
                  Layout customization is not available for "All" filter.
                  Please select a specific category or Favourites to customize its layout.
                </p>
              </div>
            </div>
          )}

          {/* Product grid */}
          <div
            className="relative grid gap-4 z-10"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
              gridTemplateRows: `repeat(${gridRows}, minmax(128px, auto))`,  // Explicit row heights
              gridAutoRows: 'minmax(128px, auto)'
            }}
          >
            {/* Drop zone cells */}
            {isEditMode && renderGridCells()}
            
            {/* Product buttons */}
            {itemsToRender.map(({ product, variant }: { product: Product, variant: ProductVariant }) => {
              const position = categoryLayout?.positions.find(p => p.variantId === variant.id);
              
              // Only render positioned buttons in edit mode
              if (isEditMode && !position) {
                return null;
              }
              
              return (
                <DraggableProductButton
                  key={variant.id}
                  variant={variant}
                  product={product}
                  onClick={() => handleProductClick(variant, product)}
                  isMakable={makableVariantIds.has(variant.id)}
                />
              );
            })}
          </div>

          {/* Empty state */}
          {itemsToRender.length === 0 && (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No products in this category
            </div>
          )}
        </div>
      </div>
    </div>
  );
};