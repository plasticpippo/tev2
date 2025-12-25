

import React from 'react';
import type { Settings } from '@shared/types';
import { TaxSettings } from './TaxSettings';
import { BusinessDaySettings } from './BusinessDaySettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdate: (settings: Settings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdate }) => {
    
    // In a real app, this modal would be triggered by a button and appear as an overlay.
    // For this admin panel integration, it's displayed directly on the page.
    // The `isOpen` and `onClose` props are kept for potential future refactoring.

    const handleTaxUpdate = (taxSettings: Settings['tax']) => {
        onUpdate({ ...settings, tax: taxSettings });
    };

    const handleBusinessDayUpdate = (businessDaySettings: Settings['businessDay']) => {
        onUpdate({ ...settings, businessDay: businessDaySettings });
    }

    if (!isOpen) {
        return null;
    }

    return (
        <div className="space-y-8">
            <TaxSettings settings={settings.tax} onUpdate={handleTaxUpdate} />
            <BusinessDaySettings settings={settings.businessDay} onUpdate={handleBusinessDayUpdate} />
        </div>
    );
};