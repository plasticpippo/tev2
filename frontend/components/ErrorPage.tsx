import React from 'react';
import { useTranslation } from 'react-i18next';
import ErrorMessage from './ErrorMessage';

interface ErrorPageProps {
  error: Error;
  onGoBack?: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ error, onGoBack }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md p-6 border border-slate-700">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-slate-200">{t('errorPage.title')}</h3>
          <p className="mt-2 text-sm text-slate-400">
            {t('errorPage.description')}
          </p>
          
          <ErrorMessage 
            message={error.message || t('errorPage.unexpectedError')} 
            type="error"
            onGoBack={onGoBack}
            showGoBack={!!onGoBack}
          />
          
          <div className="mt-6">
            {onGoBack && (
              <button
                onClick={onGoBack}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-slate-600 hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500"
              >
                {t('errorPage.goBack')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;