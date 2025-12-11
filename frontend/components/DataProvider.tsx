import React, { useEffect } from 'react';
import { AppProvider } from '../contexts/AppProvider';
import { VirtualKeyboardProvider } from './VirtualKeyboardContext';
import { MainPOSInterface } from './MainPOSInterface';

export const DataProvider: React.FC = () => {
  return (
    <VirtualKeyboardProvider>
      <AppProvider>
        <MainPOSInterface />
      </AppProvider>
    </VirtualKeyboardProvider>
  );
};

export default DataProvider;