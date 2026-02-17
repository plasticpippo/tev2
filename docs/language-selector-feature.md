# Language Selector Feature Documentation

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [Implementation Details](#implementation-details)
3. [User Guide](#user-guide)
4. [Technical Notes](#technical-notes)
5. [Future Enhancements](#future-enhancements)

---

## Feature Overview

### Purpose

The language selector feature enables users to change the application language directly from the admin panel settings section. This provides a convenient way for users who prefer different languages to customize their experience without navigating away from the admin interface.

### Key Features

- **In-Settings Access**: Language selection is integrated into the Settings section of the admin panel
- **Instant Language Switching**: Changes take effect immediately without page reload
- **Persistent Preferences**: Language choice is saved in browser localStorage
- **Component Reuse**: Leverages the existing [`LanguageSwitcher`](../frontend/components/LanguageSwitcher.tsx) component

### Supported Languages

| Language | Code | Native Name |
|----------|------|-------------|
| English | `en` | English |
| Italian | `it` | Italiano |

---

## Implementation Details

### Files Created

#### [`frontend/components/LanguageSettings.tsx`](../frontend/components/LanguageSettings.tsx)

A new settings section component that wraps the existing [`LanguageSwitcher`](../frontend/components/LanguageSwitcher.tsx) component with appropriate context:

```typescript
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
```

**Key Design Decisions**:
- Uses the `admin` namespace for translations to maintain consistency with other settings sections
- Wraps [`LanguageSwitcher`](../frontend/components/LanguageSwitcher.tsx) in a descriptive container with title and help text
- Follows the existing styling patterns using Tailwind CSS classes

### Files Modified

#### [`frontend/components/SettingsModal.tsx`](../frontend/components/SettingsModal.tsx)

The settings modal was updated to include the new [`LanguageSettings`](../frontend/components/LanguageSettings.tsx) component as the first section:

```typescript
import { LanguageSettings } from './LanguageSettings';

// In the return statement:
return (
  <div className="space-y-8">
    <LanguageSettings />
    <TaxSettings settings={settings.tax} onUpdate={handleTaxUpdate} />
    <BusinessDaySettings settings={settings.businessDay} onUpdate={handleBusinessDayUpdate} />
  </div>
);
```

**Placement Rationale**: Language settings appear first in the settings list as a fundamental user preference that affects the entire application interface.

#### [`frontend/public/locales/en/admin.json`](../frontend/public/locales/en/admin.json)

Added translation keys for the language settings section:

```json
{
  "settings": {
    "language": "Language",
    "languageDescription": "Select your preferred language for the admin panel."
  }
}
```

#### [`frontend/public/locales/it/admin.json`](../frontend/public/locales/it/admin.json)

Added Italian translations:

```json
{
  "settings": {
    "language": "Lingua",
    "languageDescription": "Seleziona la lingua preferita per il pannello admin."
  }
}
```

### Integration with Existing i18n Infrastructure

The feature integrates seamlessly with the existing internationalization setup:

#### i18n Configuration

**File**: [`frontend/src/i18n/index.ts`](../frontend/src/i18n/index.ts)

The i18n configuration already supports:
- **Language Detection**: Uses `i18next-browser-languagedetector` to detect user language
- **LocalStorage Persistence**: Language preference is cached in localStorage under the key `i18nextLng`
- **Lazy Loading**: Translations are loaded on-demand from `public/locales/{language}/{namespace}.json`

```typescript
detection: {
  order: ['localStorage', 'navigator', 'htmlTag'],
  lookupLocalStorage: 'i18nextLng',
  caches: ['localStorage'],
},
```

#### LanguageSwitcher Component

**File**: [`frontend/components/LanguageSwitcher.tsx`](../frontend/components/LanguageSwitcher.tsx)

The existing [`LanguageSwitcher`](../frontend/components/LanguageSwitcher.tsx) component provides:
- Dropdown interface with flag indicators (EN, IT)
- Active language highlighting
- Click-outside-to-close behavior
- Integration with `i18next` via [`useTranslation()`](../frontend/components/LanguageSwitcher.tsx:11) hook

---

## User Guide

### Accessing the Language Selector

1. **Navigate to Admin Panel**: Log in to the application and access the admin panel
2. **Open Settings**: Click on "Settings" in the navigation menu
3. **Locate Language Section**: The language selector is the first section at the top of the settings page

### Changing the Language

1. **Click the Language Button**: Click the button showing the current language flag (e.g., "EN" or "IT")
2. **Select a Language**: A dropdown menu appears with available languages:
   - **English** - For English interface
   - **Italiano** - For Italian interface
3. **Confirm Selection**: Click on your preferred language
4. **Immediate Effect**: The interface updates instantly to reflect the new language

### Visual Indicators

| Element | Description |
|---------|-------------|
| Flag Badge | Shows current language code (EN/IT) |
| Dropdown Arrow | Indicates expandable menu |
| Active State | Selected language highlighted with amber background |
| Checkmark | Appears next to currently active language |

### Persistence

- **Browser Storage**: Your language preference is stored in the browser's localStorage
- **Cross-Session**: The preference persists across browser sessions
- **Device-Specific**: Each device/browser maintains its own language preference
- **No Login Required**: Language preference works independently of user authentication

---

## Technical Notes

### Language Persistence Mechanism

The language preference is persisted using `i18next-browser-languagedetector`:

| Storage Key | Value | Description |
|-------------|-------|-------------|
| `i18nextLng` | `'en'` or `'it'` | Current language code |

**Detection Order**:
1. **localStorage** - Checks for previously saved preference
2. **navigator** - Falls back to browser language settings
3. **htmlTag** - Finally checks the HTML lang attribute

### Component Architecture

```
SettingsModal
  |
  +-- LanguageSettings (new)
  |     |
  |     +-- LanguageSwitcher (existing)
  |
  +-- TaxSettings
  |
  +-- BusinessDaySettings
```

### Supported Languages Configuration

**File**: [`frontend/src/i18n/index.ts`](../frontend/src/i18n/index.ts)

```typescript
export const supportedLanguages = ['en', 'it'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];
export const fallbackLanguage: SupportedLanguage = 'en';
```

### Translation Namespace Structure

```
frontend/public/locales/
  |
  +-- en/
  |     +-- admin.json    # Admin panel translations
  |     +-- common.json   # Shared translations
  |     +-- ...
  |
  +-- it/
        +-- admin.json    # Italian admin translations
        +-- common.json   # Italian shared translations
        +-- ...
```

### Adding a New Language

To add support for a new language (e.g., German):

1. **Update i18n configuration**:
   ```typescript
   // frontend/src/i18n/index.ts
   export const supportedLanguages = ['en', 'it', 'de'] as const;
   ```

2. **Add language info to LanguageSwitcher**:
   ```typescript
   // frontend/components/LanguageSwitcher.tsx
   const languageNames: Record<SupportedLanguage, { name: string; flag: string }> = {
     en: { name: 'English', flag: 'EN' },
     it: { name: 'Italiano', flag: 'IT' },
     de: { name: 'Deutsch', flag: 'DE' },
   };
   ```

3. **Create translation files**:
   ```
   frontend/public/locales/de/
     +-- admin.json
     +-- common.json
     +-- ...
   ```

---

## Future Enhancements

### User-Level Language Preference Storage

**Current Limitation**: Language preference is stored per-device in localStorage, meaning users must set their preference on each device/browser they use.

**Proposed Enhancement**: Store language preference in the user database profile.

#### Implementation Plan

1. **Database Schema Change**:
   ```sql
   ALTER TABLE "users" ADD COLUMN "preferredLanguage" VARCHAR(10) DEFAULT 'en';
   ```

2. **API Endpoint**:
   ```
   GET /api/users/me/preferences
   PUT /api/users/me/preferences
   ```

3. **Frontend Integration**:
   - On login, fetch user preferences and apply language setting
   - On language change, persist to both localStorage and database
   - Use database preference as primary, localStorage as fallback

4. **Benefits**:
   - Consistent experience across devices
   - Language preference tied to user account
   - Can be managed by administrators

### Additional Potential Improvements

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| Language-specific content | Support for product descriptions in multiple languages | Medium |
| RTL Support | Right-to-left language support for Arabic, Hebrew | Low |
| Regional Formats | Date, time, and number formatting per locale | Medium |
| Auto-detection | Better browser language detection with fallback chain | Low |
| Language in URL | Optional language prefix in routes (e.g., `/en/admin`) | Low |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-17 | Initial implementation of language selector in admin settings |

## Related Documentation

- [LanguageSwitcher Component](../frontend/components/LanguageSwitcher.tsx)
- [LanguageSettings Component](../frontend/components/LanguageSettings.tsx)
- [SettingsModal Component](../frontend/components/SettingsModal.tsx)
- [i18n Configuration](../frontend/src/i18n/index.ts)
- [i18n Coverage Report](./i18n-coverage-report.md)