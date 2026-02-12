import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings, DailyClosing } from '@shared/types';
import ConfirmationModal from './ConfirmationModal';
import { createDailyClosing } from '../services/dailyClosingService';
import { format } from 'date-fns';

interface DailyClosingButtonProps {
  settings: Settings;
  userId: number;
  userName: string;
  disabled?: boolean;
}

export const DailyClosingButton: React.FC<DailyClosingButtonProps> = ({ settings, userId, userName, disabled = false }) => {
  const { t } = useTranslation('admin');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleManualClose = async () => {
    setIsProcessing(true);
    setSuccessMessage(null);
    try {
      // Call the new API endpoint to create a daily closing
      const result = await createDailyClosing(new Date().toISOString(), userId);
      setIsConfirmModalOpen(false);
      setSuccessMessage(t('dailyClosing.successMessage', { date: format(new Date(result.closedAt), 'MMM dd, yyyy HH:mm') }));
    } catch (error) {
      console.error('Error creating daily closing:', error);
      alert(t('dailyClosing.errorMessage'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="w-full">
        <button
          onClick={() => setIsConfirmModalOpen(true)}
          disabled={disabled || isProcessing}
          className={`w-full bg-amber-60 hover:bg-amber-500 text-white font-bold py-3 rounded-md transition ${
            disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isProcessing ? t('dailyClosing.processing') : t('dailyClosing.closeCurrentBusinessDay')}
        </button>
        
        {successMessage && (
          <div className="mt-2 p-2 bg-green-100 text-green-800 rounded-md text-sm">
            {successMessage}
          </div>
        )}
      </div>

      <ConfirmationModal
        show={isConfirmModalOpen}
        title={t('dailyClosing.confirmTitle')}
        message={t('dailyClosing.confirmMessage')}
        confirmText={t('dailyClosing.confirmButton')}
        onConfirm={handleManualClose}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </>
  );
};