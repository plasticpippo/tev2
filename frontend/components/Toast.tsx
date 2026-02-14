import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../contexts/ToastContext';

interface ToastProps {
  toast: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  };
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const { t } = useTranslation();
  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-accent-success border-green-600';
      case 'error':
        return 'bg-accent-danger border-red-600';
      case 'warning':
        return 'bg-amber-500 border-amber-600';
      case 'info':
        return 'bg-blue-500 border-blue-600';
      default:
        return 'bg-slate-800 border-slate-700';
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [onClose, toast.duration]);

  return (
    <div className={`flex items-center justify-between p-4 mb-spacing-xs rounded-lg border shadow-lg text-white ${getToastStyle()} max-w-sm w-full animate-fadeIn`}>
      <span>{toast.message}</span>
      <button 
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        aria-label={t('common:toast.close')}
      >
        &times;
      </button>
    </div>
  );
};

export default Toast;