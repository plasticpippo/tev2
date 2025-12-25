import React, { useState } from 'react';
import type { Category, Till } from '@shared/types';
import * as productApi from '../services/productService';
import * as tillApi from '../services/tillService';
import { VKeyboardInput } from './VKeyboardInput';
import ConfirmationModal from './ConfirmationModal';

interface CategoryModalProps {
  category?: Category;
  tills: Till[];
  onClose: () => void;
  onSave: () => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, tills, onClose, onSave }) => {
  const [name, setName] = useState(category?.name || '');
  const [visibleTillIds, setVisibleTillIds] = useState<number[]>(category?.visibleTillIds || []);

  const handleTillToggle = (tillId: number) => {
    setVisibleTillIds(prev =>
      prev.includes(tillId) ? prev.filter(id => id !== tillId) : [...prev, tillId]
    );
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await productApi.saveCategory({ id: category?.id, name, visibleTillIds });
      onSave();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error instanceof Error ? error.message : 'Failed to save category. Please check your data and try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">{category ? 'Edit' : 'Add'} Category</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400">Category Name</label>
            <VKeyboardInput
              k-type="full"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400">Visibility</label>
            <p className="text-xs text-slate-500 mb-2">Select which tills this category appears on. Leave all unchecked to show on all tills.</p>
            <div className="space-y-2">
                {tills.map(till => (
                    <label key={till.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={visibleTillIds.includes(till.id)}
                            onChange={() => handleTillToggle(till.id)}
                            className="h-4 w-4 rounded text-amber-500 bg-slate-700 border-slate-600 focus:ring-amber-500"
                        />
                        <span>{till.name}</span>
                    </label>
                ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">Cancel</button>
          <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md">Save</button>
        </div>
      </form>
    </div>
  );
};


interface CategoryManagementProps {
    categories: Category[];
    tills: Till[];
    onDataUpdate: () => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({ categories, tills, onDataUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const handleSave = () => {
    setIsModalOpen(false);
    setEditingCategory(undefined);
    onDataUpdate();
  };

  const confirmDelete = async () => {
    if (deletingCategory) {
      try {
        await productApi.deleteCategory(deletingCategory.id);
        setDeletingCategory(null);
        onDataUpdate();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(error instanceof Error ? error.message : 'Failed to delete category. The category may have associated products or be in use elsewhere.');
      }
    }
  };

  const getTillNames = (tillIds: number[] | null): string => {
    if (!tillIds || tillIds.length === 0) return "All Tills";
    return tillIds.map(id => tills.find(t => t.id === id)?.name).filter(Boolean).join(', ') || 'None';
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-300">Category Management</h3>
        <button
          onClick={() => { setEditingCategory(undefined); setIsModalOpen(true); }}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md"
        >
          Add Category
        </button>
      </div>
      <div className="flex-grow space-y-2 overflow-y-auto pr-2">
        {categories.map(category => (
          <div key={category.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
            <div>
              <p className="font-semibold">{category.name}</p>
              <p className="text-sm text-slate-400">Visible on: {getTillNames(category.visibleTillIds)}</p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => { setEditingCategory(category); setIsModalOpen(true); }}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 text-sm rounded-md"
                >
                    Edit
                </button>
                 <button
                    onClick={() => setDeletingCategory(category)}
                    className="bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-3 text-sm rounded-md"
                >
                    Delete
                </button>
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <CategoryModal
          category={editingCategory}
          tills={tills}
          onClose={() => { setIsModalOpen(false); setEditingCategory(undefined); }}
          onSave={handleSave}
        />
      )}
       <ConfirmationModal
         show={!!deletingCategory}
         title="Confirm Delete"
         message={`Are you sure you want to delete the category "${deletingCategory?.name}"? Products in this category will become uncategorized.`}
         onConfirm={confirmDelete}
         onCancel={() => setDeletingCategory(null)}
       />
    </div>
  );
};