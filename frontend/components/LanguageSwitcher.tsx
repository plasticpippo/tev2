import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, type SupportedLanguage } from '../src/i18n';

const languageNames: Record<SupportedLanguage, { name: string; flag: string }> = {
  en: { name: 'English', flag: 'EN' },
  it: { name: 'Italiano', flag: 'IT' },
};

export const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = i18n.language as SupportedLanguage;
  const currentLangInfo = languageNames[currentLanguage] || languageNames.en;

  const changeLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
        aria-label={t('common.languageSwitcher.changeLanguage')}
      >
        <span className="font-bold text-xs">{currentLangInfo.flag}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 bg-slate-700 rounded-md shadow-lg border border-slate-600 overflow-hidden z-50">
          {supportedLanguages.map((lang) => {
            const langInfo = languageNames[lang];
            const isActive = lang === currentLanguage;

            return (
              <button
                key={lang}
                onClick={() => changeLanguage(lang)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${
                  isActive
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-300 hover:bg-slate-600 hover:text-white'
                }`}
              >
                <span className="font-bold text-xs w-6">{langInfo.flag}</span>
                <span>{langInfo.name}</span>
                {isActive && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
