# i18n Comprehensive Audit Report

**Date:** 2026-04-21  
**Scope:** Full application — frontend components, contexts, services, backend handlers, middleware, services, and all translation files  
**Previous report:** docs/i18n-coverage-report.md (2026-02-12)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Translation File Audit](#3-translation-file-audit)
   - 3.1 [Structural Issues (Duplicate JSON Keys)](#31-structural-issues-duplicate-json-keys)
   - 3.2 [Key Coverage (EN vs IT)](#32-key-coverage-en-vs-it)
   - 3.3 [Interpolation Variable Mismatches](#33-interpolation-variable-mismatches)
   - 3.4 [Missing Italian Accents / Diacritical Marks](#34-missing-italian-accents--diacritical-marks)
4. [Frontend Component Audit](#4-frontend-component-audit)
   - 4.1 [Components Without Any i18n](#41-components-without-any-i18n)
   - 4.2 [Components With Mixed i18n (Partial Hardcoded Strings)](#42-components-with-mixed-i18n-partial-hardcoded-strings)
   - 4.3 [Hardcoded Locale Strings](#43-hardcoded-locale-strings)
   - 4.4 [t() With English Fallback Strings](#44-t-with-english-fallback-strings)
5. [Backend Audit](#5-backend-audit)
   - 5.1 [Global i18n.t() vs Per-Request req.t](#51-global-i18nt-vs-per-request-reqt)
   - 5.2 [Hardcoded English Strings in Handlers](#52-hardcoded-english-strings-in-handlers)
   - 5.3 [Hardcoded English Strings in Services](#53-hardcoded-english-strings-in-services)
   - 5.4 [Hardcoded English Strings in Middleware](#54-hardcoded-english-strings-in-middleware)
6. [Priority Recommendations](#6-priority-recommendations)
7. [Appendix A: Complete Italian Accent Catalogue](#appendix-a-complete-italian-accent-catalogue)

---

## 1. Executive Summary

The application uses **i18next** for internationalization with two supported languages: **English (en)** and **Italian (it)**. Significant progress has been made since the original coverage report (2026-02-12): the frontend admin namespace, POS namespace, and backend translation files are structurally complete with full key parity between EN and IT.

However, this audit reveals **five categories of remaining issues**:

| Category | Severity | Count |
|----------|----------|-------|
| Missing Italian accents across all IT translation files | Medium | ~170 instances |
| Components with zero i18n (all strings hardcoded) | High | 4 files |
| Components with partial hardcoded strings alongside t() | Medium | 9 files |
| Backend using global `i18n.t()` instead of per-request `req.t` | Critical | 10+ files |
| Hardcoded English strings in backend handlers/services | Medium | ~60+ instances |

**Key improvements since the 2026-02-12 report:**
- Frontend component i18n coverage improved from ~30% to ~90%
- Backend handlers gained i18n support (via global `i18n.t()`)
- All translation files now have full EN/IT key parity
- Translation files split into proper namespaces (admin, pos, common, errors, validation, auth)

---

## 2. Architecture Overview

### Frontend
- **Library:** `i18next` v25.8.5 + `react-i18next` v16.5.4
- **Detection:** `i18next-browser-languagedetector` (localStorage > navigator > htmlTag)
- **Loading:** `i18next-resources-to-backend` — lazy-loaded JSON files
- **Config:** `frontend/src/i18n/index.ts`
- **Namespaces:** `common`, `admin`, `pos`, `errors`, `validation`, `auth`
- **Translation files:** `frontend/public/locales/{en,it}/{namespace}.json`

### Backend
- **Library:** `i18next` v25.8.5 + `i18next-fs-backend` + `i18next-http-middleware`
- **Detection:** `Accept-Language` header / `?lng=` query parameter
- **Config:** `backend/src/i18n/index.ts`
- **Namespaces:** `common`, `errors`, `api`, `receipt`, `invoice`, `email`, `settings`
- **Translation files:** `backend/locales/{en,it}/{namespace}.json`

### Translation File Inventory

| Location | EN Files | IT Files | Total Lines (EN) |
|----------|----------|----------|-------------------|
| `frontend/public/locales/` | 6 | 6 | ~2,376 |
| `backend/locales/` | 7 | 7 | ~462 |

---

## 3. Translation File Audit

### 3.1 Structural Issues (Duplicate JSON Keys)

**File:** `frontend/public/locales/en/admin.json`

The EN admin file has **3 duplicate key definitions** where the same key is defined twice at the same nesting level. In standard JSON parsing, the second occurrence silently overwrites the first, causing data loss.

| Duplicate Key | First Definition | Second Definition | Effect |
|---------------|-----------------|-------------------|--------|
| `dashboard` | ~11 keys (lines 30-42) | ~27 keys (lines 482-514) | First set lost; second wins |
| `receipts.buttons` | 5 keys (search, clearFilters, download, email, sending) | 7 keys (same + issue, issuing) | First set lost; second wins |
| `receipts.customer` | ~43 keys (full customer form, search, validation) | 1 key (noResults only) | **CRITICAL: All EN receipt customer form/search/validation keys are lost at runtime** |

**Impact:** The `receipts.customer` duplicate is the most severe. At runtime, the EN file only has `receipts.customer.noResults`. The IT file correctly has the full customer object (43+ keys). This means:
- Receipt customer search UI shows raw translation keys in English
- Receipt customer form labels are broken in English
- Receipt customer validation messages are broken in English

**The IT file has no duplicate keys.**

### 3.2 Key Coverage (EN vs IT)

**All namespaces have 100% key parity between EN and IT**, with the exception noted above where EN has lost keys due to duplicate JSON keys.

| Namespace | EN Keys | IT Keys | Missing EN->IT | Missing IT->EN |
|-----------|---------|---------|----------------|----------------|
| frontend/admin.json | ~all | ~all | 0 | ~43 (lost by EN duplicate) |
| frontend/common.json | all | all | 0 | 0 |
| frontend/pos.json | all | all | 0 | 0 |
| frontend/errors.json | all | all | 0 | 0 |
| frontend/validation.json | all | all | 0 | 0 |
| frontend/auth.json | all | all | 0 | 0 |
| backend/common.json | all | all | 0 | 0 |
| backend/errors.json | all | all | 0 | 0 |
| backend/api.json | all | all | 0 | 0 |
| backend/receipt.json | all | all | 0 | 0 |
| backend/invoice.json | all | all | 0 | 0 |
| backend/email.json | all | all | 0 | 0 |
| backend/settings.json | all | all | 0 | 0 |

### 3.3 Interpolation Variable Mismatches

**None found.** All `{{variable}}` interpolation patterns match exactly between EN and IT across all 13 namespace pairs.

### 3.4 Missing Italian Accents / Diacritical Marks

**This is the most widespread issue.** Every Italian translation file (except `frontend/locales/it/admin.json` and `backend/locales/it/common.json`) systematically omits required accent marks. This affects approximately **170 instances** across 11 files.

**Common patterns:**

| Incorrect | Correct | Approx. Count |
|-----------|---------|---------------|
| `e` (verb "to be") | `è` | ~70 |
| `E` (verb at start) | `È` | ~5 |
| `piu` | `più` | ~20 |
| `gia` / `già` | `già` | ~18 |
| `quantita` / `Quantite` | `quantità` / `Quantità` | ~12 |
| `Modalite` / `modalite` | `Modalità` / `modalità` | ~8 |
| `Attivita` / `attivita` | `Attività` / `attività` | ~6 |
| `integrita` | `integrità` | ~7 |
| `Unite` / `unita` | `Unità` / `unità` | ~2 |
| `caffe` / `Caffe` | `caffè` / `Caffè` | ~4 |
| `Citta` / `citta` | `Città` / `città` | ~2 |
| `puo` | `può` | ~4 |
| `Si` (meaning "yes") | `Sì` | ~2 |
| `visibilita` | `visibilità` | ~1 |
| `Entita` | `Entità` | ~1 |
| `operera` | `opererà` | ~1 |
| `scadra` | `scadrà` | ~1 |
| `Qta` | `Qtà` | ~1 |

**Files affected (by severity):**

| File | Accent Issues |
|------|---------------|
| `frontend/it/common.json` | ~35 |
| `frontend/it/validation.json` | ~35 |
| `backend/it/errors.json` | ~40 |
| `frontend/it/errors.json` | ~25 |
| `frontend/it/pos.json` | ~14 |
| `frontend/it/auth.json` | ~9 |
| `backend/it/settings.json` | ~12 |
| `backend/it/invoice.json` | ~3 |
| `backend/it/api.json` | ~3 |
| `backend/it/receipt.json` | ~1 |
| `backend/it/email.json` | ~2 |
| `frontend/it/admin.json` | **0** (clean) |
| `backend/it/common.json` | **0** (clean) |

See [Appendix A](#appendix-a-complete-italian-accent-catalogue) for the complete line-by-line catalogue.

---

## 4. Frontend Component Audit

### 4.1 Components Without Any i18n

These components have **zero i18n** — no `useTranslation` import, all user-visible text is hardcoded English.

#### `frontend/src/components/SettingsModal.tsx` — **CRITICAL** (admin panel settings tabs)

All 7 tab labels in the admin panel settings modal are hardcoded. This is the specific issue the user reported seeing as "placeholders" in settings.

| Line | Hardcoded String |
|------|-----------------|
| 54 | `'Language'` |
| 55 | `'Tax Settings'` |
| 56 | `'Business Day'` |
| 57 | `'Business Info'` |
| 58 | `'Backup'` |
| 59 | `'Email'` |
| 60 | `'Receipt from Payment'` |

#### `frontend/src/components/LogoUploader.tsx` — 16 hardcoded strings

| Line | Hardcoded String | Context |
|------|-----------------|---------|
| 47 | `'Invalid file type. Only PNG, JPG, and SVG files are allowed.'` | Validation |
| 50 | `'File size exceeds 2MB limit.'` | Validation |
| 99 | `'Invalid response from server.'` | Error |
| 103 | `'Upload failed. Please try again.'` | Error |
| 108 | `` `Upload failed (HTTP ${xhr.status}).` `` | Error |
| 123 | `'Network error. Please check your connection.'` | Error |
| 133 | `'An unexpected error occurred.'` | Error |
| 154 | `'Delete failed. Please try again.'` | Error |
| 160 | `'Network error. Please check your connection.'` | Error (dup) |
| 215 | `'Business Logo'` | Label |
| 222 | `'Upload logo. Click or drag and drop a PNG, JPG, or SVG file.'` | Aria-label |
| 244 | `'Business logo'` | Alt text |
| 262 | `'Click or drop image'` | Placeholder |
| 312 | `'Uploading...'` / `'Upload Logo'` | Button |
| 322 | `'Deleting...'` / `'Remove'` | Button |
| 328 | `'PNG, JPG, SVG. Max 2MB.'` | Helper text |

#### `frontend/src/contexts/LayoutContext.tsx` — 16 toast messages hardcoded

| Line | Hardcoded String |
|------|-----------------|
| 371 | `` `Layout saved successfully for ${categoryName}!` `` |
| 379 | `'Session expired. Please log in again.'` |
| 384 | `` `Failed to save layout: ${errorMessage}` `` |
| 429 | `'Layout reset to default!'` |
| 436 | `'Session expired. Please log in again.'` |
| 442 | `` `Failed to reset layout: ${errorMessage}` `` |
| 494 | `` `Invalid layout name: ${error.message}` `` |
| 512 | `'Cannot save empty layout as shared layout'` |
| 526 | `` `Shared layout "${sanitizedName}" created successfully!` `` |
| 536 | `'Session expired. Please log in again.'` |
| 543 | `` `Failed to create shared layout: ${errorMessage}` `` |
| 575 | `'Shared layout loaded successfully!'` |
| 583 | `'Session expired. Please log in again.'` |
| 589 | `` `Failed to load shared layout: ${errorMessage}` `` |

#### `frontend/src/components/layout/DraggableProductButton.tsx` — 2 hardcoded strings

| Line | Hardcoded String | Context |
|------|-----------------|---------|
| 260 | `'OUT OF STOCK'` | Overlay badge |
| 283 | `'FAV'` | Favourite indicator |

#### `frontend/src/components/layout/LayoutIntegrationWrapper.tsx` — 1 hardcoded string

| Line | Hardcoded String | Context |
|------|-----------------|---------|
| 30 | `'Please assign a till to use the POS system'` | User message |

### 4.2 Components With Mixed i18n (Partial Hardcoded Strings)

These components import and use `useTranslation` but still have some hardcoded English strings.

#### `frontend/src/components/AdminPanel.tsx` — 4 hardcoded strings

| Line | Hardcoded String | Type |
|------|-----------------|------|
| 141 | `Select a view` | Fallback render text |
| 288 | `aria-label="Open menu"` | Accessibility |
| 325 | `aria-label="Close menu"` | Accessibility |
| 336 | `aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}` | Accessibility |

#### `frontend/src/components/CustomerManagement.tsx` — 6 hardcoded strings

| Line | Hardcoded String | Type |
|------|-----------------|------|
| 80 | `'Failed to fetch customers'` | Error throw |
| 96 | `'An error occurred'` | Error fallback |
| 153 | `'Failed to save customer'` | Error throw |
| 161 | `'An error occurred'` | Error fallback |
| 181 | `'Failed to update customer status'` | Error throw |
| 188 | `'An error occurred'` | Error fallback |

#### `frontend/src/components/TransactionHistory.tsx` — 3 hardcoded strings

| Line | Hardcoded String | Type |
|------|-----------------|------|
| 134 | `'Unknown error'` | Error fallback |
| 163 | `'Failed to void transaction'` | Error message |
| 437 | `aria-label="Void transaction"` | Accessibility |

#### `frontend/src/components/BusinessDaySettings.tsx` — 2 hardcoded strings

| Line | Hardcoded String | Type |
|------|-----------------|------|
| 99 | `'Unknown error'` | Error fallback |
| 100 | `` `Failed to create daily closing record: ${errorMessage}` `` | Error message |

#### `frontend/src/components/BackupSettings.tsx` — 1 hardcoded string

| Line | Hardcoded String | Type |
|------|-----------------|------|
| 25 | `'Failed to create backup'` | Error message |

#### `frontend/src/components/EmailSettings.tsx` — 1 hardcoded string

| Line | Hardcoded String | Type |
|------|-----------------|------|
| 205 | `'Too many requests. Please wait before trying again.'` | Rate limit error |

#### `frontend/src/components/AnalyticsPanel.tsx` — 2 hardcoded strings

| Line | Hardcoded String | Type |
|------|-----------------|------|
| 131 | `'Failed to fetch hourly data'` | Error throw |
| 155 | `'Failed to fetch comparison data'` | Error throw |

#### `frontend/src/components/TopPerformers.tsx` — 1 hardcoded string

| Line | Hardcoded String | Type |
|------|-----------------|------|
| 60 | `'Failed to load performance data'` | Error message |

#### `frontend/src/components/ReceiptGenerationModal.tsx` — 1 hardcoded string

| Line | Hardcoded String | Type |
|------|-----------------|------|
| 71 | `'Failed to load draft receipt'` | Error message |

#### `frontend/src/components/PaymentModal.tsx` — 2 hardcoded strings

| Line | Hardcoded String | Type |
|------|-----------------|------|
| 253 | `'Processing...'` | Button fallback |
| 266 | `'Processing...'` | Button fallback |

#### `frontend/src/components/MainPOSInterface.tsx` — 2 hardcoded strings

| Line | Hardcoded String | Type |
|------|-----------------|------|
| 219 | `\|\| 'Products'` | Fallback after t() |
| 236 | `` `${orderItems.length} items` `` | aria-label |

#### `frontend/src/components/TabManager.tsx` — 1 hardcoded string

| Line | Hardcoded String | Type |
|------|-----------------|------|
| 43 | `aria-label="Close tab manager"` | Accessibility |

#### `frontend/src/components/layout/ProductGridLayout.tsx` — 1 partial hardcoded string

| Line | Hardcoded String | Type |
|------|-----------------|------|
| 333 | `'cols (mobile)'` / `'cols'` | Grid info label |

### 4.3 Hardcoded Locale Strings

These files hardcode a specific locale for date/number formatting, which will not adapt when the user switches language:

| File | Line | Hardcoded Locale |
|------|------|-----------------|
| `frontend/src/utils/formatting.ts` | 28 | `'en-GB'` |
| `frontend/src/utils/money.ts` | 62 | `'it-IT'` |
| `frontend/src/components/analytics/SalesTrendChart.tsx` | 32, 53 | `'en-US'` |

### 4.4 t() With English Fallback Strings

Several components use the pattern `t('key', 'English fallback')` which embeds English text directly in component code. While functionally correct (the fallback is used if the key is missing), this creates maintenance burden and is not best practice:

| File | Approx. Fallback Count |
|------|----------------------|
| `VarianceReportPanel.tsx` | ~40 |
| `CustomerManagement.tsx` | ~25 |
| `ProfitAnalyticsPanel.tsx` | ~20 |
| `LogoUploader.tsx` | ~15 |

---

## 5. Backend Audit

### 5.1 Global i18n.t() vs Per-Request req.t — CRITICAL DESIGN ISSUE

The backend configures `i18next-http-middleware` which provides `req.t` for per-request translation (detecting language from `Accept-Language` header). However, the vast majority of backend code uses the **global `i18n.t()`** instead, which completely ignores the user's language preference.

| Pattern | Files Using It | Count |
|---------|---------------|-------|
| `req.t` (correct, per-request) | 2 files (`orderSessions.ts`, `settings.ts` partially) | ~19 uses |
| Global `i18n.t()` (ignores user language) | 10+ files | ~461 uses |

**Impact:** When an Italian user makes API requests, all error messages and responses returned by handlers using `i18n.t()` will be in whatever language was last set globally (typically English). Only the 2 files using `req.t` will respect the `Accept-Language: it` header.

Even `orderSessions.ts`, which correctly uses `req.t`, still has hardcoded English error strings for conflict/not-found cases (see below).

### 5.2 Hardcoded English Strings in Handlers

These are strings that completely bypass i18n — they are raw English text in thrown errors or response messages.

#### `backend/src/handlers/transactions.ts` — 20 hardcoded strings

| Line | Hardcoded String |
|------|-----------------|
| 92 | `'Missing tillId'` |
| 101 | `'User not authenticated'` |
| 107 | `'Invalid till reference: till not found'` |
| 110 | `'Till name mismatch'` |
| 154 | `` `Subtotal mismatch. Expected: ${...}, Received: ${...}` `` |
| 166 | `` `Tax mismatch. Expected: ${...}, Received: ${...}` `` |
| 342 | `` `Stock item not found: ${stockItemId}` `` |
| 344 | `` `Insufficient stock for item ${stockItem.name}...` `` |
| 359 | `'CONFLICT: Order session was modified by another transaction'` |
| 453 | `'Payment conflict detected. Please retry.'` |
| 572 | `'Data reconciliation failed'` |
| 666 | `'Void reason is required'` |
| 677 | `'NOT_FOUND'` |
| 681 | `'ALREADY_VOIDED'` |
| 685 | `'INVALID_STATUS'` |
| 786 | `'Transaction voided successfully'` |
| 800 | `'Transaction not found'` |
| 803 | `'Transaction is already voided'` |
| 806 | `'Only completed or complimentary transactions can be voided'` |
| 810 | `'Failed to void transaction'` |

#### `backend/src/handlers/settings.ts` — 14 hardcoded strings

| Line | Hardcoded String |
|------|-----------------|
| 23 | `'Too many email test requests. Please try again later.'` |
| 181 | `'No file uploaded'` |
| 232 | `'Failed to upload logo'` |
| 242 | `'No logo found'` |
| 262 | `'Failed to delete logo'` |
| 512 | `'Database configuration not found'` |
| 522 | `'Invalid database configuration'` |
| 545 | `'Invalid database configuration'` |
| 647 | `'Invalid recipient email format'` |
| 652 | `'Invalid recipient email address'` |
| 663 | `'Email service is disabled in settings'` |
| 664 | `'EMAIL_DISABLED'` |
| 718 | `'Failed to test SMTP connection'` |
| 719 | `'INTERNAL_ERROR'` |

#### `backend/src/handlers/analytics.ts` — 15 hardcoded strings

| Line | Hardcoded String |
|------|-----------------|
| 71, 110, 152, 178, 204, 230, 257, 283 | `'Invalid date format. Use YYYY-MM-DD'` (8x) |
| 162 | `'Failed to fetch profit summary'` |
| 188 | `'Failed to fetch profit comparison'` |
| 214 | `'Failed to fetch margin by category'` |
| 241 | `'Failed to fetch margin by product'` |
| 267 | `'Failed to fetch margin trend'` |
| 293 | `'Failed to fetch profit dashboard'` |

#### `backend/src/handlers/orderSessions.ts` — 12 hardcoded strings (despite also using req.t)

| Line | Hardcoded String |
|------|-----------------|
| 64, 142, 183, 262, 322, 380, 433 | `'CONFLICT: Order session was modified by another transaction'` (7x) |
| 248, 304, 366, 419 | `'NOT_FOUND'` (4x) |

#### `backend/src/handlers/costManagement.ts` — 2 hardcoded strings

| Line | Hardcoded String |
|------|-----------------|
| 133 | `'Cost must not exceed 6 decimal places'` |
| 404 | `` `Stock item ${id} not found` `` |

#### `backend/src/handlers/stockItems.ts` — 2 hardcoded strings

| Line | Hardcoded String |
|------|-----------------|
| 96 | `'A reason is required for stock level adjustments'` |
| 177 | `` `Insufficient stock for item ${stockItemId}` `` |

#### `backend/src/handlers/tables.ts` — 2 hardcoded strings

| Line | Hardcoded String |
|------|-----------------|
| 333 | `'Status is required'` |
| 340 | `'Invalid status value'` |

#### `backend/src/handlers/receiptHandler.ts` — 1 hardcoded string

| Line | Hardcoded String |
|------|-----------------|
| 592 | `'Receipt not found'` |

### 5.3 Hardcoded English Strings in Services

#### `backend/src/services/emailService.ts` — 12 hardcoded strings

| Line | Hardcoded String |
|------|-----------------|
| 84 | `'SMTP host is not configured'` |
| 88 | `'SMTP user is not configured'` |
| 92 | `'SMTP password is not configured'` |
| 96 | `'From address is not configured'` |
| 101 | `'Invalid SMTP host format'` |
| 105 | `'Invalid SMTP port'` |
| 110 | `'Invalid from address format'` |
| 160 | `'Email service is disabled'` |
| 259 | `'Invalid test recipient email address'` |
| 260 | `'INVALID_TEST_RECIPIENT'` |
| 294 | `'SMTP connection successful and test email sent'` |
| 308 | `'SMTP connection successful'` |

### 5.4 Hardcoded English Strings in Middleware

#### `backend/src/middleware/rateLimiter.ts` — 1 hardcoded string

| Line | Hardcoded String |
|------|-----------------|
| 41 | `'Too many requests, please try again later'` |

---

## 6. Priority Recommendations

### Priority 1 — Critical (Immediate)

| Issue | Impact | Effort |
|-------|--------|--------|
| **Fix duplicate JSON keys in `en/admin.json`** | EN receipt customer UI is completely broken | Low |
| **Add `useTranslation` to `SettingsModal.tsx`** | All 7 settings tabs are English-only (user-reported issue) | Low |
| **Migrate backend from `i18n.t()` to `req.t`** | All backend translations ignore user language preference | Medium |

### Priority 2 — High

| Issue | Impact | Effort |
|-------|--------|--------|
| **Add `useTranslation` to `LogoUploader.tsx`** | 16 strings hardcoded | Medium |
| **Add i18n to `LayoutContext.tsx`** | 16 toast messages hardcoded | Medium |
| **Add i18n to `DraggableProductButton.tsx`** | "OUT OF STOCK" / "FAV" badges hardcoded | Low |
| **Add i18n to `LayoutIntegrationWrapper.tsx`** | Critical user-facing message hardcoded | Low |
| **Fix ~60+ hardcoded strings in backend handlers** | Error messages always English | High |

### Priority 3 — Medium

| Issue | Impact | Effort |
|-------|--------|--------|
| **Fix ~170 missing Italian accents across 11 IT files** | Italian text looks unprofessional/incorrect | Medium |
| **Fix remaining hardcoded strings in admin components** (~22 strings across 9 files) | Partial English in Italian UI | Medium |
| **Remove hardcoded locale strings** (`formatting.ts`, `money.ts`, `SalesTrendChart.tsx`) | Date/number formatting doesn't adapt to language | Low |
| **Extract English fallbacks from `t()` calls** (~100 instances across 4 files) | Maintenance burden, risk of drift | Medium |

### Priority 4 — Low

| Issue | Impact | Effort |
|-------|--------|--------|
| **Translate aria-labels** (~6 instances) | Screen readers read English in Italian mode | Low |
| **Consistent accent in `receipt.json` vs `invoice.json`** | `Qtà` vs `Qta` inconsistency | Trivial |

---

## Appendix A: Complete Italian Accent Catalogue

### `frontend/public/locales/it/common.json`

| Line | Key | Current | Corrected |
|------|-----|---------|-----------|
| 39 | `labels.yes` | `"Si"` | `"Sì"` |
| 65 | `confirmation.areYouSure` | `"E sicuro?"` | `"È sicuro?"` |
| 66 | `confirmation.confirmDelete` | `"E sicuro di voler eliminare questo elemento?"` | `"È sicuro di voler eliminare questo elemento?"` |
| 67 | `confirmation.confirmDeleteNamed` | `"E sicuro di voler eliminare \"{{name}}\"?"` | `"È sicuro di voler eliminare \"{{name}}\"?"` |
| 68 | `confirmation.confirmAction` | `"E sicuro di voler procedere?"` | `"È sicuro di voler procedere?"` |
| 69 | `confirmation.yes` | `"Si"` | `"Sì"` |
| 100 | `messages.serverError` | `"Errore del server. Riprova piu tardi."` | `"Errore del server. Riprova più tardi."` |
| 101 | `messages.sessionExpired` | `"La sessione e scaduta. Accedi nuovamente."` | `"La sessione è scaduta. Accedi nuovamente."` |
| 127 | `form.required` | `"Questo campo e obbligatorio"` | `"Questo campo è obbligatorio"` |
| 193 | `tableLayoutEditor.mode` | `"Modalite"` | `"Modalità"` |
| 195 | `tableLayoutEditor.editMode` | `"Modalite Modifica"` | `"Modalità Modifica"` |
| 196 | `tableLayoutEditor.dragMode` | `"Modalite Trascinamento"` | `"Modalità Trascinamento"` |
| 209 | `tableLayoutEditor.tipViewMode` | `"Passa alla modalite Modifica..."` | `"Passa alla modalità Modifica..."` |
| 232 | `enhancedGridLayout.help.clearGridDescription` | `"...non puo essere annullata."` | `"...non può essere annullata."` |
| 236 | `enhancedGridLayout.help.keyboardNavDescription` | `"...movimenti piu ampi."` | `"...movimenti più ampi."` |
| 253 | `inventoryManagement.quantity` | `"Quantite"` | `"Quantità"` |
| 255 | `inventoryManagement.unit` | `"Unite"` | `"Unità"` |
| 265 | `gridControls.columnsDescription` | `"...Piu colonne permettono griglie piu ampie ma elementi piu piccoli."` | `"...Più colonne permettono griglie più ampie ma elementi più piccoli."` |
| 267 | `gridControls.gridUnitSizeDescription` | `"...Celle piu grandi significano elementi piu grandi..."` | `"...Celle più grandi significano elementi più grandi..."` |
| 269 | `gridControls.gutterDescription` | `"...Aumenta per piu spazio tra gli elementi."` | `"...Aumenta per più spazio tra gli elementi."` |
| 273 | `gridControls.snapToGridDescription` | `"...posizione della griglia piu vicina..."` | `"...posizione della griglia più vicina..."` |
| 275 | `gridControls.showGridLinesDescription` | `"...visibilita delle linee..."` | `"...visibilità delle linee..."` |
| 281 | `transferItemsModal.selectItemQuantities` | `"1. Seleziona Quantita da Spostare"` | `"1. Seleziona Quantità da Spostare"` |
| 285 | `transferItemsModal.decreaseQuantity` | `"Diminuisci quantita di {{itemName}}"` | `"Diminuisci quantità di {{itemName}}"` |
| 286 | `transferItemsModal.increaseQuantity` | `"Aumenta quantita di {{itemName}}"` | `"Aumenta quantità di {{itemName}}"` |
| 310 | `gridTemplates.categories.caffe` | `"Caffe"` | `"Caffè"` |
| 326 | `gridTemplates.templates.cafeStandard.name` | `"Caffe Standard"` | `"Caffè Standard"` |
| 327 | `gridTemplates.templates.cafeStandard.description` | `"Layout caffe con caffe e pasticcini"` | `"Layout caffè con caffè e pasticcini"` |
| 359 | `helpGuide.keyboardNav.description` | `"...movimenti piu ampi."` | `"...movimenti più ampi."` |
| 433 | `productPerformanceTable.quantitySold` | `"Quantita Venduta"` | `"Quantità Venduta"` |
| 458 | `tableErrorBoundary.description` | `"Si e verificato un errore..."` | `"Si è verificato un errore..."` |
| 469 | `errorPage.title` | `"Si e Verificato un Errore"` | `"Si È Verificato un Errore"` |
| 470 | `errorPage.description` | `"Si e verificato un problema..."` | `"Si è verificato un problema..."` |
| 471 | `errorPage.unexpectedError` | `"Si e verificato un errore imprevisto"` | `"Si è verificato un errore imprevisto"` |
| 498 | `tillSetupScreen.subtitle` | `"...questo dispositivo operera."` | `"...questo dispositivo opererà."` |
| 511 | `enhancedGridLayoutSection.helpGuide.description` | `"Questa e l'area principale..."` | `"Questa è l'area principale..."` |
| 531 | `api.unexpectedError` | `"Si e verificato un errore imprevisto"` | `"Si è verificato un errore imprevisto"` |

### `frontend/public/locales/it/pos.json`

| Line | Key | Current | Corrected |
|------|-----|---------|-----------|
| 18 | `productGrid.editModeDisabled` | `"Modalite Modifica Disattivata"` | `"Modalità Modifica Disattivata"` |
| 19 | `productGrid.editModeDisabledMessage` | `"...non e disponibile..."` | `"...non è disponibile..."` |
| 26 | `cart.emptyCart` | `"Il carrello e vuoto"` | `"Il carrello è vuoto"` |
| 31 | `cart.quantity` | `"Quantita"` | `"Quantità"` |
| 32 | `cart.increase` | `"Aumenta quantita"` | `"Aumenta quantità"` |
| 33 | `cart.decrease` | `"Diminuisci quantita"` | `"Diminuisci quantità"` |
| 150 | `layout.viewMode` | `"Modalite Visualizzazione"` | `"Modalità Visualizzazione"` |
| 151 | `layout.editMode` | `"Modalite Modifica"` | `"Modalità Modifica"` |
| 152 | `layout.dragMode` | `"Modalite Trascinamento"` | `"Modalità Trascinamento"` |
| 159 | `layout.editModeTitle` | `"MODALITE MODIFICA"` | `"MODALITÀ MODIFICA"` |
| 173 | `layout.confirmUnsavedMessage` | `"...modalita modifica?"` | `"...modalità modifica?"` |

### `frontend/public/locales/it/errors.json`

| Line | Key | Current | Corrected |
|------|-----|---------|-----------|
| 3 | `http.400` | `"...non e valida o non puo essere elaborata."` | `"...non è valida o non può essere elaborata."` |
| 6 | `http.404` | `"...non e stata trovata."` | `"...non è stata trovata."` |
| 7 | `http.405` | `"...non e consentito..."` | `"...non è consentito..."` |
| 9 | `http.409` | `"...e in conflitto..."` | `"...è in conflitto..."` |
| 10 | `http.422` | `"Entita Non Elaborabile"` | `"Entità Non Elaborabile"` |
| 12 | `http.500` | `"Si e verificato un errore imprevisto sul server."` | `"Si è verificato un errore imprevisto sul server."` |
| 14 | `http.503` | `"...e temporaneamente non disponibile."` | `"...è temporaneamente non disponibile."` |
| 19 | `network.connectionLost` | `"...e stata persa."` | `"...è stata persa."` |
| 20 | `network.timeout` | `"...e scaduta."` | `"...è scaduta."` |
| 23 | `network.unknown` | `"Si e verificato un errore di rete."` | `"Si è verificato un errore di rete."` |
| 28 | `api.products.duplicateName` | `"Esiste gia un prodotto..."` | `"Esiste già un prodotto..."` |
| 34 | `api.categories.duplicateName` | `"Esiste gia una categoria..."` | `"Esiste già una categoria..."` |
| 40 | `api.stockItems.duplicateName` | `"Esiste gia un articolo..."` | `"Esiste già un articolo..."` |
| 47 | `api.layouts.duplicateName` | `"Esiste gia un layout..."` | `"Esiste già un layout..."` |
| 54 | `api.auth.sessionExpired` | `"...e scaduta."` | `"...è scaduta."` |
| 56 | `api.auth.tokenExpired` | `"...e scaduto."` | `"...è scaduto."` |
| 60 | `api.users.duplicateUsername` | `"Esiste gia un utente..."` | `"Esiste già un utente..."` |
| 67 | `api.tills.alreadyAssigned` | `"...e gia assegnato..."` | `"...è già assegnato..."` |
| 78 | `api.tabs.alreadyClosed` | `"...e gia stato chiuso."` | `"...è già stato chiuso."` |
| 90 | `api.orderSessions.alreadyCompleted` | `"...e gia stata completata."` | `"...è già stata completata."` |
| 107 | `api.customers.duplicateEmail` | `"Esiste gia un cliente..."` | `"Esiste già un cliente..."` |
| 118 | `api.receipts.transactionHasReceipt` | `"Esiste gia uno scontrino..."` | `"Esiste già uno scontrino..."` |
| 122 | `boundary.title` | `"Qualcosa e andato storto"` | `"Qualcosa è andato storto"` |
| 123 | `boundary.message` | `"Si e verificato un errore imprevisto."` | `"Si è verificato un errore imprevisto."` |
| 127 | `general.unknown` | `"Si e verificato un errore imprevisto."` | `"Si è verificato un errore imprevisto."` |
| 136 | `general.notFound` | `"...non e stata trovata."` | `"...non è stata trovata."` |
| 139 | `general.maintenance` | `"...e attualmente in manutenzione. Riprova piu tardi."` | `"...è attualmente in manutenzione. Riprova più tardi."` |

### `frontend/public/locales/it/validation.json`

| Line | Key | Current | Corrected |
|------|-----|---------|-----------|
| 2 | `required` | `"Questo campo e obbligatorio"` | `"Questo campo è obbligatorio"` |
| 15 | `name.required` | `"Il nome e obbligatorio"` | `"Il nome è obbligatorio"` |
| 21 | `name.duplicate` | `"Questo nome e gia in uso"` | `"Questo nome è già in uso"` |
| 24 | `email.required` | `"L'email e obbligatoria"` | `"L'email è obbligatoria"` |
| 26 | `email.duplicate` | `"Questa email e gia registrata"` | `"Questa email è già registrata"` |
| 29 | `password.required` | `"La password e obbligatoria"` | `"La password è obbligatoria"` |
| 34 | `password.tooWeak` | `"La password e troppo debole"` | `"La password è troppo debole"` |
| 37 | `username.required` | `"Il nome utente e obbligatorio"` | `"Il nome utente è obbligatorio"` |
| 40 | `username.pattern` | `"Il nome utente puo contenere solo lettere, numeri e underscore"` | `"Il nome utente può contenere solo lettere, numeri e underscore"` |
| 41 | `username.duplicate` | `"Questo nome utente e gia in uso"` | `"Questo nome utente è già in uso"` |
| 44 | `price.required` | `"Il prezzo e obbligatorio"` | `"Il prezzo è obbligatorio"` |
| 51 | `quantity.required` | `"La quantita e obbligatoria"` | `"La quantità è obbligatoria"` |
| 52 | `quantity.min` | `"La quantita deve essere {{min}} o maggiore"` | `"La quantità deve essere {{min}} o maggiore"` |
| 53 | `quantity.max` | `"La quantita deve essere {{max}} o minore"` | `"La quantità deve essere {{max}} o minore"` |
| 54 | `quantity.format` | `"Inserisci una quantita valida"` | `"Inserisci una quantità valida"` |
| 55 | `quantity.invalid` | `"La quantita deve essere un numero non negativo"` | `"La quantità deve essere un numero non negativo"` |
| 58 | `category.required` | `"La selezione della categoria e obbligatoria"` | `"La selezione della categoria è obbligatoria"` |
| 62 | `room.required` | `"La selezione della sala e obbligatoria"` | `"La selezione della sala è obbligatoria"` |
| 63 | `room.nameRequired` | `"Il nome della sala e obbligatorio"` | `"Il nome della sala è obbligatorio"` |
| 64 | `room.nameDuplicate` | `"Esiste gia una sala con questo nome"` | `"Esiste già una sala con questo nome"` |
| 67 | `table.nameRequired` | `"Il nome del tavolo e obbligatorio"` | `"Il nome del tavolo è obbligatorio"` |
| 68 | `table.roomRequired` | `"La selezione della sala e obbligatoria"` | `"La selezione della sala è obbligatoria"` |
| 71 | `table.positionOutOfRange` | `"La posizione e fuori dai limiti del layout"` | `"La posizione è fuori dai limiti del layout"` |
| 74 | `stockItem.nameRequired` | `"Il nome dell'articolo magazzino e obbligatorio"` | `"Il nome dell'articolo magazzino è obbligatorio"` |
| 75 | `stockItem.unitRequired` | `"L'unita base e obbligatoria"` | `"L'unità base è obbligatoria"` |
| 76 | `stockItem.quantityInvalid` | `"La quantita deve essere un numero valido"` | `"La quantità deve essere un numero valido"` |
| 79 | `variant.nameRequired` | `"Il nome della variante e obbligatorio"` | `"Il nome della variante è obbligatorio"` |
| 80 | `variant.priceRequired` | `"Il prezzo e obbligatorio"` | `"Il prezzo è obbligatorio"` |
| 87 | `user.nameRequired` | `"Il nome utente e obbligatorio"` | `"Il nome utente è obbligatorio"` |
| 88 | `user.usernameRequired` | `"Il nome utente e obbligatorio"` | `"Il nome utente è obbligatorio"` |
| 89 | `user.passwordRequired` | `"La password e obbligatoria"` | `"La password è obbligatoria"` |
| 90 | `user.roleRequired` | `"La selezione del ruolo e obbligatoria"` | `"La selezione del ruolo è obbligatoria"` |
| 93 | `tab.nameRequired` | `"Il nome del conto e obbligatorio"` | `"Il nome del conto è obbligatorio"` |
| 97 | `dateRange.startRequired` | `"La data di inizio e obbligatoria"` | `"La data di inizio è obbligatoria"` |
| 98 | `dateRange.endRequired` | `"La data di fine e obbligatoria"` | `"La data di fine è obbligatoria"` |
| 100 | `dateRange.rangeTooLarge` | `"...e troppo ampio. Il massimo e {{max}} giorni."` | `"...è troppo ampio. Il massimo è {{max}} giorni."` |
| 104 | `file.tooLarge` | `"Il file e troppo grande. La dimensione massima e {{max}}."` | `"Il file è troppo grande. La dimensione massima è {{max}}."` |

### `frontend/public/locales/it/auth.json`

| Line | Key | Current | Corrected |
|------|-----|---------|-----------|
| 17 | `errors.sessionExpired` | `"La sessione e scaduta."` | `"La sessione è scaduta."` |
| 20 | `errors.tokenExpired` | `"Il token di autenticazione e scaduto."` | `"Il token di autenticazione è scaduto."` |
| 23 | `errors.serverError` | `"...Riprova piu tardi..."` | `"...Riprova più tardi..."` |
| 25 | `errors.tillNotConfigured` | `"...non e configurato."` | `"...non è configurato."` |
| 27 | `errors.accountDisabled` | `"Il tuo account e stato disattivato."` | `"Il tuo account è stato disattivato."` |
| 28 | `errors.passwordExpired` | `"La tua password e scaduta."` | `"La tua password è scaduta."` |
| 29 | `errors.tooManyAttempts` | `"Riprova piu tardi."` | `"Riprova più tardi."` |
| 52 | `password.tooWeak` | `"La password e troppo debole. Usa una password piu forte."` | `"La password è troppo debole. Usa una password più forte."` |
| 66 | `session.timeoutWarning` | `"La tua sessione scadra tra {{minutes}} minuti."` | `"La tua sessione scadrà tra {{minutes}} minuti."` |

### `backend/locales/it/errors.json`

| Line | Key | Current | Corrected |
|------|-----|---------|-----------|
| 3 | `validation.required` | `"Questo campo e obbligatorio"` | `"Questo campo è obbligatorio"` |
| 6 | `validation.outOfRange` | `"Il valore e fuori dall'intervallo consentito"` | `"Il valore è fuori dall'intervallo consentito"` |
| 7 | `validation.duplicate` | `"Questo valore esiste gia"` | `"Questo valore esiste già"` |
| 14 | `products.duplicateName` | `"Esiste gia un prodotto con questo nome"` | `"Esiste già un prodotto con questo nome"` |
| 18 | `products.fetchFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 19 | `products.fetchOneFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 33 | `categories.duplicateName` | `"Esiste gia una categoria con questo nome"` | `"Esiste già una categoria con questo nome"` |
| 36 | `categories.fetchFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 37 | `categories.fetchOneFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 57 | `stockItems.duplicateName` | `"Esiste gia un articolo magazzino con questo nome"` | `"Esiste già un articolo magazzino con questo nome"` |
| 60 | `stockItems.invalidQuantity` | `"Valore quantita non valido"` | `"Valore quantità non valido"` |
| 62 | `stockItems.fetchFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 63 | `stockItems.fetchOneFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 71 | `stockItems.cannotDeleteInUse` | `"...E attualmente utilizzato..."` | `"...È attualmente utilizzato..."` |
| 73 | `stockItems.fetchOrphanedFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 74 | `stockItems.cleanupOrphanedFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 75 | `stockItems.validateIntegrityFailed` | `"...l'integrita dei dati. Riprova piu tardi."` | `"...l'integrità dei dati. Riprova più tardi."` |
| 76 | `stockItems.purchasingUnitError` | `"Unita di acquisto..."` | `"Unità di acquisto..."` |
| 100 | `layouts.duplicateName` | `"Esiste gia un layout con questo nome"` | `"Esiste già un layout con questo nome"` |
| 102 | `layouts.fetchFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 109 | `layouts.fetchSharedFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 111 | `layouts.fetchOneSharedFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 112 | `layouts.nameRequired` | `"Il nome del layout e obbligatorio"` | `"Il nome del layout è obbligatorio"` |
| 113 | `layouts.categoryIdRequired` | `"L'ID categoria e obbligatorio"` | `"L'ID categoria è obbligatorio"` |
| 114 | `layouts.positionsRequired` | `"...e obbligatorio e non deve essere vuoto"` | `"...è obbligatorio e non deve essere vuoto"` |
| 116 | `layouts.nameCannotBeEmpty` | `"...non puo essere vuoto"` | `"...non può essere vuoto"` |
| 120 | `layouts.loadSharedFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 129 | `settings.backupFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 130 | `settings.emailConfigIncomplete` | `"...l'email e abilitata."` | `"...l'email è abilitata."` |
| 134 | `settings.invalidReceiptIssueMode` | `"Modalita emissione ricevuta non valida."` | `"Modalità emissione ricevuta non valida."` |
| 138 | `dailyClosings.alreadyExists` | `"Esiste gia una chiusura..."` | `"Esiste già una chiusura..."` |
| 148 | `rooms.duplicateName` | `"Esiste gia una sala con questo nome"` | `"Esiste già una sala con questo nome"` |
| 149 | `rooms.nameRequired` | `"Il nome e obbligatorio"` | `"Il nome è obbligatorio"` |
| 161 | `orderSessions.alreadyCompleted` | `"gia completata"` | `"già completata"` |
| 175 | `stockAdjustments.fetchOneFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 181 | `stockAdjustments.validateIntegrityFailed` | `"...l'integrita dei dati"` | `"...l'integrità dei dati"` |
| 184 | `stockAdjustments.dataIntegrityIssues` | `"...integrita dei dati rilevati"` | `"...integrità dei dati rilevati"` |
| 185 | `stockAdjustments.dataIntegrityPassed` | `"...integrita dei dati superata"` | `"...integrità dei dati superata"` |
| 188 | `consumptionReports.fetchFailed` | `"...Riprova piu tardi."` | `"...Riprova più tardi."` |
| 201 | `errorHandler.notFoundDetailed` | `"...non e stata trovata."` | `"...non è stata trovata."` |
| 202 | `errorHandler.conflictDetailed` | `"...non puo essere completata..."` | `"...non può essere completata..."` |
| 203 | `errorHandler.tooManyRequestsDetailed` | `"...riprova piu tardi."` | `"...riprova più tardi."` |
| 204 | `errorHandler.internalErrorDetailed` | `"Si e verificato un errore imprevisto. Riprova piu tardi."` | `"Si è verificato un errore imprevisto. Riprova più tardi."` |
| 205 | `errorHandler.errorOccurred` | `"Si e verificato un errore."` | `"Si è verificato un errore."` |
| 209 | `rateLimiter.writeLimitExceeded` | `"...riprova piu tardi."` | `"...riprova più tardi."` |
| 210 | `rateLimiter.rateLimitExceeded` | `"...riprova piu tardi."` | `"...riprova più tardi."` |
| 217 | `taxRates.nameRequired` | `"...e obbligatorio"` | `"...è obbligatorio"` |
| 221 | `taxRates.rateRequired` | `"L'aliquota IVA e obbligatoria"` | `"L'aliquota IVA è obbligatoria"` |

### `backend/locales/it/api.json`

| Line | Key | Current | Corrected |
|------|-----|---------|-----------|
| 8 | `success.dataIntegrityIssuesFound` | `"...integrita dei dati..."` | `"...integrità dei dati..."` |
| 9 | `success.dataIntegrityValidationPassed` | `"...integrita dei dati..."` | `"...integrità dei dati..."` |
| 10 | `success.dataIntegrityIssuesFixed` | `"...integrita dei dati..."` | `"...integrità dei dati..."` |

### `backend/locales/it/receipt.json`

| Line | Key | Current | Corrected |
|------|-----|---------|-----------|
| 27 | `legalDisclaimer` | `"Questo documento e una ricevuta fiscale valida."` | `"Questo documento è una ricevuta fiscale valida."` |

### `backend/locales/it/invoice.json`

| Line | Key | Current | Corrected |
|------|-----|---------|-----------|
| 5 | `qty` | `"Qta"` | `"Qtà"` |
| 25 | `legalDisclaimer` | `"Questo documento e una fattura valida. Il pagamento e dovuto..."` | `"Questo documento è una fattura valida. Il pagamento è dovuto..."` |

### `backend/locales/it/email.json`

| Line | Key | Current | Corrected |
|------|-----|---------|-----------|
| 5 | `receipt.body` | `"...La tua ricevuta e allegata..."` | `"...La tua ricevuta è allegata..."` |
| 15 | `receipt.disclaimer` | `"Questa email e stata inviata..."` | `"Questa email è stata inviata..."` |

### `backend/locales/it/settings.json`

| Line | Key | Current | Corrected |
|------|-----|---------|-----------|
| 3 | `business.title` | `"Informazioni Attivita"` | `"Informazioni Attività"` |
| 4 | `business.name` | `"Nome Attivita"` | `"Nome Attività"` |
| 5 | `business.namePlaceholder` | `"Inserisci nome attivita"` | `"Inserisci nome attività"` |
| 8 | `business.city` | `"Citta"` | `"Città"` |
| 9 | `business.cityPlaceholder` | `"Citta"` | `"Città"` |
| 17 | `business.emailPlaceholder` | `"attivita@esempio.com"` | `"attività@esempio.com"` |
| 20 | `business.saved` | `"...informazioni attivita salvate..."` | `"...informazioni attività salvate..."` |
| 21 | `business.saveFailed` | `"...informazioni attivita"` | `"...informazioni attività"` |
| 57 | `email.fromNamePlaceholder` | `"Nome Attivita"` | `"Nome Attività"` |
| 65 | `validation.emailRequired` | `"...e obbligatorio quando l'email e abilitata"` | `"...è obbligatorio quando l'email è abilitata"` |
| 66 | `validation.smtpHostRequired` | `"...e obbligatorio quando l'email e abilitata"` | `"...è obbligatorio quando l'email è abilitata"` |
| 67 | `validation.smtpUserRequired` | `"...e obbligatorio quando l'email e abilitata"` | `"...è obbligatorio quando l'email è abilitata"` |

---

**Report generated:** 2026-04-21
