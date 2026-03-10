# Database Schema Changes

## Overview

This document details the Prisma schema modifications required to support consumption cost tracking.

## Current Schema

### StockItem Model (Current)

```prisma
model StockItem {
  name              String
  quantity          Int
  type              String
  baseUnit          String
  purchasingUnits   Json?
  id                String  @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  stockAdjustments  StockAdjustment[]
  stockConsumption StockConsumption[]

  @@map("stock_items")
}
```

### ProductVariant Model (Current)

```prisma
model ProductVariant {
  id               Int                @id @default(autoincrement())
  productId        Int
  name             String
  price            Float
  isFavourite      Boolean?           @default(false)
  backgroundColor  String
  textColor        String
  taxRateId        Int?
  product          Product            @relation(fields: [productId], references: [id])
  taxRate          TaxRate?           @relation(fields: [taxRateId], references: [id], onDelete: SetNull)
  stockConsumption StockConsumption[]
  variantLayouts   VariantLayout[]
  sharedLayoutPositions SharedLayoutPosition[]

  @@index([taxRateId])
  @@map("product_variants")
}
```

## Proposed Changes

### 1. StockItem - Add Cost Fields

```prisma
model StockItem {
  name              String
  quantity          Int
  type              String
  baseUnit          String
  purchasingUnits   Json?
  costPerUnit       Decimal?          @db.Decimal(10, 4)  // NEW: Cost per base unit
  taxRateId         Int?              // NEW: Link to TaxRate for overhead %
  id                String            @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  stockAdjustments  StockAdjustment[]
  stockConsumption StockConsumption[]
  taxRate           TaxRate?          @relation(fields: [taxRateId], references: [id], onDelete: SetNull)

  @@index([taxRateId])
  @@map("stock_items")
}
```

### 2. ProductVariant - Add Cost Override

```prisma
model ProductVariant {
  id               Int                @id @default(autoincrement())
  productId        Int
  name             String
  price            Float
  isFavourite      Boolean?           @default(false)
  backgroundColor  String
  textColor        String
  taxRateId        Int?
  costPrice        Decimal?           @db.Decimal(10, 4)  // NEW: Manual cost override
  product          Product            @relation(fields: [productId], references: [id])
  taxRate          TaxRate?           @relation(fields: [taxRateId], references: [id], onDelete: SetNull)
  stockConsumption StockConsumption[]
  variantLayouts   VariantLayout[]
  sharedLayoutPositions SharedLayoutPosition[]

  @@index([taxRateId])
  @@map("product_variants")
}
```

## Migration Required

A new database migration must be created:

```sql
-- Migration: add_cost_fields_to_stock_items_and_variants
-- File: backend/prisma/migrations/xxxxxxxx_add_cost_fields/migration.sql

-- Add costPerUnit to stock_items
ALTER TABLE stock_items 
ADD COLUMN costPerUnit DECIMAL(10, 4);

-- Add taxRateId to stock_items (for overhead calculation)
ALTER TABLE stock_items 
ADD COLUMN taxRateId INTEGER REFERENCES tax_rates(id) ON DELETE SET NULL;

-- Add costPrice to product_variants (manual override)
ALTER TABLE product_variants 
ADD COLUMN costPrice DECIMAL(10, 4);

-- Create index for faster lookups
CREATE INDEX idx_stock_items_tax_rate ON stock_items(taxRateId);
CREATE INDEX idx_product_variants_cost ON product_variants(costPrice);
```

## Data Integrity Considerations

1. **Decimal Precision**: Use `DECIMAL(10, 4)` to handle small cost values accurately
2. **Null Handling**: All new fields are nullable - existing data remains valid
3. **TaxRate Relationship**: Uses same pattern as ProductVariant.taxRateId (SetNull on delete)
4. **Backward Compatibility**: No breaking changes to existing API responses

## TypeScript Types Update

Update `backend/src/types.ts` to include new fields:

```typescript
interface StockItem {
  id: string;
  name: string;
  quantity: number;
  type: string;
  baseUnit: string;
  purchasingUnits: PurchasingUnit[] | null;
  costPerUnit?: number;  // NEW
  taxRateId?: number;    // NEW
}

interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  price: number;
  // ... existing fields
  costPrice?: number;   // NEW
}
```

## Related Documents

- [Overview](./01-overview.md)
- [Cost Calculation Logic](./03-cost-calculation.md)
- [Backend API Changes](./04-backend-api.md)
