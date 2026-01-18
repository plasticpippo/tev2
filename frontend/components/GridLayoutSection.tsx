import React from 'react';
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

interface GridLayoutSectionProps {
  gridItems: GridItem[];
  handleMoveItem: (id: string, newX?: number, newY?: number, newWidth?: number, newHeight?: number) => void;
  handleRemoveItem: (id: string) => void;
}

const GridLayoutSection: React.FC<GridLayoutSectionProps> = ({
  gridItems,
  handleMoveItem,
  handleRemoveItem
}) => {
 return (
    <div className="bg-slate-700 p-4 rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-amber-200">Grid Layout</h3>
      <div
        className="relative bg-slate-900 rounded-lg p-4 min-h-[500px] border-2 border-dashed border-slate-500"
        style={{ width: '100%', height: '500px' }}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          // Handle dropping an item directly on the grid (not on an existing item)
          const draggedId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : '';
          const rect = e.currentTarget.getBoundingClientRect();
          const newX = Math.floor((e.clientX - rect.left) / 100);
          const newY = Math.floor((e.clientY - rect.top) / 100);
          
          // Update the item's position
          // This will be handled by parent component via callback
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
              if (e.dataTransfer) {
                e.dataTransfer.setData('text/plain', item.id);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const draggedId = e.dataTransfer ? e.dataTransfer.getData('text/plain') : '';
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
            <button
              type="button"
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering drag events
                handleRemoveItem(item.id);
              }}
              aria-label={`Remove ${item.name} from grid`}
            >
              ×
            </button>
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize opacity-0 hover:opacity-100 transition-opacity"
              onMouseDown={(e) => {
                e.stopPropagation(); // Prevent triggering drag events
                const startX = e.clientX;
                const startY = e.clientY;
                const startWidth = item.width;
                const startHeight = item.height;
                
                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const deltaX = Math.max(0, Math.floor((moveEvent.clientX - startX) / 100));
                  const deltaY = Math.max(0, Math.floor((moveEvent.clientY - startY) / 100));
                  
                  const newWidth = Math.max(1, startWidth + deltaX);
                  const newHeight = Math.max(1, startHeight + deltaY);
                  
                  handleMoveItem(item.id, undefined, undefined, newWidth, newHeight);
                };
                
                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
              aria-label={`Resize ${item.name}`}
            />
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
      <p className="text-sm text-slate-400 mt-2">Drag and drop items to rearrange them on the grid. Click the × button to remove items. Drag the blue handle at the bottom-right corner to resize items.</p>
    </div>
  );
};

export default GridLayoutSection;