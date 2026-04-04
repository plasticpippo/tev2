import React from 'react';
import { SessionProvider } from './SessionContext';
import { GlobalDataProvider } from './GlobalDataContext';

interface StaticProvidersProps {
  children: React.ReactNode;
}

export const StaticProviders: React.FC<StaticProvidersProps> = ({ children }) => {
  return (
    <SessionProvider>
      <GlobalDataProvider>
        {children}
      </GlobalDataProvider>
    </SessionProvider>
  );
};
