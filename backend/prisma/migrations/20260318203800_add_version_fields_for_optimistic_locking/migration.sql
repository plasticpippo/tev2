-- Add version field to transactions table for optimistic locking
ALTER TABLE "transactions" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

-- Add version field to order_sessions table for optimistic locking
ALTER TABLE "order_sessions" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;
