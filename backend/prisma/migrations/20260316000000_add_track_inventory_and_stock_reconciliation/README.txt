# Migration: add_track_inventory_and_stock_reconciliation

## Changes

1. Added `track_inventory` column to `product_variants` table (Boolean, default: true)
2. Created `stock_reconciliation_status` enum (PENDING, RESOLVED, MANUAL)
3. Created `stock_reconciliations` table for tracking stock-sales atomic integration reconciliation

## Purpose

- `trackInventory` field allows selective inventory tracking per product variant
- StockReconciliation model tracks reconciliation status between stock and sales transactions
