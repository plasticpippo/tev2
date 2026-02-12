import 'i18next';
import type { supportedLanguages, fallbackLanguage } from './index';

// Import translation types from JSON files (will be created in Phase 1)
// For now, we define the base structure for type safety

/**
 * Supported language codes
 */
export type SupportedLanguage = (typeof supportedLanguages)[number];

/**
 * Fallback language code
 */
export type FallbackLanguage = typeof fallbackLanguage;

/**
 * Translation namespace types
 * Add new namespaces here as the application grows
 */
export type TranslationNamespace = 'common' | 'auth' | 'pos' | 'admin' | 'errors' | 'validation';

/**
 * Base translation structure for common namespace
 * This will be extended with actual translations in Phase 1
 */
export interface CommonTranslations {
  // Placeholder - will be populated with actual keys in Phase 1
  [key: string]: string | CommonTranslations;
}

/**
 * Auth namespace translations
 */
export interface AuthTranslations {
  // Placeholder - will be populated with actual keys in Phase 1
  [key: string]: string | AuthTranslations;
}

/**
 * POS namespace translations
 */
export interface PosTranslations {
  // Placeholder - will be populated with actual keys in Phase 1
  [key: string]: string | PosTranslations;
}

/**
 * Admin namespace translations
 */
export interface AdminTranslations {
  // Placeholder - will be populated with actual keys in Phase 1
  [key: string]: string | AdminTranslations;
}

/**
 * Error messages translations
 */
export interface ErrorTranslations {
  // Placeholder - will be populated with actual keys in Phase 1
  [key: string]: string | ErrorTranslations;
}

/**
 * Validation messages translations
 */
export interface ValidationTranslations {
  // Placeholder - will be populated with actual keys in Phase 1
  [key: string]: string | ValidationTranslations;
}

/**
 * Combined translation resources type
 */
export interface TranslationResources {
  common: CommonTranslations;
  auth: AuthTranslations;
  pos: PosTranslations;
  admin: AdminTranslations;
  errors: ErrorTranslations;
  validation: ValidationTranslations;
}

/**
 * Extend i18next types for type-safe translations
 * This enables autocomplete and type checking for translation keys
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    // Default namespace
    defaultNS: 'common';
    // Supported namespaces
    ns: TranslationNamespace;
    // Supported languages
    lng: SupportedLanguage;
    // Translation resources
    resources: TranslationResources;
    // Return type for t() function
    returnNull: false;
    // Allow empty strings
    allowObjectInHTMLChildren: true;
  }
}

/**
 * Type-safe translation key helper
 * Use this to extract translation keys from a translation object
 */
export type TranslationKey<T extends object, K extends string = ''> = 
  T extends string 
    ? K 
    : {
        [P in keyof T]: T[P] extends object 
          ? TranslationKey<T[P], `${K}${P & string}.`>
          : `${K}${P & string}`
      }[keyof T];

/**
 * Helper type for interpolation values
 */
export type InterpolationValues = Record<string, string | number | boolean | Date | null | undefined>;

/**
 * Language change callback type
 */
export type LanguageChangeCallback = (lng: SupportedLanguage) => void;

/**
 * i18n instance type with our custom configuration
 */
export type TypedI18n = typeof import('./index').default;
