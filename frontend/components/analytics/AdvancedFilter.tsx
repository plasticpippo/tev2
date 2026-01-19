import React, { useState, useEffect } from 'react';
import type { Category, Product } from '../../shared/types';

interface AdvancedFilterProps {
  categories: Category[];
  products: Product[];
  onFilterChange: (filters: any) => void;
  initialFilters?: any;
}

export const AdvancedFilter: React.FC<AdvancedFilterProps> = ({
  categories,
  products,
  onFilterChange,
  initialFilters = {}
}) => {
  const [startDate, setStartDate] = useState<string>(initialFilters.startDate || '');
  const [endDate, setEndDate] = useState<string>(initialFilters.endDate || '');
  const [selectedProductId, setSelectedProductId] = useState<number | ''>(initialFilters.productId || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>(initialFilters.categoryId || '');
  const [sortBy, setSortBy] = useState<'revenue' | 'quantity' | 'name'>(initialFilters.sortBy || 'revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialFilters.sortOrder || 'desc');

  useEffect(() => {
    const filters = {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      productId: selectedProductId || undefined,
      categoryId: selectedCategoryId || undefined,
      sortBy,
      sortOrder
    };
    
    onFilterChange(filters);
  }, [startDate, endDate, selectedProductId, selectedCategoryId, sortBy, sortOrder]);

  return (
    <div className="bg-slate-800 p-4 rounded-lg mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="start-date" className="block text-sm font-medium text-slate-300 mb-1">Start Date</label>
          <input
            id="start-date"
            data-testid="start-date-input"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        
        <div>
          <label htmlFor="end-date" className="block text-sm font-medium text-slate-300 mb-1">End Date</label>
          <input
            id="end-date"
            data-testid="end-date-input"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        
        <div>
          <label htmlFor="category-select" className="block text-sm font-medium text-slate-300 mb-1">Category</label>
          <select
            id="category-select"
            data-testid="category-select"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="product-select" className="block text-sm font-medium text-slate-300 mb-1">Product</label>
          <select
            id="product-select"
            data-testid="product-select"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Products</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Sort By</label>
          <div role="radiogroup" aria-label="Sort By" className="flex gap-2">
            {(['revenue', 'quantity', 'name'] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setSortBy(option)}
                className={`px-3 py-1 text-sm rounded-md ${
                  sortBy === option
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
                role="radio"
                aria-checked={sortBy === option}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Order</label>
          <div role="radiogroup" aria-label="Order" className="flex gap-2">
            {(['asc', 'desc'] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setSortOrder(option)}
                className={`px-3 py-1 text-sm rounded-md ${
                  sortOrder === option
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
                role="radio"
                aria-checked={sortOrder === option}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};