-- AlterTable
ALTER TABLE "transactions" ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "idempotencyCreatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey");
