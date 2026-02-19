# Analytics Enhancement Analysis

## Executive Summary

This document analyzes the current analytics implementation to identify gaps and requirements for the following enhancements:
1. Ability to view hourly takings for past days
2. Support for opening hours that cross midnight (e.g., 22:00 to 05:00)
3. Ability to compare specific time ranges across different days
4. Missing "income by item" feature

---

## Current Implementation Overview

### Frontend Architecture

#### Component Hierarchy

```
AdminPanel.tsx
└── AnalyticsPanel.tsx
    ├── HourlySalesChart.tsx (only for "today" view)
    ├── SalesTrendChart.tsx (for week/month/year views)
    └── TopPerformers.tsx
        ├── AdvancedFilter.tsx
        ├── ProductPerformanceTable.tsx
        └── PaginationControls.tsx
```

#### Data Flow

```
App.tsx
  │
  ├── Fetches ALL transactions from backend
  │   └── GET /api/transactions
  │
  └── Passes to AdminPanel → AnalyticsPanel
      │
      └── Client-side filtering by date range
          │
          └── Passed to child components
```

### Backend Architecture

#### API Endpoints

| Endpoint | Purpose | Data Source |
|----------|---------|-------------|
| `GET /api/transactions` | Returns all transactions | `Transaction` table |
| `GET /api/analytics/product-performance` | Product metrics with filtering | `Transaction` + `Product` tables |
| `GET /api/analytics/top-performers` | Legacy top 5 products | `Transaction` + `Product` tables |

#### Database Schema (Relevant Models)

```prisma
model Transaction {
  id            Int      @id @default(autoincrement())
  items         Json     // Array of OrderItem
  subtotal      Float
  tax           Float
  tip           Float
  total         Float
  discount      Float    @default(0)
  discountReason String?
  status        String   @default("completed")
  paymentMethod String
  userId        Int
  userName      String
  tillId        Int
  tillName      String
  createdAt     DateTime @default(now())
  
  @@map("transactions")
}

model Settings {
  id              Int       @id @default(autoincrement())
  taxMode         String
  autoStartTime   String    // e.g., "06:00"
  lastManualClose DateTime?
  
  @@map("settings")
}

model DailyClosing {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @default(now())
  closedAt  DateTime
  summary   Json
  userId    Int
  
  @@map("daily_closings")
}
```

---

## Detailed Component Analysis

### 1. AnalyticsPanel.tsx

**Location:** [`frontend/components/AnalyticsPanel.tsx`](frontend/components/AnalyticsPanel.tsx:1)

**Current Behavior:**
- Provides 4 date range options: today, week, month, year
- For "today": uses `getBusinessDayStart(settings)` to filter transactions
- For other ranges: uses simple date subtraction (7 days, 30 days, 1 year)
- All filtering happens client-side on the full transaction list

**Key Code:**
```typescript
// Line 23-47: Client-side filtering
const filteredTransactions = useMemo(() => {
  const now = new Date();
  let startDate: Date;

  switch (dateRange) {
    case 'today':
      startDate = getBusinessDayStart(settings);
      break;
    // ... other cases use simple date math
  }

  return transactions.filter(t => new Date(t.createdAt) >= startDate);
}, [transactions, dateRange, settings]);
```

**Limitations:**
- No date picker for custom date selection
- No way to select a specific past day for hourly view
- HourlySalesChart only renders when `dateRange === 'today'`

### 2. HourlySalesChart.tsx

**Location:** [`frontend/components/analytics/HourlySalesChart.tsx`](frontend/components/analytics/HourlySalesChart.tsx:1)

**Current Behavior:**
- Displays 24 hourly bars starting from business day start hour
- Calculates hour position relative to business day start
- All processing is client-side

**Key Code:**
```typescript
// Line 15-35: Hourly data calculation
const hourlyData = useMemo(() => {
  const businessDayStart = getBusinessDayStart(settings);
  const startHour = businessDayStart.getHours();
  
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = (startHour + i) % 24;
    const label = `${hour.toString().padStart(2, '0')}:00`;
    return { label, total: 0 };
  });

  transactions.forEach(t => {
    const transactionDate = new Date(t.createdAt);
    const hoursSinceStart = Math.floor(
      (transactionDate.getTime() - businessDayStart.getTime()) / (1000 * 60 * 60)
    );
    if (hoursSinceStart >= 0 && hoursSinceStart < 24) {
      hours[hoursSinceStart].total += t.total;
    }
  });

  return hours;
}, [transactions, settings]);
```

**Limitations:**
- Hardcoded to current business day only
- No backend aggregation (all transactions must be loaded)
- No support for custom time ranges

### 3. SalesTrendChart.tsx

**Location:** [`frontend/components/analytics/SalesTrendChart.tsx`](frontend/components/analytics/SalesTrendChart.tsx:1)

**Current Behavior:**
- Groups transactions by day (week/month) or month (year)
- Generates labels for the time period
- Client-side aggregation only

**Limitations:**
- No hourly breakdown for past days
- No comparison functionality

### 4. Backend Analytics Service

**Location:** [`backend/src/services/analyticsService.ts`](backend/src/services/analyticsService.ts:1)

**Current Capabilities:**
- Aggregates product performance from transactions
- Supports date range filtering via query params
- Supports pagination and sorting

**Missing:**
- No hourly aggregation endpoint
- No time-range based aggregation
- No comparison endpoints

---

## Gap Analysis

### Gap 1: Hourly View for Past Days

**Current State:**
- HourlySalesChart only works for "today"
- No date selector to pick a specific day
- No backend endpoint for hourly data

**Required Changes:**
1. Add date picker to AnalyticsPanel
2. Create backend endpoint: `GET /api/analytics/hourly-sales?date=YYYY-MM-DD`
3. Modify HourlySalesChart to accept a target date prop
4. Add business day calculation for arbitrary dates

### Gap 2: Midnight-Crossing Business Hours

**Current State:**
- Business day logic exists in [`getBusinessDayStart()`](frontend/utils/time.ts:12)
- Settings only store `autoStartTime` (e.g., "06:00")
- No `businessDayEndHour` setting exists

**Example Scenario:**
- Bar opens at 22:00 and closes at 05:00
- Current system: business day starts at 22:00
- Problem: The 24-hour window would be 22:00-21:59, but actual hours are 22:00-05:00

**Required Changes:**
1. Add `businessDayEndHour` to Settings model
2. Create migration for new field
3. Update business day logic to handle end hour
4. Modify HourlySalesChart to show only operating hours
5. Update Settings UI to allow configuration

### Gap 3: Time Range Comparison

**Current State:**
- No comparison functionality exists
- Each view shows a single time period

**Required Changes:**
1. Add comparison mode to AnalyticsPanel
2. Create UI for selecting comparison periods
3. Add backend support for comparison queries
4. Create new chart component for side-by-side comparison

### Gap 4: Income by Item Feature

**Current State:**
- No "income by item" component found in codebase
- ProductPerformanceTable shows revenue by product
- TopPerformers shows top products and categories

**Analysis:**
The ProductPerformanceTable already provides item-level revenue data:
- Shows product name, quantity sold, revenue
- Has filtering by category
- Has sorting and pagination

**Possible Interpretations:**
1. **Item-level breakdown within transactions** - Show each OrderItem's contribution
2. **Variant-level income** - Break down by ProductVariant, not just Product
3. **Historical feature that was removed** - May need to check git history

**Recommendation:**
Clarify with user what "income by item" means. Current ProductPerformanceTable may already satisfy this requirement.

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌──────────────────┐     ┌────────────────┐  │
│  │  App.tsx     │────▶│  AdminPanel.tsx  │────▶│ AnalyticsPanel │  │
│  │              │     │                  │     │                │  │
│  │ - Fetches    │     │ - Passes props   │     │ - Date range   │  │
│  │   ALL        │     │   down           │     │   selection    │  │
│  │   trans-     │     │                  │     │ - Filters      │  │
│  │   actions    │     │                  │     │   transactions │  │
│  └──────────────┘     └──────────────────┘     └───────┬────────┘  │
│         │                                              │           │
│         │                                              ▼           │
│         │                               ┌────────────────────────┐ │
│         │                               │ Child Components:      │ │
│         │                               │ - HourlySalesChart     │ │
│         │                               │ - SalesTrendChart      │ │
│         │                               │ - TopPerformers        │ │
│         │                               └────────────────────────┘ │
│         │                                                          │
└─────────┼──────────────────────────────────────────────────────────┘
          │
          │ HTTP GET /api/transactions
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐     ┌────────────────┐     ┌──────────────┐  │
│  │ transactions.ts  │────▶│   Prisma       │────▶│  PostgreSQL  │  │
│  │ (handler)        │     │   Client       │     │  Database    │  │
│  │                  │     │                │     │              │  │
│  │ - Returns ALL    │     │ - ORM queries  │     │ - transactions│
│  │   transactions   │     │                │     │ - settings    │
│  └──────────────────┘     └────────────────┘     │ - daily_      │
│                                                  │   closings    │
│  ┌──────────────────┐                            └──────────────┘  │
│  │ analytics.ts     │                                              │
│  │ (handler)        │                                              │
│  │                  │                                              │
│  │ - /product-      │                                              │
│  │   performance    │                                              │
│  │ - /top-performers│                                              │
│  └──────────────────┘                                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Recommendations

### Phase 1: Backend Enhancements

1. **Create Hourly Sales Endpoint**
   ```
   GET /api/analytics/hourly-sales?date=2026-02-19&businessDayStart=06:00
   ```
   Response:
   ```json
   {
     "date": "2026-02-19",
     "businessDayStart": "2026-02-19T06:00:00Z",
     "businessDayEnd": "2026-02-20T05:59:59Z",
     "hourlyData": [
       { "hour": "06:00", "total": 150.00, "transactionCount": 5 },
       { "hour": "07:00", "total": 320.50, "transactionCount": 12 },
       ...
     ],
     "summary": {
       "totalSales": 4500.00,
       "totalTransactions": 150,
       "peakHour": "14:00",
       "peakHourTotal": 650.00
     }
   }
   ```

2. **Add Business Day End Hour Setting**
   - Migration: Add `businessDayEndHour` column to Settings
   - Default value: null (means 24-hour operation)
   - If set, hourly chart shows only operating hours

3. **Create Comparison Endpoint**
   ```
   GET /api/analytics/compare?period1=2026-02-18&period2=2026-02-19
   ```

### Phase 2: Frontend Enhancements

1. **Add Date Picker to AnalyticsPanel**
   - Replace fixed "today" button with date picker
   - Allow selecting any past date for hourly view

2. **Enhance HourlySalesChart**
   - Accept `targetDate` prop
   - Fetch data from new backend endpoint
   - Show operating hours only (if configured)

3. **Create Comparison View**
   - New component: `HourlyComparisonChart.tsx`
   - Side-by-side or overlay comparison
   - Percentage difference indicators

### Phase 3: Income by Item Clarification

1. **Clarify Requirements**
   - Determine if ProductPerformanceTable satisfies the need
   - If not, define what "income by item" means specifically

2. **Potential Implementation**
   - If variant-level breakdown needed: modify analytics service
   - If transaction item breakdown needed: create new component

---

## Technical Considerations

### Performance

**Current Issue:** All transactions are loaded client-side
- For large datasets, this will cause performance problems
- Hourly aggregation should happen server-side

**Recommendation:** 
- Implement server-side aggregation for hourly data
- Add pagination to transaction history
- Consider caching for frequently accessed analytics

### Time Zone Handling

**Current State:**
- Business day calculation uses local time
- No explicit timezone handling

**Recommendation:**
- Store all timestamps in UTC
- Convert to venue's local timezone for display
- Add timezone setting to Settings model

### Data Integrity

**Considerations:**
- Transactions are immutable (good)
- Daily closings provide historical snapshots
- Business day boundaries must be consistent

---

## Implementation Priority

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| High | Date picker for hourly view | Medium | High |
| High | Backend hourly aggregation | Medium | High |
| Medium | Business day end hour | Low | Medium |
| Medium | Comparison view | High | Medium |
| Low | Income by item (pending clarification) | TBD | TBD |

---

## Next Steps

1. **Clarify "income by item" requirement** with user
2. **Confirm midnight-crossing hours** use case
3. **Create detailed implementation plan** for approved features
4. **Begin with backend hourly endpoint** as foundation
