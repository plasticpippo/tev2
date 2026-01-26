import React from 'react';
import { useLayout } from '../contexts/LayoutContext';

export const EditModeToolbar: React.FC = () => {
  const { saveLayout, resetLayout, discardChanges, isDirty } = useLayout();

  const handleSave = () => {
    saveLayout();
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Discard changes and exit edit mode?')) {
        discardChanges();
      }
    } else {
      discardChanges();
    }
  };

  const handleReset = () => {
    resetLayout();
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 p-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-yellow-500 mb-2">
          EDIT MODE
        </h2>
        <p className="text-gray-400 text-sm">
          Drag product buttons to reposition them in the grid
        </p>
        {isDirty && (
          <div className="mt-2 text-yellow-400 text-xs flex items-center">
            <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
            Unsaved changes
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mb-6 bg-slate-700 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2 text-sm">Instructions:</h3>
        <ul className="text-gray-300 text-xs space-y-1">
          <li>• Click and drag buttons to reposition</li>
          <li>• Buttons snap to a 4-column grid</li>
          <li>• Changes apply to current category only</li>
          <li>• Click Save to keep your changes</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto space-y-3">
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            isDirty
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isDirty ? '💾 Save Layout' : '✓ Saved'}
        </button>

        <button
          onClick={handleReset}
          className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
        >
          🔄 Reset to Default
        </button>

        <button
          onClick={handleCancel}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
        >
          ✕ Cancel & Exit
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-gray-500 text-xs text-center">
          Grid: 4 columns • Fixed button size
        </p>
      </div>
    </div>
  );
};