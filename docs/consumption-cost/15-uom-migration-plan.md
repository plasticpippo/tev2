# UOM System - Migration Plan

## Overview

This document outlines the migration strategy for implementing the UOM system with backward compatibility.

## Migration Strategy

The migration will be performed in phases to ensure backward compatibility and data integrity:

### Phase 1: Schema Migration (Non-Breaking)

Add new database column while keeping existing functionality:

```sql
-- Migration: add_active_purchasing_unit_id
-- File: backend/prisma/migrations/YYYYMMDDHHMMSS_add_active_purchasing_unit_id/migration.sql

-- Add activePurchasingUnitId column to stock_items
ALTER TABLE stock_items 
ADD COLUMN activePurchasingUnitId VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX idx_stock_items_active_unit ON stock_items(activePurchasingUnitId);
```

### Phase 2: Backend Service Update

1Script types. Update Type to support enhanced purchasingUnits
2. Add helper functions for UOM calculations
3. Update cost calculation service
4. Add new API endpoints

### Phase 3: Frontend Update

1. Add new UI components
2. Update existing forms
3. Add translations

### Phase 4: Data Migration (Optional)

For existing stock items with costPerUnit, create a default purchasing unit:

```sql
-- For each stock item with costPerUnit > 0 and no purchasingUnits or empty purchasingUnits
-- Create a default purchasing unit

UPDATE stock_items
SET purchasingUnits = JSON_BUILD_ARRAY(
  JSON_BUILD_OBJECT(
    'id', '1',
    'name', 'Default',
    'multiplier', 1,
    'costPerUnit', costPerUnit,
    'isDefault', true
  )
),
activePurchasingUnitId = '1'
WHERE costPerUnit IS NOT NULL 
  AND costPerUnit > 0
  AND (purchasingUnits IS NULL OR purchasingUnits = '[]'::json);
```

## Rollback Plan

### If issues occur:

1. **Database Rollback**:
   ```sql
   ALTER TABLE stock_items DROP COLUMN activePurchasingUnitId;
   ```

2. **Code Rollback**:
   - Revert to previous version
   - Keep backward compatibility in cost calculation (fall back to costPerUnit)

## Testing Strategy

### Unit Tests

1. **Cost Calculation Tests**:
   ```typescript
   describe('UOM Cost Calculation', () => {
     it('should calculate cost per base unit correctly', () => {
       const purchasingUnit = {
         id: '1',
         name: 'Bottle',
         multiplier: 750,
         costPerUnit: 20.00,
         isDefault: true
       };
       expect(getCostPerBaseUnit(purchasingUnit)).toBeCloseTo(0.02667, 4);
     });
     
     it('should use default purchasing unit when none active', () => {
       const stockItem = {
         purchasingUnits: [
           { id: '1', name: 'Bottle', multiplier: 750, costPerUnit: 20, isDefault: false },
           { id: '2', name: 'Case', multiplier: 9000, costPerUnit: 216, isDefault: true }
         ],
         activePurchasingUnitId: null
       };
       const unit = getActivePurchasingUnit(stockItem);
       expect(unit.name).toBe('Case');
     });
     
     it('should fall back to costPerUnit when no purchasing units', () => {
       const stockItem = {
         purchasingUnits: [],
         costPerUnit: 0.02667,
         activePurchasingUnitId: null
       };
       // Should use legacy costPerUnit
     });
   });
   ```

### Integration Tests

1. Create stock item with multiple purchasing units
2. Calculate variant cost
3. Verify breakdown includes UOM details
4. Switch active unit and verify cost changes

### E2E Tests

Using Playwright MCP:
1. Create stock item with purchasing units
2. Create product using that stock item
3. View cost breakdown
4. Switch active purchasing unit
5. Verify cost changes in analytics

## Data Validation

After migration, run validation queries:

```sql
-- Check for stock items with purchasingUnits but no active unit
SELECT id, name, purchasingUnits, activePurchasingUnitId
FROM stock_items
WHERE purchasingUnits IS NOT NULL
  AND purchasingUnits != '[]'::json
  AND activePurchasingUnitId IS NULL;

-- Check for stock items with mismatched costs
SELECT id, name, costPerUnit, purchasingUnits
FROM stock_items
WHERE purchasingUnits IS NOT NULL
  AND jsonb_array_length(purchasingUnits) > 0
  AND costPerUnit IS NOT NULL;
```

## Performance Considerations

1. **Index on activePurchasingUnitId**: Added in migration
2. **JSON parsing**: purchasingUnits is already parsed in handlers
3. **Cost calculation**: O(n) where n = number of stock consumptions

## Related Documents

- [Overview](./10-uom-overview.md)
- [Database Schema](./11-uom-database-schema.md)
- [Cost Calculation Logic](./12-uom-cost-calculation.md)
- [Backend API Changes](./13-uom-backend-api.md)
- [Implementation Checklist](./16-uom-implementation-checklist.md)
