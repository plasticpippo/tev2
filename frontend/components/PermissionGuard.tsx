import React from 'react';
import { usePermission } from '../contexts/PermissionContext';

interface PermissionGuardProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ permission, children, fallback = null }) => {
  const { hasPermission, loading } = usePermission();

  if (loading) {
    return <>{children}</>;
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface DisabledActionProps {
  permission: string;
  tooltip?: string;
  children: React.ReactNode;
}

export const DisabledAction: React.FC<DisabledActionProps> = ({ permission, tooltip, children }) => {
  const { hasPermission } = usePermission();

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return (
    <div className="relative group inline-block">
      <div className="pointer-events-none opacity-50">
        {children}
      </div>
      {tooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-700 text-sm text-slate-200 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          {tooltip}
        </div>
      )}
    </div>
  );
};
