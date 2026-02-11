# i18n Best Practices for POS Application

## Overview

This document outlines the best practices for implementing internationalization (i18n) in our Point of Sale application, based on research from the official react-i18next and i18next documentation via Context7.

**Tech Stack:**
- Frontend: React 18.2.0, TypeScript 5.8.2, Vite 6.2.0, Tailwind CSS 3.4.3
- Backend: Express 4.18.2, TypeScript 5.1.6, Prisma 5.22.0, PostgreSQL

---

## 1. Recommended Library Versions

| Library | Version | Purpose |
|---------|---------|---------|
| `react-i18next` | ^14.0.0 | React bindings for i18next |
| `i18next` | ^23.0.0 | Core i18n framework |
| `i18next-http-backend` | ^2.0.0 | Load translations via HTTP |
| `i18next-browser-languagedetector` | ^7.0.0 | Auto-detect user language |
| `i18next-fs-backend` | ^2.0.0 | Filesystem backend for Node.js |
| `i18next-http-middleware` | ^3.0.0 | Express middleware for i18n |

---

## 2. Frontend Setup (React + Vite)

### 2.1 Basic Configuration

Create `src/i18n/index.ts`:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  // Load translations from backend
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Fallback language when translation is missing
    fallbackLng: 'en',
    
    // Enable debug output in development
    debug: import.meta.env.DEV,
    
    // Default namespace
    defaultNS: 'common',
    
    // Namespaces to load
    ns: ['common', 'pos', 'errors', 'validation'],
    
    // Interpolation options
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },
    
    // React-specific options
    react: {
      // Use Suspense for loading states
      useSuspense: true,
      
      // Events that trigger re-render
      bindI18n: 'languageChanged loaded',
      
      // Store events that trigger re-render
      bindI18nStore: 'added removed',
      
      // Support basic HTML nodes in Trans component
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p', 'em'],
    },
    
    // Backend options for HTTP loading
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // Detection options
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage', 'cookie'],
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
```

### 2.2 App Integration

In `src/main.tsx`:

```typescript
import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n'; // Import i18n configuration

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<div className="loading">Loading translations...</div>}>
      <App />
    </Suspense>
  </React.StrictMode>
);
```

### 2.3 Lazy Loading with Vite

For optimal bundle size, use dynamic imports with Vite:

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

i18n
  .use(initReactI18next)
  .use(resourcesToBackend((language: string, namespace: string) => 
    import(`../locales/${language}/${namespace}.json`)
  ))
  .init({
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'pos', 'errors', 'validation'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

---

## 3. TypeScript Integration

### 3.1 Type-Safe Translations

Create `src/i18n/types.ts`:

```typescript
import 'i18next';
import type { resources } from './resources';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: typeof resources;
    ns: ['common', 'pos', 'errors', 'validation'];
    returnNull: false;
    returnEmptyString: false;
  }
}
```

### 3.2 Resource Type Definitions

Create `src/i18n/resources.ts`:

```typescript
export const resources = {
  en: {
    common: {
      buttons: {
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        confirm: 'Confirm',
      },
      labels: {
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
      },
    },
    pos: {
      title: 'Point of Sale',
      cart: 'Cart',
      total: 'Total',
      items_one: '{{count}} item',
      items_other: '{{count}} items',
    },
    errors: {
      networkError: 'Network error. Please try again.',
      unauthorized: 'You are not authorized to perform this action.',
      notFound: 'The requested resource was not found.',
    },
    validation: {
      required: 'This field is required',
      email: 'Please enter a valid email',
      minLength: 'Minimum {{min}} characters required',
    },
  },
  de: {
    common: {
      buttons: {
        save: 'Speichern',
        cancel: 'Abbrechen',
        delete: 'Löschen',
        confirm: 'Bestätigen',
      },
      labels: {
        loading: 'Laden...',
        error: 'Fehler',
        success: 'Erfolg',
      },
    },
    pos: {
      title: 'Verkaufspunkt',
      cart: 'Warenkorb',
      total: 'Gesamt',
      items_one: '{{count}} Artikel',
      items_other: '{{count}} Artikel',
    },
    errors: {
      networkError: 'Netzwerkfehler. Bitte versuchen Sie es erneut.',
      unauthorized: 'Sie sind nicht berechtigt, diese Aktion auszuführen.',
      notFound: 'Die angeforderte Ressource wurde nicht gefunden.',
    },
    validation: {
      required: 'Dieses Feld ist erforderlich',
      email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
      minLength: 'Mindestens {{min}} Zeichen erforderlich',
    },
  },
} as const;

export type Resources = typeof resources;
```

### 3.3 Type-Safe Usage

```typescript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  // TypeScript will autocomplete keys and validate interpolation
  const { t } = useTranslation('pos');
  
  // ✅ Valid - autocomplete works
  const title = t('title');
  
  // ✅ Valid - interpolation is type-checked
  const itemCount = t('items_other', { count: 5 });
  
  // ❌ TypeScript error - invalid key
  // const invalid = t('nonexistent');
  
  return <h1>{title}</h1>;
}
```

---

## 4. Namespace Organization

### 4.1 Recommended Namespace Structure

```
frontend/
├── src/
│   ├── i18n/
│   │   ├── index.ts          # Main configuration
│   │   ├── types.ts          # TypeScript declarations
│   │   └── resources.ts      # Type-safe resources
│   └── locales/
│       ├── en/
│       │   ├── common.json       # Shared UI elements
│       │   ├── pos.json          # POS-specific terms
│       │   ├── errors.json       # Error messages
│       │   ├── validation.json   # Form validation
│       │   ├── navigation.json   # Menu items
│       │   └── settings.json     # Settings labels
│       └── de/
│           ├── common.json
│           ├── pos.json
│           ├── errors.json
│           ├── validation.json
│           ├── navigation.json
│           └── settings.json
```

### 4.2 Namespace Guidelines

| Namespace | Purpose | Example Keys |
|-----------|---------|--------------|
| `common` | Shared UI elements | `buttons.save`, `labels.loading` |
| `pos` | POS-specific features | `cart.title`, `payment.cash` |
| `errors` | Error messages | `networkError`, `unauthorized` |
| `validation` | Form validation | `required`, `email.invalid` |
| `navigation` | Menu/navigation | `menu.dashboard`, `menu.settings` |
| `settings` | Settings labels | `language.title`, `currency.symbol` |

### 4.3 Using Multiple Namespaces

```typescript
// Single namespace
const { t } = useTranslation('pos');

// Multiple namespaces (t from first, others via tMulti)
const { t, t: tErrors } = useTranslation(['pos', 'errors']);

// Key prefix for nested translations
const { t } = useTranslation('pos', { keyPrefix: 'cart' });
// Now t('title') maps to 'pos:cart.title'
```

---

## 5. Translation File Structure

### 5.1 JSON Format (i18next v4)

```json
{
  "key": "value",
  "keyDeep": {
    "inner": "value"
  },
  "keyNesting": "reuse $t(keyDeep.inner)",
  "keyInterpolate": "replace this {{value}}",
  "keyInterpolateUnescaped": "replace this {{- value}}",
  "keyInterpolateWithFormatting": "{{value, number}} items",
  "keyContext_male": "the male variant",
  "keyContext_female": "the female variant",
  "keyPluralSimple_one": "the singular",
  "keyPluralSimple_other": "the plural",
  "keyWithArrayValue": ["multiple", "things"]
}
```

### 5.2 Key Naming Conventions

```typescript
// ✅ Good: Hierarchical, descriptive
"pos.cart.items.count"
"pos.payment.methods.cash"
"errors.validation.required"

// ❌ Bad: Flat, cryptic
"cartItemsCount"
"pm_cash"
"err_val_req"

// ✅ Good: Consistent separator
"navigation.menu.dashboard"
"navigation.menu.settings"

// ❌ Bad: Mixed separators
"navigation.menu-dashboard"
"navigation.menu_settings"
```

### 5.3 POS-Specific Example

`locales/en/pos.json`:

```json
{
  "title": "Point of Sale",
  "cart": {
    "title": "Shopping Cart",
    "empty": "Your cart is empty",
    "items_one": "{{count}} item",
    "items_other": "{{count}} items",
    "subtotal": "Subtotal",
    "tax": "Tax ({{rate}}%)",
    "total": "Total"
  },
  "payment": {
    "title": "Payment",
    "methods": {
      "cash": "Cash",
      "card": "Card",
      "voucher": "Voucher"
    },
    "amountReceived": "Amount Received",
    "change": "Change",
    "process": "Process Payment",
    "success": "Payment successful!",
    "failed": "Payment failed. Please try again."
  },
  "products": {
    "search": "Search products...",
    "noResults": "No products found",
    "addToCart": "Add to Cart",
    "outOfStock": "Out of Stock"
  },
  "orders": {
    "new": "New Order",
    "inProgress": "In Progress",
    "completed": "Completed",
    "cancelled": "Cancelled"
  }
}
```

---

## 6. Pluralization Rules

### 6.1 English (Simple Plural)

```json
{
  "items_one": "{{count}} item",
  "items_other": "{{count}} items"
}
```

### 6.2 German (Same Pattern)

```json
{
  "items_one": "{{count}} Artikel",
  "items_other": "{{count}} Artikel"
}
```

### 6.3 Arabic (Multiple Forms)

```json
{
  "items_zero": "لا توجد عناصر",
  "items_one": "عنصر واحد",
  "items_two": "عنصران",
  "items_few": "{{count}} عناصر",
  "items_many": "{{count}} عنصر",
  "items_other": "{{count}} عنصر"
}
```

### 6.4 Ordinal Plurals

```json
{
  "place_ordinal_one": "{{count}}st place",
  "place_ordinal_two": "{{count}}nd place",
  "place_ordinal_few": "{{count}}rd place",
  "place_ordinal_other": "{{count}}th place"
}
```

Usage:

```typescript
t('place', { count: 1, ordinal: true });  // "1st place"
t('place', { count: 2, ordinal: true });  // "2nd place"
t('place', { count: 3, ordinal: true });  // "3rd place"
t('place', { count: 4, ordinal: true });  // "4th place"
```

---

## 7. Interpolation and Formatting

### 7.1 Basic Interpolation

```typescript
// Translation: "Hello {{name}}!"
t('greeting', { name: 'John' }); // "Hello John!"
```

### 7.2 Number Formatting

```json
{
  "intlNumber": "Total: {{val, number}}",
  "intlNumberWithOptions": "Price: {{val, number(minimumFractionDigits: 2)}}"
}
```

```typescript
t('intlNumber', { val: 1000 }); // "Total: 1,000"
t('intlNumberWithOptions', { val: 2000 }); // "Price: 2,000.00"
```

### 7.3 Currency Formatting (Euro)

```json
{
  "price": "Price: {{val, currency(EUR)}}",
  "total": "Total: {{val, currency(currency: EUR)}}"
}
```

```typescript
t('price', { val: 1234.56 }); // "Price: €1,234.56"
t('total', { val: 999.99 }); // "Total: €999.99"
```

### 7.4 Date/Time Formatting

```json
{
  "dateOnly": "Date: {{val, datetime}}",
  "fullDateTime": "{{val, datetime(weekday: long; year: numeric; month: long; day: numeric)}}"
}
```

```typescript
t('dateOnly', { val: new Date() }); // "Date: 2/11/2026"
t('fullDateTime', { 
  val: new Date(),
  formatParams: {
    val: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  }
}); // "Wednesday, February 11, 2026"
```

### 7.5 Custom Formatters

```typescript
// Add custom formatter
i18n.services.formatter.add('lowercase', (value, lng, options) => {
  return value.toLowerCase();
});

i18n.services.formatter.add('uppercase', (value, lng, options) => {
  return value.toUpperCase();
});

// Usage: "{{name, uppercase}}"
t('greeting', { name: 'john' }); // "JOHN"
```

---

## 8. Trans Component for Rich Text

### 8.1 Basic Usage

```typescript
import { Trans } from 'react-i18next';

// Translation: "Read our <link>documentation</link> for more info."
<Trans i18nKey="readDocs" components={{ link: <a href="/docs" /> }} />
```

### 8.2 With Interpolation

```typescript
// Translation: "Hello <bold>{{name}}</bold>, you have {{count}} messages."
<Trans 
  i18nKey="greeting" 
  values={{ name: 'John', count: 5 }}
  components={{ bold: <strong /> }}
/>
```

### 8.3 Named Components

```typescript
// Translation: "Click <here>here</here> or <there>there</there>."
<Trans
  i18nKey="clickOptions"
  components={{
    here: <a href="/here" />,
    there: <a href="/there" />
  }}
/>
```

### 8.4 Dynamic Lists

```typescript
<Trans i18nKey="itemList">
  <ul i18nIsDynamicList>
    {items.map(item => <li key={item.id}>{item.name}</li>)}
  </ul>
</Trans>
```

---

## 9. Backend Internationalization (Express.js)

### 9.1 Setup i18next for Express

```typescript
// backend/src/i18n/index.ts
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import i18nextMiddleware from 'i18next-http-middleware';

i18next
  .use(Backend)
  .use(i18nextMiddleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'de'],
    preload: ['en', 'de'],
    ns: ['api', 'errors'],
    defaultNS: 'api',
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      order: ['header', 'querystring', 'cookie'],
      caches: ['cookie'],
      lookupHeader: 'accept-language',
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
    },
  });

export default i18next;
```

### 9.2 Express Middleware Integration

```typescript
// backend/src/index.ts
import express from 'express';
import i18nextMiddleware from 'i18next-http-middleware';
import i18next from './i18n';

const app = express();

// Add i18next middleware
app.use(i18nextMiddleware.handle(i18next));

// Now req.t is available in all routes
app.get('/api/products', (req, res) => {
  const message = req.t('products.fetched');
  res.json({ message });
});
```

### 9.3 Localized Error Messages

```typescript
// backend/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const t = req.t;
  
  // Map error types to translation keys
  const errorMap: Record<string, string> = {
    'UNAUTHORIZED': t('errors:unauthorized'),
    'NOT_FOUND': t('errors:notFound'),
    'VALIDATION_ERROR': t('errors:validation.failed'),
    'NETWORK_ERROR': t('errors:networkError'),
  };
  
  const message = errorMap[err.message] || t('errors:unknown');
  
  res.status(500).json({
    error: {
      message,
      code: err.message,
    }
  });
};
```

### 9.4 API Response Localization

```typescript
// backend/src/handlers/products.ts
import { Request, Response } from 'express';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    
    res.json({
      message: req.t('products.fetched', { count: products.length }),
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      error: req.t('errors:serverError'),
    });
  }
};
```

### 9.5 Backend Locale Files

`backend/locales/en/api.json`:

```json
{
  "products": {
    "fetched": "Successfully fetched {{count}} products",
    "created": "Product created successfully",
    "updated": "Product updated successfully",
    "deleted": "Product deleted successfully",
    "notFound": "Product not found"
  },
  "orders": {
    "created": "Order created successfully",
    "updated": "Order updated successfully",
    "cancelled": "Order cancelled successfully"
  }
}
```

`backend/locales/en/errors.json`:

```json
{
  "unauthorized": "You are not authorized to perform this action",
  "notFound": "The requested resource was not found",
  "validation": {
    "failed": "Validation failed",
    "required": "This field is required",
    "invalidFormat": "Invalid format"
  },
  "serverError": "An internal server error occurred",
  "networkError": "Network error. Please try again",
  "unknown": "An unknown error occurred"
}
```

---

## 10. Date/Number/Currency Formatting with Intl API

### 10.1 Number Formatter Utility

```typescript
// frontend/src/utils/formatters.ts

export const formatters = {
  number: (value: number, locale: string = 'en-US') => 
    new Intl.NumberFormat(locale).format(value),
  
  currency: (value: number, locale: string = 'de-DE', currency: string = 'EUR') =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value),
  
  decimal: (value: number, locale: string = 'de-DE', decimals: number = 2) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value),
  
  percent: (value: number, locale: string = 'de-DE') =>
    new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 1,
    }).format(value),
};

// Usage
formatters.currency(1234.56); // "1.234,56 €" (German format)
formatters.currency(1234.56, 'en-US', 'EUR'); // "€1,234.56"
```

### 10.2 Date Formatter Utility

```typescript
// frontend/src/utils/formatters.ts

export const dateFormatters = {
  short: (date: Date, locale: string = 'de-DE') =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'short',
    }).format(date),
  
  medium: (date: Date, locale: string = 'de-DE') =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
    }).format(date),
  
  long: (date: Date, locale: string = 'de-DE') =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'long',
    }).format(date),
  
  time: (date: Date, locale: string = 'de-DE') =>
    new Intl.DateTimeFormat(locale, {
      timeStyle: 'short',
    }).format(date),
  
  dateTime: (date: Date, locale: string = 'de-DE') =>
    new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date),
  
  custom: (date: Date, locale: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, options).format(date),
};

// Usage
dateFormatters.short(new Date()); // "11.02.26" (German)
dateFormatters.dateTime(new Date()); // "11.02.2026, 14:30"
```

### 10.3 Euro Currency Formatting

```typescript
// frontend/src/utils/currency.ts

const EURO_LOCALES: Record<string, string> = {
  de: 'de-DE', // German: 1.234,56 €
  en: 'en-IE', // Irish: €1,234.56
  fr: 'fr-FR', // French: 1 234,56 €
  it: 'it-IT', // Italian: 1.234,56 €
  es: 'es-ES', // Spanish: 1.234,56 €
  nl: 'nl-NL', // Dutch: € 1.234,56
  pt: 'pt-PT', // Portuguese: 1.234,56 €
};

export const formatEuro = (
  amount: number, 
  language: string = 'de'
): string => {
  const locale = EURO_LOCALES[language] || 'de-DE';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

// Usage
formatEuro(1234.56, 'de'); // "1.234,56 €"
formatEuro(1234.56, 'en'); // "€1,234.56"
formatEuro(1234.56, 'fr'); // "1 234,56 €"
```

---

## 11. RTL Support Considerations

### 11.1 CSS Direction Support

```css
/* Add to global CSS */
[dir="rtl"] {
  text-align: right;
}

[dir="rtl"] .flex-row {
  flex-direction: row-reverse;
}

[dir="rtl"] .ml-auto {
  margin-left: 0;
  margin-right: auto;
}

[dir="rtl"] .mr-auto {
  margin-right: 0;
  margin-left: auto;
}
```

### 11.2 RTL Detection Utility

```typescript
// frontend/src/utils/rtl.ts

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'yi'];

export const isRTL = (language: string): boolean => {
  const baseLang = language.split('-')[0];
  return RTL_LANGUAGES.includes(baseLang);
};

export const getDirection = (language: string): 'rtl' | 'ltr' => {
  return isRTL(language) ? 'rtl' : 'ltr';
};
```

### 11.3 Document Direction Setup

```typescript
// frontend/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ... setup code ...

// Update document direction on language change
i18n.on('languageChanged', (lng) => {
  const dir = isRTL(lng) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', lng);
});
```

### 11.4 Tailwind CSS RTL Support

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    // Add RTL support plugin
    require('tailwindcss-rtl'),
  ],
};
```

---

## 12. Best Practices Checklist

### Setup & Configuration

- [ ] Install required packages (`react-i18next`, `i18next`, backend plugins)
- [ ] Configure i18next with appropriate fallback language
- [ ] Set up language detection (browser, localStorage, cookie)
- [ ] Configure Suspense for loading states
- [ ] Set up TypeScript type definitions for type-safe translations

### Translation Management

- [ ] Organize translations into logical namespaces
- [ ] Use consistent key naming conventions (dot notation)
- [ ] Store translations in separate JSON files per language
- [ ] Implement lazy loading for translation files
- [ ] Use pluralization suffixes correctly (`_one`, `_other`, etc.)

### Frontend Implementation

- [ ] Use `useTranslation` hook in components
- [ ] Use `Trans` component for rich text with embedded components
- [ ] Implement language switcher UI
- [ ] Handle missing translations gracefully
- [ ] Cache language preference in localStorage/cookie

### Backend Implementation

- [ ] Set up i18next middleware for Express
- [ ] Localize API error messages
- [ ] Support Accept-Language header
- [ ] Create backend-specific translation files
- [ ] Use `req.t` for translations in handlers

### Formatting

- [ ] Use Intl API for number formatting
- [ ] Use Intl API for currency formatting (Euro)
- [ ] Use Intl API for date/time formatting
- [ ] Configure locale-aware formatters
- [ ] Handle RTL languages if needed

### Testing & Quality

- [ ] Test all supported languages
- [ ] Verify pluralization works correctly
- [ ] Check interpolation with special characters
- [ ] Test language switching
- [ ] Verify missing key fallbacks

---

## 13. Implementation Priority

### Phase 1: Core Setup
1. Install i18n packages
2. Create basic i18n configuration
3. Set up TypeScript types
4. Create initial translation files (en, de)

### Phase 2: Frontend Integration
1. Integrate with React components
2. Create language switcher
3. Implement lazy loading
4. Add formatting utilities

### Phase 3: Backend Integration
1. Set up Express middleware
2. Localize error messages
3. Localize API responses
4. Test language detection

### Phase 4: Polish & Testing
1. Complete all translations
2. Test all languages
3. Add RTL support (future)
4. Performance optimization

---

## References

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [i18next-http-backend](https://github.com/i18next/i18next-http-backend)
- [i18next-browser-languagedetector](https://github.com/i18next/i18next-browser-languagedetector)
- [MDN Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
