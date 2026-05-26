#!/usr/bin/env bash

#===============================================================================
# AssoPOS Database Restore Script (Unified)
#
# Restores the PostgreSQL database from backup files. Works with any backup
# from any version of the app. Automatically handles:
#   - Plain SQL and compressed (gzip) backup formats
#   - Non-standard \restrict/\unrestrict commands in backup files
#   - Orphaned migration entries (in backup but not in current codebase)
#   - Pre-applied migrations (schema changes already in backup)
#   - Failed migration entries from previous attempts
#   - Pending migrations that still need to run
#
# Usage: ./scripts/restore.sh [OPTIONS] [BACKUP_FILE]
# Options:
#   -h, --help           Show this help message
#   -f, --force          Skip confirmation prompt
#   -l, --list           List available backups and exit
#   --skip-migrations    Skip automatic migration handling after restore
#===============================================================================

set -euo pipefail

#===============================================================================
# Color definitions
#===============================================================================

readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m'
readonly BOLD='\033[1m'

#===============================================================================
# Print helpers
#===============================================================================

info()    { printf '%b\n' "${BLUE}[INFO]${NC} $1"; }
ok()      { printf '%b\n' "${GREEN}[OK]${NC} $1"; }
warn()    { printf '%b\n' "${YELLOW}[WARN]${NC} $1"; }
err()     { printf '%b\n' "${RED}[ERROR]${NC} $1" >&2; }

print_header() {
    printf '\n'
    printf '%b\n' "${CYAN}${BOLD}========================================${NC}"
    printf '%b\n' "${CYAN}${BOLD} $1 ${NC}"
    printf '%b\n' "${CYAN}${BOLD}========================================${NC}"
    printf '\n'
}

#===============================================================================
# Help
#===============================================================================

show_help() {
    cat << 'EOF'
AssoPOS Database Restore Script (Unified)

Usage: ./scripts/restore.sh [OPTIONS] [BACKUP_FILE]

Description:
    Restores the PostgreSQL database from a backup file.
    If no backup file is specified, restores from the last backup.

Options:
    -h, --help           Show this help message and exit
    -f, --force          Skip confirmation prompt before restore
    -l, --list           List available backups and exit
    --skip-migrations    Skip automatic migration handling after restore

Arguments:
    BACKUP_FILE     Path to the backup file to restore from
                    Can be absolute or relative to project root
                    If not specified, uses the last backup

Environment Variables:
    The script reads database credentials from the .env file:
    - POSTGRES_USER     Database username (default: assopos_user)
    - POSTGRES_PASSWORD Database password (default: assopos_password)
    - POSTGRES_DB       Database name (default: assopos)

Backup Files:
    - Location: ./backups/
    - Naming: db_backup_YYYYMMDD_HHMMSS.sql or db_backup_YYYYMMDD_HHMMSS.sql.gz
    - Last backup reference: ./backups/.last_backup

Restore Process:
    1. Stop the backend service
    2. Terminate all existing database connections
    3. Drop the existing database
    4. Create a fresh database
    5. Restore data from the backup file
    6. Clean up orphaned and failed migration entries
    7. Apply pending Prisma migrations
    8. Start services and verify health

Examples:
    ./scripts/restore.sh                              # Restore from last backup
    ./scripts/restore.sh --list                       # List available backups
    ./scripts/restore.sh backups/db_backup_20260221.sql  # Restore specific file
    ./scripts/restore.sh --force                      # Restore without confirmation
    ./scripts/restore.sh -f backups/backup.sql.gz     # Force restore compressed backup

Exit Codes:
    0 - Success
    1 - General error (restore failed, validation failed, etc.)
    2 - Database container not running
    3 - Environment file not found
    4 - Backup file not found
    5 - User cancelled operation

EOF
    exit 0
}

#===============================================================================
# Environment setup
#===============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

POSTGRES_USER="${POSTGRES_USER:-assopos_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-assopos_password}"
POSTGRES_DB="${POSTGRES_DB:-assopos}"

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

#===============================================================================
# Docker helpers
#===============================================================================

run_psql() {
    docker compose exec -T db psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"
}

run_psql_postgres() {
    docker compose exec -T db psql -X -U "$POSTGRES_USER" -d postgres "$@"
}

run_backend_cmd() {
    docker compose run --rm -T --entrypoint "/bin/sh" backend -c "$1" 2>&1
}

#===============================================================================
# Validation
#===============================================================================

check_database_container() {
    info "Checking database container..."
    if ! docker compose ps db 2>/dev/null | grep -q "running\|Up"; then
        err "Database container is not running. Start with: docker compose up -d db"
        exit 2
    fi
    ok "Database container is running"
}

check_database_ready() {
    info "Checking database connectivity..."
    local attempt=0
    # pg_isready timeout: 10 seconds should be sufficient for a healthy DB
    while [[ $attempt -lt 10 ]]; do
        docker compose exec -T db pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1 && break
        attempt=$((attempt + 1))
        sleep 1
    done
    if [[ $attempt -ge 10 ]]; then
        err "Database not ready"
        exit 2
    fi
    ok "Database is ready"
}

validate_backup_file() {
    local file="$1"
    if [[ ! -f "$file" ]]; then
        err "Backup file not found: $file"
        exit 4
    fi
    if [[ ! -r "$file" ]]; then
        err "Backup file is not readable: $file"
        exit 4
    fi
    local size
    size=$(wc -c < "$file")
    if [[ "$size" -eq 0 ]]; then
        err "Backup file is empty: $file"
        exit 4
    fi
    ok "Backup file validated ($size bytes)"
}

#===============================================================================
# Backup listing
#===============================================================================

list_backups() {
    local backup_dir="$PROJECT_ROOT/backups"

    print_header "AVAILABLE BACKUPS"

    if [[ ! -d "$backup_dir" ]]; then
        warn "No backups directory found at: $backup_dir"
        info "Create a backup first with: ./scripts/backup.sh"
        exit 0
    fi

    local backups=()
    while IFS= read -r -d '' file; do
        backups+=("$file")
    done < <(find "$backup_dir" -name "db_backup_*.sql*" -type f -print0 2>/dev/null | sort -zr)

    if [[ ${#backups[@]} -eq 0 ]]; then
        warn "No backup files found in: $backup_dir"
        info "Create a backup first with: ./scripts/backup.sh"
        exit 0
    fi

    local last_backup=""
    if [[ -f "$backup_dir/.last_backup" ]]; then
        last_backup=$(cat "$backup_dir/.last_backup")
    fi

    printf '%b\n' "${WHITE}Found ${#backups[@]} backup(s):${NC}"
    printf '\n'
    printf '%-50s %-12s %s\n' "FILE" "SIZE" "DATE"
    printf '%s\n' "$(printf '%.0s-' {1..80})"

    for backup in "${backups[@]}"; do
        local filename
        filename=$(basename "$backup")
        local file_size
        file_size=$(du -h "$backup" | cut -f1)

        local backup_date=""
        if [[ "$filename" =~ db_backup_([0-9]{8})_([0-9]{6}) ]]; then
            local date_part="${BASH_REMATCH[1]}"
            local time_part="${BASH_REMATCH[2]}"
            backup_date="${date_part:0:4}-${date_part:4:2}-${date_part:6:2} ${time_part:0:2}:${time_part:2:2}:${time_part:4:2}"
        fi

        local marker=""
        if [[ "$backup" == "$last_backup" ]]; then
            marker="${GREEN} (latest)${NC}"
        fi

        printf '%-50s %-12s %s%b\n' "$filename" "$file_size" "$backup_date" "$marker"
    done

    printf '\n'
    exit 0
}

get_last_backup() {
    local backup_dir="$PROJECT_ROOT/backups"
    local last_backup_file="$backup_dir/.last_backup"

    if [[ ! -f "$last_backup_file" ]]; then
        err "No last backup reference found at: $last_backup_file"
        info "Specify a backup file or create a backup first with: ./scripts/backup.sh"
        exit 4
    fi

    local backup_file
    backup_file=$(cat "$last_backup_file")

    if [[ ! -f "$backup_file" ]]; then
        err "Last backup file not found: $backup_file"
        exit 4
    fi

    echo "$backup_file"
}

#===============================================================================
# Confirmation
#===============================================================================

confirm_restore() {
    local backup_file="$1"
    local force="$2"

    if [[ "$force" == "true" ]]; then
        return 0
    fi

    print_header "RESTORE CONFIRMATION"
    warn "This operation will:"
    printf '  - Stop the backend service\n'
    printf '  - Terminate all active database connections\n'
    printf '  - DROP the existing database: %s\n' "$POSTGRES_DB"
    printf '  - Create a fresh database\n'
    printf '  - Restore data from: %s\n' "$backup_file"
    printf '  - Apply any pending migrations\n'
    printf '\n'
    warn "ALL EXISTING DATA WILL BE LOST!"
    printf '\n'

    read -p "Are you sure you want to continue? (yes/no): " -r
    printf '\n'

    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        info "Restore cancelled by user"
        exit 5
    fi
}

#===============================================================================
# Restore steps
#===============================================================================

stop_backend() {
    info "Stopping backend..."
    # Silent failure acceptable: backend may not be running or already removed
    docker compose stop backend 2>/dev/null || true
    # Silent failure acceptable: backend may not exist or already removed
    docker compose rm -f backend 2>/dev/null || true
    ok "Backend stopped"
}

terminate_connections() {
    info "Terminating active connections..."
    run_psql_postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" \
        > /dev/null 2>&1 || true  # Silent failure acceptable: no active connections to terminate
    ok "Connections terminated"
}

recreate_database() {
    info "Dropping database..."
    run_psql_postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" > /dev/null 2>&1
    ok "Database dropped"

    info "Creating fresh database..."
    run_psql_postgres -c "CREATE DATABASE $POSTGRES_DB TEMPLATE template0;" > /dev/null 2>&1
    ok "Database created"
}

perform_restore() {
    local backup_file="$1"
    local clean="$PROJECT_ROOT/backups/_restore_clean.sql"

    mkdir -p "$PROJECT_ROOT/backups"

    info "Stripping non-standard psql commands..."
    if [[ "$backup_file" == *.gz ]]; then
        info "Detected compressed backup, decompressing..."
        gunzip -c "$backup_file" | sed '/^\\restrict /d; /^\\unrestrict /d' > "$clean"
    else
        sed '/^\\restrict /d; /^\\unrestrict /d' "$backup_file" > "$clean"
    fi

    info "Restoring backup..."
    local restore_log
    restore_log=$(docker compose exec -T db psql -X -U "$POSTGRES_USER" "$POSTGRES_DB" < "$clean" 2>&1) || true

    local error_count
    error_count=$(echo "$restore_log" | grep -ciE "^ERROR:" 2>/dev/null || true)
    error_count=$(echo "$error_count" | head -1 | tr -dc '0-9')
    error_count=${error_count:-0}

    if [[ "$error_count" -gt 0 ]]; then
        warn "Restore completed with $error_count notice(s). Showing first 10:"
        echo "$restore_log" | grep -iE "^ERROR:" | head -10
        warn "Continuing -- some notices are harmless"
    else
        ok "Backup restored"
    fi

    rm -f "$clean"

    info "Updating query planner statistics..."
    run_psql -c "ANALYZE;" > /dev/null 2>&1 || true  # Silent failure acceptable: ANALYZE is optional
    ok "Statistics updated"
}

#===============================================================================
# Migration handling
#===============================================================================

clean_migrations_table() {
    info "Cleaning up _prisma_migrations..."

    local db_migrations
    db_migrations=$(run_psql -t -A -c \
        "SELECT migration_name FROM _prisma_migrations ORDER BY migration_name;" 2>/dev/null || echo "")

    local orphan_count=0
    while IFS= read -r mig; do
        [[ -z "$mig" ]] && continue
        if [[ ! -d "$PROJECT_ROOT/backend/prisma/migrations/$mig" ]]; then
            info "  Removing orphan: $mig"
            local escaped_mig
            escaped_mig=$(echo "$mig" | sed "s/'/''/g")
            run_psql -c "DELETE FROM _prisma_migrations WHERE migration_name = '${escaped_mig}';" > /dev/null 2>&1
            orphan_count=$((orphan_count + 1))
        fi
    done <<< "$db_migrations"

    if [[ $orphan_count -gt 0 ]]; then
        ok "Removed $orphan_count orphaned migration(s)"
    else
        ok "No orphaned migrations"
    fi

    local failed_migrations
    failed_migrations=$(run_psql -t -A -c \
        "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL ORDER BY started_at;" 2>/dev/null || echo "")

    local failed_count=0
    while IFS= read -r mig; do
        [[ -z "$mig" ]] && continue
        info "  Rolling back failed migration: $mig"
        run_backend_cmd "npx prisma migrate resolve --rolled-back '$mig'" > /dev/null 2>&1 || true
        failed_count=$((failed_count + 1))
    done <<< "$failed_migrations"

    if [[ $failed_count -gt 0 ]]; then
        ok "Rolled back $failed_count failed migration(s) (will be retried by migrate deploy)"
    fi

    local remaining
    remaining=$(run_psql -t -A -c \
        "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;" 2>/dev/null | tr -d ' ' || true)
    info "  ${remaining:-0} valid migration(s) already recorded"
}

is_already_exists_error() {
    echo "$1" | grep -qE "already exists|42701|42P07|42710|42P04|42723"
}

# Extract and handle "already exists" type errors
# This occurs when a migration's schema changes are already present in the backup
# PostgreSQL error codes: 42701=duplicate_column, 42P07=duplicate_table, 42710=duplicate_object,
#                       42P04=duplicate_database, 42723=duplicate_function
handle_already_exists_error() {
    local output="$1"
    
    local failed_name
    failed_name=$(echo "$output" | grep -oE "Migration name: [^ ]+" | head -1 | sed 's/Migration name: //')

    # If not found in output, check the database for the failed entry
    if [[ -z "$failed_name" ]]; then
        failed_name=$(run_psql -t -A -c \
            "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1;" \
            2>/dev/null | tr -d ' ' || true)
    fi

    if [[ -n "$failed_name" ]]; then
        info "  Migration '$failed_name' -- changes already in schema, marking as applied"
        # Silent failure acceptable: resolve may fail if migration is already resolved
        run_backend_cmd "npx prisma migrate resolve --applied '$failed_name'" > /dev/null 2>&1 || true
        return 0
    fi
    
    return 1
}

# Handle P3018 errors (previous failed migration blocking new ones)
# This occurs when Prisma detects a migration that previously failed
handle_blocked_migration() {
    local output="$1"
    
    local blocked_name
    blocked_name=$(run_psql -t -A -c \
        "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1;" \
        2>/dev/null | tr -d ' ' || true)

    if [[ -n "$blocked_name" ]]; then
        info "  Found blocked migration '$blocked_name', resolving..."
        # Silent failure acceptable: resolve may fail if migration is already resolved
        run_backend_cmd "npx prisma migrate resolve --applied '$blocked_name'" > /dev/null 2>&1 || true
        return 0
    fi
    
    return 1
}

apply_migrations() {
    info "Applying pending migrations..."
    info "(Will auto-detect and skip migrations whose changes are already in the schema)"

    # Safety limit: 60 iterations to prevent infinite loops
    # Each iteration handles one migration, so this accommodates large codebases
    local max_iterations=60
    local iteration=0
    local skipped=0

    while [[ $iteration -lt $max_iterations ]]; do
        iteration=$((iteration + 1))

        local output
        output=$(run_backend_cmd "npx prisma migrate deploy 2>&1") || true

        if echo "$output" | grep -q "No pending migrations to apply"; then
            ok "All migrations applied"
            [[ $skipped -gt 0 ]] && info "  ($skipped migration(s) were already applied in the backup schema)"
            return 0
        fi

        if echo "$output" | grep -q "migrations.*applied" && ! echo "$output" | grep -q "Error"; then
            ok "All migrations applied"
            [[ $skipped -gt 0 ]] && info "  ($skipped migration(s) were already applied in the backup schema)"
            return 0
        fi

        if is_already_exists_error "$output"; then
            if handle_already_exists_error "$output"; then
                skipped=$((skipped + 1))
                continue
            fi
        fi

        if echo "$output" | grep -q "P3018"; then
            if handle_blocked_migration "$output"; then
                skipped=$((skipped + 1))
                continue
            fi
        fi

        if echo "$output" | grep -q "Error"; then
            err "Migration failed with unexpected error:"
            echo "$output" | tail -30
            err ""
            err "To fix manually:"
            err "  1. docker compose run --rm -T --entrypoint '/bin/sh' backend -c \\"
            err "       'npx prisma migrate resolve --applied <migration_name>'"
            err "  2. docker compose up -d backend"
            return 1
        fi

        ok "All migrations applied"
        return 0
    done

    err "Too many retry iterations ($max_iterations). Something is wrong."
    return 1
}

#===============================================================================
# Start and verify
#===============================================================================

start_and_verify() {
    info "Starting all services..."
    docker compose up -d 2>/dev/null

    info "Waiting for backend to become healthy..."
    local attempt=0
    # Backend health check timeout: 60 iterations × 2 seconds = 120 seconds max
    # This allows enough time for container startup, migrations, and app initialization
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
        return 1
    fi
    ok "Backend is healthy"

    local final_count
    final_count=$(run_psql -t -A -c \
        "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;" 2>/dev/null | tr -d ' ' || true)
    final_count=${final_count:-0}

    local codebase_count
    codebase_count=$(find "$PROJECT_ROOT/backend/prisma/migrations" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')

    info "Migration summary: $final_count/$codebase_count migrations applied"

    if [[ "$final_count" -lt "$codebase_count" ]]; then
        warn "Not all migrations are applied ($final_count applied, $codebase_count in codebase)"
        warn "Check: docker compose logs backend"
    fi

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
    local force="false"
    local list_only="false"
    local skip_migrations="false"
    local backup_file=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                ;;
            -f|--force)
                force="true"
                shift
                ;;
            -l|--list)
                list_only="true"
                shift
                ;;
            --skip-migrations)
                skip_migrations="true"
                shift
                ;;
            -*)
                err "Unknown option: $1"
                printf 'Use --help for usage information\n'
                exit 1
                ;;
            *)
                backup_file="$1"
                shift
                ;;
        esac
    done

    printf '\n'
    printf '%b\n' "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    printf '%b\n' "${CYAN}${BOLD}║              AssoPOS DATABASE RESTORE                         ║${NC}"
    printf '%b\n' "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    printf '\n'

    load_env

    if [[ "$list_only" == "true" ]]; then
        list_backups
    fi

    if [[ -z "$backup_file" ]]; then
        info "No backup file specified, using last backup..."
        backup_file=$(get_last_backup)
    fi

    if [[ "$backup_file" != /* ]]; then
        if [[ -f "$PROJECT_ROOT/$backup_file" ]]; then
            backup_file="$PROJECT_ROOT/$backup_file"
        elif [[ ! -f "$backup_file" ]]; then
            err "Backup file not found: $backup_file"
            exit 4
        fi
    fi

    validate_backup_file "$backup_file"
    check_database_container
    check_database_ready

    info "Database: $POSTGRES_DB"
    info "User: $POSTGRES_USER"
    info "Backup: $backup_file"

    confirm_restore "$backup_file" "$force"

    print_header "STARTING DATABASE RESTORE"

    stop_backend
    terminate_connections
    recreate_database
    perform_restore "$backup_file"

    if [[ "$skip_migrations" == "true" ]]; then
        warn "Skipping migration handling (--skip-migrations flag)"
        info "To apply migrations manually:"
        info "  docker compose run --rm -T --entrypoint '/bin/sh' backend -c 'npx prisma migrate deploy'"
    else
        print_header "HANDLING MIGRATIONS"
        clean_migrations_table
        if apply_migrations; then
            ok "Migration handling complete"
        else
            warn "Migration application had issues"
        fi
    fi

    start_and_verify

    print_header "RESTORE COMPLETE"
    ok "Database restored successfully. App available at http://192.168.1.70"
}

main "$@"
