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
| 001 | `frontend/components/TableManagement.tsx` | Critical | 60+ | [ ] Pending |
| 002 | `frontend/components/TableContext.tsx` | Critical | 26 | [ ] Pending |
| 003 | `frontend/components/TableAssignmentModal.tsx` | Critical | 26 | [ ] Pending |
| 004 | `frontend/components/TableLayoutEditor.tsx` | Critical | 22 | [ ] Pending |
| 005 | `frontend/components/EnhancedGridLayout.tsx` | Critical | 22 | [ ] Pending |
| 006 | `frontend/components/InventoryManagement.tsx` | Critical | 21 | [ ] Pending |
| 007 | `frontend/components/GridControls.tsx` | Critical | 18 | [ ] Pending |
| 008 | `frontend/components/TransferItemsModal.tsx` | Critical | 17 | [ ] Pending |
| 009 | `frontend/components/GridTemplates.tsx` | Critical | 16 | [ ] Pending |
| 010 | `frontend/components/HelpGuide.tsx` | Critical | 14 | [ ] Pending |
| 011 | `frontend/components/HelpSystem.tsx` | Critical | 14 | [ ] Pending |
| 012 | `frontend/components/AvailableProductsPanel.tsx` | Critical | 12 | [ ] Pending |
| 013 | `backend/src/handlers/stockItems.ts` | Critical | 35+ | [ ] Pending |
| 014 | `backend/src/handlers/orderSessions.ts` | Critical | 25+ | [ ] Pending |
| 015 | `backend/src/handlers/products.ts` | Critical | 20+ | [ ] Pending |
| **Phase 2 - High** |
| 016 | `frontend/components/ProductManagement.tsx` | High | 11 | [ ] Pending |
| 017 | `frontend/components/EnhancedGridCanvas.tsx` | High | 11 | [ ] Pending |
| 018 | `frontend/components/TransactionHistory.tsx` | High | 11 | [ ] Pending |
| 019 | `frontend/components/analytics/ProductPerformanceTable.tsx` | High | 11 | [ ] Pending |
| 020 | `frontend/components/ManagerDashboard.tsx` | High | 7 | [ ] Pending |
| 021 | `frontend/components/analytics/PaginationControls.tsx` | High | 5 | [ ] Pending |
| 022 | `frontend/components/OrderActivityHistory.tsx` | High | 5 | [ ] Pending |
| 023 | `frontend/components/TableErrorBoundary.tsx` | High | 5 | [ ] Pending |
| 024 | `frontend/components/analytics/SalesTrendChart.tsx` | High | 4 | [ ] Pending |
| 025 | `frontend/components/ErrorPage.tsx` | High | 4 | [ ] Pending |
| 026 | `frontend/components/ProductGrid.tsx` | High | 4 | [x] Completed |
| 027 | `frontend/components/StockItemManagement.tsx` | High | 4 | [ ] Pending |
| 028 | `frontend/components/CategoryManagement.tsx` | High | 4 | [ ] Pending |
| 029 | `frontend/components/DailyClosingSummaryView.tsx` | High | 3 | [ ] Pending |
| 030 | `frontend/components/ErrorMessage.tsx` | High | 3 | [ ] Pending |
| 031 | `frontend/components/VirtualKeyboard.tsx` | High | 3 | [ ] Pending |
| 032 | `frontend/components/TillSetupScreen.tsx` | High | 3 | [ ] Pending |
| 033 | `frontend/components/layout/EditLayoutButton.tsx` | High | 3 | [ ] Pending |
| 034 | `frontend/components/EnhancedGridLayoutSection.tsx` | High | 3 | [ ] Pending |
| 035 | `backend/src/handlers/layouts.ts` | High | 18+ | [ ] Pending |
| 036 | `backend/src/handlers/tables.ts` | High | 15+ | [ ] Pending |
| 037 | `backend/src/handlers/rooms.ts` | High | 12+ | [ ] Pending |
| 038 | `backend/src/handlers/users.ts` | High | 12+ | [ ] Pending |
| 039 | `backend/src/handlers/stockAdjustments.ts` | High | 10+ | [ ] Pending |
| 040 | `backend/src/handlers/dailyClosings.ts` | High | 10+ | [ ] Pending |
| **Phase 3 - Medium** |
| 041 | `frontend/components/EnhancedGridItem.tsx` | Medium | 2 | [ ] Pending |
| 042 | `frontend/components/ConfirmationModal.tsx` | Medium | 2 | [ ] Pending |
| 043 | `frontend/components/VirtualKeyboardToggle.tsx` | Medium | 2 | [ ] Pending |
| 044 | `frontend/components/layout/CategoryTabs.tsx` | Medium | 2 | [ ] Pending |
| 045 | `frontend/services/apiBase.ts` | Medium | 8 | [ ] Pending |
| 046 | `frontend/services/tableService.ts` | Medium | 7 | [ ] Pending |
| 047 | `frontend/services/inventoryService.ts` | Medium | 6 | [ ] Pending |
| 048 | `frontend/services/productService.ts` | Medium | 5 | [ ] Pending |
| 049 | `frontend/services/orderService.ts` | Medium | 4 | [ ] Pending |
| 050 | `frontend/services/analyticsService.ts` | Medium | 4 | [ ] Pending |
| 051 | `frontend/services/tillService.ts` | Medium | 3 | [ ] Pending |
| 052 | `frontend/services/userService.ts` | Medium | 3 | [ ] Pending |
| 053 | `frontend/services/categoryService.ts` | Medium | 2 | [ ] Pending |
| 054 | `frontend/services/transactionService.ts` | Medium | 2 | [ ] Pending |
| 055 | `frontend/services/settingsService.ts` | Medium | 1 | [ ] Pending |
| 056 | `frontend/services/roomService.ts` | Medium | 1 | [ ] Pending |
| 057 | `frontend/services/layoutService.ts` | Medium | 1 | [ ] Pending |
| 058 | `frontend/contexts/PaymentContext.tsx` | Medium | 12 | [ ] Pending |
| 059 | `frontend/contexts/GlobalDataContext.tsx` | Medium | 8 | [ ] Pending |
| 060 | `frontend/contexts/OrderContext.tsx` | Medium | 6 | [ ] Pending |
| 061 | `frontend/contexts/TabManagementContext.tsx` | Medium | 5 | [ ] Pending |
| 062 | `frontend/contexts/AuthContext.tsx` | Medium | 3 | [ ] Pending |
| 063 | `frontend/contexts/ToastContext.tsx` | Medium | 2 | [ ] Pending |
| 064 | `frontend/contexts/ThemeContext.tsx` | Medium | 1 | [ ] Pending |
| 065 | `frontend/contexts/SettingsContext.tsx` | Medium | 1 | [ ] Pending |
| 066 | `backend/src/handlers/tabs.ts` | Medium | 10+ | [ ] Pending |
| 067 | `backend/src/handlers/transactions.ts` | Medium | 8+ | [ ] Pending |
| 068 | `backend/src/handlers/tills.ts` | Medium | 8+ | [ ] Pending |
| 069 | `backend/src/handlers/orderActivityLogs.ts` | Medium | 6+ | [ ] Pending |
| 070 | `backend/src/handlers/categories.ts` | Medium | 6+ | [ ] Pending |
| **Phase 4 - Lower** |
| 071 | `frontend/components/analytics/HourlySalesChart.tsx` | Lower | 1 | [ ] Pending |
| 072 | `frontend/components/ExpandedTopSellingProducts.tsx` | Lower | 1 | [ ] Pending |
| 073 | `frontend/components/LoadingOverlay.tsx` | Lower | 1 | [ ] Pending |
| 074 | `frontend/components/LoginScreen.tsx` | Lower | 1 | [ ] Pending |
| 075 | `frontend/components/ProductGridItem.tsx` | Lower | 1 | [ ] Pending |
| 076 | `frontend/components/PaymentModal.tsx` | Lower | 1 | [ ] Pending |
| 077 | `frontend/components/Toast.tsx` | Lower | 1 | [ ] Pending |
| 078 | `frontend/components/LanguageSwitcher.tsx` | Lower | 1 | [ ] Pending |
| 079 | `frontend/components/VirtualKeyboardContext.tsx` | Lower | 1 | [ ] Pending |
| 080 | `frontend/components/TabManager.tsx` | Lower | 1 | [ ] Pending |
| 081 | `frontend/components/UserPerformanceReportModal.tsx` | Lower | 1 | [ ] Pending |
| 082 | `frontend/components/OrderPanel.tsx` | Lower | 2 | [ ] Pending |
| 083 | `frontend/components/TillManagement.tsx` | Lower | 2 | [ ] Pending |
| 084 | `backend/src/handlers/consumptionReports.ts` | Lower | 5+ | [ ] Pending |
| 085 | `backend/src/handlers/settings.ts` | Lower | 4+ | [ ] Pending |
| 086 | `backend/src/handlers/analytics.ts` | Lower | 3+ | [ ] Pending |
| 087 | `backend/src/middleware/errorHandler.ts` | Lower | 15 | [ ] Pending |
| 088 | `backend/src/middleware/auth.ts` | Lower | 8 | [ ] Pending |
| 089 | `backend/src/middleware/authorization.ts` | Lower | 7 | [ ] Pending |
| 090 | `backend/src/middleware/rateLimiter.ts` | Lower | 5 | [ ] Pending |
| 091 | `backend/src/middleware/responseSanitizer.ts` | Lower | 2 | [ ] Pending |
| 092-098 | Additional utility/remaining files | Lower | 7+ | [ ] Pending |

---

## 7. Progress Tracking

### Phase Progress

| Phase | Total Files | Completed | In Progress | Remaining | % Complete |
|-------|-------------|-----------|-------------|-----------|------------|
| Phase 1 (Critical) | 15 | 0 | 0 | 15 | 0% |
| Phase 2 (High) | 25 | 1 | 0 | 24 | 4% |
| Phase 3 (Medium) | 30 | 0 | 0 | 30 | 0% |
| Phase 4 (Lower) | 28 | 0 | 0 | 28 | 0% |
| **Total** | **98** | **0** | **0** | **98** | **0%** |

### String Count Progress

| Category | Total Strings | Completed | Remaining | % Complete |
|----------|---------------|-----------|-----------|------------|
| Frontend Components | 350+ | 0 | 350+ | 0% |
| Frontend Services | 47 | 0 | 47 | 0% |
| Frontend Contexts | 38 | 0 | 38 | 0% |
| Backend Handlers | 200+ | 0 | 200+ | 0% |
| Backend Middleware | 37 | 0 | 37 | 0% |
| **Total** | **600+** | **0** | **600+** | **0%** |

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
*Last updated: 2026-02-12*
*Status: Draft - Pending Approval*
