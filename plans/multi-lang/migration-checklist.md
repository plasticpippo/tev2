# Migration Checklist

**Project:** Bar POS Pro  
**Date:** February 2026  
**Purpose:** Detailed file-by-file migration checklist for multilanguage implementation

---

## Overview

This document provides a comprehensive checklist for migrating all hardcoded strings to the i18n translation system. Each file is listed with:
- Estimated string count
- Specific strings to extract
- Namespace recommendations
- Testing requirements

---

## Phase 0: Infrastructure Setup

### Files to Create

| File | Description | Status |
|------|-------------|--------|
| `frontend/src/i18n/index.ts` | Main i18n configuration | [ ] |
| `frontend/src/i18n/types.ts` | TypeScript declarations | [ ] |
| `frontend/src/i18n/resources.ts` | Type-safe resources | [ ] |
| `backend/src/i18n/index.ts` | Backend i18n configuration | [ ] |
| `frontend/public/locales/en/*.json` | English translation files (6 files) | [ ] |
| `frontend/public/locales/it/*.json` | Italian translation files (6 files) | [ ] |
| `backend/locales/en/*.json` | English backend translations (2 files) | [ ] |
| `backend/locales/it/*.json` | Italian backend translations (2 files) | [ ] |

### Dependencies to Install

| Package | Location | Command | Status |
|---------|----------|---------|--------|
| `i18next` | Frontend | `npm install i18next@^23.0.0` | [ ] |
| `react-i18next` | Frontend | `npm install react-i18next@^14.0.0` | [ ] |
| `i18next-browser-languagedetector` | Frontend | `npm install i18next-browser-languagedetector@^7.0.0` | [ ] |
| `i18next` | Backend | `npm install i18next@^23.0.0` | [ ] |
| `i18next-fs-backend` | Backend | `npm install i18next-fs-backend@^2.0.0` | [ ] |
| `i18next-http-middleware` | Backend | `npm install i18next-http-middleware@^3.0.0` | [ ] |

---

## Phase 1: Core Frontend Files

### 1.1 [`frontend/index.tsx`](frontend/index.tsx)

**Strings to Extract:** ~2

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Loading...` | `common:labels.loading` | common |
| `Loading translations...` | `common:labels.loading` | common |

**Changes Required:**
- [ ] Import i18n configuration
- [ ] Wrap App in Suspense with loading fallback
- [ ] Test: App loads correctly with i18n

**Code Changes:**
```typescript
// Add at top
import './i18n';

// Wrap in Suspense
<Suspense fallback={<LoadingFallback />}>
  <App />
</Suspense>
```

---

### 1.2 [`frontend/App.tsx`](frontend/App.tsx)

**Strings to Extract:** ~10

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Dashboard` | `navigation:menu.dashboard` | navigation |
| `POS` | `navigation:menu.pos` | navigation |
| `Admin` | `navigation:admin.title` | navigation |
| `Logout` | `navigation:user.logout` | navigation |
| `Settings` | `navigation:menu.settings` | navigation |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace navigation labels
- [ ] Add LanguageSwitcher component
- [ ] Test: Navigation displays correctly in both languages

---

### 1.3 [`frontend/LoginScreen.tsx`](frontend/LoginScreen.tsx)

**Strings to Extract:** ~15

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Login` | `auth:login.title` | auth |
| `Sign in to your account` | `auth:login.subtitle` | auth |
| `Username` | `auth:login.username` | auth |
| `Password` | `auth:login.password` | auth |
| `Remember me` | `auth:login.rememberMe` | auth |
| `Sign In` | `auth:login.submit` | auth |
| `Signing in...` | `auth:login.loggingIn` | auth |
| `Invalid username or password` | `auth:login.errors.invalidCredentials` | auth |
| `Username is required` | `auth:login.errors.usernameRequired` | auth |
| `Password is required` | `auth:login.errors.passwordRequired` | auth |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all form labels
- [ ] Replace error messages
- [ ] Replace button text
- [ ] Test: Login form displays correctly
- [ ] Test: Error messages display in correct language

---

### 1.4 [`frontend/components/ErrorBoundary.tsx`](frontend/components/ErrorBoundary.tsx)

**Strings to Extract:** ~5

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Something went wrong` | `errors:generic.title` | errors |
| `An unexpected error occurred` | `errors:generic.message` | errors |
| `Try again` | `common:buttons.retry` | common |
| `Go to Dashboard` | `navigation:menu.dashboard` | navigation |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace error messages
- [ ] Test: Error boundary displays correctly

---

## Phase 2: Main POS Interface

### 2.1 [`frontend/components/MainPOSInterface.tsx`](frontend/components/MainPOSInterface.tsx)

**Strings to Extract:** ~20

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Point of Sale` | `pos:title` | pos |
| `Current Order` | `pos:cart.title` | pos |
| `Cart is empty` | `pos:cart.empty` | pos |
| `Subtotal` | `pos:cart.subtotal` | pos |
| `Tax` | `pos:cart.tax` | pos |
| `Total` | `pos:cart.total` | pos |
| `Pay` | `pos:payment.title` | pos |
| `Clear` | `common:buttons.clear` | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all UI labels
- [ ] Test: POS interface displays correctly
- [ ] Test: Cart updates correctly

---

### 2.2 [`frontend/components/OrderPanel.tsx`](frontend/components/OrderPanel.tsx)

**Strings to Extract:** ~20

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Current Order` | `pos:cart.title` | pos |
| `No items` | `pos:cart.empty` | pos |
| `Qty` | `pos:cart.quantity` | pos |
| `Remove` | `common:buttons.delete` | common |
| `Add Note` | `common:placeholders.addNote` | common |
| `Subtotal` | `pos:cart.subtotal` | pos |
| `Total` | `pos:cart.total` | pos |
| `Pay Now` | `pos:payment.process` | pos |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all labels
- [ ] Handle pluralization for item count
- [ ] Test: Order panel displays correctly
- [ ] Test: Item count pluralization works

---

### 2.3 [`frontend/components/PaymentModal.tsx`](frontend/components/PaymentModal.tsx)

**Strings to Extract:** ~15

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Payment` | `pos:payment.title` | pos |
| `Cash` | `pos:payment.methods.cash` | pos |
| `Card` | `pos:payment.methods.card` | pos |
| `Amount Received` | `pos:payment.amountReceived` | pos |
| `Change` | `pos:payment.change` | pos |
| `Process Payment` | `pos:payment.process` | pos |
| `Payment successful!` | `pos:payment.success` | pos |
| `Payment failed` | `pos:payment.failed` | pos |
| `Insufficient funds` | `pos:payment.insufficientFunds` | pos |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all payment labels
- [ ] Test: Payment modal displays correctly
- [ ] Test: Payment success/failure messages

---

### 2.4 [`frontend/components/ProductGrid.tsx`](frontend/components/ProductGrid.tsx)

**Strings to Extract:** ~10

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Search products...` | `pos:products.search` | pos |
| `No products found` | `pos:products.noResults` | pos |
| `All Categories` | `pos:products.allCategories` | pos |
| `Out of Stock` | `pos:products.outOfStock` | pos |
| `Low Stock` | `pos:products.lowStock` | pos |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace search placeholder
- [ ] Replace category labels
- [ ] Test: Product grid displays correctly
- [ ] Test: Search placeholder in both languages

---

## Phase 3: Admin Panel Components

### 3.1 [`frontend/components/AdminPanel.tsx`](frontend/components/AdminPanel.tsx)

**Strings to Extract:** ~25

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Admin Panel` | `navigation:admin.title` | navigation |
| `Products` | `navigation:admin.productManagement` | navigation |
| `Categories` | `navigation:admin.categoryManagement` | navigation |
| `Users` | `navigation:admin.userManagement` | navigation |
| `Tables` | `navigation:admin.tableManagement` | navigation |
| `Tills` | `navigation:admin.tillManagement` | navigation |
| `Stock` | `navigation:admin.stockManagement` | navigation |
| `Layouts` | `navigation:admin.layoutManagement` | navigation |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all navigation labels
- [ ] Test: Admin panel navigation displays correctly

---

### 3.2 [`frontend/components/ProductManagement.tsx`](frontend/components/ProductManagement.tsx)

**Strings to Extract:** ~40

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Product Management` | `navigation:admin.productManagement` | navigation |
| `Add Product` | `common:buttons.add` | common |
| `Edit Product` | `common:buttons.edit` | common |
| `Delete Product` | `common:buttons.delete` | common |
| `Name` | `common:labels.name` | common |
| `Price` | `common:labels.price` | common |
| `Category` | `common:labels.category` | common |
| `Description` | `common:labels.description` | common |
| `Active` | `common:status.active` | common |
| `Save` | `common:buttons.save` | common |
| `Cancel` | `common:buttons.cancel` | common |
| `Are you sure you want to delete this product?` | `common:confirmation.delete` | common |
| `Product name is required` | `validation:fields.name` | validation |
| `Price must be non-negative` | `validation:fields.price` | validation |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all form labels
- [ ] Replace validation messages
- [ ] Replace confirmation messages
- [ ] Test: Product CRUD operations
- [ ] Test: Validation messages in both languages

---

### 3.3 [`frontend/components/CategoryManagement.tsx`](frontend/components/CategoryManagement.tsx)

**Strings to Extract:** ~15

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Category Management` | `navigation:admin.categoryManagement` | navigation |
| `Add Category` | `common:buttons.add` | common |
| `Name` | `common:labels.name` | common |
| `Description` | `common:labels.description` | common |
| `Save` | `common:buttons.save` | common |
| `Cancel` | `common:buttons.cancel` | common |
| `Category name is required` | `validation:fields.name` | validation |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all labels
- [ ] Test: Category CRUD operations

---

### 3.4 [`frontend/components/UserManagement.tsx`](frontend/components/UserManagement.tsx)

**Strings to Extract:** ~15

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `User Management` | `navigation:admin.userManagement` | navigation |
| `Add User` | `common:buttons.add` | common |
| `Username` | `common:labels.name` | common |
| `Password` | `auth:login.password` | auth |
| `Role` | `common:labels.type` | common |
| `Admin` | (keep as is - role name) | - |
| `Manager` | (keep as is - role name) | - |
| `Staff` | (keep as is - role name) | - |
| `Save` | `common:buttons.save` | common |
| `Cancel` | `common:buttons.cancel` | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all labels
- [ ] Test: User CRUD operations

---

### 3.5 [`frontend/components/TableManagement.tsx`](frontend/components/TableManagement.tsx)

**Strings to Extract:** ~80

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Table Management` | `navigation:admin.tableManagement` | navigation |
| `Add Table` | `common:buttons.add` | common |
| `Edit Table` | `common:buttons.edit` | common |
| `Delete Table` | `common:buttons.delete` | common |
| `Table Number` | `validation:fields.tableNumber` | validation |
| `Capacity` | `validation:fields.capacity` | validation |
| `Room` | `navigation:admin.roomManagement` | navigation |
| `Available` | `pos:tables.status.available` | pos |
| `Occupied` | `pos:tables.status.occupied` | pos |
| `Reserved` | `pos:tables.status.reserved` | pos |
| `Drag tables to rearrange` | (help text - add to common) | common |
| `Merge Tables` | `pos:tables.mergeTables` | pos |
| `Split Table` | `pos:tables.splitTable` | pos |
| `Transfer Table` | `pos:tables.transferTable` | pos |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all labels and status text
- [ ] Replace help text and tooltips
- [ ] Test: Table management operations
- [ ] Test: Status labels in both languages

---

### 3.6 [`frontend/components/TillManagement.tsx`](frontend/components/TillManagement.tsx)

**Strings to Extract:** ~15

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Till Management` | `navigation:admin.tillManagement` | navigation |
| `Open Till` | `pos:till.openTill` | pos |
| `Close Till` | `pos:till.closeTill` | pos |
| `Cash In` | `pos:till.cashIn` | pos |
| `Cash Out` | `pos:till.cashOut` | pos |
| `Opening Balance` | `pos:till.openingBalance` | pos |
| `Closing Balance` | `pos:till.closingBalance` | pos |
| `Declare Tips` | `pos:till.declareTips` | pos |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all labels
- [ ] Test: Till operations

---

## Phase 4: Supporting Components

### 4.1 [`frontend/components/SettingsModal.tsx`](frontend/components/SettingsModal.tsx)

**Strings to Extract:** ~20

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Settings` | `settings:title` | settings |
| `Language` | `settings:language.title` | settings |
| `English` | `settings:language.en` | settings |
| `Italian` | `settings:language.it` | settings |
| `Theme` | `settings:display.theme` | settings |
| `Light` | `settings:display.light` | settings |
| `Dark` | `settings:display.dark` | settings |
| `Save` | `common:buttons.save` | common |
| `Cancel` | `common:buttons.cancel` | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all labels
- [ ] Test: Settings modal displays correctly
- [ ] Test: Language switching works

---

### 4.2 [`frontend/components/TransactionHistory.tsx`](frontend/components/TransactionHistory.tsx)

**Strings to Extract:** ~20

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Transaction History` | `navigation:menu.transactions` | navigation |
| `Date` | `common:labels.date` | common |
| `Type` | `common:labels.type` | common |
| `Amount` | `common:labels.amount` | common |
| `Status` | `common:labels.status` | common |
| `Filter` | `common:buttons.filter` | common |
| `Export` | `common:buttons.export` | common |
| `No transactions found` | `common:labels.noResults` | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all labels
- [ ] Test: Transaction history displays correctly

---

### 4.3 [`frontend/components/DailyClosingSummaryView.tsx`](frontend/components/DailyClosingSummaryView.tsx)

**Strings to Extract:** ~15

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Daily Closing Summary` | `navigation:menu.dailyClosing` | navigation |
| `Date` | `common:labels.date` | common |
| `Total Sales` | `pos:till.totalSales` | pos |
| `Cash Sales` | `pos:till.cashSales` | pos |
| `Card Sales` | `pos:till.cardSales` | pos |
| `Print` | `common:buttons.print` | common |
| `Export` | `common:buttons.export` | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all labels
- [ ] Test: Daily closing displays correctly

---

### 4.4 [`frontend/components/ConfirmationModal.tsx`](frontend/components/ConfirmationModal.tsx)

**Strings to Extract:** ~5

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Confirm` | `common:buttons.confirm` | common |
| `Cancel` | `common:buttons.cancel` | common |
| `Yes` | `common:buttons.yes` | common |
| `No` | `common:buttons.no` | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace button text
- [ ] Test: Confirmation modal displays correctly

---

### 4.5 [`frontend/components/LoadingOverlay.tsx`](frontend/components/LoadingOverlay.tsx)

**Strings to Extract:** ~2

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Loading...` | `common:labels.loading` | common |
| `Processing...` | `common:buttons.processing` | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace loading text
- [ ] Test: Loading overlay displays correctly

---

## Phase 5: Dashboard Components

### 5.1 [`frontend/components/dashboard/TotalSalesTicker.tsx`](frontend/components/dashboard/TotalSalesTicker.tsx)

**Strings to Extract:** ~10

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Total Sales` | `pos:till.totalSales` | pos |
| `Today` | `common:time.today` | common |
| `This Week` | `common:time.thisWeek` | common |
| `This Month` | `common:time.thisMonth` | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace labels
- [ ] Test: Sales ticker displays correctly

---

### 5.2 [`frontend/components/dashboard/TillStatus.tsx`](frontend/components/dashboard/TillStatus.tsx)

**Strings to Extract:** ~5

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Till Status` | `pos:till.title` | pos |
| `Open` | `common:status.open` | common |
| `Closed` | `common:status.closed` | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace labels
- [ ] Test: Till status displays correctly

---

### 5.3 [`frontend/components/dashboard/LiveSalesFeed.tsx`](frontend/components/dashboard/LiveSalesFeed.tsx)

**Strings to Extract:** ~5

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Live Sales` | (add to pos namespace) | pos |
| `No recent sales` | `common:labels.noData` | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace labels
- [ ] Test: Live sales feed displays correctly

---

### 5.4 [`frontend/components/dashboard/UnifiedOpenTabs.tsx`](frontend/components/dashboard/UnifiedOpenTabs.tsx)

**Strings to Extract:** ~5

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Open Tabs` | `pos:tabs.title` | pos |
| `No open tabs` | `pos:tabs.noTabs` | pos |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace labels
- [ ] Test: Open tabs display correctly

---

## Phase 6: Analytics Components

### 6.1 [`frontend/components/analytics/TopPerformers.tsx`](frontend/components/analytics/TopPerformers.tsx)

**Strings to Extract:** ~5

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Top Performers` | (add to pos namespace) | pos |
| `No data available` | `common:labels.noData` | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace labels
- [ ] Test: Top performers display correctly

---

### 6.2 [`frontend/components/analytics/AdvancedFilter.tsx`](frontend/components/analytics/AdvancedFilter.tsx)

**Strings to Extract:** ~5

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Filter` | `common:buttons.filter` | common |
| `Apply` | `common:buttons.apply` | common |
| `Reset` | `common:buttons.reset` | common |
| `Start Date` | `common:labels.startDate` | common |
| `End Date` | `common:labels.endDate` | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace labels
- [ ] Test: Filter works correctly

---

## Phase 7: Help Components

### 7.1 [`frontend/components/HelpSystem.tsx`](frontend/components/HelpSystem.tsx)

**Strings to Extract:** ~30

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Help` | (add to common namespace) | common |
| `Getting Started` | (add to help namespace) | common |
| `Keyboard Shortcuts` | (add to help namespace) | common |
| `Close` | `common:buttons.close` | common |
| `Next` | `common:buttons.next` | common |
| `Back` | `common:buttons.back` | common |
| `Skip Tour` | `common:buttons.skip` | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all help text
- [ ] Test: Help system displays correctly

---

### 7.2 [`frontend/components/HelpGuide.tsx`](frontend/components/HelpGuide.tsx)

**Strings to Extract:** ~20

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Quick Guide` | (add to help namespace) | common |
| `Tips` | (add to help namespace) | common |

**Changes Required:**
- [ ] Import useTranslation hook
- [ ] Replace all help text
- [ ] Test: Help guide displays correctly

---

## Phase 8: Utility Functions

### 8.1 [`frontend/utils/formatting.ts`](frontend/utils/formatting.ts)

**Changes Required:**
- [ ] Import i18n instance
- [ ] Update `formatCurrency()` to use locale
- [ ] Update `formatDate()` to use locale
- [ ] Add `formatNumber()` function
- [ ] Test: Currency formatting in both languages
- [ ] Test: Date formatting in both languages

**Code Changes:**
```typescript
import i18n from '../i18n';

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return formatCurrency(0);
  }
  
  const localeMap: Record<string, string> = {
    en: 'en-IE',
    it: 'it-IT',
  };
  
  const locale = localeMap[i18n.language] || 'it-IT';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};
```

---

## Phase 9: Backend Files

### 9.1 [`backend/src/index.ts`](backend/src/index.ts)

**Changes Required:**
- [ ] Import i18next middleware
- [ ] Import i18n configuration
- [ ] Add middleware to Express app
- [ ] Test: Middleware is active

---

### 9.2 [`backend/src/middleware/errorHandler.ts`](backend/src/middleware/errorHandler.ts)

**Strings to Extract:** ~30

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Unauthorized` | `errors:unauthorized` | errors |
| `Access denied` | `errors:forbidden` | errors |
| `Not found` | `errors:notFound` | errors |
| `Validation failed` | `errors:validation.failed` | errors |
| `Internal server error` | `errors:server.internal` | errors |

**Changes Required:**
- [ ] Use `req.t()` for translations
- [ ] Map error codes to translation keys
- [ ] Test: Error messages in both languages

---

### 9.3 [`backend/src/utils/validation.ts`](backend/src/utils/validation.ts)

**Strings to Extract:** ~40

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `is required` | `errors:validation.required` | errors |
| `Invalid format` | `errors:validation.invalidFormat` | errors |
| `must be at least` | `validation:minLength` | validation |
| `must be at most` | `validation:maxLength` | validation |

**Changes Required:**
- [ ] Create `getValidationMessage()` helper
- [ ] Use `req.t()` for translations
- [ ] Test: Validation messages in both languages

---

### 9.4 Backend Handlers

#### [`backend/src/handlers/users.ts`](backend/src/handlers/users.ts)

**Strings to Extract:** ~20

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `User created successfully` | `api:users.created` | api |
| `User not found` | `api:users.notFound` | api |
| `Username already exists` | `api:users.usernameExists` | api |
| `Invalid credentials` | `errors:auth.invalidCredentials` | errors |

**Changes Required:**
- [ ] Use `req.t()` for success messages
- [ ] Use `req.t()` for error messages
- [ ] Test: User API responses in both languages

---

#### [`backend/src/handlers/products.ts`](backend/src/handlers/products.ts)

**Strings to Extract:** ~15

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Product created successfully` | `api:products.created` | api |
| `Product not found` | `api:products.notFound` | api |
| `Product updated successfully` | `api:products.updated` | api |
| `Product deleted successfully` | `api:products.deleted` | api |

**Changes Required:**
- [ ] Use `req.t()` for messages
- [ ] Test: Product API responses

---

#### [`backend/src/handlers/tables.ts`](backend/src/handlers/tables.ts)

**Strings to Extract:** ~15

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Table created successfully` | `api:tables.created` | api |
| `Table not found` | `api:tables.notFound` | api |
| `Table is occupied` | `api:tables.occupied` | api |

**Changes Required:**
- [ ] Use `req.t()` for messages
- [ ] Test: Table API responses

---

#### [`backend/src/handlers/rooms.ts`](backend/src/handlers/rooms.ts)

**Strings to Extract:** ~15

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Room created successfully` | `api:rooms.created` | api |
| `Room not found` | `api:rooms.notFound` | api |
| `Cannot delete room with tables` | `api:rooms.hasTables` | api |

**Changes Required:**
- [ ] Use `req.t()` for messages
- [ ] Test: Room API responses

---

#### [`backend/src/handlers/tills.ts`](backend/src/handlers/tills.ts)

**Strings to Extract:** ~10

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Till opened successfully` | `api:tills.opened` | api |
| `Till closed successfully` | `api:tills.closed` | api |
| `Till not found` | `api:tills.notFound` | api |

**Changes Required:**
- [ ] Use `req.t()` for messages
- [ ] Test: Till API responses

---

#### [`backend/src/handlers/transactions.ts`](backend/src/handlers/transactions.ts)

**Strings to Extract:** ~10

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Transaction recorded` | `api:transactions.created` | api |
| `Transaction not found` | `api:transactions.notFound` | api |
| `Transaction voided` | `api:transactions.voided` | api |

**Changes Required:**
- [ ] Use `req.t()` for messages
- [ ] Test: Transaction API responses

---

#### [`backend/src/handlers/categories.ts`](backend/src/handlers/categories.ts)

**Strings to Extract:** ~10

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Category created successfully` | `api:categories.created` | api |
| `Category not found` | `api:categories.notFound` | api |
| `Cannot delete category with products` | `api:categories.hasProducts` | api |

**Changes Required:**
- [ ] Use `req.t()` for messages
- [ ] Test: Category API responses

---

#### [`backend/src/handlers/dailyClosings.ts`](backend/src/handlers/dailyClosings.ts)

**Strings to Extract:** ~10

| Current String | Translation Key | Namespace |
|----------------|-----------------|-----------|
| `Daily closing created` | `api:dailyClosings.created` | api |
| `Daily closing already exists` | `api:dailyClosings.alreadyExists` | api |

**Changes Required:**
- [ ] Use `req.t()` for messages
- [ ] Test: Daily closing API responses

---

## Testing Checklist

### Frontend Testing

| Test Case | English | Italian | Status |
|-----------|---------|---------|--------|
| Login page displays correctly | [ ] | [ ] | |
| Login error messages | [ ] | [ ] | |
| Navigation labels | [ ] | [ ] | |
| POS interface labels | [ ] | [ ] | |
| Cart labels and pluralization | [ ] | [ ] | |
| Payment modal labels | [ ] | [ ] | |
| Product grid search placeholder | [ ] | [ ] | |
| Admin panel navigation | [ ] | [ ] | |
| Product management CRUD | [ ] | [ ] | |
| Category management CRUD | [ ] | [ ] | |
| User management CRUD | [ ] | [ ] | |
| Table management labels | [ ] | [ ] | |
| Settings modal labels | [ ] | [ ] | |
| Language switcher works | [ ] | [ ] | |
| Language persists on reload | [ ] | [ ] | |
| Currency formatting | [ ] | [ ] | |
| Date formatting | [ ] | [ ] | |
| Number formatting | [ ] | [ ] | |

### Backend Testing

| Test Case | English | Italian | Status |
|-----------|---------|---------|--------|
| API accepts Accept-Language header | [ ] | [ ] | |
| User API messages | [ ] | [ ] | |
| Product API messages | [ ] | [ ] | |
| Category API messages | [ ] | [ ] | |
| Table API messages | [ ] | [ ] | |
| Error messages localized | [ ] | [ ] | |
| Validation messages localized | [ ] | [ ] | |

---

## Progress Tracking

### Summary

| Phase | Files | Strings | Status |
|-------|-------|---------|--------|
| Phase 0: Infrastructure | 16 | 0 | [ ] |
| Phase 1: Core Frontend | 4 | ~32 | [ ] |
| Phase 2: Main POS | 4 | ~65 | [ ] |
| Phase 3: Admin Panel | 6 | ~175 | [ ] |
| Phase 4: Supporting | 5 | ~62 | [ ] |
| Phase 5: Dashboard | 4 | ~25 | [ ] |
| Phase 6: Analytics | 2 | ~10 | [ ] |
| Phase 7: Help | 2 | ~50 | [ ] |
| Phase 8: Utilities | 1 | N/A | [ ] |
| Phase 9: Backend | 12 | ~255 | [ ] |
| **Total** | **56** | **~674** | |

---

## Notes

1. **Priority Order**: Follow the phase order for optimal dependency management
2. **Testing**: Test each file immediately after migration
3. **Fallback**: English is the fallback language for missing translations
4. **New Strings**: Add any new strings discovered during migration to translation files
5. **Code Review**: Review each migrated file for consistency

---

*Document created as part of multilanguage implementation planning.*
