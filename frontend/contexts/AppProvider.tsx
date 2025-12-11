import React from 'react';
import { SessionProvider } from './SessionContext';
import { GlobalDataProvider } from './GlobalDataContext';
import { OrderProvider } from './OrderContext';
import { UIStateProvider } from './UIStateContext';
import { TableAssignmentProvider } from './TableAssignmentContext';
import { PaymentProvider } from './PaymentContext';
import { TabManagementProvider } from './TabManagementContext';

interface AppProviderProps {
  children: React.ReactNode;
}

// The AppProvider composes all the individual context providers
// The order of providers is important as some contexts depend on others
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <SessionProvider>
      <GlobalDataProvider>
        <OrderProvider>
          <UIStateProvider>
            <TableAssignmentProvider>
              <TabManagementProvider>
                <PaymentProvider>
                  {children}
                </PaymentProvider>
              </TabManagementProvider>
            </TableAssignmentProvider>
          </UIStateProvider>
        </OrderProvider>
      </GlobalDataProvider>
    </SessionProvider>
  );
};