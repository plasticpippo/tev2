-- Add shared column to product_grid_layouts table
ALTER TABLE "product_grid_layouts" ADD COLUMN "shared" BOOLEAN DEFAULT FALSE;

-- Create index for the shared column
CREATE INDEX "product_grid_layouts_shared_idx" ON "product_grid_layouts"("shared");