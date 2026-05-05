-- AlterTable: Add email_smtp_reject_unauthorized to settings
ALTER TABLE "settings" ADD COLUMN "email_smtp_reject_unauthorized" BOOLEAN NOT NULL DEFAULT true;
