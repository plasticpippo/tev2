-- Add track_inventory column to product_variants table
ALTER TABLE "product_variants" ADD COLUMN "track_inventory" BOOLEAN NOT NULL DEFAULT true;

-- Create stock_reconciliation_status enum
CREATE TYPE "stock_reconciliation_status" AS ENUM ('PENDING', 'RESOLVED', 'MANUAL');

-- Create stock_reconciliations table
CREATE TABLE "stock_reconciliations" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "transaction_id" UUID REFERENCES "transactions"("id") ON DELETE SET NULL,
    "status" "stock_reconciliation_status" NOT NULL,
    "details" JSONB,
    "error_type" TEXT NOT NULL,
    "error_message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "resolution" TEXT,
    PRIMARY KEY ("id")
);

-- Create index on stock_reconciliations for faster queries
CREATE INDEX "stock_reconciliations_transaction_id_idx" ON "stock_reconciliations"("transaction_id");
CREATE INDEX "stock_reconciliations_status_idx" ON "stock_reconciliations"("status");
