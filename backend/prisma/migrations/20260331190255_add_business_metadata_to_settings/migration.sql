-- AlterTable
ALTER TABLE "settings" ADD COLUMN "business_name" TEXT;
ALTER TABLE "settings" ADD COLUMN "business_address" TEXT;
ALTER TABLE "settings" ADD COLUMN "business_city" TEXT;
ALTER TABLE "settings" ADD COLUMN "business_postal_code" TEXT;
ALTER TABLE "settings" ADD COLUMN "business_country" TEXT;
ALTER TABLE "settings" ADD COLUMN "business_phone" TEXT;
ALTER TABLE "settings" ADD COLUMN "business_email" TEXT;
ALTER TABLE "settings" ADD COLUMN "vat_number" TEXT;

ALTER TABLE "settings" ADD COLUMN "receipt_prefix" TEXT NOT NULL DEFAULT 'R';
ALTER TABLE "settings" ADD COLUMN "receipt_number_length" INTEGER NOT NULL DEFAULT 6;
ALTER TABLE "settings" ADD COLUMN "receipt_start_number" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "settings" ADD COLUMN "receipt_sequence_year" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "settings" ADD COLUMN "receipt_current_year" INTEGER;
ALTER TABLE "settings" ADD COLUMN "receipt_current_number" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "settings" ADD COLUMN "email_smtp_host" TEXT;
ALTER TABLE "settings" ADD COLUMN "email_smtp_port" INTEGER NOT NULL DEFAULT 587;
ALTER TABLE "settings" ADD COLUMN "email_smtp_user" TEXT;
ALTER TABLE "settings" ADD COLUMN "email_smtp_password" TEXT;
ALTER TABLE "settings" ADD COLUMN "email_from_address" TEXT;
ALTER TABLE "settings" ADD COLUMN "email_from_name" TEXT;
ALTER TABLE "settings" ADD COLUMN "email_smtp_secure" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "settings" ADD COLUMN "email_enabled" BOOLEAN NOT NULL DEFAULT false;
