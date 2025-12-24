import React from 'react';

interface ConfirmationModalProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
 onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonType?: 'primary' | 'secondary' | 'danger';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonType = 'danger'
}) => {
  if (!show) return null;

  const getConfirmButtonClass = () => {
    switch (confirmButtonType) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'secondary':
        return 'bg-slate-60 hover:bg-slate-700';
      case 'danger':
      default:
        return 'bg-red-600 hover:bg-red-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-1/3">
        <h3 className="text-xl font-bold mb-4 text-amber-400">{title}</h3>
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="bg-slate-60 hover:bg-slate-700 text-white py-2 px-4 rounded"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`${getConfirmButtonClass()} text-white py-2 px-4 rounded`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;