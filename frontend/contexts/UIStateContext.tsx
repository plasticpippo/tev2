import React, { createContext, useContext, useState } from 'react';
import type { Tab } from '../../shared/types';

interface UIStateContextType {
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTabsModalOpen: boolean;
  setIsTabsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTransferModalOpen: boolean;
  setIsTransferModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTableAssignmentModalOpen: boolean;
  setIsTableAssignmentModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  transferSourceTab: Tab | null;
  setTransferSourceTab: React.Dispatch<React.SetStateAction<Tab | null>>;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

interface UIStateProviderProps {
  children: React.ReactNode;
}

export const UIStateProvider: React.FC<UIStateProviderProps> = ({ children }) => {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTabsModalOpen, setIsTabsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isTableAssignmentModalOpen, setIsTableAssignmentModalOpen] = useState(false);
  const [transferSourceTab, setTransferSourceTab] = useState<Tab | null>(null);

  const value: UIStateContextType = {
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    isTabsModalOpen,
    setIsTabsModalOpen,
    isTransferModalOpen,
    setIsTransferModalOpen,
    isTableAssignmentModalOpen,
    setIsTableAssignmentModalOpen,
    transferSourceTab,
    setTransferSourceTab
  };

  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
};

export const useUIStateContext = () => {
  const context = useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIStateContext must be used within a UIStateProvider');
  }
  return context;
};