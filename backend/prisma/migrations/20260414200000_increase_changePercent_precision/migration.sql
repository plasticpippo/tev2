-- Increase changePercent precision from (6,2) to (10,2) to support large cost changes
-- (e.g., going from 0.000123 to 15.5 = 1,259,158% which overflows numeric(6,2) max of 9,999.99)
ALTER TABLE "cost_history" ALTER COLUMN "changePercent" TYPE DECIMAL(10,2);
