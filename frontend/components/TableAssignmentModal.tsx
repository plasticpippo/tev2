import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Table, Room } from '../../shared/types';
import { useToast } from '../contexts/ToastContext';

interface TableAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  rooms: Room[];
  onTableAssign: (tableId: string) => void;
  currentTableId?: string | null;
}

export const TableAssignmentModal: React.FC<TableAssignmentModalProps> = ({
  isOpen,
  onClose,
  tables,
  rooms,
  onTableAssign,
  currentTableId
}) => {
  const { t } = useTranslation();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(currentTableId || null);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const { addToast } = useToast();

  // Auto-select first room on open if none selected
  React.useEffect(() => {
    if (isOpen && !selectedRoomId && rooms.length > 0) {
      setSelectedRoomId(rooms[0].id);
    }
    if (isOpen) {
      setSelectedTableId(currentTableId || null);
    }
  }, [isOpen, selectedRoomId, rooms, currentTableId]);

  // Filter tables for selected room - MUST be before any conditional returns
  const roomTables = selectedRoomId
    ? tables.filter(table => table.roomId === selectedRoomId)
    : [];

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  // Calculate canvas bounds for scaling - MUST be before any conditional returns
  const canvasBounds = useMemo(() => {
    if (roomTables.length === 0) return { minX: 0, minY: 0, maxX: 600, maxY: 400 };
    
    const positions = roomTables.map(t => ({ x: t.x, y: t.y, w: t.width || 64, h: t.height || 64 }));
    const minX = Math.min(...positions.map(p => p.x));
    const minY = Math.min(...positions.map(p => p.y));
    const maxX = Math.max(...positions.map(p => p.x + p.w));
    const maxY = Math.max(...positions.map(p => p.y + p.h));
    
    return {
      minX: Math.max(0, minX - 50),
      minY: Math.max(0, minY - 50),
      maxX: maxX + 50,
      maxY: maxY + 50
    };
  }, [roomTables]);

  const canvasWidth = canvasBounds.maxX - canvasBounds.minX;
  const canvasHeight = canvasBounds.maxY - canvasBounds.minY;

  // Early return AFTER all hooks are called
  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (selectedTableId) {
      setIsAssigning(true);
      try {
        await onTableAssign(selectedTableId);
        const table = tables.find(t => t.id === selectedTableId);
        addToast(t('tableAssignmentModal.orderAssignedTo', { tableName: table?.name || 'table' }), 'success');
        onClose();
      } catch (error) {
        addToast(t('tableAssignmentModal.failedToAssignTable'), 'error');
      } finally {
        setIsAssigning(false);
      }
    }
  };

  const handleClear = async () => {
    setIsAssigning(true);
    try {
      await onTableAssign('');
      addToast(t('tableAssignmentModal.tableAssignmentCleared'), 'success');
      onClose();
    } catch (error) {
      addToast(t('tableAssignmentModal.failedToClearTableAssignment'), 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500 border-green-600';
      case 'occupied': return 'bg-red-500 border-red-600';
      case 'reserved': return 'bg-yellow-500 border-yellow-600';
      case 'unavailable': return 'bg-gray-500 border-gray-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-400';
      case 'occupied': return 'text-red-400';
      case 'reserved': return 'text-yellow-400';
      case 'unavailable': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return t('tableAssignmentModal.statusLabelAvailable');
      case 'occupied': return t('tableAssignmentModal.statusLabelOccupied');
      case 'reserved': return t('tableAssignmentModal.statusLabelReserved');
      case 'unavailable': return t('tableAssignmentModal.statusLabelUnavailable');
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-xs sm:max-w-5xl p-6 border border-slate-700 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-400">{t('tableAssignmentModal.title')}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700 transition"
            aria-label={t('tableAssignmentModal.close')}
            disabled={isAssigning}
          >
            &times;
          </button>
        </div>

        {/* Room Selector */}
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">{t('tableAssignmentModal.selectRoom')}</label>
          <div className="flex gap-2 flex-wrap">
            {rooms.map(room => (
              <button
                key={room.id}
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setSelectedTableId(null); // Clear table selection when changing room
                }}
                className={`
                  px-4 py-2 rounded-lg font-semibold transition-colors text-sm
                  ${selectedRoomId === room.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }
                  ${isAssigning ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={isAssigning}
              >
                {room.name}
              </button>
            ))}
          </div>
          {rooms.length === 0 && (
            <p className="text-slate-400 text-sm mt-2">{t('tableAssignmentModal.noRoomsAvailable')}</p>
          )}
        </div>

        {/* Visual Table Layout */}
        {selectedRoomId && (
          <div className="flex-grow mb-4 flex flex-col">
            <div className="mb-2 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-300">
                {selectedRoom?.name}
                {selectedRoom?.description && (
                  <span className="text-sm text-slate-400 font-normal ml-2">
                    - {selectedRoom.description}
                  </span>
                )}
              </h3>
              <div className="text-sm text-slate-400">
                {t('tableAssignmentModal.tableCount', { count: roomTables.length })}
              </div>
            </div>

            {/* Canvas for visual layout */}
            <div className="flex-grow bg-slate-900 rounded-lg border-2 border-slate-700 p-4 relative overflow-auto min-h-[400px]">
              {roomTables.length > 0 ? (
                <div
                  className="relative mx-auto"
                  style={{
                    width: `${canvasWidth}px`,
                    height: `${canvasHeight}px`,
                    minWidth: '500px',
                    minHeight: '350px'
                  }}
                >
                  {/* Grid background */}
                  <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
                      `,
                      backgroundSize: '50px 50px'
                    }}
                  />

                  {/* Tables */}
                  {roomTables.map(table => {
                    const isSelected = selectedTableId === table.id;
                    const isCurrent = currentTableId === table.id;
                    
                    return (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTableId(table.id)}
                        className={`
                          absolute w-16 h-16 rounded-full flex items-center justify-center
                          text-white font-bold border-4 transition-all duration-150
                          ${getStatusColor(table.status)}
                          ${table.status === 'available' || table.status === 'reserved'
                            ? 'cursor-pointer hover:shadow-lg hover:shadow-amber-500/50 hover:scale-110'
                            : 'cursor-not-allowed opacity-60'
                          }
                          ${isSelected ? 'ring-4 ring-amber-400 shadow-2xl shadow-amber-500/70 scale-110 z-20' : 'z-10'}
                          ${isCurrent ? 'ring-4 ring-blue-400' : ''}
                        `}
                        style={{
                          left: `${table.x - canvasBounds.minX}px`,
                          top: `${table.y - canvasBounds.minY}px`
                        }}
                        disabled={table.status === 'occupied' || table.status === 'unavailable' || isAssigning}
                        title={`${table.name} - ${getStatusLabel(table.status)}`}
                      >
                        <span className="text-sm font-bold select-none">{table.name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-slate-500 text-6xl mb-4">TABLE</div>
                    <p className="text-slate-400 text-lg">{t('tableAssignmentModal.noTablesInRoom')}</p>
                    <p className="text-slate-500 text-sm mt-2">{t('tableAssignmentModal.addTablesInAdmin')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {!selectedRoomId && rooms.length > 0 && (
          <div className="flex-grow flex items-center justify-center bg-slate-900 rounded-lg border-2 border-slate-700 min-h-[400px]">
            <div className="text-center">
              <div className="text-slate-500 text-6xl mb-4">ROOM</div>
              <p className="text-slate-400 text-lg">{t('tableAssignmentModal.selectRoomToViewTables')}</p>
            </div>
          </div>
        )}

        {/* Selected Table Info */}
        {selectedTableId && (
          <div className="mb-4 p-3 bg-slate-700 rounded-lg border border-amber-500">
            {(() => {
              const table = tables.find(t => t.id === selectedTableId);
              return table ? (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-white">{t('tableAssignmentModal.selected', { name: table.name })}</p>
                    <p className={`text-sm ${getStatusTextColor(table.status)}`}>
                      {t('tableAssignmentModal.status', { status: getStatusLabel(table.status) })}
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full ${getStatusColor(table.status).split(' ')[0]}`}></div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* Action Buttons with loading state */}
        <div className="flex justify-between pt-4 border-t border-slate-700">
          <div className="flex gap-2">
            {currentTableId && (
              <button
                onClick={handleClear}
                disabled={isAssigning}
                className="bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition"
              >
                {isAssigning ? t('tableAssignmentModal.clearing') : t('tableAssignmentModal.clearTable')}
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isAssigning}
              className="bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition"
            >
              {t('buttons.cancel')}
            </button>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!selectedTableId || isAssigning}
            className={`font-bold py-2 px-6 rounded-md transition ${
              selectedTableId && !isAssigning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isAssigning ? t('tableAssignmentModal.assigning') : t('tableAssignmentModal.assignToTable')}
          </button>
        </div>

        {/* Status Legend */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-2 font-semibold">{t('tableAssignmentModal.tableStatusLegend')}</p>
          <div className="flex gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-slate-400">{t('tableAssignmentModal.statusAvailable')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-slate-400">{t('tableAssignmentModal.statusOccupied')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-slate-400">{t('tableAssignmentModal.statusReserved')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span className="text-slate-400">{t('tableAssignmentModal.statusUnavailable')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
