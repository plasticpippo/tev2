-- AlterTable: Add missing receipt settings fields
ALTER TABLE "settings" ADD COLUMN "allow_receipt_from_payment_modal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "settings" ADD COLUMN "receipt_issue_default_selected" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "settings" ADD COLUMN "receipt_issue_mode" TEXT NOT NULL DEFAULT 'immediate';
