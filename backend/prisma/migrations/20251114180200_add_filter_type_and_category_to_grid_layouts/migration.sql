-- AlterTable
ALTER TABLE "product_grid_layouts" ADD COLUMN     "filterType" TEXT DEFAULT 'all',
ADD COLUMN     "categoryId" INTEGER;

-- CreateIndex
CREATE INDEX "product_grid_layouts_filterType_idx" ON "product_grid_layouts"("filterType");

-- CreateIndex
CREATE INDEX "product_grid_layouts_categoryId_idx" ON "product_grid_layouts"("categoryId");

-- AddForeignKey
ALTER TABLE "product_grid_layouts" ADD CONSTRAINT "product_grid_layouts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;