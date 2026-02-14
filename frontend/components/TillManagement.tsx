import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Till } from '@shared/types';
import * as tillApi from '../services/tillService';
import { VKeyboardInput } from './VKeyboardInput';
import ConfirmationModal from './ConfirmationModal';

interface TillModalProps {
  till?: Till;
  onClose: () => void;
  onSave: () => void;
}

const TillModal: React.FC<TillModalProps> = ({ till, onClose, onSave }) => {
  const { t } = useTranslation('admin');
  const [name, setName] = useState(till?.name || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = t('tills.validation.nameRequired');
    } else if (name.trim().length > 100) {
      newErrors.name = t('tills.validation.nameMaxLength');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    await tillApi.saveTill({ id: till?.id, name });
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">{till ? t('tills.editTill') : t('tills.addTill')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400">{t('tills.tillName')}</label>
            <VKeyboardInput
              k-type="full"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => {
                  const {[name]: _, ...rest} = prev;
                  return rest;
                });
              }}
              className={`w-full mt-1 p-3 bg-slate-800 border rounded-md ${errors.name ? 'border-red-500' : 'border-slate-700'}`}
              autoFocus
              required
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="btn btn-secondary">{t('buttons.cancel', { ns: 'common' })}</button>
          <button type="submit" className="btn btn-primary">{t('buttons.save', { ns: 'common' })}</button>
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
  const { t } = useTranslation('admin');
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

  const currentTillName = tills.find(t => t.id === assignedTillId)?.name || t('tills.unassigned');

  return (
    <div>
      <div className="mb-6 bg-slate-800 p-4 rounded-md border border-slate-700">
        <p className="text-slate-300">{t('tills.deviceAssignedAs')} <span className="font-bold text-lg text-amber-400">{currentTillName}</span></p>
        <p className="text-xs text-slate-500 mt-1">{t('tills.reassignHint')}</p>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-300">{t('tills.manageAllTills')}</h3>
        <button
          onClick={() => { setEditingTill(undefined); setIsModalOpen(true); }}
          className="btn btn-primary"
        >
          {t('tills.addTill')}
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
                    <span className="bg-slate-600 text-slate-300 font-bold py-1 px-3 text-sm rounded-md">{t('tills.currentlyAssigned')}</span>
                ) : (
                    <button
                        onClick={() => setAssigningTill(till)}
                        className="btn btn-success btn-sm"
                    >
                        {t('tills.assignThisDevice')}
                    </button>
                )}
                <button
                    onClick={() => { setEditingTill(till); setIsModalOpen(true); }}
                    className="btn btn-secondary btn-sm"
                >
                    {t('buttons.edit', { ns: 'common' })}
                </button>
                 <button
                    onClick={() => setDeletingTill(till)}
                    className="btn btn-danger btn-sm"
                >
                    {t('buttons.delete', { ns: 'common' })}
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
        show={!!deletingTill}
        title={t('tills.confirmDeleteTitle')}
        message={t('tills.confirmDeleteMessage', { name: deletingTill?.name })}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingTill(null)}
      />
      <ConfirmationModal
        show={!!assigningTill}
        title={t('tills.confirmAssignmentTitle')}
        message={t('tills.confirmAssignmentMessage', { name: assigningTill?.name })}
        confirmText={t('tills.confirmAndRestart')}
        onConfirm={confirmAssign}
        onCancel={() => setAssigningTill(null)}
      />
    </div>
  );
};