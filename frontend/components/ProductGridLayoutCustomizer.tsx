import React, { useState, useEffect } from 'react';
import type { Product, ProductVariant, Till, Category } from '../../shared/types';
import { formatCurrency } from '../utils/formatting';
import { saveGridLayout } from '../services/gridLayoutService';

// Define filter type for layout customization
type FilterType = 'all' | 'favorites' | 'category';



interface ProductGridLayout {
  columns: number;
  gridItems: {
    id: string;
    variantId: number;
    productId: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  version: string;
}

export interface ProductGridLayoutData {
  name: string;
  tillId: number;
  layout: ProductGridLayout;
  isDefault: boolean;
  filterType?: 'all' | 'favorites' | 'category';
  categoryId?: number | null;
}

interface ProductGridLayoutCustomizerProps {
  products: Product[];
  categories: Category[];
  tills: Till[];
  currentTillId: number | null;
  onSaveLayout: (layoutData: ProductGridLayoutData) => void;
  onCancel: () => void;
  initialFilterType?: 'all' | 'favorites' | 'category';
  initialCategoryId?: number | null;
}

interface GridItem {
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
}

const ProductGridLayoutCustomizer: React.FC<ProductGridLayoutCustomizerProps> = ({
  products,
  categories,
  tills,
  currentTillId,
  onSaveLayout,
  onCancel,
  initialFilterType,
  initialCategoryId,
}) => {
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [selectedTill, setSelectedTill] = useState<number | null>(currentTillId);
 const [layoutName, setLayoutName] = useState('New Layout');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [activeFilterType, setActiveFilterType] = useState<FilterType>(initialFilterType || 'all');
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(initialCategoryId || null);

  // Initialize grid items from products
  useEffect(() => {
    if (products.length > 0) {
      const initialItems: GridItem[] = [];
      let x = 0;
      let y = 0;
      const itemsPerRow = 4; // Assuming 4 items per row initially

      // Filter products based on active filter type
      let filteredProducts = [...products];
      
      if (activeFilterType === 'favorites') {
        filteredProducts = products.filter(product =>
          product.variants.some(variant => variant.isFavourite)
        );
      } else if (activeFilterType === 'category' && activeCategoryId !== null) {
        filteredProducts = products.filter(product => product.categoryId === activeCategoryId);
      }

      filteredProducts.forEach((product) => {
        product.variants.forEach((variant, variantIndex) => {
          if (initialItems.length < 20) { // Limit initial items to avoid overcrowding
            initialItems.push({
              id: `item-${product.id}-${variant.id}-${variantIndex}`,
              variantId: variant.id,
              productId: product.id,
              name: product.name,
              price: variant.price,
              backgroundColor: variant.backgroundColor,
              textColor: variant.textColor,
              x,
              y,
              width: 1,
              height: 1,
            });
            x++;
            if (x >= itemsPerRow) {
              x = 0;
              y++;
            }
          }
        });
      });
      setGridItems(initialItems);
    }
 }, [products, activeFilterType, activeCategoryId]);
 
 // Initialize the filter selection based on initial filter type
 useEffect(() => {
   if (initialFilterType) {
     if (initialFilterType === 'favorites') {
       setShowFavoritesOnly(true);
       setActiveFilterType('favorites');
       setSelectedCategory('all');
       setActiveCategoryId(null);
     } else if (initialFilterType === 'category' && initialCategoryId) {
       setSelectedCategory(initialCategoryId);
       setActiveFilterType('category');
       setActiveCategoryId(initialCategoryId);
       setShowFavoritesOnly(false);
     } else {
       setSelectedCategory('all');
       setShowFavoritesOnly(false);
       setActiveFilterType('all');
       setActiveCategoryId(null);
     }
   }
 }, [initialFilterType, initialCategoryId]);

  const handleMoveItem = (id: string, newX: number, newY: number) => {
    setGridItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, x: Math.max(0, newX), y: Math.max(0, newY) } : item
      )
    );
  };

  const handleSaveLayout = async () => {
    if (!selectedTill) {
      alert('Please select a till');
      return;
    }
    
    try {
      // Create the extended layout data with filterType and categoryId
      const extendedLayoutData: any = {
        name: layoutName,
        tillId: selectedTill,
        layout: {
          columns: 6, // Default grid size
          gridItems: gridItems.map(item => ({
            id: item.id,
            variantId: item.variantId,
            productId: item.productId,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
          })),
          version: '1.0',
        },
        isDefault: false,
        filterType: activeFilterType,
        categoryId: activeFilterType === 'category' ? activeCategoryId : null
      };
      
      // Use the apiService function to save the layout
      const result = await saveGridLayout(extendedLayoutData);
      console.log('Layout saved successfully:', result);
      
      // Update the layout data to match the expected interface for onSaveLayout
      const savedLayoutData: ProductGridLayoutData = {
        name: result.name,
        tillId: result.tillId,
        layout: result.layout,
        isDefault: result.isDefault,
        filterType: result.filterType,
        categoryId: result.categoryId
      };
      
      onSaveLayout(savedLayoutData);
    } catch (error) {
      console.error('Error saving layout:', error);
      alert('Failed to save layout: ' + (error as Error).message);
    }
  };

  const handleAddItemToGrid = (product: Product, variant: ProductVariant) => {
    const newItem: GridItem = {
      id: `item-${product.id}-${variant.id}-${Date.now()}`,
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      price: variant.price,
      backgroundColor: variant.backgroundColor,
      textColor: variant.textColor,
      x: 0,
      y: gridItems.length > 0 ? Math.max(0, ...gridItems.map(item => item.y)) + 1 : 0, // Place below existing items
      width: 1,
      height: 1,
    };
    setGridItems([...gridItems, newItem]);
  };

  const handleClearGrid = () => {
    setGridItems([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-11/12 h-5/6 max-w-6xl overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-400">Customize Product Grid Layout</h2>
          <button
            onClick={onCancel}
            className="text-white bg-red-600 hover:bg-red-700 rounded-full w-8 h-8 flex items-center justify-center"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-1">
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Layout Settings</h3>
              <div className="mb-3">
                <label className="block text-sm mb-1">Layout Name</label>
                <input
                  type="text"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  className="w-full p-2 rounded bg-slate-600 text-white"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm mb-1">Select Till</label>
                <select
                  value={selectedTill || ''}
                  onChange={(e) => setSelectedTill(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full p-2 rounded bg-slate-600 text-white"
                >
                  <option value="">Select a till</option>
                  {tills.map(till => (
                    <option key={till.id} value={till.id}>{till.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm mb-1">Active Filter Type</label>
                <div className="p-2 rounded bg-slate-600 text-white">
                  {activeFilterType === 'all' && 'All Products'}
                  {activeFilterType === 'favorites' && 'Favorites Only'}
                  {activeFilterType === 'category' && activeCategoryId !== null &&
                    `Category: ${categories.find(c => c.id === activeCategoryId)?.name || 'Unknown'}`}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveLayout}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                >
                  Save Layout
                </button>
                <button
                  onClick={onCancel}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded"
                >
                  Cancel
                </button>
              </div>
              <button
                onClick={handleClearGrid}
                className="w-full mt-2 bg-red-700 hover:bg-red-800 text-white py-2 px-4 rounded"
              >
                Clear Grid
              </button>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="bg-slate-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Available Products</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  onClick={() => {
                    const newShowFavorites = !showFavoritesOnly;
                    setShowFavoritesOnly(newShowFavorites);
                    if (newShowFavorites) {
                      setActiveFilterType('favorites');
                      setActiveCategoryId(null);
                    } else if (activeFilterType === 'favorites') {
                      setActiveFilterType('all');
                    }
                  }}
                  className={`px-4 h-12 flex items-center text-sm font-semibold rounded-md transition ${showFavoritesOnly ? 'bg-amber-500 text-white' : 'bg-slate-600 hover:bg-slate-500'}`}
                >
                  ★ Favourites {showFavoritesOnly ? 'ON' : 'OFF'}
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      const newSelectedCategory = selectedCategory === category.id ? 'all' : category.id;
                      setSelectedCategory(newSelectedCategory);
                      
                      if (newSelectedCategory !== 'all') {
                        setActiveFilterType('category');
                        setActiveCategoryId(category.id);
                      } else {
                        setActiveFilterType('all');
                        setActiveCategoryId(null);
                      }
                    }}
                    className={`px-4 h-12 flex items-center text-sm font-semibold rounded-md transition ${selectedCategory === category.id ? 'bg-amber-500 text-white' : 'bg-slate-600 hover:bg-slate-500'}`}
                  >
                    {category.name}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setShowFavoritesOnly(false);
                    setActiveFilterType('all');
                    setActiveCategoryId(null);
                  }}
                  className={`ml-auto px-4 h-12 flex items-center text-sm font-semibold rounded-md transition ${(selectedCategory === 'all' && !showFavoritesOnly) ? 'bg-amber-500 text-white' : 'bg-slate-600 hover:bg-slate-500'}`}
                >
                  All
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2">
                {(() => {
                  let filteredProducts = products;
                  
                  // Apply filter based on active filter type
                  if (activeFilterType === 'favorites') {
                    filteredProducts = products.filter(product =>
                      product.variants.some(variant => variant.isFavourite)
                    );
                  } else if (activeFilterType === 'category' && activeCategoryId !== null) {
                    filteredProducts = products.filter(product =>
                      product.categoryId === activeCategoryId
                    );
                  }
                  
                  return filteredProducts.map(product => (
                    product.variants.map((variant, variantIndex) => (
                      <button
                        key={`${product.id}-${variant.id}`}
                        onClick={() => handleAddItemToGrid(product, variant)}
                        className={`rounded-lg p-2 text-left shadow-md transition focus:outline-none focus:ring-2 focus:ring-amber-500 ${variant.backgroundColor} hover:brightness-110`}
                      >
                        <p className={`font-bold text-xs ${variant.textColor}`}>{product.name}</p>
                        <p className={`text-xs ${variant.textColor}`}>{variant.name}</p>
                        <p className={`text-xs ${variant.textColor} opacity-80`}>{formatCurrency(variant.price)}</p>
                      </button>
                    ))
                  ));
                })()}
              </div>
            </div>

            <div className="mt-4 bg-slate-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Grid Layout</h3>
              <div
                className="relative bg-slate-900 rounded-lg p-4 min-h-[500px] border-2 border-dashed border-slate-600"
                style={{ width: '100%', height: '500px' }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  // Handle dropping an item directly on the grid (not on an existing item)
                  const draggedId = e.dataTransfer.getData('text/plain');
                  const rect = e.currentTarget.getBoundingClientRect();
                  const newX = Math.floor((e.clientX - rect.left) / 100);
                  const newY = Math.floor((e.clientY - rect.top) / 100);
                  
                  // Update the item's position
                  setGridItems(prevItems =>
                    prevItems.map(item =>
                      item.id === draggedId ? { ...item, x: Math.max(0, newX), y: Math.max(0, newY) } : item
                    )
                  );
                }}
              >
                {gridItems.map((item, index) => (
                  <div
                    key={item.id}
                    className={`absolute rounded-lg p-2 text-center shadow-md transition focus:outline-none focus:ring-2 focus:ring-amber-500 overflow-hidden ${item.backgroundColor}`}
                    style={{
                      left: `${item.x * 100}px`,
                      top: `${item.y * 100}px`,
                      width: `${item.width * 100}px`,
                      height: `${item.height * 100}px`,
                    }}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', item.id);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      const draggedId = e.dataTransfer.getData('text/plain');
                      if (draggedId === item.id) return;
                      
                      // Calculate new position based on drop location
                      const rect = e.currentTarget.getBoundingClientRect();
                      const newX = Math.floor((e.clientX - rect.left) / 100);
                      const newY = Math.floor((e.clientY - rect.top) / 100);
                      handleMoveItem(draggedId, newX, newY);
                    }}
                  >
                    <p className={`font-bold text-sm ${item.textColor}`}>{item.name}</p>
                    <p className={`text-xs ${item.textColor} opacity-80`}>{formatCurrency(item.price)}</p>
                  </div>
                ))}
                {gridItems.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                    Drag products here to arrange them on the grid
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-2">Drag and drop items to rearrange them on the grid</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductGridLayoutCustomizer;