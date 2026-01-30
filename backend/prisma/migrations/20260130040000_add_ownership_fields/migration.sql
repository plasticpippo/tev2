-- AlterTable for tables
ALTER TABLE "tables" ADD COLUMN "owner_id" INTEGER;

-- AlterTable for variant_layouts
ALTER TABLE "variant_layouts" ADD COLUMN "owner_id" INTEGER;

-- AlterTable for shared_layouts
ALTER TABLE "shared_layouts" ADD COLUMN "owner_id" INTEGER;

-- AddForeignKey for tables
ALTER TABLE "tables" ADD CONSTRAINT "tables_owner_id_fkey" 
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey for variant_layouts
ALTER TABLE "variant_layouts" ADD CONSTRAINT "variant_layouts_owner_id_fkey" 
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey for shared_layouts
ALTER TABLE "shared_layouts" ADD CONSTRAINT "shared_layouts_owner_id_fkey" 
  FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex for tables
CREATE INDEX "tables_owner_id_idx" ON "tables"("owner_id");

-- CreateIndex for variant_layouts
CREATE INDEX "variant_layouts_owner_id_idx" ON "variant_layouts"("owner_id");

-- CreateIndex for shared_layouts
CREATE INDEX "shared_layouts_owner_id_idx" ON "shared_layouts"("owner_id");
