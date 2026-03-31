-- CreateTable
CREATE TYPE "ReceiptStatus" AS ENUM ('draft', 'issued', 'voided', 'emailed');

CREATE TYPE "EmailStatus" AS ENUM ('pending', 'sent', 'failed', 'bounced');

CREATE TABLE "receipts" (
    "id" SERIAL NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "transaction_id" INTEGER NOT NULL,
    "customer_id" INTEGER,
    "status" "ReceiptStatus" NOT NULL DEFAULT 'draft',
    "business_snapshot" JSONB NOT NULL,
    "customer_snapshot" JSONB,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax" DECIMAL(10,2) NOT NULL,
    "tax_breakdown" JSONB,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_reason" TEXT,
    "tip" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "items_snapshot" JSONB NOT NULL,
    "notes" TEXT,
    "internal_notes" TEXT,
    "pdf_path" TEXT,
    "pdf_generated_at" TIMESTAMP(3),
    "issued_at" TIMESTAMP(3),
    "issued_by" INTEGER NOT NULL,
    "emailed_at" TIMESTAMP(3),
    "email_recipient" TEXT,
    "email_status" "EmailStatus",
    "email_error_message" TEXT,
    "email_attempts" INTEGER NOT NULL DEFAULT 0,
    "voided_at" TIMESTAMP(3),
    "void_reason" TEXT,
    "voided_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "receipts_receipt_number_key" ON "receipts"("receipt_number");

-- CreateIndexes
CREATE INDEX "receipts_transaction_id_idx" ON "receipts"("transaction_id");
CREATE INDEX "receipts_customer_id_idx" ON "receipts"("customer_id");
CREATE INDEX "receipts_status_idx" ON "receipts"("status");
CREATE INDEX "receipts_issued_at_idx" ON "receipts"("issued_at");
CREATE INDEX "receipts_created_at_idx" ON "receipts"("created_at");

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_issued_by_fkey" FOREIGN KEY ("issued_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_voided_by_fkey" FOREIGN KEY ("voided_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
