
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a temporary table to store the mapping from old IDs to new UUIDs
CREATE TEMP TABLE temp_id_mapping AS
SELECT "id" as old_id, uuid_generate_v4() as new_id
FROM "stock_items";

-- Add new uuid column to stock_items
ALTER TABLE "stock_items" ADD COLUMN "new_id" UUID;

-- Update the new_id column using the mapping
UPDATE "stock_items"
SET "new_id" = temp.new_id
FROM temp_id_mapping temp
WHERE "stock_items"."id" = temp.old_id;

-- Add new uuid column to stock_consumptions
ALTER TABLE "stock_consumptions" ADD COLUMN "new_stockItemId" UUID;

-- Update stock_consumptions to reference the new UUIDs
UPDATE "stock_consumptions"
SET "new_stockItemId" = temp.new_id
FROM temp_id_mapping temp
WHERE "stock_consumptions"."stockItemId" = temp.old_id;

-- Add new uuid column to stock_adjustments
ALTER TABLE "stock_adjustments" ADD COLUMN "new_stockItemId" UUID;

-- Update stock_adjustments to reference the new UUIDs
UPDATE "stock_adjustments"
SET "new_stockItemId" = temp.new_id
FROM temp_id_mapping temp
WHERE "stock_adjustments"."stockItemId" = temp.old_id;

-- Add not null constraints
ALTER TABLE "stock_consumptions" ALTER COLUMN "new_stockItemId" SET NOT NULL;
ALTER TABLE "stock_adjustments" ALTER COLUMN "new_stockItemId" SET NOT NULL;

-- Drop old foreign key constraints
ALTER TABLE "stock_consumptions" DROP CONSTRAINT "stock_consumptions_stockItemId_fkey";
ALTER TABLE "stock_adjustments" DROP CONSTRAINT "stock_adjustments_stockItemId_fkey";

-- Drop old primary key
ALTER TABLE "stock_items" DROP CONSTRAINT "stock_items_pkey";

-- Drop old id columns
ALTER TABLE "stock_consumptions" DROP COLUMN "stockItemId";
ALTER TABLE "stock_adjustments" DROP COLUMN "stockItemId";
ALTER TABLE "stock_items" DROP COLUMN "id";

-- Rename new columns to original names
ALTER TABLE "stock_items" RENAME COLUMN "new_id" TO "id";
ALTER TABLE "stock_consumptions" RENAME COLUMN "new_stockItemId" TO "stockItemId";
ALTER TABLE "stock_adjustments" RENAME COLUMN "new_stockItemId" TO "stockItemId";

-- Set new primary key and unique constraint
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id");

-- Set default value for id column to generate UUIDs
ALTER TABLE "stock_items" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4();

-- Add foreign key constraints
ALTER TABLE "stock_consumptions" ADD CONSTRAINT "stock_consumptions_stockItemId_fkey"
    FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
    
ALTER TABLE "stock_adjustments" ADD CONSTRAINT "stock_adjustments_stockItemId_fkey"
    FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;