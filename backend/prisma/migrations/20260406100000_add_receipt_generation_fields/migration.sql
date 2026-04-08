-- AlterTable: Add receipt generation tracking fields to receipts table
ALTER TABLE "receipts" ADD COLUMN "issued_from_payment_modal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "receipts" ADD COLUMN "generation_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "receipts" ADD COLUMN "generation_attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "receipts" ADD COLUMN "last_generation_attempt" TIMESTAMP(3);
ALTER TABLE "receipts" ADD COLUMN "generation_error" TEXT;

-- CreateIndex for generation queue processing
CREATE INDEX "receipts_generation_status_idx" ON "receipts"("generation_status");

-- Add user receipt preference for payment modal
ALTER TABLE "users" ADD COLUMN "receiptFromPaymentDefault" BOOLEAN;
