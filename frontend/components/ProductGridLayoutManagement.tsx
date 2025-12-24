import React, { useState, useEffect } from 'react';
import type { Till, Category } from '../../shared/types';
import { getGridLayoutsForTill, getSharedLayouts, saveGridLayout, deleteGridLayout, setLayoutAsDefault } from '../services/gridLayoutService';
import { ConfirmationModal } from './ConfirmationModal';
import { VKeyboardInput } from './VKeyboardInput';
import type { ProductGridLayout, ProductGridLayoutData } from '../services/apiBase';

interface ProductGridLayoutManagementProps {
  tills: Till[];
  categories: Category[];
  onDataUpdate: () => void;
}

interface LayoutWithTillInfo {
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

export const ProductGridLayoutManagement: React.FC<ProductGridLayoutManagementProps> = ({ tills, categories, onDataUpdate }) => {
 const [layouts, setLayouts] = useState<LayoutWithTillInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTillId, setFilterTillId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [deletingLayout, setDeletingLayout] = useState<LayoutWithTillInfo | null>(null);
  const [editingLayout, setEditingLayout] = useState<LayoutWithTillInfo | null>(null);
  const [copiedLayoutTillId, setCopiedLayoutTillId] = useState<number | null>(null);
  const [layoutToCopy, setLayoutToCopy] = useState<LayoutWithTillInfo | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newLayout, setNewLayout] = useState<Omit<ProductGridLayoutData, 'id' | 'layout'> & { layout?: any }>({
    name: 'New Layout',
    tillId: tills[0]?.id || 0,
    isDefault: false,
    filterType: 'all',
    categoryId: null
  });

  // Handle creating a new layout
  const handleCreateNewLayout = () => {
    setNewLayout({
      name: 'New Layout',
      tillId: tills[0]?.id || 0,
      isDefault: false,
      filterType: 'all',
      categoryId: null
    });
    setShowCreateModal(true);
  };

  const handleSaveNewLayout = async () => {
    try {
      // Create a default layout structure
      const defaultLayout = {
        columns: 4,
        gridItems: [],
        version: '1.0'
      };

      const layoutToSave = {
        ...newLayout,
        layout: defaultLayout
      };

      const savedLayout = await saveGridLayout(layoutToSave);
      setLayouts([...layouts, { ...savedLayout, tillName: tills.find(t => t.id === savedLayout.tillId)?.name || `Till ${savedLayout.tillId}` }]);
      setShowCreateModal(false);
      onDataUpdate(); // Notify parent to refresh data if needed
    } catch (error) {
      console.error('Error saving new layout:', error);
      setError('Failed to save new layout: ' + (error as Error).message);
    }
  };

  // Load layouts
  useEffect(() => {
    loadLayouts();
  }, [filterTillId, filterType]);

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

  const handleDeleteLayout = async () => {
    if (!deletingLayout || !deletingLayout.id) return;
    
    try {
      // Convert id to string if it's a number for the API call
      const layoutId = typeof deletingLayout.id === 'number' ? deletingLayout.id.toString() : deletingLayout.id;
      await deleteGridLayout(layoutId);
      setLayouts(layouts.filter(layout => layout.id !== deletingLayout.id));
      setDeletingLayout(null);
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

  const handleEditLayout = (layout: LayoutWithTillInfo) => {
    setEditingLayout(layout);
  };

  const handleSaveLayout = async () => {
    if (!editingLayout) return;
    
    try {
      const updatedLayout = await saveGridLayout(editingLayout);
      setLayouts(layouts.map(l => l.id === updatedLayout.id ? updatedLayout : l));
      setEditingLayout(null);
      onDataUpdate(); // Notify parent to refresh data if needed
    } catch (error) {
      console.error('Error saving layout:', error);
      setError('Failed to save layout: ' + (error as Error).message);
    }
  };

  const handleCopyLayout = (layout: LayoutWithTillInfo) => {
    setLayoutToCopy(layout);
    setCopiedLayoutTillId(null);
  };

  const handleConfirmCopyLayout = async () => {
    if (!layoutToCopy || !copiedLayoutTillId) return;
    
    try {
      // In a real implementation, we would call an API endpoint to copy the layout
      // For now, we'll simulate by creating a new layout based on the original
      const newLayoutData = {
        ...layoutToCopy,
        id: undefined, // Don't include the ID to create a new record
        name: `${layoutToCopy.name} (Copy)`,
        tillId: copiedLayoutTillId,
        isDefault: false, // New copied layouts are not defaults
        isShared: false // Copy becomes till-specific
      };
      
      const newLayout = await saveGridLayout(newLayoutData);
      setLayouts([...layouts, newLayout]);
      setLayoutToCopy(null);
      setCopiedLayoutTillId(null);
      onDataUpdate(); // Notify parent to refresh data if needed
    } catch (error) {
      console.error('Error copying layout:', error);
      setError('Failed to copy layout: ' + (error as Error).message);
    }
  };

  // Filter layouts based on search term
  const filteredLayouts = layouts.filter(layout => {
    const matchesSearch = layout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (layout.tillName && layout.tillName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Group layouts by filter type for better organization
  const groupedLayouts = filteredLayouts.reduce((acc, layout) => {
    const key = layout.filterType || 'all';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(layout);
    return acc;
  }, {} as Record<string, LayoutWithTillInfo[]>);

  // Get category name by ID
  const getCategoryName = (categoryId: number | null | undefined): string => {
    if (!categoryId) return 'N/A';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-amber-400 mb-4">Product Grid Layout Management</h2>
        
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex flex-col">
            <label className="text-sm text-slate-400 mb-1">Filter by Till</label>
            <select
              value={filterTillId}
              onChange={(e) => setFilterTillId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md p-2 text-sm"
            >
              <option value="all">All Tills & Shared</option>
              <option value="shared">Shared Layouts Only</option>
              {tills.map(till => (
                <option key={till.id} value={till.id.toString()}>{till.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-sm text-slate-40 mb-1">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-md p-2 text-sm"
            >
              <option value="all">All Types</option>
              <option value="all">All Products</option>
              <option value="favorites">Favorites</option>
              <option value="category">Category</option>
            </select>
          </div>
          
          <div className="flex flex-col flex-grow max-w-md">
            <label className="text-sm text-slate-400 mb-1">Search</label>
            <VKeyboardInput
              k-type="full"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search layouts..."
              className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-sm"
            />
          </div>
        </div>
        
        <div className="flex items-end">
          <button
            onClick={handleCreateNewLayout}
            className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-md text-sm"
          >
            Create New Layout
          </button>
        </div>
      </div>
      
      {error && (
          <div className="mb-4 p-3 bg-red-900 text-red-100 rounded-md">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-amber-400 text-lg">Loading layouts...</div>
          </div>
        ) : (
          <div className="flex-grow overflow-y-auto">
            {filteredLayouts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No layouts found matching your criteria.
              </div>
            ) : (
              Object.entries(groupedLayouts).map(([filterType, typeLayouts]) => (
                <div key={filterType} className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-300 mb-3">
                    {filterType === 'all' && 'All Products Layouts'}
                    {filterType === 'favorites' && 'Favorites Layouts'}
                    {filterType === 'category' && 'Category Layouts'}
                    <span className="text-sm text-slate-500 ml-2">({typeLayouts.length} layout{typeLayouts.length !== 1 ? 's' : ''})</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeLayouts.map(layout => (
                      <div key={layout.id} className="bg-slate-800 p-4 rounded-md">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg truncate max-w-[70%]">{layout.name}</h3>
                          <span className={`px-2 py-1 rounded text-xs ${
                            layout.isShared ? 'bg-purple-700 text-purple-100' :
                            layout.tillName === 'Shared' ? 'bg-purple-700 text-purple-100' :
                            'bg-blue-700 text-blue-100'
                          }`}>
                            {layout.isShared || layout.tillName === 'Shared' ? 'Shared' : layout.tillName}
                          </span>
                        </div>
                        
                        <div className="text-sm text-slate-400 mb-2">
                          <p>Type: {layout.filterType || 'all'}</p>
                          <p>Category: {layout.filterType === 'all' ? 'All Products' : layout.filterType === 'favorites' ? 'Favorites' : layout.filterType === 'category' ? getCategoryName(layout.categoryId) : 'N/A'}</p>
                          <p>Items: {layout.layout?.gridItems?.length || 0}</p>
                        </div>
                        
                        <div className="flex items-center mb-3">
                          <span className={`text-xs px-2 py-1 rounded ${
                            layout.isDefault ? 'bg-green-700 text-green-100' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {layout.isDefault ? 'Default Layout' : 'Custom Layout'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEditLayout(layout)}
                            className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-3 rounded-md text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleSetAsDefault(layout)}
                            disabled={layout.isDefault}
                            className={`flex-1 font-bold py-2 px-3 rounded-md text-sm ${
                              layout.isDefault
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                                : 'bg-amber-600 hover:bg-amber-500 text-white'
                            }`}
                          >
                            {layout.isDefault ? 'Default' : 'Set Default'}
                          </button>
                          <button
                            onClick={() => handleCopyLayout(layout)}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-3 rounded-md text-sm"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => setDeletingLayout(layout)}
                            className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-md text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      </div>
      
      {/* Edit Layout Modal */}
      {editingLayout && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-amber-400 mb-4">Edit Layout</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400">Layout Name</label>
                <VKeyboardInput
                  k-type="full"
                  type="text"
                  value={editingLayout.name}
                  onChange={(e) => setEditingLayout(prev => prev ? {...prev, name: e.target.value} : null)}
                  className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm text-slate-400">Filter Type</label>
                <select
                  value={editingLayout.filterType || 'all'}
                  onChange={(e) => setEditingLayout(prev => prev ? {...prev, filterType: e.target.value as 'all' | 'favorites' | 'category'} : null)}
                  className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
                >
                  <option value="all">All Products</option>
                  <option value="favorites">Favorites</option>
                  <option value="category">Category</option>
                </select>
              </div>
              
              {(editingLayout.filterType === 'category' || editingLayout.filterType === 'all' || editingLayout.filterType === 'favorites') && (
                <div>
                  <label className="block text-sm text-slate-400">Category</label>
                  <select
                    value={editingLayout.categoryId !== null ? editingLayout.categoryId : (editingLayout.filterType === 'all' ? 0 : (editingLayout.filterType === 'favorites' ? -1 : ''))}
                    onChange={(e) => {
                      const value = e.target.value;
                      let categoryId: number | null;
                      if (value === '0') {
                        categoryId = 0;
                      } else if (value === '-1') {
                        categoryId = -1;
                      } else {
                        categoryId = value === '' ? null : parseInt(value);
                      }
                      setEditingLayout(prev => prev ? {...prev, categoryId} : null);
                    }}
                    className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
                  >
                    {editingLayout.filterType === 'all' && (
                      <option value={0}>All Products</option>
                    )}
                    {editingLayout.filterType === 'favorites' && (
                      <option value={-1}>Favorites</option>
                    )}
                    {editingLayout.filterType === 'category' && (
                      <option value="">Select a category</option>
                    )}
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={editingLayout.isDefault}
                  onChange={(e) => setEditingLayout(prev => prev ? {...prev, isDefault: e.target.checked} : null)}
                  className="mr-2"
                />
                <label htmlFor="isDefault" className="text-sm">Set as Default Layout</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
              <button
                onClick={() => setEditingLayout(null)}
                className="bg-slate-60 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLayout}
                className="bg-amber-60 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Copy Layout Modal */}
      {layoutToCopy && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700">
            <h3 className="text-xl font-bold text-amber-400 mb-4">Copy Layout to Till</h3>
            
            <p className="mb-4">Copy layout "{layoutToCopy.name}" to:</p>
            
            <div className="mb-4">
              <label className="block text-sm text-slate-400">Target Till</label>
              <select
                value={copiedLayoutTillId || ''}
                onChange={(e) => setCopiedLayoutTillId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
              >
                <option value="">Select a till</option>
                {tills
                  .filter(till => layoutToCopy.tillId !== till.id) // Exclude source till
                  .map(till => (
                    <option key={till.id} value={till.id}>{till.name}</option>
                  ))}
              </select>
            </div>
            
            <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
              <button 
                onClick={() => {
                  setLayoutToCopy(null);
                  setCopiedLayoutTillId(null);
                }} 
                className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmCopyLayout} 
                disabled={!copiedLayoutTillId}
                className={`font-bold py-2 px-4 rounded-md ${
                  copiedLayoutTillId 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                    : 'bg-slate-700 text-slate-40 cursor-not-allowed'
                }`}
              >
                Copy Layout
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingLayout}
        message={`Are you sure you want to delete the layout "${deletingLayout?.name}"?`}
        onConfirm={handleDeleteLayout}
        onCancel={() => setDeletingLayout(null)}
      />
      </div>
    </div>
  );
};
