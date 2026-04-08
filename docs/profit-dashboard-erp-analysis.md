# Profit Dashboard & ERP Patterns Analysis
## Actionable Implementation Insights for Hospitality POS

---

## Executive Summary

This document analyzes patterns from open-source ERP systems (Odoo, ERPNext), profit dashboards, and hospitality analytics to provide practical implementation recommendations for a mid-size hospitality POS system.

**Key Findings:**
1. **Transaction-time cost tracking** is essential for accurate margins
2. **FIFO/Average cost** are industry standards for inventory valuation
3. **Real-time + batch hybrid** is the optimal reporting architecture
4. **Variance analysis** (theoretical vs actual) is critical for cost control

---

## 1. Open-Source ERP Patterns

### 1.1 COGS Calculation Methods

#### Odoo's Approach
**Method:** Perpetual inventory with real-time COGS
- **FIFO (Default):** First-In-First-Out costing
- **Average Cost:** Moving weighted average
- **Standard Cost:** Fixed predetermined cost

**Implementation Pattern:**
```
Product Model:
├── costing_method: ['fifo', 'average', 'standard']
├── standard_price: Decimal (for standard costing)
├── avg_cost: Decimal (calculated for average method)
└── stock_valuation: 'real_time' | 'manual'

Stock Move:
├── product_id
├── quantity
├── unit_cost (from purchase or production)
├── value = quantity × unit_cost
└── remaining_qty (FIFO tracking)
```

**Key Pattern - FIFO Layer Tracking:**
```sql
-- Each purchase creates a "layer" 
CREATE TABLE stock_fifo_layers (
    id UUID PRIMARY KEY,
    product_id INT,
    quantity_remaining DECIMAL(10,2),
    unit_cost DECIMAL(10,2),
    created_at TIMESTAMP,
    consumed_at TIMESTAMP
);

-- On sale: consume oldest layers first
-- COGS = SUM(quantity × layer_cost) from oldest layers
```

#### ERPNext's Approach
**Method:** Perpetual vs Periodic inventory
- **Perpetual:** Real-time valuation on each transaction
- **Periodic:** Valuation at month-end based on counts

**Valuation Methods:**
1. **FIFO:** Track purchase lots, consume oldest first
2. **Moving Average:** 
   ```python
   new_avg = (existing_stock_value + new_purchase_value) / 
             (existing_qty + new_qty)
   ```

### 1.2 Cost Tracking: Transaction Time vs Current Cost

| Method | Accuracy | Complexity | Best For |
|--------|----------|------------|----------|
| Transaction Time | High | High | Financial reporting, margin analysis |
| Current Cost | Low | Low | Rough estimates, quick pricing |
| Standard Cost | Medium | Low | Stable prices, variance tracking |

**Recommendation:** **Transaction-time cost tracking**

**Why:**
1. Margins remain accurate even when ingredient costs change
2. Historical profitability analysis is reliable
3. Compliant with accounting standards (GAAP/IFRS)

**Implementation:**
```typescript
interface TransactionItem {
  productId: number;
  variantId: number;
  quantity: number;
  price: number;           // Selling price
  unit_cost: number;       // Cost at transaction time
  cost_source: string;     // 'fifo', 'average', 'standard'
  cost_calculated_at: Date;
  ingredient_snapshot?: {
    ingredient_id: string;
    quantity: number;
    unit_cost: number;
  }[];
}

// On transaction creation:
// 1. Calculate COGS based on current inventory valuation
// 2. Store unit_cost with transaction item
// 3. Create audit trail for cost calculation
```

### 1.3 Periodic Inventory Valuation Methods

**Monthly/Period-End Process:**
```
Beginning Inventory Value
+ Purchases during period
- Ending Inventory Value (from count)
= Cost of Goods Sold

Variance Analysis:
Actual COGS - Theoretical COGS = Variance
```

**Implementation for Hospitality POS:**
```typescript
interface InventoryValuation {
  period_start: Date;
  period_end: Date;
  
  // Inventory counts
  beginning_inventory: {
    stock_item_id: string;
    quantity: number;
    unit_cost: number;
    total_value: number;
  }[];
  
  ending_inventory: {
    stock_item_id: string;
    quantity: number;
    unit_cost: number;
    total_value: number;
  }[];
  
  // Calculated values
  purchases_value: number;
  calculated_cogs: number;
  
  // Theoretical comparison
  theoretical_cogs: number;
  variance: number;
  variance_percent: number;
}
```

---

## 2. Profit Dashboard Patterns

### 2.1 Common Visualization Approaches for Margins

**Industry Standard Visualizations:**

1. **Gross Margin Waterfall Chart**
   ```
   Revenue: $100,000
   ↓ COGS: -$30,000
   ↓ Gross Profit: $70,000 (70%)
   ↓ Operating Expenses: -$40,000
   ↓ Operating Profit: $30,000 (30%)
   ```

2. **Food Cost Percentage by Category**
   - Pie chart showing cost distribution
   - Trend line for food cost % over time
   - Benchmark comparison (target vs actual)

3. **Menu Engineering Matrix**
   ```
   HIGH POPULARITY
   │
   STARS (High Profit) │ PUZZLES (High Profit)
   │                    │ Low Popularity)
   │                    │
   ─────────────────────┼─────────────────────
   │                    │
   PLOW HORSES          │ DOGS (Low Profit)
   (Low Profit,         │ Low Popularity)
   High Popularity)     │
   │
   LOW POPULARITY    HIGH PROFIT
   ```

4. **Contribution Margin Analysis**
   - Bar chart: Revenue vs Contribution Margin per item
   - Highlight high-volume low-margin vs low-volume high-margin

**Implementation:**
```typescript
interface MarginDashboardData {
  period: {
    start: Date;
    end: Date;
  };
  
  summary: {
    revenue: number;
    cogs: number;
    gross_profit: number;
    gross_margin_percent: number;
    operating_expenses: number;
    operating_profit: number;
    operating_margin_percent: number;
  };
  
  by_category: {
    category_id: number;
    category_name: string;
    revenue: number;
    cogs: number;
    margin_percent: number;
    items_sold: number;
  }[];
  
  by_product: {
    product_id: number;
    product_name: string;
    revenue: number;
    cogs: number;
    margin_percent: number;
    popularity_rank: number;
    profitability_rank: number;
    menu_engineering_class: 'star' | 'puzzle' | 'plow_horse' | 'dog';
  }[];
  
  trend: {
    date: Date;
    revenue: number;
    cogs: number;
    margin_percent: number;
  }[];
}
```

### 2.2 Real-Time vs Batch Reporting Patterns

**Trade-off Analysis:**

| Aspect | Real-Time | Batch (Scheduled) |
|--------|-----------|-------------------|
| Latency | Sub-second to minutes | Hours to daily |
| Database Load | Continuous queries | Scheduled bursts |
| Complexity | Higher (caching, websockets) | Lower (simple queries) |
| Freshness | Always current | May be stale |
| Use Cases | Live dashboards, alerts | Financial reports, analytics |

**Recommended Architecture - Lambda Architecture:**
```
                   ┌─────────────────┐
                   │ Transaction     │
                   │ Events          │
                   └────────┬────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
   ┌─────────────────┐            ┌─────────────────┐
   │ Speed Layer     │            │ Batch Layer     │
   │ (Real-Time)     │            │ (Historical)    │
   ├─────────────────┤            ├─────────────────┤
   │ - Last 24 hours │            │ - All time      │
   │ - In-memory     │            │ - Pre-aggregated│
   │ - WebSockets    │            │ - Materialized  │
   └────────┬────────┘            │   views         │
            │                     └────────┬────────┘
            │                              │
            └──────────────┬───────────────┘
                           ▼
                  ┌─────────────────┐
                  │ Serving Layer   │
                  ├─────────────────┤
                  │ Merge real-time │
                  │ + historical    │
                  │ for complete    │
                  │ view            │
                  └─────────────────┘
```

**Implementation:**
```typescript
// Speed Layer - Recent transactions (last 24h)
async function getRecentTransactions(hours: number = 24) {
  const cutoff = new Date(Date.now() - hours * 3600000);
  return prisma.transaction.findMany({
    where: { createdAt: { gte: cutoff } },
    include: { items: true }
  });
}

// Batch Layer - Pre-aggregated daily summaries
async function getHistoricalMetrics(startDate: Date, endDate: Date) {
  return prisma.dailyClosing.findMany({
    where: {
      closedAt: { gte: startDate, lte: endDate }
    }
  });
}

// Serving Layer - Merge both
async function getDashboardData(date: Date) {
  const historical = await getHistoricalMetrics(startOfMonth, yesterday);
  const recent = await getRecentTransactions(24);
  
  return {
    historical: aggregateHistorical(historical),
    recent: aggregateRecent(recent),
    combined: mergeData(historical, recent)
  };
}
```

### 2.3 Alert Threshold Designs

**Common Alert Types in Hospitality:**

1. **Food Cost Alerts**
   ```typescript
   interface FoodCostAlert {
     type: 'high_food_cost' | 'cost_spike' | 'variance_exceeded';
     threshold: {
       food_cost_percent: 35,  // Alert if > 35%
       variance_percent: 3,     // Alert if variance > 3%
       cost_spike_percent: 20   // Alert if price increase > 20%
     };
     comparison_period: 'daily' | 'weekly' | 'monthly';
     notification_channels: ['dashboard', 'email', 'sms'];
   }
   ```

2. **Margin Alerts**
   ```typescript
   interface MarginAlert {
     type: 'low_margin' | 'margin_decline';
     threshold: {
       min_margin_percent: 60,      // Alert if < 60%
       decline_percent: 10          // Alert if declined > 10%
     };
     scope: 'product' | 'category' | 'overall';
   }
   ```

3. **Inventory Alerts**
   ```typescript
   interface InventoryAlert {
     type: 'low_stock' | 'out_of_stock' | 'excess_stock';
     threshold: {
       low_stock_days: 3,           // Days of supply remaining
       out_of_stock: true,          // Zero quantity
       excess_days: 30              // More than 30 days supply
     };
     priority: 'critical' | 'warning' | 'info';
   }
   ```

**Best Practices for Alerts:**
1. **Avoid alert fatigue** - Set meaningful thresholds
2. **Provide context** - Show comparison to historical norms
3. **Actionable** - Include suggested actions
4. **Prioritize** - Critical alerts surface immediately

**Implementation:**
```typescript
async function checkAlerts(businessDate: Date): Promise<Alert[]> {
  const alerts: Alert[] = [];
  
  // Food cost alert
  const foodCostPercent = await calculateFoodCostPercent(businessDate);
  if (foodCostPercent > 35) {
    alerts.push({
      type: 'high_food_cost',
      severity: 'warning',
      message: `Food cost at ${foodCostPercent}% exceeds target of 35%`,
      value: foodCostPercent,
      threshold: 35,
      suggested_actions: [
        'Review high-cost menu items',
        'Check for ingredient price increases',
        'Verify portion consistency'
      ]
    });
  }
  
  // Variance alert
  const variance = await calculateVariance(businessDate);
  if (Math.abs(variance) > 3) {
    alerts.push({
      type: 'variance_exceeded',
      severity: 'critical',
      message: `Theoretical vs actual variance of ${variance}% exceeds 3% threshold`,
      value: variance,
      threshold: 3,
      suggested_actions: [
        'Verify inventory count accuracy',
        'Check for unreported waste',
        'Review portion control'
      ]
    });
  }
  
  return alerts;
}
```

---

## 3. Hospitality-Specific Analytics

### 3.1 Recipe Costing Approaches in Restaurant POS

**Based on Recipe Costing Research Document:**

**Core Architecture:**
```
INGREDIENT
├── id (UUID)
├── name
├── category (protein, produce, dairy, etc.)
├── default_unit
├── yield_percentage (0-100)
├── allergens[] (array)
├── nutrition_data (JSON)
├── products[] (vendor items)
│   ├── vendor_id
│   ├── sku
│   ├── pack_size
│   ├── unit_price
│   ├── last_updated
│   └── preferred_flag
└── conversions[] (unit conversion factors)

RECIPE
├── id (UUID)
├── name
├── category (appetizer, entree, etc.)
├── portion_size
├── portions_per_batch
├── ingredients[] (recipe_ingredients)
│   ├── ingredient_id
│   ├── quantity
│   ├── unit
│   ├── prep_method (affects yield)
│   └── waste_percentage
├── sub_recipes[] (nested recipes)
├── instructions (text/video)
├── photos[]
├── calculated_cost
├── target_food_cost_percent
└── menu_price_suggestion

MENU_ITEM
├── id (UUID)
├── recipe_id
├── pos_plu (POS integration)
├── selling_price
├── food_cost_percent
├── contribution_margin
└── sales_data[] (historical)
```

**Recipe Cost Calculation Formula:**
```typescript
function calculateRecipeCost(recipe: Recipe): number {
  let totalCost = 0;
  
  for (const ingredient of recipe.ingredients) {
    // Get base cost from latest invoice
    const baseCost = getLatestInvoiceCost(ingredient.ingredient_id);
    
    // Apply yield factor
    const yieldPercent = getYieldPercent(
      ingredient.ingredient_id,
      ingredient.prep_method
    );
    
    // Calculate ingredient cost
    const ingredientCost = (baseCost * ingredient.quantity) / yieldPercent;
    totalCost += ingredientCost;
  }
  
  // Add sub-recipe costs
  for (const subRecipe of recipe.sub_recipes) {
    const subRecipeCost = calculateRecipeCost(subRecipe) * subRecipe.portion_multiplier;
    totalCost += subRecipeCost;
  }
  
  return totalCost;
}
```

**Key Implementation Points:**
1. **Yield Management:** Track trim loss, cooking shrinkage
2. **Unit Conversions:** Handle weight-to-volume (e.g., cups to oz)
3. **Vendor-Neutral Design:** Ingredients separate from vendor products
4. **Nested Recipes:** Support sub-recipes (sauces, dressings)

### 3.2 Theoretical vs Actual Food Cost Reconciliation

**From Recipe Costing Research:**

**Formulas:**
```
Theoretical Food Cost = SUM(Menu Items Sold × Theoretical Recipe Cost)

Actual Food Cost = Beginning Inventory + Purchases - Ending Inventory

Variance = Actual Food Cost - Theoretical Food Cost
Variance % = (Variance / Theoretical Food Cost) × 100

Positive Variance = Over-use/waste/loss
Negative Variance = Under-use (possible portion inconsistencies)
```

**PMIX (Product Mix) Data Structure:**
```typescript
interface PMIXRecord {
  date: Date;
  location_id: string;
  items: {
    plu: string;           // Menu item ID
    name: string;
    quantity_sold: number;
    revenue: number;
    modifiers?: {
      modifier_id: string;
      quantity: number;
    }[];
  }[];
}
```

**Variance Report Structure:**
```typescript
interface VarianceReport {
  period_start: Date;
  period_end: Date;
  
  items: {
    ingredient_id: string;
    unit: string;
    
    // Inventory data
    beginning_inventory: { quantity: number; value: number };
    purchases: { quantity: number; value: number };
    ending_inventory: { quantity: number; value: number };
    
    // Calculated usage
    actual_usage: { quantity: number; value: number };
    theoretical_usage: { quantity: number; value: number };
    
    // Variance
    variance_quantity: number;
    variance_value: number;
    variance_percent: number;
  }[];
  
  totals: {
    total_actual_cost: number;
    total_theoretical_cost: number;
    total_variance: number;
    overall_variance_percent: number;
  };
}
```

**Implementation for POS System:**
```typescript
async function generateVarianceReport(
  startDate: Date,
  endDate: Date
): Promise<VarianceReport> {
  // 1. Get inventory counts
  const beginningInventory = await getInventoryCount(startDate);
  const endingInventory = await getInventoryCount(endDate);
  
  // 2. Get purchases in period
  const purchases = await getPurchases(startDate, endDate);
  
  // 3. Get sales data (PMIX)
  const sales = await getSalesData(startDate, endDate);
  
  // 4. Calculate actual usage
  const actualUsage = calculateActualUsage(
    beginningInventory,
    purchases,
    endingInventory
  );
  
  // 5. Calculate theoretical usage from recipes
  const theoreticalUsage = calculateTheoreticalUsage(sales);
  
  // 6. Calculate variance
  const variance = calculateVariance(actualUsage, theoreticalUsage);
  
  return {
    period_start: startDate,
    period_end: endDate,
    items: variance,
    totals: aggregateTotals(variance)
  };
}
```

### 3.3 Key Metrics for Bars/Restaurants

**From Industry Research:**

**Beverage Cost Benchmarks:**
| Category | Target Food Cost % | Range |
|----------|-------------------|-------|
| Draft Beer | 20-25% | 15-30% |
| Bottled Beer | 30-35% | 25-40% |
| Wine by Glass | 30-40% | 25-50% |
| Wine by Bottle | 50-60% | 40-70% |
| Spirits (Liquor) | 15-20% | 10-25% |
| Cocktails | 15-25% | 10-30% |

**Pour Cost Calculation:**
```typescript
// Pour Cost = Cost of Alcohol Used / Revenue from Alcohol Sales
function calculatePourCost(
  alcoholCost: number,
  alcoholRevenue: number
): number {
  if (alcoholRevenue === 0) return 0;
  return (alcoholCost / alcoholRevenue) * 100;
}

// Example:
// 1 liter vodka = $20 (33.8 oz)
// 1.5 oz pour = $0.89 cost
// Selling price = $8
// Pour cost = $0.89 / $8 = 11.1%
```

**Key Hospitality Metrics:**

```typescript
interface HospitalityKPIs {
  // Revenue Metrics
  revenue_per_seat: number;        // Total Revenue / Total Seats
  revenue_per_employee: number;    // Revenue / FTE Count
  average_check: number;           // Revenue / Transaction Count
  table_turnover_rate: number;     // Total Parties / Total Tables
  
  // Cost Metrics
  food_cost_percent: number;       // Food COGS / Food Revenue
  beverage_cost_percent: number;   // Bev COGS / Bev Revenue
  pour_cost_percent: number;       // Alcohol Cost / Alcohol Revenue
  labor_cost_percent: number;      // Labor Cost / Revenue
  
  // Profitability Metrics
  gross_margin_percent: number;    // (Revenue - COGS) / Revenue
  operating_margin_percent: number; // Operating Profit / Revenue
  
  // Efficiency Metrics
  inventory_turnover: number;      // COGS / Average Inventory
  days_inventory_on_hand: number;  // Average Inventory / Daily COGS
  
  // Quality Metrics
  waste_percent: number;           // Waste Value / Total COGS
  variance_percent: number;        // Variance / Theoretical COGS
}
```

**Beverage Cost Ratio:**
```typescript
// Beverage Cost Ratio = Beverage COGS / Total Beverage Revenue
async function calculateBeverageCostRatio(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const beverageCategories = ['beer', 'wine', 'spirits', 'cocktails'];
  
  const beverageSales = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      items: {
        path: '$[*].category',
        array_contains: beverageCategories
      }
    }
  });
  
  const revenue = sumRevenue(beverageSales);
  const cogs = await calculateCOGS(beverageSales);
  
  return (cogs / revenue) * 100;
}
```

---

## 4. Implementation Recommendations

### 4.1 Phase 1: Foundation (Weeks 1-4)

**Database Schema Enhancements:**
```sql
-- Add cost tracking to transactions
ALTER TABLE transactions ADD COLUMN cogs DECIMAL(10,2) DEFAULT 0;
ALTER TABLE transactions ADD COLUMN margin DECIMAL(10,2) GENERATED ALWAYS AS (subtotal - cogs) STORED;

-- Add cost snapshot to transaction items
ALTER TABLE transaction_items ADD COLUMN unit_cost DECIMAL(10,2);
ALTER TABLE transaction_items ADD COLUMN cost_source VARCHAR(20); -- 'fifo', 'average', 'standard'

-- Historical ingredient costs
CREATE TABLE ingredient_cost_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ingredient_id UUID REFERENCES ingredients(id),
    unit_cost DECIMAL(10,2) NOT NULL,
    effective_from TIMESTAMP NOT NULL,
    effective_to TIMESTAMP,
    supplier_id UUID,
    invoice_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Recipe cost snapshots (for historical accuracy)
CREATE TABLE recipe_cost_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID REFERENCES recipes(id),
    portion_cost DECIMAL(10,2) NOT NULL,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    ingredient_costs JSON, -- Snapshot of ingredient costs at calculation time
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Core Services:**
```typescript
// Cost calculation service
class CostCalculationService {
  async calculateTransactionCOGS(items: TransactionItem[]): Promise<number> {
    let totalCOGS = 0;
    
    for (const item of items) {
      const recipe = await this.getRecipe(item.productId);
      const cost = await this.calculateRecipeCost(recipe, item.quantity);
      totalCOGS += cost;
      
      // Store unit cost for audit trail
      item.unit_cost = cost / item.quantity;
    }
    
    return totalCOGS;
  }
  
  async calculateRecipeCost(recipe: Recipe, quantity: number): Promise<number> {
    // Get current cost snapshot
    const costSnapshot = await this.getLatestCostSnapshot(recipe.id);
    
    if (costSnapshot) {
      return costSnapshot.portion_cost * quantity;
    }
    
    // Calculate fresh if no snapshot
    return this.calculateFreshRecipeCost(recipe, quantity);
  }
}
```

### 4.2 Phase 2: Profit Dashboard (Weeks 5-8)

**Dashboard Components:**
```typescript
// Backend: Analytics endpoints
router.get('/api/analytics/profit-summary', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const summary = await prisma.$queryRaw`
    SELECT 
      SUM(revenue) as total_revenue,
      SUM(cogs) as total_cogs,
      SUM(margin) as total_margin,
      AVG(margin_percent) as avg_margin_percent,
      COUNT(*) as transaction_count
    FROM transactions
    WHERE created_at BETWEEN $1 AND $2
  `;
  
  res.json(summary);
});

// Frontend: Dashboard component
const ProfitDashboard = () => {
  const { data } = useQuery('profit-summary', fetchProfitSummary);
  
  return (
    <div className="profit-dashboard">
      <KPIGrid>
        <KPICard title="Revenue" value={data?.total_revenue} />
        <KPICard title="COGS" value={data?.total_cogs} />
        <KPICard title="Gross Profit" value={data?.total_margin} />
        <KPICard title="Margin %" value={data?.avg_margin_percent} format="percent" />
      </KPIGrid>
      
      <MarginWaterfallChart data={data?.margin_breakdown} />
      
      <MenuEngineeringMatrix products={data?.products} />
    </div>
  );
};
```

### 4.3 Phase 3: Variance Analysis (Weeks 9-12)

**Variance Tracking:**
```typescript
// Scheduled job for daily variance calculation
async function calculateDailyVariance(businessDate: Date) {
  // Get PMIX data from transactions
  const sales = await getSalesData(businessDate);
  
  // Calculate theoretical usage from recipes
  const theoreticalUsage = calculateTheoreticalUsage(sales);
  
  // Get inventory counts
  const beginningInventory = await getInventoryCount(startOfDay);
  const endingInventory = await getInventoryCount(endOfDay);
  const purchases = await getPurchases(businessDate);
  
  // Calculate actual usage
  const actualUsage = {
    ...beginningInventory,
    purchases: purchases,
    ...endingInventory
  };
  
  // Calculate variance
  const variance = {
    date: businessDate,
    items: compareUsage(theoreticalUsage, actualUsage),
    alerts: generateAlerts(theoreticalUsage, actualUsage)
  };
  
  await saveVarianceReport(variance);
  
  // Send alerts if thresholds exceeded
  await sendVarianceAlerts(variance.alerts);
}
```

### 4.4 Phase 4: Real-Time Dashboard (Weeks 13-16)

**WebSocket Implementation:**
```typescript
// Real-time margin updates
io.on('connection', (socket) => {
  socket.join('dashboard-updates');
});

// Emit on transaction
transactionService.on('transaction_created', async (transaction) => {
  const margin = await calculateMargin(transaction);
  
  io.to('dashboard-updates').emit('margin-update', {
    transaction_id: transaction.id,
    revenue: transaction.total,
    cogs: margin.cogs,
    margin_percent: margin.percent,
    timestamp: new Date()
  });
});

// Frontend: WebSocket listener
useEffect(() => {
  const socket = io('/dashboard-updates');
  
  socket.on('margin-update', (data) => {
    queryClient.setQueryData(['realtime-metrics'], (old) => ({
      ...old,
      revenue: old.revenue + data.revenue,
      cogs: old.cogs + data.cogs,
      transaction_count: old.transaction_count + 1
    }));
  });
  
  return () => socket.disconnect();
}, []);
```

---

## 5. Technical Considerations

### 5.1 Performance Optimization

**Materialized Views for Historical Data:**
```sql
CREATE MATERIALIZED VIEW daily_profit_summary AS
SELECT 
  DATE(created_at) as business_date,
  SUM(subtotal) as total_revenue,
  SUM(cogs) as total_cogs,
  SUM(subtotal - cogs) as total_margin,
  COUNT(*) as transaction_count,
  AVG((subtotal - cogs) / NULLIF(subtotal, 0)) as avg_margin_percent
FROM transactions
GROUP BY DATE(created_at);

CREATE INDEX idx_daily_profit_date ON daily_profit_summary(business_date);

-- Refresh daily
REFRESH MATERIALIZED VIEW daily_profit_summary;
```

**Caching Strategy:**
```typescript
// Redis cache for real-time metrics
const CACHE_TTL = 60; // 60 seconds

async function getDashboardMetrics(date: Date) {
  const cacheKey = `dashboard:${formatDate(date)}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  const metrics = await calculateMetrics(date);
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(metrics));
  
  return metrics;
}
```

### 5.2 Data Integrity

**Audit Trail:**
```typescript
interface CostAuditLog {
  id: string;
  transaction_id: string;
  calculation_type: 'recipe' | 'ingredient' | 'manual';
  recipe_id?: string;
  ingredient_costs: {
    ingredient_id: string;
    quantity: number;
    unit_cost: number;
    source: 'invoice' | 'average' | 'manual';
  }[];
  total_cost: number;
  calculated_at: Date;
  calculated_by: string;
}

// On each cost calculation
async function logCostCalculation(
  transaction: Transaction,
  costBreakdown: CostBreakdown
) {
  await prisma.costAuditLog.create({
    data: {
      transaction_id: transaction.id,
      calculation_type: 'recipe',
      ingredient_costs: costBreakdown.ingredients,
      total_cost: costBreakdown.total,
      calculated_by: transaction.userId
    }
  });
}
```

### 5.3 Integration Points

**POS Integration:**
```typescript
// Webhook for real-time transaction updates
app.post('/webhook/transaction', async (req, res) => {
  const { transaction } = req.body;
  
  // Calculate COGS immediately
  const cogs = await costService.calculateTransactionCOGS(transaction.items);
  
  // Update transaction with COGS
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      cogs: cogs,
      margin: transaction.subtotal - cogs
    }
  });
  
  // Emit real-time update
  io.emit('transaction-updated', { id: transaction.id, cogs });
  
  res.json({ success: true });
});
```

---

## 6. Summary

### Key Takeaways

1. **Transaction-Time Cost Tracking**
   - Store ingredient costs with each transaction
   - Enables accurate historical margin analysis
   - Required for proper financial reporting

2. **Hybrid Reporting Architecture**
   - Real-time for current day/week metrics
   - Batch processing for historical analytics
   - Materialized views for performance

3. **Variance Analysis**
   - Theoretical vs Actual COGS comparison
   - Industry standard threshold: 1-3% acceptable
   - Critical for cost control and loss prevention

4. **Hospitality-Specific Metrics**
   - Pour cost: 15-25% for spirits, 20-35% for beer
   - Food cost: 28-35% target
   - Menu engineering matrix for profitability analysis

5. **Alert Thresholds**
   - Food cost > 35%: Warning
   - Variance > 3%: Critical
   - Margin decline > 10%: Warning

### Implementation Priority

1. **High Priority**
   - Transaction-level COGS calculation
   - Recipe costing module
   - Basic profit dashboard

2. **Medium Priority**
   - Variance analysis
   - Real-time margin tracking
   - Alert system

3. **Lower Priority**
   - Advanced analytics (ML-based predictions)
   - Multi-unit consolidation
   - API integrations with accounting systems

---

*Document generated: 2026-04-08*
*Based on analysis of: Odoo ERP, ERPNext, Recipe Costing Research, Financial System Best Practices*
