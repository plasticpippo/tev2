import React from 'react';
import type { Till } from '../../shared/types';

interface LayoutConfigurationSectionProps {
  layoutName: string;
  setLayoutName: (name: string) => void;
  selectedTill: number | null;
  setSelectedTill: (tillId: number | null) => void;
  tills: Till[];
  isDefault: boolean;
  setIsDefault: (isDefault: boolean) => void;
  handleSaveLayout: () => void;
  handleSaveAsNewLayout: () => void;
  onCancel: () => void;
  currentLayoutId: string | number | null;
  handleClearGrid: () => void;
}

const LayoutConfigurationSection: React.FC<LayoutConfigurationSectionProps> = ({
  layoutName,
  setLayoutName,
  selectedTill,
  setSelectedTill,
  tills,
  isDefault,
  setIsDefault,
  handleSaveLayout,
  handleSaveAsNewLayout,
  onCancel,
  currentLayoutId,
  handleClearGrid,
}) => {
  return (
    <div className="mb-4">
      <div className="mb-3">
        <label htmlFor="layout-name" className="block text-sm mb-1 text-slate-200">Layout Name</label>
        <input
          id="layout-name"
          type="text"
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value)}
          className="w-full p-2 rounded bg-slate-600 text-white border-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-slate-700"
          placeholder="Enter layout name"
        />
      </div>
      <div className="mb-3">
        <label htmlFor="select-till" className="block text-sm mb-1 text-slate-200">Select Till</label>
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
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="form-checkbox rounded text-amber-500 focus:ring-amber-400"
          />
          <span className="text-sm text-slate-200">Set as Default Layout</span>
        </label>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={handleSaveLayout}
          disabled={!selectedTill}
          className={`flex-1 py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-700 ${
            !selectedTill 
              ? 'bg-gray-500 cursor-not-allowed' 
              : 'bg-amber-600 hover:bg-amber-500 text-white'
          }`}
        >
          {currentLayoutId ? 'Update Layout' : 'Save Layout'}
        </button>
        {currentLayoutId && (
          <button
            onClick={handleSaveAsNewLayout}
            className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-700"
          >
            Save As New
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onCancel}
          className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-700"
        >
          Cancel
        </button>
        <button
          onClick={handleClearGrid}
          className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-700"
        >
          Clear Grid
        </button>
      </div>
    </div>
  );
};

export default LayoutConfigurationSection;