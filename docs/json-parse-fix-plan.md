# JSON.parse Error Handling Fix Plan

## Overview

This document outlines the plan to add proper error handling around `JSON.parse()` calls in backend handlers. Currently, multiple handlers parse JSON from the database without try-catch blocks, which can cause unhandled exceptions if the stored JSON is malformed.

## Problem Statement

When parsing JSON from the database without error handling:

```typescript
// Current problematic pattern
const items = typeof session.items === 'string' ? JSON.parse(session.items) : session.items;
```

If `session.items` contains malformed JSON, `JSON.parse()` throws an unhandled exception that crashes the request with a 500 error and no meaningful error message.

## Affected Files and Locations

### 1. backend/src/handlers/orderSessions.ts

| Line | Location | Current Code | Risk Level |
|------|----------|--------------|------------|
| 31 | GET /current - console.log | `JSON.parse(session.items).length` | Low (logging only) |
| 47 | GET /current - console.log | `JSON.parse(session.items).length` | Low (logging only) |
| 75 | GET /current - response parsing | `JSON.parse(orderSession.items)` | **High** (affects response) |
| 138 | POST /current - console.log | `JSON.parse(pendingLogoutSession.items).length` | Low (logging only) |
| 165 | POST /current - console.log | `JSON.parse(orderSession.items).length` | Low (logging only) |
| 272 | PUT /current/logout - console.log | `JSON.parse(orderSession.items).length` | Low (logging only) |
| 286 | PUT /current/logout - console.log | `JSON.parse(updated.items).length` | Low (logging only) |

#### Line 31 - GET /current (logging)
```typescript
// Current code
const itemsCount = typeof session.items === 'string' ? JSON.parse(session.items).length : 0;

// Fixed code
let itemsCount = 0;
if (typeof session.items === 'string') {
  try {
    itemsCount = JSON.parse(session.items).length;
  } catch (error) {
    logError('Failed to parse session items for logging', { sessionId: session.id, error });
  }
}
```

#### Line 47 - GET /current (logging)
```typescript
// Current code
const itemsCount = typeof session.items === 'string' ? JSON.parse(session.items).length : 0;

// Fixed code
let itemsCount = 0;
if (typeof session.items === 'string') {
  try {
    itemsCount = JSON.parse(session.items).length;
  } catch (error) {
    logError('Failed to parse session items for logging', { sessionId: session.id, error });
  }
}
```

#### Line 75 - GET /current (response parsing) - **HIGH PRIORITY**
```typescript
// Current code
const orderSessionWithParsedItems = {
  ...orderSession,
  items: typeof orderSession.items === 'string' ? JSON.parse(orderSession.items) : orderSession.items,
  createdAt: orderSession.createdAt.toISOString(),
  updatedAt: orderSession.updatedAt.toISOString(),
  logoutTime: orderSession.logoutTime ? orderSession.logoutTime.toISOString() : null
};

// Fixed code
let parsedItems: OrderItem[] = [];
try {
  parsedItems = typeof orderSession.items === 'string' 
    ? JSON.parse(orderSession.items) 
    : (orderSession.items || []);
} catch (error) {
  logError('Failed to parse order session items', { sessionId: orderSession.id, error });
  parsedItems = []; // Default to empty array
}

const orderSessionWithParsedItems = {
  ...orderSession,
  items: parsedItems,
  createdAt: orderSession.createdAt.toISOString(),
  updatedAt: orderSession.updatedAt.toISOString(),
  logoutTime: orderSession.logoutTime ? orderSession.logoutTime.toISOString() : null
};
```

#### Line 138 - POST /current (logging)
```typescript
// Current code
const existingItemsCount = typeof pendingLogoutSession.items === 'string' ? JSON.parse(pendingLogoutSession.items).length : 0;

// Fixed code
let existingItemsCount = 0;
if (typeof pendingLogoutSession.items === 'string') {
  try {
    existingItemsCount = JSON.parse(pendingLogoutSession.items).length;
  } catch (error) {
    logError('Failed to parse pending logout session items for logging', { sessionId: pendingLogoutSession.id, error });
  }
}
```

#### Line 165 - POST /current (logging)
```typescript
// Current code
const finalItemsCount = typeof orderSession.items === 'string' ? JSON.parse(orderSession.items).length : 0;

// Fixed code
let finalItemsCount = 0;
if (typeof orderSession.items === 'string') {
  try {
    finalItemsCount = JSON.parse(orderSession.items).length;
  } catch (error) {
    logError('Failed to parse order session items for logging', { sessionId: orderSession.id, error });
  }
}
```

#### Line 272 - PUT /current/logout (logging)
```typescript
// Current code
const itemsCount = typeof orderSession.items === 'string' ? JSON.parse(orderSession.items).length : 0;

// Fixed code
let itemsCount = 0;
if (typeof orderSession.items === 'string') {
  try {
    itemsCount = JSON.parse(orderSession.items).length;
  } catch (error) {
    logError('Failed to parse order session items for logging', { sessionId: orderSession.id, error });
  }
}
```

#### Line 286 - PUT /current/logout (logging)
```typescript
// Current code
const updatedItemsCount = typeof updated.items === 'string' ? JSON.parse(updated.items).length : 0;

// Fixed code
let updatedItemsCount = 0;
if (typeof updated.items === 'string') {
  try {
    updatedItemsCount = JSON.parse(updated.items).length;
  } catch (error) {
    logError('Failed to parse updated session items for logging', { sessionId: updated.id, error });
  }
}
```

---

### 2. backend/src/handlers/tabs.ts

| Line | Location | Current Code | Risk Level |
|------|----------|--------------|------------|
| 21 | GET / - map function | `JSON.parse(tab.items)` | **High** (affects response) |
| 51 | GET /:id - response parsing | `JSON.parse(tab.items)` | **High** (affects response) |

#### Line 21 - GET / (map function) - **HIGH PRIORITY**
```typescript
// Current code
const tabsWithParsedItems = tabs.map(tab => ({
  ...tab,
  items: typeof tab.items === 'string' ? JSON.parse(tab.items) : tab.items,
  createdAt: tab.createdAt.toISOString()
}));

// Fixed code
const tabsWithParsedItems = tabs.map(tab => {
  let parsedItems: TabItem[] = [];
  try {
    parsedItems = typeof tab.items === 'string' 
      ? JSON.parse(tab.items) 
      : (tab.items || []);
  } catch (error) {
    logError('Failed to parse tab items', { tabId: tab.id, error });
    parsedItems = []; // Default to empty array
  }
  
  return {
    ...tab,
    items: parsedItems,
    createdAt: tab.createdAt.toISOString()
  };
});
```

#### Line 51 - GET /:id (response parsing) - **HIGH PRIORITY**
```typescript
// Current code
const tabWithParsedItems = {
  ...tab,
  items: typeof tab.items === 'string' ? JSON.parse(tab.items) : tab.items,
  createdAt: tab.createdAt.toISOString()
};

// Fixed code
let parsedItems: TabItem[] = [];
try {
  parsedItems = typeof tab.items === 'string' 
    ? JSON.parse(tab.items) 
    : (tab.items || []);
} catch (error) {
  logError('Failed to parse tab items', { tabId: tab.id, error });
  parsedItems = []; // Default to empty array
}

const tabWithParsedItems = {
  ...tab,
  items: parsedItems,
  createdAt: tab.createdAt.toISOString()
};
```

---

### 3. backend/src/handlers/transactions.ts

| Line | Location | Current Code | Risk Level |
|------|----------|--------------|------------|
| 19 | GET / - map function | `JSON.parse(transaction.items)` | **High** (affects response) |
| 46 | GET /:id - response parsing | `JSON.parse(transaction.items)` | **High** (affects response) |

#### Line 19 - GET / (map function) - **HIGH PRIORITY**
```typescript
// Current code
const transactionsWithParsedItems = transactions.map(transaction => ({
  ...transaction,
  items: typeof transaction.items === 'string' ? JSON.parse(transaction.items) : transaction.items,
  createdAt: transaction.createdAt.toISOString()
}));

// Fixed code
const transactionsWithParsedItems = transactions.map(transaction => {
  let parsedItems: TransactionItem[] = [];
  try {
    parsedItems = typeof transaction.items === 'string' 
      ? JSON.parse(transaction.items) 
      : (transaction.items || []);
  } catch (error) {
    logError('Failed to parse transaction items', { transactionId: transaction.id, error });
    parsedItems = []; // Default to empty array
  }
  
  return {
    ...transaction,
    items: parsedItems,
    createdAt: transaction.createdAt.toISOString()
  };
});
```

#### Line 46 - GET /:id (response parsing) - **HIGH PRIORITY**
```typescript
// Current code
const transactionWithParsedItems = {
  ...transaction,
  items: typeof transaction.items === 'string' ? JSON.parse(transaction.items) : transaction.items,
  createdAt: transaction.createdAt.toISOString()
};

// Fixed code
let parsedItems: TransactionItem[] = [];
try {
  parsedItems = typeof transaction.items === 'string' 
    ? JSON.parse(transaction.items) 
    : (transaction.items || []);
} catch (error) {
  logError('Failed to parse transaction items', { transactionId: transaction.id, error });
  parsedItems = []; // Default to empty array
}

const transactionWithParsedItems = {
  ...transaction,
  items: parsedItems,
  createdAt: transaction.createdAt.toISOString()
};
```

---

### 4. backend/src/handlers/stockItems.ts

| Line | Location | Current Code | Risk Level |
|------|----------|--------------|------------|
| 18 | GET / - map function | `JSON.parse(item.purchasingUnits)` | **High** (affects response) |
| 49 | GET /:id - response parsing | `JSON.parse(stockItem.purchasingUnits)` | **High** (affects response) |

#### Line 18 - GET / (map function) - **HIGH PRIORITY**
```typescript
// Current code
const stockItemsWithParsedUnits = stockItems.map(item => ({
  ...item,
  purchasingUnits: typeof item.purchasingUnits === 'string' ? JSON.parse(item.purchasingUnits) : item.purchasingUnits
}));

// Fixed code
const stockItemsWithParsedUnits = stockItems.map(item => {
  let parsedUnits: PurchasingUnit[] = [];
  try {
    parsedUnits = typeof item.purchasingUnits === 'string' 
      ? JSON.parse(item.purchasingUnits) 
      : (item.purchasingUnits || []);
  } catch (error) {
    logError('Failed to parse stock item purchasing units', { stockItemId: item.id, error });
    parsedUnits = []; // Default to empty array
  }
  
  return {
    ...item,
    purchasingUnits: parsedUnits
  };
});
```

#### Line 49 - GET /:id (response parsing) - **HIGH PRIORITY**
```typescript
// Current code
const stockItemWithParsedUnits = {
  ...stockItem,
  purchasingUnits: typeof stockItem.purchasingUnits === 'string' ? JSON.parse(stockItem.purchasingUnits) : stockItem.purchasingUnits
};

// Fixed code
let parsedUnits: PurchasingUnit[] = [];
try {
  parsedUnits = typeof stockItem.purchasingUnits === 'string' 
    ? JSON.parse(stockItem.purchasingUnits) 
    : (stockItem.purchasingUnits || []);
} catch (error) {
  logError('Failed to parse stock item purchasing units', { stockItemId: stockItem.id, error });
  parsedUnits = []; // Default to empty array
}

const stockItemWithParsedUnits = {
  ...stockItem,
  purchasingUnits: parsedUnits
};
```

---

## Default Values Summary

| Data Type | Default Value | Notes |
|-----------|---------------|-------|
| OrderSession.items | `[]` (empty array) | OrderItem[] type |
| Tab.items | `[]` (empty array) | Tab items array |
| Transaction.items | `[]` (empty array) | Transaction items array |
| StockItem.purchasingUnits | `[]` (empty array) | PurchasingUnit[] type |

---

## Implementation Priority

### High Priority (Response Data)
These affect the actual API response and can cause 500 errors:

1. **orderSessions.ts line 75** - GET /current response parsing
2. **tabs.ts line 21** - GET / map function
3. **tabs.ts line 51** - GET /:id response parsing
4. **transactions.ts line 19** - GET / map function
5. **transactions.ts line 46** - GET /:id response parsing
6. **stockItems.ts line 18** - GET / map function
7. **stockItems.ts line 49** - GET /:id response parsing

### Low Priority (Logging Only)
These only affect console.log statements and won't crash the request:

1. **orderSessions.ts line 31** - Logging in GET /current
2. **orderSessions.ts line 47** - Logging in GET /current
3. **orderSessions.ts line 138** - Logging in POST /current
4. **orderSessions.ts line 165** - Logging in POST /current
5. **orderSessions.ts line 272** - Logging in PUT /current/logout
6. **orderSessions.ts line 286** - Logging in PUT /current/logout

---

## Recommended Helper Function

To reduce code duplication, consider creating a helper function:

```typescript
// backend/src/utils/jsonParser.ts

import { logError } from './logger';

/**
 * Safely parse JSON string with fallback default value
 * @param jsonString - The JSON string to parse
 * @param defaultValue - Default value to return on parse error
 * @param context - Context information for logging (e.g., { entityId: '123', entityType: 'tab' })
 * @returns Parsed value or default on error
 */
export function safeJsonParse<T>(
  jsonString: string | T,
  defaultValue: T,
  context?: { entityId?: string | number; entityType?: string }
): T {
  if (typeof jsonString !== 'string') {
    return jsonString ?? defaultValue;
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    logError('Failed to parse JSON', { ...context, error });
    return defaultValue;
  }
}
```

### Usage Example with Helper

```typescript
import { safeJsonParse } from '../utils/jsonParser';

// Before
const items = typeof tab.items === 'string' ? JSON.parse(tab.items) : tab.items;

// After
const items = safeJsonParse(tab.items, [], { entityId: tab.id, entityType: 'tab' });
```

---

## Testing Recommendations

1. **Unit Tests**: Create unit tests for the `safeJsonParse` helper function
2. **Integration Tests**: Test API endpoints with malformed JSON in the database
3. **Manual Testing**: 
   - Insert malformed JSON into test database
   - Verify API returns graceful error response instead of 500
   - Verify error is logged appropriately

---

## Implementation Checklist

- [ ] Create `safeJsonParse` helper function in `backend/src/utils/jsonParser.ts`
- [ ] Update `orderSessions.ts` - all 7 JSON.parse calls
- [ ] Update `tabs.ts` - 2 JSON.parse calls
- [ ] Update `transactions.ts` - 2 JSON.parse calls
- [ ] Update `stockItems.ts` - 2 JSON.parse calls
- [ ] Add unit tests for `safeJsonParse` helper
- [ ] Test all affected endpoints
- [ ] Verify error logging works correctly
