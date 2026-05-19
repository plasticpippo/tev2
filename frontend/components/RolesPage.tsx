import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Role } from '../services/roleService';
import { roleService } from '../services/roleService';
import ConfirmationModal from './ConfirmationModal';
import ErrorMessage from './ErrorMessage';

interface RolesPageProps {
  onEditRole: (role: Role) => void;
  onCreateRole: () => void;
}

export const RolesPage: React.FC<RolesPageProps> = ({ onEditRole, onCreateRole }) => {
  const { t } = useTranslation('admin');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await roleService.getRoles();
      setRoles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('roles.fetchFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleEdit = async (role: Role) => {
    try {
      const fullRole = await roleService.getRole(role.id);
      onEditRole(fullRole);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('roles.fetchOneFailed'));
    }
  };

  const handleDuplicate = async (role: Role) => {
    const newName = window.prompt(t('roles.duplicateNamePrompt', { name: role.name }));
    if (!newName || !newName.trim()) return;
    try {
      await roleService.duplicateRole(role.id, { name: newName.trim() });
      fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('roles.duplicateFailed'));
    }
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    try {
      await roleService.deleteRole(deletingRole.id);
      setDeletingRole(null);
      fetchRoles();
    } catch (err) {
      setDeletingRole(null);
      setError(err instanceof Error ? err.message : t('roles.deleteFailed'));
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-400">{t('status.loading', { ns: 'common' })}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-300">{t('roles.title')}</h3>
        <button onClick={onCreateRole} className="btn btn-primary">
          {t('roles.createRole')}
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorMessage message={error} type="error" onClear={() => setError(null)} showClear={true} />
        </div>
      )}

      <div className="flex-grow space-y-2 overflow-y-auto pr-2">
        {roles.length === 0 && (
          <p className="text-slate-400 text-center py-8">{t('roles.noRoles')}</p>
        )}
        {roles.map(role => (
          <div key={role.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{role.name}</p>
                {role.isSystem && (
                  <span className="text-xs bg-amber-600/20 text-amber-400 px-2 py-0.5 rounded">{t('roles.system')}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded ${role.scope === 'ORGANIZATION' ? 'bg-blue-600/20 text-blue-400' : 'bg-green-600/20 text-green-400'}`}>
                  {role.scope === 'ORGANIZATION' ? t('roles.scopeOrganization') : t('roles.scopeVenue')}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {role.description || t('roles.noDescription')}
                {role.parentRole && ` | ${t('roles.inheritsFrom', { name: role.parentRole.name })}`}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('roles.userCount', { count: role._count?.userAssignments ?? 0 })}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              <button onClick={() => handleEdit(role)} className="btn btn-secondary btn-sm">
                {t('buttons.edit', { ns: 'common' })}
              </button>
              {!role.isSystem && (
                <>
                  <button onClick={() => handleDuplicate(role)} className="btn btn-info btn-sm">
                    {t('roles.duplicate')}
                  </button>
                  <button onClick={() => setDeletingRole(role)} className="btn btn-danger btn-sm">
                    {t('buttons.delete', { ns: 'common' })}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        show={!!deletingRole}
        title={t('confirmation.confirmDelete', { ns: 'common' })}
        message={t('roles.confirmDelete', { name: deletingRole?.name })}
        onConfirm={handleDelete}
        onCancel={() => setDeletingRole(null)}
      />
    </div>
  );
};
