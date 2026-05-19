import { makeApiRequest, apiUrl, getAuthHeaders, notifyUpdates } from './apiBase';

export interface RolePermission {
  id: number;
  roleId: number;
  permissionId: number;
  excluded: boolean;
  permission: Permission;
}

export interface Permission {
  id: number;
  module: string;
  action: string;
  field: string | null;
  key: string;
  description: string | null;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  scope: 'ORGANIZATION' | 'VENUE';
  isSystem: boolean;
  parentRoleId: number | null;
  parentRole: { id: number; name: string } | null;
  permissions: RolePermission[];
  _count: { userAssignments: number };
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleAssignment {
  id: number;
  userId: number;
  roleId: number;
  venueId: number | null;
  assignedBy: number;
  assignedAt: string;
  role: { id: number; name: string; scope: string; isSystem: boolean };
  venue: { id: number; name: string } | null;
}

export const getRoles = async (): Promise<Role[]> => {
  return makeApiRequest(apiUrl('/api/roles'), { headers: getAuthHeaders() });
};

const getRole = async (id: number): Promise<Role> => {
  return makeApiRequest(apiUrl(`/api/roles/${id}`), { headers: getAuthHeaders() });
};

const createRole = async (data: { name: string; description?: string; scope: string; parentRoleId?: number | null }): Promise<Role> => {
  const result = await makeApiRequest(apiUrl('/api/roles'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  notifyUpdates();
  return result;
};

const updateRole = async (id: number, data: {
  name?: string;
  description?: string;
  scope?: string;
  parentRoleId?: number | null;
  permissions?: { permissionId: number; excluded: boolean }[];
}): Promise<Role> => {
  const result = await makeApiRequest(apiUrl(`/api/roles/${id}`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  notifyUpdates();
  return result;
};

const deleteRole = async (id: number): Promise<void> => {
  await makeApiRequest(apiUrl(`/api/roles/${id}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  notifyUpdates();
};

const duplicateRole = async (id: number, data: { name: string; description?: string; scope?: string }): Promise<Role> => {
  const result = await makeApiRequest(apiUrl(`/api/roles/${id}/duplicate`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  notifyUpdates();
  return result;
};

const getPermissions = async (): Promise<Permission[]> => {
  return makeApiRequest(apiUrl('/api/roles/permissions'), { headers: getAuthHeaders() });
};

const getUserPermissions = async (userId: number): Promise<string[]> => {
  const result = await makeApiRequest(apiUrl(`/api/roles/users/${userId}/permissions`), { headers: getAuthHeaders() });
  return result.permissions;
};

const getUserRoleAssignments = async (userId: number): Promise<UserRoleAssignment[]> => {
  return makeApiRequest(apiUrl(`/api/users/${userId}/roles`), { headers: getAuthHeaders() });
};

const assignRole = async (userId: number, roleId: number, venueId?: number | null): Promise<UserRoleAssignment[]> => {
  return makeApiRequest(apiUrl(`/api/roles/users/${userId}/roles`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ roleId, venueId }),
  });
};

const removeRoleAssignment = async (userId: number, assignmentId: number): Promise<void> => {
  await makeApiRequest(apiUrl(`/api/roles/users/${userId}/roles/${assignmentId}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  notifyUpdates();
};

export const roleService = {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  duplicateRole,
  getPermissions,
  getUserPermissions,
  getUserRoleAssignments,
  assignRole,
  removeRoleAssignment,
};
