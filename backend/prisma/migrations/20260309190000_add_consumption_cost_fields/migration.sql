-- Migration: Add consumption cost fields
-- Description: Add costPerUnit and taxRateId to StockItem, and costPrice to ProductVariant
-- Date: 2026-03-09

-- Add costPerUnit column to stock_items
ALTER TABLE "stock_items" ADD COLUMN "costPerUnit" DECIMAL(10,4);

-- Add taxRateId column to stock_items with foreign key
ALTER TABLE "stock_items" ADD COLUMN "taxRateId" INTEGER;
ALTER TABLE "stock_items" ADD CONSTRAINT "stock_items_taxRateId_fkey" 
  FOREIGN KEY ("taxRateId") REFERENCES "tax_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for taxRateId on stock_items
CREATE INDEX "stock_items_taxRateId_idx" ON "stock_items"("taxRateId");

-- Add costPrice column to product_variants
ALTER TABLE "product_variants" ADD COLUMN "costPrice" DECIMAL(10,4);
