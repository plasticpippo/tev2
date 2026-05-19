import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '../../shared/types';
import { roleService } from '../services/roleService';
import { useVenue } from './VenueContext';

interface PermissionContextType {
  permissions: string[];
  loading: boolean;
  hasPermission: (key: string) => boolean;
  hasAnyPermission: (keys: string[]) => boolean;
  hasModuleAccess: (module: string) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: React.ReactNode;
  currentUser: User | null;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children, currentUser }) => {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeVenue } = useVenue();

  const refreshPermissions = useCallback(async () => {
    if (!currentUser) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const perms = await roleService.getUserPermissions(currentUser.id);
      setPermissions(perms);
    } catch {
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, activeVenue?.id]);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const hasPermission = useCallback((key: string): boolean => {
    if (permissions.includes('*')) return true;
    return permissions.includes(key);
  }, [permissions]);

  const hasAnyPermission = useCallback((keys: string[]): boolean => {
    if (permissions.includes('*')) return true;
    return keys.some(k => permissions.includes(k));
  }, [permissions]);

  const hasModuleAccess = useCallback((module: string): boolean => {
    if (permissions.includes('*')) return true;
    return permissions.some(p => p.startsWith(`${module}:`));
  }, [permissions]);

  return (
    <PermissionContext.Provider value={{ permissions, loading, hasPermission, hasAnyPermission, hasModuleAccess, refreshPermissions }}>
      {children}
    </PermissionContext.Provider>
  );
};

export function usePermission(): PermissionContextType {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermission must be used within a PermissionProvider');
  }
  return context;
}

export default PermissionContext;
