-- CreateEnum
CREATE TYPE "ReceiptAuditAction" AS ENUM ('create', 'issue', 'email', 'email_retry', 'void', 'regenerate_pdf', 'update');

-- CreateTable
CREATE TABLE "receipt_audit_logs" (
    "id" SERIAL NOT NULL,
    "receipt_id" INTEGER NOT NULL,
    "action" "ReceiptAuditAction" NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "user_id" INTEGER NOT NULL,
    "user_name" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "receipt_audit_logs_receipt_id_idx" ON "receipt_audit_logs"("receipt_id");

-- CreateIndex
CREATE INDEX "receipt_audit_logs_action_idx" ON "receipt_audit_logs"("action");

-- CreateIndex
CREATE INDEX "receipt_audit_logs_user_id_idx" ON "receipt_audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "receipt_audit_logs_created_at_idx" ON "receipt_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "receipt_audit_logs_receipt_id_created_at_idx" ON "receipt_audit_logs"("receipt_id", "created_at");

-- AddForeignKey
ALTER TABLE "receipt_audit_logs" ADD CONSTRAINT "receipt_audit_logs_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipt_audit_logs" ADD CONSTRAINT "receipt_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add relation to User model in Prisma client
-- Note: This is a comment for documentation - the Prisma schema already has the relation defined
