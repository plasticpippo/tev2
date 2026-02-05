import React from 'react';

interface LoadingOverlayProps {
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-primary p-spacing-xl rounded-lg shadow-xl border border-slate-700">
        <div className="flex flex-col items-center gap-spacing-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-accent-primary"></div>
          <p className="text-white font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};