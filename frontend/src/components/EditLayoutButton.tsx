import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLayout } from '../contexts/LayoutContext';

interface EditLayoutButtonProps {
  userRole: 'admin' | 'user'; // You can adjust this based on your auth system
}

export const EditLayoutButton: React.FC<EditLayoutButtonProps> = ({ userRole }) => {
  const { t } = useTranslation();
  const { enterEditMode, isEditMode } = useLayout();

  // Only show for admin users
  if (userRole !== 'admin') {
    return null;
  }

  // Hide when already in edit mode
  if (isEditMode) {
    return null;
  }

  return (
    <button
      onClick={enterEditMode}
      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
      title={t('editLayoutButton.title') as string}
    >
      <span>{t('editLayoutButton.edit')}</span>
      <span>{t('editLayoutButton.editLayout')}</span>
    </button>
  );
};