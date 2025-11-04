import React, { useState, useRef, useEffect } from 'react';
import { useTableContext } from './TableContext';
import { Table, Room } from '../../shared/types';

interface TableLayoutEditorProps {
  selectedRoomId: string | null;
}

export const TableLayoutEditor: React.FC<TableLayoutEditorProps> = ({ selectedRoomId }) => {
  const { tables, layoutMode, updateTablePosition } = useTableContext();
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Filter tables to only show those in the selected room
  const roomTables = selectedRoomId 
    ? tables.filter(table => table.roomId === selectedRoomId)
    : [];

  const handleMouseDown = (e: React.MouseEvent, table: Table) => {
    if (layoutMode !== 'edit' && layoutMode !== 'drag') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDraggingTableId(table.id);
    setDragOffset({
      x: e.clientX - rect.left - table.x,
      y: e.clientY - rect.top - table.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingTableId || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;
    
    // Boundary checks to keep table within canvas
    const boundedX = Math.max(0, Math.min(x, rect.width - 80)); // 80 is approx table width
    const boundedY = Math.max(0, Math.min(y, rect.height - 80)); // 80 is approx table height
    
    updateTablePosition(draggingTableId, boundedX, boundedY);
  };

  const handleMouseUp = () => {
    setDraggingTableId(null);
  };

  useEffect(() => {
    if (draggingTableId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTableId, dragOffset]);

  // Get selected room for display purposes
  const { rooms } = useTableContext();
  const selectedRoom = rooms.find(room => room.id === selectedRoomId);

  // Function to get table status color
  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-red-500';
      case 'reserved': return 'bg-yellow-500';
      case 'unavailable': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

 // Function to get table status text
  const getStatusText = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'Available';
      case 'occupied': return 'Occupied';
      case 'reserved': return 'Reserved';
      case 'unavailable': return 'Unavailable';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-300">
          {selectedRoom ? selectedRoom.name : 'Select a Room'}
        </h3>
        {selectedRoom && (
          <p className="text-sm text-slate-500">{selectedRoom.description || 'No description'}</p>
        )}
      </div>
      
      <div 
        ref={canvasRef}
        className="flex-grow bg-slate-800 rounded-lg border border-slate-700 relative overflow-hidden"
        style={{ minHeight: '400px' }}
      >
        {selectedRoomId ? (
          <>
            {/* Render tables */}
            {roomTables.map(table => (
              <div
                key={table.id}
                className={`absolute w-16 h-16 rounded-full flex items-center justify-center text-white font-bold cursor-move border-2 transition-all duration-150
                  ${getStatusColor(table.status)}
                  ${layoutMode === 'edit' || layoutMode === 'drag' ? 'hover:ring-2 hover:ring-amber-400' : ''}
                  ${draggingTableId === table.id ? 'ring-4 ring-amber-400 z-10' : ''}`}
                style={{ left: `${table.x}px`, top: `${table.y}px` }}
                onMouseDown={(e) => handleMouseDown(e, table)}
                title={`${table.name} - ${getStatusText(table.status)}`}
              >
                {table.name}
              </div>
            ))}
            
            {/* Mode indicator */}
            {layoutMode !== 'view' && (
              <div className="absolute top-2 left-2 bg-amber-600 text-white px-2 py-1 rounded text-xs font-bold">
                {layoutMode === 'edit' ? 'Edit Mode' : 'Drag Mode'}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            <p>Select a room to view and edit its layout</p>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-sm text-slate-400">
        <p>Tip: Drag tables to reposition them in {layoutMode === 'edit' || layoutMode === 'drag' ? 'edit/drag mode' : 'view mode'}.</p>
      </div>
    </div>
  );
};