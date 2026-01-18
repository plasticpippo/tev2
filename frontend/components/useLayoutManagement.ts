import { useState, useEffect } from 'react';
import { getGridLayoutsForTill, getSharedLayouts, saveGridLayout, deleteGridLayout, setLayoutAsDefault } from '../services/gridLayoutService';
import type { ProductGridLayoutData } from '../services/apiBase';

// Define the Till and Category interfaces locally since @shared/types is not available
interface TillLocal {
  id: number;
  name: string;
  // Add other properties as needed
}

interface CategoryLocal {
  id: number;
  name: string;
  // Add other properties as needed
}

export interface LayoutWithTillInfo {
  id?: string | number;
  name: string;
  tillId: number;
  layout: {
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
  };
  isDefault: boolean;
  filterType?: 'all' | 'favorites' | 'category';
  categoryId?: number | null;
  tillName?: string;
  isShared?: boolean;
}

interface UseLayoutManagementReturn {
  layouts: LayoutWithTillInfo[];
  loading: boolean;
  error: string | null;
  filterTillId: string;
  filterType: string;
  searchTerm: string;
  setFilterTillId: (id: string) => void;
  setFilterType: (type: string) => void;
  setSearchTerm: (term: string) => void;
  loadLayouts: () => Promise<void>;
  handleDeleteLayout: (layout: LayoutWithTillInfo) => Promise<void>;
  handleSetAsDefault: (layout: LayoutWithTillInfo) => Promise<void>;
  handleSaveLayout: (layout: LayoutWithTillInfo) => Promise<void>;
  handleCreateNewLayout: (newLayoutData: Omit<LayoutWithTillInfo, 'id' | 'layout'> & { layout?: any }) => Promise<void>;
  getCategoryName: (categoryId: number | null | undefined) => string;
}

export const useLayoutManagement = (
  tills: TillLocal[],
  categories: CategoryLocal[],
  onDataUpdate: () => void
): UseLayoutManagementReturn => {
  const [layouts, setLayouts] = useState<LayoutWithTillInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTillId, setFilterTillId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Load layouts
  useEffect(() => {
    loadLayouts();
  }, [filterTillId, filterType, onDataUpdate]);

  const loadLayouts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let loadedLayouts: LayoutWithTillInfo[] = [];
      
      if (filterTillId === 'all') {
        // Load all layouts (both shared and till-specific)
        const sharedLayouts = await getSharedLayouts();
        const allTillLayouts: LayoutWithTillInfo[] = [];
        
        for (const till of tills) {
          try {
            const tillLayouts = await getGridLayoutsForTill(till.id);
            allTillLayouts.push(...tillLayouts.map(layout => ({
              ...layout,
              id: layout.id,
              name: layout.name,
              tillId: layout.tillId,
              layout: layout.layout,
              isDefault: layout.isDefault,
              filterType: layout.filterType,
              categoryId: layout.categoryId,
              tillName: till.name
            })));
          } catch (error) {
            console.error(`Error loading layouts for till ${till.id}:`, error);
          }
        }
        
        loadedLayouts = [...sharedLayouts.map(layout => ({
          ...layout,
          id: layout.id,
          name: layout.name,
          tillId: layout.tillId,
          layout: layout.layout,
          isDefault: layout.isDefault,
          filterType: layout.filterType,
          categoryId: layout.categoryId,
          tillName: 'Shared'
        })), ...allTillLayouts];
      } else if (filterTillId === 'shared') {
        // Load only shared layouts
        const sharedLayouts = await getSharedLayouts();
        loadedLayouts = sharedLayouts.map(layout => ({
          ...layout,
          id: layout.id,
          name: layout.name,
          tillId: layout.tillId,
          layout: layout.layout,
          isDefault: layout.isDefault,
          filterType: layout.filterType,
          categoryId: layout.categoryId,
          tillName: 'Shared'
        }));
      } else {
        // Load layouts for specific till
        const tillId = parseInt(filterTillId, 10);
        if (!isNaN(tillId)) {
          const tillLayouts = await getGridLayoutsForTill(tillId);
          const tillName = tills.find(t => t.id === tillId)?.name || `Till ${tillId}`;
          loadedLayouts = tillLayouts.map(layout => ({
            ...layout,
            id: layout.id,
            name: layout.name,
            tillId: layout.tillId,
            layout: layout.layout,
            isDefault: layout.isDefault,
            filterType: layout.filterType,
            categoryId: layout.categoryId,
            tillName
          }));
        }
      }
      
      // Apply filter type filter
      if (filterType !== 'all') {
        loadedLayouts = loadedLayouts.filter(layout => layout.filterType === filterType);
      }
      
      setLayouts(loadedLayouts);
    } catch (err) {
      console.error('Error loading layouts:', err);
      setError('Failed to load layouts: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLayout = async (layout: LayoutWithTillInfo) => {
    if (!layout.id) return;
    
    try {
      // Convert id to string if it's a number for the API call
      const layoutId = typeof layout.id === 'number' ? layout.id.toString() : layout.id;
      await deleteGridLayout(layoutId);
      setLayouts(layouts.filter(item => item.id !== layout.id));
      onDataUpdate(); // Notify parent to refresh data if needed
    } catch (error) {
      console.error('Error deleting layout:', error);
      setError('Failed to delete layout: ' + (error as Error).message);
    }
  };

  const handleSetAsDefault = async (layout: LayoutWithTillInfo) => {
    if (!layout.id) return;
    
    try {
      // Convert id to string if it's a number for the API call
      const layoutId = typeof layout.id === 'number' ? layout.id.toString() : layout.id;
      const updatedLayout = await setLayoutAsDefault(layoutId);
      // Update the layout in our local state
      setLayouts(layouts.map(l =>
        l.id === layout.id ? { ...l, isDefault: l.id === updatedLayout.id } :
        l.tillId === layout.tillId && l.filterType === layout.filterType &&
        (layout.filterType !== 'category' || l.categoryId === layout.categoryId) &&
        l.isDefault ? { ...l, isDefault: false } : l
      ));
    } catch (error) {
      console.error('Error setting layout as default:', error);
      setError('Failed to set layout as default: ' + (error as Error).message);
    }
  };

  const handleSaveLayout = async (layout: LayoutWithTillInfo) => {
    try {
      const updatedLayout = await saveGridLayout(layout);
      setLayouts(layouts.map(l => l.id === updatedLayout.id ? updatedLayout : l));
      onDataUpdate(); // Notify parent to refresh data if needed
    } catch (error) {
      console.error('Error saving layout:', error);
      setError('Failed to save layout: ' + (error as Error).message);
    }
  };

  const handleCreateNewLayout = async (newLayoutData: Omit<LayoutWithTillInfo, 'id' | 'layout'> & { layout?: any }) => {
    try {
      // Create a default layout structure if not provided
      const defaultLayout = {
        columns: 4,
        gridItems: [],
        version: '1.0'
      };

      const layoutToSave = {
        ...newLayoutData,
        layout: newLayoutData.layout || defaultLayout
      };

      const savedLayout = await saveGridLayout(layoutToSave);
      setLayouts([...layouts, { ...savedLayout, tillName: tills.find(t => t.id === savedLayout.tillId)?.name || `Till ${savedLayout.tillId}` }]);
      onDataUpdate(); // Notify parent to refresh data if needed
    } catch (error) {
      console.error('Error saving new layout:', error);
      setError('Failed to save new layout: ' + (error as Error).message);
    }
  };

  // Get category name by ID
  const getCategoryName = (categoryId: number | null | undefined): string => {
    if (!categoryId) return 'N/A';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return {
    layouts,
    loading,
    error,
    filterTillId,
    filterType,
    searchTerm,
    setFilterTillId,
    setFilterType,
    setSearchTerm,
    loadLayouts,
    handleDeleteLayout,
    handleSetAsDefault,
    handleSaveLayout,
    handleCreateNewLayout,
    getCategoryName
  };
};