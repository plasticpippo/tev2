import React from 'react';
import { useLayout } from '../contexts/LayoutContext';
import type { Category } from '@shared/types';

interface CategoryTabsProps {
  categories: Category[];
  assignedTillId: number | null;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({ 
  categories,
  assignedTillId 
}) => {
  const { currentCategoryId, setCurrentCategory } = useLayout();

  // Filter categories visible for this till
  const visibleCategories = React.useMemo(() => {
    if (!assignedTillId) return categories;
    return categories.filter(c => 
      !c.visibleTillIds || 
      c.visibleTillIds.length === 0 || 
      c.visibleTillIds.includes(assignedTillId)
    );
  }, [categories, assignedTillId]);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Favourites button */}
      <button
        onClick={() => setCurrentCategory('favourites')}
        className={`
          px-4 py-2 rounded-lg font-semibold transition-colors text-base
          ${currentCategoryId === 'favourites'
            ? 'bg-amber-600 text-white'
            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }
        `}
      >
        ⭐ Favourites
      </button>

      {/* Category buttons */}
      {visibleCategories.map(category => (
        <button
          key={category.id}
          onClick={() => setCurrentCategory(category.id)}
          className={`
            px-4 py-2 rounded-lg font-semibold transition-colors text-base
            ${currentCategoryId === category.id
              ? 'bg-amber-600 text-white'
              : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
            }
          `}
        >
          {category.name}
        </button>
      ))}

      {/* All button */}
      <button
        onClick={() => setCurrentCategory('all')}
        className={`
          ml-auto px-4 py-2 rounded-lg font-semibold transition-colors text-base
          ${currentCategoryId === 'all'
            ? 'bg-slate-600 text-white'
            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }
        `}
      >
        All
      </button>
    </div>
  );
};