import React from 'react';
import { useLayout } from '../contexts/LayoutContext';

interface EditLayoutButtonProps {
  userRole: 'admin' | 'user'; // You can adjust this based on your auth system
}

export const EditLayoutButton: React.FC<EditLayoutButtonProps> = ({ userRole }) => {
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
      title="Edit product layout"
    >
      <span>✏️</span>
      <span>Edit Layout</span>
    </button>
  );
};