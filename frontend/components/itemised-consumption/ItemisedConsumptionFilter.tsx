import React, { useState } from 'react';
import type { Category, StockItem } from '../../../shared/types';

interface FilterProps {
  categories: Category[];
  stockItems: StockItem[];
  onFilterChange: (filters: {
    startDate?: string;
    endDate?: string;
    categoryId?: number;
    stockItemType?: string;
  }) => void;
}

export const ItemisedConsumptionFilter: React.FC<FilterProps> = ({ 
  categories, 
  stockItems, 
  onFilterChange 
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockItemType, setSelectedStockItemType] = useState<string>('all');

  // Extract unique stock item types
  const stockItemTypes = [...new Set(stockItems.map(item => item.type))];

  const handleApplyFilters = () => {
    const filters: {
      startDate?: string;
      endDate?: string;
      categoryId?: number;
      stockItemType?: string;
    } = {};

    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (selectedCategory !== 'all') filters.categoryId = parseInt(selectedCategory);
    if (selectedStockItemType !== 'all') filters.stockItemType = selectedStockItemType;

    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedCategory('all');
    setSelectedStockItemType('all');
    
    onFilterChange({});
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg mb-6">
      <h3 className="text-lg font-semibold text-slate-300 mb-4">Filter Consumption Data</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id.toString()}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Stock Item Type Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">Stock Item Type</label>
          <select
            value={selectedStockItemType}
            onChange={(e) => setSelectedStockItemType(e.target.value)}
            className="w-full p-2 rounded-md bg-slate-700 border border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Types</option>
            {stockItemTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex gap-3 mt-4">
        <button
          onClick={handleApplyFilters}
          className="bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2 px-4 rounded-md transition"
        >
          Apply Filters
        </button>
        <button
          onClick={handleResetFilters}
          className="bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md transition"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
};