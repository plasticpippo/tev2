# Financial Reporting System Best Practices

## 1. Financial Reporting System Architectures

### Event Sourcing vs Traditional RDBMS

#### Event Sourcing Approach
**Best For:** High-volume transactional systems requiring complete audit trails

| Aspect | Event Sourcing | Traditional RDBMS |
|--------|---------------|-------------------|
| Audit Trail | Complete, immutable history by design | Requires additional tables/triggers |
| Data Integrity | Events are append-only, never modified | Current state only, history lost on update |
| Debugging | Full replay capability | Limited to transaction logs |
| Compliance | Naturally satisfies SOX/MiFID II | Requires additional implementation |
| Query Performance | Requires projections/read models | Direct queries on current state |

**Key Pattern - Immutable Event Storage:**
```sql
-- Events are INSERT-only, never UPDATE or DELETE
INSERT INTO events (aggregate_id, sequence_number, event_type, payload)
VALUES (:aggregate_id, :sequence_number, :event_type, :payload);
```

**Recommendation:** Use event sourcing for:
- Transaction processing with regulatory compliance requirements
- Systems needing complete audit trails
- Applications requiring point-in-time reconstruction

### Audit Trail Requirements

**Core Requirements:**
1. **Immutability**: Once recorded, financial events must never be altered
2. **Completeness**: Every state change must be captured
3. **Traceability**: Ability to reconstruct state at any point in time
4. **User Attribution**: Track who made each change and when
5. **Source Tracking**: Record the origin of each transaction

**Implementation Pattern:**
```typescript
interface AuditEvent {
  id: string;
  aggregateId: string;
  version: number;
  eventType: string;
  payload: JSON;
  transactionId: string;  // Database transaction ID
  timestamp: Date;
  userId: string;
  source: string;  // API, import, migration, etc.
}
```

### Multi-Currency and Multi-Tax-Jurisdiction Handling

**Multi-Currency Architecture:**
```
Transaction
├── base_currency: Currency
├── base_amount: Decimal
├── reporting_currency: Currency
├── reporting_amount: Decimal
├── exchange_rate: Decimal
├── exchange_rate_date: Date
└── exchange_rate_source: string
```

**Best Practices:**
1. Store amounts in both transaction and reporting currencies
2. Record exchange rate source and timestamp for audit
3. Use fixed-point decimals (never floating point)
4. Implement currency conversion as events for audit trail
5. Handle currency rate changes through separate rate tables

**Multi-Tax-Jurisdiction:**
- Store tax rates as separate entities with effective date ranges
- Link transactions to tax jurisdiction at time of creation
- Preserve historical tax rates for accurate reporting
- Support multiple tax rates per transaction line item

---

## 2. Profit Margin Calculation Methodologies

### Gross Profit Margin

**Formula:** `(Revenue - COGS) / Revenue * 100`

**Implementation Considerations:**
```python
# Gross profit calculation with proper handling
gross_profit = revenue - cost_of_goods_sold
gross_margin_percent = (gross_profit / revenue) * 100

# Handle edge cases
if revenue == 0:
    gross_margin_percent = 0  # or handle as special case
```

**Best Practices:**
- Use COGS at time of sale (not current replacement cost)
- Include direct labor in COGS
- Exclude overhead from gross profit calculation
- Track ingredient costs with timestamps for historical accuracy

### Operating Profit Margin

**Formula:** `(Operating Revenue - Operating Expenses) / Revenue * 100`

**Components:**
- Gross Profit - Operating Expenses = Operating Profit
- Operating expenses include: rent, utilities, salaries, marketing
- Exclude: interest, taxes, extraordinary items

### Net Profit Margin

**Formula:** `(Net Profit) / Revenue * 100`

**Calculation Flow:**
```
Revenue
- COGS
= Gross Profit
- Operating Expenses
= Operating Profit (EBIT)
- Interest Expense
- Taxes
= Net Profit
```

### Handling Ingredient Cost Fluctuations

**Time-Based Cost Tracking:**
```typescript
interface IngredientCost {
  ingredient_id: string;
  effective_from: Date;
  effective_to: Date | null;
  unit_cost: Decimal;
  currency: string;
  supplier_id: string;
}
```

**Strategies:**

1. **FIFO (First In, First Out)**
   - Match oldest costs to current sales
   - Best for perishable goods

2. **Moving Average**
   ```python
   new_average = (current_inventory_value + new_purchase_value) /
                 (current_quantity + new_quantity)
   ```

3. **Standard Costing**
   - Use predetermined costs, adjust periodically
   - Track variances separately

4. **Actual Cost at Sale**
   - Store actual ingredient costs with each sale
   - Most accurate but requires tracking

**Recommendation:** For hospitality POS, use **actual cost at sale**:
- Record ingredient costs when transaction occurs
- Link to historical price snapshots
- Enables accurate margin analysis over time

---

## 3. Tax Computation Logic

### VAT/Sales Tax Calculation Patterns

**Tax-Exclusive Transactions:**
```python
# Tax added on top of base amount
base_amount = 100.00
tax_rate = 0.20  # 20%
tax_amount = base_amount * tax_rate  # 20.00
total_amount = base_amount + tax_amount  # 120.00
```

**Tax-Inclusive Transactions:**
```python
# Tax already included in amount
total_amount = 100.00
tax_rate = 0.20  # 20%
base_amount = total_amount / (1 + tax_rate)  # 83.33
tax_amount = total_amount - base_amount  # 16.67
```

### Tax Rate Change Handling

**Historical Tax Rate Storage:**
```typescript
interface TaxRate {
  id: string;
  name: string;
  code: string;
  rate: Decimal;
  jurisdiction: string;
  effective_from: Date;
  effective_to: Date | null;
  is_default: boolean;
}
```

**Best Practices:**
1. Never modify existing tax rates - create new records
2. Store tax rate ID with each transaction
3. Use effective date ranges for automatic selection
4. Preserve original tax amounts in transaction records
5. Support tax rate lookup at transaction time

**Implementation:**
```sql
-- Get applicable tax rate for a transaction date
SELECT * FROM tax_rates
WHERE jurisdiction = :jurisdiction
  AND effective_from <= :transaction_date
  AND (effective_to IS NULL OR effective_to > :transaction_date)
ORDER BY effective_from DESC
LIMIT 1;
```

### Multiple Tax Rates Per Transaction

**Line Item Tax Structure:**
```typescript
interface TransactionLineItem {
  id: string;
  transaction_id: string;
  product_id: string;
  amount: Decimal;
  tax_id: string;           // Primary tax
  tax_inclusive: boolean;
  secondary_tax_id?: string; // Compound/secondary tax
  tax_amount: Decimal;
  secondary_tax_amount?: Decimal;
}
```

**Compound Tax Example:**
- Canada: GST + Provincial tax (calculated on base)
- Some jurisdictions: Tax on tax

---

## 4. Dashboard Design for Financial Data Visualization

### Key Financial KPIs for Hospitality Industry

**Revenue Metrics:**
| KPI | Description | Calculation |
|-----|-------------|-------------|
| Total Revenue | All sales | Sum of all transactions |
| Revenue per Seat | Average per seating capacity | Revenue / Total Seats |
| Revenue per Employee | Labor efficiency | Revenue / FTE Count |
| Average Check | Per transaction | Revenue / Transaction Count |

**Profitability Metrics:**
| KPI | Description | Calculation |
|-----|-------------|-------------|
| Gross Margin | Basic profitability | (Revenue - COGS) / Revenue |
| Food Cost % | Cost control | Food COGS / Food Revenue |
| Beverage Cost % | Bar efficiency | Bev COGS / Bev Revenue |
| Labor Cost % | Staff efficiency | Labor Cost / Revenue |

**Operational Metrics:**
- Table turnover rate
- Average service time
- Peak hour revenue
- Payment method distribution

### Real-Time vs Batch Reporting Trade-offs

| Aspect | Real-Time | Batch |
|--------|-----------|-------|
| Latency | Sub-second to minutes | Hours to daily |
| System Load | Continuous | Scheduled bursts |
| Complexity | Higher (websockets, streaming) | Lower (scheduled jobs) |
| Use Case | Live dashboards, alerts | Financial reports, analytics |

**Recommendation - Hybrid Approach:**
```
Real-Time Layer          Batch Layer
     │                        │
     ▼                        ▼
Current Session Data    Historical Analytics
     │                        │
     └──────────┬─────────────┘
                ▼
         Unified Dashboard
```

### Drill-Down Capabilities

**Hierarchical Structure:**
```
Global
├── Region
│   ├── Location/Branch
│   │   ├── Department
│   │   │   ├── Category
│   │   │   │   └── Product
```

**Implementation Pattern:**
```typescript
interface DrillDownLevel {
  level: 'global' | 'region' | 'location' | 'category' | 'product';
  id: string;
  parent_id?: string;
  metrics: {
    revenue: Decimal;
    cogs: Decimal;
    margin: Decimal;
    transaction_count: number;
  };
}
```

**Chart.js Implementation:**
```javascript
// Real-time chart update
function updateChart(newData) {
  chart.data.datasets[0].data = newData;
  chart.update('active');  // Animate transition
}

// Drill-down navigation
function drillDown(categoryId) {
  const detailData = await fetchMetrics(categoryId);
  updateChart(detailData);
  updateBreadcrumbs(categoryId);
}
```

---

## 5. Data Security Standards for Financial Applications

### PCI-DSS Considerations for Payment Data

**Core Requirements:**
1. **Never store full card numbers** - Only tokens/last 4 digits
2. **Encrypt transmission** - TLS 1.2+ for all payment data
3. **Secure storage** - If PAN stored, must be encrypted
4. **Access control** - Need-to-know basis only
5. **Regular testing** - Vulnerability scans and penetration testing

**Architecture Pattern:**
```
┌─────────────┐     TLS      ┌─────────────┐
│   POS/App   │ ─────────────▶│  Payment    │
│             │               │  Gateway    │
└─────────────┘               └─────────────┘
       │                             │
       │ Store token only            │ Returns token
       ▼                             ▼
┌─────────────┐               ┌─────────────┐
│  Database   │               │   PCI       │
│  (Token)    │               │  Compliant  │
└─────────────┘               │  Provider   │
                              └─────────────┘
```

**Do NOT Store:**
- Full credit card numbers (PAN)
- CVV/CVC codes
- Track data from magnetic stripe
- PIN blocks

**May Store (with encryption):**
- Cardholder name
- Expiration date
- Service code
- Last 4 digits of PAN

### GDPR/Privacy for Customer Data

**Key Principles:**
1. **Lawful basis** - Consent, contract, legitimate interest
2. **Data minimization** - Collect only what's needed
3. **Purpose limitation** - Use data only for stated purposes
4. **Storage limitation** - Delete when no longer needed
5. **Right to erasure** - Honor deletion requests

**Implementation:**
```typescript
interface DataRetention {
  data_type: 'transaction' | 'customer' | 'audit';
  retention_period_days: number;
  legal_basis: string;
  deletion_method: 'soft_delete' | 'anonymize' | 'hard_delete';
}

// Customer data with GDPR compliance
interface CustomerData {
  id: string;
  personal_data: {
    name: string;
    email: string;
    phone?: string;
  };
  consent: {
    marketing: boolean;
    analytics: boolean;
    timestamp: Date;
  };
  right_to_be_forgotten_requested: boolean;
}
```

### Role-Based Access for Financial Reports

**Permission Matrix:**
| Role | Revenue | Costs | Margins | Tax Reports | Audit Logs |
|------|---------|-------|---------|-------------|------------|
| Owner | Full | Full | Full | Full | Full |
| Manager | Location | Location | Location | Read | None |
| Accountant | Full | Full | Full | Full | Read |
| Cashier | Own | None | None | None | None |
| Auditor | Read | Read | Read | Read | Full |

**Implementation Pattern:**
```typescript
interface Permission {
  resource: 'revenue' | 'costs' | 'margins' | 'tax' | 'audit';
  actions: ('create' | 'read' | 'update' | 'delete')[];
  scope: 'global' | 'location' | 'department' | 'own';
}

interface Role {
  name: string;
  permissions: Permission[];
}

// Check permission before data access
function canAccess(user: User, resource: string, action: string, scopeId?: string): boolean {
  const role = user.role;
  const permission = role.permissions.find(p => p.resource === resource);
  if (!permission) return false;
  if (!permission.actions.includes(action as any)) return false;
  if (permission.scope !== 'global' && scopeId !== user.scopeId) return false;
  return true;
}
```

---

## Summary of Recommendations

### Architecture
1. **Use Event Sourcing** for transaction processing with immutable audit trail
2. **Store multi-currency** with both transaction and reporting amounts
3. **Implement historical tax rates** with effective date ranges

### Calculations
1. **Use actual cost at sale** for accurate margin tracking
2. **Implement proper rounding** with fixed-point decimals
3. **Store calculated values** with source data for verification

### Dashboards
1. **Hybrid real-time/batch** approach for optimal performance
2. **Implement drill-down** from global to product level
3. **Focus on actionable KPIs** relevant to hospitality

### Security
1. **Never store full payment card data** - use tokens
2. **Implement GDPR-compliant** data retention policies
3. **Role-based access** with scope restrictions

---

*Document generated from research on: 2026-04-08*
*Sources: Context7 documentation, PCI Security Standards, GDPR.eu*
