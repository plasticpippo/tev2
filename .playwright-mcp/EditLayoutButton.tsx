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
      className="min-h-11 min-w-11 px-2 sm:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center sm:gap-2"
      title={t('editLayoutButton.title') as string}
    >
      <span className="hidden sm:inline">{t('editLayoutButton.edit')}</span>
      <span className="sm:hidden">{t('editLayoutButton.edit')}</span>
      <span className="hidden sm:inline">{t('editLayoutButton.editLayout')}</span>
    </button>
  );
};