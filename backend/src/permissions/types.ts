export type RoleScope = 'ORGANIZATION' | 'VENUE';

export interface PermissionKey {
  module: string;
  action: string;
  field?: string;
}

export interface Permission {
  id: number;
  module: string;
  action: string;
  field: string | null;
  description: string | null;
  key: string;
  createdAt: Date;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  scope: RoleScope;
  isSystem: boolean;
  parentRoleId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleWithPermissions extends Role {
  permissions: (RolePermission & { permission: Permission })[];
  _count?: {
    userAssignments: number;
  };
}

export interface RolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  excluded: boolean;
  createdAt: Date;
  permission?: Permission;
}

export interface UserRoleAssignment {
  id: number;
  userId: number;
  roleId: number;
  venueId: number | null;
  assignedBy: number;
  assignedAt: Date;
  role?: Role;
  venue?: Venue;
}

export interface Venue {
  id: number;
  name: string;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceOwnership {
  id: number;
  resourceType: string;
  resourceId: string;
  userId: number;
  venueId: number;
  createdAt: Date;
}

export interface PermissionCheckContext {
  userId: number;
  role: string;
  venueId?: number;
  resourceType?: string;
  resourceId?: string;
}

export interface PermissionModule {
  name: string;
  actions: PermissionAction[];
}

export interface PermissionAction {
  name: string;
  fields?: string[];
}