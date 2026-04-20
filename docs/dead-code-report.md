# Dead Code Analysis Report

**Date:** 2026-04-19
**Scope:** Full codebase (`backend/src/`, `frontend/`, `shared/`, `scripts/`)
**Methodology:** Static analysis via import/export cross-referencing, grep-based usage tracking, and manual file inspection.

---

## Legend

| Confidence | Meaning |
|---|---|
| **HIGH** | Definitively dead. No production or test code imports or references the symbol. |
| **MEDIUM** | Likely dead. Only referenced by test files or within the same file (self-reference only). Could be future-use scaffolding. |
| **LOW** | Possibly dead. Exported but not trivially traceable due to dynamic patterns (reflection, dynamic imports, re-exports). |

---

## 1. Backend: `backend/src/`

### 1.1 Entire Files Never Imported (HIGH)

| File | Lines | Explanation |
|---|---|---|
| `middleware/responseSanitizer.ts` | ~1 (corrupted/malformed) | File contents are garbled (starts with `[{"express": ...`). Never imported by any handler, middleware chain, or test. Appears to be a corrupted or abandoned file. |
| `services/emailTemplateService.ts` | 109 | Exported functions `renderEmailTemplate` and `clearEmailTemplateCache` are never imported by any production code. Only referenced by a test file (`__tests__/emailTemplateService.test.ts`). |
| `config/fonts.ts` | 43 | Exports `FONTS_DIR`, `fontConfigs`, `DEFAULT_FONT_FAMILY`, `getDefaultFontConfig`, `getFontPaths`. None are imported anywhere. |
| `handlers/ingredients.ts` | 1 | Contains only `export {};`. Not registered in `router.ts`. Entire file is dead. |
| `utils/layoutValidation.ts` | 150 | Exports 10 validation functions (`validateLayoutName`, `validateCategoryId`, `validateTillId`, `validateVariantId`, `validateGridColumn`, `validateGridRow`, `validateVariantLayout`, `validateSharedLayout`, `validateSharedLayoutPosition`). None are imported anywhere. The `layouts.ts` handler uses its own inline validation. |
| `utils/costConversion.ts` | 390 | Entire file only imported by test files (`__tests__/costConversion.test.ts`). None of its exports (`convertToBaseUnit`, `calculateCostPerBaseUnit`, `parsePurchasingUnits`, `getServingCost`, `getConversionFactorFromConfig`, `isConversionPossible`, `getUnitDescription`, `COMMON_CONVERSIONS`, `UnitConversion`, `PurchasingUnitConfig`, `PurchasingUnitsJson`) are used in production code. |

### 1.2 Unused Exports Within Used Files (HIGH)

| File | Export | Line(s) | Explanation |
|---|---|---|---|
| `utils/validation.ts` | `validateProductPrice` | 57 | Only called internally by `validateProductVariant`. Never imported externally. |
| `utils/validation.ts` | `isValidTime` | 407 | Never imported externally. Only defined. |
| `utils/validation.ts` | `isValidDateTime` | 373 | Only called internally by `validateAnalyticsParams`. Never imported externally. |
| `utils/validation.ts` | `validateRoomDescription` | 343 | Only called internally by `validateRoom`. Never imported externally. |
| `utils/validation.ts` | `validateRoom` | 353 | Never imported externally. |
| `utils/money.ts` | `distributeMoney` | 170 | Only referenced in `__tests__/money.test.ts`. Not used in production. |
| `utils/money.ts` | `formatCost` | 288 | Never imported anywhere (not even tests). |
| `utils/logger.ts` | `createChildLogger` | 1190 | Never imported externally. Only exported and included in default export object. |
| `utils/logger.ts` | `sanitizeForLogInjection` (external) | 653 | Only called internally within `logger.ts`. Never imported by other modules. |
| `utils/logger.ts` | `generateCorrelationId` | 743 | Only called internally within `logger.ts`. Never imported by other modules. |
| `utils/logger.ts` | `getCorrelationId` (external) | 753 | Only called internally within `logger.ts`. Never imported by other modules. |
| `utils/logger.ts` | `logRequest` | 1009 | Only called internally by `requestLoggerMiddleware`. Never imported externally. |
| `utils/logger.ts` | `logResponse` | 1022 | Only called internally by `requestLoggerMiddleware`. Never imported externally. |
| `services/emailService.ts` | `sendEmail` | 162 | Exported and included in default export but never imported by any handler or service. |
| `services/emailService.ts` | `clearTransporterCache` | 154 | Exported and included in default export but never imported. |

### 1.3 Unused Type Exports in `types.ts` (MEDIUM)

The following type/interface exports from `backend/src/types.ts` are never imported by any other file. Some may serve as documentation, but they are technically dead code.

| Type | Line(s) | Notes |
|---|---|---|
| `ThemeColor` | 33 | Used internally by `ProductVariant` in same file but never imported externally. |
| `TaxRate` | 96 | Never imported; `TaxRate` from `@prisma/client` is used instead. |
| `TaxSettings` | 108 | Never imported. |
| `BusinessSettings` | 114 | Never imported. |
| `ReceiptConfig` | 127 | Never imported. |
| `EmailConfig` | 136 | Never imported (emailService defines its own `EmailConfig`). |
| `PurchasingUnit` | 170 | Never imported. |
| `VariantLayoutPosition` | 231 | Never imported. |
| `SharedLayoutData` | 237 | Never imported. |
| `Room` | 245 | Never imported. |
| `Table` | 254 | Never imported. |
| `ProcessPaymentRequest` | 270 | Never imported. |
| `ProcessPaymentResponse` | 289 | Never imported. |

### 1.4 Logger SENSITIVE_FIELDS Overgrowth (LOW)

`utils/logger.ts` lines 25-543: The `SENSITIVE_FIELDS` array contains ~500 entries. After line ~200, the list devolves into nonsensical repetitions like `cardConnectingToEncoder`, `cardDisconnectingFromHats`, `cardBending`, `cardFolding`, etc. These entries (lines ~200-543) will never match real data fields and appear to be generated filler. While not technically "dead code," they are dead weight that bloats the array and slows the redaction check.

### 1.5 Standalone Scripts (LOW)

These are CLI-entry-point scripts, not imported by the server. They are not "dead" per se but are one-off migration/utility scripts.

| File | Lines | Notes |
|---|---|---|
| `scripts/hashExistingPasswords.ts` | 46 | One-time migration script. Runs standalone via `ts-node`. |
| `scripts/updateCategoryVisibleTillIds.ts` | 36 | One-time data fix script. Has `if (require.main === module)` guard. |
| `scripts/cleanupExpiredTokens.ts` | ~ | Scheduled cleanup script. |

---

## 2. Frontend: `frontend/`

### 2.1 Entire Dead Files - Test/Demo Components (HIGH)

These files exist in `frontend/components/` but are never imported by any production component or route:

| File | Explanation |
|---|---|
| `components/TestEnhancedGrid.tsx` | Test/demo component. Zero imports. |
| `components/TestEnhancedGridIntegration.tsx` | Test/demo component. Zero imports. |
| `components/TestGridResizing.tsx` | Test/demo component. Zero imports. |
| `components/TestToastComponent.tsx` | Test/demo component. Zero imports. |
| `components/VisualGuidesTest.tsx` | Test/demo component. Zero imports. |
| `components/DailyReport.tsx` | Comment says: "This component was removed and its functionality merged into TransactionHistory." Contains only `export {};`. |
| `components/AIAssistant.tsx` | Zero imports. Appears to be a planned but never-integrated feature. |
| `components/CustomerDetail.tsx` | Zero imports. Customer detail view that was never integrated into any parent component. |
| `components/ErrorPage.tsx` | Zero imports. Error page component that is never rendered in any route or boundary. |
| `components/DataProvider.tsx` | Zero imports. Confusingly named; `GlobalDataProvider` from `contexts/GlobalDataContext.tsx` is used instead. |
| `components/GridTemplates.test.tsx` | Test file located in `components/` instead of `__tests__/`. Only tests `GridTemplates.tsx`. |
| `src/components/POSWithLayoutDemo.tsx` | Demo component in `src/components/`. Zero imports from production code. |
| `src/components/layout/TestLayoutComponents.tsx` | Test layout component. Zero imports from production code. |

### 2.2 Entire Dead Files - Loose Root-Level Test/Utility Scripts (HIGH)

These files sit at `frontend/` root and are never imported by any production or test code. They appear to be abandoned Playwright test scripts and CSS testing utilities:

| File | Lines (approx) | Explanation |
|---|---|---|
| `test_responsive_behavior.ts` | ~ | Abandoned test script. Zero imports. |
| `responsive_verification_test.ts` | ~ | Abandoned test script. Zero imports. |
| `responsive_behavior_summary.ts` | ~ | Abandoned summary/utility. Zero imports. |
| `playwright_resize_test.ts` | ~ | Abandoned Playwright test. Zero imports. |
| `playwright_e2e_tests.ts` | ~ | Abandoned Playwright test. Zero imports. |
| `regression_test_phase3.ts` | ~ | Abandoned regression test. Only imports `mcp_integration.ts`. |
| `playwright_responsive_test.ts` | ~ | Abandoned Playwright test. Zero imports. |
| `playwright_comprehensive_grid_tests.ts` | ~ | Abandoned Playwright test. Zero imports. |
| `phase_3_css_regression_test_summary.ts` | ~ | Abandoned test summary. Zero imports. |
| `css_improvements_verification_test.ts` | ~ | Abandoned test. Zero imports. |
| `playwright_css_improvements_test.ts` | ~ | Abandoned Playwright test. Zero imports. |
| `network-error-tests.ts` | ~ | Abandoned test script. Zero imports. |
| `mcp_integration.ts` | ~ | MCP integration helper. Only imported by `regression_test_phase3.ts` (itself dead). |
| `comprehensive_css_testing.ts` | ~ | Abandoned CSS test utility. Zero imports. |
| `playwright_color_test.ts` | ~ | Abandoned Playwright test. Zero imports. |
| `CSS_IMPROVEMENTS_SUMMARY.ts` | ~ | Data file with `console.log` at module level. Zero imports. |
| `test-top-selling-products.tsx` | ~ | Abandoned test component. Zero imports. |
| `test_context_split.tsx` | ~ | Abandoned context test. Zero imports. |
| `responsive_testing_script.tsx` | ~ | Abandoned test script. Zero imports. |
| `css_variable_migration_test.tsx` | ~ | Abandoned CSS test. Zero imports. |

### 2.3 Entire Dead Files - Services (HIGH)

| File | Explanation |
|---|---|
| `services/tokenRefresh.ts` | Exports `refreshToken` and `withTokenRefresh`. Never imported by any file. |
| `services/geminiService.ts` | Placeholder file with `export {};`. Never imported. |

### 2.4 Entire Dead Files - Other (HIGH)

| File | Explanation |
|---|---|
| `src/data/mockLayoutData.ts` | Comment says "mainly for reference/testing". Zero imports. |
| `src/i18n/types.ts` | 131 lines of i18n type definitions and module augmentation. Never imported. The `declare module 'i18next'` augmentation never takes effect. |

### 2.5 Unused Exports Within Used Files (MEDIUM)

| File | Export | Explanation |
|---|---|---|
| `shared/constants.ts` | `PAYMENT_METHODS`, `INITIAL_USERS` | Never imported. Frontend has its own `shared/constants.ts`. |
| `frontend/shared/constants.ts` | All exports: `PAYMENT_METHODS`, `DEFAULT_TAX_RATE`, `BUSINESS_DAY_START_TIME`, `DEFAULT_CURRENCY`, `API_ENDPOINTS`, `UI_DEFAULTS` | Zero imports. Every export is dead. |
| `frontend/hooks/useFieldValidation.ts` | `useFieldValidation` | Exported but never imported by any component. |
| `frontend/src/hooks/useAutosave.ts` | `useAutosave` | Only imported by test file `__tests__/useAutosave.test.ts`. Not used in any component. |
| `frontend/src/hooks/useCategoryFilter.ts` | `useCategoryFilter` | Zero imports anywhere. |
| `frontend/src/i18n/types.ts` | All exports: `CommonTranslations`, `AuthTranslations`, `PosTranslations`, `AdminTranslations`, `ErrorTranslations`, `ValidationTranslations`, `TranslationResources`, `TranslationKey`, `InterpolationValues`, `LanguageChangeCallback`, `TypedI18n`, `SupportedLanguage`, `FallbackLanguage`, `TranslationNamespace` | Zero imports. |
| `frontend/src/data/mockLayoutData.ts` | All exports | Zero imports. |

### 2.6 Re-export Shims (LOW)

These files at `frontend/` root simply re-export from `./components/`. They are used by `App.tsx` (e.g., `import { LoginScreen } from './LoginScreen'`). They add indirection but are not technically dead since `App.tsx` imports from them. However, the imports could be pointed directly at `./components/LoginScreen` instead.

| File | Content |
|---|---|
| `LoginScreen.tsx` | `export * from './components/LoginScreen';` |
| `OrderPanel.tsx` | `export * from './components/OrderPanel';` |
| `TransactionHistory.tsx` | `export * from './components/TransactionHistory';` |
| `StockAdjustmentHistory.tsx` | `export * from './components/StockAdjustmentHistory';` |

---

## 3. Summary Statistics

| Category | Count |
|---|---|
| **Entire dead files (backend)** | 6 |
| **Unused exports in used files (backend)** | 16 |
| **Unused type exports (backend)** | 13 |
| **Entire dead files (frontend)** | 34 |
| **Unused exports in used files (frontend)** | 22+ |
| **Re-export shims (frontend)** | 4 |
| **Total dead files** | ~40 |
| **Total dead exports** | ~51 |

### By Confidence

| Confidence | Items |
|---|---|
| **HIGH** | 6 backend dead files + 34 frontend dead files + 16 backend unused exports + 6 frontend unused exports in shared/constants |
| **MEDIUM** | 13 unused backend type exports + 16 frontend unused exports (hooks, i18n types) |
| **LOW** | 4 re-export shims + 3 backend scripts + ~340 lines of SENSITIVE_FIELDS filler |

### Estimated Dead Lines of Code

| Area | Estimated Lines |
|---|---|
| Backend dead files | ~800 |
| Backend unused exports | ~150 |
| Backend SENSITIVE_FIELDS filler | ~340 |
| Frontend dead component files | ~1,500 |
| Frontend loose test scripts | ~3,000 |
| Frontend dead service/hook files | ~200 |
| Frontend dead constants/types | ~200 |
| **Total estimated** | **~6,200 lines** |

---

## 4. Recommended Priority for Cleanup

1. **Highest impact:** Delete the 20+ abandoned Playwright/CSS test scripts in `frontend/` root (saves ~3,000 lines of noise).
2. **High impact:** Delete dead frontend components (`TestEnhancedGrid*.tsx`, `AIAssistant.tsx`, `CustomerDetail.tsx`, `ErrorPage.tsx`, `DataProvider.tsx`, `DailyReport.tsx`).
3. **Medium impact:** Remove dead backend files (`responseSanitizer.ts`, `emailTemplateService.ts`, `layoutValidation.ts`, `ingredients.ts`, `config/fonts.ts`).
4. **Low impact:** Clean up unused exports in `utils/validation.ts`, `utils/money.ts`, `utils/logger.ts`.
5. **Lowest impact:** Remove unused type definitions and frontend `shared/constants.ts`.
