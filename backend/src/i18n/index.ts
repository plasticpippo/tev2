import i18n from 'i18next';
import Backend from 'i18next-fs-backend';
import { LanguageDetector } from 'i18next-http-middleware';

// Supported languages
export const supportedLanguages = ['en', 'it'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

// Default/fallback language
export const fallbackLanguage: SupportedLanguage = 'en';

/**
 * Initialize i18next for the backend (Express.js)
 * Uses file system backend for loading translations
 * Detects language from Accept-Language header
 */
export const initI18n = async (): Promise<void> => {
  await i18n
    .use(Backend)
    .use(LanguageDetector)
    .init({
      // Fallback language when a translation is missing
      fallbackLng: fallbackLanguage,
      
      // Supported languages
      supportedLngs: [...supportedLanguages],
      
      // Preload all supported languages
      preload: [...supportedLanguages],
      
      // Debug mode only in development
      debug: process.env.NODE_ENV === 'development',
      
      // Interpolation configuration
      interpolation: {
        // Escape values for security
        escapeValue: true,
      },
      
      // Backend configuration for file system
      backend: {
        // Path to load translations from
        loadPath: `${__dirname}/../../locales/{{lng}}/{{ns}}.json`,
        
        // Add extension automatically
        addPath: `${__dirname}/../../locales/{{lng}}/{{ns}}.missing.json`,
      },
      
      // Default namespace and additional namespaces
      ns: ['common', 'errors', 'api'],
      defaultNS: 'common',
      
      // Load all languages
      load: 'languageOnly',
      
      // Language detection configuration
      detection: {
        // Order of language detection methods
        order: ['header', 'querystring'],
        
        // Look for language in Accept-Language header
        lookupHeader: 'accept-language',
        
        // Look for language in query string
        lookupQuerystring: 'lng',
        
        // Cache the detected language
        caches: false,
      },
      
      // Save missing keys (useful during development)
      saveMissing: process.env.NODE_ENV === 'development',
      
      // Log missing keys
      missingKeyHandler: (lng, ns, key) => {
        console.warn(`Missing translation key: ${lng}/${ns}/${key}`);
      },
    });
};

/**
 * Get the i18n instance for use in middleware
 */
export const getI18n = () => i18n;

/**
 * Get a translation function for a specific language
 * Useful for server-side rendering or API responses
 */
export const getTranslator = (lng: SupportedLanguage) => {
  return {
    t: i18n.getFixedT(lng),
    lng,
  };
};

/**
 * Change the current language
 */
export const changeLanguage = async (lng: SupportedLanguage): Promise<void> => {
  await i18n.changeLanguage(lng);
};

/**
 * Get the current language
 */
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

/**
 * Check if a language is supported
 */
export const isLanguageSupported = (lng: string): lng is SupportedLanguage => {
  return supportedLanguages.includes(lng as SupportedLanguage);
};

export default i18n;
