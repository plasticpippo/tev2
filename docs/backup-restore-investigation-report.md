# Backup/Restore Investigation Report

**Date:** February 23, 2026  
**Author:** Documentation Specialist  
**Version:** 1.0

---

## Executive Summary

This report documents the findings of an investigation into the backup/restore functionality of the TEV2 POS system. The investigation identified a schema version mismatch as the root cause of issues encountered when restoring from backup.

---

## 1. Scripts Analysis

### 1.1 Backup Script (`scripts/backup.sh`)

The backup script uses `pg_dump` to create database backups:

```bash
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$backup_file" 2>/dev/null
```

**Key observations:**
- Uses basic `pg_dump` without special options
- Creates a full database dump including all tables, data, and schema
- Supports optional gzip compression (`-c, --compress` flag)
- Stores backup in `./backups/` directory with timestamp naming
- Validates backup file after creation

**Missing options that could improve backup quality:**
- No `--clean` option to include DROP statements
- No schema-only or data-only separation
- No explicit handling of Prisma migrations table

### 1.2 Restore Script (`scripts/restore.sh`)

The restore script performs the following operations:

1. **Terminate existing connections** (line 350-360)
2. **Drop existing database** (line 367)
3. **Create fresh database** (line 377)
4. **Restore from backup** (line 390-416)

**Key observations:**
- Completely drops and recreates the database
- Supports both plain SQL and compressed (gzip) backups
- Requires confirmation before destructive operations
- Does NOT run Prisma migrations after restore

---

## 2. Backup File Contents Analysis

### 2.1 File Location
- **Path:** `backups/database_backup.sql`
- **Size:** 271,484 bytes (~265 KB)
- **Database Version:** PostgreSQL 15.15

### 2.2 Data Counts

| Table | Records | Notes |
|-------|---------|-------|
| `products` | 28 | Product catalog |
| `product_variants` | 18 | Product variants/pricing options |
| `stock_items` | 13 | 4 with type "Sellable Good" |
| `categories` | 7 | Product categories |
| `order_sessions` | 270+ | Historical order session data |
| `transactions` | Present | Transaction records |
| `_prisma_migrations` | 24+ | Migration history |

### 2.3 Product Data Verification

The backup contains the product "Birra Beck's" (verified in order session data), not "Birra Back's" - this confirms the spelling in the backup is correct.

---

## 3. Schema Mismatch Issue

### 3.1 Root Cause: Migration Version Gap

The backup file was created **BEFORE** the migration `20260220200815_add_tax_rates` was applied to the database.

**Evidence from backup file (lines 957-985):**
The `_prisma_migrations` table shows the latest applied migration is:
- `20260220000000_normalize_payment_methods` (applied 2026-02-20 22:15:00 UTC)

**Missing migrations that exist in the codebase:**
- `20260220080000_add_auto_close_enabled`
- `20260220200815_add_tax_rates`

### 3.2 Schema Differences

#### Current Schema (`backend/prisma/schema.prisma`)

**ProductVariant model (lines 57-74):**
```prisma
model ProductVariant {
  id               Int                @id @default(autoincrement())
  productId        Int
  name             String
  price            Float
  isFavourite      Boolean?           @default(false)
  backgroundColor  String
  textColor        String
  taxRateId        Int?               // <-- This column exists in current schema
  product          Product            @relation(fields: [productId], references: [id])
  taxRate          TaxRate?           @relation(fields: [taxRateId], references: [id], onDelete: SetNull)
  // ...
}
```

**TaxRate model (lines 230-246):**
```prisma
model TaxRate {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  rate        Decimal  @db.Decimal(5, 4)
  description String?
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  // ...relations
}
```

#### Backup Schema (lines 300-308)

```sql
CREATE TABLE public.product_variants (
    id integer NOT NULL,
    "productId" integer NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    "isFavourite" boolean DEFAULT false,
    "backgroundColor" text NOT NULL,
    "textColor" text NOT NULL
    -- NOTE: NO taxRateId column!
);
```

### 3.3 Missing Schema Elements in Backup

| Element | Current Schema | Backup Schema | Status |
|---------|---------------|---------------|--------|
| `product_variants.taxRateId` | Present | **Missing** | Schema gap |
| `tax_rates` table | Present | **Missing** | Schema gap |
| `settings.defaultTaxRateId` | Present | **Missing** | Schema gap |

---

## 4. Migration Handling

### 4.1 Backend Migration Deployment

The backend is configured to run Prisma migrations on startup. From [`backend/docker-entrypoint.sh`](backend/docker-entrypoint.sh):

```bash
# Run Prisma migrations
npx prisma migrate deploy
```

### 4.2 Expected Behavior After Restore

When the backend starts after a database restore:

1. Database is restored with old schema (pre-tax_rates)
2. Backend starts and runs `npx prisma migrate deploy`
3. Missing migrations should be applied automatically:
   - `20260220080000_add_auto_close_enabled`
   - `20260220200815_add_tax_rates`

### 4.3 Potential Issues

- Migration failures may occur silently
- Backend logs should be checked for migration errors
- Some migrations may fail if they depend on existing data

---

## 5. Root Cause Analysis

### 5.1 Primary Issue

The backup was created at a point in time when the database schema was at an earlier migration version. When restored, the database schema differs from the current application schema.

### 5.2 Contributing Factors

1. **No schema version control in backups**: The backup captures the entire database state at a specific moment, including the Prisma migrations table
2. **Restore does not trigger migrations**: The restore script does not run Prisma migrations after restoring
3. **Missing `--clean` option**: The backup script does not use `pg_dump --clean` which would add DROP statements

### 5.3 Why the Backup Data Is Valid

Despite the schema mismatch:
- The product data (28 products, 18 variants, 13 stock items) is intact
- Historical order data is preserved
- The backup file itself is not corrupted

---

## 6. Recommendations

### 6.1 Immediate Actions

1. **Verify migration status after restore**
   - Check backend logs for migration errors
   - Run `npx prisma migrate status` to verify migration state

2. **Manual migration if needed**
   ```bash
   docker compose exec backend npx prisma migrate deploy
   ```

### 6.2 Script Improvements

**Backup script enhancements:**
```bash
# Consider adding --clean option
pg_dump --clean -U "$POSTGRES_USER" "$POSTGRES_DB"

# Or add post-restore migration trigger
```

**Restore script enhancements:**
```bash
# Add post-restore migration execution
docker compose exec backend npx prisma migrate deploy
```

### 6.3 Best Practices

1. **Create fresh backup after schema changes**: Always create a new backup after running migrations
2. **Document backup timestamp**: Note which version/codebase was used when creating backups
3. **Test restore process**: Regularly test the restore process in a development environment
4. **Version control migrations**: Ensure migrations are committed to version control before running them in production

### 6.4 Alternative Approaches

1. **Use Prisma's `db push` instead of restore**
   - Less destructive, works with existing data
   - May not handle all migration scenarios

2. **Create schema-only backup first**
   - Backup schema and data separately
   - Restore schema, then data, then run migrations

---

## 7. Conclusion

The backup file itself is valid and contains complete product data. The issue encountered is due to a **schema version mismatch** between the backup creation time and the current database schema. The missing `taxRateId` column and `tax_rates` table were added by migrations that ran after the backup was created.

When restoring from this backup:
1. The database will be restored with the old schema
2. Prisma migrations should automatically apply the missing schema changes on backend startup
3. Product data should remain intact after migrations run

**Recommended next step:** Test the restore process in a development environment and verify that migrations apply successfully.

---

## Appendix A: Backup Script Reference

**Location:** `scripts/backup.sh`  
**Key command (line 233):**
```bash
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$backup_file" 2>/dev/null
```

## Appendix B: Restore Script Reference

**Location:** `scripts/restore.sh`  
**Key operations:**
- Line 350-360: Terminate connections
- Line 363-387: Drop and recreate database  
- Line 389-416: Restore from backup

## Appendix C: Migration Timeline

| Date | Migration | Description |
|------|-----------|--------------|
| 2026-02-20 | `20260220000000_normalize_payment_methods` | Last migration in backup |
| 2026-02-20 | `20260220080000_add_auto_close_enabled` | Missing from backup |
| 2026-02-20 | `20260220200815_add_tax_rates` | Adds tax_rates table and taxRateId column |

---

*Report generated as part of TEV2 POS system investigation*
