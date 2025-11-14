import React, { useState, useMemo } from 'react';
import type { Product, ProductVariant, Category } from '../../shared/types';
import { formatCurrency } from '../utils/formatting';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (variant: ProductVariant, product: Product) => void;
  assignedTillId: number | null;
  makableVariantIds: Set<number>;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, categories, onAddToCart, assignedTillId, makableVariantIds }) => {
  const [selectedFilter, setSelectedFilter] = useState<'favourites' | 'all' | number>('favourites');

  const visibleCategories = useMemo(() => {
    if (!assignedTillId) return categories;
    return categories.filter(c => c.visibleTillIds.length === 0 || c.visibleTillIds.includes(assignedTillId));
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
    <div className="flex flex-col h-full bg-slate-900 rounded-lg">
      <div className="flex-shrink-0 p-4">
        <h2 className="text-2xl font-bold text-amber-400 mb-3">Products</h2>
        <div className="flex flex-wrap gap-2">
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
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
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
      </div>
    </div>
  );
};
