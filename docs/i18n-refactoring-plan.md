 # i18n Refactoring Plan

## 1. Executive Summary

This document outlines a comprehensive plan for refactoring hardcoded strings to use the i18n (internationalization) system throughout the TEV2 application.

| Metric | Value |
|--------|-------|
| **Total Files to Refactor** | 98 files |
| **Total Hardcoded Strings** | 600+ |
| **Estimated Effort** | 4-6 weeks |
| **Phases** | 4 phases by priority |

### Timeline Overview

| Phase | Priority | Files | Estimated Duration |
|-------|----------|-------|-------------------|
| Phase 1 | Critical | 15 files | 1.5 weeks |
| Phase 2 | High | 25 files | 1.5 weeks |
| Phase 3 | Medium | 30 files | 1 week |
| Phase 4 | Lower | 28 files | 1 week |

### Goals

1. **Complete i18n Coverage**: All user-facing strings extracted to translation files
2. **Consistent Naming Convention**: Standardized translation key structure
3. **Bilingual Support**: Full English and Italian translations
4. **Maintainability**: Easy to add new languages or modify existing translations

---

## 2. File Categories and Priority

### Phase 1: Critical Priority (15 files)

These files have the most hardcoded strings and are core business functionality:

#### Frontend Components (Critical)

| # | File | Strings | Description |
|---|------|---------|-------------|
| 1 | [`frontend/components/TableManagement.tsx`](frontend/components/TableManagement.tsx) | 60+ | Core table management UI |
| 2 | [`frontend/components/TableContext.tsx`](frontend/components/TableContext.tsx) | 26 | Table state management |
| 3 | [`frontend/components/TableAssignmentModal.tsx`](frontend/components/TableAssignmentModal.tsx) | 26 | Table assignment dialog |
| 4 | [`frontend/components/TableLayoutEditor.tsx`](frontend/components/TableLayoutEditor.tsx) | 22 | Layout editing functionality |
| 5 | [`frontend/components/EnhancedGridLayout.tsx`](frontend/components/EnhancedGridLayout.tsx) | 22 | Grid layout system |
| 6 | [`frontend/components/InventoryManagement.tsx`](frontend/components/InventoryManagement.tsx) | 21 | Inventory management UI |
| 7 | [`frontend/components/GridControls.tsx`](frontend/components/GridControls.tsx) | 18 | Grid control components |
| 8 | [`frontend/components/TransferItemsModal.tsx`](frontend/components/TransferItemsModal.tsx) | 17 | Item transfer dialog |
| 9 | [`frontend/components/GridTemplates.tsx`](frontend/components/GridTemplates.tsx) | 16 | Grid template system |
| 10 | [`frontend/components/HelpGuide.tsx`](frontend/components/HelpGuide.tsx) | 14 | Help documentation |
| 11 | [`frontend/components/HelpSystem.tsx`](frontend/components/HelpSystem.tsx) | 14 | Help system components |
| 12 | [`frontend/components/AvailableProductsPanel.tsx`](frontend/components/AvailableProductsPanel.tsx) | 12 | Product selection panel |

#### Backend Handlers (Critical)

| # | File | Strings | Description |
|---|------|---------|-------------|
| 13 | [`backend/src/handlers/stockItems.ts`](backend/src/handlers/stockItems.ts) | 35+ | Stock item API handlers |
| 14 | [`backend/src/handlers/orderSessions.ts`](backend/src/handlers/orderSessions.ts) | 25+ | Order session management |
| 15 | [`backend/src/handlers/products.ts`](backend/src/handlers/products.ts) | 20+ | Product API handlers |

---

### Phase 2: High Priority (25 files)

#### Frontend Components (High)

| # | File | Strings | Description |
|---|------|---------|-------------|
| 16 | [`frontend/components/ProductManagement.tsx`](frontend/components/ProductManagement.tsx) | 11 | Product management UI |
| 17 | [`frontend/components/EnhancedGridCanvas.tsx`](frontend/components/EnhancedGridCanvas.tsx) | 11 | Canvas-based grid |
| 18 | [`frontend/components/TransactionHistory.tsx`](frontend/components/TransactionHistory.tsx) | 11 | Transaction history view |
| 19 | [`frontend/components/analytics/ProductPerformanceTable.tsx`](frontend/components/analytics/ProductPerformanceTable.tsx) | 11 | Analytics table |
| 20 | [`frontend/components/ManagerDashboard.tsx`](frontend/components/ManagerDashboard.tsx) | 7 | Manager dashboard |
| 21 | [`frontend/components/analytics/PaginationControls.tsx`](frontend/components/analytics/PaginationControls.tsx) | 5 | Pagination UI |
| 22 | [`frontend/components/OrderActivityHistory.tsx`](frontend/components/OrderActivityHistory.tsx) | 5 | Order activity log |
| 23 | [`frontend/components/TableErrorBoundary.tsx`](frontend/components/TableErrorBoundary.tsx) | 5 | Error boundary |
| 24 | [`frontend/components/analytics/SalesTrendChart.tsx`](frontend/components/analytics/SalesTrendChart.tsx) | 4 | Sales chart |
| 25 | [`frontend/components/ErrorPage.tsx`](frontend/components/ErrorPage.tsx) | 4 | Error page |
| 26 | [`frontend/components/ProductGrid.tsx`](frontend/components/ProductGrid.tsx) | 4 | Product grid |
| 27 | [`frontend/components/StockItemManagement.tsx`](frontend/components/StockItemManagement.tsx) | 4 | Stock item UI |
| 28 | [`frontend/components/CategoryManagement.tsx`](frontend/components/CategoryManagement.tsx) | 4 | Category management |
| 29 | [`frontend/components/DailyClosingSummaryView.tsx`](frontend/components/DailyClosingSummaryView.tsx) | 3 | Daily closing view |
| 30 | [`frontend/components/ErrorMessage.tsx`](frontend/components/ErrorMessage.tsx) | 3 | Error message component |
| 31 | [`frontend/components/VirtualKeyboard.tsx`](frontend/components/VirtualKeyboard.tsx) | 3 | Virtual keyboard |
| 32 | [`frontend/components/TillSetupScreen.tsx`](frontend/components/TillSetupScreen.tsx) | 3 | Till setup UI |
| 33 | [`frontend/components/layout/EditLayoutButton.tsx`](frontend/components/layout/EditLayoutButton.tsx) | 3 | Layout edit button |
| 34 | [`frontend/components/EnhancedGridLayoutSection.tsx`](frontend/components/EnhancedGridLayoutSection.tsx) | 3 | Grid layout section |

#### Backend Handlers (High)

| # | File | Strings | Description |
|---|------|---------|-------------|
| 35 | [`backend/src/handlers/layouts.ts`](backend/src/handlers/layouts.ts) | 18+ | Layout API handlers |
| 36 | [`backend/src/handlers/tables.ts`](backend/src/handlers/tables.ts) | 15+ | Table API handlers |
| 37 | [`backend/src/handlers/rooms.ts`](backend/src/handlers/rooms.ts) | 12+ | Room API handlers |
| 38 | [`backend/src/handlers/users.ts`](backend/src/handlers/users.ts) | 12+ | User API handlers |
| 39 | [`backend/src/handlers/stockAdjustments.ts`](backend/src/handlers/stockAdjustments.ts) | 10+ | Stock adjustment handlers |
| 40 | [`backend/src/handlers/dailyClosings.ts`](backend/src/handlers/dailyClosings.ts) | 10+ | Daily closing handlers |

---

### Phase 3: Medium Priority (30 files)

#### Frontend Components (Medium)

| # | File | Strings | Description |
|---|------|---------|-------------|
| 41 | [`frontend/components/EnhancedGridItem.tsx`](frontend/components/EnhancedGridItem.tsx) | 2 | Grid item component |
| 42 | [`frontend/components/ConfirmationModal.tsx`](frontend/components/ConfirmationModal.tsx) | 2 | Confirmation dialog |
| 43 | [`frontend/components/VirtualKeyboardToggle.tsx`](frontend/components/VirtualKeyboardToggle.tsx) | 2 | Keyboard toggle |
| 44 | [`frontend/components/layout/CategoryTabs.tsx`](frontend/components/layout/CategoryTabs.tsx) | 2 | Category tabs |

#### Frontend Services (Medium) - ALL 13 files

| # | File | Strings | Description |
|---|------|---------|-------------|
| 45 | [`frontend/services/apiBase.ts`](frontend/services/apiBase.ts) | 8 | API base service |
| 46 | [`frontend/services/tableService.ts`](frontend/services/tableService.ts) | 7 | Table service |
| 47 | [`frontend/services/inventoryService.ts`](frontend/services/inventoryService.ts) | 6 | Inventory service |
| 48 | [`frontend/services/productService.ts`](frontend/services/productService.ts) | 5 | Product service |
| 49 | [`frontend/services/orderService.ts`](frontend/services/orderService.ts) | 4 | Order service |
| 50 | [`frontend/services/analyticsService.ts`](frontend/services/analyticsService.ts) | 4 | Analytics service |
| 51 | [`frontend/services/tillService.ts`](frontend/services/tillService.ts) | 3 | Till service |
| 52 | [`frontend/services/userService.ts`](frontend/services/userService.ts) | 3 | User service |
| 53 | [`frontend/services/categoryService.ts`](frontend/services/categoryService.ts) | 2 | Category service |
| 54 | [`frontend/services/transactionService.ts`](frontend/services/transactionService.ts) | 2 | Transaction service |
| 55 | [`frontend/services/settingsService.ts`](frontend/services/settingsService.ts) | 1 | Settings service |
| 56 | [`frontend/services/roomService.ts`](frontend/services/roomService.ts) | 1 | Room service |
| 57 | [`frontend/services/layoutService.ts`](frontend/services/layoutService.ts) | 1 | Layout service |

#### Frontend Contexts (Medium) - ALL 8 files

| # | File | Strings | Description |
|---|------|---------|-------------|
| 58 | [`frontend/contexts/PaymentContext.tsx`](frontend/contexts/PaymentContext.tsx) | 12 | Payment state context |
| 59 | [`frontend/contexts/GlobalDataContext.tsx`](frontend/contexts/GlobalDataContext.tsx) | 8 | Global data context |
| 60 | [`frontend/contexts/OrderContext.tsx`](frontend/contexts/OrderContext.tsx) | 6 | Order state context |
| 61 | [`frontend/contexts/TabManagementContext.tsx`](frontend/contexts/TabManagementContext.tsx) | 5 | Tab management context |
| 62 | [`frontend/contexts/AuthContext.tsx`](frontend/contexts/AuthContext.tsx) | 3 | Authentication context |
| 63 | [`frontend/contexts/ToastContext.tsx`](frontend/contexts/ToastContext.tsx) | 2 | Toast notification context |
| 64 | [`frontend/contexts/ThemeContext.tsx`](frontend/contexts/ThemeContext.tsx) | 1 | Theme context |
| 65 | [`frontend/contexts/SettingsContext.tsx`](frontend/contexts/SettingsContext.tsx) | 1 | Settings context |

#### Backend Handlers (Medium)

| # | File | Strings | Description |
|---|------|---------|-------------|
| 66 | [`backend/src/handlers/tabs.ts`](backend/src/handlers/tabs.ts) | 10+ | Tab API handlers |
| 67 | [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts) | 8+ | Transaction handlers |
| 68 | [`backend/src/handlers/tills.ts`](backend/src/handlers/tills.ts) | 8+ | Till API handlers |
| 69 | [`backend/src/handlers/orderActivityLogs.ts`](backend/src/handlers/orderActivityLogs.ts) | 6+ | Order activity handlers |
| 70 | [`backend/src/handlers/categories.ts`](backend/src/handlers/categories.ts) | 6+ | Category API handlers |

---

### Phase 4: Lower Priority (28 files)

#### Frontend Components (Lower)

| # | File | Strings | Description |
|---|------|---------|-------------|
| 71 | [`frontend/components/analytics/HourlySalesChart.tsx`](frontend/components/analytics/HourlySalesChart.tsx) | 1 | Hourly sales chart |
| 72 | [`frontend/components/ExpandedTopSellingProducts.tsx`](frontend/components/ExpandedTopSellingProducts.tsx) | 1 | Top products view |
| 73 | [`frontend/components/LoadingOverlay.tsx`](frontend/components/LoadingOverlay.tsx) | 1 | Loading overlay |
| 74 | [`frontend/components/LoginScreen.tsx`](frontend/components/LoginScreen.tsx) | 1 | Login screen (partial) |
| 75 | [`frontend/components/ProductGridItem.tsx`](frontend/components/ProductGridItem.tsx) | 1 | Product grid item |
| 76 | [`frontend/components/PaymentModal.tsx`](frontend/components/PaymentModal.tsx) | 1 | Payment modal (partial) |
| 77 | [`frontend/components/Toast.tsx`](frontend/components/Toast.tsx) | 1 | Toast component |
| 78 | [`frontend/components/LanguageSwitcher.tsx`](frontend/components/LanguageSwitcher.tsx) | 1 | Language switcher (partial) |
| 79 | [`frontend/components/VirtualKeyboardContext.tsx`](frontend/components/VirtualKeyboardContext.tsx) | 1 | Keyboard context |
| 80 | [`frontend/components/TabManager.tsx`](frontend/components/TabManager.tsx) | 1 | Tab manager (partial) |
| 81 | [`frontend/components/UserPerformanceReportModal.tsx`](frontend/components/UserPerformanceReportModal.tsx) | 1 | User report modal (partial) |
| 82 | [`frontend/components/OrderPanel.tsx`](frontend/components/OrderPanel.tsx) | 2 | Order panel (partial) |
| 83 | [`frontend/components/TillManagement.tsx`](frontend/components/TillManagement.tsx) | 2 | Till management (partial) |

#### Backend Handlers (Lower)

| # | File | Strings | Description |
|---|------|---------|-------------|
| 84 | [`backend/src/handlers/consumptionReports.ts`](backend/src/handlers/consumptionReports.ts) | 5+ | Consumption report handlers |
| 85 | [`backend/src/handlers/settings.ts`](backend/src/handlers/settings.ts) | 4+ | Settings API handlers |
| 86 | [`backend/src/handlers/analytics.ts`](backend/src/handlers/analytics.ts) | 3+ | Analytics API handlers |

#### Backend Middleware (Lower) - ALL 5 files

| # | File | Strings | Description |
|---|------|---------|-------------|
| 87 | [`backend/src/middleware/errorHandler.ts`](backend/src/middleware/errorHandler.ts) | 15 | Error handling middleware |
| 88 | [`backend/src/middleware/auth.ts`](backend/src/middleware/auth.ts) | 8 | Authentication middleware |
| 89 | [`backend/src/middleware/authorization.ts`](backend/src/middleware/authorization.ts) | 7 | Authorization middleware |
| 90 | [`backend/src/middleware/rateLimiter.ts`](backend/src/middleware/rateLimiter.ts) | 5 | Rate limiting middleware |
| 91 | [`backend/src/middleware/responseSanitizer.ts`](backend/src/middleware/responseSanitizer.ts) | 2 | Response sanitization |

#### Additional Files (Lower)

| # | File | Strings | Description |
|---|------|---------|-------------|
| 92-98 | Various utility and remaining files | 7+ | Remaining partial implementations |

---

## 3. Subtask Template

For each file, create a subtask with this format:

```markdown
### Subtask: [filename]
**File:** `[path/to/file]`
**Priority:** [Critical/High/Medium/Lower]
**Hardcoded Strings:** [count]
**Status:** [ ] Pending

**Task:**
1. Identify all hardcoded strings in the file
2. Create appropriate translation keys in the relevant locale files
3. Replace hardcoded strings with i18n function calls
4. Ensure both English and Italian translations are provided
5. Test the changes

**Translation Key Naming Convention:**
- Frontend: `t('[component].[key]')` e.g., `t('tableManagement.saveButton')`
- Backend: `t('[handler].[key]')` e.g., `t('stockItems.notFound')`

**Example Before:**
```typescript
const errorMessage = "Item not found";
```

**Example After:**
```typescript
const errorMessage = t('stockItems.notFound');
```

**Locale File Entry (en):**
```json
{
  "stockItems": {
    "notFound": "Item not found"
  }
}
```

**Locale File Entry (it):**
```json
{
  "stockItems": {
    "notFound": "Articolo non trovato"
  }
}
```
```

---

## 4. Implementation Guidelines

### For Frontend Components

1. **Import the hook:**
   ```typescript
   import { useTranslation } from 'react-i18next';
   ```

2. **Initialize in component:**
   ```typescript
   const { t } = useTranslation();
   ```

3. **Replace strings:**
   ```typescript
   // Before
   <button>Save Changes</button>
   
   // After
   <button>{t('common.saveChanges')}</button>
   ```

4. **For JSX attributes:**
   ```typescript
   // Before
   <input placeholder="Enter name" />
   
   // After
   <input placeholder={t('form.enterName')} />
   ```

### For Frontend Services

1. **Import i18n instance directly:**
   ```typescript
   import i18n from '../i18n';
   ```

2. **Use in service functions:**
   ```typescript
   // Before
   throw new Error('Failed to fetch data');
   
   // After
   throw new Error(i18n.t('services.dataFetchFailed'));
   ```

### For Frontend Contexts

1. **Same as components - use `useTranslation` hook:**
   ```typescript
   import { useTranslation } from 'react-i18next';
   
   const MyContext: React.FC<MyContextProps> = ({ children }) => {
     const { t } = useTranslation();
     // ... use t() throughout
   };
   ```

### For Backend Handlers

1. **Use existing i18n infrastructure:**
   ```typescript
   import { t } from '../i18n';
   ```

2. **Replace error messages:**
   ```typescript
   // Before
   return res.status(404).json({ error: 'Item not found' });
   
   // After
   return res.status(404).json({ error: t('stockItems.notFound') });
   ```

### For Backend Middleware

1. **Same as handlers:**
   ```typescript
   import { t } from '../i18n';
   
   // Use in error responses
   return res.status(401).json({ error: t('auth.unauthorized') });
   ```

---

## 5. Translation File Structure

### Frontend (`frontend/public/locales/`)

```
frontend/public/locales/
├── en/
│   ├── common.json      # Common UI strings (buttons, labels, etc.)
│   ├── errors.json      # Error messages
│   ├── tables.json      # Table management strings
│   ├── inventory.json   # Inventory management strings
│   ├── products.json    # Product management strings
│   ├── orders.json      # Order-related strings
│   ├── analytics.json   # Analytics dashboard strings
│   └── settings.json    # Settings page strings
└── it/
    ├── common.json      # Italian common strings
    ├── errors.json      # Italian error messages
    ├── tables.json      # Italian table strings
    ├── inventory.json   # Italian inventory strings
    ├── products.json    # Italian product strings
    ├── orders.json      # Italian order strings
    ├── analytics.json   # Italian analytics strings
    └── settings.json    # Italian settings strings
```

### Backend (`backend/locales/`)

```
backend/locales/
├── en/
│   ├── api.json         # API response messages
│   ├── errors.json      # Error messages
│   └── common.json      # Common backend strings
└── it/
    ├── api.json         # Italian API messages
    ├── errors.json      # Italian error messages
    └── common.json      # Italian common strings
```

### Translation Key Structure

**Frontend Key Hierarchy:**
```
[namespace].[component].[element].[state?]

Examples:
- common.buttons.save
- common.buttons.cancel
- tables.management.title
- tables.management.saveButton
- errors.network.timeout
- errors.validation.required
```

**Backend Key Hierarchy:**
```
[handler].[action].[status?]

Examples:
- stockItems.create.success
- stockItems.notFound
- auth.login.invalidCredentials
- validation.requiredField
```

---

## 6. Complete File List with Subtask Numbers

### Summary Table

| Subtask # | File Path | Priority | Strings | Status |
|-----------|-----------|----------|---------|--------|
| **Phase 1 - Critical** |
| 001 | `frontend/components/TableManagement.tsx` | Critical | 60+ | [x] Completed |
| 002 | `frontend/components/TableContext.tsx` | Critical | 26 | [x] Completed |
| 003 | `frontend/components/TableAssignmentModal.tsx` | Critical | 26 | [x] Completed |
| 004 | `frontend/components/TableLayoutEditor.tsx` | Critical | 22 | [x] Completed |
| 005 | `frontend/components/EnhancedGridLayout.tsx` | Critical | 22 | [x] Completed |
| 006 | `frontend/components/InventoryManagement.tsx` | Critical | 21 | [x] Completed |
| 007 | `frontend/components/GridControls.tsx` | Critical | 18 | [x] Completed |
| 008 | `frontend/components/TransferItemsModal.tsx` | Critical | 17 | [x] Completed |
| 009 | `frontend/components/GridTemplates.tsx` | Critical | 16 | [x] Completed |
| 010 | `frontend/components/HelpGuide.tsx` | Critical | 14 | [x] Completed |
| 011 | `frontend/components/HelpSystem.tsx` | Critical | 14 | [x] Completed |
| 012 | `frontend/components/AvailableProductsPanel.tsx` | Critical | 12 | [x] Completed |
| 013 | `backend/src/handlers/stockItems.ts` | Critical | 35+ | [x] Completed |
| 014 | `backend/src/handlers/orderSessions.ts` | Critical | 25+ | [x] Completed |
| 015 | `backend/src/handlers/products.ts` | Critical | 20+ | [x] Completed |
| **Phase 2 - High** |
| 016 | `frontend/components/ProductManagement.tsx` | High | 11 | [x] Completed |
| 017 | `frontend/components/EnhancedGridCanvas.tsx` | High | 11 | [x] Completed |
| 018 | `frontend/components/TransactionHistory.tsx` | High | 11 | [x] Completed |
| 019 | `frontend/components/analytics/ProductPerformanceTable.tsx` | High | 11 | [x] Completed |
| 020 | `frontend/components/ManagerDashboard.tsx` | High | 7 | [x] Completed |
| 021 | `frontend/components/analytics/PaginationControls.tsx` | High | 5 | [x] Completed |
| 022 | `frontend/components/OrderActivityHistory.tsx` | High | 5 | [x] Completed |
| 023 | `frontend/components/TableErrorBoundary.tsx` | High | 5 | [x] Completed |
| 024 | `frontend/components/analytics/SalesTrendChart.tsx` | High | 4 | [x] Completed |
| 025 | `frontend/components/ErrorPage.tsx` | High | 4 | [x] Completed |
| 026 | `frontend/components/ProductGrid.tsx` | High | 4 | [x] Completed |
| 027 | `frontend/components/StockItemManagement.tsx` | High | 4 | [x] Completed |
| 028 | `frontend/components/CategoryManagement.tsx` | High | 4 | [x] Completed |
| 029 | `frontend/components/DailyClosingSummaryView.tsx` | High | 3 | [x] Completed |
| 030 | `frontend/components/ErrorMessage.tsx` | High | 3 | [x] Completed |
| 031 | `frontend/components/VirtualKeyboard.tsx` | High | 3 | [x] Completed |
| 032 | `frontend/components/TillSetupScreen.tsx` | High | 3 | [x] Completed |
| 033 | `frontend/components/layout/EditLayoutButton.tsx` | High | 3 | [N/A] File not found |
| 034 | `frontend/components/EnhancedGridLayoutSection.tsx` | High | 3 | [x] Completed |
| 035 | `backend/src/handlers/layouts.ts` | High | 18+ | [x] Completed |
| 036 | `backend/src/handlers/tables.ts` | High | 15+ | [x] Completed |
| 037 | `backend/src/handlers/rooms.ts` | High | 12+ | [x] Completed |
| 038 | `backend/src/handlers/users.ts` | High | 12+ | [x] Completed |
| 039 | `backend/src/handlers/stockAdjustments.ts` | High | 10+ | [x] Completed |
| 040 | `backend/src/handlers/dailyClosings.ts` | High | 10+ | [x] Completed |
| **Phase 3 - Medium** |
| 041 | `frontend/components/EnhancedGridItem.tsx` | Medium | 2 | [x] Completed |
| 042 | `frontend/components/ConfirmationModal.tsx` | Medium | 2 | [x] Completed |
| 043 | `frontend/components/VirtualKeyboardToggle.tsx` | Medium | 2 | [x] Completed |
| 044 | `frontend/components/layout/CategoryTabs.tsx` | Medium | 2 | [x] Completed (already i18n-compliant) |
| 045 | `frontend/services/apiBase.ts` | Medium | 8 | [x] Completed |
| 046 | `frontend/services/tableService.ts` | Medium | 7 | [x] Completed |
| 047 | `frontend/services/inventoryService.ts` | Medium | 6 | [x] Completed |
| 048 | `frontend/services/productService.ts` | Medium | 5 | [x] Completed |
| 049 | `frontend/services/orderService.ts` | Medium | 4 | [x] Completed |
| 050 | `frontend/services/analyticsService.ts` | Medium | 4 | [x] Completed (no hardcoded strings found) |
| 051 | `frontend/services/tillService.ts` | Medium | 3 | [x] Completed |
| 052 | `frontend/services/userService.ts` | Medium | 3 | [x] Completed |
| 053 | `frontend/services/categoryService.ts` | Medium | 2 | [x] Completed (N/A - file doesn't exist; category functions are in productService.ts which was completed in subtask 048) |
| 054 | `frontend/services/transactionService.ts` | Medium | 2 | [x] Completed |
| 055 | `frontend/services/settingsService.ts` | Medium | 1 | [x] Completed |
| 056 | `frontend/services/roomService.ts` | Medium | 1 | [x] Completed (N/A - file doesn't exist; room functions are in tableService.ts which was completed in subtask 046) |
| 057 | `frontend/services/layoutService.ts` | Medium | 1 | [x] Completed |
| 058 | `frontend/contexts/PaymentContext.tsx` | Medium | 12 | [x] Completed |
| 059 | `frontend/contexts/GlobalDataContext.tsx` | Medium | 8 | [x] Completed |
| 060 | `frontend/contexts/OrderContext.tsx` | Medium | 6 | [x] Completed |
| 061 | `frontend/contexts/TabManagementContext.tsx` | Medium | 5 | [x] Completed |
| 062 | `frontend/contexts/AuthContext.tsx` | Medium | 3 | [x] N/A - File doesn't exist; authentication is handled by SessionContext.tsx |
| 063 | `frontend/contexts/ToastContext.tsx` | Medium | 2 | [x] Completed |
| 064 | `frontend/contexts/ThemeContext.tsx` | Medium | 1 | [x] N/A - File doesn't exist |
| 065 | `frontend/contexts/SettingsContext.tsx` | Medium | 1 | [x] N/A - File doesn't exist |
| 066 | `backend/src/handlers/tabs.ts` | Medium | 10+ | [x] Completed |
| 067 | `backend/src/handlers/transactions.ts` | Medium | 8+ | [x] Completed |
| 068 | `backend/src/handlers/tills.ts` | Medium | 8+ | [x] Completed |
| 069 | `backend/src/handlers/orderActivityLogs.ts` | Medium | 6+ | [x] Completed |
| 070 | `backend/src/handlers/categories.ts` | Medium | 6+ | [x] Completed |
| **Phase 4 - Lower** |
| 071 | `frontend/components/analytics/HourlySalesChart.tsx` | Lower | 1 | [x] Completed |
| 072 | `frontend/components/ExpandedTopSellingProducts.tsx` | Lower | 1 | [x] Completed |
| 073 | `frontend/components/LoadingOverlay.tsx` | Lower | 1 | [x] Completed |
| 074 | `frontend/components/LoginScreen.tsx` | Lower | 1 | [x] Completed |
| 075 | `frontend/components/ProductGridItem.tsx` | Lower | 1 | [x] Completed (already i18n-compliant - no changes needed) |
| 076 | `frontend/components/PaymentModal.tsx` | Lower | 1 | [x] Completed |
| 077 | `frontend/components/Toast.tsx` | Lower | 1 | [x] Completed |
| 078 | `frontend/components/LanguageSwitcher.tsx` | Lower | 1 | [x] Completed |
| 079 | `frontend/components/VirtualKeyboardContext.tsx` | Lower | 1 | [x] Completed |
| 080 | `frontend/components/TabManager.tsx` | Lower | 1 | [x] Completed |
| 081 | `frontend/components/UserPerformanceReportModal.tsx` | Lower | 1 | [x] Completed |
| 082 | `frontend/components/OrderPanel.tsx` | Lower | 2 | [x] Completed |
| 083 | `frontend/components/TillManagement.tsx` | Lower | 2 | [x] Completed |
| 084 | `backend/src/handlers/consumptionReports.ts` | Lower | 5+ | [x] Completed |
| 085 | `backend/src/handlers/settings.ts` | Lower | 4+ | [x] Completed |
| 086 | `backend/src/handlers/analytics.ts` | Lower | 3+ | [x] Completed |
| 087 | `backend/src/middleware/errorHandler.ts` | Lower | 15 | [x] Completed |
| 088 | `backend/src/middleware/auth.ts` | Lower | 8 | [x] Completed |
| 089 | `backend/src/middleware/authorization.ts` | Lower | 7 | [x] Completed |
| 090 | `backend/src/middleware/rateLimiter.ts` | Lower | 5 | [x] Completed |
| 091 | `backend/src/middleware/responseSanitizer.ts` | Lower | 2 | [ ] Pending |
| 092-098 | Additional utility/remaining files | Lower | 7+ | [ ] Pending |

---

## 7. Progress Tracking

### Phase Progress

| Phase | Total Files | Completed | In Progress | Remaining | % Complete |
|-------|-------------|-----------|-------------|-----------|------------|
| Phase 1 (Critical) | 15 | 15 | 0 | 0 | 100% |
| Phase 2 (High) | 25 | 24 | 0 | 1 | 96% |
| Phase 3 (Medium) | 30 | 30 | 0 | 0 | 100% |
| Phase 4 (Lower) | 28 | 4 | 0 | 24 | 14% |
| **Total** | **98** | **73** | **0** | **25** | **74%** |

**Note:** Phase 1 completed. Phase 2 has 18 completed frontend components, 1 file not found (EditLayoutButton.tsx), and 6 completed backend handlers (layouts.ts, tables.ts, rooms.ts, users.ts, stockAdjustments.ts, dailyClosings.ts). Only 1 file remains pending in Phase 2. Phase 3 has started with EnhancedGridItem.tsx completed (2 hardcoded strings replaced: aria-label and locked indicator), ConfirmationModal.tsx completed (2 hardcoded strings replaced, used existing buttons.confirm and buttons.cancel keys), VirtualKeyboardToggle.tsx completed (2 hardcoded strings replaced, added virtualKeyboard.enable and virtualKeyboard.disable keys), CategoryTabs.tsx completed (already i18n-compliant - no changes needed), apiBase.ts completed (9 hardcoded strings replaced, added api.* namespace with 9 keys, used direct i18n import for non-React service), tableService.ts completed (14 hardcoded strings replaced, added tableService.* namespace with 9 keys, reused api.httpError key), inventoryService.ts completed (11 hardcoded strings replaced, added inventoryService.* namespace with 10 keys, reused api.httpError key), productService.ts completed (12 hardcoded strings replaced, added productService.* namespace with 8 keys, reused api.httpError key), orderService.ts completed (14 hardcoded strings replaced, added orderService.* namespace with 10 keys, reused api.httpError key), analyticsService.ts completed (no hardcoded strings found - file only contains type definitions and API calls that delegate error handling to apiBase.ts), tillService.ts completed (6 hardcoded strings replaced, added tillService.* namespace with 4 keys, reused api.httpError key), userService.ts completed (6 hardcoded strings replaced, added userService.* namespace with 6 keys, reused api.httpError key), categoryService.ts completed (N/A - file doesn't exist; category functions are in productService.ts which was completed in subtask 048), transactionService.ts completed (8 hardcoded strings replaced, added transactionService.* namespace with 5 keys, reused api.httpError key), settingService.ts completed (3 hardcoded strings replaced, added settingService.* namespace with 2 keys, reused api.httpError key), roomService.ts completed (N/A - file doesn't exist; room functions are in tableService.ts which was completed in subtask 046), layoutService.ts completed (10 hardcoded strings replaced, added layoutService.* namespace with 10 keys, used direct i18n import for non-React service), PaymentContext.tsx completed (10 hardcoded strings replaced, added paymentContext.* namespace with 10 keys, used useTranslation hook for React context), GlobalDataContext.tsx completed (8 hardcoded strings replaced, added globalDataContext.* namespace with 7 keys, used useTranslation hook for React context), OrderContext.tsx completed (6 hardcoded strings replaced, added orderContext.* namespace with 6 keys, used useTranslation hook for React context), TabManagementContext.tsx completed (5 hardcoded strings replaced, added tabManagementContext.* namespace with 5 keys, used useTranslation hook for React context), AuthContext.tsx completed (N/A - file doesn't exist; authentication is handled by SessionContext.tsx), ToastContext.tsx completed (1 hardcoded string replaced, added toastContext.contextError key, used useTranslation hook for React context), ThemeContext.tsx completed (N/A - file doesn't exist), SettingsContext.tsx completed (N/A - file doesn't exist), tabs.ts completed (22 hardcoded strings replaced, added tabs.* namespace with 14 error keys and 11 log keys, used direct i18n import for backend handler), transactions.ts completed (12 hardcoded strings replaced, used existing transactions.* namespace keys including fetchFailed, notFound, fetchOneFailed, itemsMustBeArray, itemNameRequired, itemInvalidProperties, createFailed, and log keys for fetchError, fetchOneError, itemWithoutName, itemInvalidProperties, createError, used direct i18n import for backend handler), tills.ts completed (12 hardcoded strings replaced, expanded existing tills.* namespace with 6 new error keys (fetchFailed, fetchOneFailed, createFailed, updateFailed, deleteFailed, validationFailed) and 5 log keys (fetchError, fetchOneError, createError, updateError, deleteError), used direct i18n import for backend handler), orderActivityLogs.ts completed (10 hardcoded strings replaced, added orderActivityLogs.* namespace with 4 error keys (notFound, fetchFailed, fetchOneFailed, createFailed) and 4 log keys (fetchError, fetchOneError, createError, parseDetailsError), used direct i18n import for backend handler), categories.ts completed (12 hardcoded strings replaced, expanded existing categories.* namespace with 7 new error keys (fetchFailed, fetchOneFailed, createFailed, updateFailed, deleteFailedInUse, cannotDeleteWithProducts, validationFailed) and 5 log keys (fetchError, fetchOneError, createError, updateError, deleteError), used direct i18n import for backend handler).

### String Count Progress

| Category | Total Strings | Completed | Remaining | % Complete |
|----------|---------------|-----------|-----------|------------|
| Frontend Components | 350+ | 274+ | 76+ | 78% |
| Frontend Services | 47 | 90 | 0 | 100% |
| Frontend Contexts | 38 | 30 | 8 | 79% |
| Backend Handlers | 200+ | 90+ | 110+ | 45% |
| Backend Middleware | 37 | 0 | 37 | 0% |
| **Total** | **600+** | **484+** | **150+** | **79%** |

**Note:** Frontend Contexts shows 76% complete because AuthContext.tsx (3 strings), ThemeContext.tsx (1 string), and SettingsContext.tsx (1 string) do not exist as separate files. The authentication functionality is handled by SessionContext.tsx.

---

## 8. Quality Assurance Checklist

For each completed subtask, verify:

- [ ] All hardcoded strings identified and extracted
- [ ] Translation keys follow naming convention
- [ ] English translations added to locale files
- [ ] Italian translations added to locale files
- [ ] No hardcoded strings remain in the file
- [ ] Application builds without errors
- [ ] UI displays correctly in both languages
- [ ] Error messages display correctly in both languages
- [ ] No duplicate translation keys
- [ ] Code review completed

---

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Missing translations | High | Use fallback to English, implement translation validation |
| Key naming conflicts | Medium | Use strict naming convention, document all keys |
| Performance impact | Low | Lazy load translation files, cache translations |
| Breaking changes | High | Test thoroughly after each file, use feature flags |
| Incomplete coverage | Medium | Use automated detection tools, code review |

---

## 10. Dependencies

### Required Packages (Already Installed)

**Frontend:**
- `react-i18next` - React bindings for i18next
- `i18next` - Internationalization framework
- `i18next-browser-languagedetector` - Language detection

**Backend:**
- `i18next` - Internationalization framework

### Infrastructure

- Translation files in `frontend/public/locales/`
- Translation files in `backend/locales/`
- i18n configuration in `frontend/src/i18n/`
- i18n configuration in `backend/src/i18n/`

---

## 11. Next Steps

1. **Review and approve this plan**
2. **Create subtasks for Phase 1 files**
3. **Begin implementation starting with Subtask 001**
4. **Update progress tracking after each completed subtask**
5. **Conduct code review after each phase**
6. **Perform integration testing after all phases complete**

---

*Document created: 2026-02-12*
*Last updated: 2026-02-14*
*Status: In Progress - Phase 1 Completed, Phase 2 at 96% (24/25 files completed), Phase 3 at 100% (30/30 files completed), Phase 4 at 14% (4/28 files completed)*
