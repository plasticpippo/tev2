-- AlterEnum
ALTER TYPE "ReceiptAuditAction" ADD VALUE 'retry';

-- AlterTable: Add cost tracking fields to stock_items
ALTER TABLE "stock_items" ADD COLUMN "standardCost" DECIMAL(10,4) NOT NULL DEFAULT 0,
ADD COLUMN "costPerUnit" DECIMAL(10,4) NOT NULL DEFAULT 0,
ADD COLUMN "lastCostUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "costUpdateReason" TEXT;

-- AlterTable: Add profitability fields to transactions
ALTER TABLE "transactions" ADD COLUMN "totalCost" DECIMAL(10,2),
ADD COLUMN "costCalculatedAt" TIMESTAMP(3),
ADD COLUMN "grossMargin" DECIMAL(10,2),
ADD COLUMN "marginPercent" DECIMAL(5,2);

-- AlterTable: Add cost calculation fields to product_variants
ALTER TABLE "product_variants" ADD COLUMN "theoreticalCost" DECIMAL(10,4),
ADD COLUMN "currentMargin" DECIMAL(5,2),
ADD COLUMN "lastCostCalc" TIMESTAMP(3),
ADD COLUMN "costStatus" TEXT DEFAULT 'pending';

-- CreateTable: Cost history tracking
CREATE TABLE "cost_history" (
    "id" SERIAL NOT NULL,
    "stockItemId" UUID NOT NULL,
    "previousCost" DECIMAL(10,4) NOT NULL,
    "newCost" DECIMAL(10,4) NOT NULL,
    "changePercent" DECIMAL(6,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cost_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Inventory counts for variance tracking
CREATE TABLE "inventory_counts" (
    "id" SERIAL NOT NULL,
    "countDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "countType" TEXT NOT NULL DEFAULT 'full',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" INTEGER,
    "notes" TEXT,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_counts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Inventory count items
CREATE TABLE "inventory_count_items" (
    "id" SERIAL NOT NULL,
    "inventoryCountId" INTEGER NOT NULL,
    "stockItemId" UUID NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitCost" DECIMAL(10,4) NOT NULL,
    "extendedValue" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    CONSTRAINT "inventory_count_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Variance reports
CREATE TABLE "variance_reports" (
    "id" SERIAL NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "theoreticalCost" DECIMAL(10,2) NOT NULL,
    "actualCost" DECIMAL(10,2) NOT NULL,
    "varianceValue" DECIMAL(10,2) NOT NULL,
    "variancePercent" DECIMAL(6,2) NOT NULL,
    "beginningCountId" INTEGER,
    "endingCountId" INTEGER,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" INTEGER,
    CONSTRAINT "variance_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Variance report items
CREATE TABLE "variance_report_items" (
    "id" SERIAL NOT NULL,
    "varianceReportId" INTEGER NOT NULL,
    "stockItemId" UUID NOT NULL,
    "theoreticalQty" DECIMAL(10,2) NOT NULL,
    "actualQty" DECIMAL(10,2) NOT NULL,
    "varianceQty" DECIMAL(10,2) NOT NULL,
    "unitCost" DECIMAL(10,4) NOT NULL,
    "varianceValue" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "variance_report_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Cost history lookups
CREATE INDEX "cost_history_stockItemId_idx" ON "cost_history"("stockItemId");

-- CreateIndex: Inventory count lookups
CREATE INDEX "inventory_count_items_inventoryCountId_idx" ON "inventory_count_items"("inventoryCountId");
CREATE INDEX "inventory_count_items_stockItemId_idx" ON "inventory_count_items"("stockItemId");

-- CreateIndex: Variance report lookups
CREATE INDEX "variance_report_items_varianceReportId_idx" ON "variance_report_items"("varianceReportId");
CREATE INDEX "variance_report_items_stockItemId_idx" ON "variance_report_items"("stockItemId");

-- AddForeignKey: Cost history relations
ALTER TABLE "cost_history" ADD CONSTRAINT "cost_history_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cost_history" ADD CONSTRAINT "cost_history_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Inventory count relations
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_counts" ADD CONSTRAINT "inventory_counts_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Inventory count items relations
ALTER TABLE "inventory_count_items" ADD CONSTRAINT "inventory_count_items_inventoryCountId_fkey" FOREIGN KEY ("inventoryCountId") REFERENCES "inventory_counts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_count_items" ADD CONSTRAINT "inventory_count_items_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: Variance report relations
ALTER TABLE "variance_reports" ADD CONSTRAINT "variance_reports_beginningCountId_fkey" FOREIGN KEY ("beginningCountId") REFERENCES "inventory_counts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "variance_reports" ADD CONSTRAINT "variance_reports_endingCountId_fkey" FOREIGN KEY ("endingCountId") REFERENCES "inventory_counts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "variance_reports" ADD CONSTRAINT "variance_reports_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "variance_reports" ADD CONSTRAINT "variance_reports_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Variance report items relations
ALTER TABLE "variance_report_items" ADD CONSTRAINT "variance_report_items_varianceReportId_fkey" FOREIGN KEY ("varianceReportId") REFERENCES "variance_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "variance_report_items" ADD CONSTRAINT "variance_report_items_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
