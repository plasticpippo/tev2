import React, { useEffect } from 'react';
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
  const getToastStyle = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500 border-green-600';
      case 'error':
        return 'bg-red-500 border-red-600';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600';
      case 'info':
        return 'bg-blue-500 border-blue-600';
      default:
        return 'bg-gray-800 border-gray-700';
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [onClose, toast.duration]);

  return (
    <div className={`flex items-center justify-between p-4 mb-2 rounded-lg border shadow-lg text-white ${getToastStyle()} max-w-sm w-full animate-fadeIn`}>
      <span>{toast.message}</span>
      <button 
        onClick={onClose}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        aria-label="Close"
      >
        &times;
      </button>
    </div>
  );
};

export default Toast;