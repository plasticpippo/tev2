import React from 'react';
import type { Till } from '../../shared/types';

interface LayoutConfigurationFormProps {
  layoutName: string;
  setLayoutName: (name: string) => void;
  selectedTill: number | null;
  setSelectedTill: (tillId: number | null) => void;
  tills: Till[];
  isDefault: boolean;
  setIsDefault: (isDefault: boolean) => void;
  activeFilterType: 'all' | 'favorites' | 'category';
  activeCategoryId: number | null;
  categories: any[]; // Using any for now since we don't have the exact Category type imported
  handleSaveLayout: () => void;
  handleSaveAsNewLayout: () => void;
  onCancel: () => void;
  currentLayoutId: string | number | null;
  handleClearGrid: () => void;
}

const LayoutConfigurationForm: React.FC<LayoutConfigurationFormProps> = ({
  layoutName,
  setLayoutName,
  selectedTill,
  setSelectedTill,
  tills,
  isDefault,
  setIsDefault,
  activeFilterType,
  activeCategoryId,
  categories,
  handleSaveLayout,
  handleSaveAsNewLayout,
  onCancel,
  currentLayoutId,
  handleClearGrid,
}) => {
  return (
    <div className="bg-slate-700 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-amber-300">Layout Settings</h3>
      <div className="mb-3">
        <label htmlFor="layout-name" className="block text-sm mb-1 text-slate-20">Layout Name</label>
        <input
          id="layout-name"
          type="text"
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value)}
          className="w-full p-2 rounded bg-slate-600 text-white border-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-700"
          placeholder="Enter layout name"
          autoComplete="off"
        />
      </div>
      <div className="mb-3">
        <label htmlFor="select-till" className="block text-sm mb-1 text-slate-20">Select Till</label>
        <select
          id="select-till"
          value={selectedTill || ''}
          onChange={(e) => {
            const value = e.target.value ? parseInt(e.target.value) : null;
            setSelectedTill(value);
          }}
          className="w-full p-2 rounded bg-slate-600 text-white border-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <option value="">Select a till</option>
          {tills.map(till => (
            <option key={till.id} value={till.id}>{till.name}</option>
          ))}
        </select>
      </div>
      <div className="mb-3">
        <label className="block text-sm mb-1 text-slate-200">Active Filter Type</label>
        <div className="p-2 rounded bg-slate-600 text-white border border-slate-500">
          {activeFilterType === 'all' && 'All Products'}
          {activeFilterType === 'favorites' && 'Favorites Only'}
          {activeFilterType === 'category' && activeCategoryId !== null &&
            `Category: ${categories.find(c => c.id === activeCategoryId)?.name || 'Unknown'}`}
        </div>
      </div>
      
      <div className="mb-3">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="h-4 w-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
            id="set-default"
          />
          <span className="text-sm text-slate-200">
            Set as default layout for{' '}
            {activeFilterType === 'all' && 'All Products'}
            {activeFilterType === 'favorites' && 'Favorites'}
            {activeFilterType === 'category' && activeCategoryId !== null &&
              `Category: ${categories.find(c => c.id === activeCategoryId)?.name || 'Unknown'}`}
          </span>
        </label>
      </div>
      
      <div className="flex flex-col gap-2">
        <button
          onClick={handleSaveLayout}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400 transition"
        >
          {currentLayoutId ? 'Update Layout' : 'Save New Layout'}
        </button>
        {currentLayoutId && (
          <button
            onClick={handleSaveAsNewLayout}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          >
            Save As New
          </button>
        )}
        <button
          onClick={onCancel}
          className="bg-slate-60 hover:bg-slate-700 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-slate-400 transition"
        >
          Cancel
        </button>
      </div>
      <button
        onClick={handleClearGrid}
        className="w-full mt-2 bg-red-700 hover:bg-red-80 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 transition"
      >
        Clear Grid
      </button>
    </div>
  );
};

export default LayoutConfigurationForm;