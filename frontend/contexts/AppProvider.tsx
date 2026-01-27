import React from 'react';
import { SessionProvider } from './SessionContext';
import { GlobalDataProvider } from './GlobalDataContext';
import { OrderProvider } from './OrderContext';
import { UIStateProvider } from './UIStateContext';
import { TableAssignmentProvider } from './TableAssignmentContext';
import { PaymentProvider } from './PaymentContext';
import { TabManagementProvider } from './TabManagementContext';
import { TableProvider } from '../components/TableContext';
import { ToastProvider } from './ToastContext';

interface AppProviderProps {
  children: React.ReactNode;
}

// The AppProvider composes all the individual context providers
// The order of providers is important as some contexts depend on others
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    return (
      <ToastProvider>
        <SessionProvider>
          <GlobalDataProvider>
            <OrderProvider>
              <UIStateProvider>
                <TableAssignmentProvider>
                  <PaymentProvider>
                    <TabManagementProvider>
                      <TableProvider>
                        {children}
                      </TableProvider>
                    </TabManagementProvider>
                  </PaymentProvider>
                </TableAssignmentProvider>
              </UIStateProvider>
            </OrderProvider>
          </GlobalDataProvider>
        </SessionProvider>
      </ToastProvider>
    );
};