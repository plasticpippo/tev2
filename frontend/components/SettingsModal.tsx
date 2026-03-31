

import React, { useState } from 'react';
import type { Settings } from '@shared/types';
import { LanguageSettings } from './LanguageSettings';
import { TaxSettings } from './TaxSettings';
import { BusinessDaySettings } from './BusinessDaySettings';
import { BackupSettings } from './BackupSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdate: (settings: Settings) => void;
}

type SettingsTab = 'language' | 'tax' | 'businessDay' | 'backup';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdate }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('language');
    
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

    const tabs: { id: SettingsTab; label: string }[] = [
        { id: 'language', label: 'Language' },
        { id: 'tax', label: 'Tax Settings' },
        { id: 'businessDay', label: 'Business Day' },
        { id: 'backup', label: 'Backup' },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'language':
                return <LanguageSettings />;
            case 'tax':
                return <TaxSettings settings={settings.tax} onUpdate={handleTaxUpdate} />;
            case 'businessDay':
                return <BusinessDaySettings settings={settings.businessDay} onUpdate={handleBusinessDayUpdate} />;
            case 'backup':
                return <BackupSettings />;
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Tab Navigation */}
            <div className="flex border-b border-slate-700 mb-6">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
className={`px-6 py-3 min-h-11 font-semibold transition border-b-2 ${
activeTab === tab.id
? 'border-amber-500 text-amber-400'
: 'border-transparent text-slate-400 hover:text-slate-200'
}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            
            {/* Tab Content */}
            <div className="flex-grow overflow-y-auto">
                {renderTabContent()}
            </div>
        </div>
    );
};