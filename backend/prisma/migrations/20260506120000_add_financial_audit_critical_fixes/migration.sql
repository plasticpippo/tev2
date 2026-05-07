-- 1. Transaction: Make totalCost non-nullable with default 0
UPDATE "transactions" SET "totalCost" = 0 WHERE "totalCost" IS NULL;
ALTER TABLE "transactions" ALTER COLUMN "totalCost" SET DEFAULT 0;
ALTER TABLE "transactions" ALTER COLUMN "totalCost" SET NOT NULL;

-- 2. Transaction: Add missing indexes (createdAt index already exists)
CREATE INDEX IF NOT EXISTS "transactions_status_idx" ON "transactions"("status");
CREATE INDEX IF NOT EXISTS "transactions_userId_createdAt_idx" ON "transactions"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "transactions_createdAt_status_idx" ON "transactions"("createdAt", "status");

-- 3. Transaction: Add onDelete Restrict to voidedBy foreign key (currently SET NULL)
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_voidedBy_fkey";
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_voidedBy_fkey" FOREIGN KEY ("voidedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. StockItem: Add missing indexes
CREATE INDEX IF NOT EXISTS "stock_items_type_idx" ON "stock_items"("type");
CREATE INDEX IF NOT EXISTS "stock_items_lastCostUpdate_idx" ON "stock_items"("lastCostUpdate");

-- 5. StockAdjustment: Add missing indexes
CREATE INDEX IF NOT EXISTS "stock_adjustments_stockItemId_idx" ON "stock_adjustments"("stockItemId");
CREATE INDEX IF NOT EXISTS "stock_adjustments_createdAt_idx" ON "stock_adjustments"("createdAt");
CREATE INDEX IF NOT EXISTS "stock_adjustments_userId_createdAt_idx" ON "stock_adjustments"("userId", "createdAt");

-- 6. DailyClosing: Add missing indexes
CREATE INDEX IF NOT EXISTS "daily_closings_closedAt_idx" ON "daily_closings"("closedAt");
CREATE INDEX IF NOT EXISTS "daily_closings_userId_closedAt_idx" ON "daily_closings"("userId", "closedAt");

-- 7. InventoryCount: Add onDelete Restrict to approvedBy foreign key (currently SET NULL)
ALTER TABLE "inventory_counts" DROP CONSTRAINT "inventory_counts_approvedBy_fkey";
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. VarianceReport: Add onDelete Restrict to reviewedBy foreign key (currently SET NULL)
ALTER TABLE "variance_reports" DROP CONSTRAINT "variance_reports_reviewedBy_fkey";
ALTER TABLE "variance_reports" ADD CONSTRAINT "variance_reports_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 9. Create transaction_audit_logs table
CREATE TABLE IF NOT EXISTS "transaction_audit_logs" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "userId" INTEGER NOT NULL,
    "userName" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaction_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "transaction_audit_logs_transactionId_idx" ON "transaction_audit_logs"("transactionId");
CREATE INDEX IF NOT EXISTS "transaction_audit_logs_userId_idx" ON "transaction_audit_logs"("userId");
CREATE INDEX IF NOT EXISTS "transaction_audit_logs_createdAt_idx" ON "transaction_audit_logs"("createdAt");
CREATE INDEX IF NOT EXISTS "transaction_audit_logs_action_idx" ON "transaction_audit_logs"("action");

ALTER TABLE "transaction_audit_logs" ADD CONSTRAINT "transaction_audit_logs_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transaction_audit_logs" ADD CONSTRAINT "transaction_audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
