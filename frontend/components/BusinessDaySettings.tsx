import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings } from '../shared/types';
import ConfirmationModal from './ConfirmationModal';

interface BusinessDaySettingsProps {
  settings: Settings['businessDay'];
  onUpdate: (businessDaySettings: Settings['businessDay']) => void;
}

interface BusinessDayStatus {
  scheduler: {
    isRunning: boolean;
    isClosingInProgress: boolean;
    lastCloseTime: string | null;
    nextScheduledClose: string | null;
  };
  businessDay: {
    autoCloseEnabled: boolean;
    businessDayEndHour: string;
  };
}

export const BusinessDaySettings: React.FC<BusinessDaySettingsProps> = ({ settings, onUpdate }) => {
    const { t } = useTranslation('admin');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [status, setStatus] = useState<BusinessDayStatus | null>(null);
    const [statusLoading, setStatusLoading] = useState(false);

    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = (i % 2) * 30;
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        return `${formattedHour}:${formattedMinute}`;
    });

    useEffect(() => {
        const fetchStatus = async () => {
            setStatusLoading(true);
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/settings/business-day-status', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setStatus(data);
                }
            } catch (error) {
                console.error('Failed to fetch business day status:', error);
            } finally {
                setStatusLoading(false);
            }
        };

        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, []);
    
    const handleManualClose = () => {
        onUpdate({
            ...settings,
            lastManualClose: new Date().toISOString(),
        });
        setIsConfirmModalOpen(false);
    };

    const handleAutoCloseToggle = (enabled: boolean) => {
        onUpdate({
            ...settings,
            autoCloseEnabled: enabled,
        });
    };

    const handleBusinessDayEndHourChange = (hour: string) => {
        onUpdate({
            ...settings,
            businessDayEndHour: hour,
        });
    };

    const formatDateTime = (isoString: string | null) => {
        if (!isoString) return t('settings.never');
        const date = new Date(isoString);
        return date.toLocaleString();
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-300 mb-4">{t('settings.businessDayManagement')}</h3>
            <div className="space-y-4 bg-slate-800 p-4 rounded-md">
                {/* Auto-Start Time */}
                <div>
                    <label htmlFor="auto-start-time" className="font-semibold text-slate-300">{t('settings.autoStartTimeLabel')}</label>
                    <p className="text-xs text-slate-400 mb-2">{t('settings.autoStartTimeDescription')}</p>
                    <select
                        id="auto-start-time"
                        value={settings.autoStartTime}
                        onChange={(e) => onUpdate({ ...settings, autoStartTime: e.target.value })}
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md"
                    >
                        {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                    </select>
                </div>

                {/* Business Day End Hour */}
                <div>
                    <label htmlFor="business-day-end-hour" className="font-semibold text-slate-300">{t('settings.businessDayEndHourLabel')}</label>
                    <p className="text-xs text-slate-400 mb-2">{t('settings.businessDayEndHourDescription')}</p>
                    <select
                        id="business-day-end-hour"
                        value={settings.businessDayEndHour || '06:00'}
                        onChange={(e) => handleBusinessDayEndHourChange(e.target.value)}
                        className="w-full p-3 bg-slate-900 border border-slate-700 rounded-md"
                    >
                        {timeOptions.map(time => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                    </select>
                </div>

                {/* Auto-Close Toggle */}
                <div className="flex items-center justify-between py-3 border-t border-slate-700">
                    <div className="flex-1 pr-4">
                        <label htmlFor="auto-close-enabled" className="font-semibold text-slate-300">{t('settings.autoCloseEnabledLabel')}</label>
                        <p className="text-xs text-slate-400">{t('settings.autoCloseEnabledDescription')}</p>
                    </div>
                    <button
                        id="auto-close-enabled"
                        type="button"
                        role="switch"
                        aria-checked={settings.autoCloseEnabled}
                        onClick={() => handleAutoCloseToggle(!settings.autoCloseEnabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings.autoCloseEnabled ? 'bg-green-600' : 'bg-slate-600'
                        }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                settings.autoCloseEnabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                        />
                    </button>
                </div>

                {/* Current Business Day Status */}
                <div className="border-t border-slate-700 pt-4">
                    <h4 className="font-semibold text-slate-300 mb-3">{t('settings.currentBusinessDayStatus')}</h4>
                    
                    {statusLoading && !status ? (
                        <p className="text-sm text-slate-400">{t('settings.loading')}</p>
                    ) : status ? (
                        <div className="space-y-2">
                            {/* Scheduler Status */}
                            <div className="flex items-center gap-2">
                                <span className={`inline-block w-2 h-2 rounded-full ${
                                    status.scheduler.isRunning ? 'bg-green-500' : 'bg-slate-500'
                                }`} />
                                <span className="text-sm text-slate-300">
                                    {status.scheduler.isRunning 
                                        ? t('settings.schedulerRunning') 
                                        : t('settings.schedulerNotRunning')}
                                </span>
                            </div>

                            {/* Closing in Progress */}
                            {status.scheduler.isClosingInProgress && (
                                <div className="flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-sm text-amber-400">{t('settings.closingInProgress')}</span>
                                </div>
                            )}

                            {/* Last Close Time */}
                            <div className="text-sm">
                                <span className="text-slate-400">{t('settings.lastCloseTime')}: </span>
                                <span className="text-slate-300">{formatDateTime(status.scheduler.lastCloseTime)}</span>
                            </div>

                            {/* Next Scheduled Close */}
                            {status.scheduler.isRunning && status.scheduler.nextScheduledClose && (
                                <div className="text-sm">
                                    <span className="text-slate-400">{t('settings.nextScheduledClose')}: </span>
                                    <span className="text-slate-300">{formatDateTime(status.scheduler.nextScheduledClose)}</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400">{t('settings.statusUnavailable')}</p>
                    )}
                </div>

                {/* Manual Close Button */}
                <div className="border-t border-slate-700 pt-4">
                    <label className="font-semibold text-slate-300">{t('settings.manualDayCloseLabel')}</label>
                    <p className="text-xs text-slate-400 mb-2">{t('settings.manualDayCloseDescription')}</p>
                    <button
                        onClick={() => setIsConfirmModalOpen(true)}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-md transition"
                    >
                        {t('settings.manuallyEndBusinessDay')}
                    </button>
                </div>
            </div>

            <ConfirmationModal
                show={isConfirmModalOpen}
                title={t('settings.confirmManualCloseTitle')}
                message={t('settings.confirmManualCloseMessage')}
                confirmText={t('settings.confirmManualCloseButton')}
                onConfirm={handleManualClose}
                onCancel={() => setIsConfirmModalOpen(false)}
            />
        </div>
    );
};
