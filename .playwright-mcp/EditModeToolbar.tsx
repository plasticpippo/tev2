import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLayout } from '../contexts/LayoutContext';
import ConfirmationModal from '../../components/ConfirmationModal';

export const EditModeToolbar: React.FC = () => {
  const { t } = useTranslation();
  const { saveLayout, resetLayout, discardChanges, isDirty } = useLayout();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleSave = () => {
    saveLayout();
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowConfirmModal(true);
    } else {
      discardChanges();
    }
  };

  const handleConfirmDiscard = () => {
    setShowConfirmModal(false);
    discardChanges();
  };

  const handleCancelDiscard = () => {
    setShowConfirmModal(false);
  };

  const handleReset = () => {
    resetLayout();
  };

  return (
    <div className="flex flex-col h-full bg-slate-800 p-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-yellow-500 mb-2">
          {t('pos:layout.editModeTitle')}
        </h2>
        <p className="text-gray-400 text-sm">
          {t('pos:layout.editModeDescription')}
        </p>
        {isDirty && (
          <div className="mt-2 text-yellow-400 text-xs flex items-center">
            <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
            {t('pos:layout.unsavedChanges')}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mb-6 bg-slate-700 rounded-lg p-4">
        <h3 className="text-white font-semibold mb-2 text-sm">{t('pos:layout.instructions')}</h3>
        <ul className="text-gray-300 text-xs space-y-1">
          <li>{t('pos:layout.instructionDrag')}</li>
          <li>{t('pos:layout.instructionGrid')}</li>
          <li>{t('pos:layout.instructionCategory')}</li>
          <li>{t('pos:layout.instructionSave')}</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="mt-auto space-y-3">
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            isDirty
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isDirty ? t('pos:layout.saveButton') : t('pos:layout.savedButton')}
        </button>

        <button
          onClick={handleReset}
          className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
        >
          {t('pos:layout.resetButton')}
        </button>

        <button
          onClick={handleCancel}
          className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
        >
          {t('pos:layout.cancelButton')}
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <p className="text-gray-500 text-xs text-center">
          {t('pos:layout.gridInfo')}
        </p>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        show={showConfirmModal}
        title={t('pos:layout.confirmUnsavedTitle') as string}
        message={t('pos:layout.confirmUnsavedMessage') as string}
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
        confirmText={t('pos:layout.confirmDiscard') as string}
        cancelText={t('pos:layout.keepEditing') as string}
        confirmButtonType="danger"
      />
    </div>
  );
};
