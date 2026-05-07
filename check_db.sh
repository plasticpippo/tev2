#!/bin/bash

echo "=== Checking _prisma_migrations table ==="
docker exec bar_pos_backend psql -h db -U totalevo_user -d bar_pos -c "SELECT migration_name, started_at, finished_at, applied_steps_count FROM _prisma_migrations ORDER BY started_at DESC LIMIT 10;"

echo -e "\n=== Checking receipts table columns ==="
docker exec bar_pos_backend psql -h db -U totalevo_user -d bar_pos -c "\\d receipts" | grep -E "(issued_from_payment_modal|generation_status|generation_attempts|last_generation_attempt|generation_error)"

echo -e "\n=== Checking users table columns ==="
docker exec bar_pos_backend psql -h db -U totalevo_user -d bar_pos -c "\\d users" | grep "receiptFromPaymentDefault"

echo -e "\n=== Checking receipts_generation_status_idx index ==="
docker exec bar_pos_backend psql -h db -U totalevo_user -d bar_pos -c "\\d receipts" | grep "receipts_generation_status_idx"
