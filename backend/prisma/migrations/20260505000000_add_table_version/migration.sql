-- AlterTable: Add version column to tables
ALTER TABLE "tables" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
