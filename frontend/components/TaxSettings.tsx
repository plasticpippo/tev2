import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Settings } from '@shared/types';
import TaxRateManagement from './TaxRateManagement';

interface TaxSettingsProps {
  settings: Settings['tax'];
  onUpdate: (taxSettings: Settings['tax']) => void;
}

export const TaxSettings: React.FC<TaxSettingsProps> = ({ settings, onUpdate }) => {
  const { t } = useTranslation('admin');
  
  const handleModeChange = (mode: Settings['tax']['mode']) => {
    onUpdate({ ...settings, mode });
  };

  return (
    <div>
        <h3 className="text-xl font-bold text-slate-300 mb-4">{t('settings.tax')}</h3>
        <div>
            <p className="text-slate-400 mb-3">{t('settings.howToHandleTaxes')}</p>
            <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700">
                    <input
                        type="radio"
                        name="taxMode"
                        value="exclusive"
                        checked={settings.mode === 'exclusive'}
                        onChange={() => handleModeChange('exclusive')}
                        className="h-5 w-5 rounded-full text-amber-500 bg-slate-700 border-slate-600 focus:ring-amber-500"
                    />
                    <div>
                        <span className="font-semibold">{t('settings.taxModes.exclusive')}</span>
                        <p className="text-xs text-slate-400">{t('settings.taxModeDescriptions.exclusive')}</p>
                    </div>
                </label>
                 <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700">
                    <input
                        type="radio"
                        name="taxMode"
                        value="inclusive"
                        checked={settings.mode === 'inclusive'}
                        onChange={() => handleModeChange('inclusive')}
                        className="h-5 w-5 rounded-full text-amber-500 bg-slate-700 border-slate-600 focus:ring-amber-500"
                    />
                    <div>
                        <span className="font-semibold">{t('settings.taxModes.inclusive')}</span>
                        <p className="text-xs text-slate-400">{t('settings.taxModeDescriptions.inclusive')}</p>
                    </div>
                </label>
                 <label className="flex items-center gap-3 p-4 bg-slate-800 rounded-md cursor-pointer hover:bg-slate-700">
                    <input
                        type="radio"
                        name="taxMode"
                        value="none"
                        checked={settings.mode === 'none'}
                        onChange={() => handleModeChange('none')}
                        className="h-5 w-5 rounded-full text-amber-500 bg-slate-700 border-slate-600 focus:ring-amber-500"
                    />
                     <div>
                        <span className="font-semibold">{t('settings.taxModes.none')}</span>
                        <p className="text-xs text-slate-400">{t('settings.taxModeDescriptions.none')}</p>
                    </div>
                </label>
            </div>
        </div>
        {settings.mode !== 'none' && (
            <div className="mt-8">
                <TaxRateManagement />
            </div>
        )}
    </div>
  );
};