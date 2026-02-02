import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '../../shared/types';
import * as api from '../services/apiService';
import { clearAllSubscribers } from '../services/apiBase';

interface SessionContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  assignedTillId: number | null;
  setAssignedTillId: React.Dispatch<React.SetStateAction<number | null>>;
  isAdminPanelOpen: boolean;
  setIsAdminPanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleLogin: (user: User) => void;
  handleLogout: () => void;
  handleTillSelect: (tillId: number) => void;
 handleAssignDevice: (tillId: number) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: React.ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  // Restore user session from localStorage on initial load
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [assignedTillId, setAssignedTillId] = useState<number | null>(() => {
    const savedTill = localStorage.getItem('assignedTillId');
    return savedTill ? parseInt(savedTill, 10) : null;
  });
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    // User is already stored in localStorage by the login API function
  };

  const handleLogout = async () => {
    if (currentUser) {
      try {
        const result = await api.updateOrderSessionStatus('logout');
        if (!result) {
          console.warn('Order session logout status update failed or user not authenticated');
        }
      } catch (error) {
        console.error('Failed to update order session status on logout:', error);
      }
    }
    // Clear all subscribers to prevent API calls from in-flight operations after logout
    clearAllSubscribers();
    setCurrentUser(null);
    // Clear stored user from localStorage using API service
    await api.logout();
    setIsAdminPanelOpen(false);
  };

  const handleTillSelect = (tillId: number) => {
    localStorage.setItem('assignedTillId', String(tillId));
    setAssignedTillId(tillId);
    // If the user is an admin, the data is already loaded, so we don't need to show loading.
    if (currentUser?.role === 'Admin') {
      setIsAdminPanelOpen(true);
    } else {
      // This case is for future use; currently, only admins can select a till.
    }
  };

  const handleAssignDevice = (tillId: number) => {
    localStorage.setItem('assignedTillId', String(tillId));
    setAssignedTillId(tillId);
    // Log the user out and return to the login screen to reflect the change,
    // avoiding a full page reload which can cause a blank screen flicker.
    setCurrentUser(null);
    // Clear stored user from localStorage using API service
    api.logout();
    setIsAdminPanelOpen(false);
 };

  const value: SessionContextType = {
    currentUser,
    setCurrentUser,
    assignedTillId,
    setAssignedTillId,
    isAdminPanelOpen,
    setIsAdminPanelOpen,
    handleLogin,
    handleLogout,
    handleTillSelect,
    handleAssignDevice
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
};