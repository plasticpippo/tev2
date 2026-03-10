-- Migration: add_active_purchasing_unit_id

-- Add active_purchasing_unit_id column to stock_items
ALTER TABLE stock_items 
ADD COLUMN active_purchasing_unit_id VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX idx_stock_items_active_unit ON stock_items(active_purchasing_unit_id);
