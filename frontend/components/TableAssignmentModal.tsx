import React, { useState, useEffect } from 'react';
import type { Table, Room } from '../../shared/types';
import { VKeyboardInput } from './VKeyboardInput';

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
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [filterRoom, setFilterRoom] = useState<string>('all');
 const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedTableId(currentTableId || null);
    }
  }, [isOpen, currentTableId]);

  if (!isOpen) return null;

  // Filter tables based on selected room and search term
  const filteredTables = tables.filter(table => {
    const matchesRoom = filterRoom === 'all' || table.roomId === filterRoom;
    const matchesSearch = table.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRoom && matchesSearch;
  });

  const handleConfirm = () => {
    if (selectedTableId) {
      onTableAssign(selectedTableId);
      onClose();
    }
  };

  const handleClear = () => {
    onTableAssign('');
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-600';
      case 'occupied': return 'bg-red-600';
      case 'reserved': return 'bg-yellow-600';
      case 'unavailable': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl p-6 border border-slate-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-400">Assign Table</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-700 transition" aria-label="Close">&times;</button>
        </div>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-grow">
            <VKeyboardInput
              k-type="full"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tables..."
              className="w-full p-3 bg-slate-900 text-white placeholder-slate-400 border border-slate-700 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
            />
          </div>
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="bg-slate-900 text-white border-slate-700 rounded-md p-3 min-w-[150px]"
          >
            <option value="all">All Rooms</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4 flex-grow overflow-y-auto max-h-[40vh]">
          {filteredTables.map(table => (
            <button
              key={table.id}
              onClick={() => setSelectedTableId(table.id)}
              className={`p-3 rounded-md border-2 transition ${
                selectedTableId === table.id
                  ? 'border-amber-400 bg-amber-900'
                  : 'border-slate-700 bg-slate-900 hover:bg-slate-700'
              } ${table.status === 'occupied' ? 'opacity-70' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <p className="font-bold">{table.name}</p>
                  <p className="text-xs text-slate-400">{rooms.find(r => r.id === table.roomId)?.name}</p>
                </div>
                <span className={`w-3 h-3 rounded-full ${getStatusColor(table.status)} ${table.status === 'occupied' ? 'animate-pulse' : ''}`}></span>
              </div>
              <p className="text-xs mt-1 text-slate-400 capitalize">{table.status}</p>
            </button>
          ))}
        </div>

        {filteredTables.length === 0 && (
          <div className="flex-grow flex items-center justify-center text-slate-500">
            <p>No tables found</p>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-slate-700">
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="bg-red-700 hover:bg-red-60 text-white font-bold py-2 px-4 rounded-md transition"
            >
              Clear Table
            </button>
            <button
              onClick={onClose}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-md transition"
            >
              Cancel
            </button>
          </div>
          <button
            onClick={handleConfirm}
            disabled={!selectedTableId}
            className={`font-bold py-2 px-6 rounded-md transition ${
              selectedTableId 
                ? 'bg-green-600 hover:bg-green-500 text-white' 
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            Confirm Assignment
          </button>
        </div>
      </div>
    </div>
  );
};