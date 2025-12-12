import React, { useState, useEffect } from 'react';
import type { ProductGridLayoutData } from '../services/apiBase';

interface LayoutSelectionDropdownProps {
  tillId: number | null;
  filterType: 'all' | 'favorites' | 'category';
  categoryId: number | null;
  currentLayoutId: string | number | null;
  onLayoutChange: (layout: ProductGridLayoutData) => void;
  className?: string;
}

export const LayoutSelectionDropdown: React.FC<LayoutSelectionDropdownProps> = ({
  tillId,
  filterType,
  categoryId,
  currentLayoutId,
  onLayoutChange,
  className = ''
}) => {
  const [layouts, setLayouts] = useState<ProductGridLayoutData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load layouts for the current filter type and till
  useEffect(() => {
    const loadLayouts = async () => {
      if (!tillId) {
        setLayouts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Import the service function dynamically to avoid circular dependencies
        const { getLayoutsByFilterType } = await import('../services/gridLayoutService');
        
        // Get layouts for the specific filter type and category
        const filteredLayouts = await getLayoutsByFilterType(tillId, filterType, categoryId);
        
        setLayouts(filteredLayouts);
      } catch (err) {
        console.error('Error loading layouts:', err);
        setError('Failed to load layouts');
      } finally {
        setLoading(false);
      }
    };

    loadLayouts();
  }, [tillId, filterType, categoryId]);

  const handleLayoutChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const layoutId = e.target.value;
    const selectedLayout = layouts.find(layout => layout.id?.toString() === layoutId);
    
    if (selectedLayout) {
      onLayoutChange(selectedLayout);
    }
 };

  // Get the display name for a category
  const getCategoryName = (categoryId: number | null): string => {
    if (!categoryId) return '';
    // In a real implementation, you would get this from props or context
    // For now, we'll return a placeholder
    return `Category ${categoryId}`;
  };

  // Determine the label for the current filter type
  const getFilterLabel = (): string => {
    if (filterType === 'favorites') return 'Favorites';
    if (filterType === 'category' && categoryId) return `Category: ${getCategoryName(categoryId)}`;
    return 'All Products';
  };

 return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <label htmlFor="layout-select" className="text-sm font-medium text-slate-300">
        Layout for {getFilterLabel()}:
      </label>
      {loading ? (
        <div className="text-amber-400 text-sm">Loading layouts...</div>
      ) : error ? (
        <div className="text-red-400 text-sm">{error}</div>
      ) : (
        <select
          id="layout-select"
          value={currentLayoutId || ''}
          onChange={handleLayoutChange}
          className="bg-slate-700 text-white border-slate-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {layouts.map(layout => (
            <option key={layout.id} value={layout.id}>
              {layout.name} {layout.isDefault ? '(Default)' : ''}
            </option>
          ))}
          {layouts.length === 0 && (
            <option value="">No layouts available</option>
          )}
        </select>
      )}
    </div>
  );
};