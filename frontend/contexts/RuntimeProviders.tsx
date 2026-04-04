import React from 'react';
import { OrderProvider } from './OrderContext';
import { UIStateProvider } from './UIStateContext';
import { ToastProvider } from './ToastContext';
import { VirtualKeyboardProvider } from '../components/VirtualKeyboardContext';

interface RuntimeProvidersProps {
  children: React.ReactNode;
}

export const RuntimeProviders: React.FC<RuntimeProvidersProps> = ({ children }) => {
  return (
    <VirtualKeyboardProvider>
      <ToastProvider>
        <OrderProvider>
          <UIStateProvider>
            {children}
          </UIStateProvider>
        </OrderProvider>
      </ToastProvider>
    </VirtualKeyboardProvider>
  );
};
