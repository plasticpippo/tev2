import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useTableContext } from './TableContext';
import { Table } from '@shared/types';

interface TableLayoutEditorProps {
  selectedRoomId: string | null;
}

const TableLayoutEditorComponent: React.FC<TableLayoutEditorProps> = ({ selectedRoomId }) => {
  const { t } = useTranslation();
  const { tables, rooms, layoutMode, updateTablePosition } = useTableContext();
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize expensive calculations
  const memoizedData = useMemo(() => {
    // Filter tables to only show those in the selected room
    const roomTables = selectedRoomId 
      ? tables.filter(table => table.roomId === selectedRoomId)
      : [];

    // Get selected room for display
    const selectedRoom = rooms.find(room => room.id === selectedRoomId);

    return { roomTables, selectedRoom };
  }, [tables, rooms, selectedRoomId]);

  const { roomTables, selectedRoom } = memoizedData;

  // Initialize local positions from table data
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    roomTables.forEach(table => {
      positions[table.id] = { x: table.x, y: table.y };
    });
    setLocalPositions(positions);
  }, [roomTables]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, table: Table) => {
    if (layoutMode !== 'edit' && layoutMode !== 'drag') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    setDraggingTableId(table.id);
    dragStartPosRef.current = {
      x: e.clientX - rect.left - (localPositions[table.id]?.x || table.x),
      y: e.clientY - rect.top - (localPositions[table.id]?.y || table.y)
    };
  }, [layoutMode, localPositions]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingTableId || !canvasRef.current || !dragStartPosRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragStartPosRef.current.x;
    const y = e.clientY - rect.top - dragStartPosRef.current.y;
    
    // Boundary checks to keep table within canvas
    const tableSize = 64; // Approximate size of table circle
    const boundedX = Math.max(0, Math.min(x, rect.width - tableSize));
    const boundedY = Math.max(0, Math.min(y, rect.height - tableSize));
    
    // Update local position immediately for smooth dragging
    setLocalPositions(prev => ({
      ...prev,
      [draggingTableId]: { x: boundedX, y: boundedY }
    }));
  }, [draggingTableId]);

  const handleMouseUp = useCallback(() => {
      if (!draggingTableId) return;
      
      const finalPosition = localPositions[draggingTableId];
      if (finalPosition) {
        // Debounce backend update - only send after dragging stops
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
        
        updateTimeoutRef.current = setTimeout(() => {
          // Since updateTablePosition is now async, we could handle potential errors
          // but for now we just call it without awaiting to maintain the same behavior
          updateTablePosition(draggingTableId, finalPosition.x, finalPosition.y).catch(error => {
            console.error('Error updating table position:', error);
          });
        }, 100); // Wait 100ms after drag ends before saving to backend
      }
      
      setDraggingTableId(null);
      dragStartPosRef.current = null;
    }, [draggingTableId, localPositions, updateTablePosition]);

  // Attach global mouse event listeners
  useEffect(() => {
    if (draggingTableId) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      // Prevent text selection while dragging
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [draggingTableId, handleMouseMove, handleMouseUp]);

  // Get table status color
  const getStatusColor = (status: Table['status']) => {
    switch (status) {
      case 'available': return 'bg-green-500 border-green-600';
      case 'occupied': return 'bg-red-500 border-red-600';
      case 'bill_requested': return 'bg-yellow-500 border-yellow-600';
      case 'reserved': return 'bg-yellow-500 border-yellow-600';
      case 'unavailable': return 'bg-gray-500 border-gray-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  // Get table status text
  const getStatusText = (status: Table['status']) => {
    switch (status) {
      case 'available': return t('tableLayoutEditor.statusAvailable');
      case 'occupied': return t('tableLayoutEditor.statusOccupied');
      case 'bill_requested': return t('tableLayoutEditor.statusBillRequested');
      case 'reserved': return t('tableLayoutEditor.statusReserved');
      case 'unavailable': return t('tableLayoutEditor.statusUnavailable');
      default: return status;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-300">
          {selectedRoom ? selectedRoom.name : t('tableLayoutEditor.selectRoom')}
        </h3>
        {selectedRoom?.description && (
          <p className="text-sm text-slate-400">{selectedRoom.description}</p>
        )}
        {selectedRoomId && (
          <p className="text-xs text-slate-500 mt-1">
            {t('tableLayoutEditor.mode')}: <span className="font-semibold text-amber-400">{layoutMode}</span>
            {layoutMode !== 'view' && ` - ${t('tableLayoutEditor.dragToReposition')}`}
          </p>
        )}
      </div>
      
      <div 
        ref={canvasRef}
        className="flex-grow bg-slate-800 rounded-lg border-2 border-slate-700 relative overflow-hidden cursor-default"
        style={{ minHeight: '500px' }}
      >
        {selectedRoomId ? (
          <>
            {/* Grid background for better visual reference */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(148, 163, 184, 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}
            />
            
            {/* Render tables */}
            {roomTables.map(table => {
              const position = localPositions[table.id] || { x: table.x, y: table.y };
              const isDragging = draggingTableId === table.id;
              
              return (
                <div
                  key={table.id}
                  className={`
                    absolute w-16 h-16 rounded-full flex items-center justify-center 
                    text-white font-bold border-4 transition-shadow duration-150
                    ${getStatusColor(table.status)}
                    ${layoutMode === 'edit' || layoutMode === 'drag' 
                      ? 'cursor-grab hover:shadow-lg hover:shadow-amber-500/50' 
                      : 'cursor-default'
                    }
                    ${isDragging ? 'shadow-2xl shadow-amber-500/70 ring-4 ring-amber-400 z-50 cursor-grabbing' : 'z-10'}
                  `}
                  style={{ 
                    left: `${position.x}px`, 
                    top: `${position.y}px`,
                    transition: isDragging ? 'none' : 'box-shadow 0.15s ease-in-out'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, table)}
                  title={`${table.name} - ${getStatusText(table.status)}`}
                >
                  <span className="text-sm font-bold select-none">{table.name}</span>
                </div>
              );
            })}
            
            {/* Mode indicator */}
            {layoutMode !== 'view' && (
              <div className="absolute top-4 left-4 bg-amber-600 text-white px-3 py-2 rounded-md text-sm font-bold shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                {layoutMode === 'edit' ? t('tableLayoutEditor.editMode') : t('tableLayoutEditor.dragMode')}
              </div>
            )}
            
            {/* Table count indicator */}
            <div className="absolute top-4 right-4 bg-slate-700 text-white px-3 py-2 rounded-md text-xs font-medium shadow-lg">
              {t('tableLayoutEditor.tableCount', { count: roomTables.length })}
            </div>
            
            {/* Status legend */}
            <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 text-xs space-y-2">
              <p className="font-bold text-slate-300 mb-2">{t('tableLayoutEditor.tableStatus')}</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-slate-400">{t('tableLayoutEditor.statusAvailable')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-slate-400">{t('tableLayoutEditor.statusOccupied')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-slate-400">{t('tableLayoutEditor.statusBillRequested')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span className="text-slate-400">{t('tableLayoutEditor.statusUnavailable')}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-slate-500 text-6xl mb-4">{t('tableLayoutEditor.building')}</div>
              <p className="text-slate-400 text-lg">{t('tableLayoutEditor.selectRoomToViewLayout')}</p>
              <p className="text-slate-500 text-sm mt-2">{t('tableLayoutEditor.createRoomFirst')}</p>
            </div>
          </div>
        )}
      </div>
      
      {selectedRoomId && (
        <div className="mt-4 p-3 bg-slate-700 rounded-md">
          <div className="flex items-center justify-between text-sm">
            <div className="text-slate-300">
              <span className="font-semibold">{t('tableLayoutEditor.tip')}:</span> 
              {layoutMode === 'view' 
                ? ` ${t('tableLayoutEditor.tipViewMode')}` 
                : ` ${t('tableLayoutEditor.tipEditMode')}`}
            </div>
            {draggingTableId && (
              <div className="text-amber-400 font-semibold flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping"></div>
                {t('tableLayoutEditor.dragging')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const TableLayoutEditor = React.memo(TableLayoutEditorComponent);