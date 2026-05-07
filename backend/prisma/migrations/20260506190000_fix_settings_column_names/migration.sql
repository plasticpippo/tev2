-- Fix Settings business column names: rename from camelCase to snake_case
-- These columns were already created with snake_case names in migration 20260331190255,
-- so these renames are conditional to handle both cases (already correct or still camelCase).

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'businessName') THEN
        ALTER TABLE "settings" RENAME COLUMN "businessName" TO "business_name";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'businessAddress') THEN
        ALTER TABLE "settings" RENAME COLUMN "businessAddress" TO "business_address";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'businessCity') THEN
        ALTER TABLE "settings" RENAME COLUMN "businessCity" TO "business_city";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'businessCountry') THEN
        ALTER TABLE "settings" RENAME COLUMN "businessCountry" TO "business_country";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'businessPhone') THEN
        ALTER TABLE "settings" RENAME COLUMN "businessPhone" TO "business_phone";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'businessEmail') THEN
        ALTER TABLE "settings" RENAME COLUMN "businessEmail" TO "business_email";
    END IF;
END
$$;
