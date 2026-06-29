# Transaction ↔ Inventory Verification Tool

## Goal

Let the user verify that **every** transaction (including complimentary sales) deducted the correct inventory, by surfacing the itemised consumption that the system **already records** (`StockConsumptionLedger`), plus a global audit that flags transactions whose deductions look wrong.

## Key finding (no logic bug)

The inventory-deduction code is correct and **status-independent**:
- `backend/src/handlers/transactions.ts:293-336` collects consumptions for **all** order items.
- `backend/src/handlers/transactions.ts:416-435` decrements stock atomically (with `quantity: { gte }` guard) for **all** collected consumptions.
- `transactions.ts:185` stores `status` (`completed`/`complimentary`) but it never gates the deduction.
- Receipt creation (`transactions.ts:514-532`) runs after the DB transaction commits and is non-blocking, so it cannot gate deduction either.

Therefore these invariants already hold: recipe'd items always deduct; no-recipe items (e.g. entry tickets) sell without deduction; complimentary transactions deduct inventory.

The **only** gap is **exposure**: `StockConsumptionLedger` is written at sale time and used internally (void restore, variance, consumption report) but is **never returned by any GET endpoint and never rendered in the frontend** (zero references). The `TransactionHistory` detail panel shows only order items + money.

This plan is **additive / read-only**. No deduction-logic or schema changes.

## Affected boundaries

- Backend: `backend/src/handlers/transactions.ts` (new endpoints), `backend/src/routes` registration (follow existing router mount), i18n keys.
- Frontend: `frontend/components/TransactionHistory.tsx` (detail section), new `frontend/components/InventoryAuditPanel.tsx`, `frontend/components/AdminPanel.tsx` (view + nav), new/extended frontend service + shared types.
- Data source (read-only): `StockConsumptionLedger`, `TransactionItem`, `StockConsumption`, `stock_items`.

## Decisions

1. **Scope**: per-transaction "Consumed inventory" detail **+** a global "Inventory Audit" list.
2. **Ground truth** for what a sale deducted = `StockConsumptionLedger` rows (written atomically; backfilled for historical sales by `backend/src/scripts/backfillConsumptionLedger.ts`).
3. **"Expected" comparison is advisory only**: recompute from the **current** recipe × items and compare to the ledger. Differences may be caused by recipe changes over time, so flag them as "review"/informational, never as hard errors. Hard flags are limited to: (a) recipe'd item with zero ledger rows, (b) ledger referencing an orphaned stock item.
4. **No new models / migrations.** No changes to `process-payment` or the void flow.

## Data flow

```
TransactionHistory detail open  -> GET /transactions/:id/consumption
                                   -> StockConsumptionLedger.findMany({ transactionId })
                                   -> recompute expected from current StockConsumption x items
                                   -> return { consumed[], expected[], status, totals }

Admin "Inventory Audit"         -> GET /transactions/inventory-audit?from&to
                                   -> scan completed+complimentary transactions
                                   -> flag per rules above
                                   -> return [{ transactionId, createdAt, status, userName, issues[] }]
```

## Implementation steps

### Backend

1. **`GET /api/transactions/:id/consumption`** (`authenticateToken`)
   - Must be registered **before** the `/:id` route in `transactions.ts` (route ordering matters — see existing `/reconcile` placed before `/:id` at line 579).
   - Fetch `prisma.stockConsumptionLedger.findMany({ where: { transactionId: Number(id) } })`.
   - Parse the transaction's `items` JSON (`safeJsonParse`) and recompute "expected" per stock item from current `stockConsumption` × `item.quantity` for each variant that has a recipe.
   - Response shape:
     ```json
     {
       "transactionId": 42,
       "status": "complimentary",
       "consumed": [{ "stockItemId": "...", "stockItemName": "Coffee Beans", "quantity": 20, "variantName": "Espresso", "productName": "Coffee", "estimated": false }],
       "totalConsumed": 20,
       "expected": [{ "stockItemId": "...", "stockItemName": "Coffee Beans", "quantity": 20 }],
       "itemFlags": [{ "productName": "Coffee", "variantName": "Espresso", "hasRecipe": true, "deducted": true }],
       "verdict": "ok" | "none_no_recipe" | "review"
     }
     ```
   - `verdict`: `ok` = ledger non-empty and (advisory) expected matches; `none_no_recipe` = no ledger rows AND no item currently has a recipe (e.g. entry ticket — expected); `review` = a recipe'd item has zero deduction, orphaned ref, or expected≠actual.
   - 404 if transaction missing.

2. **`GET /api/transactions/inventory-audit`** (`authenticateToken`, `requireRole(['ADMIN'])`)
   - Optional `from` / `to` date query params.
   - Query transactions `status in [completed, complimentary]` (reuse `CONSUMED_TRANSACTION_STATUSES_MUTABLE` from `backend/src/utils/transaction.ts`) in range.
   - For each, determine issues using the same rules as the per-transaction endpoint. Only include transactions with ≥1 issue.
   - Response shape:
     ```json
     {
       "totalScanned": 320,
       "flagged": [
         { "transactionId": 42, "createdAt": "...", "status": "completed", "userName": "cashier1", "issues": [ "recipe_item_zero_deduction:Coffee/Espresso" ] }
       ]
     }
     ```
   - Keep it efficient: batch-load `StockConsumptionLedger` and `StockConsumption` once and compute in memory rather than N+1 queries.

3. Add i18n keys for any user-facing error messages (follow existing `errors:transactions.*` namespace).

### Frontend

4. **Service + types**
   - Add types in `frontend/shared/types.ts` (e.g. `TransactionConsumption`, `InventoryAuditIssue`).
   - Add functions in `frontend/services/transactionService.ts`: `getTransactionConsumption(id)`, `getInventoryAudit(filters)`. Re-export from `frontend/services/apiService.ts` following existing pattern.

5. **TransactionHistory detail — "Consumed inventory" section** (`frontend/components/TransactionHistory.tsx`, near lines 361-368 where order items render)
   - When a transaction is selected, lazily `getTransactionConsumption(selectedTransaction.id)`.
   - Render a table: stock item | qty consumed | source variant/product | `estimated` badge.
   - Render a status line: e.g. `Inventory deducted: 3 items / 24 units` (green) or `No inventory deducted — items have no recipe` (muted) or `Review: possible missing deduction` (amber) with the issue detail.
   - No emojis (project rule). Use existing Tailwind classes/colors used elsewhere in the file.

6. **InventoryAuditPanel + Admin view** (new `frontend/components/InventoryAuditPanel.tsx`)
   - Pattern after `frontend/components/VarianceReportPanel.tsx` (self-contained, fetches its own data).
   - Optional from/to date filter; calls `getInventoryAudit`.
   - Lists flagged transactions with `id`, date, status, cashier, issue; clicking a row selects/opens that transaction in `TransactionHistory` (reuse the existing navigation pattern; if cross-component selection is awkward, link to the Transactions view with a preselected id).
   - Show summary counts (`totalScanned`, `flagged.length`).

7. **Wire into AdminPanel** (`frontend/components/AdminPanel.tsx`)
   - Add `'inventoryAudit'` to the `AdminView` union (line 60).
   - Add a `case 'inventoryAudit': return <InventoryAuditPanel />;` in `renderView` (line 86).
   - Add a sidebar `NavButton` with an icon + i18n label (e.g. `admin:nav.inventoryAudit`), placed near the existing analytics/reports buttons.
   - Add the i18n label keys.

## Failure modes & edge cases

- **False positive — recipe added after sale**: an item sold with no recipe (0 ledger) that *now* has a recipe. Mitigation: verdict `review` (not error) and the detail view shows `hasRecipe=true, deducted=false`; the user judges. Document this caveat in the audit panel.
- **`estimated` ledger rows** (historical backfill approximation): surface the `estimated` flag so the user knows the number is reconstructed, not recorded at sale.
- **Voided transactions**: excluded from scan (`status` not in consumed set). The detail view can still show consumed inventory for context, but no audit flag.
- **Orphaned stock references**: ledger `stockItemId` no longer in `stock_items` → hard flag `orphaned_reference`.
- **Route ordering**: new `/inventory-audit` and `/:id/consumption` must be declared before `/:id` and `/` catch-alls in the router.
- **Large datasets**: avoid N+1 in the audit endpoint; batch-load ledgers/recipes.

## Validation

- Backend: typecheck (`npm run typecheck` / `tsc --noEmit` in `backend`) and lint pass; confirm new endpoints respond.
- Manual via Playwright MCP against http://192.168.1.70 (admin/admin123):
  1. Open a **complimentary** sale in Transaction History → "Consumed inventory" shows non-zero deduction (proves complimentary deducts).
  2. Open a **no-recipe** sale (entry ticket) → shows "No inventory deducted — no recipe".
  3. Open a normal completed sale → shows correct itemised deduction.
  4. Open the **Inventory Audit** admin view → runs, lists any flagged transactions, drill-through works.
- Cross-check a transaction's displayed consumption against `StockConsumptionLedger` rows in the DB to confirm the UI matches ground truth.

## Out of scope

- Changing deduction logic, blocking no-recipe sales, DB migrations, modifying the void flow.
