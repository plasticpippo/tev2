-- DropForeignKey
ALTER TABLE "product_grid_layouts" DROP CONSTRAINT "product_grid_layouts_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "product_grid_layouts" DROP CONSTRAINT "product_grid_layouts_tillId_fkey";

-- DropIndex
DROP INDEX "product_grid_layouts_categoryId_idx";

-- DropIndex
DROP INDEX "product_grid_layouts_filterType_idx";

-- DropIndex
DROP INDEX "product_grid_layouts_shared_idx";

-- DropIndex
DROP INDEX "product_grid_layouts_tillId_idx";

-- DropTable
DROP TABLE "product_grid_layouts";