import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthHeaders } from '../services/apiBase';

interface CloudStatus {
    installed: boolean;
    loggedIn: boolean;
    email: string | null;
}

interface BackupJob {
    id: string;
    type: 'backup' | 'restore';
    status: 'pending' | 'running' | 'success' | 'failed';
    output: string[];
    startedAt: string;
    completedAt?: string;
    error?: string;
}

interface CloudBackup {
    filename: string;
    size: string;
    date: string;
}

interface ScheduleSettings {
    enabled: boolean;
    hour: number;
    compress: boolean;
}

const Spinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const BackupSettings: React.FC = () => {
    const { t } = useTranslation('admin');

    // Section 1: Local Backup
    const [isLocalLoading, setIsLocalLoading] = useState(false);
    const [localBackupType, setLocalBackupType] = useState<'database' | 'full'>('database');
    const [lastLocalBackup, setLastLocalBackup] = useState<string | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [localSuccess, setLocalSuccess] = useState<string | null>(null);

    // Section 1.5: Restore from File
    const [restoreFile, setRestoreFile] = useState<File | null>(null);
    const [restoreFileConfirm, setRestoreFileConfirm] = useState('');
    const [restoreFileJob, setRestoreFileJob] = useState<BackupJob | null>(null);
    const [restoreFileLoading, setRestoreFileLoading] = useState(false);
    const [restoreFileError, setRestoreFileError] = useState<string | null>(null);
    const [restoreFileSuccess, setRestoreFileSuccess] = useState<string | null>(null);

    // Section 2: Cloud Backup Setup
    const [cloudStatus, setCloudStatus] = useState<CloudStatus | null>(null);
    const [cloudStatusLoading, setCloudStatusLoading] = useState(true);
    const [installingMega, setInstallingMega] = useState(false);
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [loginLoading, setLoginLoading] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [setupError, setSetupError] = useState<string | null>(null);
    const [setupSuccess, setSetupSuccess] = useState<string | null>(null);

    // Section 3: Cloud Backup
    const [cloudBackupLoading, setCloudBackupLoading] = useState(false);
    const [cloudBackupJob, setCloudBackupJob] = useState<BackupJob | null>(null);
    const [cloudBackupError, setCloudBackupError] = useState<string | null>(null);
    const [cloudBackupSuccess, setCloudBackupSuccess] = useState<string | null>(null);
    const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
        enabled: false,
        hour: 4,
        compress: false
    });
    const [scheduleSaving, setScheduleSaving] = useState(false);
    const [scheduleError, setScheduleError] = useState<string | null>(null);
    const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);
    const [retention, setRetention] = useState(30);

    // Section 4: Cloud Restore
    const [cloudBackups, setCloudBackups] = useState<CloudBackup[]>([]);
    const [loadingBackups, setLoadingBackups] = useState(false);
    const [restoreBackup, setRestoreBackup] = useState<CloudBackup | null>(null);
    const [restoreConfirm, setRestoreConfirm] = useState('');
    const [restoreDbOnly, setRestoreDbOnly] = useState(false);
    const [restoreJob, setRestoreJob] = useState<BackupJob | null>(null);
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [restoreError, setRestoreError] = useState<string | null>(null);
    const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Fetch initial data
    useEffect(() => {
        fetchCloudStatus();
        fetchScheduleSettings();
        fetchRetention();
    }, []);

    const fetchCloudStatus = async () => {
        setCloudStatusLoading(true);
        try {
            const response = await fetch('/api/backup/cloud/status', {
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch cloud status');
            }

            const data = await response.json();
            setCloudStatus(data);
        } catch (error) {
            console.error('Failed to fetch cloud status:', error);
        } finally {
            setCloudStatusLoading(false);
        }
    };

    const fetchScheduleSettings = async () => {
        try {
            const response = await fetch('/api/backup/schedule', {
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch schedule settings');
            }

            const data = await response.json();
            setScheduleSettings(data);
        } catch (error) {
            console.error('Failed to fetch schedule settings:', error);
        }
    };

    const fetchRetention = async () => {
        try {
            const response = await fetch('/api/backup/settings', {
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!response.ok) return;

            const data = await response.json();
            if (data.cloud?.retention) {
                setRetention(data.cloud.retention);
            }
        } catch { /* ignore */ }
    };

    const pollJobStatus = async (jobId: string, type: 'backup' | 'restore', onComplete?: () => void) => {
        let retries = 0;
        let errorCount = 0;
        const MAX_RETRIES = 150;
        const MAX_ERRORS = 10;

        const poll = async () => {
            if (!isMountedRef.current) return;

            if (retries >= MAX_RETRIES) {
                if (type === 'backup') {
                    setCloudBackupError(t('settings.backup.cloud.backup.failed'));
                } else {
                    setRestoreError(t('settings.backup.cloud.restore.restore.failed'));
                }
                return;
            }
            retries++;

            try {
                const response = await fetch(`/api/backup/cloud/jobs/${jobId}`, {
                    headers: getAuthHeaders(),
                    credentials: 'include',
                });

                if (!isMountedRef.current) return;

                if (!response.ok) {
                    if (errorCount < MAX_ERRORS) {
                        errorCount++;
                        setTimeout(poll, 3000);
                        return;
                    }
                    throw new Error('Failed to fetch job status');
                }

                errorCount = 0;

                const job: BackupJob = await response.json();

                if (type === 'backup') {
                    setCloudBackupJob(job);
                } else {
                    setRestoreJob(job);
                }

                if (job.status === 'success') {
                    if (onComplete) onComplete();
                    if (type === 'backup') {
                        setCloudBackupSuccess(t('settings.backup.cloud.backup.success'));
                    } else {
                        setRestoreSuccess(t('settings.backup.cloud.restore.restore.success'));
                    }
                } else if (job.status === 'failed') {
                    if (type === 'backup') {
                        setCloudBackupError(job.error || t('settings.backup.cloud.backup.failed'));
                    } else {
                        setRestoreError(job.error || t('settings.backup.cloud.restore.restore.failed'));
                    }
                } else {
                    setTimeout(poll, 2000);
                }
            } catch (error) {
                if (!isMountedRef.current) return;
                if (errorCount < MAX_ERRORS) {
                    errorCount++;
                    setTimeout(poll, 3000);
                    return;
                }
                if (type === 'backup') {
                    setCloudBackupError(t('settings.backup.cloud.backup.failed'));
                } else {
                    setRestoreError(t('settings.backup.cloud.restore.restore.failed'));
                }
            }
        };

        poll();
    };

    // Section 1: Local Backup handlers
    const handleLocalBackup = async () => {
        setIsLocalLoading(true);
        setLocalError(null);
        setLocalSuccess(null);

        try {
            const isFull = localBackupType === 'full';
            const endpoint = isFull ? '/api/backup/local/full' : '/api/settings/backup';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!response.ok) {
                let errorMessage = t('settings.backupCreateFailed');
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    // Response might not be JSON, use default message
                }
                throw new Error(errorMessage);
            }

            // Get the blob as a file download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Generate filename with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            a.download = isFull ? `tev2_full_${timestamp}.tar.gz` : `database_backup_${timestamp}.sql`;

            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setLastLocalBackup(new Date().toLocaleString());
            setLocalSuccess(t('settings.backup.backupSuccess'));
        } catch (err) {
            setLocalError(err instanceof Error ? err.message : t('settings.backup.backupFailed'));
        } finally {
            setIsLocalLoading(false);
        }
    };

    const handleRestoreFile = async () => {
        if (!restoreFile) {
            setRestoreFileError(t('settings.backup.restoreFile.noFile'));
            return;
        }
        if (restoreFileConfirm !== 'CONFIRM') {
            return;
        }

        setRestoreFileLoading(true);
        setRestoreFileError(null);
        setRestoreFileSuccess(null);
        setRestoreFileJob(null);

        try {
            const formData = new FormData();
            formData.append('backup', restoreFile);

            const response = await fetch('/api/backup/restore/upload', {
                method: 'POST',
                headers: getAuthHeaders(false),
                credentials: 'include',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('settings.backup.restoreFile.failed'));
            }

            const data = await response.json();
            const jobId = data.jobId;

            setRestoreFileJob({ id: jobId, type: 'restore', status: 'pending', output: [], startedAt: new Date().toISOString() });

            const pollRestoreFile = async (retries = 0, errorCount = 0) => {
                if (!isMountedRef.current) return;

                if (retries >= 150) {
                    setRestoreFileError(t('settings.backup.restoreFile.failed'));
                    setRestoreFileLoading(false);
                    return;
                }
                retries++;

                try {
                    const jobResponse = await fetch(`/api/backup/cloud/jobs/${jobId}`, {
                        headers: getAuthHeaders(),
                        credentials: 'include',
                    });

                    if (!isMountedRef.current) return;

                    if (!jobResponse.ok) {
                        if (errorCount < 10) {
                            setTimeout(() => pollRestoreFile(retries, errorCount + 1), 3000);
                            return;
                        }
                        throw new Error('Failed to fetch job status');
                    }

                    const job: BackupJob = await jobResponse.json();
                    setRestoreFileJob(job);

                    if (job.status === 'success') {
                        setRestoreFileSuccess(t('settings.backup.restoreFile.success'));
                        setRestoreFileLoading(false);
                    } else if (job.status === 'failed') {
                        setRestoreFileError(job.error || t('settings.backup.restoreFile.failed'));
                        setRestoreFileLoading(false);
                    } else {
                        setTimeout(() => pollRestoreFile(retries, 0), 2000);
                    }
                } catch (error) {
                    if (!isMountedRef.current) return;
                    if (errorCount < 10) {
                        setTimeout(() => pollRestoreFile(retries, errorCount + 1), 3000);
                        return;
                    }
                    setRestoreFileError(t('settings.backup.restoreFile.failed'));
                    setRestoreFileLoading(false);
                }
            };

            pollRestoreFile();
        } catch (err) {
            setRestoreFileError(err instanceof Error ? err.message : t('settings.backup.restoreFile.failed'));
            setRestoreFileLoading(false);
        }
    };

    const handleRestoreFileCancel = () => {
        setRestoreFile(null);
        setRestoreFileConfirm('');
        setRestoreFileError(null);
        setRestoreFileSuccess(null);
        setRestoreFileJob(null);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    // Section 2: Cloud Setup handlers
    const handleInstallMega = async () => {
        setInstallingMega(true);
        setSetupError(null);
        setSetupSuccess(null);

        try {
            const response = await fetch('/api/backup/cloud/install', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('settings.backup.cloud.install.failed'));
            }

            const data = await response.json();

            const pollInstall = async (retries = 0) => {
                if (!isMountedRef.current) {
                    setInstallingMega(false);
                    return;
                }
                if (retries >= 30) {
                    setSetupError(t('settings.backup.cloud.install.failed'));
                    setInstallingMega(false);
                    return;
                }
                try {
                    const statusRes = await fetch(`/api/backup/cloud/jobs/${data.jobId}`, {
                        headers: getAuthHeaders(),
                        credentials: 'include',
                    });
                    if (statusRes.ok) {
                        const job = await statusRes.json();
                        if (job.status === 'success') {
                            if (isMountedRef.current) {
                                setSetupSuccess(t('settings.backup.cloud.install.success'));
                                fetchCloudStatus();
                            }
                            setInstallingMega(false);
                            return;
                        } else if (job.status === 'failed') {
                            if (isMountedRef.current) {
                                setSetupError(t('settings.backup.cloud.install.failed'));
                            }
                            setInstallingMega(false);
                            return;
                        }
                    }
                } catch { /* ignore */ }
                setTimeout(() => pollInstall(retries + 1), 2000);
            };

            pollInstall();
        } catch (err) {
            setSetupError(err instanceof Error ? err.message : t('settings.backup.cloud.install.failed'));
            setInstallingMega(false);
        }
    };

    const handleMegaLogin = async () => {
        if (!loginForm.email || !loginForm.password) {
            setSetupError(t('errors.backup.emailAndPasswordRequired'));
            return;
        }

        setLoginLoading(true);
        setSetupError(null);
        setSetupSuccess(null);

        try {
            const response = await fetch('/api/backup/cloud/login', {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(loginForm),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('settings.backup.cloud.login.failed'));
            }

            const data = await response.json();

            // Poll for login completion
            const pollLogin = async (retries = 0) => {
                if (retries >= 30 || !isMountedRef.current) return;
                try {
                    const statusRes = await fetch(`/api/backup/cloud/jobs/${data.jobId}`, {
                        headers: getAuthHeaders(),
                        credentials: 'include',
                    });
                    if (statusRes.ok) {
                        const job = await statusRes.json();
                        if (job.status === 'success') {
                            if (isMountedRef.current) {
                                setSetupSuccess(t('settings.backup.cloud.login.success'));
                                fetchCloudStatus();
                            }
                            return;
                        } else if (job.status === 'failed') {
                            if (isMountedRef.current) {
                                setSetupError(t('settings.backup.cloud.login.failed'));
                            }
                            return;
                        }
                    }
                } catch { /* ignore */ }
                setTimeout(() => pollLogin(retries + 1), 2000);
            };

            pollLogin();
        } catch (err) {
            setSetupError(err instanceof Error ? err.message : t('settings.backup.cloud.login.failed'));
        } finally {
            setLoginLoading(false);
        }
    };

    const handleMegaLogout = async () => {
        setLogoutLoading(true);
        setSetupError(null);
        setSetupSuccess(null);

        try {
            const response = await fetch('/api/backup/cloud/logout', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('settings.backup.cloud.errors.logoutFailed'));
            }

            setSetupSuccess(t('settings.backup.cloud.logout.success'));
            await fetchCloudStatus();
        } catch (err) {
            setSetupError(err instanceof Error ? err.message : t('settings.backup.cloud.errors.logoutFailed'));
        } finally {
            setLogoutLoading(false);
        }
    };

    // Section 3: Cloud Backup handlers
    const handleCloudBackup = async () => {
        if (!cloudStatus?.loggedIn) {
            setCloudBackupError(t('settings.backup.cloud.backup.notLoggedIn'));
            return;
        }

        setCloudBackupLoading(true);
        setCloudBackupError(null);
        setCloudBackupSuccess(null);
        setCloudBackupJob(null);

        try {
            const response = await fetch('/api/backup/cloud', {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ compress: scheduleSettings.compress }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('settings.backup.cloud.backup.failed'));
            }

            const data = await response.json();
            setCloudBackupJob({ id: data.jobId, type: 'backup', status: 'pending', output: [], startedAt: new Date().toISOString() });
            pollJobStatus(data.jobId, 'backup');
        } catch (err) {
            setCloudBackupError(err instanceof Error ? err.message : t('settings.backup.cloud.backup.failed'));
        } finally {
            setCloudBackupLoading(false);
        }
    };

    const handleSaveSchedule = async () => {
        setScheduleSaving(true);
        setScheduleError(null);
        setScheduleSuccess(null);

        try {
            const response = await fetch('/api/backup/settings', {
                method: 'PUT',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ schedule: scheduleSettings, retention }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('settings.backup.cloud.schedule.failed'));
            }

            setScheduleSuccess(t('settings.backup.cloud.schedule.success'));
        } catch (err) {
            setScheduleError(err instanceof Error ? err.message : t('settings.backup.cloud.schedule.failed'));
        } finally {
            setScheduleSaving(false);
        }
    };

    // Section 4: Cloud Restore handlers
    const handleLoadCloudBackups = async () => {
        if (!cloudStatus?.loggedIn) {
            setRestoreError(t('settings.backup.cloud.backup.notLoggedIn'));
            return;
        }

        setLoadingBackups(true);
        setRestoreError(null);

        try {
            const response = await fetch('/api/backup/cloud/list', {
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('settings.backup.cloud.errors.loadBackupsFailed'));
            }

            const data = await response.json();
            setCloudBackups(data.backups);
        } catch (err) {
            setRestoreError(err instanceof Error ? err.message : t('settings.backup.cloud.errors.loadBackupsFailed'));
        } finally {
            setLoadingBackups(false);
        }
    };

    const handleRestoreBackup = async () => {
        if (!restoreBackup) return;

        if (restoreConfirm !== 'CONFIRM') {
            setRestoreError(t('settings.backup.cloud.restore.restore.confirmLabel'));
            return;
        }

        setRestoreLoading(true);
        setRestoreError(null);
        setRestoreSuccess(null);
        setRestoreJob(null);

        try {
            const response = await fetch('/api/backup/cloud/restore', {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    filename: restoreBackup.filename,
                    dbOnly: restoreDbOnly,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || t('settings.backup.cloud.restore.restore.failed'));
            }

            const data = await response.json();
            setRestoreJob({ id: data.jobId, type: 'restore', status: 'pending', output: [], startedAt: new Date().toISOString() });
            pollJobStatus(data.jobId, 'restore', () => {
                setRestoreBackup(null);
                setRestoreConfirm('');
                setRestoreDbOnly(false);
            });
        } catch (err) {
            setRestoreError(err instanceof Error ? err.message : t('settings.backup.cloud.restore.restore.failed'));
        } finally {
            setRestoreLoading(false);
        }
    };

    const renderStatusIndicator = () => {
        if (cloudStatusLoading) {
            return <p className="text-slate-400">{t('settings.backup.cloud.status.loading')}</p>;
        }

        if (!cloudStatus?.installed) {
            return <p className="text-amber-400">{t('settings.backup.cloud.status.notInstalled')}</p>;
        }

        if (!cloudStatus.loggedIn) {
            return <p className="text-amber-400">{t('settings.backup.cloud.status.installedNotLoggedIn')}</p>;
        }

        return <p className="text-green-400">{t('settings.backup.cloud.status.loggedIn', { email: cloudStatus.email })}</p>;
    };

    const renderJobProgress = (job: BackupJob | null) => {
        if (!job) return null;

        const isRunning = job.status === 'running' || job.status === 'pending';
        const isError = job.status === 'failed';
        const isSuccess = job.status === 'success';

        return (
            <div className={`mt-4 p-3 rounded-md ${isError ? 'bg-red-900/30' : isSuccess ? 'bg-green-900/30' : 'bg-slate-700/50'}`}>
                <div className="flex items-center gap-2 mb-2">
                    {isRunning && <Spinner />}
                    <span className={`text-sm ${isError ? 'text-red-400' : isSuccess ? 'text-green-400' : 'text-slate-300'}`}>
                        {t(`settings.backup.cloud.job.status${job.status.charAt(0).toUpperCase() + job.status.slice(1)}`)}
                    </span>
                </div>
                {job.output.length > 0 && (
                    <div className="mt-2 p-2 bg-slate-900/50 rounded max-h-32 overflow-y-auto">
                        <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">{job.output.join('')}</pre>
                    </div>
                )}
                {job.error && (
                    <p className="text-sm text-red-400 mt-2">{job.error}</p>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-300">{t('settings.backup.title')}</h3>

            {/* Section 1: Local Backup */}
            <div className="bg-slate-800 p-4 rounded-md">
                <h4 className="text-lg font-semibold text-slate-300 mb-2">{t('settings.backup.createBackup')}</h4>
                <p className="text-slate-400 mb-3">{t('settings.backup.createBackupDescription')}</p>

                <div className="space-y-2 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="backupType"
                            value="database"
                            checked={localBackupType === 'database'}
                            onChange={(e) => setLocalBackupType(e.target.value as 'database' | 'full')}
                            className="w-4 h-4 text-amber-600 bg-slate-700 border-slate-600 focus:ring-amber-500"
                        />
                        <div>
                            <span className="text-slate-200">{t('settings.backup.backupType.database')}</span>
                            <p className="text-sm text-slate-400">{t('settings.backup.backupType.databaseDescription')}</p>
                        </div>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="radio"
                            name="backupType"
                            value="full"
                            checked={localBackupType === 'full'}
                            onChange={(e) => setLocalBackupType(e.target.value as 'database' | 'full')}
                            className="w-4 h-4 text-amber-600 bg-slate-700 border-slate-600 focus:ring-amber-500"
                        />
                        <div>
                            <span className="text-slate-200">{t('settings.backup.backupType.full')}</span>
                            <p className="text-sm text-slate-400">{t('settings.backup.backupType.fullDescription')}</p>
                        </div>
                    </label>
                </div>

                {localError && (
                    <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md mb-3">
                        {localError}
                    </div>
                )}

                {localSuccess && (
                    <div className="bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-md mb-3">
                        {localSuccess}
                    </div>
                )}

                <button
                    onClick={handleLocalBackup}
                    disabled={isLocalLoading}
                    className={`w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-md transition flex items-center justify-center gap-2 ${
                        isLocalLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {isLocalLoading ? (
                        <>
                            <Spinner />
                            {t('settings.backup.creatingBackup')}
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {t('settings.backup.createBackup')}
                        </>
                    )}
                </button>

                {lastLocalBackup && (
                    <p className="text-sm text-slate-400 mt-3">
                        {t('settings.backup.lastBackup')}: {lastLocalBackup}
                    </p>
                )}
            </div>

            {/* Section 1.5: Restore from File */}
            <div className="bg-slate-800 p-4 rounded-md">
                <h4 className="text-lg font-semibold text-slate-300 mb-2">{t('settings.backup.restoreFile.title')}</h4>
                <p className="text-slate-400 mb-3">{t('settings.backup.restoreFile.description')}</p>

                <div className="bg-amber-900/30 border border-amber-600 text-amber-200 px-4 py-2 rounded-md mb-4">
                    <p className="text-sm">{t('settings.backup.restoreFile.tarGzNote')}</p>
                </div>

                <div className="bg-red-900/30 border border-red-600 text-red-200 px-4 py-2 rounded-md mb-4">
                    <p className="text-sm">{t('settings.backup.restoreFile.warning')}</p>
                </div>

                {restoreFileError && (
                    <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md mb-3">
                        {restoreFileError}
                    </div>
                )}

                {restoreFileSuccess && (
                    <div className="bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-md mb-3">
                        {restoreFileSuccess}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <input
                            type="file"
                            accept=".sql,.sql.gz,.tar.gz"
                            onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setRestoreFile(file);
                                setRestoreFileConfirm('');
                            }}
                            className="hidden"
                            id="restore-file-input"
                        />
                        <button
                            onClick={() => document.getElementById('restore-file-input')?.click()}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-md transition"
                        >
                            {t('settings.backup.restoreFile.selectFile')}
                        </button>
                    </div>

                    {restoreFile && (
                        <p className="text-sm text-slate-300">
                            {t('settings.backup.restoreFile.selectedFile', {
                                filename: restoreFile.name,
                                size: formatFileSize(restoreFile.size)
                            })}
                        </p>
                    )}

                    {restoreFile && !restoreFileJob && (
                        <div>
                            <label className="block text-sm text-slate-300 mb-1">{t('settings.backup.restoreFile.confirmLabel')}</label>
                            <input
                                type="text"
                                value={restoreFileConfirm}
                                onChange={(e) => setRestoreFileConfirm(e.target.value)}
                                placeholder={t('settings.backup.restoreFile.confirmPlaceholder')}
                                className="w-full bg-slate-900 border border-slate-600 text-white px-3 py-2 rounded-md focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    )}

                    {renderJobProgress(restoreFileJob)}

                    {restoreFile && !restoreFileJob && (
                        <div className="flex gap-3">
                            <button
                                onClick={handleRestoreFile}
                                disabled={restoreFileConfirm !== 'CONFIRM' || restoreFileLoading}
                                className="flex-1 bg-red-600 hover:bg-red-500 disabled:bg-red-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md transition flex items-center justify-center gap-2"
                            >
                                {restoreFileLoading ? (
                                    <>
                                        <Spinner />
                                        {t('settings.backup.restoreFile.restoring')}
                                    </>
                                ) : (
                                    t('settings.backup.restoreFile.restoreButton')
                                )}
                            </button>
                            <button
                                onClick={handleRestoreFileCancel}
                                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-4 rounded-md transition"
                            >
                                {t('settings.backup.restoreFile.cancelButton')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Section 2: Cloud Backup Setup */}
            <div className="bg-slate-800 p-4 rounded-md">
                <h4 className="text-lg font-semibold text-slate-300 mb-2">{t('settings.backup.cloud.setupTitle')}</h4>
                <p className="text-slate-400 mb-3">{t('settings.backup.cloud.setupDescription')}</p>

                {renderStatusIndicator()}

                {setupError && (
                    <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md mt-3">
                        {setupError}
                    </div>
                )}

                {setupSuccess && (
                    <div className="bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-md mt-3">
                        {setupSuccess}
                    </div>
                )}

                {!cloudStatusLoading && !cloudStatus?.installed && (
                    <div className="mt-4">
                        <p className="text-sm text-slate-400 mb-2">{t('settings.backup.cloud.install.description')}</p>
                        <button
                            onClick={handleInstallMega}
                            disabled={installingMega}
                            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {installingMega ? (
                                <>
                                    <Spinner />
                                    {t('settings.backup.cloud.install.installing')}
                                </>
                            ) : (
                                t('settings.backup.cloud.install.button')
                            )}
                        </button>
                    </div>
                )}

                {!cloudStatusLoading && cloudStatus?.installed && !cloudStatus.loggedIn && (
                    <div className="mt-4 space-y-3">
                        <div>
                            <label className="block text-sm text-slate-300 mb-1">{t('settings.backup.cloud.login.email')}</label>
                            <input
                                type="email"
                                value={loginForm.email}
                                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                                placeholder={t('settings.backup.cloud.login.emailPlaceholder')}
                                className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded-md border border-slate-600 focus:border-amber-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-slate-300 mb-1">{t('settings.backup.cloud.login.password')}</label>
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                                placeholder={t('settings.backup.cloud.login.passwordPlaceholder')}
                                className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded-md border border-slate-600 focus:border-amber-500 focus:outline-none"
                            />
                        </div>
                        <button
                            onClick={handleMegaLogin}
                            disabled={loginLoading}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loginLoading ? (
                                <>
                                    <Spinner />
                                    {t('settings.backup.cloud.login.loggingIn')}
                                </>
                            ) : (
                                t('settings.backup.cloud.login.button')
                            )}
                        </button>
                    </div>
                )}

                {!cloudStatusLoading && cloudStatus?.loggedIn && (
                    <div className="mt-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-slate-300">{t('settings.backup.cloud.usage.title')}</p>
                            <p className="text-sm text-slate-400">{cloudStatus.email}</p>
                        </div>
                        <button
                            onClick={handleMegaLogout}
                            disabled={logoutLoading}
                            className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {logoutLoading ? (
                                <>
                                    <Spinner />
                                    {t('settings.backup.cloud.logout.loggingOut')}
                                </>
                            ) : (
                                t('settings.backup.cloud.logout.button')
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Section 3: Cloud Backup */}
            <div className="bg-slate-800 p-4 rounded-md">
                <h4 className="text-lg font-semibold text-slate-300 mb-2">{t('settings.backup.cloud.backup.title')}</h4>
                <p className="text-slate-400 mb-3">{t('settings.backup.cloud.backup.description')}</p>

                {cloudBackupError && (
                    <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md mb-3">
                        {cloudBackupError}
                    </div>
                )}

                {cloudBackupSuccess && (
                    <div className="bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-md mb-3">
                        {cloudBackupSuccess}
                    </div>
                )}

                <button
                    onClick={handleCloudBackup}
                    disabled={!cloudStatus?.loggedIn || cloudBackupLoading || cloudBackupJob?.status === 'running'}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {cloudBackupLoading || cloudBackupJob?.status === 'running' ? (
                        <>
                            <Spinner />
                            {t('settings.backup.cloud.backup.backingUp')}
                        </>
                    ) : (
                        t('settings.backup.cloud.backup.button')
                    )}
                </button>

                {renderJobProgress(cloudBackupJob)}

                {/* Schedule Settings */}
                <div className="mt-6 pt-4 border-t border-slate-700">
                    <h5 className="text-md font-semibold text-slate-300 mb-3">{t('settings.backup.cloud.schedule.title')}</h5>
                    <p className="text-slate-400 mb-4">{t('settings.backup.cloud.schedule.description')}</p>

                    {scheduleError && (
                        <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md mb-3">
                            {scheduleError}
                        </div>
                    )}

                    {scheduleSuccess && (
                        <div className="bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-md mb-3">
                            {scheduleSuccess}
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="schedule-enabled"
                                checked={scheduleSettings.enabled}
                                onChange={(e) => setScheduleSettings({ ...scheduleSettings, enabled: e.target.checked })}
                                className="w-4 h-4 text-amber-600 bg-slate-700 border-slate-600 rounded focus:ring-amber-500 focus:ring-2"
                            />
                            <label htmlFor="schedule-enabled" className="text-slate-300">
                                {t('settings.backup.cloud.schedule.enabled')}
                            </label>
                        </div>

                        <div>
                            <label htmlFor="schedule-hour" className="block text-sm text-slate-300 mb-1">
                                {t('settings.backup.cloud.schedule.hour')}
                            </label>
                            <select
                                id="schedule-hour"
                                value={scheduleSettings.hour}
                                onChange={(e) => setScheduleSettings({ ...scheduleSettings, hour: parseInt(e.target.value) })}
                                className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded-md border border-slate-600 focus:border-amber-500 focus:outline-none"
                            >
                                {Array.from({ length: 24 }, (_, i) => (
                                    <option key={i} value={i}>{i}:00</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="schedule-compress"
                                checked={scheduleSettings.compress}
                                onChange={(e) => setScheduleSettings({ ...scheduleSettings, compress: e.target.checked })}
                                className="w-4 h-4 text-amber-600 bg-slate-700 border-slate-600 rounded focus:ring-amber-500 focus:ring-2"
                            />
                            <label htmlFor="schedule-compress" className="text-slate-300">
                                {t('settings.backup.cloud.schedule.compress')}
                            </label>
                        </div>

                        <div>
                            <label htmlFor="retention" className="block text-sm text-slate-300 mb-1">
                                {t('settings.backup.cloud.retention.label')}
                            </label>
                            <input
                                type="number"
                                id="retention"
                                min={1}
                                max={365}
                                value={retention}
                                onChange={(e) => setRetention(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded-md border border-slate-600 focus:border-amber-500 focus:outline-none"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                {t('settings.backup.cloud.retention.description')}
                            </p>
                        </div>

                        <button
                            onClick={handleSaveSchedule}
                            disabled={scheduleSaving}
                            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {scheduleSaving ? (
                                <>
                                    <Spinner />
                                    {t('settings.backup.cloud.schedule.saving')}
                                </>
                            ) : (
                                t('settings.backup.cloud.schedule.save')
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Section 4: Cloud Restore */}
            <div className="bg-slate-800 p-4 rounded-md">
                <h4 className="text-lg font-semibold text-slate-300 mb-2">{t('settings.backup.cloud.restore.title')}</h4>
                <p className="text-slate-400 mb-3">{t('settings.backup.cloud.restore.description')}</p>

                {restoreError && (
                    <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md mb-3">
                        {restoreError}
                    </div>
                )}

                {restoreSuccess && (
                    <div className="bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-md mb-3">
                        {restoreSuccess}
                    </div>
                )}

                <button
                    onClick={handleLoadCloudBackups}
                    disabled={!cloudStatus?.loggedIn || loadingBackups}
                    className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loadingBackups ? (
                        <>
                            <Spinner />
                            {t('settings.backup.cloud.restore.loading')}
                        </>
                    ) : (
                        t('settings.backup.cloud.restore.loadButton')
                    )}
                </button>

                {cloudBackups.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-700">
                                    <th className="py-2 px-3 text-slate-300">{t('settings.backup.cloud.restore.table.filename')}</th>
                                    <th className="py-2 px-3 text-slate-300">{t('settings.backup.cloud.restore.table.date')}</th>
                                    <th className="py-2 px-3 text-slate-300">{t('settings.backup.cloud.restore.table.size')}</th>
                                    <th className="py-2 px-3 text-slate-300">{t('settings.backup.cloud.restore.table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cloudBackups.map((backup) => (
                                    <tr key={backup.filename} className="border-b border-slate-700/50">
                                        <td className="py-2 px-3 text-slate-300">{backup.filename}</td>
                                        <td className="py-2 px-3 text-slate-400">{backup.date}</td>
                                        <td className="py-2 px-3 text-slate-400">{backup.size}</td>
                                        <td className="py-2 px-3">
                                            <button
                                                onClick={() => setRestoreBackup(backup)}
                                                disabled={restoreLoading || restoreJob?.status === 'running'}
                                                className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-1 px-3 rounded-md text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {t('settings.backup.cloud.restore.restore.button')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {cloudBackups.length === 0 && !loadingBackups && (
                    <p className="text-slate-400 mt-4">{t('settings.backup.cloud.restore.noBackups')}</p>
                )}

                {restoreBackup && (
                    <div className="mt-4 p-4 bg-slate-700/50 rounded-md border border-slate-600">
                        <h5 className="text-md font-semibold text-slate-300 mb-2">{t('settings.backup.cloud.restore.restore.dialogTitle')}</h5>
                        <p className="text-sm text-slate-400 mb-4 whitespace-pre-line">
                            {t('settings.backup.cloud.restore.restore.dialogDescription', {
                                filename: restoreBackup.filename,
                                date: restoreBackup.date,
                                size: restoreBackup.size,
                            })}
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm text-slate-300 mb-2">
                                {t('settings.backup.cloud.restore.restore.full')}
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="restore-type"
                                        checked={!restoreDbOnly}
                                        onChange={() => setRestoreDbOnly(false)}
                                        className="w-4 h-4 text-amber-600 bg-slate-700 border-slate-600"
                                    />
                                    <span className="text-slate-300">{t('settings.backup.cloud.restore.restore.full')}</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="restore-type"
                                        checked={restoreDbOnly}
                                        onChange={() => setRestoreDbOnly(true)}
                                        className="w-4 h-4 text-amber-600 bg-slate-700 border-slate-600"
                                    />
                                    <span className="text-slate-300">{t('settings.backup.cloud.restore.restore.dbOnly')}</span>
                                </label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm text-slate-300 mb-1">
                                {t('settings.backup.cloud.restore.restore.confirmLabel')}
                            </label>
                            <input
                                type="text"
                                value={restoreConfirm}
                                onChange={(e) => setRestoreConfirm(e.target.value)}
                                placeholder={t('settings.backup.cloud.restore.restore.confirmPlaceholder')}
                                className="w-full bg-slate-700 text-slate-200 px-3 py-2 rounded-md border border-slate-600 focus:border-amber-500 focus:outline-none"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleRestoreBackup}
                                disabled={restoreLoading || restoreJob?.status === 'running' || restoreConfirm !== 'CONFIRM'}
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-md transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {restoreLoading || restoreJob?.status === 'running' ? (
                                    <>
                                        <Spinner />
                                        {t('settings.backup.cloud.restore.restore.restoring')}
                                    </>
                                ) : (
                                    t('settings.backup.cloud.restore.restore.confirmButton')
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setRestoreBackup(null);
                                    setRestoreConfirm('');
                                    setRestoreDbOnly(false);
                                }}
                                disabled={restoreLoading || restoreJob?.status === 'running'}
                                className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 rounded-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('settings.backup.cloud.restore.restore.cancelButton')}
                            </button>
                        </div>

                        {renderJobProgress(restoreJob)}
                    </div>
                )}
            </div>
        </div>
    );
};
