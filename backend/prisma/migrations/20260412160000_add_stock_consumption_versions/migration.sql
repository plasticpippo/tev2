-- CreateTable
CREATE TABLE "stock_consumption_versions" (
    "id" SERIAL NOT NULL,
    "variantId" INTEGER NOT NULL,
    "variantName" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "stockItemId" UUID NOT NULL,
    "stockItemName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "replacedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeReason" TEXT,
    "changedBy" INTEGER,

    CONSTRAINT "stock_consumption_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_consumption_versions_variantId_idx" ON "stock_consumption_versions"("variantId");
CREATE INDEX "stock_consumption_versions_productId_idx" ON "stock_consumption_versions"("productId");
CREATE INDEX "stock_consumption_versions_replacedAt_idx" ON "stock_consumption_versions"("replacedAt");
