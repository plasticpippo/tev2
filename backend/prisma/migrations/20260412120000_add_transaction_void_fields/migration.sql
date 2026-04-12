-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3),
ADD COLUMN     "voidedBy" INTEGER;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_voidedBy_fkey" FOREIGN KEY ("voidedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
