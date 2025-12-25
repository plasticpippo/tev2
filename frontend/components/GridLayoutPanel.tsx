import React from 'react';
import type { ProductVariant } from '@shared/types';
import { formatCurrency } from '../utils/formatting';

interface GridItem {
  id: string;
  variantId: number;
  productId: number;
  name: string;
  price: number;
  backgroundColor: string;
  textColor: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface GridLayoutPanelProps {
  gridItems: GridItem[];
  handleMoveItem: (id: string, newX: number, newY: number) => void;
}

const GridLayoutPanel: React.FC<GridLayoutPanelProps> = ({
  gridItems,
  handleMoveItem
}) => {
 return (
    <div className="mt-4 bg-slate-700 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-amber-20">Grid Layout</h3>
      <div
        className="relative bg-slate-900 rounded-lg p-4 min-h-[500px] border-2 border-dashed border-slate-500"
        style={{ width: '100%', height: '500px' }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          // Handle dropping an item directly on the grid (not on an existing item)
          const draggedId = e.dataTransfer.getData('text/plain');
          const rect = e.currentTarget.getBoundingClientRect();
          const newX = Math.floor((e.clientX - rect.left) / 100);
          const newY = Math.floor((e.clientY - rect.top) / 100);
          
          // Update the item's position
          handleMoveItem(draggedId, newX, newY);
        }}
      >
        {gridItems.map((item) => (
          <div
            key={item.id}
            className={`absolute rounded-lg p-2 text-center shadow-md transition focus:outline-none focus:ring-2 focus:ring-amber-500 overflow-hidden ${item.backgroundColor}`}
            style={{
              left: `${item.x * 100}px`,
              top: `${item.y * 100}px`,
              width: `${item.width * 100}px`,
              height: `${item.height * 100}px`,
            }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', item.id);
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const draggedId = e.dataTransfer.getData('text/plain');
              if (draggedId === item.id) return;
              
              // Calculate new position based on drop location
              const rect = e.currentTarget.getBoundingClientRect();
              const newX = Math.floor((e.clientX - rect.left) / 100);
              const newY = Math.floor((e.clientY - rect.top) / 100);
              handleMoveItem(draggedId, newX, newY);
            }}
            role="button"
            tabIndex={0}
            aria-label={`Product ${item.name}, price ${formatCurrency(item.price)}, position ${item.x}, ${item.y}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                // Handle keyboard interaction for moving items (simplified)
                // In a real implementation, you'd want to provide actual keyboard controls for positioning
              }
            }}
          >
            <p className={`font-bold text-sm ${item.textColor}`}>{item.name}</p>
            <p className={`text-xs ${item.textColor} opacity-80`}>{formatCurrency(item.price)}</p>
          </div>
        ))}
        {gridItems.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            Drag products here to arrange them on the grid
          </div>
        )}
      </div>
      <p className="text-sm text-slate-400 mt-2">Drag and drop items to rearrange them on the grid</p>
    </div>
  );
};

export default GridLayoutPanel;