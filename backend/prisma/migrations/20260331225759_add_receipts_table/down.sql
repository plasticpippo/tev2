-- DropIndex
DROP INDEX "receipts_created_at_idx";
DROP INDEX "receipts_customer_id_idx";
DROP INDEX "receipts_issued_at_idx";
DROP INDEX "receipts_receipt_number_key";
DROP INDEX "receipts_status_idx";
DROP INDEX "receipts_transaction_id_idx";

-- DropForeignKey
ALTER TABLE "receipts" DROP CONSTRAINT "receipts_customer_id_fkey";
ALTER TABLE "receipts" DROP CONSTRAINT "receipts_issued_by_fkey";
ALTER TABLE "receipts" DROP CONSTRAINT "receipts_transaction_id_fkey";
ALTER TABLE "receipts" DROP CONSTRAINT "receipts_voided_by_fkey";

-- DropTable
DROP TABLE "receipts";

-- DropEnum
DROP TYPE "EmailStatus";
DROP TYPE "ReceiptStatus";
