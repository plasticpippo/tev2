-- Add businessDayEndHour to Settings table
ALTER TABLE "settings" ADD COLUMN "businessDayEndHour" TEXT NOT NULL DEFAULT '06:00';

-- Set default value for existing records (if any exist)
UPDATE "settings" SET "businessDayEndHour" = '06:00' WHERE "businessDayEndHour" IS NULL;
