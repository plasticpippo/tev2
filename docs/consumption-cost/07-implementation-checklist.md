# Implementation Checklist

## Quick Reference

This document provides a quick checklist for implementing the consumption cost feature.

## Pre-Implementation

- [ ] Review all documentation in `./docs/consumption-cost/`
- [ ] Confirm database backup exists
- [ ] Review existing TaxRate implementation for reference
- [ ] Plan deployment window (migration required)

## Database Changes

- [ ] Create Prisma migration
- [ ] Run migration: `npx prisma migrate dev`
- [ ] Verify new columns exist
- [ ] Update TypeScript types

## Backend Changes

### Stock Items Handler
- [ ] Add `costPerUnit` to create validation
- [ ] Add `taxRateId` to create validation
- [ ] Add fields to PUT validation
- [ ] Include `taxRate` in GET response
- [ ] Test CRUD operations

### Products Handler
- [ ] Add `costPrice` to variant validation
- [ ] Include calculated cost in response (optional)
- [ ] Test CRUD operations

### Cost Calculation Service (NEW)
- [ ] Create `costCalculationService.ts`
- [ ] Implement `calculateVariantCost()`
- [ ] Implement `calculateProductCosts()`
- [ ] Handle edge cases (null values, missing data)
- [ ] Add unit tests

### New Endpoints
- [ ] GET `/api/products/:id/cost-breakdown`
- [ ] GET `/api/analytics/product-costs`
- [ ] Update existing analytics with profit data

### Validation
- [ ] Add `validateCostPerUnit()`
- [ ] Add `validateCostPrice()`
- [ ] Add error messages to i18n

## Frontend Changes

### Stock Item Management
- [ ] Add cost input to stock item form
- [ ] Add tax rate dropdown
- [ ] Display cost in stock item list

### Product Management
- [ ] Add cost override to variant form
- [ ] Show "calculated vs manual" indicator

### Analytics
- [ ] Add cost columns to product performance
- [ ] Create dedicated cost analytics page
- [ ] Add profit margin visualizations

### Internationalization
- [ ] Add EN translations
- [ ] Add IT translations

## Testing

- [ ] Unit tests for cost calculation
- [ ] API integration tests
- [ ] E2E tests with Playwright
- [ ] Test edge cases:
  - [ ] No costPerUnit set
  - [ ] Manual override takes precedence
  - [ ] Tax rate applied correctly
  - [ ] Missing stock consumption

## Deployment

- [ ] Run database migration
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verify in production

## Monitoring

- [ ] Monitor for errors
- [ ] Verify cost calculations
- [ ] Check analytics accuracy

## Related Documents

- [01-overview](./01-overview.md)
- [02-database-schema](./02-database-schema.md)
- [03-cost-calculation](./03-cost-calculation.md)
- [04-backend-api](./04-backend-api.md)
- [05-frontend-changes](./05-frontend-changes.md)
- [06-migration-plan](./06-migration-plan.md)
