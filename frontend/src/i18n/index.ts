import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';

// Supported languages
export const supportedLanguages = ['en', 'it'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

// Default/fallback language
export const fallbackLanguage: SupportedLanguage = 'en';

// i18next configuration
i18n
  // Detect user language
  .use(LanguageDetector)
  // Use react-i18next bindings
  .use(initReactI18next)
  // Lazy load translations from public/locales/{language}/{namespace}.json
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../../public/locales/${language}/${namespace}.json`)
    )
  )
  // Initialize i18next
  .init({
    // Fallback language when a translation is missing
    fallbackLng: fallbackLanguage,
    
    // Supported languages
    supportedLngs: [...supportedLanguages],
    
    // Debug mode only in development
    debug: import.meta.env.DEV,
    
    // Interpolation configuration
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },
    
    // Language detection configuration
    detection: {
      // Order of language detection methods
      order: ['localStorage', 'navigator', 'htmlTag'],
      
      // Keys for storing user preference
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    
    // Default namespace
    ns: ['common'],
    defaultNS: 'common',
    
    // Load all languages
    load: 'languageOnly',
    
    // React configuration
    react: {
      // Wait for all translations before rendering
      useSuspense: true,
    },
  });

export default i18n;
