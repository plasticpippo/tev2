import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { User, Transaction, OrderActivityLog, Settings } from '@shared/types';
import * as userApi from '../services/userService';
import * as transactionApi from '../services/transactionService';
import * as orderApi from '../services/orderService';
import * as settingApi from '../services/settingService';
import { roleService, type UserRoleAssignment, type Role } from '../services/roleService';
import { VKeyboardInput } from './VKeyboardInput';
import ConfirmationModal from './ConfirmationModal';
import { UserPerformanceReportModal } from './UserPerformanceReportModal';
import ErrorMessage from './ErrorMessage';

interface UserModalProps {
  user?: User;
  onClose: () => void;
  onSave: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const { t } = useTranslation('admin');
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Cashier'>(user?.role || 'Cashier');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const removeError = (key: string) => {
    setErrors(prev => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t('users.validation.nameRequired');
    }

    if (!username.trim()) {
      newErrors.username = t('users.validation.usernameRequired');
    }

    if (!user && !password.trim()) {
      newErrors.password = t('users.validation.passwordRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    const userData = {
        id: user?.id,
        name,
        username,
        password: password || undefined,
        role
    };

    setIsSaving(true);
    try {
      await userApi.saveUser(userData);
      onSave();
    } catch (error) {
      console.error('Error saving user:', error);
      const message = error instanceof Error ? error.message : t('users.errors.failedToSave');
      // Check for duplicate username
      if (message.includes('duplicate') || message.includes('already exists') || message.includes('409')) {
        setApiError(t('users.errors.duplicateUsername'));
      } else {
        setApiError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">{user ? t('users.editUser') : t('users.addUser')}</h3>

        {apiError && (
          <div className="mb-4">
            <ErrorMessage message={apiError} type="error" onClear={() => setApiError(null)} showClear={true} />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <VKeyboardInput
              k-type="full"
              type="text"
              placeholder={t('users.fullName')}
              value={name}
              onChange={(e) => { setName(e.target.value); removeError('name'); }}
              className={`w-full p-3 bg-slate-800 border rounded-md ${errors.name ? 'border-red-500' : 'border-slate-700'}`}
              autoFocus
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <VKeyboardInput
              k-type="full"
              type="text"
              placeholder={t('users.username')}
              value={username}
              onChange={(e) => { setUsername(e.target.value); removeError('username'); }}
              className={`w-full p-3 bg-slate-800 border rounded-md ${errors.username ? 'border-red-500' : 'border-slate-700'}`}
            />
            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
          </div>
          <div>
            <VKeyboardInput
              k-type="full"
              type="password"
              placeholder={user ? t('users.newPasswordOptional') : t('users.password')}
              value={password}
              onChange={(e) => { setPassword(e.target.value); removeError('password'); }}
              className={`w-full p-3 bg-slate-800 border rounded-md ${errors.password ? 'border-red-500' : 'border-slate-700'}`}
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
          </div>
          <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md">
            <option value="Cashier">{t('users.roles.cashier')}</option>
            <option value="Admin">{t('users.roles.admin')}</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="btn btn-secondary">{t('buttons.cancel', { ns: 'common' })}</button>
          <button type="submit" disabled={isSaving} className="btn btn-primary">{isSaving ? t('status.saving', { ns: 'common' }) : t('buttons.save', { ns: 'common' })}</button>
        </div>
      </form>
    </div>
  );
};

interface UserRoleModalProps {
  user: User;
  onClose: () => void;
  onUpdated: () => void;
}

const UserRoleModal: React.FC<UserRoleModalProps> = ({ user, onClose, onUpdated }) => {
  const { t } = useTranslation('admin');
  const [assignments, setAssignments] = useState<UserRoleAssignment[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedOrgRoleId, setSelectedOrgRoleId] = useState<number | null>(null);
  const [selectedVenueRoleId, setSelectedVenueRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userAssignments, allRoles] = await Promise.all([
          roleService.getUserRoleAssignments(user.id),
          roleService.getRoles(),
        ]);
        setAssignments(userAssignments);
        setRoles(allRoles);

        const orgAssignment = userAssignments.find((a: UserRoleAssignment) => a.role.scope === 'ORGANIZATION');
        if (orgAssignment) setSelectedOrgRoleId(orgAssignment.roleId);

        const venueAssignment = userAssignments.find((a: UserRoleAssignment) => a.role.scope === 'VENUE');
        if (venueAssignment) setSelectedVenueRoleId(venueAssignment.roleId);
      } catch {
        setError(t('roles.assignmentsFetchFailed'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user.id, t]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      if (selectedOrgRoleId) {
        await roleService.assignRole(user.id, selectedOrgRoleId, null);
      }
      if (selectedVenueRoleId) {
        const activeVenueId = parseInt(localStorage.getItem('activeVenueId') || '1', 10);
        await roleService.assignRole(user.id, selectedVenueRoleId, activeVenueId);
      }
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('roles.assignFailed'));
    } finally {
      setSaving(false);
    }
  };

  const orgRoles = roles.filter(r => r.scope === 'ORGANIZATION');
  const venueRoles = roles.filter(r => r.scope === 'VENUE');

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-slate-900 rounded-lg shadow-xl p-6 border border-slate-700">
          <p className="text-slate-400">{t('status.loading', { ns: 'common' })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">{t('roles.manageUserRoles', { name: user.name })}</h3>

        {error && (
          <div className="mb-4">
            <ErrorMessage message={error} type="error" onClear={() => setError(null)} showClear={true} />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t('roles.orgRole')}</label>
            <select
              value={selectedOrgRoleId || ''}
              onChange={e => setSelectedOrgRoleId(e.target.value ? Number(e.target.value) : null)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md text-white"
            >
              <option value="">{t('roles.noRoleAssigned')}</option>
              {orgRoles.map(r => (
                <option key={r.id} value={r.id}>{r.name}{r.isSystem ? ` (${t('roles.system')})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">{t('roles.venueRole')}</label>
            <select
              value={selectedVenueRoleId || ''}
              onChange={e => setSelectedVenueRoleId(e.target.value ? Number(e.target.value) : null)}
              className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md text-white"
            >
              <option value="">{t('roles.noRoleAssigned')}</option>
              {venueRoles.map(r => (
                <option key={r.id} value={r.id}>{r.name}{r.isSystem ? ` (${t('roles.system')})` : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="btn btn-secondary">{t('buttons.cancel', { ns: 'common' })}</button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? t('status.saving', { ns: 'common' }) : t('buttons.save', { ns: 'common' })}
          </button>
        </div>
      </div>
    </div>
  );
};


interface UserManagementProps {
    users: User[];
    transactions: Transaction[];
    orderActivityLogs: OrderActivityLog[];
    settings: Settings;
    onDataUpdate: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ users, transactions, orderActivityLogs, settings, onDataUpdate }) => {
  const { t } = useTranslation('admin');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [reportingUser, setReportingUser] = useState<User | null>(null);
  const [roleManagingUser, setRoleManagingUser] = useState<User | null>(null);

  const handleSave = () => {
    setIsModalOpen(false);
    setEditingUser(undefined);
    onDataUpdate();
  };

  const confirmDelete = async () => {
    if (deletingUser) {
        await userApi.deleteUser(deletingUser.id);
        setDeletingUser(null);
        onDataUpdate();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-300">{t('users.title')}</h3>
        <button
          onClick={() => { setEditingUser(undefined); setIsModalOpen(true); }}
          className="btn btn-primary"
        >
          {t('users.addUser')}
        </button>
      </div>
      <div className="flex-grow space-y-2 overflow-y-auto pr-2">
        {users.map(user => (
          <div key={user.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-slate-400">{user.username} - <span className="font-semibold text-amber-400">{user.role === 'Admin' ? t('users.roles.admin') : t('users.roles.cashier')}</span></p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setRoleManagingUser(user)}
                    className="btn btn-info btn-sm"
                >
                    {t('roles.manageRoles')}
                </button>
                <button
                    onClick={() => setReportingUser(user)}
                    className="btn btn-success btn-sm"
                >
                    {t('users.report')}
                </button>
                <button
                    onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                    className="btn btn-secondary btn-sm"
                >
                    {t('buttons.edit', { ns: 'common' })}
                </button>
                 <button
                    onClick={() => setDeletingUser(user)}
                    className="btn btn-danger btn-sm"
                >
                    {t('buttons.delete', { ns: 'common' })}
                </button>
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <UserModal
          user={editingUser}
          onClose={() => { setIsModalOpen(false); setEditingUser(undefined); }}
          onSave={handleSave}
        />
      )}
      {roleManagingUser && (
        <UserRoleModal
          user={roleManagingUser}
          onClose={() => setRoleManagingUser(null)}
          onUpdated={onDataUpdate}
        />
      )}
      {reportingUser && (
        <UserPerformanceReportModal
            isOpen={!!reportingUser}
            onClose={() => setReportingUser(null)}
            user={reportingUser}
            transactions={transactions}
            orderActivityLogs={orderActivityLogs}
            settings={settings}
        />
      )}
      <ConfirmationModal
        show={!!deletingUser}
        title={t('confirmation.confirmDelete', { ns: 'common' })}
        message={t('users.confirmDelete', { name: deletingUser?.name })}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
};
