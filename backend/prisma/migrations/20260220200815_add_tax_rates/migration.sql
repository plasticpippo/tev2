-- Create tax_rates table
CREATE TABLE "tax_rates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tax_rates_pkey" PRIMARY KEY ("id")
);

-- Create indexes for tax_rates
CREATE UNIQUE INDEX "tax_rates_name_key" ON "tax_rates"("name");
CREATE INDEX "tax_rates_isDefault_isActive_idx" ON "tax_rates"("isDefault", "isActive");

-- Add taxRateId to product_variants
ALTER TABLE "product_variants" ADD COLUMN "taxRateId" INTEGER;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_taxRateId_fkey" 
    FOREIGN KEY ("taxRateId") REFERENCES "tax_rates"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for product_variants.taxRateId
CREATE INDEX "product_variants_taxRateId_idx" ON "product_variants"("taxRateId");

-- Add defaultTaxRateId to settings
ALTER TABLE "settings" ADD COLUMN "defaultTaxRateId" INTEGER;
ALTER TABLE "settings" ADD CONSTRAINT "settings_defaultTaxRateId_fkey" 
    FOREIGN KEY ("defaultTaxRateId") REFERENCES "tax_rates"("id") 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for settings.defaultTaxRateId
CREATE INDEX "settings_defaultTaxRateId_idx" ON "settings"("defaultTaxRateId");
