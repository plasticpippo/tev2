-- AlterTable: Add version column to tabs
ALTER TABLE "tabs" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex: Add unique constraint on tab names
CREATE UNIQUE INDEX "tabs_name_key" ON "tabs"("name");
