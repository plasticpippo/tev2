import React from 'react';
import { StaticProviders } from './StaticProviders';
import { RuntimeProviders } from './RuntimeProviders';
import { TableAssignmentProvider } from './TableAssignmentContext';
import { PaymentProvider } from './PaymentContext';
import { TabManagementProvider } from './TabManagementContext';
import { TableProvider } from '../components/TableContext';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <StaticProviders>
      <RuntimeProviders>
        <TableAssignmentProvider>
          <PaymentProvider>
            <TabManagementProvider>
              <TableProvider>
                {children}
              </TableProvider>
            </TabManagementProvider>
          </PaymentProvider>
        </TableAssignmentProvider>
      </RuntimeProviders>
    </StaticProviders>
  );
};