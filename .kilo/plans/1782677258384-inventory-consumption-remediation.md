# Inventory & Itemised Consumption Remediation Plan

## Context

Analysis of the inventory and itemised-consumption subsystems uncovered several
data-correctness defects, plus a backup-compatibility check. This plan covers
**all** findings (B1–B3, C1–C3, D1–D2) and documents the backup verdict.

Two design decisions are locked in:
1. **Consumption accounting** → new **ledger snapshot** table (immutable per-sale
   consumption rows). Reports and voids read the ledger instead of re-deriving
   from the live recipe.
2. **Inventory counts** → **reconcile on approve** (approved count sets running
   `StockItem.quantity` to the counted value + reconciliation `StockAdjustment`).

Environment / rules: app at `http://192.168.1.70`; Postgres in Docker
(`assopos_backend_db`); schema changes via **Prisma migrations only**
(`npx prisma migrate deploy`, never `db push`); no test files — verify with the
**Playwright MCP** server; surgical changes; no emojis.

---

## 0. Backup compatibility verdict — `backups/barpos-june26.sql`

**Verdict: FULLY compatible with the current app (v1.2.1).**

- Migration history matches exactly: backup contains all 53 migrations; last is
  `20260512090000_add_cloud_backup_retention`, identical to
  `backend/prisma/migrations/`. `prisma migrate deploy` after restore = no-op.
- All 34 tables present; spot-checked `stock_items`, `product_variants`,
  `transactions`, `transaction_items`, `settings` columns match `schema.prisma`.
- Data integrity clean: 0 orphaned `stock_consumptions` (→ stock_items and →
  variants), 0 negative stock, valid UUIDs. Backup (Jun 26) postdates the last
  schema/migration change (May 12–14).
- Restore guidance: restore into a **clean** DB (drop/recreate) to avoid
  `_prisma_migrations` PK conflicts.

No action required for the backup itself.

---

## 1. Schema change — ONE new migration

### 1.1 Add `StockConsumptionLedger` model to `backend/prisma/schema.prisma`

```prisma
model StockConsumptionLedger {
  id            Int      @id @default(autoincrement())
  transactionId Int
  stockItemId   String   @db.Uuid
  variantId     Int
  productId     Int
  quantity      Int
  productName   String
  variantName   String
  stockItemName String
  categoryId    Int
  categoryName  String
  estimated     Boolean  @default(false)
  createdAt     DateTime @default(now())

  transaction Transaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  stockItem   StockItem   @relation(fields: [stockItemId], references: [id])

  @@index([transactionId])
  @@index([stockItemId])
  @@index([createdAt])
  @@index([stockItemId, createdAt])
  @@map("stock_consumption_ledger")
}
```

- Add back-relation `consumptionLedger StockConsumptionLedger[]` to `Transaction`.
- Add back-relation `consumptionLedger StockConsumptionLedger[]` to `StockItem`.

Rationale: `variantId`/`productId`/`categoryId` are **plain Int (no FK)** to
survive product/variant recreation (the product-update flow deletes & recreates
variants). Display names are snapshotted so reports need no fragile joins.

### 1.2 Generate migration

```bash
cd backend && npx prisma migrate dev --name add_stock_consumption_ledger --create-only
```
Review the generated SQL, then apply headlessly:
```bash
npx prisma migrate deploy
```
Commit the new migration folder under `backend/prisma/migrations/`.

---

## 2. B1/B2 — Ledger write, read, and backfill

### 2.1 Write ledger rows on sale — `backend/src/handlers/transactions.ts`

In the create-transaction `$transaction` block (currently around lines 275–289
where `consumptions` map is built):
- While iterating items, also build an array of ledger rows. For each item, load
  `product` with its matching `variant` and `category` (already fetched for the
  consumption calc; reuse) and for each `sc` of the variant's `stockConsumption`
  push:
  `{ transactionId: <after create>, stockItemId: sc.stockItemId, variantId, productId,
     quantity: sc.quantity * item.quantity, productName, variantName, stockItemName,
     categoryId, categoryName, estimated: false }`.
- After `tx.transaction.create` returns its `id`, write the rows with
  `tx.stockConsumptionLedger.createMany({ data })`.
- Stock decrement logic (lines 358–377) stays the same.

### 2.2 Restore from ledger on void — `backend/src/handlers/transactions.ts`

Replace the recipe re-read block (lines 746–806) in the void handler:
- Fetch `stockConsumptionLedger` rows for the transaction, sum `quantity` grouped
  by `stockItemId` (use snapshot `stockItemName`).
- Increment `StockItem.quantity` by each sum and create one `StockAdjustment`
  per stock item (reason `Transaction #${id} voided: ${reason}`).
- This fixes B2: restoration no longer depends on the current recipe.

### 2.3 Rewrite itemised report — `backend/src/handlers/consumptionReports.ts`

Replace the current derive-from-`items`-×-recipe logic with a ledger query:
- `where`: `transaction.status IN (CONSUMED_TRANSACTION_STATUSES)`; apply
  `createdAt` range on the `transaction` relation; apply `categoryId` filter on
  the ledger snapshot column; apply `stockItemType` filter via the `stockItem`
  relation (`include: { stockItem: true }`).
- Aggregate in JS: `details` grouped by `(variantId, stockItemId)` summing
  `quantity`; `totals` grouped by `stockItemId` (canonical name from the joined
  `stockItem`, fallback to snapshot `stockItemName`).
- Keep the existing response shape (`{ details, totals }`) so the frontend
  (`ItemisedConsumptionPanel`/`Table`) needs no change.
- Fixes B1: report reflects actual historical consumption, stable across later
  recipe edits.

### 2.4 Align variance report — `backend/src/services/varianceService.ts`

Replace the theoretical-usage re-derivation (lines 231–277):
- Query `stockConsumptionLedger` for the period (`createdAt` in range,
  `transaction.status IN CONSUMED_TRANSACTION_STATUSES`), sum `quantity` per
  `stockItemId` → `theoreticalUsage`.
- Removes the live-recipe dependency and fixes B3 for variance (now counts
  `complimentary` sales, which did decrement stock).

### 2.5 Shared status constant

Add to a shared location (e.g. `backend/src/shared-types.ts` or a new
`backend/src/utils/transactionStatus.ts`):
```ts
export const CONSUMED_TRANSACTION_STATUSES = ['completed', 'complimentary'] as const;
```
Use it in: `consumptionReports.ts`, `varianceService.ts`, and the reconciliation
query in `transactions.ts` (already uses `['completed','complimentary']` — switch
to the constant). This is the **B3** fix.

### 2.6 Backfill script — `backend/src/scripts/backfillConsumptionLedger.ts`

One-time script (run via `npx tsx`, not committed as a migration):
- For each transaction with `status IN ('completed','complimentary')`:
  - Parse `items`; for each item resolve the **recipe as-of `transaction.createdAt`**
    using `StockConsumptionVersion`:
    - Effective recipe = the `StockConsumptionVersion` snapshot whose
      `replacedAt` is the **smallest value greater than** `transaction.createdAt`
      (group all version rows sharing that `replacedAt` for the `variantId`);
      if **no** version row has `replacedAt > createdAt`, use the **current**
      `StockConsumption` for the variant.
    - Set `estimated = true` when falling back to the current recipe while the
      variant has version history implying earlier changes (i.e. a version
      `replacedAt <= createdAt` exists but no `replacedAt > createdAt`).
  - Write ledger rows with `estimated` accordingly.
- Idempotent: skip transactions that already have ledger rows.
- Log a summary (rows written, estimated count). Document the approximation in a
  header comment.

---

## 3. C1 — Reconcile stock on inventory-count approval

File: `backend/src/handlers/costManagement.ts`, approve endpoint (lines 536–575).

Inside a `prisma.$transaction`:
- Load the count with `items` (include `stockItem`).
- For each `InventoryCountItem`: `delta = round(countedQty) − stockItem.quantity`;
  `tx.stockItem.update({ where: { id }, data: { quantity: round(countedQty) } })`;
  `tx.stockAdjustment.create({ stockItemId, itemName, quantity: delta,
  reason: 'Inventory count #' + id + ' approved', userId, userName })`.
- Then set `status='approved'`, `approvedAt`, `approvedBy` as today.

**Known limitation to document (not fix here):** `InventoryCountItem.quantity`
is `Decimal(10,2)` but `StockItem.quantity` is `Int`. Reconciliation rounds to
Int. Aligning the column types is a larger, separate change — leave as a noted
follow-up.

---

## 4. C2 — Guard manual adjustments against negative stock

File: `backend/src/handlers/stockAdjustments.ts`, POST `/` (lines 74–97).

Before the `increment`, when `quantity < 0`: re-read current `stockItem.quantity`
(inside the tx) and if `current + quantity < 0`, return `400` with an
insufficient-stock error (mirror `transactions.ts` message style). Positive
adjustments remain unchecked.

---

## 5. C3 — Split `productName` / `variantName` in `transaction_items`

File: `backend/src/handlers/transactions.ts` `transactionItem.createMany`
(lines 318–334).

The frontend sends `item.name = "Product - Variant"` (`OrderContext.tsx:148`).
Fix the relational rows by looking up real names server-side:
- Build a `Map<variantId, {productName, variantName}>` once from the
  products/variants already loaded during consumption calculation (or one
  `findMany` of the distinct variant ids with `include: { product: true }`).
- Set `productName` from the product name and `variantName` from the variant name.
- Leave the JSON `items[].name` (used for display in `TransactionHistory`) as-is
  to avoid frontend churn.

---

## 6. D1 — Tidy JSON handling of `Transaction.items`

- `transactions.ts:294`: store the **object** directly (`items: items`), drop the
  redundant `JSON.stringify`. (Existing rows already parse back to arrays, so no
  data migration is needed — verified via Prisma Json semantics.)
- Add a small shared helper `parseTransactionItems(items)` (object-or-string safe)
  and use it in `consumptionReports.ts` and `varianceService.ts` so both reads
  are consistent and defensive.

---

## 7. D2 — Remove dead file

Delete `backend/src/handlers/ingredients.ts` (contains only
`// Dead code removed - file was never imported`). Confirm no imports reference
it before deleting.

---

## 8. Prevent orphaned ledger references

File: `backend/src/handlers/stockItems.ts`, DELETE `/:id` integrity check
(lines 332–338). Add `tx.stockConsumptionLedger.count({ where: { stockItemId: id } })`
to the `Promise.all` and a matching `STOCK_IN_USE_LEDGER` branch that returns a
translated error (add `errors:stockItems.cannotDeleteHasConsumptionLedger` locale
key). This stops deleting a stock item that has historical consumption rows.

---

## Touched files (summary)

Backend:
- `prisma/schema.prisma` (new model + 2 back-relations)
- `prisma/migrations/<new>/migration.sql` (generated)
- `src/handlers/transactions.ts` (ledger write, void-from-ledger, line-item names, JSON tidy, status constant)
- `src/handlers/consumptionReports.ts` (ledger-based report, JSON helper)
- `src/handlers/costManagement.ts` (approve reconciliation)
- `src/handlers/stockAdjustments.ts` (negative guard)
- `src/handlers/stockItems.ts` (ledger delete-blocker)
- `src/services/varianceService.ts` (ledger theoretical usage, status constant)
- `src/scripts/backfillConsumptionLedger.ts` (new, one-time)
- `src/shared-types.ts` or `src/utils/transactionStatus.ts` (status constant + JSON helper)
- locale files: add new keys (e.g. `errors:stockItems.cannotDeleteHasConsumptionLedger`, insufficient-stock on adjustment)

Frontend: none required (response shapes preserved).

---

## Validation plan

1. **Build & migrate** on a fresh DB:
   `docker compose down -v && docker compose up -d --build`; confirm
   `assopos_backend_db` logs show `migrate deploy` applying only the new ledger
   migration; verify the migration file is committed.
2. **Run backfill** (`npx tsx src/scripts/backfillConsumptionLedger.ts`); confirm
   rows created and `estimated` counts logged.
3. **Playwright MCP** against `http://192.168.1.70` (login `admin`/`admin123`):
   - **Sale → ledger:** sell a cocktail with a known recipe; verify
     `stock_consumption_ledger` rows match recipe × qty and `StockItem` decremented.
   - **Recipe edit → report stable (B1):** edit the variant's recipe, then reopen
     the itemised consumption report for the earlier period — totals unchanged.
   - **Void → restore (B2):** void the sale; verify stock restored to pre-sale
     values via ledger (not the new recipe).
   - **Complimentary sale (B3):** create a 100%-discount (complimentary) sale;
     confirm it appears in both itemised and variance reports.
   - **Count approve → reconcile (C1):** create+submit+approve an inventory count
     with a different counted qty; verify `StockItem.quantity` equals the count
     and a reconciliation `StockAdjustment` exists.
   - **Negative adjustment (C2):** attempt a manual adjustment below zero → expect
     a 400 rejection.
   - **Split names (C3):** after a sale, inspect `transaction_items` — `productName`
     and `variantName` differ (no longer identical "Product - Variant").
   - **Delete guard (§8):** try deleting a stock item with ledger rows → expect the
     new "in use" error.
4. **Typecheck/lint:** run the backend lint/typecheck (per `AGENTS.md`) and fix
   any issues introduced.

---

## Risks / open notes

- **Backfill is approximate** where `StockConsumptionVersion` history is missing
  (pre-`20260412160000` data) — flagged via `estimated=true`. Acceptable; honest.
- **Int vs Decimal** on stock quantity (C1 rounding). Documented; type alignment
  deferred.
- **Void of pre-fix transactions** (no ledger rows): void handler must fall back
  gracefully — if no ledger rows exist for the transaction, restore via the
  current recipe (legacy behaviour) so old voids still work. Add this fallback
  explicitly.
- Single migration keeps rollout simple; the ledger is additive (no existing
  column changes), so it is low-risk to deploy.
