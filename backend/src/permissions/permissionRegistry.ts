import type { PermissionModule, PermissionAction } from './types';

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    name: 'products',
    actions: [
      { name: 'create', fields: ['cost_price'] },
      { name: 'read' },
      { name: 'update' },
      { name: 'delete' },
    ],
  },
  {
    name: 'transactions',
    actions: [
      { name: 'process', fields: ['discount_amount'] },
      { name: 'void' },
      { name: 'refund' },
      { name: 'read' },
    ],
  },
  {
    name: 'stock',
    actions: [
      { name: 'read' },
      { name: 'adjust' },
      { name: 'count' },
      { name: 'manage' },
    ],
  },
  {
    name: 'tables',
    actions: [
      { name: 'create' },
      { name: 'read' },
      { name: 'update' },
      { name: 'delete' },
      { name: 'assign' },
    ],
  },
  {
    name: 'layouts',
    actions: [
      { name: 'create' },
      { name: 'read' },
      { name: 'update' },
      { name: 'delete' },
      { name: 'assign' },
    ],
  },
  {
    name: 'rooms',
    actions: [
      { name: 'create' },
      { name: 'read' },
      { name: 'update' },
      { name: 'delete' },
    ],
  },
  {
    name: 'categories',
    actions: [
      { name: 'create' },
      { name: 'read' },
      { name: 'update' },
      { name: 'delete' },
    ],
  },
  {
    name: 'tills',
    actions: [
      { name: 'create' },
      { name: 'read' },
      { name: 'update' },
      { name: 'delete' },
    ],
  },
  {
    name: 'receipts',
    actions: [
      { name: 'create' },
      { name: 'read' },
      { name: 'update' },
      { name: 'delete' },
    ],
  },
  {
    name: 'settings',
    actions: [
      { name: 'read' },
      { name: 'manage' },
    ],
  },
  {
    name: 'analytics',
    actions: [
      { name: 'read' },
      { name: 'export' },
    ],
  },
  {
    name: 'daily_closings',
    actions: [
      { name: 'create' },
      { name: 'read' },
      { name: 'update' },
    ],
  },
  {
    name: 'orders',
    actions: [
      { name: 'create' },
      { name: 'read' },
      { name: 'update' },
    ],
  },
  {
    name: 'users',
    actions: [
      { name: 'create' },
      { name: 'read' },
      { name: 'update' },
      { name: 'delete' },
    ],
  },
  {
    name: 'roles',
    actions: [
      { name: 'create' },
      { name: 'read' },
      { name: 'update' },
      { name: 'delete' },
      { name: 'assign' },
    ],
  },
  {
    name: 'venues',
    actions: [
      { name: 'create' },
      { name: 'read' },
      { name: 'update' },
      { name: 'delete' },
    ],
  },
  {
    name: 'customers',
    actions: [
      { name: 'create' },
      { name: 'read' },
      { name: 'update' },
      { name: 'delete' },
    ],
  },
];

export function generatePermissionKey(module: string, action: string, field?: string): string {
  if (field) {
    return `${module}:${action}:${field}`;
  }
  return `${module}:${action}`;
}

export function getAllPermissionKeys(): string[] {
  const keys: string[] = [];

  for (const module of PERMISSION_MODULES) {
    for (const action of module.actions) {
      if (action.fields && action.fields.length > 0) {
        for (const field of action.fields) {
          keys.push(generatePermissionKey(module.name, action.name, field));
        }
      }
      keys.push(generatePermissionKey(module.name, action.name));
    }
  }

  return keys;
}

export const OWNER_ROLE_NAME = 'Owner';
export const VENUE_MANAGER_ROLE_NAME = 'Venue Manager';
export const CASHIER_ROLE_NAME = 'Cashier';