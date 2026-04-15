-- Increase cost/price precision from 4dp to 6dp for unit costs and from 2dp to 6dp for computed cost values.
-- PostgreSQL DECIMAL type changes add precision without truncation; existing data is preserved with trailing zeros.

-- StockItem: standardCost (10,4) -> (12,6), costPerUnit (10,4) -> (12,6)
ALTER TABLE "stock_items" ALTER COLUMN "standardCost" TYPE DECIMAL(12,6);
ALTER TABLE "stock_items" ALTER COLUMN "costPerUnit" TYPE DECIMAL(12,6);

-- CostHistory: previousCost (10,4) -> (12,6), newCost (10,4) -> (12,6)
ALTER TABLE "cost_history" ALTER COLUMN "previousCost" TYPE DECIMAL(12,6);
ALTER TABLE "cost_history" ALTER COLUMN "newCost" TYPE DECIMAL(12,6);

-- ProductVariant: theoreticalCost (10,4) -> (12,6)
ALTER TABLE "product_variants" ALTER COLUMN "theoreticalCost" TYPE DECIMAL(12,6);

-- TransactionItem: unitCost (10,4) -> (12,6), totalCost (10,4) -> (12,6)
ALTER TABLE "transaction_items" ALTER COLUMN "unitCost" TYPE DECIMAL(12,6);
ALTER TABLE "transaction_items" ALTER COLUMN "totalCost" TYPE DECIMAL(12,6);

-- InventoryCountItem: unitCost (10,4) -> (12,6), extendedValue (10,2) -> (14,6)
ALTER TABLE "inventory_count_items" ALTER COLUMN "unitCost" TYPE DECIMAL(12,6);
ALTER TABLE "inventory_count_items" ALTER COLUMN "extendedValue" TYPE DECIMAL(14,6);

-- VarianceReportItem: unitCost (10,4) -> (12,6), varianceValue (10,2) -> (14,6)
ALTER TABLE "variance_report_items" ALTER COLUMN "unitCost" TYPE DECIMAL(12,6);
ALTER TABLE "variance_report_items" ALTER COLUMN "varianceValue" TYPE DECIMAL(14,6);

-- VarianceReport: theoreticalCost (10,2) -> (14,6), actualCost (10,2) -> (14,6), varianceValue (10,2) -> (14,6)
ALTER TABLE "variance_reports" ALTER COLUMN "theoreticalCost" TYPE DECIMAL(14,6);
ALTER TABLE "variance_reports" ALTER COLUMN "actualCost" TYPE DECIMAL(14,6);
ALTER TABLE "variance_reports" ALTER COLUMN "varianceValue" TYPE DECIMAL(14,6);
