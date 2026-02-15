-- Add discount fields to transactions table
BEGIN;

ALTER TABLE "transactions" ADD COLUMN "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "transactions" ADD COLUMN "discountReason" TEXT;
ALTER TABLE "transactions" ADD COLUMN "status" VARCHAR(255) NOT NULL DEFAULT 'completed';

COMMIT;
