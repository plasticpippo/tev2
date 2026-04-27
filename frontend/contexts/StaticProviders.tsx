import React from 'react';
import { SessionProvider } from './SessionContext';
import { ToastProvider } from './ToastContext';
import { GlobalDataProvider } from './GlobalDataContext';

interface StaticProvidersProps {
  children: React.ReactNode;
}

export const StaticProviders: React.FC<StaticProvidersProps> = ({ children }) => {
  return (
    <SessionProvider>
      <ToastProvider>
        <GlobalDataProvider>
          {children}
        </GlobalDataProvider>
      </ToastProvider>
    </SessionProvider>
  );
};
