import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings } from '@shared/types';
import { getAuthHeaders } from '../services/apiBase';

interface EmailSettingsProps {
  settings: Settings['email'];
  onUpdate: (emailSettings: Settings['email']) => void;
}

interface ValidationErrors {
  smtpHost?: string;
  smtpPort?: string;
  fromAddress?: string;
  smtpUser?: string;
}

// Debounce hook for input changes
function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]) as T;
}

export const EmailSettings: React.FC<EmailSettingsProps> = ({ settings, onUpdate }) => {
  const { t } = useTranslation('admin');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [passwordModified, setPasswordModified] = useState(false);

  // Local state for immediate input responsiveness (controlled inputs)
  const [localValues, setLocalValues] = useState({
    smtpHost: settings?.smtpHost ?? '',
    smtpPort: settings?.smtpPort ?? 587,
    smtpUser: settings?.smtpUser ?? '',
    smtpPassword: '',
    fromAddress: settings?.fromAddress ?? '',
    fromName: settings?.fromName ?? '',
  });

  // Track enabled and secure separately since they're toggles
  const [enabled, setEnabled] = useState(settings?.enabled ?? false);
  const [smtpSecure, setSmtpSecure] = useState(settings?.smtpSecure ?? true);

  // Memoized email settings for validation and test connection
  const emailSettings: Settings['email'] = useMemo(() => ({
    enabled,
    smtpHost: localValues.smtpHost || null,
    smtpPort: localValues.smtpPort,
    smtpUser: localValues.smtpUser || null,
    smtpPassword: passwordModified ? localValues.smtpPassword : settings?.smtpPassword ?? null,
    fromAddress: localValues.fromAddress || null,
    fromName: localValues.fromName || null,
    smtpSecure,
  }), [enabled, localValues, smtpSecure, passwordModified, settings?.smtpPassword]);

  // Debounced parent update (300ms)
  const debouncedUpdate = useDebouncedCallback((newSettings: Settings['email']) => {
    onUpdate(newSettings);
  }, 300);

  // Sync local state when external settings change (e.g., on initial load)
  useEffect(() => {
    setLocalValues(prev => ({
      ...prev,
      smtpHost: settings?.smtpHost ?? prev.smtpHost,
      smtpPort: settings?.smtpPort ?? prev.smtpPort,
      smtpUser: settings?.smtpUser ?? prev.smtpUser,
      fromAddress: settings?.fromAddress ?? prev.fromAddress,
      fromName: settings?.fromName ?? prev.fromName,
    }));
    setEnabled(settings?.enabled ?? false);
    setSmtpSecure(settings?.smtpSecure ?? true);
  }, [settings]); // Only run when settings object reference changes

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validate = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    if (enabled) {
      if (!localValues.smtpHost.trim()) {
        errors.smtpHost = t('settings.emailSettings.validation.smtpHostRequired');
      }
      if (!localValues.smtpUser.trim()) {
        errors.smtpUser = t('settings.emailSettings.validation.smtpUserRequired');
      }
    }

    if (localValues.smtpPort < 1 || localValues.smtpPort > 65535) {
      errors.smtpPort = t('settings.emailSettings.validation.smtpPortRange');
    }

    if (localValues.fromAddress && !validateEmail(localValues.fromAddress)) {
      errors.fromAddress = t('settings.emailSettings.validation.invalidEmail');
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [enabled, localValues, t, validateEmail]);

  // Immediate input handlers - update local state instantly
  const handleTextChange = useCallback((field: keyof typeof localValues, value: string) => {
    setLocalValues(prev => ({ ...prev, [field]: value }));
    setValidationErrors({});
    setTestResult(null);

    // Debounce the parent update
    debouncedUpdate({
      ...emailSettings,
      [field]: value || null,
    });
  }, [emailSettings, debouncedUpdate]);

  const handleNumberChange = useCallback((field: 'smtpPort', value: string) => {
    const numValue = parseInt(value, 10) || 587;
    setLocalValues(prev => ({ ...prev, [field]: numValue }));
    setValidationErrors({});
    setTestResult(null);

    debouncedUpdate({
      ...emailSettings,
      [field]: numValue,
    });
  }, [emailSettings, debouncedUpdate]);

  const handleToggleChange = useCallback((field: 'enabled' | 'smtpSecure', value: boolean) => {
    if (field === 'enabled') {
      setEnabled(value);
    } else {
      setSmtpSecure(value);
    }
    setValidationErrors({});
    setTestResult(null);

    // Toggles should update immediately (no debounce)
    onUpdate({
      ...emailSettings,
      [field]: value,
    });
  }, [emailSettings, onUpdate]);

  const handlePasswordChange = useCallback((value: string) => {
    setLocalValues(prev => ({ ...prev, smtpPassword: value }));
    setPasswordModified(true);
    setValidationErrors({});
    setTestResult(null);

    debouncedUpdate({
      ...emailSettings,
      smtpPassword: value || null,
    });
  }, [emailSettings, debouncedUpdate]);

  const handleTestConnection = useCallback(async () => {
    if (!validate()) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const payload = {
        ...emailSettings,
        smtpPassword: passwordModified ? localValues.smtpPassword : undefined,
      };

      const response = await fetch('/api/settings/email/test', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        setTestResult({
          success: false,
          message: t('settings.emailSettings.tooManyRequests'),
        });
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: t('settings.emailSettings.testSuccess', { responseTime: data.responseTime || 0 }),
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || data.error || t('settings.emailSettings.testFailed'),
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : t('settings.emailSettings.testFailed'),
      });
    } finally {
      setIsTesting(false);
    }
  }, [validate, emailSettings, passwordModified, localValues.smtpPassword, t]);

  return (
    <div>
      <h3 className="text-xl font-bold text-slate-300 mb-4">{t('settings.emailSettings.title')}</h3>
      <p className="text-slate-400 mb-4">{t('settings.emailSettings.description')}</p>

      <div className="space-y-4 bg-slate-800 p-4 rounded-md">
        {/* Enable Email Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="emailEnabled"
            checked={enabled}
            onChange={(e) => handleToggleChange('enabled', e.target.checked)}
            className="h-5 w-5 rounded text-amber-500 bg-slate-700 border-slate-600 focus:ring-amber-500"
          />
          <label htmlFor="emailEnabled" className="text-slate-300 font-medium">
            {t('settings.emailSettings.enableEmail')}
          </label>
        </div>

        {/* SMTP Host */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            {t('settings.emailSettings.smtpHost')}
          </label>
          <input
            type="text"
            value={localValues.smtpHost}
            onChange={(e) => handleTextChange('smtpHost', e.target.value)}
            placeholder={t('settings.emailSettings.smtpHostPlaceholder')}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
          />
          {validationErrors.smtpHost && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.smtpHost}</p>
          )}
        </div>

        {/* SMTP Port */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            {t('settings.emailSettings.smtpPort')}
          </label>
          <input
            type="number"
            value={localValues.smtpPort}
            onChange={(e) => handleNumberChange('smtpPort', e.target.value)}
            min={1}
            max={65535}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
          />
          {validationErrors.smtpPort && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.smtpPort}</p>
          )}
        </div>

        {/* Use TLS Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="smtpSecure"
            checked={smtpSecure}
            onChange={(e) => handleToggleChange('smtpSecure', e.target.checked)}
            className="h-5 w-5 rounded text-amber-500 bg-slate-700 border-slate-600 focus:ring-amber-500"
          />
          <label htmlFor="smtpSecure" className="text-slate-300 font-medium">
            {t('settings.emailSettings.useTls')}
          </label>
        </div>

        {/* SMTP Username */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            {t('settings.emailSettings.smtpUsername')}
          </label>
          <input
            type="text"
            value={localValues.smtpUser}
            onChange={(e) => handleTextChange('smtpUser', e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
          />
          {validationErrors.smtpUser && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.smtpUser}</p>
          )}
        </div>

        {/* SMTP Password */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            {t('settings.emailSettings.smtpPassword')}
          </label>
          <input
            type="password"
            value={localValues.smtpPassword}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder={settings?.smtpPassword ? t('settings.emailSettings.passwordPlaceholder') : ''}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
          />
          {settings?.smtpPassword && !passwordModified && (
            <p className="text-slate-400 text-sm mt-1">{t('settings.emailSettings.passwordUnchanged')}</p>
          )}
        </div>

        {/* From Email Address */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            {t('settings.emailSettings.fromAddress')}
          </label>
          <input
            type="email"
            value={localValues.fromAddress}
            onChange={(e) => handleTextChange('fromAddress', e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
          />
          {validationErrors.fromAddress && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.fromAddress}</p>
          )}
        </div>

        {/* From Name */}
        <div>
          <label className="block text-slate-300 font-medium mb-2">
            {t('settings.emailSettings.fromName')}
          </label>
          <input
            type="text"
            value={localValues.fromName}
            onChange={(e) => handleTextChange('fromName', e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white focus:ring-amber-500 focus:border-amber-500"
          />
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={
              testResult.success
                ? 'bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-md'
                : 'bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md'
            }
          >
            {testResult.message}
          </div>
        )}

        {/* Test Connection Button */}
        <button
          onClick={handleTestConnection}
          disabled={isTesting}
          className={`w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md transition ${
            isTesting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isTesting ? t('settings.emailSettings.testing') : t('settings.emailSettings.testConnection')}
        </button>
      </div>
    </div>
  );
};
