-- AlterTable
ALTER TABLE "categories" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- Backfill: preserve current (id) ordering, including system categories (id <= 0)
UPDATE "categories" SET "sortOrder" = "id";