import React from 'react';
import { useLayout } from '../contexts/LayoutContext';
import { EditModeToolbar } from './EditModeToolbar';

export const EditModeOverlay: React.FC = () => {
  const { isEditMode } = useLayout();

  if (!isEditMode) {
    return null;
  }

  return (
    <div className="absolute top-0 right-0 w-full h-full bg-slate-900/95 backdrop-blur-sm z-50">
      <EditModeToolbar />
    </div>
  );
};