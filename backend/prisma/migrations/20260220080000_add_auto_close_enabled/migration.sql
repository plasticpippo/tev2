-- Add autoCloseEnabled to Settings table
ALTER TABLE "settings" ADD COLUMN "autoCloseEnabled" BOOLEAN NOT NULL DEFAULT false;
