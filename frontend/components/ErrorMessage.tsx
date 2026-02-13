import React from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  onRetry?: () => void;
  onClear?: () => void;
  onGoBack?: () => void;
  showRetry?: boolean;
  showClear?: boolean;
  showGoBack?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  type = 'error',
  onRetry,
  onClear,
  onGoBack,
  showRetry = false,
  showClear = false,
  showGoBack = false
}) => {
  const { t } = useTranslation();

  const getBgColor = () => {
    switch (type) {
      case 'warning': return 'bg-amber-900 bg-opacity-50';
      case 'info': return 'bg-blue-900 bg-opacity-50';
      default: return 'bg-red-900 bg-opacity-50';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'warning': return 'border-yellow-600';
      case 'info': return 'border-blue-600';
      default: return 'border-red-600';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'warning': return 'text-yellow-200';
      case 'info': return 'text-blue-200';
      default: return 'text-red-200';
    }
  };

  return (
    <div className={`rounded-md p-4 mb-spacing-lg border-l-4 ${getBgColor()} ${getBorderColor()}`}>
      <div className="flex items-start">
        <div className="flex-1">
          <p className={`text-sm ${getTextColor()}`}>
            {message}
          </p>
        </div>
        <div className="flex space-x-2">
          {showRetry && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-accent-primary-hover hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
            >
              {t('errorMessage.retry')}
            </button>
          )}
          {showClear && onClear && (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              {t('errorMessage.clearForm')}
            </button>
          )}
          {showGoBack && onGoBack && (
            <button
              type="button"
              onClick={onGoBack}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-bg-tertiary hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
            >
              {t('errorMessage.goBack')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorMessage;