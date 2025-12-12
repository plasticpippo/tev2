import React, { useState, useEffect } from 'react';
import type { Product, ProductVariant, Till, Category } from '../../shared/types';
import { formatCurrency } from '../utils/formatting';
import { saveGridLayout, getGridLayoutsForTill, deleteGridLayout, setLayoutAsDefault, getLayoutById } from '../services/gridLayoutService';

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
 id?: string | number;
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
  const [isDefault, setIsDefault] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
 const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);
  const [activeFilterType, setActiveFilterType] = useState<FilterType>(initialFilterType || 'all');
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(initialCategoryId || null);

  // New state for layout management
  const [availableLayouts, setAvailableLayouts] = useState<ProductGridLayoutData[]>([]);
  const [loadingLayouts, setLoadingLayouts] = useState<boolean>(false);
  const [loadingCurrentLayout, setLoadingCurrentLayout] = useState<boolean>(false);
 const [error, setError] = useState<string | null>(null);
 const [currentLayoutId, setCurrentLayoutId] = useState<string | number | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
 const [searchQuery, setSearchQuery] = useState<string>('');
  const [showConfirmationModal, setShowConfirmationModal] = useState<{show: boolean, layoutId?: string | number, layoutName?: string}>({show: false});

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

  // Load layouts when till is selected
  useEffect(() => {
    if (selectedTill) {
      loadLayoutsForTill(selectedTill);
    }
 }, [selectedTill]);

  const loadLayoutsForTill = async (tillId: number) => {
    setLoadingLayouts(true);
    setError(null);
    try {
      const layouts = await getGridLayoutsForTill(tillId);
      setAvailableLayouts(layouts);
    } catch (err) {
      setError('Failed to load layouts: ' + (err as Error).message);
    } finally {
      setLoadingLayouts(false);
    }
  };

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
        isDefault,
        filterType: activeFilterType,
        categoryId: activeFilterType === 'category' ? activeCategoryId : null
      };
      
      // If updating existing layout, include the ID
      if (currentLayoutId) {
        extendedLayoutData.id = currentLayoutId;
      }
      
      // Use the apiService function to save the layout
      const result = await saveGridLayout(extendedLayoutData);
      console.log('Layout saved successfully:', result);
      
      // Update the layout data to match the expected interface for onSaveLayout
      const savedLayoutData: ProductGridLayoutData = {
        id: result.id,
        name: result.name,
        tillId: result.tillId,
        layout: result.layout,
        isDefault: result.isDefault,
        filterType: result.filterType,
        categoryId: result.categoryId
      };
      
      // Update available layouts with the saved layout
      if (currentLayoutId) {
        // Update existing layout in the list - handle potential type differences in IDs
        setAvailableLayouts(prevLayouts =>
          prevLayouts.map(layout =>
            (layout.id?.toString() === currentLayoutId.toString()) ? result : layout
          )
        );
      } else {
        // Add new layout to the list
        setAvailableLayouts(prevLayouts => [...prevLayouts, result]);
      }
      
      onSaveLayout(savedLayoutData);
    } catch (error) {
      console.error('Error saving layout:', error);
      alert('Failed to save layout: ' + (error as Error).message);
    }
  };

  const handleSaveAsNewLayout = async () => {
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
        isDefault: false, // New layout is not default by default
        filterType: activeFilterType,
        categoryId: activeFilterType === 'category' ? activeCategoryId : null
      };
      
      // Use the apiService function to save the layout
      const result = await saveGridLayout(extendedLayoutData);
      console.log('Layout saved as new successfully:', result);
      
      // Update the layout data to match the expected interface for onSaveLayout
      const savedLayoutData: ProductGridLayoutData = {
        id: result.id,
        name: result.name,
        tillId: result.tillId,
        layout: result.layout,
        isDefault: result.isDefault,
        filterType: result.filterType,
        categoryId: result.categoryId
      };
      
      // Add new layout to the list
      setAvailableLayouts(prevLayouts => [...prevLayouts, result]);
      
      // Update current layout ID and reset default status
      setCurrentLayoutId(result.id?.toString() || null);
      setIsDefault(result.isDefault);
      
      onSaveLayout(savedLayoutData);
    } catch (error) {
      console.error('Error saving layout as new:', error);
      alert('Failed to save layout as new: ' + (error as Error).message);
    }
  };

  const handleLoadLayout = async (layoutId: string | number) => {
    setLoadingCurrentLayout(true);
    setError(null);
    try {
      const layout = await getLayoutById(layoutId.toString());
      // Update component state with layout data
      setLayoutName(layout.name);
      setSelectedTill(layout.tillId);
      setIsDefault(layout.isDefault);
      setActiveFilterType(layout.filterType || 'all');
      setActiveCategoryId(layout.categoryId || null);
      // Parse and set grid items
      setGridItems(parseGridItems(layout.layout.gridItems));
      setCurrentLayoutId(layout.id || null);
    } catch (error) {
      setError('Failed to load layout: ' + (error as Error).message);
    } finally {
      setLoadingCurrentLayout(false);
    }
  };

  const parseGridItems = (gridItems: any[]): GridItem[] => {
    return gridItems.map(item => {
      // Find the product and variant for the grid item
      const product = products.find(p => p.id === item.productId);
      const variant = product?.variants.find(v => v.id === item.variantId);
      
      return {
        id: item.id,
        variantId: item.variantId,
        productId: item.productId,
        name: product?.name || 'Unknown Product',
        price: variant?.price || 0,
        backgroundColor: variant?.backgroundColor || '#3b82f6',
        textColor: variant?.textColor || '#ffffff',
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height,
      };
    });
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

  const handleDeleteLayout = async (layoutId: string | number) => {
    try {
      await deleteGridLayout(layoutId.toString());
      // Remove from local list and reload layouts
      setAvailableLayouts(prevLayouts => prevLayouts.filter(layout => layout.id?.toString() !== layoutId.toString()));
      // If current layout was deleted, load a different one or reset
      if (currentLayoutId?.toString() === layoutId.toString()) {
        resetLayout();
      }
    } catch (error) {
      setError('Failed to delete layout: ' + (error as Error).message);
    }
  };

  const handleSetAsDefault = async (layoutId: string | number) => {
    try {
      const result = await setLayoutAsDefault(layoutId.toString());
      // Update local layouts list
      setAvailableLayouts(prevLayouts =>
        prevLayouts.map(layout => ({
          ...layout,
          isDefault: layout.id?.toString() === layoutId.toString() ? true : false
        }))
      );
      
      // If this is the current layout, update the current state
      if (currentLayoutId?.toString() === layoutId.toString()) {
        setIsDefault(true);
      }
    } catch (error) {
      setError('Failed to set layout as default: ' + (error as Error).message);
    }
  };

  const resetLayout = () => {
    setGridItems([]);
    setLayoutName('New Layout');
    setIsDefault(false);
    setCurrentLayoutId(null);
  };

  const handleCreateNewLayout = () => {
    resetLayout();
 };

  const filteredLayouts = availableLayouts.filter(layout => {
    const layoutFilterType = layout.filterType || 'all'; // Default to 'all' if filterType is undefined
    const matchesFilter = filterType === 'all' ||
      (filterType === 'favorites' && layoutFilterType === 'favorites') ||
      (filterType === 'category' && layoutFilterType === 'category');
    const matchesSearch = layout.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
                  className="w-full p-2 rounded bg-slate-60 text-white"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm mb-1">Select Till</label>
                <select
                  value={selectedTill || ''}
                  onChange={(e) => {
                    const value = e.target.value ? parseInt(e.target.value) : null;
                    setSelectedTill(value);
                  }}
                  className="w-full p-2 rounded bg-slate-60 text-white"
                >
                  <option value="">Select a till</option>
                  {tills.map(till => (
                    <option key={till.id} value={till.id}>{till.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="block text-sm mb-1">Active Filter Type</label>
                <div className="p-2 rounded bg-slate-60 text-white">
                  {activeFilterType === 'all' && 'All Products'}
                  {activeFilterType === 'favorites' && 'Favorites Only'}
                  {activeFilterType === 'category' && activeCategoryId !== null &&
                    `Category: ${categories.find(c => c.id === activeCategoryId)?.name || 'Unknown'}`}
                </div>
              </div>
              
              <div className="mb-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-50"
                  />
                  <span className="text-sm">
                    Set as default layout for{' '}
                    {activeFilterType === 'all' && 'All Products'}
                    {activeFilterType === 'favorites' && 'Favorites'}
                    {activeFilterType === 'category' && activeCategoryId !== null &&
                      `Category: ${categories.find(c => c.id === activeCategoryId)?.name || 'Unknown'}`}
                  </span>
                </label>
              </div>
              
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSaveLayout}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
                >
                  {currentLayoutId ? 'Update Layout' : 'Save New Layout'}
                </button>
                {currentLayoutId && (
                  <button
                    onClick={handleSaveAsNewLayout}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                  >
                    Save As New
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className="bg-slate-60 hover:bg-slate-700 text-white py-2 px-4 rounded"
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

          <div className="md:col-span-1">
            <div className="bg-slate-700 p-4 rounded-lg h-full">
              <h3 className="text-lg font-semibold mb-2">Available Layouts</h3>
              
              <div className="mb-3">
                <label className="block text-sm mb-1">Filter</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as FilterType)}
                  className="w-full p-2 rounded bg-slate-600 text-white"
                >
                  <option value="all">All</option>
                  <option value="favorites">Favorites</option>
                  <option value="category">Category</option>
                </select>
              </div>
              
              <div className="mb-3">
                <label className="block text-sm mb-1">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search layouts..."
                  className="w-full p-2 rounded bg-slate-600 text-white"
                />
              </div>
              
              {loadingLayouts ? (
                <div className="text-center py-4">Loading layouts...</div>
              ) : error ? (
                <div className="text-red-400 py-2 text-sm">{error}</div>
              ) : (
                <>
                  <div className="max-h-60 overflow-y-auto mb-2">
                    {filteredLayouts.length > 0 ? (
                      filteredLayouts.map(layout => (
                        <div key={layout.id} className="p-2 mb-2 bg-slate-600 rounded flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm truncate">{layout.name}</div>
                            <div className="text-xs text-slate-300">
                              {layout.filterType === 'all' && 'All Products'}
                              {layout.filterType === 'favorites' && 'Favorites Only'}
                              {layout.filterType === 'category' && layout.categoryId !== null &&
                                `Category: ${categories.find(c => c.id === layout.categoryId)?.name || 'Unknown'}`}
                              {layout.isDefault && <span className="ml-2 text-amber-400">(Default)</span>}
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            {layout.isDefault ? (
                              <span className="text-xs bg-amber-500 text-white px-2 py-1 rounded">Default</span>
                            ) : (
                              <button
                                onClick={() => handleSetAsDefault(layout.id!)}
                                className="text-xs bg-slate-500 hover:bg-slate-400 text-white px-2 py-1 rounded"
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              onClick={() => handleLoadLayout(layout.id!)}
                              className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => setShowConfirmationModal({
                                show: true,
                                layoutId: layout.id,
                                layoutName: layout.name
                              })}
                              className="text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded"
                            >
                              Del
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-400">No layouts found</div>
                    )}
                  </div>
                  <button
                    onClick={handleCreateNewLayout}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded"
                  >
                    + Create New Layout
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="md:col-span-2">
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

        {/* Confirmation Modal */}
        {showConfirmationModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg p-6 w-1/3">
              <h3 className="text-xl font-bold mb-4 text-amber-40">Confirm Deletion</h3>
              <p className="mb-4">Are you sure you want to delete the layout "{showConfirmationModal.layoutName}"?</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowConfirmationModal({show: false})}
                  className="bg-slate-600 hover:bg-slate-700 text-white py-2 px-4 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showConfirmationModal.layoutId) {
                      handleDeleteLayout(showConfirmationModal.layoutId);
                    }
                    setShowConfirmationModal({show: false});
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGridLayoutCustomizer;