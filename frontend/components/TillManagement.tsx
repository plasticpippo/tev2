import React, { useState } from 'react';
import type { Till } from '../../shared/types';
import * as tillApi from '../services/tillService';
import { VKeyboardInput } from './VKeyboardInput';
import { ConfirmationModal } from './ConfirmationModal';

interface TillModalProps {
  till?: Till;
  onClose: () => void;
  onSave: () => void;
}

const TillModal: React.FC<TillModalProps> = ({ till, onClose, onSave }) => {
  const [name, setName] = useState(till?.name || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await tillApi.saveTill({ id: till?.id, name });
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">{till ? 'Edit' : 'Add'} Till</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400">Till Name</label>
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
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md">Cancel</button>
          <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md">Save</button>
        </div>
      </form>
    </div>
  );
};

interface TillManagementProps {
    tills: Till[];
    onDataUpdate: () => void;
    assignedTillId: number | null;
    onAssignDevice: (tillId: number) => void;
}

export const TillManagement: React.FC<TillManagementProps> = ({ tills, onDataUpdate, assignedTillId, onAssignDevice }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTill, setEditingTill] = useState<Till | undefined>(undefined);
  const [deletingTill, setDeletingTill] = useState<Till | null>(null);
  const [assigningTill, setAssigningTill] = useState<Till | null>(null);

  const handleSave = () => {
    setIsModalOpen(false);
    setEditingTill(undefined);
    onDataUpdate();
  };

  const confirmDelete = async () => {
    if (deletingTill) {
        await tillApi.deleteTill(deletingTill.id);
        setDeletingTill(null);
        onDataUpdate();
    }
  };
  
  const confirmAssign = () => {
    if (assigningTill) {
        onAssignDevice(assigningTill.id);
        setAssigningTill(null);
    }
  };

  const currentTillName = tills.find(t => t.id === assignedTillId)?.name || 'Unassigned';

  return (
    <div>
      <div className="mb-6 bg-slate-800 p-4 rounded-md border border-slate-700">
        <p className="text-slate-300">This device is currently assigned as: <span className="font-bold text-lg text-amber-400">{currentTillName}</span></p>
        <p className="text-xs text-slate-500 mt-1">You can re-assign this device to a different till below.</p>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-300">Manage All Tills</h3>
        <button
          onClick={() => { setEditingTill(undefined); setIsModalOpen(true); }}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md"
        >
          Add Till
        </button>
      </div>
      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-2">
        {tills.map(till => (
          <div key={till.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center min-h-[76px]">
            <div>
              <p className="font-semibold">{till.name}</p>
            </div>
            <div className="flex items-center gap-2">
                {till.id === assignedTillId ? (
                    <span className="bg-slate-600 text-slate-300 font-bold py-1 px-3 text-sm rounded-md">Currently Assigned</span>
                ) : (
                    <button
                        onClick={() => setAssigningTill(till)}
                        className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-3 text-sm rounded-md"
                    >
                        Assign This Device
                    </button>
                )}
                <button
                    onClick={() => { setEditingTill(till); setIsModalOpen(true); }}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold py-1 px-3 text-sm rounded-md"
                >
                    Edit
                </button>
                 <button
                    onClick={() => setDeletingTill(till)}
                    className="bg-red-700 hover:bg-red-600 text-white font-bold py-1 px-3 text-sm rounded-md"
                >
                    Delete
                </button>
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <TillModal
          till={editingTill}
          onClose={() => { setIsModalOpen(false); setEditingTill(undefined); }}
          onSave={handleSave}
        />
      )}
      <ConfirmationModal
        isOpen={!!deletingTill}
        message={`Are you sure you want to delete the till "${deletingTill?.name}"? Any device assigned to this till will need to be reconfigured.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingTill(null)}
      />
      <ConfirmationModal
        isOpen={!!assigningTill}
        message={`Are you sure you want to re-assign this terminal to "${assigningTill?.name}"? The application will restart to apply the change.`}
        confirmText="Confirm & Restart"
        confirmColor="bg-green-600 hover:bg-green-500"
        onConfirm={confirmAssign}
        onCancel={() => setAssigningTill(null)}
      />
    </div>
  );
};