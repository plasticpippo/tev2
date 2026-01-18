import React, { useState } from 'react';
import { saveGridLayout } from '../services/gridLayoutService';
import { VKeyboardInput } from './VKeyboardInput';

// Define the Till and Category interfaces locally since @shared/types is not available
interface Till {
  id: number;
  name: string;
  // Add other properties as needed
}

interface Category {
  id: number;
  name: string;
  // Add other properties as needed
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

interface CreateLayoutModalProps {
  show: boolean;
  onClose: () => void;
  tills: Till[];
  onCreate: (newLayoutData: Omit<LayoutWithTillInfo, 'id' | 'layout'> & { layout?: any }) => Promise<void>;
  onDataUpdate: () => void;
}

export const CreateLayoutModal: React.FC<CreateLayoutModalProps> = ({
  show,
  onClose,
  tills,
  onCreate,
  onDataUpdate
}) => {
  const [newLayout, setNewLayout] = useState<Omit<LayoutWithTillInfo, 'id' | 'layout'> & { layout?: any }>({
    name: 'New Layout',
    tillId: tills[0]?.id || 0,
    isDefault: false,
    filterType: 'all',
    categoryId: null,
    layout: {
      columns: 4,
      gridItems: [],
      version: '1.0'
    }
  });

  const handleSaveNewLayout = async () => {
    try {
      await onCreate(newLayout);
      onClose();
      onDataUpdate(); // Notify parent to refresh data if needed
    } catch (error) {
      console.error('Error saving new layout:', error);
      alert('Failed to save new layout: ' + (error as Error).message);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">Create New Layout</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400">Layout Name</label>
            <VKeyboardInput
              k-type="full"
              type="text"
              value={newLayout.name}
              onChange={(e) => setNewLayout(prev => ({...prev, name: e.target.value}))}
              className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400">Till</label>
            <select
              value={newLayout.tillId}
              onChange={(e) => setNewLayout(prev => ({...prev, tillId: parseInt(e.target.value)}))}
              className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
            >
              {tills.map(till => (
                <option key={till.id} value={till.id}>{till.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400">Filter Type</label>
            <select
              value={newLayout.filterType || 'all'}
              onChange={(e) => setNewLayout(prev => ({...prev, filterType: e.target.value as 'all' | 'favorites' | 'category'}))}
              className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
            >
              <option value="all">All Products</option>
              <option value="favorites">Favorites</option>
              <option value="category">Category</option>
            </select>
          </div>
          
          {(newLayout.filterType === 'category') && (
            <div>
              <label className="block text-sm text-slate-400">Category</label>
              <select
                value={newLayout.categoryId !== null ? newLayout.categoryId : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const categoryId = value === '' ? null : parseInt(value);
                  setNewLayout(prev => ({...prev, categoryId}));
                }}
                className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
              >
                <option value="">Select a category</option>
                {/* Categories would be passed as props if needed */}
              </select>
            </div>
          )}
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isDefault"
              checked={newLayout.isDefault}
              onChange={(e) => setNewLayout(prev => ({...prev, isDefault: e.target.checked}))}
              className="mr-2"
            />
            <label htmlFor="isDefault" className="text-sm">Set as Default Layout</label>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveNewLayout}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md"
          >
            Create Layout
          </button>
        </div>
      </div>
    </div>
  );
};