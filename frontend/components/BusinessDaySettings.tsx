

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings } from '@shared/types';
import ConfirmationModal from './ConfirmationModal';

interface BusinessDaySettingsProps {
  settings: Settings['businessDay'];
  onUpdate: (businessDaySettings: Settings['businessDay']) => void;
}

export const BusinessDaySettings: React.FC<BusinessDaySettingsProps> = ({ settings, onUpdate }) => {
    const { t } = useTranslation('admin');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = (i % 2) * 30;
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        return `${formattedHour}:${formattedMinute}`;
    });
    
    const handleManualClose = () => {
        onUpdate({
            ...settings,
            lastManualClose: new Date().toISOString(),
        });
        setIsConfirmModalOpen(false);
    };

    return (
        <div>
            <h3 className="text-xl font-bold text-slate-300 mb-4">{t('settings.businessDayManagement')}</h3>
            <div className="space-y-4 bg-slate-800 p-4 rounded-md">
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
                 <div>
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