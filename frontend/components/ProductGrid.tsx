import React, { useState, useMemo, useEffect } from 'react';
import type { Product, ProductVariant, Category, Till } from '../../shared/types';
import { formatCurrency } from '../utils/formatting';
import ProductGridLayoutCustomizer, { type ProductGridLayoutData } from './ProductGridLayoutCustomizer';
import { getCurrentLayoutForTill, getCurrentLayoutForTillWithFilter } from '../services/gridLayoutService';
import { LayoutSelectionDropdown } from './LayoutSelectionDropdown';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (variant: ProductVariant, product: Product) => void;
  assignedTillId: number | null;
  makableVariantIds: Set<number>;
  tills: Till[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, categories, onAddToCart, assignedTillId, makableVariantIds, tills }) => {
  const [selectedFilter, setSelectedFilter] = useState<'favourites' | 'all' | number>('favourites');
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<ProductGridLayoutData | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<string | number | null>(null);
  
  // Load the current layout for the assigned till based on selected filter
  useEffect(() => {
    const loadLayout = async () => {
      if (assignedTillId) {
        try {
          // Determine filter type based on selectedFilter
          let filterType: string;
          let categoryId: number | null = null;
          
          if (selectedFilter === 'favourites') {
            filterType = 'favorites';
          } else if (selectedFilter === 'all') {
            filterType = 'all';
          } else {
            filterType = 'category';
            categoryId = selectedFilter as number;
          }
          
          const layout = await getCurrentLayoutForTillWithFilter(assignedTillId, filterType, categoryId);
          setCurrentLayout(layout);
          setSelectedLayoutId(layout.id || null);
        } catch (error) {
          console.error('Failed to load current layout:', error);
          // If loading fails, set a default layout
          const defaultLayout: ProductGridLayoutData = {
            name: 'Default Layout',
            tillId: assignedTillId,
            layout: {
              columns: 4,
              gridItems: [],
              version: '1.0'
            },
            isDefault: true
          };
          setCurrentLayout(defaultLayout);
          setSelectedLayoutId(null);
        }
      }
    };
    
    loadLayout();
  }, [assignedTillId, selectedFilter]);

  // Handle layout change from the dropdown
  const handleLayoutChange = (layout: ProductGridLayoutData) => {
    setCurrentLayout(layout);
    setSelectedLayoutId(layout.id || null);
  };

  const visibleCategories = useMemo(() => {
    if (!assignedTillId) return categories;
    return categories.filter(c => !c.visibleTillIds || c.visibleTillIds.length === 0 || c.visibleTillIds.includes(assignedTillId));
  }, [categories, assignedTillId]);

  const visibleProducts = useMemo(() => {
    const visibleCategoryIds = new Set(visibleCategories.map(c => c.id));
    return products.filter(p => visibleCategoryIds.has(p.categoryId));
  }, [products, visibleCategories]);

  const itemsToRender = useMemo(() => {
    if (selectedFilter === 'favourites') {
      return visibleProducts.flatMap(product =>
        product.variants
          .filter(variant => variant.isFavourite)
          .map(variant => ({ product, variant }))
      );
    }

    let productList = visibleProducts;
    if (typeof selectedFilter === 'number') {
      productList = visibleProducts.filter(p => p.categoryId === selectedFilter);
    }
    
    return productList.flatMap(product =>
      product.variants.map(variant => ({ product, variant }))
    );
  }, [visibleProducts, selectedFilter]);

  return (
    <>
      <div className="flex flex-col h-full bg-slate-900 rounded-lg">
      <div className="flex-shrink-0 p-4">
        <h2 className="text-2xl font-bold text-amber-400 mb-3">Products</h2>
        <div className="flex flex-wrap gap-2 mb-3">
           <button
            onClick={() => setSelectedFilter('favourites')}
            className={`px-4 h-12 flex items-center text-sm font-semibold rounded-md transition ${selectedFilter === 'favourites' ? 'bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            ★ Favourites
          </button>
          {visibleCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedFilter(category.id)}
              className={`px-4 h-12 flex items-center text-sm font-semibold rounded-md transition ${selectedFilter === category.id ? 'bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
            >
              {category.name}
            </button>
          ))}
          <button
            onClick={() => setSelectedFilter('all')}
            className={`ml-auto px-4 h-12 flex items-center text-sm font-semibold rounded-md transition ${selectedFilter === 'all' ? 'bg-amber-500 text-white' : 'bg-slate-700 hover:bg-slate-600'}`}
          >
            All
          </button>
        </div>
        {/* Layout Selection Dropdown */}
        {assignedTillId && (
          <div className="flex justify-end">
            <LayoutSelectionDropdown
              tillId={assignedTillId}
              filterType={
                selectedFilter === 'favourites' ? 'favorites' :
                selectedFilter === 'all' ? 'all' :
                'category'
              }
              categoryId={typeof selectedFilter === 'number' ? selectedFilter : null}
              currentLayoutId={selectedLayoutId}
              onLayoutChange={handleLayoutChange}
              className="mb-2"
            />
          </div>
        )}
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        {currentLayout && currentLayout.layout.gridItems.length > 0 ? (
          // Render using the custom grid layout
          <div 
            className="grid w-full min-h-[500px]"
            style={{
              gridTemplateColumns: `repeat(${currentLayout.layout.columns}, 1fr)`,
              gridAutoRows: 'minmax(128px, auto)',
              gap: '1rem'
            }}
          >
            {currentLayout.layout.gridItems.map((gridItem) => {
              // Find the product and variant for this grid item
              const product = products.find(p => p.id === gridItem.productId);
              const variant = product?.variants.find(v => v.id === gridItem.variantId);
              
              if (!product || !variant) {
                // Skip items that don't have a valid product/variant
                return null;
              }
              
              const isMakable = makableVariantIds.has(variant.id);
              
              return (
                <button
                  key={gridItem.id}
                  onClick={() => onAddToCart(variant, product)}
                  disabled={!isMakable}
                  className={`rounded-lg p-3 text-left shadow-md transition focus:outline-none focus:ring-2 focus:ring-amber-500 relative overflow-hidden flex flex-col justify-between h-full ${variant.backgroundColor} ${isMakable ? 'hover:brightness-110' : 'opacity-50 cursor-not-allowed'}`}
                  style={{
                    gridColumn: `${gridItem.x + 1} / span ${gridItem.width}`,
                    gridRow: `${gridItem.y + 1} / span ${gridItem.height}`,
                  }}
                >
                  <p className={`font-bold ${variant.textColor}`}>{product.name}</p>
                  <div>
                    <p className={`text-sm font-semibold ${variant.textColor}`}>{variant.name}</p>
                    <p className={`text-sm ${variant.textColor} opacity-80`}>{formatCurrency(variant.price)}</p>
                  </div>
                  {!isMakable && <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center"><span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">OUT OF STOCK</span></div>}
                </button>
              );
            })}
          </div>
        ) : (
          // Fallback to default grid layout
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {itemsToRender.map(({ product, variant }) => {
              const isMakable = makableVariantIds.has(variant.id);
              return (
                <button
                  key={variant.id}
                  onClick={() => onAddToCart(variant, product)}
                  disabled={!isMakable}
                  className={`rounded-lg p-3 text-left shadow-md transition focus:outline-none focus:ring-2 focus:ring-amber-500 relative overflow-hidden h-32 flex flex-col justify-between ${variant.backgroundColor} ${isMakable ? 'hover:brightness-110' : 'opacity-50 cursor-not-allowed'}`}
                >
                  <p className={`font-bold ${variant.textColor}`}>{product.name}</p>
                  <div>
                    <p className={`text-sm font-semibold ${variant.textColor}`}>{variant.name}</p>
                    <p className={`text-sm ${variant.textColor} opacity-80`}>{formatCurrency(variant.price)}</p>
                  </div>
                   {!isMakable && <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center"><span className="text-white font-bold text-xs bg-red-600 px-2 py-1 rounded">OUT OF STOCK</span></div>}
                </button>
              )
            })}
          </div>
        )}
      </div>
    
      {/* Add Customize Layout button */}
      <div className="mt-4 px-4">
        <button
          onClick={() => setShowCustomizer(true)}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md transition"
        >
          Customize Grid Layout
        </button>
      </div>
    </div>
    
    {/* Render the customizer modal if showCustomizer is true */}
    {showCustomizer && (
      <ProductGridLayoutCustomizer
        products={products}
        categories={categories}
        tills={tills}
        currentTillId={assignedTillId}
        initialFilterType={
          selectedFilter === 'favourites' ? 'favorites' :
          selectedFilter === 'all' ? 'all' :
          'category'
        }
        initialCategoryId={typeof selectedFilter === 'number' ? selectedFilter : null}
        onSaveLayout={(layoutData: ProductGridLayoutData) => {
          // Update the current layout state
          setCurrentLayout(layoutData);
          // Update the selected layout ID if the saved layout has an ID
          if (layoutData.id) {
            setSelectedLayoutId(layoutData.id);
          }
          // For now, just close the modal
          setShowCustomizer(false);
        }}
        onCancel={() => setShowCustomizer(false)}
      />
    )}
   </>
  );
};
