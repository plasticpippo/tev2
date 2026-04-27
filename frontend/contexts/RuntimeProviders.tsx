import React from 'react';
import { OrderProvider } from './OrderContext';
import { UIStateProvider } from './UIStateContext';
import { VirtualKeyboardProvider } from '../components/VirtualKeyboardContext';

interface RuntimeProvidersProps {
  children: React.ReactNode;
}

export const RuntimeProviders: React.FC<RuntimeProvidersProps> = ({ children }) => {
  return (
    <VirtualKeyboardProvider>
      <OrderProvider>
        <UIStateProvider>
          {children}
        </UIStateProvider>
      </OrderProvider>
    </VirtualKeyboardProvider>
  );
};
