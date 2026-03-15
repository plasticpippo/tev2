-- AddVersionFieldToStockItem
-- This migration adds a version column to the stock_items table for optimistic locking

BEGIN;

-- Add version column with default value of 0
ALTER TABLE "stock_items" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

COMMIT;
