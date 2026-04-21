

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings } from '@shared/types';
import { LanguageSettings } from './LanguageSettings';
import { TaxSettings } from './TaxSettings';
import { BusinessDaySettings } from './BusinessDaySettings';
import { BusinessInfoSettings } from './BusinessInfoSettings';
import { BackupSettings } from './BackupSettings';
import { EmailSettings } from './EmailSettings';
import { ReceiptSettings } from './ReceiptSettings';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdate: (settings: Settings) => void;
}

type SettingsTab = 'language' | 'tax' | 'businessDay' | 'businessInfo' | 'backup' | 'email' | 'receipt';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onUpdate }) => {
    const { t } = useTranslation('admin');
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

  const handleEmailUpdate = (emailSettings: Settings['email']) => {
    onUpdate({ ...settings, email: emailSettings });
  };

  const handleReceiptUpdate = (receiptSettings: Settings['receiptFromPaymentModal']) => {
    onUpdate({ ...settings, receiptFromPaymentModal: receiptSettings });
  };

  const handleBusinessInfoUpdate = (businessInfoSettings: Settings['business']) => {
    onUpdate({ ...settings, business: businessInfoSettings });
  };

    if (!isOpen) {
        return null;
    }

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'language', label: t('settings.tabs.language') },
    { id: 'tax', label: t('settings.tabs.tax') },
    { id: 'businessDay', label: t('settings.tabs.businessDay') },
    { id: 'businessInfo', label: t('settings.tabs.businessInfo') },
    { id: 'backup', label: t('settings.tabs.backup') },
    { id: 'email', label: t('settings.tabs.email') },
    { id: 'receipt', label: t('settings.tabs.receipt') },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'language':
        return <LanguageSettings />;
      case 'tax':
        return <TaxSettings settings={settings.tax} onUpdate={handleTaxUpdate} />;
      case 'businessDay':
        return <BusinessDaySettings settings={settings.businessDay} onUpdate={handleBusinessDayUpdate} />;
      case 'businessInfo':
        return <BusinessInfoSettings settings={settings.business ?? {}} onUpdate={handleBusinessInfoUpdate} />;
      case 'backup':
        return <BackupSettings />;
      case 'email':
        return <EmailSettings settings={settings.email} onUpdate={handleEmailUpdate} />;
      case 'receipt':
        return <ReceiptSettings settings={settings.receiptFromPaymentModal} onUpdate={handleReceiptUpdate} />;
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