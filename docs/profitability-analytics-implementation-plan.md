# Profitability Analytics System Implementation Plan

**Document Version:** 1.0  
**Date:** April 8, 2026  
**Status:** For Stakeholder Review  
**Timeline:** 8-12 Weeks

---

## 1. Executive Summary

This implementation plan outlines the development of a comprehensive Profitability Analytics System for our hospitality POS platform. The system will enable bar and restaurant operators to track ingredient costs, analyze margins in real-time, and identify variance between theoretical and actual food costs.

### Business Case

In the hospitality industry, food and beverage costs typically represent 25-35% of revenue, making cost visibility essential for profitability. Currently, our POS system tracks sales revenue but lacks the capability to calculate cost of goods sold (COGS) at the transaction level. This creates a significant blind spot for operators who cannot:
- Understand true profit margins per product
- Identify waste, theft, or portion inconsistencies
- Make data-driven pricing and menu engineering decisions

### Objectives

1. **Cost Tracking**: Implement standard cost methodology for ingredient-level cost management
2. **Margin Analysis**: Calculate and display real-time profit margins at transaction, product, and category levels
3. **Variance Detection**: Enable comparison between theoretical (recipe-based) and actual (inventory-based) costs
4. **Decision Support**: Provide actionable insights for menu pricing, recipe optimization, and cost control

### Expected ROI and Benefits

| Benefit | Expected Impact | Timeframe |
|---------|-----------------|-----------|
| Food cost reduction | 2-5% decrease in COGS | 3-6 months |
| Waste identification | 1-3% variance exposure | Immediate |
| Pricing optimization | 3-8% margin improvement | 6-12 months |
| Labor savings | 5-10 hours/week on manual calculations | Immediate |

### High-Level Approach

We will implement a **Standard Cost methodology** with transaction-time cost capture. This approach:
- Sets target costs for ingredients that are updated periodically
- Calculates COGS at the moment of sale for accurate margin tracking
- Compares theoretical usage (from recipes) against actual usage (from inventory counts)
- Provides admin-only access to protect sensitive financial data

The implementation follows a phased approach over 8-12 weeks, beginning with database schema enhancements and culminating in a fully functional analytics dashboard.

---

## 2. System Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React/TypeScript)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  Cost Management │  │  Profit Dashboard │  │  Variance Reports         │  │
│  │  Module          │  │  (Admin Only)    │  │  (Admin Only)             │  │
│  │  - Ingredient    │  │  - KPI Cards     │  │  - Theoretical vs Actual  │  │
│  │    Cost Entry    │  │  - Margin Charts │  │  - Ingredient-Level       │  │
│  │  - Standard Cost │  │  - Trend Lines   │  │  - Period Comparison      │  │
│  │    Updates       │  │  - Drill-Down    │  │  - Export (CSV/PDF)       │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┬───────────────┘  │
│           │                    │                         │                   │
│           └────────────────────┼─────────────────────────┘                   │
│                                │                                             │
└────────────────────────────────┼─────────────────────────────────────────────┘
                                 │ HTTPS/JWT
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Node.js/Express)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │                        API Layer                                         ││
│  │  /api/cost-management/*    /api/analytics/*       /api/inventory/*      ││
│  │  - Ingredient costs        - Profit summary       - Inventory counts    ││
│  │  - Cost history            - Margin by product    - Variance reports    ││
│  │  - Recipe costs            - Trend analysis       - Export data         ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                │                                             │
│  ┌─────────────────────────────┼────────────────────────────────────────────┐│
│  │                     Service Layer                                        ││
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐  ││
│  │  │ CostCalculation  │  │ AnalyticsService │  │ VarianceService        │  ││
│  │  │ Service          │  │                 │  │                        │  ││
│  │  │ - Recipe cost    │  │ - Aggregations  │  │ - Theoretical usage    │  ││
│  │  │ - Standard cost  │  │ - Caching      │  │ - Actual usage         │  ││
│  │  │ - Audit trail    │  │ - Performance   │  │ - Variance calc        │  ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                │                                             │
│  ┌─────────────────────────────┼────────────────────────────────────────────┐│
│  │                     Data Access Layer (Prisma ORM)                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
└────────────────────────────────┼─────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE (PostgreSQL)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │ StockItem     │  │ Transaction   │  │ CostHistory   │  │ InventoryCount│ │
│  │ + costPerUnit │  │ + totalCost   │  │ (new)         │  │ (new)        │ │
│  │ + standardCost│  │ + costCalcAt  │  │               │  │              │ │
│  └───────────────┘  └───────────────┘  └───────────────┘  └──────────────┘ │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐                   │
│  │ ProductVariant│  │ StockConsump- │  │ VarianceReport│                   │
│  │ + theoretCost │  │ tion (exist)  │  │ (new)         │                   │
│  │ + currMargin  │  │               │  │               │                   │
│  └───────────────┘  └───────────────┘  └───────────────┘                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack Alignment

| Component | Existing Technology | New Additions |
|-----------|---------------------|---------------|
| Frontend | React 18, TypeScript, Tailwind CSS | Chart.js/Recharts for visualizations |
| Backend | Node.js, Express, Prisma ORM | CostCalculationService, AnalyticsService |
| Database | PostgreSQL 15+ | New tables: CostHistory, InventoryCount, VarianceReport |
| Auth | JWT with Admin/Cashier roles | Admin-only middleware for financial endpoints |
| API | REST | New endpoints: /api/cost-management, /api/analytics |

### Integration Points with Current POS

1. **Transaction Processing**: Hook into existing transaction creation flow to calculate and store costs
2. **Stock Consumption**: Leverage existing StockConsumption junction table for recipe-ingredient relationships
3. **Product Variants**: Extend existing ProductVariant model with cost/margin fields
4. **User Authentication**: Utilize existing JWT auth with role-based access for admin-only features
5. **Daily Closing**: Extend existing DailyClosing model to include cost summaries

---

## 3. Detailed Feature Breakdown

### 3.1 Cost Management Module

#### Ingredient Cost Entry

**Purpose**: Allow admins to enter and update ingredient costs

**Features**:
- Manual cost entry form for each StockItem
- Support for different purchasing units (case, bottle, kg, etc.)
- Unit conversion handling (e.g., case to serving unit)
- Historical cost tracking with effective dates
- Bulk import via CSV for initial data population

**User Interface**:
```
┌─────────────────────────────────────────────────────────────┐
│ Ingredient Cost Management                        Admin Only │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Search: [________________________] [Filter by Category ▼]│ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Ingredient      │ Category  │ Current Cost │ Last Update│ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Vodka (1L)      │ Spirits   │ €18.50       │ 2026-04-01│ │
│ │ Gin (1L)        │ Spirits   │ €22.00       │ 2026-03-15│ │
│ │ Coca-Cola (can) │ Soft Drv  │ €0.45        │ 2026-04-05│ │
│ │ Lime Juice      │ Produce   │ €4.20/kg     │ 2026-04-02│ │
│ │ [Edit] [History]│           │              │            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [+ Add New Ingredient Cost] [Import CSV] [Export]          │
└─────────────────────────────────────────────────────────────┘
```

#### Standard Cost Updates

**Purpose**: Manage periodic cost updates with audit trail

**Features**:
- Set standard cost per ingredient unit
- Schedule periodic cost reviews (monthly/quarterly)
- Track cost change history with reasons
- Automatic notification when costs deviate >10% from standard

**Cost History Modal**:
```
┌─────────────────────────────────────────┐
│ Cost History: Vodka (1L)               │
├─────────────────────────────────────────┤
│ Date       │ Cost   │ Change │ Reason  │
│ 2026-04-01 │ €18.50 │ +5.7%  │ Supplier│
│ 2026-01-15 │ €17.50 │ +2.9%  │ Review  │
│ 2025-10-01 │ €17.00 │ --     │ Initial │
└─────────────────────────────────────────┘
```

### 3.2 Transaction Enhancement

#### Cost Calculation at Sale Time

**Purpose**: Calculate and store COGS for each transaction

**Implementation**:
- Hook into transaction creation workflow
- Calculate cost based on recipe (StockConsumption) and current standard costs
- Store total cost and cost breakdown in transaction record
- Preserve cost data even if ingredient costs change later

**Transaction Item Enhancement**:
```typescript
interface TransactionItemWithCost {
  id: number;
  productId: number;
  variantId: number;
  quantity: number;
  price: number;           // Selling price (existing)
  unitCost: number;        // NEW: Cost per unit at sale time
  totalCost: number;       // NEW: quantity × unitCost
  margin: number;          // NEW: price - unitCost
  marginPercent: number;   // NEW: margin / price × 100
  costSource: 'standard';  // NEW: Method used for cost
  costCalculatedAt: Date;  // NEW: Timestamp of calculation
}
```

**Cost Calculation Flow**:
1. Transaction items received from POS
2. For each item, fetch recipe (StockConsumption records)
3. Calculate total cost from ingredient standard costs
4. Store cost snapshot with transaction
5. Update aggregated metrics (daily cost totals)

### 3.3 Profit Analytics Dashboard

**Purpose**: Provide real-time visibility into profitability metrics

**Dashboard Components**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Profit Analytics Dashboard                              Admin Only      [⎙] │
├─────────────────────────────────────────────────────────────────────────────┤
│ Period: [Today ▼] [April 2026 ▼]                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │   Revenue    │ │     COGS     │ │ Gross Profit │ │ Margin %     │        │
│ │   €12,450    │ │    €4,215    │ │    €8,235    │ │    66.1%     │        │
│ │   +12.3%     │ │   +8.5%      │ │   +14.2%     │ │   +2.1pp     │        │
│ │   vs prev    │ │   vs prev    │ │   vs prev    │ │   vs prev    │        │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘        │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │                     Margin Trend (Last 30 Days)                         │ │
│ │  70% ─┬───────────────────────────────────────────────────────────      │ │
│ │       │      ╭──────╮       ╭────────╮                                 │ │
│ │  65% ─┤──────┘      ╰───────╯        ╰─────────────────────            │ │
│ │       │                                                                 │ │
│ │  60% ─┤                                                                 │ │
│ │       └─────────────────────────────────────────────────────────        │ │
│ │        Apr 1  Apr 8  Apr 15  Apr 22  Apr 29                            │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌────────────────────────────────┐ ┌────────────────────────────────────┐  │
│ │ Top Products by Margin         │ │ Category Breakdown                 │  │
│ │ ┌────────────────────────────┐ │ │ ┌────────────────────────────────┐ │  │
│ │ │ Product          │ Margin% │ │ │ │ Category     │ Rev    │ Cost  │ │  │
│ │ ├────────────────────────────┤ │ │ ├────────────────────────────────┤ │  │
│ │ │ House Wine      │ 72.5%   │ │ │ │ Spirits      │€4,200 │€1,050 │ │  │
│ │ │ Cocktails       │ 68.3%   │ │ │ │ Cocktails    │€3,800 │€1,215 │ │  │
│ │ │ Draft Beer      │ 65.2%   │ │ │ │ Wine         │€2,450 │€735   │ │  │
│ │ │ Bottled Beer    │ 58.7%   │ │ │ │ Beer         │€2,000 │€800   │ │  │
│ │ │ Soft Drinks     │ 85.0%   │ │ │ └────────────────────────────────┘ │  │
│ │ └────────────────────────────┘ │ │                                    │  │
│ └────────────────────────────────┘ └────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Key Features**:
- Real-time KPI cards with period-over-period comparison
- Interactive trend charts with date range selection
- Product-level margin drill-down
- Category breakdown with cost distribution
- Export functionality for reports

### 3.4 Variance Analysis Reports

**Purpose**: Compare theoretical vs actual usage to identify discrepancies

**Report Structure**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Variance Analysis Report                         Period: Apr 1-7, 2026     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ SUMMARY                                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Theoretical Cost:     €3,842.50                                         ││
│ │ Actual Cost:          €4,125.30                                         ││
│ │ Variance:             €282.80  (7.4% over)                              ││
│ │ Status:               ⚠ ATTENTION - Exceeds 5% threshold                ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ INGREDIENT-LEVEL DETAIL                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ Ingredient    │ Theoretical │ Actual    │ Variance │ Value  │ Status   ││
│ ├─────────────────────────────────────────────────────────────────────────┤│
│ │ Vodka (1L)    │ 12.5 L      │ 14.2 L    │ +1.7 L   │ €31.45 │ ⚠ High   ││
│ │ Gin (1L)      │ 8.0 L       │ 8.1 L     │ +0.1 L   │ €2.20  │ ✓ OK     ││
│ │ Lime Juice    │ 5.2 kg      │ 6.8 kg    │ +1.6 kg  │ €6.72  │ ⚠ High   ││
│ │ Coca-Cola     │ 145 cans    │ 148 cans  │ +3 cans  │ €1.35  │ ✓ OK     ││
│ │ Tonic Water   │ 42 bottles  │ 48 bottles│ +6 btls  │ €9.00  │ ⚠ High   ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│ POSSIBLE CAUSES:                                                            │
│ • Over-pouring on high-traffic evenings                                     │
│ • Unreported spillage/waste                                                 │
│ • Recipe non-compliance                                                     │
│ • Potential inventory discrepancies                                         │
│                                                                             │
│ [Export PDF] [Export CSV] [Schedule Report]                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Variance Thresholds**:
| Variance % | Status | Color Code |
|------------|--------|------------|
| < 2% | Excellent | Green |
| 2-5% | Acceptable | Yellow |
| > 5% | Attention Required | Red |

### 3.5 Data Export Capabilities

**Export Formats**:
- **CSV**: Raw data for spreadsheet analysis
- **PDF**: Formatted reports for stakeholders
- **JSON**: API integration for external systems

**Export Options**:
- Date range selection
- Category/product filtering
- Summary vs detail level
- Include/exclude variance calculations

---

## 4. Data Flow Diagrams

### 4.1 Cost Capture Flow

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Admin User  │────▶│ Cost Entry Form │────▶│ Validation      │
│             │     │ - Ingredient    │     │ - Required      │
│             │     │ - Cost          │     │   fields        │
│             │     │ - Effective Date│     │ - Valid range   │
│             │     │ - Reason        │     │ - No duplicates │
└─────────────┘     └─────────────────┘     └────────┬────────┘
                                                     │
                                                     ▼
                    ┌─────────────────────────────────────────────┐
                    │              Backend API                     │
                    │  POST /api/cost-management/ingredient-cost  │
                    └────────────────────────┬────────────────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
    ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
    │ StockItem       │           │ CostHistory     │           │ ProductVariant  │
    │ UPDATE          │           │ INSERT          │           │ UPDATE          │
    │ - standardCost  │           │ - ingredientId  │           │ - theoreticalCost│
    │ - lastCostUpdate│           │ - cost          │           │ (recalculated)  │
    └─────────────────┘           │ - effectiveFrom │           └─────────────────┘
                                  │ - reason        │
                                  │ - createdBy     │
                                  └─────────────────┘
```

### 4.2 Transaction Processing with Cost Calculation

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ POS Terminal│────▶│ Transaction     │────▶│ Transaction     │
│             │     │ Creation        │     │ Items Received  │
│             │     │ Request         │     │                 │
└─────────────┘     └─────────────────┘     └────────┬────────┘
                                                     │
                                                     ▼
                    ┌─────────────────────────────────────────────┐
                    │         CostCalculationService              │
                    │                                             │
                    │  FOR EACH transaction item:                 │
                    │  1. Get variantId from item                 │
                    │  2. Fetch StockConsumption records          │
                    │     (recipe ingredients)                    │
                    │  3. For each ingredient:                    │
                    │     cost += quantity × standardCost         │
                    │  4. Store unitCost with item                │
                    └────────────────────────┬────────────────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
    ┌─────────────────┐           ┌─────────────────┐           ┌─────────────────┐
    │ Transaction     │           │ Transaction     │           │ Analytics       │
    │ UPDATE          │           │ Items JSON      │           │ Aggregation     │
    │ - totalCost     │           │ enhanced with:  │           │ (Async)         │
    │ - costCalcAt    │           │ - unitCost      │           │                 │
    │ - margin        │           │ - margin        │           │ Daily totals    │
    └─────────────────┘           │ - marginPct     │           │ cached          │
                                  └─────────────────┘           └─────────────────┘
```

### 4.3 Analytics Aggregation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Analytics Data Flow                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────────────┐
│ Transaction     │     │ Aggregation     │     │ Dashboard API               │
│ Events          │────▶│ Service         │────▶│                             │
│ (real-time)     │     │                 │     │ GET /api/analytics/*        │
└─────────────────┘     └─────────────────┘     └─────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Hourly Cache  │     │ Daily Summary │     │ Period Cache  │
│ (Redis)       │     │ Table         │     │ (Redis)       │
│ - Last 24h    │     │ - Daily close │     │ - Weekly/Month│
│ - Real-time   │     │ - Pre-calc'd  │     │ - Historical  │
└───────────────┘     └───────────────┘     └───────────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Dashboard Response  │
                    │ - Merge real-time   │
                    │   + historical      │
                    │ - Apply filters     │
                    │ - Format for charts │
                    └─────────────────────┘
```

### 4.4 Variance Analysis Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Variance Calculation Flow                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA COLLECTION                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐           ┌─────────────────────────┐
│ Theoretical Usage       │           │ Actual Usage            │
│                         │           │                         │
│ FROM:                   │           │ FROM:                   │
│ - Transaction records   │           │ - Beginning inventory   │
│ - StockConsumption      │           │ - Purchases             │
│   (recipes)             │           │ - Ending inventory      │
│ - Standard costs        │           │   (count)               │
│                         │           │                         │
│ CALCULATION:            │           │ CALCULATION:            │
│ SUM(qty_sold ×          │           │ Beg + Purchases - End   │
│     ingredient_qty ×    │           │                         │
│     standard_cost)      │           │                         │
└────────────┬────────────┘           └────────────┬────────────┘
             │                                     │
             └─────────────────┬───────────────────┘
                               │
                               ▼
             ┌─────────────────────────────────────┐
             │         Variance Calculation        │
             │                                     │
             │  variance_qty = actual - theoretical│
             │  variance_$ = variance_qty × cost   │
             │  variance_% = variance / theoretical│
             └────────────────────┬────────────────┘
                                  │
                                  ▼
             ┌─────────────────────────────────────┐
             │         Variance Report             │
             │                                     │
             │  - Ingredient-level breakdown       │
             │  - Status indicators                │
             │  - Possible causes                  │
             │  - Recommendations                  │
             └─────────────────────────────────────┘
```

---

## 5. Database Schema Recommendations

### 5.1 New Fields for StockItem

```prisma
model StockItem {
  // ... existing fields ...
  id            String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  name          String
  quantity      Int
  type          String
  baseUnit      String
  purchasingUnits Json?
  
  // NEW FIELDS
  standardCost     Decimal  @default(0) @db.Decimal(10, 4) // Cost per base unit
  costPerUnit      Decimal  @default(0) @db.Decimal(10, 4) // Display cost per serving
  lastCostUpdate   DateTime @default(now())
  costUpdateReason String?
  
  // EXISTING RELATIONS
  stockAdjustments StockAdjustment[]
  stockConsumptions StockConsumption[]
  
  // NEW RELATIONS
  costHistory      CostHistory[]
  inventoryCounts  InventoryCount[]
  
  @@map("stock_items")
}
```

### 5.2 New Fields for Transaction

```prisma
model Transaction {
  // ... existing fields ...
  id              Int      @id @default(autoincrement())
  items           Json
  subtotal        Decimal  @db.Decimal(10, 2)
  tax             Decimal  @db.Decimal(10, 2)
  tip             Decimal  @db.Decimal(10, 2)
  total           Decimal  @db.Decimal(10, 2)
  discount        Decimal  @default(0) @db.Decimal(10, 2)
  discountReason  String?
  status          String   @default("completed")
  paymentMethod   String
  userId          Int
  userName        String
  tillId          Int
  tillName        String
  createdAt       DateTime @default(now())
  version         Int      @default(0)
  idempotencyKey  String?  @unique
  
  // NEW FIELDS
  totalCost         Decimal?  @db.Decimal(10, 2)    // Total COGS
  costCalculatedAt  DateTime?                        // When cost was calc'd
  grossMargin       Decimal?  @db.Decimal(10, 2)    // subtotal - totalCost
  marginPercent     Decimal?  @db.Decimal(5, 2)     // (margin/subtotal)*100
  
  // EXISTING RELATIONS
  user       User      @relation(fields: [userId], references: [id])
  receipts   Receipt[]
  
  @@map("transactions")
}
```

### 5.3 New Fields for ProductVariant

```prisma
model ProductVariant {
  // ... existing fields ...
  id            Int      @id @default(autoincrement())
  productId     Int
  name          String
  price         Decimal  @db.Decimal(10, 2)
  isFavourite   Boolean? @default(false)
  themeColor    String   @default("slate")
  taxRateId     Int?
  
  // NEW FIELDS
  theoreticalCost   Decimal?  @db.Decimal(10, 4)  // Calculated recipe cost
  currentMargin     Decimal?  @db.Decimal(5, 2)   // Current margin %
  lastCostCalc      DateTime?                      // Last recalculation
  costStatus        String?   @default("pending")  // pending, current, stale
  
  // EXISTING RELATIONS
  product              Product           @relation(fields: [productId], references: [id])
  taxRate              TaxRate?          @relation(fields: [taxRateId], references: [id], onDelete: SetNull)
  stockConsumption     StockConsumption[]
  variantLayouts       VariantLayout[]
  sharedLayoutPositions SharedLayoutPosition[]
  
  @@index([taxRateId])
  @@map("product_variants")
}
```

### 5.4 New Models

#### CostHistory Model

```prisma
model CostHistory {
  id            Int       @id @default(autoincrement())
  stockItemId   String    @db.Uuid
  previousCost  Decimal   @db.Decimal(10, 4)
  newCost       Decimal   @db.Decimal(10, 4)
  changePercent Decimal   @db.Decimal(6, 2)    // Calculated: ((new-prev)/prev)*100
  reason        String                         // supplier, review, adjustment
  effectiveFrom DateTime  @default(now())
  createdBy     Int
  createdAt     DateTime  @default(now())
  
  stockItem     StockItem @relation(fields: [stockItemId], references: [id])
  user          User      @relation(fields: [createdBy], references: [id])
  
  @@index([stockItemId, effectiveFrom])
  @@index([effectiveFrom])
  @@map("cost_history")
}
```

#### InventoryCount Model

```prisma
model InventoryCount {
  id            Int      @id @default(autoincrement())
  countDate     DateTime @default(now())
  countType     String   @default("full")      // full, partial, spot
  status        String   @default("draft")     // draft, submitted, approved
  submittedAt   DateTime?
  approvedAt    DateTime?
  approvedBy    Int?
  notes         String?
  createdBy     Int
  createdAt     DateTime @default(now())
  
  items         InventoryCountItem[]
  stockItem     StockItem[]  @relation(fields: [id], references: [id])
  user          User        @relation(fields: [createdBy], references: [id])
  approver      User?       @relation("InventoryApprovedBy", fields: [approvedBy], references: [id])
  
  @@index([countDate])
  @@index([status])
  @@map("inventory_counts")
}

model InventoryCountItem {
  id                Int      @id @default(autoincrement())
  inventoryCountId  Int
  stockItemId       String   @db.Uuid
  quantity          Decimal  @db.Decimal(10, 2)
  unitCost          Decimal  @db.Decimal(10, 4)   // Cost at count time
  extendedValue     Decimal  @db.Decimal(10, 2)   // quantity × unitCost
  notes             String?
  
  inventoryCount    InventoryCount @relation(fields: [inventoryCountId], references: [id], onDelete: Cascade)
  stockItem         StockItem     @relation(fields: [stockItemId], references: [id])
  
  @@index([inventoryCountId])
  @@index([stockItemId])
  @@map("inventory_count_items")
}
```

#### VarianceReport Model

```prisma
model VarianceReport {
  id              Int      @id @default(autoincrement())
  periodStart     DateTime
  periodEnd       DateTime
  status          String   @default("draft")    // draft, reviewed, final
  
  // Summary values
  theoreticalCost Decimal  @db.Decimal(10, 2)
  actualCost      Decimal  @db.Decimal(10, 2)
  varianceValue   Decimal  @db.Decimal(10, 2)
  variancePercent Decimal  @db.Decimal(6, 2)
  
  // Beginning/Ending inventory references
  beginningCountId Int?
  endingCountId   Int?
  
  createdBy       Int
  createdAt       DateTime @default(now())
  reviewedAt      DateTime?
  reviewedBy      Int?
  
  items           VarianceReportItem[]
  user            User      @relation(fields: [createdBy], references: [id])
  reviewer        User?     @relation("VarianceReviewedBy", fields: [reviewedBy], references: [id])
  
  @@index([periodStart, periodEnd])
  @@map("variance_reports")
}

model VarianceReportItem {
  id                Int      @id @default(autoincrement())
  varianceReportId  Int
  stockItemId       String   @db.Uuid
  
  theoreticalQty    Decimal  @db.Decimal(10, 2)
  actualQty         Decimal  @db.Decimal(10, 2)
  varianceQty       Decimal  @db.Decimal(10, 2)
  
  unitCost          Decimal  @db.Decimal(10, 4)
  varianceValue     Decimal  @db.Decimal(10, 2)
  variancePercent   Decimal  @db.Decimal(6, 2)
  
  status            String   @default("ok")      // ok, warning, critical
  notes             String?
  
  varianceReport    VarianceReport @relation(fields: [varianceReportId], references: [id], onDelete: Cascade)
  stockItem         StockItem     @relation(fields: [stockItemId], references: [id])
  
  @@index([varianceReportId])
  @@index([stockItemId])
  @@map("variance_report_items")
}
```

#### User Model Updates

```prisma
model User {
  // ... existing fields ...
  id              Int      @id @default(autoincrement())
  name            String
  username        String   @unique
  password        String
  role            String
  
  // NEW RELATIONS
  costHistory            CostHistory[]
  inventoryCounts        InventoryCount[]
  approvedInventoryCounts InventoryCount[]     @relation("InventoryApprovedBy")
  varianceReports        VarianceReport[]
  reviewedVarianceReports VarianceReport[]     @relation("VarianceReviewedBy")
  
  // ... existing relations ...
  dailyClosings      DailyClosing[]
  // ... etc
  
  @@map("users")
}
```

### 5.5 Migration Strategy

#### Phase 1: Add New Tables (Non-Breaking)

```sql
-- Migration: 001_add_cost_history
CREATE TABLE "cost_history" (
    "id" SERIAL PRIMARY KEY,
    "stockItemId" UUID NOT NULL REFERENCES "stock_items"("id"),
    "previousCost" DECIMAL(10,4) NOT NULL,
    "newCost" DECIMAL(10,4) NOT NULL,
    "changePercent" DECIMAL(6,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP NOT NULL DEFAULT NOW(),
    "createdBy" INTEGER NOT NULL REFERENCES "users"("id"),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "idx_cost_history_item_date" ON "cost_history"("stockItemId", "effectiveFrom");
```

#### Phase 2: Add New Columns (Nullable)

```sql
-- Migration: 002_add_stock_item_cost_fields
ALTER TABLE "stock_items" 
ADD COLUMN "standardCost" DECIMAL(10,4) DEFAULT 0,
ADD COLUMN "costPerUnit" DECIMAL(10,4) DEFAULT 0,
ADD COLUMN "lastCostUpdate" TIMESTAMP DEFAULT NOW(),
ADD COLUMN "costUpdateReason" TEXT;

-- Migration: 003_add_transaction_cost_fields
ALTER TABLE "transactions"
ADD COLUMN "totalCost" DECIMAL(10,2),
ADD COLUMN "costCalculatedAt" TIMESTAMP,
ADD COLUMN "grossMargin" DECIMAL(10,2),
ADD COLUMN "marginPercent" DECIMAL(5,2);
```

#### Phase 3: Create New Models

```sql
-- Migration: 004_add_inventory_count_tables
-- Migration: 005_add_variance_report_tables
-- (Full SQL for these tables as defined above)
```

#### Phase 4: Backfill and Validate

```sql
-- Backfill existing transactions with estimated costs
-- This will be done via script, not direct SQL
-- To maintain audit trail and validation
```

#### Rollback Plan

Each migration includes a down migration:

```sql
-- Rollback example
ALTER TABLE "stock_items" DROP COLUMN IF EXISTS "standardCost";
DROP TABLE IF EXISTS "cost_history";
```

---

## 6. API Integration Strategy

### 6.1 New Endpoints for Cost Management

#### Ingredient Cost Management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cost-management/ingredients` | List all ingredients with costs | Admin |
| GET | `/api/cost-management/ingredients/:id` | Get single ingredient cost details | Admin |
| POST | `/api/cost-management/ingredients/:id/cost` | Update ingredient cost | Admin |
| GET | `/api/cost-management/ingredients/:id/history` | Get cost history | Admin |
| POST | `/api/cost-management/bulk-import` | Import costs via CSV | Admin |

**Request/Response Examples**:

```typescript
// POST /api/cost-management/ingredients/:id/cost
// Request
{
  "cost": 18.50,
  "reason": "supplier_price_change",
  "effectiveDate": "2026-04-08",
  "notes": "New supplier contract"
}

// Response
{
  "success": true,
  "data": {
    "stockItemId": "uuid-here",
    "name": "Vodka (1L)",
    "previousCost": 17.50,
    "newCost": 18.50,
    "changePercent": 5.71,
    "effectiveFrom": "2026-04-08T00:00:00Z",
    "costHistoryId": 123
  }
}

// GET /api/cost-management/ingredients/:id/history
// Response
{
  "stockItemId": "uuid-here",
  "name": "Vodka (1L)",
  "currentCost": 18.50,
  "history": [
    {
      "id": 123,
      "cost": 18.50,
      "effectiveFrom": "2026-04-08",
      "changePercent": 5.71,
      "reason": "supplier_price_change",
      "createdBy": "admin"
    },
    {
      "id": 122,
      "cost": 17.50,
      "effectiveFrom": "2026-01-15",
      "changePercent": 2.94,
      "reason": "quarterly_review"
    }
  ]
}
```

#### Recipe Cost Calculation

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cost-management/variants/:id/cost` | Get calculated recipe cost | Admin |
| POST | `/api/cost-management/variants/:id/recalculate` | Force recalculation | Admin |
| GET | `/api/cost-management/variants/cost-summary` | Get all variants with costs | Admin |

### 6.2 Enhanced Transaction Endpoints

#### Transaction with Cost Data

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/transactions/:id/cost-breakdown` | Get cost breakdown for transaction | Admin |
| GET | `/api/transactions/cost-summary` | Get aggregated cost data | Admin |

**Enhanced Transaction Response**:

```typescript
// GET /api/transactions/:id - Enhanced response
{
  "id": 12345,
  "subtotal": 45.50,
  "tax": 4.55,
  "total": 50.05,
  // NEW FIELDS
  "totalCost": 12.35,
  "grossMargin": 33.15,
  "marginPercent": 72.86,
  "costCalculatedAt": "2026-04-08T14:30:00Z",
  // Enhanced items with cost data
  "items": [
    {
      "variantId": 10,
      "name": "Mojito",
      "quantity": 2,
      "price": 12.00,
      "unitCost": 3.25,
      "margin": 8.75,
      "marginPercent": 72.92
    }
  ]
}
```

### 6.3 Analytics API Endpoints

#### Profit Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/analytics/profit-summary` | Get profit KPIs | Admin |
| GET | `/api/analytics/margin-by-category` | Margin breakdown by category | Admin |
| GET | `/api/analytics/margin-by-product` | Margin breakdown by product | Admin |
| GET | `/api/analytics/trend` | Margin trend over time | Admin |
| GET | `/api/analytics/hourly` | Hourly profit breakdown | Admin |

**Query Parameters**:
- `startDate`: ISO date string
- `endDate`: ISO date string
- `category`: Filter by category ID
- `product`: Filter by product ID

```typescript
// GET /api/analytics/profit-summary?startDate=2026-04-01&endDate=2026-04-07
// Response
{
  "period": {
    "start": "2026-04-01",
    "end": "2026-04-07"
  },
  "summary": {
    "revenue": 12450.00,
    "cogs": 4215.30,
    "grossProfit": 8234.70,
    "marginPercent": 66.14,
    "transactionCount": 342,
    "averageTransaction": 36.40
  },
  "comparison": {
    "revenueChange": 12.3,
    "cogsChange": 8.5,
    "marginChange": 2.1
  },
  "byCategory": [
    {
      "categoryId": 1,
      "categoryName": "Spirits",
      "revenue": 4200.00,
      "cogs": 1050.00,
      "margin": 3150.00,
      "marginPercent": 75.00
    }
  ]
}
```

#### Variance Analysis

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/analytics/variance` | Get variance report | Admin |
| GET | `/api/analytics/variance/:id` | Get specific variance report | Admin |
| POST | `/api/analytics/variance/generate` | Generate variance report | Admin |

### 6.4 Security Considerations for Admin-Only Access

#### Middleware Implementation

```typescript
// middleware/adminOnly.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './auth';

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const user = verifyToken(token);
  
  if (user.role !== 'admin') {
    // Log unauthorized access attempt
    logger.warn('Unauthorized access attempt', {
      userId: user.id,
      endpoint: req.path,
      ip: req.ip
    });
    
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  
  req.user = user;
  next();
};

// Apply to routes
router.get('/api/analytics/*', adminOnly, analyticsController.getSummary);
router.get('/api/cost-management/*', adminOnly, costController.getCosts);
```

#### Route Protection Matrix

| Route Pattern | Admin | Cashier | Notes |
|---------------|-------|---------|-------|
| `/api/cost-management/*` | Full Access | None | All cost data restricted |
| `/api/analytics/*` | Full Access | None | All analytics restricted |
| `/api/inventory/*` | Full Access | Read Own | Counts visible, costs hidden |
| `/api/transactions` | Full Access | Own Till | Cost fields stripped for cashiers |

#### Response Filtering

```typescript
// Filter sensitive fields for non-admin users
const filterTransactionForCashier = (transaction: any) => {
  const { totalCost, grossMargin, marginPercent, costCalculatedAt, ...safe } = transaction;
  return safe;
};
```

---

## 7. Security and Compliance Considerations

### 7.1 Role-Based Access for Financial Data

#### Permission Matrix

| Resource | Admin | Cashier | System |
|----------|-------|---------|--------|
| Ingredient Costs | CRUD | None | Read |
| Transaction Costs | Read | None | Write |
| Margin Reports | Read | None | None |
| Variance Reports | Read/Write | None | Write |
| Inventory Counts | CRUD | Create | Read |

#### Implementation

```typescript
// Permission definitions
const permissions = {
  admin: {
    costs: ['create', 'read', 'update', 'delete'],
    analytics: ['read', 'export'],
    variance: ['create', 'read', 'update'],
    inventory: ['create', 'read', 'update', 'delete', 'approve']
  },
  cashier: {
    costs: [],
    analytics: [],
    variance: [],
    inventory: ['create']  // Can submit counts, not view values
  }
};
```

### 7.2 Audit Trail Requirements

#### Events to Log

| Event | Data Captured | Retention |
|-------|---------------|-----------|
| Cost Change | Old/new values, user, reason, timestamp | 7 years |
| Report Access | User, report type, date range, timestamp | 3 years |
| Inventory Count | User, items, values, approval status | 7 years |
| Variance Generation | Period, calculated values, user | 7 years |

#### Audit Log Schema

```typescript
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: 'cost_update' | 'report_access' | 'inventory_submit' | 'variance_generate';
  userId: number;
  userName: string;
  resource: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}
```

#### Implementation

```typescript
// Audit logging service
class AuditService {
  async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
    await prisma.auditLog.create({
      data: {
        ...entry,
        timestamp: new Date()
      }
    });
  }
  
  async query(filters: AuditQueryFilters): Promise<AuditLogEntry[]> {
    return prisma.auditLog.findMany({
      where: {
        timestamp: { gte: filters.startDate, lte: filters.endDate },
        action: { in: filters.actions },
        userId: filters.userId
      },
      orderBy: { timestamp: 'desc' },
      take: filters.limit || 100
    });
  }
}
```

### 7.3 Data Integrity Measures

#### Cost Calculation Validation

```typescript
// Validate cost before saving
const validateCostUpdate = (data: CostUpdateInput): ValidationResult => {
  const errors: string[] = [];
  
  if (data.cost < 0) {
    errors.push('Cost cannot be negative');
  }
  
  if (data.cost > 10000) {
    errors.push('Cost exceeds maximum threshold - please verify');
  }
  
  if (!data.reason || data.reason.length < 3) {
    errors.push('Reason is required (min 3 characters)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
```

#### Transaction Cost Integrity

```typescript
// Ensure cost calculation is immutable after transaction completes
const sealTransactionCosts = async (transactionId: number) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId }
  });
  
  if (transaction.status !== 'completed') {
    throw new Error('Cannot seal costs for incomplete transaction');
  }
  
  // Verify cost calculation
  const recalculatedCost = await calculateTransactionCost(transaction.items);
  
  if (Math.abs(recalculatedCost - transaction.totalCost) > 0.01) {
    // Log discrepancy for investigation
    logger.error('Cost calculation discrepancy', {
      transactionId,
      stored: transaction.totalCost,
      calculated: recalculatedCost
    });
  }
};
```

#### Database Constraints

```sql
-- Ensure costs are non-negative
ALTER TABLE "stock_items" ADD CONSTRAINT "chk_standard_cost_positive" 
CHECK ("standardCost" >= 0);

-- Ensure margin percentages are valid
ALTER TABLE "transactions" ADD CONSTRAINT "chk_margin_percent_range"
CHECK ("marginPercent" IS NULL OR ("marginPercent" >= 0 AND "marginPercent" <= 100));

-- Ensure cost history entries are chronological
CREATE OR REPLACE FUNCTION check_cost_history_order()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "cost_history" 
    WHERE "stockItemId" = NEW."stockItemId" 
    AND "effectiveFrom" > NEW."effectiveFrom"
    AND "id" != NEW."id"
  ) THEN
    RAISE EXCEPTION 'Cost history entries must be chronological';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cost_history_order
BEFORE INSERT OR UPDATE ON "cost_history"
FOR EACH ROW EXECUTE FUNCTION check_cost_history_order();
```

---

## 8. UI/UX Recommendations

### 8.1 Dashboard Wireframes

#### Main Profit Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [Menu]  Profit Analytics        [Today ▼]  [Apr 2026 ▼]      [⎙ Export]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐ ┌──────────────┐ │
│  │     REVENUE    │ │      COGS      │ │  GROSS PROFIT  │ │  MARGIN %    │ │
│  │   ───────────  │ │  ────────────  │ │  ────────────  │ │ ───────────  │ │
│  │    €12,450     │ │    €4,215      │ │    €8,235      │ │    66.1%     │ │
│  │    ↑ 12.3%     │ │    ↑ 8.5%      │ │    ↑ 14.2%     │ │    ↑ 2.1pp   │ │
│  │  vs last week  │ │  vs last week  │ │  vs last week  │ │  vs last wk  │ │
│  └────────────────┘ └────────────────┘ └────────────────┘ └──────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │                    MARGIN TREND (30 DAYS)                              ││
│  │  72% ─┬──────────────────────────────────────────────────────────      ││
│  │       │                    ╭──────╮                                    ││
│  │  68% ─┤        ╭──────────╯      ╰───────╮                            ││
│  │       │      ╭─╯                          ╰───╮                       ││
│  │  64% ─┤──────╯                                ╰───                    ││
│  │       │                                                                ││
│  │  60% ─┤                                                                ││
│  │       └────────────────────────────────────────────────────────        ││
│  │        Mar 10   Mar 17   Mar 24   Mar 31   Apr 7                     ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌──────────────────────────────────┐ ┌──────────────────────────────────┐ │
│  │  TOP PRODUCTS BY MARGIN          │ │  CATEGORY BREAKDOWN              │ │
│  │  ────────────────────────────    │ │  ────────────────────────────    │ │
│  │  House Wine (Glass)   72.5%  ●───│ │  [=========] Spirits    75%     │ │
│  │  Mojito               68.3%  ●───│ │  [========]  Cocktails  68%     │ │
│  │  Draft Beer           65.2%  ●───│ │  [=======]   Wine      70%      │ │
│  │  Bottled Beer         58.7%  ●───│ │  [======]    Beer      60%      │ │
│  │  Soft Drinks          85.0%  ●───│ │  [=====]     Food      55%      │ │
│  │                                  │ │                                  │ │
│  │  [View All Products →]           │ │  [View Details →]               │ │
│  └──────────────────────────────────┘ └──────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Cost Management Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Cost Management                                     [+ Add Cost] [Import CSV]│
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search ingredients...                              ]  [All Categories ▼]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INGREDIENT COSTS                                                           │
│  ┌────────────────────────────────────────────────────────────────────────┐│
│  │ Name            │ Category │ Standard Cost │ Last Update │ Status     ││
│  ├────────────────────────────────────────────────────────────────────────┤│
│  │ Vodka (1L)      │ Spirits  │ €18.50/L      │ Apr 1       │ ● Current  ││
│  │ Gin (1L)        │ Spirits  │ €22.00/L      │ Mar 15      │ ● Current  ││
│  │ Rum (1L)        │ Spirits  │ €19.00/L      │ Feb 28      │ ⚠ Stale    ││
│  │ Coca-Cola (can) │ Soft Drv │ €0.45/ea      │ Apr 5       │ ● Current  ││
│  │ Lime Juice      │ Produce  │ €4.20/kg      │ Apr 2       │ ● Current  ││
│  │ Tonic Water     │ Mixers   │ €1.50/btl     │ Mar 20      │ ⚠ Stale    ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  Showing 6 of 48 ingredients                                    [Export →]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Report Layouts

#### Variance Report Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Variance Analysis Report                                                      │
│ Period: April 1-7, 2026                                   [← Prev] [Next →] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  SUMMARY                                                                ││
│  │  ─────────────────────────────────────────────────────────────────────  ││
│  │  Theoretical Cost:  €3,842.50                                          ││
│  │  Actual Cost:       €4,125.30                                          ││
│  │  Variance:          €282.80 (7.4% OVER)                                ││
│  │                                                                         ││
│  │  Status: ⚠ ATTENTION - Variance exceeds 5% threshold                   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  INGREDIENT DETAIL                                                      ││
│  │  ────────────────────────────────────────────────────────────────────  ││
│  │  Ingredient     │ Theoretical │ Actual │ Variance │ Value  │ Status   ││
│  │  ───────────────────────────────────────────────────────────────────── ││
│  │  Vodka (1L)     │    12.5 L    │ 14.2 L │  +1.7 L  │ €31.45 │ ⚠ High   ││
│  │  Gin (1L)       │     8.0 L    │  8.1 L │  +0.1 L  │ €2.20  │ ✓ OK     ││
│  │  Lime Juice     │    5.2 kg    │ 6.8 kg │ +1.6 kg  │ €6.72  │ ⚠ High   ││
│  │  Coca-Cola      │   145 cans   │148 cans│  +3 cans │ €1.35  │ ✓ OK     ││
│  │  Tonic Water    │   42 bottles │48 btls │  +6 btls │ €9.00  │ ⚠ High   ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │  POSSIBLE CAUSES                                                        ││
│  │  • High-traffic weekend (Fri-Sat) may have over-pouring                ││
│  │  • New bartender training ongoing - recipe compliance issues           ││
│  │  • Check for unreported spillage or waste                              ││
│  │  • Verify inventory count accuracy                                     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  [Export PDF] [Export CSV] [Schedule Regular Reports]                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 8.3 Mobile Responsiveness Considerations

#### Breakpoint Strategy

| Breakpoint | Layout | Components |
|------------|--------|------------|
| < 640px | Stacked | Single column, collapsible sections |
| 640-1024px | Adaptive | 2-column grid for KPIs |
| > 1024px | Full | 4-column KPI grid, side-by-side charts |

#### Mobile Optimizations

```
┌─────────────────────────────┐
│ ☰  Profit Analytics  [⎙]   │
├─────────────────────────────┤
│ [Today ▼] [Apr 2026 ▼]      │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │      REVENUE            │ │
│ │     €12,450             │ │
│ │     ↑ 12.3%             │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │      COGS               │ │
│ │      €4,215             │ │
│ │      ↑ 8.5%             │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │   GROSS PROFIT          │ │
│ │      €8,235             │ │
│ │     ↑ 14.2%             │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │     MARGIN %            │ │
│ │      66.1%              │ │
│ │      ↑ 2.1pp            │ │
│ └─────────────────────────┘ │
│                             │
│ [View Trend Chart ▼]        │
│                             │
│ TOP PRODUCTS                │
│ House Wine    72.5%  ●────  │
│ Mojito        68.3%  ●────  │
│ Draft Beer    65.2%  ●────  │
│                             │
│ [View All →]                │
└─────────────────────────────┘
```

#### Touch-Friendly Interactions

- Minimum tap target: 44x44px
- Swipe gestures for date range selection
- Pull-to-refresh for real-time data
- Collapsible sections for better information density

---

## 9. Implementation Phases/Timeline

### Phase 1: Database & Core Services (Weeks 1-3)

#### Week 1: Schema Design & Migration
- [ ] Design and document database schema changes
- [ ] Create Prisma migration files
- [ ] Test migrations on development database
- [ ] Document rollback procedures

#### Week 2: Core Service Implementation
- [ ] Implement CostCalculationService
- [ ] Implement CostHistoryService
- [ ] Create cost calculation utilities (unit conversions)
- [ ] Write unit tests for cost calculations

#### Week 3: Integration Points
- [ ] Hook cost calculation into transaction creation
- [ ] Implement cost snapshot storage
- [ ] Create audit logging infrastructure
- [ ] Test transaction flow with costs

**Deliverables**:
- Database migrations ready for production
- Core cost calculation service with >90% test coverage
- Transaction enhancement with cost capture

### Phase 2: Backend API & Cost Calculation (Weeks 4-6)

#### Week 4: Cost Management API
- [ ] Implement ingredient cost CRUD endpoints
- [ ] Create cost history endpoints
- [ ] Build recipe cost calculation endpoints
- [ ] Add admin-only middleware

#### Week 5: Analytics API
- [ ] Implement profit summary endpoint
- [ ] Create margin-by-category endpoint
- [ ] Build trend analysis endpoint
- [ ] Add caching layer (Redis)

#### Week 6: Variance Analysis API
- [ ] Implement inventory count endpoints
- [ ] Create variance calculation service
- [ ] Build variance report generation
- [ ] Add export endpoints (CSV, PDF)

**Deliverables**:
- Complete REST API for cost management
- Analytics endpoints with caching
- Variance analysis backend

### Phase 3: Frontend Dashboard & Reports (Weeks 7-9)

#### Week 7: Cost Management UI
- [ ] Build ingredient cost management page
- [ ] Create cost history view
- [ ] Implement CSV import functionality
- [ ] Add cost update form with validation

#### Week 8: Profit Dashboard
- [ ] Create dashboard layout and navigation
- [ ] Build KPI cards component
- [ ] Implement trend chart (Chart.js/Recharts)
- [ ] Create category breakdown visualization

#### Week 9: Reports & Export
- [ ] Build variance report page
- [ ] Implement PDF export (jsPDF)
- [ ] Create CSV export functionality
- [ ] Add mobile-responsive layouts

**Deliverables**:
- Complete cost management interface
- Functional profit analytics dashboard
- Variance analysis reports with export

### Phase 4: Testing & Polish (Weeks 10-12)

#### Week 10: Integration Testing
- [ ] End-to-end testing of cost flow
- [ ] API endpoint testing
- [ ] Dashboard user acceptance testing
- [ ] Performance testing with realistic data

#### Week 11: Bug Fixes & Optimization
- [ ] Address identified bugs
- [ ] Optimize query performance
- [ ] Improve caching strategy
- [ ] Enhance error handling

#### Week 12: Documentation & Deployment
- [ ] Write user documentation
- [ ] Create admin guide
- [ ] Document API endpoints
- [ ] Prepare deployment checklist
- [ ] Production deployment

**Deliverables**:
- Tested and polished system
- Complete documentation
- Production-ready deployment

---

## 10. Risk Assessment and Mitigation

### 10.1 Data Migration Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Existing transactions have no cost data | High | Medium | Implement backfill script with estimated costs; clearly label as estimates |
| Cost data inconsistency | Medium | High | Validation rules; manual review of imported data |
| Performance degradation during migration | Low | Medium | Run migrations during low-traffic hours; use batch processing |

**Mitigation Details**:

```typescript
// Backfill script for existing transactions
async function backfillTransactionCosts() {
  const transactions = await prisma.transaction.findMany({
    where: { totalCost: null },
    include: { items: true }
  });
  
  for (const tx of transactions) {
    try {
      const estimatedCost = await estimateCostFromRecipes(tx.items);
      await prisma.transaction.update({
        where: { id: tx.id },
        data: {
          totalCost: estimatedCost,
          costCalculatedAt: new Date(),
          // Mark as estimated for transparency
          costSource: 'estimated_backfill'
        }
      });
    } catch (error) {
      logger.error('Backfill failed for transaction', { id: tx.id, error });
    }
  }
}
```

### 10.2 Performance Concerns

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Slow cost calculations during peak hours | Medium | High | Async calculation; caching; pre-computed aggregates |
| Dashboard loading time >3s | Medium | Medium | Materialized views; Redis caching; pagination |
| Database query bloat | Medium | Medium | Query optimization; proper indexing; explain analyze |

**Performance Optimization Strategy**:

```sql
-- Create materialized view for daily summaries
CREATE MATERIALIZED VIEW daily_cost_summary AS
SELECT
  DATE(created_at) as business_date,
  SUM(total) as revenue,
  SUM("totalCost") as cogs,
  SUM("grossMargin") as gross_profit,
  AVG("marginPercent") as avg_margin_pct,
  COUNT(*) as transaction_count
FROM transactions
WHERE "totalCost" IS NOT NULL
GROUP BY DATE(created_at);

-- Refresh strategy
CREATE OR REPLACE FUNCTION refresh_daily_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_cost_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron
SELECT cron.schedule('0 4 * * *', 'SELECT refresh_daily_summary()');
```

### 10.3 User Adoption Challenges

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Admins overwhelmed by data | Medium | Medium | Progressive disclosure; clear visualizations; training materials |
| Cost entry seen as burden | High | Low | Bulk import; CSV templates; mobile-friendly entry |
| Incorrect cost data entry | Medium | High | Validation rules; change approval workflow; audit trail |

**Adoption Strategy**:
1. Provide initial setup assistance
2. Create video tutorials for key workflows
3. Offer template CSV files for bulk import
4. Implement "getting started" checklist in UI
5. Schedule training sessions post-deployment

---

## 11. Success Metrics and KPIs

### 11.1 Technical Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Cost calculation accuracy | >99.5% | Audit sample comparison |
| API response time (p95) | <500ms | Application monitoring |
| Dashboard load time | <2s | Performance testing |
| System uptime | >99.9% | Monitoring alerts |
| Test coverage | >85% | CI/CD pipeline |

**Measurement Implementation**:

```typescript
// Performance monitoring middleware
const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.timing('api.response_time', duration, {
      endpoint: req.path,
      method: req.method,
      status: res.statusCode
    });
    
    if (duration > 500) {
      logger.warn('Slow API response', { path: req.path, duration });
    }
  });
  
  next();
};
```

### 11.2 Business Metrics

| Metric | Baseline | Target (3 months) | Target (6 months) |
|--------|----------|-------------------|-------------------|
| Cost visibility coverage | 0% | 80% ingredients | 95% ingredients |
| Variance reduction | Unknown | 20% reduction | 40% reduction |
| Margin improvement | Unknown | 2% improvement | 5% improvement |
| Report usage | N/A | 50% admins weekly | 80% admins weekly |
| Decision actions | 0 | 5 pricing changes | 15 recipe optimizations |

**Business Impact Tracking**:

```typescript
// Track report usage
async function trackReportAccess(userId: number, reportType: string) {
  await prisma.reportUsage.create({
    data: {
      userId,
      reportType,
      accessedAt: new Date()
    }
  });
}

// Calculate variance improvement
async function measureVarianceImprovement(months: number): Promise<number> {
  const recent = await getAverageVariancePercent(lastNMonths(months));
  const baseline = await getBaselineVariancePercent();
  return ((baseline - recent) / baseline) * 100;
}
```

### 11.3 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Data completeness | >95% | % of transactions with cost data |
| Audit trail coverage | 100% | % of cost changes with audit log |
| User satisfaction | >4.0/5.0 | Survey feedback |
| Support tickets | <5/month | Help desk tracking |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| COGS | Cost of Goods Sold - direct costs of producing sold items |
| Standard Cost | Predetermined cost per unit used for cost tracking |
| Gross Margin | Revenue minus COGS |
| Variance | Difference between theoretical and actual usage |
| StockConsumption | Recipe junction table linking variants to ingredients |
| ProductVariant | Sellable item (e.g., "Mojito", "Heineken Bottle") |

## Appendix B: Reference Documents

- Recipe Costing Research: `/docs/recipe-costing-research.md`
- Profit Dashboard ERP Analysis: `/docs/profit-dashboard-erp-analysis.md`
- Financial System Best Practices: `/docs/financial-system-best-practices.md`
- Database Schema: `/backend/prisma/schema.prisma`

---

*Document prepared for stakeholder review*  
*Version 1.0 | April 8, 2026*
