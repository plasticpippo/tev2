# UOM System - Database Schema Changes

## Overview

This document details the Prisma schema modifications required to implement the Full Unit of Measure (UOM) system. The changes extend the existing `StockItem` model with enhanced purchasing unit support including costs.

## Current Schema (For Reference)

### StockItem Model (Current)

```prisma
model StockItem {
  name              String
  quantity          Int
  type              String
  baseUnit          String              // e.g., "ml", "kg", "piece"
  purchasingUnits   Json?               // Currently just {id, name, multiplier}[]
  costPerUnit       Decimal?            @db.Decimal(10, 4)
  taxRateId         Int?
  id                String              @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  stockAdjustments  StockAdjustment[]
  stockConsumptions StockConsumption[]
  taxRate           TaxRate?            @relation(fields: [taxRateId], references: [id], onDelete: SetNull)

  @@index([taxRateId])
  @@map("stock_items")
}
```

### StockConsumption Model (Current)

```prisma
model StockConsumption {
  id          Int            @id @default(autoincrement())
  variantId   Int
  quantity    Int             // Currently just a number - assumes same unit as baseUnit
  stockItemId String         @db.Uuid
  stockItem   StockItem       @relation(fields: [stockItemId], references: [id])
  variant     ProductVariant @relation(fields: [variantId], references: [id])

  @@map("stock_consumptions")
}
```

## Proposed Schema Changes

### 1. PurchasingUnit JSON Structure

We will extend the `purchasingUnits` JSON structure to include cost information:

**New PurchasingUnit Structure:**

```typescript
interface PurchasingUnit {
  id: string;                    // Unique identifier
  name: string;                  // Display name (e.g., "Bottle", "Case", "Pallet")
  multiplier: number;            // How many base units (e.g., 750 for 750ml bottle)
  costPerUnit: number;          // NEW: Cost for this entire purchasing unit
  isDefault: boolean;           // NEW: Default purchasing unit for new orders
  minOrderQuantity?: number;     // NEW: Minimum quantity for this tier (for bulk pricing)
}
```

**Example:**

```json
[
  {
    "id": "1",
    "name": "Bottle",
    "multiplier": 750,
    "costPerUnit": 20.00,
    "isDefault": false
  },
  {
    "id": "2",
    "name": "Case",
    "multiplier": 9000,
    "costPerUnit": 216.00,
    "isDefault": false,
    "minOrderQuantity": 1
  },
  {
    "id": "3",
    "name": "Pallet",
    "multiplier": 90000,
    "costPerUnit": 1800.00,
    "isDefault": true,
    "minOrderQuantity": 1
  }
]
```

### 2. StockConsumption Enhancement

Add support for specifying consumption in different units:

**New StockConsumption Structure:**

```typescript
interface StockConsumptionInput {
  stockItemId: string;
  quantity: number;              // Quantity in recipe unit
  recipeUnit?: string;          // NEW: Unit for recipe (defaults to baseUnit)
}
```

To support this, we have two options:

**Option A: Keep JSON flexible** (Recommended)
- The `quantity` field remains an Int
- Add documentation that it should be in the base unit (e.g., ml)
- The frontend handles the conversion

**Option B: Add explicit unit field**
- Add `consumptionUnit` field to StockConsumption
- More explicit but requires more schema changes

**Recommendation**: Use Option A for simplicity - the consumption is always in base units (ml), and the purchasing unit cost calculation handles the conversion.

### 3. StockItem - Add Default Purchasing Unit

Add a field to track which purchasing unit is currently active for cost calculations:

```prisma
model StockItem {
  name                   String
  quantity               Int
  type                   String
  baseUnit               String                    // e.g., "ml", "kg"
  purchasingUnits        Json?                     // Extended with costPerUnit
  costPerUnit            Decimal?                 // Deprecated: Use purchasingUnits instead
  taxRateId              Int?
  activePurchasingUnitId String?                  // NEW: ID of currently active purchasing unit
  id                     String  @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  stockAdjustments       StockAdjustment[]
  stockConsumptions      StockConsumption[]
  taxRate                TaxRate?   @relation(fields: [taxRateId], references: [id], onDelete: SetNull)

  @@index([taxRateId])
  @@map("stock_items")
}
```

## Migration SQL

### Migration: add_uom_purchasing_unit_costs

```sql
-- Add activePurchasingUnitId column to stock_items
ALTER TABLE stock_items 
ADD COLUMN activePurchasingUnitId VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX idx_stock_items_active_unit ON stock_items(activePurchasingUnitId);

-- Note: purchasingUnits is already JSON, so no schema change needed there
-- The costPerUnit field remains for backward compatibility
```

## TypeScript Types Update

### New PurchasingUnit Interface

```typescript
interface PurchasingUnit {
  id: string;
  name: string;
  multiplier: number;       // Base units per this unit (e.g., 750 for bottle)
  costPerUnit: number;      // Cost for the entire unit (e.g., €20 for bottle)
  isDefault: boolean;       // Whether this is the default purchasing unit
  minOrderQuantity?: number; // Minimum quantity for this tier (optional)
}

interface StockItem {
  id: string;
  name: string;
  quantity: number;
  type: 'Ingredient' | 'Sellable Good';
  baseUnit: string;         // e.g., "ml", "kg", "piece"
  purchasingUnits: PurchasingUnit[];
  costPerUnit?: number | null;   // Legacy - for backward compatibility
  taxRateId?: number | null;
  activePurchasingUnitId?: string | null;  // Currently active purchasing unit
}
```

### Helper Functions

```typescript
/**
 * Get the cost per base unit from a purchasing unit
 * @param purchasingUnit - The purchasing unit
 * @returns Cost per base unit (e.g., €0.0267/ml)
 */
function getCostPerBaseUnit(purchasingUnit: PurchasingUnit): number {
  return purchasingUnit.costPerUnit / purchasingUnit.multiplier;
}

/**
 * Get the currently active purchasing unit for a stock item
 * @param stockItem - The stock item
 * @returns The active purchasing unit or default
 */
function getActivePurchasingUnit(stockItem: StockItem): PurchasingUnit | null {
  if (!stockItem.purchasingUnits || stockItem.purchasingUnits.length === 0) {
    return null;
  }
  
  // Find by activePurchasingUnitId
  const active = stockItem.purchasingUnits.find(
    pu => pu.id === stockItem.activePurchasingUnitId
  );
  
  if (active) return active;
  
  // Fall back to default
  const defaultUnit = stockItem.purchasingUnits.find(pu => pu.isDefault);
  
  if (defaultUnit) return defaultUnit;
  
  // Fall back to first one
  return stockItem.purchasingUnits[0];
}
```

## Data Integrity Considerations

1. **Decimal Precision**: Use high precision for cost calculations
2. **Null Handling**: Purchasing units array can be empty - fall back to costPerUnit
3. **Backward Compatibility**: costPerUnit remains for existing data
4. **Validation**: 
   - multiplier must be > 0
   - costPerUnit must be >= 0
   - At least one purchasing unit should have isDefault = true if multiple exist

## Related Documents

- [Overview](./10-uom-overview.md)
- [Cost Calculation Logic](./12-uom-cost-calculation.md)
- [Backend API Changes](./13-uom-backend-api.md)
- [Migration Plan](./15-uom-migration-plan.md)
