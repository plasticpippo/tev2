-- Migration: Add index on transactions.createdAt for date range queries
-- Description: Improve performance for analytics queries that filter by date range
-- Date: 2026-03-09

-- Create index on createdAt for transactions table
CREATE INDEX IF NOT EXISTS "transactions_created_at_idx" ON "transactions"("createdAt");

-- Also add index on status + createdAt composite for the analytics query pattern
CREATE INDEX IF NOT EXISTS "transactions_status_created_at_idx" ON "transactions"("status", "createdAt");
