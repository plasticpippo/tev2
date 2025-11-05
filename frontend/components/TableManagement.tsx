import React, { useState } from 'react';
import { useTableContext } from './TableContext';
import { TableLayoutEditor } from './TableLayoutEditor';
import { Room, Table } from '../../shared/types';
import { VKeyboardInput } from './VKeyboardInput';
import { ConfirmationModal } from './ConfirmationModal';

interface RoomModalProps {
  room?: Room;
  onClose: () => void;
  onSave: () => void;
}

const RoomModal: React.FC<RoomModalProps> = ({ room, onClose, onSave }) => {
  const [name, setName] = useState(room?.name || '');
  const [description, setDescription] = useState(room?.description || '');
 const { addRoom, updateRoom } = useTableContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    if (room) {
      await updateRoom(room.id, { name, description });
    } else {
      await addRoom({ name, description });
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">{room ? 'Edit' : 'Add'} Room</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400">Room Name</label>
            <VKeyboardInput
              k-type="full"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400">Description</label>
            <VKeyboardInput
              k-type="full"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">Cancel</button>
          <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md">Save</button>
        </div>
      </form>
    </div>
  );
};

interface TableModalProps {
  table?: Table;
  rooms: Room[];
  onClose: () => void;
  onSave: () => void;
}

const TableModal: React.FC<TableModalProps> = ({ table, rooms, onClose, onSave }) => {
  const [name, setName] = useState(table?.name || '');
  const [roomId, setRoomId] = useState(table?.roomId || '');
  const [x, setX] = useState(table?.x.toString() || '50');
  const [y, setY] = useState(table?.y.toString() || '50');
  const [width, setWidth] = useState(table?.width.toString() || '80');
  const [height, setHeight] = useState(table?.height.toString() || '80');
  const [status, setStatus] = useState<Table['status']>(table?.status || 'available');

  const { addTable, updateTable } = useTableContext();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roomId) return;
    
    const tableData = {
      name,
      roomId,
      x: parseFloat(x),
      y: parseFloat(y),
      width: parseFloat(width),
      height: parseFloat(height),
      status
    };
    
    if (table) {
      await updateTable(table.id, tableData);
    } else {
      await addTable(tableData);
    }
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-amber-400 mb-4">{table ? 'Edit' : 'Add'} Table</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400">Table Name</label>
            <VKeyboardInput
              k-type="full"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
              autoFocus
              required
            />
          </div>
          
          <div>
            <label className="block text-sm text-slate-400">Room</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
              required
            >
              <option value="">Select a room</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>{room.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400">X Position</label>
              <VKeyboardInput
                k-type="numeric"
                type="number"
                value={x}
                onChange={(e) => setX(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400">Y Position</label>
              <VKeyboardInput
                k-type="numeric"
                type="number"
                value={y}
                onChange={(e) => setY(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400">Width</label>
              <VKeyboardInput
                k-type="numeric"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400">Height</label>
              <VKeyboardInput
                k-type="numeric"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Table['status'])}
              className="w-full mt-1 p-3 bg-slate-800 border border-slate-700 rounded-md"
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">Cancel</button>
          <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md">Save</button>
        </div>
      </form>
    </div>
  );
};

interface TableManagementProps {}

export const TableManagement: React.FC<TableManagementProps> = () => {
  const {
    rooms,
    tables,
    selectedRoomId,
    setSelectedRoomId,
    layoutMode,
    setLayoutMode,
    loading,
    error,
    deleteRoom,
    deleteTable,
    refreshData
 } = useTableContext();
  
  const [activeTab, setActiveTab] = useState<'rooms' | 'tables' | 'layout'>('layout');
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | undefined>(undefined);
  const [deletingTable, setDeletingTable] = useState<Table | null>(null);

  const handleRoomSave = () => {
    setIsRoomModalOpen(false);
    setEditingRoom(undefined);
    refreshData();
  };

  const handleTableSave = () => {
    setIsTableModalOpen(false);
    setEditingTable(undefined);
    refreshData();
  };

 const confirmDeleteRoom = async () => {
    if (deletingRoom) {
      await deleteRoom(deletingRoom.id);
      setDeletingRoom(null);
      if (selectedRoomId === deletingRoom.id) {
        setSelectedRoomId(null);
      }
    }
 };

  const confirmDeleteTable = async () => {
    if (deletingTable) {
      await deleteTable(deletingTable.id);
      setDeletingTable(null);
    }
 };

  // Filter tables to show only those in the selected room when in tables tab
  const roomTables = selectedRoomId 
    ? tables.filter(table => table.roomId === selectedRoomId)
    : tables;

  return (
    <div className="h-full flex flex-col">
      {error && (
        <div className="mb-4 p-3 bg-red-900 text-red-100 rounded-md">
          {error}
        </div>
      )}
      
      <div className="flex-shrink-0 mb-4">
        <div className="flex border-b border-slate-700">
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'layout' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-300'}`}
            onClick={() => setActiveTab('layout')}
          >
            Layout
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'rooms' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-300'}`}
            onClick={() => setActiveTab('rooms')}
          >
            Rooms
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${activeTab === 'tables' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-slate-300'}`}
            onClick={() => setActiveTab('tables')}
          >
            Tables
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto">
        {activeTab === 'layout' && (
          <div className="h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-300">Table Layout Editor</h3>
              <div className="flex gap-2">
                <select
                  value={selectedRoomId || ''}
                  onChange={(e) => setSelectedRoomId(e.target.value || null)}
                  className="bg-slate-800 border border-slate-700 rounded-md p-2 text-sm"
                >
                  <option value="">Select a room</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
                <select
                  value={layoutMode}
                  onChange={(e) => setLayoutMode(e.target.value as any)}
                  className="bg-slate-800 border border-slate-700 rounded-md p-2 text-sm"
                >
                  <option value="view">View Mode</option>
                  <option value="edit">Edit Mode</option>
                  <option value="drag">Drag Mode</option>
                </select>
              </div>
            </div>
            <TableLayoutEditor selectedRoomId={selectedRoomId} />
          </div>
        )}

        {activeTab === 'rooms' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-300">Room Management</h3>
              <button
                onClick={() => { setEditingRoom(undefined); setIsRoomModalOpen(true); }}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md text-sm"
              >
                Add Room
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-slate-50">Loading rooms...</div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {rooms.map(room => (
                  <div key={room.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{room.name}</p>
                      <p className="text-sm text-slate-400">{room.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditingRoom(room); setIsRoomModalOpen(true); }}
                        className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 text-sm rounded-md"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeletingRoom(room)}
                        className="bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-3 text-sm rounded-md"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                
                {rooms.length === 0 && (
                  <div className="text-center py-8 text-slate-50">
                    No rooms found. Add your first room to get started.
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tables' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-300">Table Management</h3>
              <button
                onClick={() => { setEditingTable(undefined); setIsTableModalOpen(true); }}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md text-sm"
              >
                Add Table
              </button>
            </div>
            
            {loading ? (
              <div className="text-center py-8 text-slate-500">Loading tables...</div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {roomTables.map(table => {
                  const room = rooms.find(r => r.id === table.roomId);
                  return (
                    <div key={table.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{table.name}</p>
                        <p className="text-sm text-slate-400">
                          Room: {room?.name || 'Unknown'} | Status: {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                        </p>
                        <p className="text-xs text-slate-500">Position: ({table.x}, {table.y}) | Size: {table.width}x{table.height}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingTable(table); setIsTableModalOpen(true); }}
                          className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 text-sm rounded-md"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingTable(table)}
                          className="bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-3 text-sm rounded-md"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {roomTables.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    {selectedRoomId 
                      ? 'No tables found in this room. Add your first table to get started.' 
                      : 'No tables found. Select a room or add your first table to get started.'}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {isRoomModalOpen && (
        <RoomModal
          room={editingRoom}
          onClose={() => { setIsRoomModalOpen(false); setEditingRoom(undefined); }}
          onSave={handleRoomSave}
        />
      )}
      
      {isTableModalOpen && (
        <TableModal
          table={editingTable}
          rooms={rooms}
          onClose={() => { setIsTableModalOpen(false); setEditingTable(undefined); }}
          onSave={handleTableSave}
        />
      )}
      
      <ConfirmationModal
        isOpen={!!deletingRoom}
        message={`Are you sure you want to delete the room "${deletingRoom?.name}"? All tables in this room will also be deleted.`}
        onConfirm={confirmDeleteRoom}
        onCancel={() => setDeletingRoom(null)}
      />
      
      <ConfirmationModal
        isOpen={!!deletingTable}
        message={`Are you sure you want to delete the table "${deletingTable?.name}"?`}
        onConfirm={confirmDeleteTable}
        onCancel={() => setDeletingTable(null)}
      />
    </div>
 );
};