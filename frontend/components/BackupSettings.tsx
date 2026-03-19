import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuthHeaders } from '../services/apiBase';

export const BackupSettings: React.FC = () => {
    const { t } = useTranslation('admin');
    const [isLoading, setIsLoading] = useState(false);
    const [lastBackup, setLastBackup] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleBackup = async () => {
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch('/api/settings/backup', {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
            });

            if (!response.ok) {
                let errorMessage = 'Failed to create backup';
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
            a.download = `database_backup_${timestamp}.sql`;
            
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            setLastBackup(new Date().toLocaleString());
            setSuccess(t('settings.backupSuccess'));
        } catch (err) {
            setError(err instanceof Error ? err.message : t('settings.backupFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-300 mb-4">{t('settings.backup')}</h3>
            <div className="space-y-4 bg-slate-800 p-4 rounded-md">
                <p className="text-slate-400 mb-3">{t('settings.backupDescription')}</p>
                
                {error && (
                    <div className="bg-red-900/50 border border-red-600 text-red-200 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}
                
                {success && (
                    <div className="bg-green-900/50 border border-green-600 text-green-200 px-4 py-3 rounded-md">
                        {success}
                    </div>
                )}

                <button
                    onClick={handleBackup}
                    disabled={isLoading}
                    className={`w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-md transition flex items-center justify-center gap-2 ${
                        isLoading ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {t('settings.creatingBackup')}
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {t('settings.createBackup')}
                        </>
                    )}
                </button>

                {lastBackup && (
                    <p className="text-sm text-slate-400">
                        {t('settings.lastBackup')}: {lastBackup}
                    </p>
                )}
            </div>
        </div>
    );
};
