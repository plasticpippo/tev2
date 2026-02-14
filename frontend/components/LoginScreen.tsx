import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as userApi from '../services/userService';
import type { User } from '@shared/types';
import { VKeyboardInput } from './VKeyboardInput';
import { useVirtualKeyboard } from './VirtualKeyboardContext';
import LanguageSwitcher from './LanguageSwitcher';

interface LoginScreenProps {
  onLogin: (user: User) => Promise<void> | void;
  assignedTillId: number | null;
  currentTillName: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, assignedTillId, currentTillName }) => {
  const { t } = useTranslation('auth');
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
          setError(t('errors.tillNotConfigured'));
        }
      } else {
        // Till is already configured, proceed with normal login.
        closeKeyboard();
        await onLogin(user);
      }
    } catch (err: any) {
      // Check if it's a network error or server error
      // The backend returns error messages like "Invalid credentials" directly
      const errorMessage = err.message?.toLowerCase() || '';
      if (errorMessage.includes('401') || errorMessage.includes('invalid credentials')) {
        setError(t('errors.invalidCredentials'));
      } else if (errorMessage.includes('400') || errorMessage.includes('missing')) {
        setError(t('errors.missingCredentials'));
      } else if (errorMessage.includes('500') || errorMessage.includes('server')) {
        setError(t('errors.serverError'));
      } else if (err.message) {
        // For other known error messages, use the translated version if available
        // Otherwise fall back to the original message
        setError(t('errors.loginFailed'));
      } else {
        setError(t('errors.loginFailed'));
      }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-sm p-8 bg-slate-800 rounded-lg shadow-xl border border-slate-700 relative">
        {/* Language Switcher in top right corner */}
        <div className="absolute top-4 right-4">
          <LanguageSwitcher />
        </div>
        
        <h2 className="text-center text-3xl font-bold text-amber-400 mb-2">{t('login.title')}</h2>
        <p className="text-center text-slate-400 mb-6">
            {t('login.till')}: <span className={`font-bold ${assignedTillId ? 'text-white' : 'text-red-400'}`}>{currentTillName}</span>
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-400 mb-1">{t('login.username')}</label>
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
            <label className="block text-slate-400 mb-1">{t('login.password')}</label>
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
            {isLoading ? t('login.loggingIn') : t('login.loginButton')}
          </button>
          {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
};