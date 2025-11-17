-- CreateTable
CREATE TABLE "product_grid_layouts" (
    "id" SERIAL NOT NULL,
    "tillId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "layout" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_grid_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_grid_layouts_tillId_idx" ON "product_grid_layouts"("tillId");

-- AddForeignKey
ALTER TABLE "product_grid_layouts" ADD CONSTRAINT "product_grid_layouts_tillId_fkey" FOREIGN KEY ("tillId") REFERENCES "tills"("id") ON DELETE CASCADE ON UPDATE CASCADE;