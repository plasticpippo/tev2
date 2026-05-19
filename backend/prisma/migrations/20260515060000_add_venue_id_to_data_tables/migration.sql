-- Add venueId column to all data tables (nullable first for migration)
-- Then backfill with default venue id=1
-- Then add NOT NULL constraint and foreign key

-- Phase 1: Add nullable columns
ALTER TABLE products ADD COLUMN "venueId" INTEGER;
ALTER TABLE stock_consumptions ADD COLUMN "venueId" INTEGER;
ALTER TABLE stock_consumption_versions ADD COLUMN "venueId" INTEGER;
ALTER TABLE categories ADD COLUMN "venueId" INTEGER;
ALTER TABLE transactions ADD COLUMN "venueId" INTEGER;
ALTER TABLE rooms ADD COLUMN "venueId" INTEGER;
ALTER TABLE tables ADD COLUMN "venueId" INTEGER;
ALTER TABLE tabs ADD COLUMN "venueId" INTEGER;
ALTER TABLE tills ADD COLUMN "venueId" INTEGER;
ALTER TABLE stock_items ADD COLUMN "venueId" INTEGER;
ALTER TABLE stock_adjustments ADD COLUMN "venueId" INTEGER;
ALTER TABLE order_activity_logs ADD COLUMN "venueId" INTEGER;
ALTER TABLE settings ADD COLUMN "venueId" INTEGER;
ALTER TABLE tax_rates ADD COLUMN "venueId" INTEGER;
ALTER TABLE daily_closings ADD COLUMN "venueId" INTEGER;
ALTER TABLE order_sessions ADD COLUMN "venueId" INTEGER;
ALTER TABLE variant_layouts ADD COLUMN "venueId" INTEGER;
ALTER TABLE shared_layouts ADD COLUMN "venueId" INTEGER;
ALTER TABLE shared_layout_positions ADD COLUMN "venueId" INTEGER;
ALTER TABLE customers ADD COLUMN "venueId" INTEGER;
ALTER TABLE receipts ADD COLUMN "venueId" INTEGER;
ALTER TABLE email_queue ADD COLUMN "venueId" INTEGER;
ALTER TABLE receipt_audit_logs ADD COLUMN "venueId" INTEGER;
ALTER TABLE receipt_generation_queue ADD COLUMN "venueId" INTEGER;
ALTER TABLE cost_history ADD COLUMN "venueId" INTEGER;
ALTER TABLE inventory_counts ADD COLUMN "venueId" INTEGER;
ALTER TABLE inventory_count_items ADD COLUMN "venueId" INTEGER;
ALTER TABLE variance_reports ADD COLUMN "venueId" INTEGER;
ALTER TABLE variance_report_items ADD COLUMN "venueId" INTEGER;
ALTER TABLE transaction_audit_logs ADD COLUMN "venueId" INTEGER;

INSERT INTO venues (id, name, "isActive", "createdAt", "updatedAt")
VALUES (1, 'Default Venue', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Phase 2: Backfill existing rows with default venue id=1
UPDATE products SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE stock_consumptions SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE stock_consumption_versions SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE categories SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE transactions SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE rooms SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE tables SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE tabs SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE tills SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE stock_items SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE stock_adjustments SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE order_activity_logs SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE settings SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE tax_rates SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE daily_closings SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE order_sessions SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE variant_layouts SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE shared_layouts SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE shared_layout_positions SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE customers SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE receipts SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE email_queue SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE receipt_audit_logs SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE receipt_generation_queue SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE cost_history SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE inventory_counts SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE inventory_count_items SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE variance_reports SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE variance_report_items SET "venueId" = 1 WHERE "venueId" IS NULL;
UPDATE transaction_audit_logs SET "venueId" = 1 WHERE "venueId" IS NULL;

-- Phase 3: Set NOT NULL and add foreign keys + indexes
ALTER TABLE products ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE products ADD CONSTRAINT "products_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "products_venueId_idx" ON products("venueId");

ALTER TABLE stock_consumptions ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE stock_consumptions ADD CONSTRAINT "stock_consumptions_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "stock_consumptions_venueId_idx" ON stock_consumptions("venueId");

ALTER TABLE stock_consumption_versions ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE stock_consumption_versions ADD CONSTRAINT "stock_consumption_versions_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "stock_consumption_versions_venueId_idx" ON stock_consumption_versions("venueId");

ALTER TABLE categories ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE categories ADD CONSTRAINT "categories_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "categories_venueId_idx" ON categories("venueId");

ALTER TABLE transactions ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE transactions ADD CONSTRAINT "transactions_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "transactions_venueId_idx" ON transactions("venueId");

ALTER TABLE rooms ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE rooms ADD CONSTRAINT "rooms_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "rooms_venueId_idx" ON rooms("venueId");

ALTER TABLE tables ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE tables ADD CONSTRAINT "tables_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "tables_venueId_idx" ON tables("venueId");

ALTER TABLE tabs ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE tabs ADD CONSTRAINT "tabs_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "tabs_venueId_idx" ON tabs("venueId");

ALTER TABLE tills ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE tills ADD CONSTRAINT "tills_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "tills_venueId_idx" ON tills("venueId");

ALTER TABLE stock_items ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE stock_items ADD CONSTRAINT "stock_items_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "stock_items_venueId_idx" ON stock_items("venueId");

ALTER TABLE stock_adjustments ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE stock_adjustments ADD CONSTRAINT "stock_adjustments_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "stock_adjustments_venueId_idx" ON stock_adjustments("venueId");

ALTER TABLE order_activity_logs ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE order_activity_logs ADD CONSTRAINT "order_activity_logs_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "order_activity_logs_venueId_idx" ON order_activity_logs("venueId");

ALTER TABLE settings ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE settings ADD CONSTRAINT "settings_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "settings_venueId_idx" ON settings("venueId");

ALTER TABLE tax_rates ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE tax_rates ADD CONSTRAINT "tax_rates_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "tax_rates_venueId_idx" ON tax_rates("venueId");

ALTER TABLE daily_closings ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE daily_closings ADD CONSTRAINT "daily_closings_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "daily_closings_venueId_idx" ON daily_closings("venueId");

ALTER TABLE order_sessions ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE order_sessions ADD CONSTRAINT "order_sessions_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "order_sessions_venueId_idx" ON order_sessions("venueId");

ALTER TABLE variant_layouts ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE variant_layouts ADD CONSTRAINT "variant_layouts_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "variant_layouts_venueId_idx" ON variant_layouts("venueId");

ALTER TABLE shared_layouts ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE shared_layouts ADD CONSTRAINT "shared_layouts_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "shared_layouts_venueId_idx" ON shared_layouts("venueId");

ALTER TABLE shared_layout_positions ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE shared_layout_positions ADD CONSTRAINT "shared_layout_positions_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "shared_layout_positions_venueId_idx" ON shared_layout_positions("venueId");

ALTER TABLE customers ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE customers ADD CONSTRAINT "customers_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "customers_venueId_idx" ON customers("venueId");

ALTER TABLE receipts ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE receipts ADD CONSTRAINT "receipts_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "receipts_venueId_idx" ON receipts("venueId");

ALTER TABLE email_queue ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE email_queue ADD CONSTRAINT "email_queue_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "email_queue_venueId_idx" ON email_queue("venueId");

ALTER TABLE receipt_audit_logs ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE receipt_audit_logs ADD CONSTRAINT "receipt_audit_logs_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "receipt_audit_logs_venueId_idx" ON receipt_audit_logs("venueId");

ALTER TABLE receipt_generation_queue ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE receipt_generation_queue ADD CONSTRAINT "receipt_generation_queue_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "receipt_generation_queue_venueId_idx" ON receipt_generation_queue("venueId");

ALTER TABLE cost_history ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE cost_history ADD CONSTRAINT "cost_history_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "cost_history_venueId_idx" ON cost_history("venueId");

ALTER TABLE inventory_counts ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE inventory_counts ADD CONSTRAINT "inventory_counts_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "inventory_counts_venueId_idx" ON inventory_counts("venueId");

ALTER TABLE inventory_count_items ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE inventory_count_items ADD CONSTRAINT "inventory_count_items_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "inventory_count_items_venueId_idx" ON inventory_count_items("venueId");

ALTER TABLE variance_reports ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE variance_reports ADD CONSTRAINT "variance_reports_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "variance_reports_venueId_idx" ON variance_reports("venueId");

ALTER TABLE variance_report_items ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE variance_report_items ADD CONSTRAINT "variance_report_items_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "variance_report_items_venueId_idx" ON variance_report_items("venueId");

ALTER TABLE transaction_audit_logs ALTER COLUMN "venueId" SET NOT NULL;
ALTER TABLE transaction_audit_logs ADD CONSTRAINT "transaction_audit_logs_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES venues(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "transaction_audit_logs_venueId_idx" ON transaction_audit_logs("venueId");

-- Set default values for future inserts
ALTER TABLE products ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE stock_consumptions ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE stock_consumption_versions ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE categories ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE transactions ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE rooms ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE tables ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE tabs ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE tills ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE stock_items ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE stock_adjustments ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE order_activity_logs ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE settings ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE tax_rates ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE daily_closings ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE order_sessions ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE variant_layouts ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE shared_layouts ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE shared_layout_positions ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE customers ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE receipts ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE email_queue ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE receipt_audit_logs ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE receipt_generation_queue ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE cost_history ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE inventory_counts ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE inventory_count_items ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE variance_reports ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE variance_report_items ALTER COLUMN "venueId" SET DEFAULT 1;
ALTER TABLE transaction_audit_logs ALTER COLUMN "venueId" SET DEFAULT 1;

-- Change resourceId column to TEXT to support both UUID and integer resource IDs
ALTER TABLE resource_ownership ALTER COLUMN "resourceId" TYPE TEXT USING "resourceId"::text;

-- Migrate ownerId from tables/layouts to ResourceOwnership table
INSERT INTO resource_ownership ("resourceType", "resourceId", "userId", "venueId", "createdAt")
SELECT 'table', t.id::text, t.owner_id, t."venueId", NOW()
FROM tables t
WHERE t.owner_id IS NOT NULL
ON CONFLICT ("resourceType", "resourceId") DO NOTHING;

INSERT INTO resource_ownership ("resourceType", "resourceId", "userId", "venueId", "createdAt")
SELECT 'variant_layout', vl.id::text, vl.owner_id, vl."venueId", NOW()
FROM variant_layouts vl
WHERE vl.owner_id IS NOT NULL
ON CONFLICT ("resourceType", "resourceId") DO NOTHING;

INSERT INTO resource_ownership ("resourceType", "resourceId", "userId", "venueId", "createdAt")
SELECT 'shared_layout', sl.id::text, sl.owner_id, sl."venueId", NOW()
FROM shared_layouts sl
WHERE sl.owner_id IS NOT NULL
ON CONFLICT ("resourceType", "resourceId") DO NOTHING;
