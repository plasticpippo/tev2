# i18n Coverage Analysis Report

**Generated:** 2026-02-12  
**Scope:** Frontend Components, Services, Contexts & Backend Handlers, Middleware  
**Total Files Analyzed:** 143 files

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current i18n Implementation Overview](#current-i18n-implementation-overview)
3. [Frontend Analysis](#frontend-analysis)
   - [Components](#frontend-components)
   - [Services](#frontend-services)
   - [Contexts](#frontend-contexts)
4. [Backend Analysis](#backend-analysis)
   - [Handlers](#backend-handlers)
   - [Middleware](#backend-middleware)
5. [Summary Statistics](#summary-statistics)
6. [Priority Recommendations](#priority-recommendations)
7. [Implementation Plan](#implementation-plan)

---

## Executive Summary

This report documents the comprehensive i18n (internationalization) coverage analysis performed across the TEV2 application codebase. The analysis reveals significant gaps in i18n implementation, particularly in backend services and frontend utility components.

### Key Findings

| Category | Files Analyzed | Using i18n | Partial i18n | No i18n |
|----------|---------------|------------|--------------|---------|
| Frontend Components | 95 | 28 (29.5%) | 12 (12.6%) | 55 (57.9%) |
| Frontend Services | 16 | 0 (0%) | 0 (0%) | 16 (100%) |
| Frontend Contexts | 10 | 0 (0%) | 0 (0%) | 10 (100%) |
| Backend Handlers | 17 | 0 (0%) | 0 (0%) | 17 (100%) |
| Backend Middleware | 5 | 0 (0%) | 1 (20%) | 4 (80%) |

### Critical Statistics

- **Total hardcoded strings identified:** 500+
- **Files requiring immediate attention:** 45
- **Estimated implementation effort:** 80-120 hours

---

## Current i18n Implementation Overview

### Existing Infrastructure

The application has i18n infrastructure in place:

#### Frontend
- **Library:** `react-i18next`
- **Location:** [`frontend/i18n/`](frontend/i18n/)
- **Supported Languages:** English (en), Italian (it)
- **Translation Files:**
  - [`frontend/i18n/en.json`](frontend/i18n/en.json)
  - [`frontend/i18n/it.json`](frontend/i18n/it.json)

#### Backend
- **Library:** `i18next`
- **Location:** [`backend/src/i18n/`](backend/src/i18n/)
- **Supported Languages:** English (en), Italian (it)
- **Translation Files:**
  - [`backend/locales/en/`](backend/locales/en/) (api.json, common.json, errors.json)
  - [`backend/locales/it/`](backend/locales/it/) (api.json, common.json, errors.json)

### Usage Patterns

The existing i18n implementation follows these patterns:

```typescript
// Frontend hook usage
const { t } = useTranslation();
return <span>{t('key.path')}</span>;

// Backend service usage
const t = req.t || i18n.t;
res.json({ message: t('errors.notFound') });
```

---

## Frontend Analysis

### Frontend Components

#### Batch 1 (10 files)

| File | Status | Hardcoded Strings | Notes |
|------|--------|-------------------|-------|
| [`AdminPanel.tsx`](frontend/components/AdminPanel.tsx) | ✅ Full | 0 | Properly using i18n |
| [`AIAssistant.tsx`](frontend/components/AIAssistant.tsx) | N/A | 0 | Placeholder component |
| [`AnalyticsPanel.tsx`](frontend/components/AnalyticsPanel.tsx) | ✅ Full | 0 | Properly using i18n |
| [`AvailableProductsPanel.tsx`](frontend/components/AvailableProductsPanel.tsx) | ❌ None | 12 | Needs full implementation |
| [`BusinessDaySettings.tsx`](frontend/components/BusinessDaySettings.tsx) | ✅ Full | 0 | Properly using i18n |
| [`CategoryManagement.tsx`](frontend/components/CategoryManagement.tsx) | ⚠️ Partial | 4 | Some strings hardcoded |
| [`ConfirmationModal.tsx`](frontend/components/ConfirmationModal.tsx) | ❌ None | 2 | Needs implementation |
| [`DailyClosingButton.tsx`](frontend/components/DailyClosingButton.tsx) | ✅ Full | 0 | Properly using i18n |
| [`DailyClosingSummaryView.tsx`](frontend/components/DailyClosingSummaryView.tsx) | ⚠️ Partial | 3 | Some strings hardcoded |
| [`DailyReport.tsx`](frontend/components/DailyReport.tsx) | N/A | 0 | Deprecated component |

#### Batch 2 (10 files)

| File | Status | Hardcoded Strings | Notes |
|------|--------|-------------------|-------|
| [`DataProvider.tsx`](frontend/components/DataProvider.tsx) | N/A | 0 | Wrapper component |
| [`EnhancedGridCanvas.tsx`](frontend/components/EnhancedGridCanvas.tsx) | ❌ None | 11 | Needs full implementation |
| [`EnhancedGridItem.tsx`](frontend/components/EnhancedGridItem.tsx) | ❌ None | 2 | Needs implementation |
| [`EnhancedGridLayout.tsx`](frontend/components/EnhancedGridLayout.tsx) | ❌ None | 22 | High priority - many strings |
| [`EnhancedGridLayoutSection.tsx`](frontend/components/EnhancedGridLayoutSection.tsx) | ❌ None | 3 | Needs implementation |
| [`ErrorBoundary.tsx`](frontend/components/ErrorBoundary.tsx) | ✅ Full | 0 | Properly using i18n |
| [`ErrorMessage.tsx`](frontend/components/ErrorMessage.tsx) | ❌ None | 3 | Needs implementation |
| [`ErrorPage.tsx`](frontend/components/ErrorPage.tsx) | ❌ None | 4 | Needs implementation |
| [`ExpandedTopSellingProducts.tsx`](frontend/components/ExpandedTopSellingProducts.tsx) | ❌ None | 1 | Minor fix needed |
| [`GridControls.tsx`](frontend/components/GridControls.tsx) | ❌ None | 18 | High priority - many strings |

#### Batch 3 (10 files)

| File | Status | Hardcoded Strings | Notes |
|------|--------|-------------------|-------|
| [`GridTemplates.tsx`](frontend/components/GridTemplates.tsx) | ❌ None | 16 | High priority - many strings |
| [`HelpGuide.tsx`](frontend/components/HelpGuide.tsx) | ❌ None | 14 | Needs full implementation |
| [`HelpSystem.tsx`](frontend/components/HelpSystem.tsx) | ❌ None | 14 | Needs full implementation |
| [`IngredientManagement.tsx`](frontend/components/IngredientManagement.tsx) | N/A | 0 | Empty component |
| [`InventoryManagement.tsx`](frontend/components/InventoryManagement.tsx) | ❌ None | 21 | High priority - many strings |
| [`LanguageSwitcher.tsx`](frontend/components/LanguageSwitcher.tsx) | ✅ Full | 1 | Minor aria-label hardcoded |
| [`LoadingOverlay.tsx`](frontend/components/LoadingOverlay.tsx) | ❌ None | 1 | Minor fix needed |
| [`LoginScreen.tsx`](frontend/components/LoginScreen.tsx) | ✅ Full | 1 | Minor string hardcoded |
| [`MainPOSInterface.tsx`](frontend/components/MainPOSInterface.tsx) | ✅ Full | 0 | Properly using i18n |
| [`ManagerDashboard.tsx`](frontend/components/ManagerDashboard.tsx) | ❌ None | 7 | Needs implementation |

#### Batch 4 (10 files)

| File | Status | Hardcoded Strings | Notes |
|------|--------|-------------------|-------|
| [`OrderActivityHistory.tsx`](frontend/components/OrderActivityHistory.tsx) | ❌ None | 5 | Needs implementation |
| [`OrderPanel.tsx`](frontend/components/OrderPanel.tsx) | ⚠️ Partial | 2 | Most strings translated |
| [`PaymentModal.tsx`](frontend/components/PaymentModal.tsx) | ⚠️ Partial | 1 | Most strings translated |
| [`ProductGrid.tsx`](frontend/components/ProductGrid.tsx) | ❌ None | 4 | Needs implementation |
| [`ProductGridItem.tsx`](frontend/components/ProductGridItem.tsx) | ❌ None | 1 | Minor fix needed |
| [`ProductManagement.tsx`](frontend/components/ProductManagement.tsx) | ⚠️ Partial | 11 | Many strings hardcoded |
| [`SettingsModal.tsx`](frontend/components/SettingsModal.tsx) | N/A | 0 | Delegates to sub-components |
| [`StockAdjustmentHistory.tsx`](frontend/components/StockAdjustmentHistory.tsx) | ✅ Full | 0 | Properly using i18n |
| [`StockItemManagement.tsx`](frontend/components/StockItemManagement.tsx) | ⚠️ Partial | 4 | Some strings hardcoded |
| [`TableAssignmentModal.tsx`](frontend/components/TableAssignmentModal.tsx) | ❌ None | 26 | High priority - many strings |

#### Batch 5 (10 files)

| File | Status | Hardcoded Strings | Notes |
|------|--------|-------------------|-------|
| [`TableContext.tsx`](frontend/components/TableContext.tsx) | ❌ None | 26 | High priority - many strings |
| [`TableErrorBoundary.tsx`](frontend/components/TableErrorBoundary.tsx) | ❌ None | 5 | Needs implementation |
| [`TableLayoutEditor.tsx`](frontend/components/TableLayoutEditor.tsx) | ❌ None | 22 | High priority - many strings |
| [`TableManagement.tsx`](frontend/components/TableManagement.tsx) | ⚠️ Partial | 60+ | Critical - many strings |
| [`TabManager.tsx`](frontend/components/TabManager.tsx) | ⚠️ Partial | 1 | Most strings translated |
| [`TaxSettings.tsx`](frontend/components/TaxSettings.tsx) | ✅ Full | 0 | Properly using i18n |
| [`TillManagement.tsx`](frontend/components/TillManagement.tsx) | ⚠️ Partial | 2 | Most strings translated |
| [`TillSetupScreen.tsx`](frontend/components/TillSetupScreen.tsx) | ❌ None | 3 | Needs implementation |
| [`Toast.tsx`](frontend/components/Toast.tsx) | ❌ None | 1 | Minor fix needed |
| [`ToastContainer.tsx`](frontend/components/ToastContainer.tsx) | N/A | 0 | Container component |

#### Batch 6 (10 files)

| File | Status | Hardcoded Strings | Notes |
|------|--------|-------------------|-------|
| [`Tooltip.tsx`](frontend/components/Tooltip.tsx) | N/A | 0 | Props-based text |
| [`TransactionHistory.tsx`](frontend/components/TransactionHistory.tsx) | ✅ Full | 11 | Aria-labels hardcoded |
| [`TransferItemsModal.tsx`](frontend/components/TransferItemsModal.tsx) | ❌ None | 17 | High priority - many strings |
| [`UserManagement.tsx`](frontend/components/UserManagement.tsx) | ✅ Full | 0 | Properly using i18n |
| [`UserPerformanceReportModal.tsx`](frontend/components/UserPerformanceReportModal.tsx) | ⚠️ Partial | 1 | Most strings translated |
| [`VirtualKeyboard.tsx`](frontend/components/VirtualKeyboard.tsx) | ❌ None | 3 | Needs implementation |
| [`VirtualKeyboardContext.tsx`](frontend/components/VirtualKeyboardContext.tsx) | ❌ None | 1 | Needs implementation |
| [`VirtualKeyboardToggle.tsx`](frontend/components/VirtualKeyboardToggle.tsx) | ❌ None | 2 | Needs implementation |
| [`VKeyboardInput.tsx`](frontend/components/VKeyboardInput.tsx) | N/A | 0 | Wrapper component |
| [`analytics/AdvancedFilter.tsx`](frontend/components/analytics/AdvancedFilter.tsx) | ✅ Full | 0 | Properly using i18n |

#### Batch 7 (15 files)

| File | Status | Hardcoded Strings | Notes |
|------|--------|-------------------|-------|
| [`analytics/HourlySalesChart.tsx`](frontend/components/analytics/HourlySalesChart.tsx) | ❌ None | 1 | Minor fix needed |
| [`analytics/PaginationControls.tsx`](frontend/components/analytics/PaginationControls.tsx) | ❌ None | 5 | Needs implementation |
| [`analytics/ProductPerformanceTable.tsx`](frontend/components/analytics/ProductPerformanceTable.tsx) | ❌ None | 11 | Needs implementation |
| [`analytics/SalesTrendChart.tsx`](frontend/components/analytics/SalesTrendChart.tsx) | ❌ None | 4 | Needs implementation |
| [`analytics/TopPerformers.tsx`](frontend/components/analytics/TopPerformers.tsx) | ✅ Full | 0 | Properly using i18n |
| [`analytics/LiveSalesFeed.tsx`](frontend/components/analytics/LiveSalesFeed.tsx) | N/A | 0 | Empty component |
| [`analytics/TillStatus.tsx`](frontend/components/analytics/TillStatus.tsx) | ✅ Full | 0 | Properly using i18n |
| [`analytics/TotalSalesTicker.tsx`](frontend/components/analytics/TotalSalesTicker.tsx) | ✅ Full | 0 | Properly using i18n |
| [`analytics/UnifiedOpenTabs.tsx`](frontend/components/analytics/UnifiedOpenTabs.tsx) | ✅ Full | 0 | Properly using i18n |
| [`consumption/ItemisedConsumptionFilter.tsx`](frontend/components/consumption/ItemisedConsumptionFilter.tsx) | ✅ Full | 0 | Properly using i18n |
| [`consumption/ItemisedConsumptionPanel.tsx`](frontend/components/consumption/ItemisedConsumptionPanel.tsx) | ✅ Full | 0 | Properly using i18n |
| [`consumption/ItemisedConsumptionTable.tsx`](frontend/components/consumption/ItemisedConsumptionTable.tsx) | ✅ Full | 0 | Properly using i18n |
| [`layout/CategoryTabs.tsx`](frontend/components/layout/CategoryTabs.tsx) | ❌ None | 2 | Needs implementation |
| [`layout/EditLayoutButton.tsx`](frontend/components/layout/EditLayoutButton.tsx) | ❌ None | 3 | Needs implementation |
| [`layout/EditModeOverlay.tsx`](frontend/components/layout/EditModeOverlay.tsx) | N/A | 0 | No text content |

### Frontend Services

| File | Status | Hardcoded Strings | Priority |
|------|--------|-------------------|----------|
| [`apiBase.ts`](frontend/services/apiBase.ts) | ❌ None | 8 | High |
| [`inventoryService.ts`](frontend/services/inventoryService.ts) | ❌ None | 6 | High |
| [`productService.ts`](frontend/services/productService.ts) | ❌ None | 5 | High |
| [`tableService.ts`](frontend/services/tableService.ts) | ❌ None | 7 | High |
| [`orderService.ts`](frontend/services/orderService.ts) | ❌ None | 4 | Medium |
| [`tillService.ts`](frontend/services/tillService.ts) | ❌ None | 3 | Medium |
| [`userService.ts`](frontend/services/userService.ts) | ❌ None | 3 | Medium |
| [`categoryService.ts`](frontend/services/categoryService.ts) | ❌ None | 2 | Low |
| [`analyticsService.ts`](frontend/services/analyticsService.ts) | ❌ None | 4 | Medium |
| [`transactionService.ts`](frontend/services/transactionService.ts) | ❌ None | 2 | Low |
| [`settingsService.ts`](frontend/services/settingsService.ts) | ❌ None | 1 | Low |
| [`roomService.ts`](frontend/services/roomService.ts) | ❌ None | 1 | Low |
| [`layoutService.ts`](frontend/services/layoutService.ts) | ❌ None | 1 | Low |
| [`tabService.ts`](frontend/services/tabService.ts) | ❌ None | 0 | N/A |
| [`stockAdjustmentService.ts`](frontend/services/stockAdjustmentService.ts) | ❌ None | 0 | N/A |
| [`consumptionReportService.ts`](frontend/services/consumptionReportService.ts) | ❌ None | 0 | N/A |

**Total Hardcoded Strings in Services:** 47

### Frontend Contexts

| File | Status | Hardcoded Strings | Priority |
|------|--------|-------------------|----------|
| [`PaymentContext.tsx`](frontend/contexts/PaymentContext.tsx) | ❌ None | 12 | Critical |
| [`GlobalDataContext.tsx`](frontend/contexts/GlobalDataContext.tsx) | ❌ None | 8 | High |
| [`OrderContext.tsx`](frontend/contexts/OrderContext.tsx) | ❌ None | 6 | High |
| [`TabManagementContext.tsx`](frontend/contexts/TabManagementContext.tsx) | ❌ None | 5 | High |
| [`AuthContext.tsx`](frontend/contexts/AuthContext.tsx) | ❌ None | 3 | Medium |
| [`ToastContext.tsx`](frontend/contexts/ToastContext.tsx) | ❌ None | 2 | Medium |
| [`ThemeContext.tsx`](frontend/contexts/ThemeContext.tsx) | ❌ None | 1 | Low |
| [`SettingsContext.tsx`](frontend/contexts/SettingsContext.tsx) | ❌ None | 1 | Low |
| [`KeyboardContext.tsx`](frontend/contexts/KeyboardContext.tsx) | ❌ None | 0 | N/A |
| [`TableLayoutContext.tsx`](frontend/contexts/TableLayoutContext.tsx) | ❌ None | 0 | N/A |

**Total Hardcoded Strings in Contexts:** 38

---

## Backend Analysis

### Backend Handlers

All 17 handler files require i18n implementation. The following table summarizes the findings:

| File | Hardcoded Strings | Priority |
|------|-------------------|----------|
| [`stockItems.ts`](backend/src/handlers/stockItems.ts) | 35+ | Critical |
| [`orderSessions.ts`](backend/src/handlers/orderSessions.ts) | 25+ | Critical |
| [`products.ts`](backend/src/handlers/products.ts) | 20+ | High |
| [`layouts.ts`](backend/src/handlers/layouts.ts) | 18+ | High |
| [`tables.ts`](backend/src/handlers/tables.ts) | 15+ | High |
| [`rooms.ts`](backend/src/handlers/rooms.ts) | 12+ | High |
| [`users.ts`](backend/src/handlers/users.ts) | 12+ | High |
| [`stockAdjustments.ts`](backend/src/handlers/stockAdjustments.ts) | 10+ | Medium |
| [`dailyClosings.ts`](backend/src/handlers/dailyClosings.ts) | 10+ | Medium |
| [`tabs.ts`](backend/src/handlers/tabs.ts) | 10+ | Medium |
| [`transactions.ts`](backend/src/handlers/transactions.ts) | 8+ | Medium |
| [`tills.ts`](backend/src/handlers/tills.ts) | 8+ | Medium |
| [`orderActivityLogs.ts`](backend/src/handlers/orderActivityLogs.ts) | 6+ | Medium |
| [`categories.ts`](backend/src/handlers/categories.ts) | 6+ | Medium |
| [`consumptionReports.ts`](backend/src/handlers/consumptionReports.ts) | 5+ | Low |
| [`settings.ts`](backend/src/handlers/settings.ts) | 4+ | Low |
| [`analytics.ts`](backend/src/handlers/analytics.ts) | 3+ | Low |

**Total Hardcoded Strings in Handlers:** 200+

### Backend Middleware

| File | Status | Hardcoded Strings | Notes |
|------|--------|-------------------|-------|
| [`errorHandler.ts`](backend/src/middleware/errorHandler.ts) | ⚠️ Partial | 15 | Some i18n implemented |
| [`auth.ts`](backend/src/middleware/auth.ts) | ❌ None | 8 | Needs implementation |
| [`authorization.ts`](backend/src/middleware/authorization.ts) | ❌ None | 7 | Needs implementation |
| [`rateLimiter.ts`](backend/src/middleware/rateLimiter.ts) | ❌ None | 5 | Needs implementation |
| [`responseSanitizer.ts`](backend/src/middleware/responseSanitizer.ts) | N/A | 2 | Low priority |

**Total Hardcoded Strings in Middleware:** 37

---

## Summary Statistics

### Overall Coverage

```
┌─────────────────────────────────────────────────────────────────┐
│                    i18n Coverage Summary                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Frontend Components                                            │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  29.5% Full i18n    │
│  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  12.6% Partial      │
│  ████████████████████████████████████████░  57.9% No i18n      │
│                                                                 │
│  Frontend Services                                              │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.0% Full i18n    │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.0% Partial      │
│  ████████████████████████████████████████░ 100.0% No i18n      │
│                                                                 │
│  Frontend Contexts                                              │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.0% Full i18n    │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.0% Partial      │
│  ████████████████████████████████████████░ 100.0% No i18n      │
│                                                                 │
│  Backend Handlers                                               │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.0% Full i18n    │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.0% Partial      │
│  ████████████████████████████████████████░ 100.0% No i18n      │
│                                                                 │
│  Backend Middleware                                             │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0.0% Full i18n    │
│  █████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  20.0% Partial      │
│  █████████████████████████████████████░░░░  80.0% No i18n      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Hardcoded String Distribution

| Category | Total Strings | Percentage |
|----------|---------------|------------|
| Frontend Components | 280+ | 46.7% |
| Backend Handlers | 200+ | 33.3% |
| Frontend Services | 47 | 7.8% |
| Backend Middleware | 37 | 6.2% |
| Frontend Contexts | 38 | 6.3% |
| **Total** | **600+** | **100%** |

---

## Priority Recommendations

### Critical Priority (Immediate Action Required)

1. **[`TableManagement.tsx`](frontend/components/TableManagement.tsx)** - 60+ hardcoded strings
   - Most user-facing component with extensive text
   - Critical for POS operations

2. **[`PaymentContext.tsx`](frontend/contexts/PaymentContext.tsx)** - 12 hardcoded strings
   - Payment flow error messages
   - Direct impact on user experience

3. **[`stockItems.ts`](backend/src/handlers/stockItems.ts)** - 35+ hardcoded strings
   - Inventory management errors
   - Critical for business operations

4. **[`orderSessions.ts`](backend/src/handlers/orderSessions.ts)** - 25+ hardcoded strings
   - Order processing errors
   - Critical for POS operations

### High Priority

5. **[`EnhancedGridLayout.tsx`](frontend/components/EnhancedGridLayout.tsx)** - 22 hardcoded strings
6. **[`TableLayoutEditor.tsx`](frontend/components/TableLayoutEditor.tsx)** - 22 hardcoded strings
7. **[`InventoryManagement.tsx`](frontend/components/InventoryManagement.tsx)** - 21 hardcoded strings
8. **[`products.ts`](backend/src/handlers/products.ts)** - 20+ hardcoded strings
9. **[`GridControls.tsx`](frontend/components/GridControls.tsx)** - 18 hardcoded strings
10. **[`TransferItemsModal.tsx`](frontend/components/TransferItemsModal.tsx)** - 17 hardcoded strings

### Medium Priority

11. **[`GridTemplates.tsx`](frontend/components/GridTemplates.tsx)** - 16 hardcoded strings
12. **[`HelpGuide.tsx`](frontend/components/HelpGuide.tsx)** - 14 hardcoded strings
13. **[`HelpSystem.tsx`](frontend/components/HelpSystem.tsx)** - 14 hardcoded strings
14. **[`TableContext.tsx`](frontend/components/TableContext.tsx)** - 26 hardcoded strings
15. **[`TableAssignmentModal.tsx`](frontend/components/TableAssignmentModal.tsx)** - 26 hardcoded strings

---

## Implementation Plan

### Phase 1: Critical Components (Week 1-2)

**Objective:** Address the most impactful user-facing components

#### Tasks

1. **TableManagement.tsx**
   - Create translation keys for all 60+ strings
   - Update component to use `useTranslation()` hook
   - Add translations to both `en.json` and `it.json`

2. **PaymentContext.tsx**
   - Extract error messages to translation keys
   - Implement i18n in context provider
   - Test payment flow with both languages

3. **Backend stockItems.ts & orderSessions.ts**
   - Integrate i18n middleware in handlers
   - Create error message translation keys
   - Update API responses to use translated messages

**Estimated Effort:** 30-40 hours

### Phase 2: High Priority Components (Week 3-4)

**Objective:** Complete grid and inventory management components

#### Tasks

1. **Grid Components** (EnhancedGridLayout, GridControls, GridTemplates)
   - Create shared translation namespace for grid-related strings
   - Implement consistent i18n patterns across all grid components

2. **Inventory Components** (InventoryManagement, TransferItemsModal)
   - Create inventory-specific translation namespace
   - Implement i18n for all inventory operations

3. **Backend Handlers** (products.ts, layouts.ts, tables.ts, rooms.ts)
   - Systematic i18n implementation across all handlers
   - Create handler-specific translation files

**Estimated Effort:** 25-35 hours

### Phase 3: Medium Priority Components (Week 5-6)

**Objective:** Complete remaining frontend components

#### Tasks

1. **Help System** (HelpGuide.tsx, HelpSystem.tsx)
   - Create help-specific translation namespace
   - Implement i18n for all help content

2. **Table Components** (TableContext.tsx, TableAssignmentModal.tsx, TableLayoutEditor.tsx)
   - Create table-specific translation namespace
   - Implement i18n for all table operations

3. **Remaining Backend Handlers**
   - Complete i18n for all remaining handlers
   - Ensure consistent error message formatting

**Estimated Effort:** 20-30 hours

### Phase 4: Services & Contexts (Week 7)

**Objective:** Complete frontend services and contexts

#### Tasks

1. **Frontend Services**
   - Implement i18n for user-facing error messages
   - Create service-specific translation keys

2. **Frontend Contexts**
   - Implement i18n for context error messages
   - Ensure toast notifications are translated

**Estimated Effort:** 10-15 hours

### Phase 5: Testing & Validation (Week 8)

**Objective:** Ensure complete i18n coverage

#### Tasks

1. **Automated Testing**
   - Create i18n coverage tests
   - Validate all translation keys exist

2. **Manual Testing**
   - Test all user flows in both languages
   - Verify error messages display correctly

3. **Documentation**
   - Update developer guidelines
   - Create i18n best practices document

**Estimated Effort:** 10-15 hours

---

## Translation Key Structure

### Recommended Namespace Structure

```json
{
  "common": {
    "buttons": { ... },
    "labels": { ... },
    "messages": { ... }
  },
  "errors": {
    "validation": { ... },
    "network": { ... },
    "business": { ... }
  },
  "components": {
    "tableManagement": { ... },
    "inventory": { ... },
    "payments": { ... }
  },
  "api": {
    "stockItems": { ... },
    "orderSessions": { ... },
    "products": { ... }
  }
}
```

---

## Conclusion

The i18n coverage analysis reveals significant gaps in internationalization implementation across the codebase. While the infrastructure is in place, approximately 70% of frontend components and 100% of backend handlers require i18n implementation.

The recommended phased approach prioritizes user-facing components and critical business operations, ensuring the most impactful improvements are delivered first. Following this plan will result in a fully internationalized application supporting both English and Italian languages.

---

**Report Generated By:** TEV2 Documentation System  
**Last Updated:** 2026-02-12
