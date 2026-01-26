-- CreateTable
CREATE TABLE "variant_layouts" (
    "id" SERIAL NOT NULL,
    "tillId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "gridColumn" INTEGER NOT NULL,
    "gridRow" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variant_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_layouts" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_layout_positions" (
    "id" SERIAL NOT NULL,
    "sharedLayoutId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "gridColumn" INTEGER NOT NULL,
    "gridRow" INTEGER NOT NULL,

    CONSTRAINT "shared_layout_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "variant_layouts_tillId_categoryId_variantId_key" ON "variant_layouts"("tillId", "categoryId", "variantId");

-- CreateIndex
CREATE INDEX "variant_layouts_tillId_categoryId_idx" ON "variant_layouts"("tillId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "shared_layout_positions_sharedLayoutId_variantId_key" ON "shared_layout_positions"("sharedLayoutId", "variantId");

-- CreateIndex
CREATE INDEX "shared_layout_positions_sharedLayoutId_idx" ON "shared_layout_positions"("sharedLayoutId");

-- AddForeignKey
ALTER TABLE "variant_layouts" ADD CONSTRAINT "variant_layouts_tillId_fkey" FOREIGN KEY ("tillId") REFERENCES "tills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_layouts" ADD CONSTRAINT "variant_layouts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_layouts" ADD CONSTRAINT "variant_layouts_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_layouts" ADD CONSTRAINT "shared_layouts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_layout_positions" ADD CONSTRAINT "shared_layout_positions_sharedLayoutId_fkey" FOREIGN KEY ("sharedLayoutId") REFERENCES "shared_layouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_layout_positions" ADD CONSTRAINT "shared_layout_positions_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;