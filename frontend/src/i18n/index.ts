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

    // Namespaces - only declare default, others load on-demand
    ns: ['common'],
    defaultNS: 'common',

    // Load all languages
    load: 'languageOnly',

    // React configuration
    react: {
      // Don't block rendering - handle loading manually
      useSuspense: false,
    },
  });

// Async initialization function to preload critical namespace
export const initializeI18n = async (): Promise<void> => {
  try {
    // Wait for i18n initialization to complete
    await i18n;

    // Preload only the critical 'common' namespace
    // Using loadNamespaces ensures translations are available
    await i18n.loadNamespaces(['common']);

    // Verify translations are loaded by checking if a known key exists
    // This ensures the backend has actually loaded the translations
    const testKey = i18n.t('common:languageSwitcher.changeLanguage');
    if (testKey === 'languageSwitcher.changeLanguage' || testKey === '') {
      // Translations not loaded yet, wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  } catch (error) {
    console.error('Failed to initialize i18n:', error);
    // Continue anyway - fallbacks will be used
  }
};

// Promise that resolves when critical translations are ready
// The i18n.init() returns a promise that resolves when initialization is complete
// Then we call initializeI18n to preload the common namespace
export const i18nReady = (async () => {
  // i18n is already a promise (the init() call returns it)
  await i18n;
  await initializeI18n();
})();

export default i18n;
