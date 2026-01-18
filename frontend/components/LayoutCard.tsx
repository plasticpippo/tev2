import React from 'react';

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

interface LayoutCardProps {
  layout: LayoutWithTillInfo;
  categoryName: string;
  onEdit: () => void;
  onSetAsDefault: () => void;
  onCopy: () => void;
  onDelete: () => void;
}

export const LayoutCard: React.FC<LayoutCardProps> = ({
  layout,
  categoryName,
  onEdit,
  onSetAsDefault,
  onCopy,
  onDelete
}) => {
  return (
    <div className="bg-slate-800 p-4 rounded-md">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-lg truncate max-w-[70%]">{layout.name}</h3>
        <span className={`px-2 py-1 rounded text-xs ${
          layout.isShared ? 'bg-purple-700 text-purple-100' :
          layout.tillName === 'Shared' ? 'bg-purple-700 text-purple-100' :
          'bg-blue-700 text-blue-100'
        }`}>
          {layout.isShared || layout.tillName === 'Shared' ? 'Shared' : layout.tillName}
        </span>
      </div>
      
      <div className="text-sm text-slate-400 mb-2">
        <p>Type: {layout.filterType || 'all'}</p>
        <p>Category: {layout.filterType === 'all' ? 'All Products' : layout.filterType === 'favorites' ? 'Favorites' : layout.filterType === 'category' ? categoryName : 'N/A'}</p>
        <p>Items: {layout.layout?.gridItems?.length || 0}</p>
      </div>
      
      <div className="flex items-center mb-3">
        <span className={`text-xs px-2 py-1 rounded ${
          layout.isDefault ? 'bg-green-700 text-green-100' : 'bg-slate-700 text-slate-300'
        }`}>
          {layout.isDefault ? 'Default Layout' : 'Custom Layout'}
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onEdit}
          className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2 px-3 rounded-md text-sm"
        >
          Edit
        </button>
        <button
          onClick={onSetAsDefault}
          disabled={layout.isDefault}
          className={`flex-1 font-bold py-2 px-3 rounded-md text-sm ${
            layout.isDefault
              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-500 text-white'
          }`}
        >
          {layout.isDefault ? 'Default' : 'Set Default'}
        </button>
        <button
          onClick={onCopy}
          className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-3 rounded-md text-sm"
        >
          Copy
        </button>
        <button
          onClick={onDelete}
          className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2 px-3 rounded-md text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  );
};