-- CreateEnum
-- CreateEnum

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "vat_number" TEXT,
    "address" TEXT,
    "city" TEXT,
    "postal_code" TEXT,
    "country" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_by" INTEGER NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_unique_active" ON "customers"("email") WHERE "email" IS NOT NULL AND "deleted_at" IS NULL;

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_vat_number_idx" ON "customers"("vat_number");

-- CreateIndex
CREATE INDEX "customers_is_active_idx" ON "customers"("is_active");

-- CreateIndex
CREATE INDEX "customers_created_at_idx" ON "customers"("created_at");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- Comments
COMMENT ON TABLE "customers" IS 'Customer records for receipt generation';
COMMENT ON COLUMN "customers"."vat_number" IS 'Customer VAT/Tax identification number';
COMMENT ON COLUMN "customers"."deleted_at" IS 'Soft delete timestamp (GDPR compliance)';
