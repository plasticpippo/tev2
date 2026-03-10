# E2E Testing Errors - Consumption Cost Features

**Test Date:** 2026-03-10
**Tester:** Orchestrator (via Frontend Specialist mode)
**App URL:** http://192.168.1.70:80

---

## Summary

| Test Area | Status |
|-----------|--------|
| Login | PASSED |
| Stock Items UOM | PASSED |
| Products Cost | PASSED |
| Analytics | PASSED (with data bug) |

---

## Errors Found

### 1. CRITICAL: Incorrect Cost Calculation in Analytics

**Location:** Analytics > Product Performance

**Description:**
The Total Cost (€5380,20) is disproportionately high compared to Total Revenue (€70,00), resulting in an unrealistic negative profit margin of -7586.0%.

**Expected Behavior:**
- Total Cost should reflect the cost of goods sold based on actual consumption during the period
- Profit margin should be realistic (e.g., positive or slightly negative for promotional items)

**Actual Behavior:**
- Total Revenue: €70,00
- Total Cost: €5380,20
- Gross Profit: €-5310,20
- Profit Margin: -7586.0%

**Root Cause (Suspected):**
The cost calculation logic is likely using the full stock inventory cost instead of per-unit cost. This could be due to:
1. The costPerUnit not being properly applied (may be using stock item's total quantity instead of consumed quantity)
2. The multiplier in purchasing units not being applied correctly
3. The cost calculation multiplying by total stock quantity instead of consumed quantity

**Files to Investigate:**
- `backend/src/services/costCalculationService.ts`
- `backend/src/handlers/analytics.ts`
- `backend/src/services/analyticsService.ts`

**Priority:** HIGH

---

## UI Elements Verified (No Errors)

The following UI elements were verified to be present and functional:

1. **Stock Items:**
   - Purchasing Units section with fields: Name, Multiplier, Cost/Unit, Cost/pcs, Default
   - "+ Add Purchasing Unit" button
   - Cost Settings section with Cost/Unit and Tax Rate fields

2. **Products:**
   - Cost Price field (manual override) for each product variant
   - Stock Consumption (Recipe) section for defining stock item usage

3. **Analytics:**
   - ProductPerformanceTable with columns: Total Cost, Gross Profit, Margin
   - Summary cards: Total Revenue, Total Cost, Gross Profit, Profit Margin, Top Product

---

## Recommendations

1. **Fix Cost Calculation Bug (Priority 1):**
   - Review `calculateConsumptionCost()` in costCalculationService.ts
   - Ensure cost is calculated as: `consumedQuantity * costPerBaseUnit * (1 + taxRate)`
   - Verify that the full stock quantity is not being used instead of consumed quantity

2. **Add Unit Tests:**
   - Add unit tests for cost calculation logic
   - Test edge cases: zero consumption, zero cost, high quantities

3. **Verify Data Flow:**
   - Check that stock item's purchasingUnits are properly saved and retrieved
   - Verify that activePurchisingUnitId is being used correctly
