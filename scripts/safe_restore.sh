#!/usr/bin/env bash

#===============================================================================
# TEV2 Universal Database Restore Script
#
# Works with any backup from any version of the app. Automatically handles:
#   - Non-standard \restrict/\unrestrict commands in backup files
#   - Orphaned migration entries (in backup but not in current codebase)
#   - Pre-applied migrations (schema changes already in backup)
#   - Failed migration entries from previous attempts
#   - Pending migrations that still need to run
#
# Usage: ./scripts/safe_restore.sh [BACKUP_FILE]
#===============================================================================

set -euo pipefail

#===============================================================================
# Configuration
#===============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

POSTGRES_USER="${POSTGRES_USER:-totalevo_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-totalevo_password}"
POSTGRES_DB="${POSTGRES_DB:-bar_pos}"

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
    POSTGRES_USER="${POSTGRES_USER:-totalevo_user}"
    POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-totalevo_password}"
    POSTGRES_DB="${POSTGRES_DB:-bar_pos}"
    ok "Environment loaded"
}

run_psql() {
    docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"
}

run_psql_postgres() {
    docker compose exec -T db psql -U "$POSTGRES_USER" -d postgres "$@"
}

# Run a one-off command inside the backend image without triggering entrypoint
run_backend_cmd() {
    docker compose run --rm -T --entrypoint "/bin/sh" backend -c "$1" 2>&1
}

#===============================================================================
# Step 1: Validate prerequisites
#===============================================================================

validate() {
    info "Validating prerequisites..."

    if [[ ! -f "$BACKUP_FILE" ]]; then
        err "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    local size
    size=$(wc -c < "$BACKUP_FILE")
    if [[ "$size" -eq 0 ]]; then
        err "Backup file is empty"
        exit 1
    fi
    ok "Backup file ($size bytes)"

    if ! docker compose ps db 2>/dev/null | grep -q "running\|Up"; then
        err "Database container is not running. Start with: docker compose up -d db"
        exit 1
    fi

    local attempt=0
    while [[ $attempt -lt 10 ]]; do
        docker compose exec -T db pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1 && break
        attempt=$((attempt + 1))
        sleep 1
    done
    if [[ $attempt -ge 10 ]]; then
        err "Database not ready"
        exit 1
    fi
    ok "Database is ready"
}

#===============================================================================
# Step 2: Stop backend
#===============================================================================

stop_backend() {
    info "Stopping backend..."
    docker compose stop backend 2>/dev/null || true
    docker compose rm -f backend 2>/dev/null || true
    ok "Backend stopped"
}

#===============================================================================
# Step 3: Strip non-standard psql commands and restore
#===============================================================================

restore_backup() {
    local clean="$PROJECT_ROOT/backups/_restore_clean.sql"

    info "Stripping non-standard psql commands from backup..."
    sed '/^\\restrict /d; /^\\unrestrict /d' "$BACKUP_FILE" > "$clean"

    info "Terminating active connections..."
    run_psql_postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" \
        > /dev/null 2>&1 || true

    info "Dropping database..."
    run_psql_postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" > /dev/null 2>&1
    ok "Database dropped"

    info "Creating fresh database..."
    run_psql_postgres -c "CREATE DATABASE $POSTGRES_DB;" > /dev/null 2>&1
    ok "Database created"

    info "Restoring backup..."
    local restore_log
    restore_log=$(cat "$clean" | docker compose exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB" 2>&1) || true

    local error_count
    error_count=$(echo "$restore_log" | grep -ci "error" 2>/dev/null || echo "0")
    if [[ "$error_count" -gt 0 ]]; then
        warn "Restore completed with $error_count notice(s). Showing first 10:"
        echo "$restore_log" | grep -i "error" | head -10
        warn "Continuing -- some notices are harmless"
    else
        ok "Backup restored"
    fi

    rm -f "$clean"
}

#===============================================================================
# Step 4: Clean up _prisma_migrations
#===============================================================================

clean_migrations_table() {
    info "Cleaning up _prisma_migrations..."

    # 4a. Remove orphaned entries: migrations in DB that don't exist in codebase
    local db_migrations
    db_migrations=$(run_psql -t -A -c \
        "SELECT migration_name FROM _prisma_migrations ORDER BY migration_name;" 2>/dev/null || echo "")

    local orphan_count=0
    while IFS= read -r mig; do
        [[ -z "$mig" ]] && continue
        if [[ ! -d "$PROJECT_ROOT/backend/prisma/migrations/$mig" ]]; then
            info "  Removing orphan: $mig"
            run_psql -c "DELETE FROM _prisma_migrations WHERE migration_name = '$mig';" > /dev/null 2>&1
            orphan_count=$((orphan_count + 1))
        fi
    done <<< "$db_migrations"

    if [[ $orphan_count -gt 0 ]]; then
        ok "Removed $orphan_count orphaned migration(s)"
    else
        ok "No orphaned migrations"
    fi

    # 4b. Remove failed entries (finished_at IS NULL) -- they'll be retried
    local failed_count
    failed_count=$(run_psql -t -A -c \
        "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NULL;" 2>/dev/null | tr -d ' ')

    if [[ "$failed_count" -gt 0 ]]; then
        info "  Removing $failed_count failed/unfinished migration entry/entries"
        run_psql -c "DELETE FROM _prisma_migrations WHERE finished_at IS NULL;" > /dev/null 2>&1
        ok "Failed entries cleared"
    fi

    # 4c. Summary
    local remaining
    remaining=$(run_psql -t -A -c \
        "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;" 2>/dev/null | tr -d ' ')
    info "  $remaining valid migration(s) already recorded"
}

#===============================================================================
# Step 5: Apply pending migrations with auto-retry for pre-applied ones
#===============================================================================

# PostgreSQL error codes that indicate "object already exists" -- safe to skip
# 42701 = duplicate_column, 42P07 = duplicate_table, 42710 = duplicate_object
# 42P04 = duplicate_database, 42723 = duplicate_function
is_already_exists_error() {
    echo "$1" | grep -qE "already exists|42701|42P07|42710|42P04|42723"
}

apply_migrations() {
    info "Applying pending migrations..."
    info "(Will auto-detect and skip migrations whose changes are already in the schema)"

    local max_iterations=60  # safety limit
    local iteration=0
    local skipped=0

    while [[ $iteration -lt $max_iterations ]]; do
        iteration=$((iteration + 1))

        # Run prisma migrate deploy via a temporary container
        local output
        output=$(run_backend_cmd "npx prisma migrate deploy 2>&1") || true

        # Check for success
        if echo "$output" | grep -q "No pending migrations to apply"; then
            ok "All migrations applied"
            if [[ $skipped -gt 0 ]]; then
                info "  ($skipped migration(s) were already applied in the backup schema)"
            fi
            return 0
        fi

        # Check if deploy completed successfully (applied some migrations and finished)
        if echo "$output" | grep -q "migrations.*applied" && ! echo "$output" | grep -q "Error"; then
            ok "All migrations applied"
            if [[ $skipped -gt 0 ]]; then
                info "  ($skipped migration(s) were already applied in the backup schema)"
            fi
            return 0
        fi

        # Check for "already exists" type error -- migration changes are already in schema
        if is_already_exists_error "$output"; then
            # Extract the failed migration name
            local failed_name
            failed_name=$(echo "$output" | grep -oP "(?<=Migration name: )\S+" | head -1)

            # If not found in output, check the database for the failed entry
            if [[ -z "$failed_name" ]]; then
                failed_name=$(run_psql -t -A -c \
                    "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1;" \
                    2>/dev/null | tr -d ' ')
            fi

            if [[ -n "$failed_name" ]]; then
                info "  Migration '$failed_name' -- changes already in schema, marking as applied"
                run_backend_cmd "npx prisma migrate resolve --applied '$failed_name'" > /dev/null 2>&1 || true
                skipped=$((skipped + 1))
                continue  # retry
            fi
        fi

        # Check for P3018 (previous failed migration blocking new ones)
        if echo "$output" | grep -q "P3018"; then
            local blocked_name
            blocked_name=$(run_psql -t -A -c \
                "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1;" \
                2>/dev/null | tr -d ' ')

            if [[ -n "$blocked_name" ]]; then
                info "  Found blocked migration '$blocked_name', attempting to resolve..."
                # Try to mark it as applied (changes may already be in schema)
                run_backend_cmd "npx prisma migrate resolve --applied '$blocked_name'" > /dev/null 2>&1 || true
                skipped=$((skipped + 1))
                continue  # retry
            fi
        fi

        # Unrecognized error -- show details and fail
        err "Migration failed with unexpected error:"
        echo "$output" | tail -30
        err ""
        err "To fix manually:"
        err "  1. docker compose run --rm -T --entrypoint '/bin/sh' backend -c \\"
        err "       'npx prisma migrate resolve --applied <migration_name>'"
        err "  2. docker compose up -d backend"
        return 1
    done

    err "Too many retry iterations ($max_iterations). Something is wrong."
    return 1
}

#===============================================================================
# Step 6: Start backend and verify
#===============================================================================

start_and_verify() {
    info "Starting all services..."
    docker compose up -d 2>/dev/null

    info "Waiting for backend to become healthy..."
    local attempt=0
    while [[ $attempt -lt 60 ]]; do
        if docker compose exec -T backend wget --quiet --tries=1 --spider http://localhost:3001/health 2>/dev/null; then
            break
        fi
        sleep 2
        attempt=$((attempt + 1))
    done

    if [[ $attempt -ge 60 ]]; then
        err "Backend did not start within 120 seconds"
        info "Last 40 lines of backend logs:"
        docker compose logs --tail=40 backend
        err "Check logs with: docker compose logs backend"
        return 1
    fi
    ok "Backend is healthy"

    # Verify migration count
    local final_count
    final_count=$(run_psql -t -A -c \
        "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;" 2>/dev/null | tr -d ' ')

    # Count codebase migrations
    local codebase_count
    codebase_count=$(find "$PROJECT_ROOT/backend/prisma/migrations" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')

    info "Migration summary: $final_count/$codebase_count migrations applied"

    if [[ "$final_count" -lt "$codebase_count" ]]; then
        warn "Not all migrations are applied ($final_count applied, $codebase_count in codebase)"
        warn "Check: docker compose logs backend"
    fi

    # Quick health check
    info "Verifying app..."
    if curl -sf http://192.168.1.70/api/health > /dev/null 2>&1; then
        ok "App is responding at http://192.168.1.70"
    else
        sleep 5
        if curl -sf http://192.168.1.70/api/health > /dev/null 2>&1; then
            ok "App is responding at http://192.168.1.70"
        else
            warn "App not responding yet. Check: docker compose logs backend"
        fi
    fi
}

#===============================================================================
# Main
#===============================================================================

main() {
    BACKUP_FILE="${1:-$PROJECT_ROOT/backups/recovery.sql}"

    if [[ ! -f "$BACKUP_FILE" ]]; then
        if [[ -f "$PROJECT_ROOT/$BACKUP_FILE" ]]; then
            BACKUP_FILE="$PROJECT_ROOT/$BACKUP_FILE"
        else
            err "Backup file not found: $BACKUP_FILE"
            exit 1
        fi
    fi

    printf '\n'
    printf '%b\n' "${BLUE}==========================================${NC}"
    printf '%b\n' "${BLUE} TEV2 Database Restore (Universal)${NC}"
    printf '%b\n' "${BLUE}==========================================${NC}"
    printf '\n'
    info "Backup: $BACKUP_FILE"
    info "Database: $POSTGRES_DB"
    printf '\n'

    load_env
    validate
    stop_backend
    restore_backup
    clean_migrations_table
    apply_migrations
    start_and_verify

    printf '\n'
    printf '%b\n' "${GREEN}==========================================${NC}"
    printf '%b\n' "${GREEN} RESTORE COMPLETE${NC}"
    printf '%b\n' "${GREEN}==========================================${NC}"
    printf '\n'
    ok "Database restored. App available at http://192.168.1.70"
}

main "$@"
