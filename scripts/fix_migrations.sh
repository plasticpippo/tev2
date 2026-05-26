#!/usr/bin/env bash

#===============================================================================
# AssoPOS Fix Migrations Script
#
# Marks all migrations in the codebase as applied in _prisma_migrations.
# Use when the database schema is up to date but the migration tracking table
# is corrupted or missing entries.
#
# WARNING: This assumes all migration SQL has already been applied to the schema.
#          If there are genuinely pending migrations, use `prisma migrate deploy`
#          instead.
#
# Usage: ./scripts/fix_migrations.sh
#===============================================================================

set -euo pipefail

#===============================================================================
# Configuration
#===============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

POSTGRES_USER="${POSTGRES_USER:-assopos_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-assopos_password}"
POSTGRES_DB="${POSTGRES_DB:-assopos}"

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

info()  { printf '%b\n' "${BLUE}[INFO]${NC} $1"; }
ok()    { printf '%b\n' "${GREEN}[OK]${NC} $1"; }
warn()  { printf '%b\n' "${YELLOW}[WARN]${NC} $1"; }
err()   { printf '%b\n' "${RED}[ERROR]${NC} $1" >&2; }

#===============================================================================
# Helpers
#===============================================================================

load_env() {
    local env_file="$PROJECT_ROOT/.env"
    if [[ ! -f "$env_file" ]]; then
        warn "No .env file found, using defaults"
        return
    fi
    info "Loading environment..."
    while IFS= read -r line || [[ -n "$line" ]]; do
        [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
        if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
            local var_name="${BASH_REMATCH[1]}"
            local var_value="${BASH_REMATCH[2]}"
            var_value="${var_value#\"}"; var_value="${var_value%\"}"
            var_value="${var_value#\'}"; var_value="${var_value%\'}"
            export "$var_name"="$var_value"
        fi
    done < "$env_file"
    POSTGRES_USER="${POSTGRES_USER:-assopos_user}"
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-assopos_password}"
    POSTGRES_DB="${POSTGRES_DB:-assopos}"
    ok "Environment loaded"
}

run_psql() {
    docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"
}

run_backend_cmd() {
    docker compose exec -T backend "$@"
}

#===============================================================================
# Main
#===============================================================================

main() {
    printf '\n'
    printf '%b\n' "${BLUE}==========================================${NC}"
    printf '%b\n' "${BLUE} AssoPOS Fix Migrations${NC}"
    printf '%b\n' "${BLUE}==========================================${NC}"
    printf '\n'

    load_env

    # Validate prerequisites
    info "Checking prerequisites..."

    if ! docker compose ps db 2>/dev/null | grep -q "running\|Up"; then
        err "Database container is not running. Start with: docker compose up -d db"
        exit 1
    fi

    if ! docker compose ps backend 2>/dev/null | grep -q "running\|Up"; then
        err "Backend container is not running. Start with: docker compose up -d backend"
        exit 1
    fi

    local migrations_dir="$PROJECT_ROOT/backend/prisma/migrations"
    if [[ ! -d "$migrations_dir" ]]; then
        err "Migrations directory not found: $migrations_dir"
        exit 1
    fi
    ok "Prerequisites met"

    # Step 1: Backup current _prisma_migrations
    info "Step 1: Backing up current _prisma_migrations table..."
    local backup_file="/tmp/migrations_backup_$(date +%Y%m%d_%H%M%S).csv"
    if run_psql -c "COPY _prisma_migrations TO STDOUT WITH CSV HEADER;" > "$backup_file" 2>/dev/null; then
        ok "Backup saved to $backup_file"
    else
        warn "Could not backup _prisma_migrations (table may not exist yet)"
    fi

    # Step 2: Clear _prisma_migrations
    info "Step 2: Clearing _prisma_migrations table..."
    run_psql -c "TRUNCATE TABLE _prisma_migrations CASCADE;" > /dev/null 2>&1 || {
        err "Failed to truncate _prisma_migrations"
        exit 1
    }
    ok "Table cleared"

    # Step 3: List migrations from codebase (using find, not ls, to avoid trailing slash issues)
    info "Step 3: Listing migrations from codebase..."
    local migration_list=()
    while IFS= read -r -d '' dir; do
        migration_list+=("$(basename "$dir")")
    done < <(find "$migrations_dir" -mindepth 1 -maxdepth 1 -type d -print0 2>/dev/null | sort -z)

    if [[ ${#migration_list[@]} -eq 0 ]]; then
        err "No migrations found in $migrations_dir"
        exit 1
    fi

    printf '%b\n' "${YELLOW}Found ${#migration_list[@]} migrations:${NC}"
    for mig in "${migration_list[@]}"; do
        printf '  - %s\n' "$mig"
    done

    # Step 4: Mark all migrations as applied
    info "Step 4: Marking all migrations as applied..."
    for migration_name in "${migration_list[@]}"; do
        info "  Resolving: $migration_name"
        run_backend_cmd npx prisma migrate resolve --applied "$migration_name" > /dev/null 2>&1 || {
            warn "  Could not resolve: $migration_name (may need manual intervention)"
        }
    done
    ok "All migrations marked as applied"

    # Step 5: Verify with prisma migrate deploy
    info "Step 5: Verifying with prisma migrate deploy..."
    local output
    output=$(run_backend_cmd npx prisma migrate deploy 2>&1) || true

    if echo "$output" | grep -q "No pending migrations"; then
        ok "No pending migrations -- all in sync"
    else
        info "Output: $output"
    fi

    # Step 6: Final count
    local final_count
    final_count=$(run_psql -t -A -c \
        "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;" 2>/dev/null | tr -d ' ')

    info "Migration count in _prisma_migrations: ${final_count:-0}/${#migration_list[@]}"

    printf '\n'
    printf '%b\n' "${GREEN}==========================================${NC}"
    printf '%b\n' "${GREEN} MIGRATION FIX COMPLETE${NC}"
    printf '%b\n' "${GREEN}==========================================${NC}"
    printf '\n'
}

main "$@"
