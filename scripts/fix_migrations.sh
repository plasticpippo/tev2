#!/bin/bash
set -e

echo "=== Step 1: Backing up current _prisma_migrations table ==="
docker exec bar_pos_backend psql -h db -U totalevo_user -d bar_pos -c "COPY _prisma_migrations TO STDOUT WITH CSV HEADER;" > /tmp/migrations_backup.csv
echo "Backup saved to /tmp/migrations_backup.csv"

echo ""
echo "=== Step 2: Clearing _prisma_migrations table ==="
docker exec bar_pos_backend psql -h db -U totalevo_user -d bar_pos -c "TRUNCATE TABLE _prisma_migrations CASCADE;"
echo "Table cleared"

echo ""
echo "=== Step 3: Listing all migrations ==="
ls -d backend/prisma/migrations/*/ | awk -F'/' '{print $NF}' | sort > /tmp/migration_list.txt
cat /tmp/migration_list.txt
echo "Total migrations: $(wc -l < /tmp/migration_list.txt)"

echo ""
echo "=== Step 4: Marking all migrations as applied ==="
while IFS= read -r migration_name; do
  echo "Resolving migration: $migration_name"
  docker exec bar_pos_backend npx prisma migrate resolve --applied "$migration_name"
done < /tmp/migration_list.txt

echo ""
echo "=== Step 5: Verifying with prisma migrate deploy ==="
docker exec bar_pos_backend npx prisma migrate deploy

echo ""
echo "=== Migration fix complete ==="
