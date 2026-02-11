import React, { useState } from 'react';
import type { User, Transaction, OrderActivityLog, Settings } from '@shared/types';
import * as userApi from '../services/userService';
import * as transactionApi from '../services/transactionService';
import * as orderApi from '../services/orderService';
import * as settingApi from '../services/settingService';
import { VKeyboardInput } from './VKeyboardInput';
import ConfirmationModal from './ConfirmationModal';
import { UserPerformanceReportModal } from './UserPerformanceReportModal';

interface UserModalProps {
  user?: User;
  onClose: () => void;
  onSave: () => void;
}

const UserModal: React.FC<UserModalProps> = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'Cashier'>(user?.role || 'Cashier');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim() || (!user && !password.trim())) return;
    
    const userData = {
        id: user?.id,
        name,
        username,
        password: password || undefined,
        role
    };

    await userApi.saveUser(userData);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-amber-400 mb-4">{user ? 'Edit' : 'Add'} User</h3>
        <div className="space-y-4">
          <VKeyboardInput k-type="full" type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md" required autoFocus />
          <VKeyboardInput k-type="full" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md" required />
          <VKeyboardInput k-type="full" type="password" placeholder={user ? "New Password (optional)" : "Password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md" required={!user} />
          <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full p-3 bg-slate-800 border border-slate-700 rounded-md">
            <option value="Cashier">Cashier</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-700">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary">Save</button>
        </div>
      </form>
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [reportingUser, setReportingUser] = useState<User | null>(null);

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
        <h3 className="text-xl font-bold text-slate-300">User Management</h3>
        <button
          onClick={() => { setEditingUser(undefined); setIsModalOpen(true); }}
          className="btn btn-primary"
        >
          Add User
        </button>
      </div>
      <div className="flex-grow space-y-2 overflow-y-auto pr-2">
        {users.map(user => (
          <div key={user.id} className="bg-slate-800 p-4 rounded-md flex justify-between items-center">
            <div>
              <p className="font-semibold">{user.name}</p>
              <p className="text-sm text-slate-400">{user.username} - <span className="font-semibold text-amber-400">{user.role}</span></p>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setReportingUser(user)}
                    className="btn btn-success btn-sm"
                >
                    Report
                </button>
                <button
                    onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                    className="btn btn-secondary btn-sm"
                >
                    Edit
                </button>
                 <button
                    onClick={() => setDeletingUser(user)}
                    className="btn btn-danger btn-sm"
                >
                    Delete
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
        title="Confirm Delete"
        message={`Are you sure you want to delete the user "${deletingUser?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
};