import React from 'react';
import type { Category } from '../../shared/types';

interface ProductGridLayoutData {
  id?: string | number;
 name: string;
 tillId: number;
  layout: any;
  isDefault: boolean;
  filterType?: 'all' | 'favorites' | 'category';
  categoryId?: number | null;
}

type FilterType = 'all' | 'favorites' | 'category';

interface AvailableLayoutsPanelProps {
  availableLayouts: ProductGridLayoutData[];
  loadingLayouts: boolean;
  error: string | null;
  filterType: FilterType;
  setFilterType: (type: FilterType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: Category[];
  handleSetAsDefault: (layoutId: string | number) => void;
  handleLoadLayout: (layoutId: string | number) => void;
  handleDeleteLayout: (layoutId: string | number) => void;
  handleCreateNewLayout: () => void;
  setShowConfirmationModal: (modal: {show: boolean, layoutId?: string | number, layoutName?: string}) => void;
}

const AvailableLayoutsPanel: React.FC<AvailableLayoutsPanelProps> = ({
  availableLayouts,
  loadingLayouts,
  error,
  filterType,
  setFilterType,
  searchQuery,
 setSearchQuery,
  categories,
  handleSetAsDefault,
  handleLoadLayout,
  handleDeleteLayout,
  handleCreateNewLayout,
  setShowConfirmationModal,
}) => {
  const filteredLayouts = availableLayouts.filter(layout => {
    const layoutFilterType = layout.filterType || 'all'; // Default to 'all' if filterType is undefined
    const matchesFilter = filterType === 'all' ||
      (filterType === 'favorites' && layoutFilterType === 'favorites') ||
      (filterType === 'category' && layoutFilterType === 'category');
    const matchesSearch = layout.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-slate-700 p-4 rounded-lg h-full">
      <h3 className="text-lg font-semibold mb-2">Available Layouts</h3>
      
      <div className="mb-3">
        <label className="block text-sm mb-1">Filter</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
          className="w-full p-2 rounded bg-slate-600 text-white border-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-700"
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
            className="w-full bg-amber-600 hover:bg-amber-500 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-700"
          >
            + Create New Layout
          </button>
        </>
      )}
    </div>
  );
};

export default AvailableLayoutsPanel;