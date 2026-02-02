import React, { useState } from 'react';
import * as userApi from '../services/userService';
import type { User } from '@shared/types';
import { VKeyboardInput } from './VKeyboardInput';
import { useVirtualKeyboard } from './VirtualKeyboardContext';

interface LoginScreenProps {
  onLogin: (user: User) => Promise<void> | void;
  assignedTillId: number | null;
  currentTillName: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, assignedTillId, currentTillName }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { closeKeyboard } = useVirtualKeyboard();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await userApi.login(username, password);

      // New Security Check: If the till is not configured, only an admin can log in.
      if (!assignedTillId) {
        if (user.role === 'Admin') {
          // Admin is allowed to log in to configure the till.
          closeKeyboard();
          await onLogin(user);
        } else {
          // Cashier is blocked from logging into an unconfigured till.
          setError('Login Failed: This terminal is not configured. Please contact an Administrator.');
        }
      } else {
        // Till is already configured, proceed with normal login.
        closeKeyboard();
        await onLogin(user);
      }
    } catch (err: any) {
      // Check if it's a network error or server error
      if (err.message && err.message.includes('401')) {
        setError('Invalid username or password. Please check your credentials and try again.');
      } else if (err.message && err.message.includes('400')) {
        setError('Missing username or password. Please enter both fields.');
      } else if (err.message && (err.message.includes('500') || err.message.includes('server'))) {
        setError('Server error. Please try again later. If the problem persists, contact your system administrator.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials and network connection, then try again.');
      }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm p-8 bg-slate-800 rounded-lg shadow-xl border border-slate-700">
        <h2 className="text-center text-3xl font-bold text-amber-400 mb-2">Bar POS Pro</h2>
        <p className="text-center text-slate-400 mb-6">
            Till: <span className={`font-bold ${assignedTillId ? 'text-white' : 'text-red-400'}`}>{currentTillName}</span>
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-400 mb-1">Username</label>
            <VKeyboardInput
              autoOpenOnMount
              k-type="full"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-slate-900 text-white border border-slate-700 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Password</label>
            <VKeyboardInput
              k-type="full"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-slate-900 text-white border border-slate-700 rounded-md focus:ring-2 focus:ring-amber-500 focus:outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 text-lg rounded-md transition disabled:bg-slate-600 disabled:cursor-wait"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
};