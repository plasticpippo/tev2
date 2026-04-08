# Recipe Costing & Food Cost Management Systems Research

## Executive Summary

This document provides comprehensive research on professional recipe costing and food cost management systems, analyzing methodologies, data structures, and best practices from leading systems including MarginEdge, xtraCHEF (Toast Inventory), CostGuard (reciProfity), and Galley Solutions.

---

## 1. Professional Recipe Costing Modules

### 1.1 Core Functionality

All leading recipe costing systems share these fundamental capabilities:

| Feature | MarginEdge | reciProfity | Galley | xtraCHEF |
|---------|-----------|-------------|--------|----------|
| Invoice Processing | Automated (24-48h) | Manual/Upload | API Integration | Automated |
| Recipe Costing | Real-time | Real-time | Real-time | Real-time |
| Unit Conversions | Central | 200+ units | Smart | Central |
| Yield Calculations | Manual entry | Book of Yields | Built-in | Manual |
| Price Alerts | Yes | Yes | Yes | Yes |

### 1.2 Data Model Patterns

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

### 1.3 Key Methodologies

#### Recipe Cost Calculation Formula
```
Recipe Cost = SUM(Ingredient Cost × Quantity / Yield)

Where:
- Ingredient Cost = Latest Invoice Price / Pack Size × Unit Conversion
- Yield = Usable portion after preparation (e.g., 75% for trimmed vegetables)
```

#### Unit Conversion Engine
```typescript
interface Conversion {
  fromUnit: Unit;
  toUnit: Unit;
  factor: number;
  density?: number; // for weight-volume conversions
}

// Example conversions from Book of Yields:
// 1 cup all-purpose flour = 4.5 oz
// 1 cup granulated sugar = 7.1 oz
// 1 cup olive oil = 7.7 oz
```

---

## 2. Theoretical vs Actual Food Cost Variance Analysis

### 2.1 Core Formulas

#### Theoretical Food Cost
```
Theoretical Food Cost = SUM(Menu Items Sold × Theoretical Recipe Cost)

Theoretical Food Cost % = (Theoretical Food Cost / Total Sales) × 100
```

#### Actual Food Cost
```
Beginning Inventory
+ Purchases (from invoices)
- Ending Inventory (from counts)
= Actual Food Cost

Actual Food Cost % = (Actual Food Cost / Total Sales) × 100
```

#### Variance Calculation
```
Variance $ = Actual Food Cost - Theoretical Food Cost
Variance % = ((Actual - Theoretical) / Theoretical) × 100

Positive Variance = Over-use/waste/loss
Negative Variance = Under-use (possible portion inconsistencies)
```

### 2.2 Tracking Methods

| System | Method | Data Sources | Frequency |
|--------|--------|--------------|-----------|
| MarginEdge | PMIX Integration | POS + Invoices + Counts | Daily |
| reciProfity | Sales Import | Any POS with PLU/Qty | Configurable |
| Galley | Real-time API | POS + Inventory | Real-time |
| xtraCHEF | Toast Integration | Toast POS Native | Daily |

### 2.3 PMIX (Product Mix) Data Structure
```
PMIX_RECORD
├── date
├── location_id
├── items[]
│   ├── plu (menu item ID)
│   ├── name
│   ├── quantity_sold
│   ├── revenue
│   └── modifiers[]
│       ├── modifier_id
│       └── quantity
└── timestamp
```

### 2.4 Variance Report Structure
```
VARIANCE_REPORT
├── period_start
├── period_end
├── items[]
│   ├── ingredient_id
│   ├── unit
│   ├── beginning_inventory (qty + $)
│   ├── purchases (qty + $)
│   ├── ending_inventory (qty + $)
│   ├── actual_usage (qty + $)
│   ├── theoretical_usage (qty + $)
│   ├── variance_qty
│   ├── variance_$
│   └── variance_%
└── totals
    ├── total_actual_cost
    ├── total_theoretical_cost
    └── total_variance
```

---

## 3. Ingredient-Level Cost Tracking

### 3.1 Unit Conversions

All systems implement comprehensive unit conversion systems:

#### Unit Categories
- **Weight**: oz, lb, g, kg, etc.
- **Volume**: tsp, tbsp, cup, fl oz, gal, L, mL, etc.
- **Count**: ea, dozen, case, etc.
- **Restaurant-specific**: pinch, dash, clove, etc.

#### Conversion Database Structure
```typescript
interface UnitConversion {
  // Direct conversions
  weight_conversions: Map<Unit, Map<Unit, number>>;
  volume_conversions: Map<Unit, Map<Unit, number>>;
  
  // Weight-Volume requires density
  weight_to_volume: {
    ingredient_id: string;
    weight_unit: Unit;
    weight_qty: number;
    volume_unit: Unit;
    volume_qty: number;
    density: number;
  }[];
}
```

#### Book of Yields Integration
reciProfity integrates with the Book of Yields database which provides:
- Pre-calculated yields for 1000+ ingredients
- Weight-to-volume conversions
- Trim yields by preparation method
- Cooking loss factors

Example yield data:
```json
{
  "ingredient": "Onion",
  "prep_method": "diced",
  "yield": 0.87,
  "conversions": {
    "1_cup_diced": "5.6_oz",
    "1_lb_whole": "12.8_oz_diced"
  }
}
```

### 3.2 Yield Factors

Yield percentages vary by preparation method:

| Ingredient | Prep Method | Yield % |
|------------|-------------|---------|
| Onion | Peeled | 89% |
| Onion | Diced | 87% |
| Potato | Peeled | 78% |
| Potato | Peeled + Sliced | 75% |
| Salmon | Filleted | 68% |
| Salmon | Portioned | 60% |

**Implementation Pattern**:
```typescript
interface IngredientYield {
  ingredient_id: string;
  prep_methods: {
    name: string;
    yield_percent: number;
    waste_tracking: boolean;
  }[];
  default_prep: string;
}

// Cost calculation with yield:
function calculateIngredientCost(
  ingredient: Ingredient,
  quantity: number,
  unit: Unit,
  prepMethod: string
): number {
  const baseCost = getBaseCost(ingredient, quantity, unit);
  const yieldPercent = getYieldPercent(ingredient, prepMethod);
  return baseCost / yieldPercent;
}
```

### 3.3 Waste Tracking

Waste entry points in professional systems:

```
WASTE_ENTRY
├── id
├── timestamp
├── ingredient_id (or recipe_id)
├── quantity
├── unit
├── reason (spoilage, over-prep, dropped, etc.)
├── cost_impact (calculated)
├── recorded_by (user_id)
└── location_id
```

Waste categories:
1. **Pre-production waste**: Trim, spoilage, expiration
2. **Production waste**: Over-prep, errors, quality issues
3. **Post-production waste**: Customer returns, plate waste

---

## 4. Portion Costing Methodologies

### 4.1 Recipe Scaling

Professional systems support multiple scaling approaches:

#### Simple Multiplication
```
Scaled Recipe = Base Recipe × Scale Factor
Example: 2x a recipe that serves 4 = serves 8
```

#### Smart Conversions (reciProfity/Galley)
```
Scale Factor: 1.5x
Original: 2 cups all-purpose flour
Scaled: 3 cups all-purpose flour

Scale Factor: 1.5x  
Original: 1 egg
Scaled: 2 eggs (rounded up for practicality)

Scale Factor: 1.5x
Original: 1 tbsp olive oil
Scaled: 1.5 tbsp olive oil (preserves precision)
```

Implementation considerations:
- Rounding rules for count items (eggs, bay leaves)
- Unit optimization (3 tsp → 1 tbsp)
- Sub-recipe scaling cascade

### 4.2 Batch vs Individual Portions

#### Batch Recipe Structure
```
BATCH_RECIPE
├── id
├── name (e.g., "House Vinaigrette")
├── batch_yield (e.g., 1 gallon)
├── batch_cost (calculated)
├── portion_size (e.g., 2 fl oz)
├── portions_per_batch (64)
├── portion_cost (batch_cost / portions)
└── shelf_life_days
```

#### Menu Item with Sub-Recipes
```
MENU_ITEM: House Salad
├── Base Ingredients (direct)
│   ├── Mixed Greens: 3 oz @ $0.15/oz = $0.45
│   └── Cherry Tomatoes: 2 oz @ $0.25/oz = $0.50
├── Sub-Recipes (nested)
│   ├── House Vinaigrette: 2 fl oz @ $0.08/fl oz = $0.16
│   └── Croutons: 4 pieces @ $0.05 each = $0.20
└── TOTAL PLATE COST: $1.31
```

### 4.3 Cost Calculation Hierarchy

```
Level 0: Raw Ingredients
  ↓
Level 1: Prep Recipes (sub-recipes)
  ↓
Level 2: Menu Items (final dishes)
  ↓
Level 3: Menu Categories (appetizers, entrees)
  ↓
Level 4: Overall Menu
```

Each level caches calculated costs, recalculating when:
- Invoice prices change
- Recipe modifications occur
- Yield factors update

---

## 5. Integration with Inventory Systems

### 5.1 Real-Time Sync Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   POS System    │────→│  Integration    │────→│  Recipe Costing │
│                 │     │    Layer        │     │    Engine       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                        │                       │
        │                        │                       │
        ▼                        ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Sales Data    │     │   Invoice       │     │   Inventory     │
│   (PMIX)        │     │   Processing    │     │   Management    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   Variance      │
                                                │   Reports       │
                                                └─────────────────┘
```

### 5.2 Invoice Processing

MarginEdge's approach (24-48 hour processing):
1. Upload photos, email files, or EDI
2. OCR extraction + human verification
3. Line-item categorization
4. SKU matching across vendors
5. Price history tracking
6. Accounting system sync

Invoice data structure:
```
INVOICE
├── id
├── vendor_id
├── invoice_number
├── invoice_date
├── received_date
├── status (pending, processed, synced)
├── line_items[]
│   ├── sku
│   ├── description
│   ├── quantity
│   ├── unit
│   ├── unit_price
│   ├── extended_price
│   └── product_mapping_id
└── total
```

### 5.3 Purchase Order Integration

```
PURCHASE_ORDER
├── id
├── status (draft, submitted, received, partial, complete)
├── vendor_id
├── created_date
├── expected_delivery
├── items[]
│   ├── product_id
│   ├── quantity_ordered
│   ├── quantity_received
│   ├── unit_price (from order)
│   ├── unit_price_received (from invoice)
│   └── variance (price discrepancy)
├── total_ordered
└── total_received
```

### 5.4 Par Level Management

```
PAR_LEVELS
├── location_id
├── items[]
│   ├── product_id
│   ├── par_level (target stock)
│   ├── reorder_point (trigger reorder)
│   ├── on_hand (current count)
│   ├── on_order (pending POs)
│   └── days_on_hand (usage forecast)
└── auto_generate_po (boolean)
```

### 5.5 Inventory Count Methods

| Method | Description | Frequency | Systems |
|--------|-------------|-----------|---------|
| Full Count | All items | Weekly/Monthly | All |
| Partial Count | High-value items | Daily | MarginEdge, reciProfity |
| Shelf-to-Sheet | Count by location | Variable | All |
| Rolling Count | Rotate categories | Daily | reciProfity |

Count data structure:
```
INVENTORY_COUNT
├── id
├── location_id
├── count_date
├── count_type (full, partial, category)
├── items[]
│   ├── product_id
│   ├── storage_location (walk-in, dry, freezer)
│   ├── count_qty
│   ├── unit
│   ├── unit_cost (at count date)
│   └── extended_value
├── total_value
├── counted_by
└── status (draft, submitted, approved)
```

---

## 6. System-Specific Features

### 6.1 MarginEdge

**Strengths:**
- Automated invoice processing (human-verified OCR)
- Daily P&L reporting
- 50+ POS integrations
- Recipe viewer for tablets (photos, videos)
- Price alerts with threshold customization
- Bill pay integration

**Unique Features:**
- Human-verified invoice processing (not just OCR)
- Theoretical vs Actual usage with PMIX data
- Menu engineering (Stars, Puzzles, Plow Horses, Dogs)
- Multi-unit centralized management

### 6.2 reciProfity (CostGuard)

**Strengths:**
- Book of Yields integration (pre-calculated yields)
- USDA nutrition database
- FDA-compliant nutrition labels
- 200+ unit conversions
- Offline inventory counting
- Waste tracking module

**Unique Features:**
- Recipe scaling with smart conversions
- Creep alerts for ingredient price changes
- Sales mix report (contribution margin analysis)
- Menu engineering report
- Multi-unit recipe push from HQ

### 6.3 Galley Solutions

**Strengths:**
- Culinary Resource Planning (CRP) platform
- Open API architecture
- FDA-compliant nutrition panels
- Production scheduling
- Allergen tracking

**Unique Features:**
- Free tier available
- Custom label templates
- QR code recipe sharing
- Production planning tools
- Dietitian-focused features

### 6.4 xtraCHEF (Toast Inventory)

**Strengths:**
- Native Toast POS integration
- Invoice automation
- Cost analytics
- Purchase order management

**Unique Features:**
- Real-time sync with Toast POS
- Unified platform with Toast ecosystem
- Mobile inventory app

---

## 7. Best Practices for Bar/Restaurant POS Implementation

### 7.1 Recipe Costing Implementation

1. **Start Simple**: Begin with top 20 menu items by sales volume
2. **Normalize Units**: Use consistent units across all recipes
3. **Set Up Conversions**: Create weight-to-volume conversions for common ingredients
4. **Define Yields**: Document yield percentages for key prep items
5. **Invoice Integration**: Connect to vendors for automatic price updates

### 7.2 Inventory Management

1. **ABC Analysis**: 
   - A items: 20% of items, 80% of value (count weekly)
   - B items: 30% of items, 15% of value (count bi-weekly)
   - C items: 50% of items, 5% of value (count monthly)

2. **Par Levels**: Set par levels based on:
   - Historical usage
   - Lead times
   - Buffer for variance (typically 10-20%)

3. **Waste Tracking**: Categorize and track:
   - Spoilage (past expiration)
   - Prep waste (trim, over-production)
   - Service waste (mistakes, returns)

### 7.3 Variance Analysis

**Target Variance Thresholds:**
- Excellent: < 1%
- Good: 1-2%
- Acceptable: 2-3%
- Needs Attention: > 3%

**Action Steps for High Variance:**
1. Verify count accuracy
2. Check for unreported waste
3. Review portion consistency
4. Audit for theft/loss
5. Verify recipe compliance

### 7.4 Menu Engineering Matrix

```
                    HIGH POPULARITY
                         │
         STARS           │    PUZZLES
    (High Profit,       │    (High Profit,
     High Popularity)   │     Low Popularity)
                         │
    ─────────────────────┼─────────────────────
                         │
        PLOW HORSES      │      DOGS
    (Low Profit,        │    (Low Profit,
     High Popularity)   │     Low Popularity)
                         │
                    LOW POPULARITY
          LOW PROFIT ←──┼──→ HIGH PROFIT
```

### 7.5 Data Architecture Recommendations

```typescript
// Recommended schema for POS integration

interface RecipeCostingModule {
  ingredients: IngredientStore;
  recipes: RecipeStore;
  menu_items: MenuItemStore;
  invoices: InvoiceStore;
  inventory: InventoryStore;
  sales: SalesDataStore;
  reports: ReportEngine;
}

// Key relationships
interface RecipeIngredient {
  ingredient_id: ForeignKey<Ingredient>;
  recipe_id: ForeignKey<Recipe>;
  quantity: Decimal;
  unit: Unit;
  prep_method?: string;
  waste_factor?: Decimal;
}

interface MenuItemRecipe {
  menu_item_id: ForeignKey<MenuItem>;
  recipe_id: ForeignKey<Recipe>;
  portion_multiplier: Decimal;
  modifier_recipes?: RecipeModifier[];
}

interface SalesData {
  date: Date;
  menu_item_id: ForeignKey<MenuItem>;
  quantity_sold: Integer;
  revenue: Decimal;
  modifiers_sold?: ModifierSale[];
}
```

---

## 8. Key Formulas Summary

### Food Cost Calculations

```
Food Cost % = (Cost of Goods Sold / Food Sales) × 100

Cost of Goods Sold = Beginning Inventory + Purchases - Ending Inventory

Theoretical Usage = SUM(Sold Items × Recipe Cost) + Waste Recorded

Variance = Actual Usage - Theoretical Usage

Variance % = (Variance / Theoretical Usage) × 100

Contribution Margin = Selling Price - Food Cost

Gross Profit = Sales - Cost of Goods Sold
```

### Recipe Cost Calculations

```
Ingredient Cost (with yield) = (Quantity × Unit Price) / Yield %

Batch Cost = SUM(All Ingredient Costs)

Portion Cost = Batch Cost / Portions per Batch

Plate Cost = SUM(Direct Ingredients) + SUM(Sub-recipe Portions)

Target Menu Price = Portion Cost / Target Food Cost %

Actual Food Cost % = (Portion Cost / Menu Price) × 100
```

---

## 9. Implementation Roadmap for POS System

### Phase 1: Core Recipe Costing (Weeks 1-4)
- Ingredient database with units and categories
- Recipe creation and costing engine
- Basic unit conversions
- Manual invoice entry

### Phase 2: Inventory Integration (Weeks 5-8)
- Inventory count module
- Beginning/ending inventory tracking
- Purchase order creation
- Variance reporting

### Phase 3: POS Integration (Weeks 9-12)
- Sales data import (PMIX)
- Theoretical usage calculation
- Real-time variance reports
- Menu item mapping

### Phase 4: Advanced Features (Weeks 13-16)
- Yield management system
- Waste tracking module
- Price alerts
- Menu engineering reports

### Phase 5: Automation (Weeks 17-20)
- Invoice OCR/processing
- Automatic reorder points
- Multi-unit sync
- API integrations

---

## 10. Conclusion

Professional recipe costing and inventory management systems share common architectural patterns:

1. **Centralized ingredient/product database** with vendor-neutral recipe references
2. **Multi-level recipe structure** supporting nested sub-recipes
3. **Comprehensive unit conversion engine** with weight-to-volume support
4. **Yield factor management** for accurate cost calculations
5. **Variance analysis** combining POS sales, invoices, and inventory counts
6. **Menu engineering** for profitability optimization

For a bar/restaurant POS, the key differentiators are:
- Native integration with sales data
- Real-time cost updates
- Mobile-friendly inventory counting
- Actionable variance reports
- Menu profitability analysis

The most critical implementation priorities are accurate recipe costing, consistent unit handling, and reliable inventory counts—these form the foundation for all variance analysis and profitability optimization features.
