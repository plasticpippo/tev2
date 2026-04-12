# Profitability Analytics API Reference

## Overview

The Profitability Analytics system provides cost management, profit tracking, and variance analysis for the POS application. It enables tracking ingredient costs, calculating recipe costs, capturing transaction-level COGS, and analyzing profit margins over time.

## Authentication

All endpoints require admin authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Base URL

All endpoints are prefixed with `/api`.

---

## Cost Management Endpoints

### Ingredient Costs

#### `GET /api/cost-management/ingredients`

List all ingredients (StockItems) with their current cost information.

**Query Parameters:**

| Parameter  | Type   | Required | Description                        |
|------------|--------|----------|------------------------------------|
| search     | string | No       | Filter by ingredient name           |
| category   | string | No       | Filter by stock item type           |

**Response:** `IngredientCostInfo[]`

| Field            | Type   | Description                                       |
|------------------|--------|---------------------------------------------------|
| id               | string | StockItem UUID                                    |
| name             | string | Ingredient name                                   |
| type             | string | Stock item type                                   |
| baseUnit         | string | Base tracking unit (ml, g, pcs)                  |
| standardCost     | number | Current standard cost per base unit              |
| costPerUnit      | number | Cost per purchasing unit                         |
| lastCostUpdate   | string | ISO date of last cost update                     |
| costUpdateReason | string | Reason for last cost change                      |
| costStatus       | string | `pending` / `current` / `stale` / `outdated`     |

**Cost Status Logic:**
- `pending`: standardCost is 0
- `current`: lastCostUpdate within 30 days
- `stale`: lastCostUpdate 30-90 days ago
- `outdated`: lastCostUpdate more than 90 days ago

---

#### `GET /api/cost-management/ingredients/:id`

Get a single ingredient with full cost details and the last 5 cost history entries.

**Response:** `{ ingredient: IngredientCostInfo, history: CostHistoryEntry[] }`

---

#### `POST /api/cost-management/ingredients/:id/cost`

Update an ingredient's standard cost. Creates a CostHistory record, updates the StockItem, and automatically recalculates all variant costs that use this ingredient.

**Request Body:**

```json
{
  "cost": 15.50,
  "reason": "Supplier price increase",
  "effectiveDate": "2026-04-10",
  "notes": "Optional notes"
}
```

| Field         | Type   | Required | Description                      |
|---------------|--------|----------|----------------------------------|
| cost          | number | Yes      | New cost (must be > 0)           |
| reason        | string | Yes      | Reason for the change            |
| effectiveDate | string | No       | ISO date (defaults to now)       |
| notes         | string | No       | Optional notes                   |

**Response:** `CostHistoryEntry`

---

#### `GET /api/cost-management/ingredients/:id/history`

Get the full cost history for an ingredient, ordered by date descending.

**Response:** `CostHistoryEntry[]`

---

#### `GET /api/cost-management/recent-changes`

Get recent cost changes across all ingredients.

**Query Parameters:**

| Parameter | Type   | Required | Default | Description         |
|-----------|--------|----------|---------|---------------------|
| limit     | number | No       | 20      | Max results to return |

**Response:** `CostHistoryEntry[]`

---

### Variant / Recipe Costs

#### `GET /api/cost-management/variants/cost-summary`

Get all product variants with their calculated cost information.

**Query Parameters:**

| Parameter | Type   | Required | Description                                  |
|-----------|--------|----------|----------------------------------------------|
| status    | string | No       | Filter by costStatus: `pending`, `current`   |
| productId | number | No       | Filter by product ID                         |

**Response:** `VariantCostSummary[]`

| Field           | Type        | Description                              |
|-----------------|-------------|------------------------------------------|
| id              | number      | Variant ID                               |
| name            | string      | Variant name                             |
| price           | number      | Selling price                            |
| theoreticalCost | number/null | Calculated recipe cost                   |
| currentMargin   | number/null | Margin percentage                        |
| costStatus      | string      | `pending` / `current`                    |
| lastCostCalc    | string/null | ISO date of last cost calculation        |
| productId       | number      | Parent product ID                        |
| productName     | string      | Parent product name                      |
| categoryName    | string      | Product category name                    |

---

#### `GET /api/cost-management/variants/:id/cost`

Get the detailed recipe cost breakdown for a specific variant.

**Response:** `VariantCostBreakdown`

| Field           | Type        | Description                              |
|-----------------|-------------|------------------------------------------|
| variantId       | number      | Variant ID                               |
| variantName     | string      | Variant name                             |
| productId       | number      | Parent product ID                        |
| productName     | string      | Parent product name                      |
| ingredientCosts | array       | Array of ingredient cost details         |
| totalCost       | number/null | Sum of all ingredient costs              |
| hasValidCosts   | boolean     | Whether all ingredients have valid costs |

Each item in `ingredientCosts`:

| Field          | Type   | Description                |
|----------------|--------|----------------------------|
| stockItemId    | string | StockItem UUID             |
| stockItemName  | string | Ingredient name            |
| quantity       | number | Quantity in recipe         |
| standardCost   | number | Cost per base unit         |
| ingredientCost | number | quantity * standardCost    |

---

#### `POST /api/cost-management/variants/:id/recalculate`

Force recalculation of a variant's theoretical cost and margin.

**Response:**

```json
{
  "variantId": 22,
  "theoreticalCost": 2.40,
  "currentMargin": 70.0,
  "costStatus": "current",
  "lastCostCalc": "2026-04-10T10:00:00.000Z"
}
```

---

#### `POST /api/cost-management/bulk-recalculate`

Recalculate all variant costs in the system.

**Response:**

```json
{
  "updated": 35,
  "failed": 0,
  "skipped": 4
}
```

---

### Inventory Counts

#### `GET /api/cost-management/inventory-counts`

List inventory counts.

**Query Parameters:**

| Parameter | Type   | Required | Description                |
|-----------|--------|----------|----------------------------|
| status    | string | No       | `draft` / `submitted` / `approved` |
| fromDate  | string | No       | ISO date                    |
| toDate    | string | No       | ISO date                    |

---

#### `POST /api/cost-management/inventory-counts`

Create a new inventory count.

**Request Body:**

```json
{
  "countDate": "2026-04-10",
  "countType": "full",
  "notes": "Monthly stock check",
  "items": [
    { "stockItemId": "uuid-here", "quantity": 50, "notes": "Full bottles" },
    { "stockItemId": "uuid-here", "quantity": 12, "notes": "" }
  ]
}
```

| Field     | Type   | Required | Description                              |
|-----------|--------|----------|------------------------------------------|
| countDate | string | Yes      | ISO date of the count                    |
| countType | string | Yes      | `full` / `partial` / `spot`              |
| notes     | string | No       | Optional notes                           |
| items     | array  | Yes      | At least one item required               |

For each item, `unitCost` is automatically looked up from the StockItem and `extendedValue` is calculated as `quantity * unitCost`.

**Response:** `InventoryCountDetail` (HTTP 201)

---

#### `GET /api/cost-management/inventory-counts/:id`

Get a single inventory count with all its items.

**Response:** `InventoryCountDetail`

---

#### `POST /api/cost-management/inventory-counts/:id/submit`

Transition an inventory count from `draft` to `submitted`.

---

#### `POST /api/cost-management/inventory-counts/:id/approve`

Transition an inventory count from `submitted` to `approved`.

---

### Variance Reports

#### `GET /api/cost-management/variance-reports`

List variance reports with pagination.

**Query Parameters:**

| Parameter | Type   | Required | Default | Description         |
|-----------|--------|----------|---------|---------------------|
| page      | number | No       | 1       | Page number         |
| limit     | number | No       | 20      | Results per page    |

**Response:**

```json
{
  "reports": [VarianceReportSummary],
  "totalCount": 5
}
```

---

#### `POST /api/cost-management/variance-reports/generate`

Generate a variance report comparing theoretical ingredient usage (from recipes and sales) against actual usage (from inventory counts).

**Request Body:**

```json
{
  "periodStart": "2026-04-01",
  "periodEnd": "2026-04-10",
  "beginningCountId": 1,
  "endingCountId": 2
}
```

| Parameter         | Type   | Required | Description                                   |
|-------------------|--------|----------|-----------------------------------------------|
| periodStart       | string | Yes      | Period start date (ISO)                       |
| periodEnd         | string | Yes      | Period end date (ISO)                         |
| beginningCountId  | number | No       | Approved inventory count at period start      |
| endingCountId     | number | No       | Approved inventory count at period end        |

**How it works:**
1. Fetches all completed transactions in the period
2. For each transaction item, looks up the variant's recipe (StockConsumption) to calculate theoretical ingredient usage
3. Aggregates theoretical usage per ingredient across all sales
4. Derives actual usage from inventory counts: `actual = beginning + purchases - ending`
5. Calculates variance per ingredient: `varianceQty = actual - theoretical`
6. Sets per-item status: `<2%` = ok, `2-5%` = warning, `>5%` = critical

**Response:** `VarianceReportDetail` (HTTP 201)

---

#### `GET /api/cost-management/variance-reports/:id`

Get a single variance report with full item-level detail.

---

#### `PATCH /api/cost-management/variance-reports/:id/status`

Update a variance report's status.

**Request Body:**

```json
{ "status": "reviewed" }
```

Valid transitions: `draft` -> `reviewed` -> `final`

---

## Profit Analytics Endpoints

All profit analytics endpoints require `startDate` and `endDate` query parameters in `YYYY-MM-DD` format.

### `GET /api/analytics/profit-summary`

Returns profit KPIs for a date range.

**Response:**

```json
{
  "period": { "start": "2026-04-01", "end": "2026-04-10" },
  "revenue": 6445.45,
  "cogs": 3.60,
  "grossProfit": 6441.85,
  "marginPercent": 98.0,
  "transactionCount": 500,
  "averageTransaction": 12.89,
  "averageMargin": 72.5,
  "transactionsWithCosts": 55,
  "costCoveragePercent": 11.0
}
```

| Field                  | Type   | Description                                        |
|------------------------|--------|----------------------------------------------------|
| revenue                | number | Total revenue from completed transactions          |
| cogs                   | number | Total cost of goods sold                           |
| grossProfit            | number | revenue - cogs                                    |
| marginPercent          | number | (grossProfit / revenue) * 100                     |
| transactionCount       | number | Number of completed transactions                   |
| averageTransaction     | number | revenue / transactionCount                        |
| averageMargin          | number | Average margin from transactions with cost data    |
| transactionsWithCosts  | number | Transactions that have cost data captured          |
| costCoveragePercent    | number | % of transactions with cost data                   |

---

### `GET /api/analytics/profit-comparison`

Compares the current period against the previous period of equal duration.

**Response:**

```json
{
  "current": { ...ProfitSummary },
  "previous": { ...ProfitSummary },
  "changes": {
    "revenueChange": 500.00,
    "revenueChangePercent": 8.4,
    "cogsChange": -10.00,
    "cogsChangePercent": -73.5,
    "grossProfitChange": 510.00,
    "grossProfitChangePercent": 8.6,
    "marginChangePp": 0.5
  }
}
```

---

### `GET /api/analytics/margin-by-category`

Margin breakdown by product category. COGS is allocated proportionally from transaction-level cost data.

**Response:** `CategoryMargin[]`

---

### `GET /api/analytics/margin-by-product`

Margin breakdown by product variant. Uses `theoreticalCost` from ProductVariant records.

**Query Parameters:**

| Parameter | Type   | Required | Default | Description         |
|-----------|--------|----------|---------|---------------------|
| limit     | number | No       | 50      | Max results         |

**Response:** `ProductMargin[]`

---

### `GET /api/analytics/margin-trend`

Day-by-day margin data for the selected period.

**Response:** `MarginTrendPoint[]`

```json
[
  {
    "date": "2026-04-01",
    "revenue": 450.00,
    "cogs": 45.00,
    "grossProfit": 405.00,
    "marginPercent": 90.0,
    "transactionCount": 35
  }
]
```

---

### `GET /api/analytics/profit-dashboard`

Aggregates all profit analytics data into a single response. Equivalent to calling profit-summary, profit-comparison, margin-by-category, margin-by-product, and margin-trend together.

**Response:**

```json
{
  "summary": { ...ProfitSummary },
  "comparison": { ...ProfitComparison },
  "byCategory": [ ...CategoryMargin ],
  "byProduct": [ ...ProductMargin ],
  "trend": [ ...MarginTrendPoint ]
}
```

---

## Data Flow

```
1. Ingredient Costs Entered
   POST /api/cost-management/ingredients/:id/cost
       |
       v
2. Variant Costs Recalculated (automatic)
   CostHistoryService -> CostCalculationService
       |
       v
3. Transaction Cost Captured (automatic at sale time)
   Transaction.totalCost, Transaction.grossMargin
       |
       v
4. Profit Analytics Computed (on-demand)
   GET /api/analytics/profit-dashboard
       |
       v
5. Inventory Counts Entered (periodic)
   POST /api/cost-management/inventory-counts
       |
       v
6. Variance Reports Generated (periodic)
   POST /api/cost-management/variance-reports/generate
```

## Error Handling

All endpoints return errors in the format:

```json
{ "error": "Human-readable error message" }
```

| Status | Description                                          |
|--------|------------------------------------------------------|
| 400    | Validation error (missing/invalid parameters)        |
| 401    | Authentication required                               |
| 403    | Admin access required                                 |
| 404    | Resource not found                                   |
| 500    | Internal server error                                 |
