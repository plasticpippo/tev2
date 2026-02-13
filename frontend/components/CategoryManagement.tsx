import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('admin');
  const [name, setName] = useState(category?.name || '');
  const [visibleTillIds, setVisibleTillIds] = useState<number[]>(category?.visibleTillIds ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTillToggle = (tillId: number) => {
    setVisibleTillIds(prev =>
      prev.includes(tillId) ? prev.filter(id => id !== tillId) : [...prev, tillId]
    );
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = t('categories.validation.nameRequired');
    } else if (name.trim().length > 255) {
      newErrors.name = t('categories.validation.nameMaxLength');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await productApi.saveCategory({ id: category?.id, name, visibleTillIds });
      onSave();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error instanceof Error ? error.message : t('categories.errors.failedToSave'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">{category ? t('categories.editCategory') : t('categories.addCategory')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400">{t('categories.categoryName')}</label>
            <VKeyboardInput
              k-type="full"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => {
                  const {[name]: _, ...rest} = prev;
                  return rest;
                });
              }}
              maxLength={255}
              className={`w-full mt-1 p-3 bg-slate-800 border rounded-md ${errors.name ? 'border-red-500' : 'border-slate-700'}`}
              autoFocus
              required
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-400">{t('categories.visibleTills')}</label>
            <p className="text-xs text-slate-500 mb-2">{t('categories.visibleTillsHint')}</p>
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
          <button type="button" onClick={onClose} className="btn btn-secondary">{t('buttons.cancel', { ns: 'common' })}</button>
          <button type="submit" className="btn btn-primary">{t('buttons.save', { ns: 'common' })}</button>
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
  const { t } = useTranslation('admin');
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
        alert(error instanceof Error ? error.message : t('categories.errors.failedToDelete'));
      }
    }
  };

  const getTillNames = (tillIds: number[] | null): string => {
    if (!tillIds || tillIds.length === 0) return t('categories.allTills');
    // Ensure tillIds is an array before calling .map()
    const idsArray = Array.isArray(tillIds) ? tillIds : [];
    return idsArray.map(id => tills.find(t => t.id === id)?.name).filter(Boolean).join(', ') || t('categories.none');
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-300">{t('categories.title')}</h3>
        <button
          onClick={() => { setEditingCategory(undefined); setIsModalOpen(true); }}
          className="btn btn-primary"
        >
          {t('categories.addCategory')}
        </button>
      </div>
      <div className="flex-grow space-y-2 overflow-y-auto pr-2">
        {categories.map(category => (
          <div key={category.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
            <div>
              <p className="font-semibold">{category.name}</p>
              <p className="text-sm text-slate-400">{t('categories.visibleOn')}: {getTillNames(category.visibleTillIds)}</p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => { setEditingCategory(category); setIsModalOpen(true); }}
                    className="btn btn-secondary btn-sm"
                >
                    {t('buttons.edit', { ns: 'common' })}
                </button>
                 <button
                    onClick={() => setDeletingCategory(category)}
                    className="btn btn-danger btn-sm"
                >
                    {t('buttons.delete', { ns: 'common' })}
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
         title={t('confirmation.confirmDelete', { ns: 'common' })}
         message={t('categories.confirmDelete', { name: deletingCategory?.name })}
         onConfirm={confirmDelete}
         onCancel={() => setDeletingCategory(null)}
       />
    </div>
  );
};