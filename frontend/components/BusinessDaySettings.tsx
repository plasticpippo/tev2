

import React, { useState } from 'react';
import type { Settings } from '../../shared/types';
import { ConfirmationModal } from './ConfirmationModal';

interface BusinessDaySettingsProps {
  settings: Settings['businessDay'];
  onUpdate: (businessDaySettings: Settings['businessDay']) => void;
}

export const BusinessDaySettings: React.FC<BusinessDaySettingsProps> = ({ settings, onUpdate }) => {
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
            <h3 className="text-xl font-bold text-slate-300 mb-4">Business Day Management</h3>
            <div className="space-y-4 bg-slate-800 p-4 rounded-md">
                <div>
                    <label htmlFor="auto-start-time" className="font-semibold text-slate-300">Automatic Start of Business Day</label>
                    <p className="text-xs text-slate-400 mb-2">Set the time a new sales day begins. For a bar closing at 2 AM, a time like 6 AM ensures all sales from the previous night are on the same report.</p>
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
                    <label className="font-semibold text-slate-300">Manual Day Close</label>
                    <p className="text-xs text-slate-400 mb-2">Manually end the current reporting period and start a new one. Useful for separating day/night shifts.</p>
                    <button
                        onClick={() => setIsConfirmModalOpen(true)}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-md transition"
                    >
                        Manually End Business Day
                    </button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                message="Are you sure? This will end the current business day for reporting. All new sales will be part of the next day. This action cannot be undone."
                confirmText="Yes, End Business Day"
                onConfirm={handleManualClose}
                onCancel={() => setIsConfirmModalOpen(false)}
            />
        </div>
    );
};