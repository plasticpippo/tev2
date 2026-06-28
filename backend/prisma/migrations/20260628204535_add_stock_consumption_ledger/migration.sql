/*
  Warnings:

  - The primary key for the `email_queue` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `email_queue` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `status` on table `variance_report_items` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "variance_reports" DROP CONSTRAINT "variance_reports_beginningCountId_fkey";

-- DropForeignKey
ALTER TABLE "variance_reports" DROP CONSTRAINT "variance_reports_endingCountId_fkey";

-- DropForeignKey
ALTER TABLE "variant_layouts" DROP CONSTRAINT "variant_layouts_categoryId_fkey";

-- DropIndex
DROP INDEX "cost_history_stockItemId_idx";

-- DropIndex
DROP INDEX "receipts_generation_status_idx";

-- DropIndex
DROP INDEX "Transaction_createdAt_idx";

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "visibleTillIds" DROP DEFAULT;

-- AlterTable
ALTER TABLE "email_queue" DROP CONSTRAINT "email_queue_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
ADD CONSTRAINT "email_queue_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "transactions" ALTER COLUMN "status" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "variance_report_items" ALTER COLUMN "status" SET NOT NULL;

-- CreateTable
CREATE TABLE "stock_consumption_ledger" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "stockItemId" UUID NOT NULL,
    "variantId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "variantName" TEXT NOT NULL,
    "stockItemName" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "categoryName" TEXT NOT NULL,
    "estimated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_consumption_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_consumption_ledger_transactionId_idx" ON "stock_consumption_ledger"("transactionId");

-- CreateIndex
CREATE INDEX "stock_consumption_ledger_stockItemId_idx" ON "stock_consumption_ledger"("stockItemId");

-- CreateIndex
CREATE INDEX "stock_consumption_ledger_createdAt_idx" ON "stock_consumption_ledger"("createdAt");

-- CreateIndex
CREATE INDEX "stock_consumption_ledger_stockItemId_createdAt_idx" ON "stock_consumption_ledger"("stockItemId", "createdAt");

-- CreateIndex
CREATE INDEX "receipts_receipt_number_idx" ON "receipts"("receipt_number");

-- CreateIndex
CREATE INDEX "revoked_tokens_tokenDigest_idx" ON "revoked_tokens"("tokenDigest");

-- AddForeignKey
ALTER TABLE "stock_consumption_ledger" ADD CONSTRAINT "stock_consumption_ledger_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_consumption_ledger" ADD CONSTRAINT "stock_consumption_ledger_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
