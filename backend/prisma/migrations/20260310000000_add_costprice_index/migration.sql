-- Migration: Add costPrice column and index to product_variants
-- Description: Add costPrice column and index for query optimization
-- Date: 2026-03-10

-- Add costPrice column to product_variants (if not exists)
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS "costPrice" DECIMAL(10,4);

-- Create index on costPrice for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_cost ON product_variants(costPrice);
