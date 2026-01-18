import React, { useState } from 'react';
import { saveGridLayout } from '../services/gridLayoutService';

// Define the Till and Category interfaces locally since @shared/types is not available
interface Till {
  id: number;
  name: string;
  // Add other properties as needed
}

interface Category {
  id: number;
  name: string;
  // Add other properties as needed
}

interface LayoutWithTillInfo {
  id?: string | number;
  name: string;
  tillId: number;
  layout: {
    columns: number;
    gridItems: {
      id: string;
      variantId: number;
      productId: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }[];
    version: string;
  };
  isDefault: boolean;
  filterType?: 'all' | 'favorites' | 'category';
  categoryId?: number | null;
  tillName?: string;
  isShared?: boolean;
}

interface CopyLayoutModalProps {
  show: boolean;
  layout: LayoutWithTillInfo | null;
  tills: Till[];
  onClose: () => void;
  onCopy: (newLayout: LayoutWithTillInfo) => void;
  onDataUpdate: () => void;
}

export const CopyLayoutModal: React.FC<CopyLayoutModalProps> = ({ 
  show, 
  layout, 
  tills, 
  onClose, 
  onCopy,
  onDataUpdate
}) => {
  const [selectedTillId, setSelectedTillId] = useState<number | null>(null);

  const handleConfirmCopyLayout = async () => {
    if (!layout || !selectedTillId) return;
    
    try {
      // Create a new layout based on the original
      const newLayoutData = {
        ...layout,
        id: undefined, // Don't include the ID to create a new record
        name: `${layout.name} (Copy)`,
        tillId: selectedTillId,
        isDefault: false, // New copied layouts are not defaults
        isShared: false // Copy becomes till-specific
      };
      
      const newLayout = await saveGridLayout(newLayoutData);
      onCopy(newLayout);
      onClose();
      setSelectedTillId(null);
      onDataUpdate(); // Notify parent to refresh data if needed
    } catch (error) {
      console.error('Error copying layout:', error);
      alert('Failed to copy layout: ' + (error as Error).message);
    }
  };

  if (!show || !layout) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">Copy Layout to Till</h3>
        
        <p className="mb-4">Copy layout "{layout.name}" to:</p>
        
        <div className="mb-4">
          <label className="block text-sm text-slate-400">Target Till</label>
          <select
            value={selectedTillId || ''}
            onChange={(e) => setSelectedTillId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
          >
            <option value="">Select a till</option>
            {tills
              .filter(till => layout.tillId !== till.id) // Exclude source till
              .map(till => (
                <option key={till.id} value={till.id}>{till.name}</option>
              ))}
          </select>
        </div>
        
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
          <button 
            onClick={() => {
              onClose();
              setSelectedTillId(null);
            }} 
            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirmCopyLayout} 
            disabled={!selectedTillId}
            className={`font-bold py-2 px-4 rounded-md ${
              selectedTillId 
                ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            Copy Layout
          </button>
        </div>
      </div>
    </div>
  );
};