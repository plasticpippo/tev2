-- AlterTable: Replace backgroundColor and textColor with themeColor
-- First add the new themeColor column
ALTER TABLE "product_variants" ADD COLUMN "themeColor" TEXT NOT NULL DEFAULT 'slate';

-- Drop the old columns
ALTER TABLE "product_variants" DROP COLUMN "backgroundColor";
ALTER TABLE "product_variants" DROP COLUMN "textColor";
