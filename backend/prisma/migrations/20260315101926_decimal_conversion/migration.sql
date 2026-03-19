-- Convert Float to Decimal(10,2) for monetary fields to prevent floating-point precision errors
-- This ensures accurate financial calculations

-- Convert product_variants.price
ALTER TABLE "product_variants" 
ALTER COLUMN "price" TYPE DECIMAL(10,2) 
USING "price"::DECIMAL(10,2);

-- Convert transactions columns
ALTER TABLE "transactions" 
ALTER COLUMN "subtotal" TYPE DECIMAL(10,2) 
USING "subtotal"::DECIMAL(10,2);

ALTER TABLE "transactions" 
ALTER COLUMN "tax" TYPE DECIMAL(10,2) 
USING "tax"::DECIMAL(10,2);

ALTER TABLE "transactions" 
ALTER COLUMN "tip" TYPE DECIMAL(10,2) 
USING "tip"::DECIMAL(10,2);

ALTER TABLE "transactions" 
ALTER COLUMN "total" TYPE DECIMAL(10,2) 
USING "total"::DECIMAL(10,2);

ALTER TABLE "transactions" 
ALTER COLUMN "discount" TYPE DECIMAL(10,2) 
USING "discount"::DECIMAL(10,2);
