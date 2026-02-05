import React, { useState } from 'react';
import { useTableContext, type LayoutMode } from './TableContext';
import { TableLayoutEditor } from './TableLayoutEditor';
import { Room, Table } from '../../shared/types';
import { VKeyboardInput } from './VKeyboardInput';
import ConfirmationModal from './ConfirmationModal';
import { LoadingOverlay } from './LoadingOverlay';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { validateRoom, validateTable, ValidationError } from '../utils/validation';
import { sanitizeName, SanitizationError } from '../utils/sanitization';

interface RoomModalProps {
  room?: Room;
  onClose: () => void;
  onSave: () => void;
}

const RoomModal: React.FC<RoomModalProps> = ({ room, onClose, onSave }) => {
  const [name, setName] = useState(room?.name || '');
  const [description, setDescription] = useState(room?.description || '');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addRoom, updateRoom, rooms } = useTableContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);
    
    // Sanitize room name
    let sanitizedName: string;
    try {
      sanitizedName = sanitizeName(name);
    } catch (error) {
      if (error instanceof SanitizationError) {
        setErrors([{ field: 'name', message: error.message }]);
        setIsSubmitting(false);
        return;
      }
      throw error;
    }
    
    // Validate room data
    const roomData = { name: sanitizedName, description };
    const validation = validateRoom(roomData, rooms);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (room) {
        await updateRoom(room.id, { name: sanitizedName, description: description || undefined });
      } else {
        await addRoom({ name: sanitizedName, description: description || undefined, tables: [] });
      }
      onSave();
    } catch (err) {
      setErrors([{ field: 'general', message: 'Failed to save room: ' + (err instanceof Error ? err.message : 'Unknown error') }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get error message for a specific field
  const getFieldError = (fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">{room ? 'Edit' : 'Add'} Room</h3>
        
        {/* Display general errors at the top */}
        {errors.some(error => error.field === 'general') && (
          <div className="mb-4 p-3 bg-red-900 text-red-100 rounded-md">
            {errors.find(error => error.field === 'general')?.message}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400">Room Name</label>
            <div className="relative">
              <VKeyboardInput
                k-type="full"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  // Clear field error when user starts typing
                  if (getFieldError('name')) {
                    setErrors(errors.filter(error => error.field !== 'name'));
                  }
                }}
                className={`w-full mt-1 p-3 bg-slate-800 border ${
                  getFieldError('name') ? 'border-red-500' : 'border-slate-700'
                } rounded-md`}
                autoFocus
                required
              />
              <div className="absolute -right-5 top-3 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-xs text-slate-900 font-bold" title="Required field">
                !
              </div>
            </div>
            {getFieldError('name') && (
              <p className="mt-1 text-sm text-red-400">{getFieldError('name')}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-slate-400">Description</label>
            <VKeyboardInput
              k-type="full"
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                // Clear field error when user starts typing
                if (getFieldError('description')) {
                  setErrors(errors.filter(error => error.field !== 'description'));
                }
              }}
              className={`w-full mt-1 p-3 bg-slate-800 border ${
                getFieldError('description') ? 'border-red-500' : 'border-slate-700'
              } rounded-md`}
            />
            {getFieldError('description') && (
              <p className="mt-1 text-sm text-red-400">{getFieldError('description')}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-secondary disabled:opacity-50"
            title="Cancel changes"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary disabled:opacity-50 flex items-center gap-2"
            title="Save room details"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">🌀</span> Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
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
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addTable, updateTable, tables } = useTableContext();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);
    
    // Sanitize table name
    let sanitizedName: string;
    try {
      sanitizedName = sanitizeName(name);
    } catch (error) {
      if (error instanceof SanitizationError) {
        setErrors([{ field: 'name', message: error.message }]);
        setIsSubmitting(false);
        return;
      }
      throw error;
    }
    
    // Validate table data
    const tableData = {
      name: sanitizedName,
      roomId,
      x: parseFloat(x),
      y: parseFloat(y),
      width: parseFloat(width),
      height: parseFloat(height),
      status
    };
    
    const validation = validateTable(tableData, rooms, tables);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }
    
    try {
      if (table) {
        await updateTable(table.id, tableData);
      } else {
        await addTable({ ...tableData, room: {} as Room, tabs: [] });
      }
      onSave();
    } catch (err) {
      setErrors([{ field: 'general', message: 'Failed to save table: ' + (err instanceof Error ? err.message : 'Unknown error') }]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get error message for a specific field
  const getFieldError = (fieldName: string) => {
    return errors.find(error => error.field === fieldName)?.message;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-amber-400 mb-4">{table ? 'Edit' : 'Add'} Table</h3>
        
        {/* Display general errors at the top */}
        {errors.some(error => error.field === 'general') && (
          <div className="mb-4 p-3 bg-red-900 text-red-100 rounded-md">
            {errors.find(error => error.field === 'general')?.message}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400">Table Name</label>
            <div className="relative">
              <VKeyboardInput
                k-type="full"
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  // Clear field error when user starts typing
                  if (getFieldError('name')) {
                    setErrors(errors.filter(error => error.field !== 'name'));
                  }
                }}
                className={`w-full mt-1 p-3 bg-slate-800 border ${
                  getFieldError('name') ? 'border-red-500' : 'border-slate-700'
                } rounded-md`}
                autoFocus
                required
              />
              <div className="absolute -right-5 top-3 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-xs text-slate-900 font-bold" title="Required field">
                !
              </div>
            </div>
            {getFieldError('name') && (
              <p className="mt-1 text-sm text-red-400">{getFieldError('name')}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm text-slate-400">Room</label>
            <div className="relative">
              <select
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  // Clear field error when user selects a new value
                  if (getFieldError('roomId')) {
                    setErrors(errors.filter(error => error.field !== 'roomId'));
                  }
                }}
                className={`w-full mt-1 p-3 bg-slate-800 border ${
                  getFieldError('roomId') ? 'border-red-500' : 'border-slate-700'
                } rounded-md`}
                required
              >
                <option value="">Select a room</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>
              <div className="absolute -right-5 top-3 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-xs text-slate-900 font-bold" title="Required field">
                !
              </div>
            </div>
            {getFieldError('roomId') && (
              <p className="mt-1 text-sm text-red-400">{getFieldError('roomId')}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400">X Position</label>
              <VKeyboardInput
                k-type="numeric"
                type="number"
                value={x}
                onChange={(e) => {
                  setX(e.target.value);
                  // Clear field error when user starts typing
                  if (getFieldError('position')) {
                    setErrors(errors.filter(error => error.field !== 'position'));
                  }
                }}
                className={`w-full mt-1 p-3 bg-slate-800 border ${
                  getFieldError('position') ? 'border-red-500' : 'border-slate-700'
                } rounded-md`}
                required
              />
              {getFieldError('position') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('position')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400">Y Position</label>
              <VKeyboardInput
                k-type="numeric"
                type="number"
                value={y}
                onChange={(e) => {
                  setY(e.target.value);
                  // Clear field error when user starts typing
                  if (getFieldError('position')) {
                    setErrors(errors.filter(error => error.field !== 'position'));
                  }
                }}
                className={`w-full mt-1 p-3 bg-slate-800 border ${
                  getFieldError('position') ? 'border-red-500' : 'border-slate-700'
                } rounded-md`}
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
                onChange={(e) => {
                  setWidth(e.target.value);
                  // Clear field error when user starts typing
                  if (getFieldError('size')) {
                    setErrors(errors.filter(error => error.field !== 'size'));
                  }
                }}
                className={`w-full mt-1 p-3 bg-slate-800 border ${
                  getFieldError('size') ? 'border-red-500' : 'border-slate-700'
                } rounded-md`}
                required
              />
              {getFieldError('size') && (
                <p className="mt-1 text-sm text-red-400">{getFieldError('size')}</p>
              )}
            </div>
            <div>
              <label className="block text-sm text-slate-400">Height</label>
              <VKeyboardInput
                k-type="numeric"
                type="number"
                value={height}
                onChange={(e) => {
                  setHeight(e.target.value);
                  // Clear field error when user starts typing
                  if (getFieldError('size')) {
                    setErrors(errors.filter(error => error.field !== 'size'));
                  }
                }}
                className={`w-full mt-1 p-3 bg-slate-800 border ${
                  getFieldError('size') ? 'border-red-500' : 'border-slate-700'
                } rounded-md`}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-slate-400">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as Table['status']);
                // Clear field error when user selects a new value
                if (getFieldError('status')) {
                  setErrors(errors.filter(error => error.field !== 'status'));
                }
              }}
              className={`w-full mt-1 p-3 bg-slate-800 border ${
                getFieldError('status') ? 'border-red-500' : 'border-slate-700'
              } rounded-md`}
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
              <option value="unavailable">Unavailable</option>
            </select>
            {getFieldError('status') && (
              <p className="mt-1 text-sm text-red-400">{getFieldError('status')}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-secondary disabled:opacity-50"
            title="Cancel changes"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary disabled:opacity-50 flex items-center gap-2"
            title="Save table details"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">🌀</span> Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

interface TableManagementProps {}

// Helper function to get quick tips based on active tab
const getQuickTips = (tab: 'layout' | 'rooms' | 'tables') => {
  switch(tab) {
    case 'layout':
      return [
        'Use View Mode to see the current layout without editing',
        'Switch to Edit Mode to add or modify tables',
        'Use Drag Mode to reposition existing tables',
        'Select a room from the dropdown to focus on specific area',
        'Try keyboard shortcut Ctrl+D to cycle through layout modes'
      ];
    case 'rooms':
      return [
        'Add rooms to organize your table layout by area',
        'Each room can have multiple tables assigned to it',
        'Rooms help separate dining areas (indoor, outdoor, private)',
        'Try keyboard shortcut Ctrl+M to quickly switch to rooms tab',
        'Remember to assign tables to rooms after creating them'
      ];
    case 'tables':
      return [
        'Tables must be assigned to a room to appear in layout',
        'Use descriptive names for easy identification (VIP-1, Patio-2)',
        'Set appropriate status (Available, Occupied, Reserved)',
        'Try keyboard shortcut Ctrl+T to quickly switch to tables tab',
        'Update positions in bulk using layout editor'
      ];
    default:
      return [];
  }
};

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

  // Define keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'r',
      ctrl: true,
      callback: () => {
        // Ctrl+R: Refresh data
        refreshData();
      }
    },
    {
      key: 'l',
      ctrl: true,
      callback: () => {
        // Ctrl+L: Switch to layout tab
        setActiveTab('layout');
      }
    },
    {
      key: 'm',
      ctrl: true,
      callback: () => {
        // Ctrl+M: Switch to rooms tab
        setActiveTab('rooms');
      }
    },
    {
      key: 't',
      ctrl: true,
      callback: () => {
        // Ctrl+T: Switch to tables tab
        setActiveTab('tables');
      }
    },
    {
      key: '+',
      ctrl: true,
      callback: () => {
        // Ctrl++: Add new table when on tables tab, or add new room when on rooms tab
        if (activeTab === 'tables') {
          setEditingTable(undefined);
          setIsTableModalOpen(true);
        } else if (activeTab === 'rooms') {
          setEditingRoom(undefined);
          setIsRoomModalOpen(true);
        }
      }
    },
    {
      key: 'd',
      ctrl: true,
      callback: () => {
        // Ctrl+D: Toggle layout mode (view/edit/drag)
        const modes: LayoutMode[] = ['view', 'edit', 'drag'];
        const currentIndex = modes.indexOf(layoutMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setLayoutMode(modes[nextIndex]);
      }
    }
  ]);
   
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

  // Get quick tips based on active tab
  const quickTips = getQuickTips(activeTab);

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
            className={`btn ${activeTab === 'layout' ? 'btn-primary' : 'btn-secondary'} text-sm`}
            onClick={() => setActiveTab('layout')}
            title="Manage table layouts visually"
          >
            Layout
            <span className="text-xs bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center">L</span>
          </button>
          <button
            className={`btn ${activeTab === 'rooms' ? 'btn-primary' : 'btn-secondary'} text-sm`}
            onClick={() => setActiveTab('rooms')}
            title="Manage room organization"
          >
            Rooms
            <span className="text-xs bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center">M</span>
          </button>
          <button
            className={`btn ${activeTab === 'tables' ? 'btn-primary' : 'btn-secondary'} text-sm`}
            onClick={() => setActiveTab('tables')}
            title="Manage individual tables"
          >
            Tables
            <span className="text-xs bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center">T</span>
          </button>
        </div>
      </div>

      {/* Quick Tips Section */}
      <div className="mb-4 p-3 bg-slate-800 rounded-md border border-slate-700">
        <h4 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Quick Tips: {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h4>
        <ul className="text-xs text-slate-300 space-y-1">
          {quickTips.map((tip, index) => (
            <li key={index} className="flex items-start">
              <span className="mr-2 text-amber-400">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex-grow overflow-y-auto">
        {activeTab === 'layout' && (
          <div className="h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2">
                Table Layout Editor
                <span className="text-xs bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center" title="Visual table layout management">?</span>
              </h3>
              <div className="flex gap-2">
                <select
                  value={selectedRoomId || ''}
                  onChange={(e) => setSelectedRoomId(e.target.value || null)}
                  className="bg-slate-800 border border-slate-700 rounded-md p-2 text-sm"
                  title="Select a room to focus on specific area"
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
                  title="Change layout mode (view, edit, drag)"
                >
                  <option value="view">View Mode</option>
                  <option value="edit">Edit Mode</option>
                  <option value="drag">Drag Mode</option>
                </select>
              </div>
            </div>
            <TableLayoutEditor selectedRoomId={selectedRoomId} />
            <div className="mt-4 text-xs text-slate-500">
              <p className="mb-1"><strong>View Mode:</strong> Browse the layout without making changes</p>
              <p className="mb-1"><strong>Edit Mode:</strong> Add, modify, or delete tables</p>
              <p><strong>Drag Mode:</strong> Move existing tables around</p>
            </div>
          </div>
        )}

        {activeTab === 'rooms' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2">
                Room Management
                <span className="text-xs bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center" title="Organize your venue into rooms/zones">?</span>
              </h3>
              <button
                onClick={() => { setEditingRoom(undefined); setIsRoomModalOpen(true); }}
                className="btn btn-primary text-sm flex items-center gap-1"
                title="Add a new room"
              >
                Add Room
                <span className="text-xs bg-slate-900 rounded-full w-4 h-4 flex items-center justify-center">+</span>
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-slate-800 rounded-md border border-slate-700 text-sm text-slate-300">
              <p className="mb-1"><strong>Rooms</strong> help you organize your tables by physical areas in your venue.</p>
              <p>Examples: Indoor Dining, Outdoor Patio, VIP Area, Private Rooms</p>
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
                        className="btn btn-info text-sm flex items-center gap-1"
                        title="Edit room details"
                      >
                        Edit
                        <span className="text-xs">✎</span>
                      </button>
                      <button
                        onClick={() => setDeletingRoom(room)}
                        className="btn btn-danger text-sm flex items-center gap-1"
                        title="Delete this room"
                      >
                        Delete
                        <span className="text-xs">✕</span>
                      </button>
                    </div>
                  </div>
                ))}
                
                {rooms.length === 0 && (
                  <div className="text-center py-12 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
                    <div className="flex justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-400 mb-2">No rooms added yet</h3>
                    <p className="text-slate-500 mb-4 max-w-xs sm:max-w-md mx-auto">Create your first room to organize tables by physical areas in your venue</p>
                    <button
                      onClick={() => { setEditingRoom(undefined); setIsRoomModalOpen(true); }}
                      className="btn btn-primary inline-flex items-center gap-2"
                      title="Add your first room"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Your First Room
                    </button>
                    <div className="mt-6 text-left max-w-xs sm:max-w-md mx-auto">
                      <h4 className="text-sm font-bold text-slate-400 mb-2">Room Examples:</h4>
                      <ul className="text-xs text-slate-500 space-y-1">
                        <li className="flex items-start">
                          <span className="mr-2 text-amber-400">•</span>
                          Indoor Dining
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2 text-amber-400">•</span>
                          Outdoor Patio
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2 text-amber-400">•</span>
                          VIP Area
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2 text-amber-400">•</span>
                          Private Rooms
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tables' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2">
                Table Management
                <span className="text-xs bg-slate-700 rounded-full w-5 h-5 flex items-center justify-center" title="Manage individual tables">?</span>
              </h3>
              <button
                onClick={() => { setEditingTable(undefined); setIsTableModalOpen(true); }}
                className="btn btn-primary text-sm flex items-center gap-1"
                title="Add a new table"
              >
                Add Table
                <span className="text-xs bg-slate-900 rounded-full w-4 h-4 flex items-center justify-center">+</span>
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-slate-800 rounded-md border border-slate-700 text-sm text-slate-300">
              <p className="mb-1"><strong>Tables</strong> must be assigned to a room to appear in the layout.</p>
              <p>Set status to track availability: Available, Occupied, Reserved, Unavailable</p>
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
                          Room: {room?.name || 'Unassigned'} | Status: {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                        </p>
                        <p className="text-xs text-slate-500">Position: ({table.x}, {table.y}) | Size: {table.width}x{table.height}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingTable(table); setIsTableModalOpen(true); }}
                          className="btn btn-info text-sm flex items-center gap-1"
                          title="Edit table details"
                        >
                          Edit
                          <span className="text-xs">✎</span>
                        </button>
                        <button
                          onClick={() => setDeletingTable(table)}
                          className="btn btn-danger text-sm flex items-center gap-1"
                          title="Delete this table"
                        >
                          Delete
                          <span className="text-xs">✕</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {roomTables.length === 0 && (
                  <div className="text-center py-12 bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-700">
                    <div className="flex justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-400 mb-2">
                      {selectedRoomId ? 'No tables in this room' : 'No tables added yet'}
                    </h3>
                    <p className="text-slate-500 mb-4 max-w-xs sm:max-w-md mx-auto">
                      {selectedRoomId
                        ? 'Add your first table to this room to get started.'
                        : 'Add your first table to organize seating arrangements.'}
                    </p>
                    <button
                      onClick={() => { setEditingTable(undefined); setIsTableModalOpen(true); }}
                      className="btn btn-primary inline-flex items-center gap-2"
                      title="Add your first table"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      {selectedRoomId ? 'Add Table to Room' : 'Add Your First Table'}
                    </button>
                    <div className="mt-6 text-left max-w-xs sm:max-w-md mx-auto">
                      <h4 className="text-sm font-bold text-slate-400 mb-2">Pro Tips:</h4>
                      <ul className="text-xs text-slate-500 space-y-1">
                        <li className="flex items-start">
                          <span className="mr-2 text-amber-400">•</span>
                          Assign tables to rooms for better organization
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2 text-amber-400">•</span>
                          Use descriptive names (VIP-1, Patio-2)
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2 text-amber-400">•</span>
                          Set appropriate status (Available, Occupied, Reserved)
                        </li>
                        <li className="flex items-start">
                          <span className="mr-2 text-amber-400">•</span>
                          Update positions using the visual layout editor
                        </li>
                      </ul>
                    </div>
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
        show={!!deletingRoom}
        title="Confirm Delete"
        message={`Are you sure you want to delete the room "${deletingRoom?.name}"? All tables in this room will also be deleted.`}
        onConfirm={confirmDeleteRoom}
        onCancel={() => setDeletingRoom(null)}
      />
      
      <ConfirmationModal
        show={!!deletingTable}
        title="Confirm Delete"
        message={`Are you sure you want to delete the table "${deletingTable?.name}"?`}
        onConfirm={confirmDeleteTable}
        onCancel={() => setDeletingTable(null)}
      />
      
      {/* Loading overlay */}
      {loading && <LoadingOverlay message="Loading tables and rooms..." />}
    </div>
 );
};