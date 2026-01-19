import React from 'react';
import type { Category } from '@shared/types';
import type { ProductGridLayoutData, FilterType } from './useProductGridLayoutCustomizer';
import { formatCurrency } from '../utils/formatting';

interface AvailableLayoutsSectionProps {
  loadingLayouts: boolean;
  deletingLayout: boolean;
  settingDefaultLayout: boolean;
  error: string | null;
  filterType: FilterType;
  setFilterType: (filterType: FilterType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredLayouts: ProductGridLayoutData[];
  categories: Category[];
  handleSetAsDefault: (layoutId: string | number) => void;
  handleLoadLayout: (layoutId: string | number) => void;
  handleDeleteLayout: (layoutId: string | number) => void;
  setShowConfirmationModal: (modalState: {show: boolean, layoutId?: string | number, layoutName?: string}) => void;
  handleCreateNewLayout: () => void;
  currentLayoutId: string | number | null;
}

const AvailableLayoutsSection: React.FC<AvailableLayoutsSectionProps> = ({
  loadingLayouts,
  deletingLayout,
  settingDefaultLayout,
  error,
  filterType,
  setFilterType,
  searchQuery,
  setSearchQuery,
  filteredLayouts,
  categories,
  handleSetAsDefault,
  handleLoadLayout,
  handleDeleteLayout,
  setShowConfirmationModal,
  handleCreateNewLayout,
  currentLayoutId,
}) => {
  return (
    <div className="bg-slate-700 p-4 rounded-lg h-full">
      <h3 className="text-lg font-semibold mb-2">Available Layouts</h3>
      
      <div className="mb-3">
        <label className="block text-sm mb-1">Filter</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as FilterType)}
          className="w-full p-2 rounded bg-slate-600 text-white border-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-700"
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
                        disabled={settingDefaultLayout}
                        className={`text-xs px-2 py-1 rounded ${
                          settingDefaultLayout
                            ? 'bg-gray-500 cursor-not-allowed'
                            : 'bg-slate-500 hover:bg-slate-400 text-white'
                        }`}
                      >
                        {settingDefaultLayout ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Setting...
                          </span>
                        ) : 'Set Default'}
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
                      disabled={deletingLayout}
                      className={`text-xs px-2 py-1 rounded ${
                        deletingLayout
                          ? 'bg-gray-500 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-500 text-white'
                      }`}
                    >
                      {deletingLayout ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Del
                        </span>
                      ) : 'Del'}
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

export default AvailableLayoutsSection;