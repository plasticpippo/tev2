# UOM System - Frontend Changes

## Overview

This document details the frontend UI changes required to support the UOM system, enabling users to manage purchasing units with costs and view cost breakdowns with UOM details.

## Current Frontend Components

### Stock Item Management
- **Component**: `StockItemManagement.tsx`
- **Location**: `frontend/components/admin/`
- **Current Features**:
  - Create/Edit stock items
  - Set base unit
  - Define purchasing units (name, multiplier)
  - Set cost per unit
  - Set tax rate

### Product Management
- **Component**: `ProductManagement.tsx`
- **Location**: `frontend/components/admin/`
- **Current Features**:
  - Create/Edit products and variants
  - Set stock consumption
  - Set manual cost override

## Required Changes

### 1. Enhanced Purchasing Units UI

The purchasing units section needs to be expanded to include cost information:

**UI Mockup:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Purchasing Units                                                │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Unit Name   │ Multiplier │ Cost/Unit │ Per ml  │ Default   │ │
│ ├─────────────┼────────────┼────────────┼──────────┼───────────┤ │
│ │ Bottle      │ 750 ml     │ €20.00     │ €0.027   │ ○         │ │
│ │ Case        │ 9,000 ml   │ €216.00    │ €0.024   │ ●         │ │
│ │ Pallet      │ 90,000 ml  │ €1,800.00  │ €0.020   │ ○         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ [+ Add Purchasing Unit]                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Component Updates:**

```typescript
interface PurchasingUnitInput {
  id: string;
  name: string;
  multiplier: number;
  costPerUnit: number;
  isDefault: boolean;
}

interface StockItemFormProps {
  // Existing props
  onSubmit: (data: StockItemData) => void;
  initialData?: StockItem;
}
```

**Key UI Elements:**

1. **Purchasing Unit Table**
   - Columns: Name, Multiplier, Cost/Unit, Cost/BaseUnit (calculated), Default
   - Inline editing capability
   - Delete button per row
   - Add row button

2. **Auto-calculated Cost/BaseUnit**
   - Display: `Cost/Unit ÷ Multiplier`
   - Format based on base unit (e.g., €/ml, €/kg)

3. **Default Selection**
   - Radio button (only one can be default)
   - First unit becomes default if none selected

### 2. Active Purchasing Unit Selector

Allow users to switch between purchasing units:

**UI Mockup:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Current Pricing: Case (€0.024/ml) ▼                            │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐│
│ │ ● Case (€0.024/ml) - Current                                ││
│ │ ○ Bottle (€0.027/ml)                                       ││
│ │ ○ Pallet (€0.020/ml)                                       ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│ [Switch to Pallet - Save €0.40 per 40ml drink]                │
└─────────────────────────────────────────────────────────────────┘
```

**Component:**

```typescript
interface ActiveUnitSelectorProps {
  stockItem: StockItem;
  onChange: (unitId: string) => void;
}

// Shows current active unit
// Dropdown to switch
// Shows savings if switching to cheaper unit
```

### 3. Cost Breakdown with UOM Details

The cost breakdown report should show UOM information:

**UI Mockup:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Whiskey 40ml                              Selling: €8.00       │
├─────────────────────────────────────────────────────────────────┤
│ Ingredient    │ Used    │ From Unit │ Cost/ml   │ Cost       │
│───────────────────────────────────────────────────────────────│
│ Jameson       │ 40 ml   │ Pallet    │ €0.020    │ €0.80      │
│ Whiskey       │         │ (bulk)    │           │            │
├─────────────────────────────────────────────────────────────────┤
│                                      Total Cost: €0.80         │
│                                      Gross Profit: €5.70       │
│                                      Margin: 87.7%             │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Cost Scenarios Comparison

Show cost comparison across all purchasing units:

**UI Mockup:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Cost Comparison                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────┬────────────┬───────────┬────────────────────────┐│
│ │ Unit      │ Cost/Unit │ Cost/ml   │ 50 units total         ││
│ ├───────────┼────────────┼───────────┼────────────────────────┤│
│ │ Bottle    │ €20.00     │ €0.027    │ €1,333.33              ││
│ │ Case      │ €216.00    │ €0.024    │ €1,200.00  (-10%)     ││
│ │ ● Pallet  │ €1,800.00  │ €0.020    │ €1,000.00  (-25%)     ││
│ └───────────┴────────────┴───────────┴────────────────────────┘│
│                                                                 │
│ 💡 Recommendation: Switch to Pallet to save €333.33           │
└─────────────────────────────────────────────────────────────────┘
```

### 5. Analytics Updates

Update the analytics components to show UOM-aware costs:

**TopPerformers.tsx Enhancement:**
- Already shows profitMargin - no changes needed
- Add tooltip showing which purchasing unit is used

**ProductPerformanceTable.tsx Enhancement:**
- Add column: "Cost Basis" showing purchasing unit used
- Add column: "Potential Savings" if cheaper unit available

## TypeScript Types

### Frontend Types

```typescript
// frontend/shared/types.ts

interface PurchasingUnit {
  id: string;
  name: string;
  multiplier: number;
  costPerUnit: number;
  isDefault: boolean;
}

interface StockItem {
  id: string;
  name: string;
  quantity: number;
  type: 'Ingredient' | 'Sellable Good';
  baseUnit: string;
  purchasingUnits: PurchasingUnit[];
  costPerUnit?: number | null;
  taxRateId?: number | null;
  activePurchasingUnitId?: string | null;
}

interface CostBreakdownItem {
  stockItemName: string;
  recipeQuantity: number;
  recipeUnit: string;
  purchasingUnitName: string;
  costPerBaseUnit: number;
  baseUnit: string;
  taxRate: number;
  subtotal: number;
}
```

## Internationalization

Add new translation keys:

```json
// frontend/public/locales/en/admin.json
{
  "stockItems": {
    "purchasingUnits": "Purchasing Units",
    "addUnit": "Add Unit",
    "unitName": "Unit Name",
    "multiplier": "Multiplier",
    "costPerUnit": "Cost per Unit",
    "costPerBase": "Cost per {{base}}",
    "default": "Default",
    "activePricing": "Active Pricing",
    "switchTo": "Switch to {{unit}}",
    "savings": "Save {{amount}} per {{quantity}}",
    "costComparison": "Cost Comparison",
    "recommendation": "Recommendation",
    "potentialSavings": "Potential Savings"
  }
}
```

```json
// frontend/public/locales/it/admin.json
{
  "stockItems": {
    "purchasingUnits": "Unità di Acquisto",
    "addUnit": "Aggiungi Unità",
    "unitName": "Nome Unità",
    "multiplier": "Moltiplicatore",
    "costPerUnit": "Costo per Unità",
    "costPerBase": "Costo per {{base}}",
    "default": "Predefinito",
    "activePricing": "Prezzo Attivo",
    "switchTo": "Passa a {{unit}}",
    "savings": "Risparmia {{amount}} per {{quantity}}",
    "costComparison": "Confronto Costi",
    "recommendation": "Raccomandazione",
    "potentialSavings": "Risparmio Potenziale"
  }
}
```

## Component Structure

```
frontend/components/
├── admin/
│   ├── StockItemManagement.tsx      # Enhanced purchasing units
│   ├── StockItemForm.tsx            # New form component
│   ├── PurchasingUnitTable.tsx      # New component
│   ├── ActiveUnitSelector.tsx       # New component
│   └── CostComparison.tsx           # New component
├── analytics/
│   ├── ProductPerformanceTable.tsx # Enhanced with UOM
│   └── CostBreakdown.tsx           # New component
```

## Related Documents

- [Overview](./10-uom-overview.md)
- [Database Schema](./11-uom-database-schema.md)
- [Cost Calculation Logic](./12-uom-cost-calculation.md)
- [Backend API Changes](./13-uom-backend-api.md)
