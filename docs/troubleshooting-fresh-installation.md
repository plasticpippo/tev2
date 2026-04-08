# Fresh Installation Troubleshooting Guide

## Problem Summary

When deploying the application on a new server, receipt-related tables and columns were missing from the database, causing the application to fail. This guide documents the root causes and resolution steps.

---

## Root Causes Identified

### 1. Missing Migration Files

**Critical Issue:** The `ReceiptGenerationQueue` model was defined in `prisma/schema.prisma` but had no corresponding migration file.

| Model/Table | Status | Migration File |
|-------------|--------|----------------|
| `ReceiptGenerationQueue` | MISSING | None existed |
| Receipt generation fields in `receipts` table | MISSING | Not in original migration |

### 2. Schema Drift

The Prisma schema had evolved with new models and fields that were either:
- Added manually to the database during development
- Added via `prisma db push` (development shortcut that bypasses migrations)
- Missing proper migration files for production deployment

### 3. Why Fresh Installations Failed

On the development server, tables existed because they were created manually or via `prisma db push`. On a fresh server running `prisma migrate deploy`, only migration files are executed - so missing migrations = missing tables.

---

## Resolution Steps

### Step 1: Identify Missing Migrations

Compare Prisma schema models with migration files:

```bash
# List all models in schema
grep -E "^model [A-Z]" backend/prisma/schema.prisma

# List all migration folders
ls -la backend/prisma/migrations/

# Compare: Each model should have a corresponding migration
```

### Step 2: Generate Missing Migrations

If models exist in schema but tables are missing from fresh installs:

```bash
cd backend

# Option A: Generate migration for schema drift
npx prisma migrate dev --name add_missing_models --create-only

# Option B: Create migration manually (if you know the exact SQL)
mkdir -p prisma/migrations/YYYYMMDDHHMMSS_add_xxx_table
# Create migration.sql file with appropriate SQL
```

### Step 3: Verify Migration Files Created

The following migrations were added to fix the receipt feature:

```
backend/prisma/migrations/
  20260406100000_add_receipt_generation_fields/
    migration.sql
  20260406100100_add_receipt_generation_queue_table/
    migration.sql
```

### Step 4: Apply Migrations

```bash
# Rebuild and restart backend
docker compose up -d --build bar_pos_backend

# Or manually apply migrations
docker exec -it bar_pos_backend npx prisma migrate deploy
```

---

## Fresh Installation Checklist

### Pre-Deployment Verification

```bash
# 1. Check all models have migrations
cd backend
npx prisma migrate status

# 2. Validate schema matches migrations
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma

# 3. Check for pending migrations
npx prisma migrate status
```

### Database Setup Commands

```bash
# Start database container first
docker compose up -d bar_pos_backend_db

# Wait for database to be ready
docker exec -it bar_pos_backend_db pg_isready -U totalevo_user -d bar_pos

# Start backend (runs migrations automatically)
docker compose up -d --build bar_pos_backend

# Check migration logs
docker logs bar_pos_backend 2>&1 | grep -i migration
```

### Post-Deployment Validation

```bash
# 1. Check all expected tables exist
docker exec -it bar_pos_backend_db psql -U totalevo_user -d bar_pos -c "\dt"

# 2. Verify receipt tables specifically
docker exec -it bar_pos_backend_db psql -U totalevo_user -d bar_pos -c "
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('receipts', 'receipt_audit_logs', 'receipt_generation_queue', 'email_queue', 'customers');
"

# 3. Check migration history
docker exec -it bar_pos_backend_db psql -U totalevo_user -d bar_pos -c "
SELECT migration_name, started_at, finished_at, logs 
FROM _prisma_migrations 
ORDER BY finished_at DESC 
LIMIT 20;
"

# 4. Verify receipt columns exist
docker exec -it bar_pos_backend_db psql -U totalevo_user -d bar_pos -c "
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'receipts' 
ORDER BY ordinal_position;
"
```

---

## Common Issues and Solutions

### Issue: "column already exists" Error

**Symptom:** Migration fails with `ERROR: column "xxx" of relation "yyy" already exists`

**Cause:** Database was modified manually or via `prisma db push`, but migration record doesn't exist.

**Solution:**
```bash
# Option A: Mark migration as applied (if columns exist)
docker exec -it bar_pos_backend_db psql -U totalevo_user -d bar_pos -c "
INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
  gen_random_uuid(),
  'manual',
  NOW(),
  '20260406100000_add_receipt_generation_fields',
  'Manually marked as applied - columns existed',
  NULL,
  NOW(),
  1
);
"

# Option B: Fresh database (WARNING: destroys data)
docker compose down -v
docker compose up -d --build
```

### Issue: Foreign Key Constraint Fails

**Symptom:** Migration fails with foreign key constraint error

**Cause:** Referenced table doesn't exist or wrong order

**Solution:**
```bash
# Check table dependencies
docker exec -it bar_pos_backend_db psql -U totalevo_user -d bar_pos -c "
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
"
```

### Issue: Migration Timeout

**Symptom:** Container exits before migrations complete

**Solution:** Check entrypoint script timeout settings:
```bash
# The docker-entrypoint.sh waits up to 120 seconds for database
# Check logs for timeout messages
docker logs bar_pos_backend 2>&1 | grep -i "timeout\|failed\|error"
```

---

## Dependency Verification

### Check Database Connection

```bash
# From backend container
docker exec -it bar_pos_backend sh -c '
echo "DATABASE_URL: $DATABASE_URL"
npx prisma db execute --stdin <<< "SELECT 1"
'
```

### Check Environment Variables

```bash
# Required environment variables for database
docker exec -it bar_pos_backend env | grep DATABASE
```

Required:
- `DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DB?options`

### Check Docker Network

```bash
# Ensure containers are on same network
docker network inspect bar_pos_default

# Backend should be able to resolve "db" hostname
docker exec -it bar_pos_backend ping -c 1 db
```

---

## Validation Commands

### Full Application Health Check

```bash
#!/bin/bash
# Run this script after fresh installation

echo "=== Checking Container Status ==="
docker ps --filter "name=bar_pos" --format "table {{.Names}}\t{{.Status}}"

echo -e "\n=== Checking Database Tables ==="
docker exec -it bar_pos_backend_db psql -U totalevo_user -d bar_pos -c "\dt" 2>/dev/null

echo -e "\n=== Checking Receipt Tables ==="
docker exec -it bar_pos_backend_db psql -U totalevo_user -d bar_pos -c "
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_name IN ('receipts', 'receipt_audit_logs', 'receipt_generation_queue', 'email_queue', 'customers');
" 2>/dev/null

echo -e "\n=== Checking Migration Status ==="
docker exec -it bar_pos_backend_db psql -U totalevo_user -d bar_pos -c "
SELECT COUNT(*) as pending FROM _prisma_migrations WHERE finished_at IS NULL;
" 2>/dev/null

echo -e "\n=== Checking Backend Health ==="
curl -s http://localhost:3001/api/health || echo "Health endpoint not responding"

echo -e "\n=== Application Status ==="
docker logs bar_pos_backend 2>&1 | tail -5
```

---

## Prevention: Best Practices

### 1. Always Use Migrations

```bash
# CORRECT: Create migration for schema changes
npx prisma migrate dev --name add_new_feature

# AVOID: This bypasses migrations
npx prisma db push  # Only for prototyping!
```

### 2. Commit Migration Files

```bash
# Always commit migration files to version control
git add backend/prisma/migrations/
git commit -m "Add receipt generation queue migration"
```

### 3. Test Fresh Installations Regularly

```bash
# Simulate fresh installation locally
docker compose down -v  # Remove volumes
docker compose up -d --build
docker logs -f bar_pos_backend
```

### 4. Pre-Deployment Checklist

- [ ] All models in schema have corresponding migrations
- [ ] `npx prisma migrate status` shows no pending migrations
- [ ] Migration files are committed to repository
- [ ] Test deployment passes on clean database
- [ ] Seed data runs successfully

---

## Files Modified

| File | Change |
|------|--------|
| `backend/prisma/migrations/20260406100000_add_receipt_generation_fields/migration.sql` | Created - Adds receipt generation tracking fields |
| `backend/prisma/migrations/20260406100100_add_receipt_generation_queue_table/migration.sql` | Created - Creates receipt_generation_queue table |

## Summary

The fresh installation failure was caused by missing migration files for receipt-related features. The Prisma schema had models that were never properly migrated, causing tables to be missing on new deployments. The fix involved creating proper migration files and ensuring all schema changes are tracked through Prisma migrations.

For future development, always use `prisma migrate dev` instead of `prisma db push` for schema changes that need to be deployed to production.
