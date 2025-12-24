-- Set default value for visibleTillIds to prevent future null values
-- Update any remaining null values to empty array
UPDATE "categories" SET "visibleTillIds" = '[]' WHERE "visibleTillIds" IS NULL;

-- Add default value to the column
ALTER TABLE "categories" ALTER COLUMN "visibleTillIds" SET DEFAULT '[]';