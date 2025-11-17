-- Update existing layouts to have default filterType of 'all'
UPDATE "product_grid_layouts" 
SET "filterType" = 'all' 
WHERE "filterType" IS NULL;

-- Set default value for future inserts
ALTER TABLE "product_grid_layouts" 
ALTER COLUMN "filterType" SET DEFAULT 'all';