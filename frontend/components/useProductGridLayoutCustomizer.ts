import { useState, useEffect } from 'react';
import type { Product, ProductVariant, Till, Category } from '../../shared/types';
import { formatCurrency } from '../utils/formatting';
import { saveGridLayout, getGridLayoutsForTill, deleteGridLayout, setLayoutAsDefault, getLayoutById } from '../services/gridLayoutService';

// Define filter type for layout customization
export type FilterType = 'all' | 'favorites' | 'category';

export interface ProductGridLayout {
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

export interface GridItem {
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

interface UseProductGridLayoutCustomizerProps {
  products: Product[];
  categories: Category[];
  tills: Till[];
  currentTillId: number | null;
  onSaveLayout: (layoutData: ProductGridLayoutData) => void;
  onCancel: () => void;
  initialFilterType?: 'all' | 'favorites' | 'category';
  initialCategoryId?: number | null;
}

interface ConfirmationModalState {
  show: boolean;
  layoutId?: string | number;
  layoutName?: string;
}

export const useProductGridLayoutCustomizer = ({
  products,
  categories,
  tills,
  currentTillId,
  onSaveLayout,
  onCancel,
  initialFilterType,
  initialCategoryId,
}: UseProductGridLayoutCustomizerProps) => {
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
  const [savingLayout, setSavingLayout] = useState<boolean>(false);
  const [deletingLayout, setDeletingLayout] = useState<boolean>(false);
  const [settingDefaultLayout, setSettingDefaultLayout] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | number | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showConfirmationModal, setShowConfirmationModal] = useState<ConfirmationModalState>({show: false});

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
      } else if (activeFilterType === 'category' && activeCategoryId !== null && activeCategoryId !== -1) {
        filteredProducts = products.filter(product => product.categoryId === activeCategoryId);
      } else if (activeFilterType === 'all') {
        // Show all products for 'all' filter
        filteredProducts = products;
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
        setSelectedCategory(-1); // Special "Favorites" category
        setActiveCategoryId(-1); // Special "Favorites" category
      } else if (initialFilterType === 'category' && initialCategoryId) {
        setSelectedCategory(initialCategoryId);
        setActiveFilterType('category');
        setActiveCategoryId(initialCategoryId);
        setShowFavoritesOnly(false);
      } else {
        setSelectedCategory(0); // Special "All Products" category
        setShowFavoritesOnly(false);
        setActiveFilterType('all');
        setActiveCategoryId(0); // Special "All Products" category
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

  const handleMoveItem = (id: string, newX?: number, newY?: number, newWidth?: number, newHeight?: number) => {
    setGridItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const updatedItem: GridItem = { ...item };
          
          if (newX !== undefined) updatedItem.x = Math.max(0, newX);
          if (newY !== undefined) updatedItem.y = Math.max(0, newY);
          if (newWidth !== undefined) updatedItem.width = Math.max(1, newWidth);
          if (newHeight !== undefined) updatedItem.height = Math.max(1, newHeight);
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleSaveLayout = async () => {
    if (!selectedTill) {
      alert('Please select a till');
      return;
    }
    
    setSavingLayout(true);
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
        categoryId: activeFilterType === 'category' ? activeCategoryId : (activeFilterType === 'all' ? 0 : (activeFilterType === 'favorites' ? -1 : null))
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
    } finally {
      setSavingLayout(false);
    }
  };

  const handleSaveAsNewLayout = async () => {
    if (!selectedTill) {
      alert('Please select a till');
      return;
    }
    
    setSavingLayout(true);
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
        categoryId: activeFilterType === 'category' ? activeCategoryId : (activeFilterType === 'all' ? 0 : (activeFilterType === 'favorites' ? -1 : null))
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
    } finally {
      setSavingLayout(false);
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
    setDeletingLayout(true);
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
    } finally {
      setDeletingLayout(false);
    }
  };

  const handleSetAsDefault = async (layoutId: string | number) => {
    setSettingDefaultLayout(true);
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
    } finally {
      setSettingDefaultLayout(false);
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

  const handleRemoveItem = (id: string) => {
    setGridItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const handleClearGrid = () => {
    setGridItems([]);
  };

  return {
    gridItems,
    selectedTill,
    setSelectedTill,
    layoutName,
    setLayoutName,
    isDefault,
    setIsDefault,
    selectedCategory,
    setSelectedCategory,
    showFavoritesOnly,
    setShowFavoritesOnly,
    activeFilterType,
    setActiveFilterType,
    activeCategoryId,
    setActiveCategoryId,
    availableLayouts,
    loadingLayouts,
    loadingCurrentLayout,
    savingLayout,
    deletingLayout,
    settingDefaultLayout,
    error,
    currentLayoutId,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    showConfirmationModal,
    setShowConfirmationModal,
    handleMoveItem,
    handleSaveLayout,
    handleSaveAsNewLayout,
    handleLoadLayout,
    handleAddItemToGrid,
    handleDeleteLayout,
    handleSetAsDefault,
    handleCreateNewLayout,
    resetLayout,
    filteredLayouts,
    handleClearGrid,
    handleRemoveItem,
    parseGridItems,
    loadLayoutsForTill,
  };
};