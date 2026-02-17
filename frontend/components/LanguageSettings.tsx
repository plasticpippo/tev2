import React from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';

export const LanguageSettings: React.FC = () => {
  const { t } = useTranslation('admin');

  return (
    <div>
      <h3 className="text-xl font-bold text-slate-300 mb-4">{t('settings.language')}</h3>
      <div>
        <p className="text-slate-400 mb-3">{t('settings.languageDescription')}</p>
        <div className="flex items-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
};
