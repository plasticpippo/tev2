#!/bin/bash
set -e

echo "=== Recent migrations ==="
docker exec bar_pos_backend psql -h db -U bar_pos_user -d bar_pos -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 10;"

echo -e "\n=== Specific migration check ==="
docker exec bar_pos_backend psql -h db -U bar_pos_user -d bar_pos -c "SELECT * FROM _prisma_migrations WHERE migration_name = '20260406100000_add_receipt_generation_fields';"

echo -e "\n=== Migration file check ==="
ls -la backend/prisma/migrations/ | grep "20260406100000_add_receipt_generation_fields"
