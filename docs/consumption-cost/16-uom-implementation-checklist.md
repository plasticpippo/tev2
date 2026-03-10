# UOM System - Implementation Checklist

## Overview

This checklist provides a comprehensive task list for implementing the Full Unit of Measure (UOM) system.

## Phase 1: Database & Types

- [ ] 1.1 Create Prisma migration for `activePurchasingUnitId` column
- [ ] 1.2 Update `backend/src/types.ts` with new PurchasingUnit interface
- [ ] 1.3 Update `backend/prisma/schema.prisma` (if needed for documentation)
- [ ] 1.4 Add migration SQL file to `backend/prisma/migrations/`

## Phase 2: Backend - Helper Functions

- [ ] 2.1 Add `getCostPerBaseUnit()` function
- [ ] 2.2 Add `getActivePurchasingUnit()` function
- [ ] 2.3 Add `calculateConsumptionCost()` function
- [ ] 2.4 Add validation functions for purchasing units

## Phase 3: Backend - Cost Calculation Service

- [ ] 3.1 Update `calculateVariantCost()` to use UOM logic
- [ ] 3.2 Update `calculateProductCosts()` to use UOM logic
- [ ] 3.3 Update `getProductCostAnalytics()` to use UOM logic
- [ ] 3.4 Add unit tests for cost calculation

## Phase 4: Backend - API Endpoints

- [ ] 4.1 Update GET `/api/stock-items` to return enhanced purchasingUnits
- [ ] 4.2 Update POST `/api/stock-items` to accept purchasingUnits with costs
- [ ] 4.3 Update PUT `/api/stock-items` to update purchasingUnits
- [ ] 4.4 Add PATCH `/api/stock-items/:id/active-unit` endpoint
- [ ] 4.5 Add GET `/api/stock-items/:id/cost-scenarios` endpoint
- [ ] 4.6 Update GET `/api/products/:id/cost-breakdown` with UOM details
- [ ] 4.7 Add validation for purchasing units in `validation.ts`

## Phase 5: Backend - Error Handling

- [ ] 5.1 Add error translations for UOM validation errors
- [ ] 5.2 Add error handling for invalid purchasing unit IDs
- [ ] 5.3 Update error messages in locale files

## Phase 6: Frontend - Types

- [ ] 6.1 Update `frontend/shared/types.ts` with PurchasingUnit interface
- [ ] 6.2 Update StockItem type to include activePurchasingUnitId
- [ ] 6.3 Update CostBreakdownItem type for UOM details

## Phase 7: Frontend - Components

- [ ] 7.1 Create `PurchasingUnitTable.tsx` component
- [ ] 7.2 Create `ActiveUnitSelector.tsx` component
- [ ] 7.3 Create `CostComparison.tsx` component
- [ ] 7.4 Create `CostBreakdown.tsx` component
- [ ] 7.5 Update `StockItemManagement.tsx` to use new components

## Phase 8: Frontend - Forms

- [ ] 8.1 Update stock item form to handle purchasing units with costs
- [ ] 8.2 Add inline editing for purchasing units
- [ ] 8.3 Add default unit selection (radio buttons)
- [ ] 8.4 Add cost per base unit auto-calculation display

## Phase 9: Frontend - Analytics

- [ ] 9.1 Update analytics to show which purchasing unit is used
- [ ] 9.2 Add potential savings indicator
- [ ] 9.3 Update ProductPerformanceTable with UOM details

## Phase 10: Internationalization

- [ ] 10.1 Add English translations for new UI elements
- [ ] 10.2 Add Italian translations for new UI elements
- [ ] 10.3 Test translations in UI

## Phase 11: Testing

- [ ] 11.1 Unit tests for cost calculation functions
- [ ] 11.2 Integration tests for API endpoints
- [ ] 11.3 E2E tests using Playwright MCP:
  - [ ] 11.3.1 Create stock item with multiple purchasing units
  - [ ] 11.3.2 View cost breakdown with UOM details
  - [ ] 11.3.3 Switch active purchasing unit
  - [ ] 11.3.4 Verify cost changes in analytics

## Phase 12: Documentation

- [ ] 12.1 Update existing consumption-cost documentation
- [ ] 12.2 Add API documentation for new endpoints
- [ ] 12.3 Create user guide for UOM system

## Implementation Order

```
Phase 1: Database & Types
    ↓
Phase 2: Backend Helper Functions
    ↓
Phase 3: Cost Calculation Service
    ↓
Phase 4: Backend API Endpoints
    ↓
Phase 5: Backend Error Handling
    ↓
Phase 6: Frontend Types
    ↓
Phase 7-9: Frontend Components & Forms
    ↓
Phase 10: Internationalization
    ↓
Phase 11: Testing
    ↓
Phase 12: Documentation
```

## Notes

- All backend changes should maintain backward compatibility
- Frontend should gracefully handle both old and new data formats
- Cost calculation back to costPer should always fallUnit if no purchasing units exist

## Related Documents

- [Overview](./10-uom-overview.md)
- [Database Schema](./11-uom-database-schema.md)
- [Cost Calculation Logic](./12-uom-cost-calculation.md)
- [Backend API Changes](./13-uom-backend-api.md)
- [Frontend Changes](./14-uom-frontend-changes.md)
- [Migration Plan](./15-uom-migration-plan.md)
