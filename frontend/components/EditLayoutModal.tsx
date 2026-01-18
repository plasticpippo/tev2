import React, { useState } from 'react';
import { saveGridLayout } from '../services/gridLayoutService';
import { VKeyboardInput } from './VKeyboardInput';
import type { ProductGridLayoutData } from '../services/apiBase';

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

interface EditLayoutModalProps {
  show: boolean;
  layout: LayoutWithTillInfo | null;
  onClose: () => void;
  onSave: (updatedLayout: LayoutWithTillInfo) => void;
  categories: Category[];
}

export const EditLayoutModal: React.FC<EditLayoutModalProps> = ({ 
  show, 
  layout, 
  onClose, 
  onSave,
  categories
}) => {
  const [editedLayout, setEditedLayout] = useState<LayoutWithTillInfo | null>(layout);

  // Update editedLayout when layout prop changes
  React.useEffect(() => {
    setEditedLayout(layout);
  }, [layout]);

  const handleSaveLayout = async () => {
    if (!editedLayout) return;
    
    try {
      const updatedLayout = await saveGridLayout(editedLayout);
      onSave(updatedLayout);
      onClose();
    } catch (error) {
      console.error('Error saving layout:', error);
      alert('Failed to save layout: ' + (error as Error).message);
    }
  };

  if (!show || !editedLayout) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">Edit Layout</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400">Layout Name</label>
            <VKeyboardInput
              k-type="full"
              type="text"
              value={editedLayout.name}
              onChange={(e) => setEditedLayout({...editedLayout, name: e.target.value})}
              className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400">Filter Type</label>
            <select
              value={editedLayout.filterType || 'all'}
              onChange={(e) => setEditedLayout({...editedLayout, filterType: e.target.value as 'all' | 'favorites' | 'category'})}
              className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
            >
              <option value="all">All Products</option>
              <option value="favorites">Favorites</option>
              <option value="category">Category</option>
            </select>
          </div>
          
          {(editedLayout.filterType === 'category' || editedLayout.filterType === 'all' || editedLayout.filterType === 'favorites') && (
            <div>
              <label className="block text-sm text-slate-400">Category</label>
              <select
                value={editedLayout.categoryId !== null ? editedLayout.categoryId : (editedLayout.filterType === 'all' ? 0 : (editedLayout.filterType === 'favorites' ? -1 : ''))}
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
                  setEditedLayout({...editedLayout, categoryId});
                }}
                className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
              >
                {editedLayout.filterType === 'all' && (
                  <option value={0}>All Products</option>
                )}
                {editedLayout.filterType === 'favorites' && (
                  <option value={-1}>Favorites</option>
                )}
                {editedLayout.filterType === 'category' && (
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
              checked={editedLayout.isDefault}
              onChange={(e) => setEditedLayout({...editedLayout, isDefault: e.target.checked})}
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
            onClick={handleSaveLayout}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};