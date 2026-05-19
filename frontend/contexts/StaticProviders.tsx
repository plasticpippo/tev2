import React from 'react';
import { SessionProvider, useSessionContext } from './SessionContext';
import { ToastProvider } from './ToastContext';
import { GlobalDataProvider } from './GlobalDataContext';
import { PermissionProvider } from './PermissionContext';
import { VenueProvider } from './VenueContext';

interface StaticProvidersProps {
  children: React.ReactNode;
}

const PermissionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useSessionContext();
  return (
    <PermissionProvider currentUser={currentUser}>
      {children}
    </PermissionProvider>
  );
};

export const StaticProviders: React.FC<StaticProvidersProps> = ({ children }) => {
  return (
    <SessionProvider>
      <VenueProvider>
        <PermissionWrapper>
          <ToastProvider>
            <GlobalDataProvider>
              {children}
            </GlobalDataProvider>
          </ToastProvider>
        </PermissionWrapper>
      </VenueProvider>
    </SessionProvider>
  );
};
