import React from 'react';
import type { Product, Category, ProductVariant } from '@shared/types';
import { formatCurrency } from '../utils/formatting';
import HelpGuide from './HelpGuide';

interface AvailableProductsPanelProps {
  products: Product[];
  categories: Category[];
 showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
  selectedCategory: number | 'all';
  setSelectedCategory: (category: number | 'all') => void;
  activeFilterType: 'all' | 'favorites' | 'category';
  setActiveFilterType: (filterType: 'all' | 'favorites' | 'category') => void;
  activeCategoryId: number | null;
  setActiveCategoryId: (categoryId: number | null) => void;
  handleAddItemToGrid: (product: Product, variant: ProductVariant) => void;
}

const AvailableProductsPanel: React.FC<AvailableProductsPanelProps> = ({
  products,
  categories,
  showFavoritesOnly,
  setShowFavoritesOnly,
  selectedCategory,
  setSelectedCategory,
 activeFilterType,
  setActiveFilterType,
  activeCategoryId,
  setActiveCategoryId,
  handleAddItemToGrid
}) => {
 return (
    <div className="bg-slate-700 p-4 rounded-lg" role="region" aria-labelledby="available-products-heading">
      <div className="flex justify-between items-center mb-2">
        <h3 id="available-products-heading" className="text-lg font-semibold text-amber-200">Available Products</h3>
        <HelpGuide feature="available-products" title="Available Products Panel" description="Drag products from this panel onto the grid canvas to add them to your layout." position="left" />
      </div>
      <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Product filtering options">
        <button
          onClick={() => {
            const newShowFavorites = !showFavoritesOnly;
            setShowFavoritesOnly(newShowFavorites);
            if (newShowFavorites) {
              setActiveFilterType('favorites');
              setActiveCategoryId(-1); // Special "Favorites" category
              setSelectedCategory(-1); // Update selected category state
            } else if (activeFilterType === 'favorites') {
              setActiveFilterType('all');
              setActiveCategoryId(0); // Special "All Products" category
              setSelectedCategory(0); // Update selected category state
            }
          }}
          className={`px-4 h-12 flex items-center text-sm font-semibold rounded-md transition ${showFavoritesOnly ? 'bg-amber-50 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-200'}`}
          aria-label={showFavoritesOnly ? 'Turn off favorites filter' : 'Turn on favorites filter'}
        >
          ★ Favourites {showFavoritesOnly ? 'ON' : 'OFF'}
        </button>
        {/* Special "All Products" category button */}
        <button
          onClick={() => {
            setSelectedCategory(0); // Special "All Products" category
            setShowFavoritesOnly(false);
            setActiveFilterType('all');
            setActiveCategoryId(0); // Special "All Products" category
          }}
          className={`px-4 h-12 flex items-center text-sm font-semibold rounded-md transition ${selectedCategory === 0 ? 'bg-amber-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-200'}`}
          aria-label="Show all products"
        >
          All Products
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => {
              const newSelectedCategory = selectedCategory === category.id ? 'all' : category.id; // Go back to "all" when unselecting
              setSelectedCategory(newSelectedCategory);
              
              if (newSelectedCategory !== 'all') {
                setActiveFilterType('category');
                setActiveCategoryId(category.id);
              } else {
                setActiveFilterType('all');
                setActiveCategoryId(0); // Special "All Products" category
              }
            }}
            className={`px-4 h-12 flex items-center text-sm font-semibold rounded-md transition ${selectedCategory === category.id ? 'bg-amber-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-slate-200'}`}
            aria-label={`Filter by ${category.name} category`}
          >
            {category.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-600 rounded" role="list" aria-label="List of available products to add to the grid">
        {(() => {
          let filteredProducts = products;
          
          // Apply filter based on active filter type
          if (activeFilterType === 'favorites') {
            filteredProducts = products.filter((product: Product) =>
              product.variants.some((variant: ProductVariant) => variant.isFavourite)
            );
          } else if (activeFilterType === 'category' && activeCategoryId !== null && activeCategoryId !== -1) {
            filteredProducts = products.filter((product: Product) =>
              product.categoryId === activeCategoryId
            );
          } else if (activeFilterType === 'all') {
            // Show all products for 'all' filter
            filteredProducts = products;
          }
          
          return filteredProducts.map((product: Product) => (
            product.variants.map((variant: ProductVariant, variantIndex: number) => (
              <button
                key={`${product.id}-${variant.id}`}
                onClick={() => handleAddItemToGrid(product, variant)}
                className={`rounded-lg p-3 text-left shadow-md transition focus:outline-none focus:ring-2 focus:ring-amber-500 h-32 flex flex-col justify-between ${variant.backgroundColor} hover:brightness-110`}
                aria-label={`Add ${product.name} ${variant.name} to grid`}
                role="listitem"
              >
                <p className={`font-bold ${variant.textColor}`}>{product.name}</p>
                <div>
                  <p className={`text-sm font-semibold ${variant.textColor}`}>{variant.name}</p>
                  <p className={`text-sm ${variant.textColor} opacity-80`}>{formatCurrency(variant.price)}</p>
                </div>
              </button>
            ))
          ));
        })()}
      </div>
    </div>
  );
};

export default AvailableProductsPanel;