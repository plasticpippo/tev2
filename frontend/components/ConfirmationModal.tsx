import React from 'react';
import { useTranslation } from 'react-i18next';

interface ConfirmationModalProps {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string | React.ReactNode;
  cancelText?: string;
  confirmButtonType?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  show,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  confirmButtonType = 'danger',
  disabled = false
}) => {
  const { t } = useTranslation();
  if (!show) return null;

  const getConfirmButtonClass = () => {
    switch (confirmButtonType) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'secondary':
        return 'bg-bg-tertiary hover:bg-slate-700';
      case 'danger':
      default:
        return 'bg-accent-danger hover:bg-red-700';
    }
  };

  // Use translated defaults if not provided
  const confirmLabel = confirmText ?? t('buttons.confirm');
  const cancelLabel = cancelText ?? t('buttons.cancel');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-primary rounded-lg p-spacing-xl w-1/3">
        <h3 className="text-xl font-bold mb-4 text-accent-primary">{title}</h3>
        <p className="mb-4">{message}</p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="bg-slate-60 hover:bg-slate-700 text-white py-2 px-4 rounded"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={disabled}
            className={`${getConfirmButtonClass()} text-white py-2 px-4 rounded ${disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;