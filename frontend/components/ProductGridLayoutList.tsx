import React, { useState, useEffect } from 'react';
import type { Till, Category } from '@shared/types';
import { getGridLayoutsForTill, getSharedLayouts } from '../services/gridLayoutService';
import { LayoutCard } from './LayoutCard';
import { VKeyboardInput } from './VKeyboardInput';

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

interface ProductGridLayoutListProps {
  tills: Till[];
  categories: Category[];
  onDataUpdate: () => void;
  onEditLayout: (layout: LayoutWithTillInfo) => void;
  onDeleteLayout: (layout: LayoutWithTillInfo) => void;
  onSetAsDefault: (layout: LayoutWithTillInfo) => void;
  onCopyLayout: (layout: LayoutWithTillInfo) => void;
}

export const ProductGridLayoutList: React.FC<ProductGridLayoutListProps> = ({ 
  tills, 
  categories, 
  onDataUpdate,
  onEditLayout,
  onDeleteLayout,
  onSetAsDefault,
  onCopyLayout
}) => {
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
            <label className="text-sm text-slate-400 mb-1">Filter by Type</label>
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
                    <LayoutCard
                      key={layout.id}
                      layout={layout}
                      categoryName={getCategoryName(layout.categoryId)}
                      onEdit={() => onEditLayout(layout)}
                      onSetAsDefault={() => onSetAsDefault(layout)}
                      onCopy={() => onCopyLayout(layout)}
                      onDelete={() => onDeleteLayout(layout)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
