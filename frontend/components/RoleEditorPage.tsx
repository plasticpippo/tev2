import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Role, Permission, RolePermission } from '../services/roleService';
import { roleService } from '../services/roleService';
import ErrorMessage from './ErrorMessage';

interface RoleEditorPageProps {
  role?: Role | null;
  isNew?: boolean;
  onBack: () => void;
  onSaved: () => void;
}

interface PermissionCheckboxState {
  [key: string]: { granted: boolean; excluded: boolean; inherited: boolean };
}

const MODULES_ORDER = [
  'products', 'transactions', 'stock', 'tables', 'layouts', 'rooms',
  'categories', 'tills', 'receipts', 'settings', 'analytics', 'daily_closings',
  'orders', 'users', 'roles', 'venues', 'customers',
];

const ACTIONS_ORDER = ['create', 'process', 'read', 'update', 'delete', 'manage', 'adjust', 'count', 'assign', 'void', 'refund', 'export'];

const FIELD_ACTIONS = new Map<string, string[]>([
  ['products', ['cost_price']],
  ['transactions', ['discount_amount']],
]);

export const RoleEditorPage: React.FC<RoleEditorPageProps> = ({ role, isNew, onBack, onSaved }) => {
  const { t } = useTranslation('admin');
  const isSystemRole = !isNew && !!role?.isSystem;
  const [name, setName] = useState(role?.name || '');
  const [description, setDescription] = useState(role?.description || '');
  const [scope, setScope] = useState<'ORGANIZATION' | 'VENUE'>(role?.scope || 'VENUE');
  const [parentRoleId, setParentRoleId] = useState<number | null>(role?.parentRoleId || null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [checkboxState, setCheckboxState] = useState<PermissionCheckboxState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      let fullRole = role;
      if (!isNew && role?.id) {
        fullRole = await roleService.getRole(role.id);
      }
      const [perms, roles] = await Promise.all([
        roleService.getPermissions(),
        roleService.getRoles(),
      ]);
      setAllPermissions(perms);
      setAllRoles(roles);

      if (fullRole) {
        setName(fullRole.name);
        setDescription(fullRole.description || '');
        setScope(fullRole.scope);
        setParentRoleId(fullRole.parentRoleId);
      }

      const state: PermissionCheckboxState = {};
      for (const p of perms) {
        state[p.key] = { granted: false, excluded: false, inherited: false };
      }

      if (fullRole?.permissions) {
        for (const rp of fullRole.permissions) {
          const key = rp.permission.key;
          if (state[key]) {
            state[key].granted = !rp.excluded;
            state[key].excluded = rp.excluded;
          }
        }
      }

      setCheckboxState(state);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [role, isNew]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const getInheritedKeys = useCallback((): Set<string> => {
    if (!parentRoleId) return new Set();
    const parent = allRoles.find(r => r.id === parentRoleId);
    if (!parent) return new Set();
    const keys = new Set<string>();
    const addParentPerms = (r: Role) => {
      if (r.permissions) {
        for (const rp of r.permissions) {
          if (!rp.excluded) keys.add(rp.permission.key);
        }
      }
      if (r.parentRoleId) {
        const grandparent = allRoles.find(rp => rp.id === r.parentRoleId);
        if (grandparent) addParentPerms(grandparent);
      }
    };
    addParentPerms(parent);
    return keys;
  }, [parentRoleId, allRoles]);

  const inheritedKeys = getInheritedKeys();

  const togglePermission = (key: string) => {
    setCheckboxState(prev => {
      const current = prev[key];
      if (!current) return prev;
      const isInherited = inheritedKeys.has(key);
      if (current.granted) {
        if (isInherited) {
          return { ...prev, [key]: { ...current, granted: false, excluded: true, inherited: isInherited } };
        }
        return { ...prev, [key]: { ...current, granted: false, excluded: false, inherited: isInherited } };
      } else if (current.excluded) {
        return { ...prev, [key]: { ...current, granted: false, excluded: false, inherited: isInherited } };
      } else {
        return { ...prev, [key]: { ...current, granted: true, excluded: false, inherited: isInherited } };
      }
    });
  };

  const getGroupedPermissions = () => {
    const grouped: Record<string, { action: string; permissions: Permission[]; fields: Record<string, Permission[]> }> = {};

    for (const module of MODULES_ORDER) {
      grouped[module] = { action: '', permissions: [], fields: {} };
    }

    for (const p of allPermissions) {
      if (!grouped[p.module]) {
        grouped[p.module] = { action: '', permissions: [], fields: {} };
      }
      if (p.field) {
        if (!grouped[p.module].fields[p.action]) {
          grouped[p.module].fields[p.action] = [];
        }
        grouped[p.module].fields[p.action].push(p);
      } else {
        grouped[p.module].permissions.push(p);
      }
    }

    return grouped;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError(t('roles.nameRequired'));
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const permissionList = Object.entries(checkboxState)
        .filter(([, state]) => state.granted || state.excluded)
        .map(([key, state]) => {
          const perm = allPermissions.find(p => p.key === key);
          return {
            permissionId: perm!.id,
            excluded: state.excluded,
          };
        });

      if (isNew) {
        const created = await roleService.createRole({
          name: name.trim(),
          description: description.trim() || undefined,
          scope,
          parentRoleId,
        });
        if (created && permissionList.length > 0) {
          await roleService.updateRole(created.id, { permissions: permissionList });
        }
      } else if (role) {
        await roleService.updateRole(role.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          scope,
          parentRoleId,
          permissions: permissionList,
        });
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('roles.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const filteredParentRoles = allRoles.filter(r =>
    r.scope === scope && (!role || r.id !== role.id)
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-400">{t('status.loading', { ns: 'common' })}</p>
      </div>
    );
  }

  const grouped = getGroupedPermissions();
  const uniqueActions = [...new Set(allPermissions.map(p => p.action))].sort(
    (a, b) => ACTIONS_ORDER.indexOf(a) - ACTIONS_ORDER.indexOf(b)
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="btn btn-secondary btn-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-xl font-bold text-slate-300">
            {isNew ? t('roles.createRole') : t('roles.editRole')}
          </h3>
        </div>
        {!isSystemRole && (
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? t('status.saving', { ns: 'common' }) : t('buttons.save', { ns: 'common' })}
          </button>
        )}
      </div>

      {isSystemRole && (
        <div className="mb-4 px-3 py-2 bg-amber-900/30 border border-amber-700/50 rounded text-sm text-amber-300">
          {t('roles.systemRoleReadOnly')}
        </div>
      )}

      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} type="error" onClear={() => setError(null)} showClear={true} />
        </div>
      )}

      <div className="flex-shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm text-slate-400 mb-1">{t('roles.roleName')}</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-white disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder={t('roles.roleNamePlaceholder')}
            disabled={isSystemRole}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">{t('roles.description')}</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-white disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder={t('roles.descriptionPlaceholder')}
            disabled={isSystemRole}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">{t('roles.scope')}</label>
          <select
            value={scope}
            onChange={e => { setScope(e.target.value as any); setParentRoleId(null); }}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-white disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSystemRole}
          >
            <option value="ORGANIZATION">{t('roles.scopeOrganization')}</option>
            <option value="VENUE">{t('roles.scopeVenue')}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">{t('roles.parentRole')}</label>
          <select
            value={parentRoleId || ''}
            onChange={e => setParentRoleId(e.target.value ? Number(e.target.value) : null)}
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-white disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isSystemRole}
          >
            <option value="">{t('roles.noParent')}</option>
            {filteredParentRoles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {parentRoleId && (
        <div className="flex-shrink-0 mb-4 px-3 py-2 bg-blue-900/30 border border-blue-800/50 rounded text-sm text-blue-300">
          {t('roles.inheritanceNote')}
        </div>
      )}

      <div className="flex-grow overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-900 z-10">
            <tr>
              <th className="text-left p-2 text-slate-400 font-medium min-w-[140px]">{t('roles.module')}</th>
              {uniqueActions.map(action => (
                <th key={action} className="p-2 text-center text-slate-400 font-medium min-w-[60px]">
                  {t(`roles.actions.${action}`, action)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MODULES_ORDER.map(module => {
              const group = grouped[module];
              if (!group || (group.permissions.length === 0 && Object.keys(group.fields).length === 0)) return null;
              const moduleLabel = t(`roles.modules.${module}`, module);

              return (
                <React.Fragment key={module}>
                  <tr className="border-t border-slate-700/50">
                    <td className="p-2 font-medium text-slate-300">{moduleLabel}</td>
                    {uniqueActions.map(action => {
                      const perm = group.permissions.find(p => p.action === action);
                      if (!perm) return <td key={action} className="p-2 text-center"><span className="text-slate-600">-</span></td>;

                      const state = checkboxState[perm.key];
                      const isInherited = inheritedKeys.has(perm.key);
                      const hasFields = FIELD_ACTIONS.get(module)?.some(f => group.fields[action]?.length);

                      return (
                        <td key={action} className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => { if (!isSystemRole) togglePermission(perm.key); }}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              state?.granted
                                ? isInherited
                                  ? 'bg-blue-600 border-blue-500'
                                  : 'bg-green-600 border-green-500'
                                : state?.excluded
                                  ? 'bg-red-900/50 border-red-700'
                                  : isSystemRole
                                    ? 'border-slate-700 cursor-not-allowed'
                                    : 'border-slate-600 hover:border-slate-500'
                            }`}
                            title={
                              state?.granted
                                ? isInherited ? t('roles.inherited') : t('roles.granted')
                                : state?.excluded
                                  ? t('roles.excluded')
                                  : t('roles.notGranted')
                            }
                          >
                            {state?.granted && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                            {state?.excluded && (
                              <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                  {Object.entries(group.fields).map(([action, fieldPerms]) =>
                    fieldPerms.map(fp => {
                      const fState = checkboxState[fp.key];
                      return (
                        <tr key={fp.key} className="border-t border-slate-700/30 bg-slate-800/30">
                          <td className="p-2 pl-6 text-slate-400 text-xs italic">
                            {t(`roles.fields.${fp.field}`, fp.field)}
                          </td>
                          {uniqueActions.map(act => (
                            <td key={act} className="p-2 text-center">
                              {act === action ? (
                                <button
                                  type="button"
                                  onClick={() => { if (!isSystemRole) togglePermission(fp.key); }}
                                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                    fState?.granted
                                      ? 'bg-green-600 border-green-500'
                                      : fState?.excluded
                                        ? 'bg-red-900/50 border-red-700'
                                        : isSystemRole
                                          ? 'border-slate-700 cursor-not-allowed'
                                          : 'border-slate-600 hover:border-slate-500'
                                  }`}
                                  title={fp.field || ''}
                                >
                                  {fState?.granted && (
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              ) : (
                                <span className="text-slate-700">-</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex-shrink-0 mt-4 pt-3 border-t border-slate-700 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-600 inline-block"></span> {t('roles.legend.granted')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-600 inline-block"></span> {t('roles.legend.inherited')}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-900/50 border border-red-700 inline-block"></span> {t('roles.legend.excluded')}
        </span>
      </div>
    </div>
  );
};
