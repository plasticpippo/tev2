# Plan: Decide the position of category buttons in the POS view

## Goal
Let an admin set a numeric display order for the real category buttons shown in the POS
category bar. The order is global (same on every till where a category is visible) and
persisted in the database.

**Fixed buttons (unchanged):** The `Favourites` button stays first and the `All` button
stays last. Only the real category buttons in between are reordered.

## Mechanism (decided)
- Numeric order field on each category. Admin edits an inline "Order" number per row in the
  existing Admin > Category Management list. POS sorts the category buttons by this number.
- Order is **global** (one number per category).

## Stated assumptions
- Gaps and duplicate numbers are allowed. Ties are broken alphabetically by category `name`
  (so ordering is always deterministic).
- New categories **append to the end** automatically (`max(sortOrder) + 1`); admin can then
  renumber via the inline field.
- Reordering reuses the existing `PUT /api/categories/:id` (frontend sends the full category
  object) rather than adding a new endpoint. This avoids clobbering `name`/`visibleTillIds`.
- Existing display order is preserved on upgrade by backfilling `sortOrder = id`.

## Current state (context for implementer)
- `backend/prisma/schema.prisma:153` — `Category` has `id, name, visibleTillIds` only.
- `backend/src/handlers/categories.ts:23` — `GET /` uses `findMany` with **no `orderBy`**.
- `frontend/src/components/CategoryTabs.tsx:50` — renders category buttons in backend array
  order; `Favourites` hardcoded first, `All` hardcoded last.
- `frontend/components/CategoryManagement.tsx` — admin list manages name + visible tills only.
- Type `Category` canonical source: `shared/types.ts:58`; copies in
  `frontend/shared/types.ts:76` and `backend/src/shared-types.ts` (re-exported via
  `backend/src/types.ts`).
- Existing migrations are standard Prisma SQL; table is mapped to `"categories"`.

## Ordered tasks

### 1. Add `sortOrder` to the Category model
- File: `backend/prisma/schema.prisma` (model `Category`, ~line 153).
- Add field: `sortOrder Int @default(0)`

### 2. Create + apply the migration (backfill to preserve current order)
- Create a new migration directory under `backend/prisma/migrations/` following the existing
  naming pattern (timestamp + `_add_category_sort_order`), e.g.
  `20260629190000_add_category_sort_order/migration.sql`.
- The migration SQL must contain BOTH steps:
  ```sql
  -- AlterTable
  ALTER TABLE "categories" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

  -- Backfill: preserve current (id) ordering, including system categories (id <= 0)
  UPDATE "categories" SET "sortOrder" = "id";
  ```
- Apply (headless, per repo rules — never `db push`):
  ```bash
  cd backend && npx prisma migrate deploy
  ```
- Verify the migration file exists and is applied; commit it.

### 3. Update the shared `Category` type (3 files)
Add `sortOrder: number;` to the `Category` interface in:
- `shared/types.ts`
- `frontend/shared/types.ts`
- `backend/src/shared-types.ts`

### 4. Backend handler changes — `backend/src/handlers/categories.ts`
- `GET /` (line 14):
  - add `orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }]`
  - add `sortOrder: true` to the `select`.
- `GET /:id` (line 41): add `sortOrder: true` to `select`.
- `POST /` (line 68):
  - destructure optional `sortOrder` from body; if absent, compute
    `max(sortOrder) + 1` over existing categories and use that.
  - include `sortOrder` in `data` and in the response `select`.
- `PUT /:id` (line 101):
  - accept optional `sortOrder` from body; when provided, validate it is a non-negative
    integer (see task 5) and include it in `data`.
  - include `sortOrder` in the response `select`.
  - NOTE: keep `visibleTillIds: visibleTillIds || []` only when `visibleTillIds` is present;
    for an order-only update the frontend sends the full object, so existing behavior is fine.
    Do not send `name: undefined` in a way that clears the field — verify Prisma ignores
    `undefined` (it does, but confirm).

### 5. Validation — `backend/src/utils/validation.ts`
- Add `validateCategorySortOrder(value: unknown): string | null`:
  - valid iff it is an integer `>= 0`.
- Optionally call it from `validateCategory` (task 4 uses it inline for PUT).

### 6. Frontend — `frontend/src/components/CategoryTabs.tsx`
- In the `visibleCategories` `useMemo` (line 20), after filtering, add a stable sort:
  `[...filtered].sort((a, b) => a.sortOrder - b.sortOrder)`.
- No other change; Favourites/All rendering stays as-is.

### 7. Frontend — `frontend/components/CategoryManagement.tsx`
- Add an inline numeric "Order" input to each category row (line ~228, the row `<div>`).
  - Controlled by the row's `category.sortOrder`.
  - On change, call `productApi.saveCategory({ id, name, visibleTillIds, sortOrder })`
    (sends the full object so nothing is clobbered), then `onDataUpdate()` to refresh.
    Consider a small debounce or save-on-blur to avoid a request per keystroke.
  - Restrict input to non-negative integers (e.g. `type="number" min="0" step="1"`).
- Add the i18n label key (e.g. `categories.order`) to the `admin` namespace in `en` and the
  other locale files present (find them under backend/locales or frontend locales as
  appropriate; match the existing namespace/file convention).

### 8. (No change) — `frontend/services/productService.ts`
- `saveCategory` already passes the whole category object through; once `Category` carries
  `sortOrder`, it flows automatically. Confirm `Omit<Category,'id'> & { id? }` includes it.

## Validation plan
- Fresh DB rollout: `docker compose down -v && docker compose up -d --build` → migration
  applies → verify `categories.sortOrder` populated (equals `id`).
- App at http://192.168.1.70 , admin / admin123. Use Playwright MCP.
- Admin > Category Management: change an "Order" number, reload, confirm persistence.
- POS view: confirm category buttons reflect the new order; Favourites still first, All still
  last; a category hidden on a till is skipped while the rest keep order.
- Tie-break: set two categories to the same number → confirm alphabetical secondary order.
- New category: create one → confirm it appears last automatically.
- Lint/typecheck: run the project's lint + typecheck commands after changes.

## Risks / notes
- Partial-update footgun: an order-only edit must not wipe `name`/`visibleTillIds`. Mitigated
  by frontend always sending the full category object; double-check the PUT `data` mapping.
- Stale frontend cache: `makeApiRequest` caches `getCategories`; the frontend sort (task 6)
  guarantees correct order even if a cached array isn't re-sorted.
- Migration creation in a headless env: follow the repo's established migration-file
  process (hand-write the SQL per the format above is acceptable); apply only via
  `npx prisma migrate deploy`. Never use `db push` or manual SQL outside the migration file.
