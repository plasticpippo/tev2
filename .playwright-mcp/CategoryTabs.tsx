import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { currentCategoryId, setCurrentCategory } = useLayout();

  // Filter categories visible for this till
  // Exclude categories named "Favorites" or "Favourites" since there's a hardcoded ⭐ Favourites button
  const visibleCategories = React.useMemo(() => {
    const filtered = categories.filter(c =>
      c.name.toLowerCase() !== 'favorites' &&
      c.name.toLowerCase() !== 'favourites'
    );
    if (!assignedTillId) return filtered;
    return filtered.filter(c =>
      !c.visibleTillIds ||
      c.visibleTillIds.length === 0 ||
      c.visibleTillIds.includes(assignedTillId)
    );
  }, [categories, assignedTillId]);

  return (
    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 touch-pan-x scrollbar-hide">
      {/* Favourites button */}
      <button
        onClick={() => setCurrentCategory('favourites')}
        className={`
          px-4 py-2 min-h-11 rounded-lg font-semibold transition-colors text-base whitespace-nowrap flex-shrink-0
          ${currentCategoryId === 'favourites'
            ? 'bg-amber-600 text-white'
            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }
        `}
      >
        {t('categoryTabs.favourites')}
      </button>

      {/* Category buttons */}
      {visibleCategories.map(category => (
        <button
          key={category.id}
          onClick={() => setCurrentCategory(category.id)}
          className={`
            px-4 py-2 min-h-11 rounded-lg font-semibold transition-colors text-base whitespace-nowrap flex-shrink-0
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
          px-4 py-2 min-h-11 rounded-lg font-semibold transition-colors text-base whitespace-nowrap flex-shrink-0
          ${currentCategoryId === 'all'
            ? 'bg-slate-600 text-white'
            : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
          }
        `}
      >
        {t('categoryTabs.all')}
      </button>
    </div>
  );
};