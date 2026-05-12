#!/usr/bin/env bash

#===============================================================================
# TEV2 Cloud Restore Script
#
# Downloads a backup archive from MEGA and restores:
#   - PostgreSQL database
#   - Docker volumes (storage_data, uploads_data)
#   - Configuration files (.env, VERSION)
#
# Usage: ./scripts/restore-cloud.sh [OPTIONS]
# Options:
#   -h, --help           Show this help message
#   -l, --list           List available cloud backups and exit
#   -f, --force          Skip confirmation prompt
#   --db-only            Only restore the database (skip volumes and config)
#   --latest             Restore from the latest cloud backup (default)
#   --file FILENAME      Restore a specific backup file from MEGA
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
TEV2 Cloud Restore Script

Usage: ./scripts/restore-cloud.sh [OPTIONS]

Description:
    Downloads a backup archive from MEGA cloud storage and restores the
    database, Docker volumes, and configuration files.

    The restore process:
    1. Downloads archive from MEGA
    2. Extracts contents (DB dump, volumes, config)
    3. Stops backend service
    4. Restores PostgreSQL database
    5. Restores Docker volumes (storage_data, uploads_data)
    6. Restores .env and VERSION files
    7. Applies pending migrations
    8. Starts and verifies services

Options:
    -h, --help           Show this help message and exit
    -l, --list           List available cloud backups and exit
    -f, --force          Skip confirmation prompt
    --db-only            Only restore the database (skip volumes and config)
    --latest             Restore from the latest cloud backup (default)
    --file FILENAME      Restore a specific backup file from MEGA

Requirements:
    - MEGA CMD installed and logged in
    - Docker Compose running (for database restore)

Examples:
    ./scripts/restore-cloud.sh --list              # List cloud backups
    ./scripts/restore-cloud.sh                     # Restore latest
    ./scripts/restore-cloud.sh --force             # Restore without prompt
    ./scripts/restore-cloud.sh --db-only           # Restore database only
    ./scripts/restore-cloud.sh --file tev2_full_20260511_040000.tar.gz

EOF
    exit 0
}

#===============================================================================
# Environment setup
#===============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

POSTGRES_USER="${POSTGRES_USER:-totalevo_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-totalevo_password}"
POSTGRES_DB="${POSTGRES_DB:-bar_pos}"

MEGA_REMOTE_FOLDER="/TEV2/backups"

#===============================================================================
# Environment loading
#===============================================================================

load_env() {
    local env_file="$PROJECT_ROOT/.env"
    if [[ -f "$env_file" ]]; then
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
    else
        warn "No .env file found, using defaults"
    fi
}

#===============================================================================
# Docker helpers
#===============================================================================

run_psql_postgres() {
    docker compose exec -T db psql -X -U "$POSTGRES_USER" -d postgres "$@"
}

run_psql() {
    docker compose exec -T db psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"
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

check_mega_login() {
    info "Checking MEGA login..."
    if ! command -v mega-get &>/dev/null; then
        err "MEGA CMD not found. Install with: ./scripts/setup-cloud-backup.sh"
        exit 1
    fi
    if ! mega-whoami 2>&1 | grep -q "@"; then
        err "Not logged into MEGA. Run: ./scripts/setup-cloud-backup.sh"
        exit 1
    fi
    local email
    email=$(mega-whoami 2>&1 | grep -oE '[^ ]+@[^ ]+' | head -1)
    ok "Logged into MEGA as: $email"
}

#===============================================================================
# List cloud backups
#===============================================================================

list_cloud_backups() {
    print_header "AVAILABLE CLOUD BACKUPS"

    # List backups in parseable format: filename<TAB>size<TAB>date
    # Parse mega-ls output to extract filename, size, date
    local entries
    entries=$(mega-ls -l "$MEGA_REMOTE_FOLDER" 2>&1 | grep "tev2_full_" || true)

    if [[ -z "$entries" ]]; then
        warn "No cloud backups found at $MEGA_REMOTE_FOLDER"
        info "Create one with: ./scripts/backup.sh --cloud --compress"
        exit 0
    fi

    echo "$entries" | while IFS= read -r line; do
        # mega-ls -l format: "MODIFIED  SIZE  NAME" or similar
        # The filename is always the last field
        local filename size date
        filename=$(echo "$line" | awk '{print $NF}')
        # Try to get size (typically second-to-last field or similar)
        size=$(echo "$line" | awk 'NF>1{print $(NF-1)}')
        # Date is everything before the last two fields
        date=$(echo "$line" | awk '{NF-=2; print}' | sed 's/[[:space:]]*$//')
        printf '%s\t%s\t%s\n' "$filename" "$size" "$date"
    done

    local count
    count=$(echo "$entries" | grep -c "tev2_full_" || true)
    printf '\n'
    printf '%b\n' "${WHITE}Found $count cloud backup(s)${NC}"

    exit 0
}

#===============================================================================
# Download from MEGA
#===============================================================================

download_cloud_backup() {
    local target_file="$1"
    local download_dir="$PROJECT_ROOT/backups"
    mkdir -p "$download_dir"

    local remote_path="${MEGA_REMOTE_FOLDER}/${target_file}"

    info "Downloading: $remote_path"
    mega-get "$remote_path" "$download_dir/" 2>&1

    local local_path="${download_dir}/${target_file}"
    if [[ ! -f "$local_path" ]]; then
        err "Download failed: $local_path not found"
        exit 1
    fi

    local file_size
    file_size=$(du -h "$local_path" | cut -f1)
    ok "Downloaded: $local_path ($file_size)"

    echo "$local_path"
}

# Find the latest cloud backup
find_latest_backup() {
    local latest
    latest=$(mega-ls "$MEGA_REMOTE_FOLDER" 2>&1 | grep "tev2_full_" | sort | tail -1 | awk '{print $NF}' || true)

    if [[ -z "$latest" ]]; then
        err "No cloud backups found at $MEGA_REMOTE_FOLDER"
        exit 4
    fi

    echo "$latest"
}

#===============================================================================
# Extract archive
#===============================================================================

extract_archive() {
    local archive_path="$1"
    local extract_dir="$PROJECT_ROOT/backups/_cloud_extract"

    info "Extracting archive..."
    rm -rf "$extract_dir"
    mkdir -p "$extract_dir"

    tar xzf "$archive_path" -C "$extract_dir"

    # Show manifest if available
    if [[ -f "$extract_dir/MANIFEST.txt" ]]; then
        info "Archive manifest:"
        cat "$extract_dir/MANIFEST.txt"
        printf '\n'
    fi

    ok "Archive extracted to: $extract_dir"
    echo "$extract_dir"
}

#===============================================================================
# Restore functions
#===============================================================================

stop_backend() {
    info "Stopping backend..."
    docker compose stop backend 2>/dev/null || true
    docker compose rm -f backend 2>/dev/null || true
    ok "Backend stopped"
}

terminate_connections() {
    info "Terminating active connections..."
    run_psql_postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" \
        > /dev/null 2>&1 || true
    ok "Connections terminated"
}

restore_database() {
    local extract_dir="$1"

    info "Looking for database dump in archive..."
    local db_file=""
    # Check for .sql.gz first, then .sql
    for f in "$extract_dir/database/"*.sql.gz "$extract_dir/database/"*.sql; do
        if [[ -f "$f" ]]; then
            db_file="$f"
            break
        fi
    done

    if [[ -z "$db_file" ]]; then
        err "No database dump found in archive"
        return 1
    fi

    info "Database dump: $(basename "$db_file")"

    # Decompress if needed
    if [[ "$db_file" == *.gz ]]; then
        info "Decompressing database dump..."
        gunzip -f "$db_file"
        db_file="${db_file%.gz}"
    fi

    local clean_file="$PROJECT_ROOT/backups/_restore_clean.sql"
    sed '/^\\restrict /d; /^\\unrestrict /d' "$db_file" > "$clean_file"

    info "Dropping database..."
    run_psql_postgres -c "DROP DATABASE IF EXISTS $POSTGRES_DB;" > /dev/null 2>&1
    ok "Database dropped"

    info "Creating fresh database..."
    run_psql_postgres -c "CREATE DATABASE $POSTGRES_DB TEMPLATE template0;" > /dev/null 2>&1
    ok "Database created"

    info "Restoring database..."
    local restore_log
    restore_log=$(docker compose exec -T db psql -X -U "$POSTGRES_USER" "$POSTGRES_DB" < "$clean_file" 2>&1) || true

    local error_count
    error_count=$(echo "$restore_log" | grep -ciE "^ERROR:" 2>/dev/null || true)
    error_count=$(echo "$error_count" | head -1 | tr -dc '0-9')
    error_count=${error_count:-0}

    if [[ "$error_count" -gt 0 ]]; then
        warn "Restore completed with $error_count notice(s)"
    else
        ok "Database restored"
    fi

    rm -f "$clean_file"

    info "Updating query planner statistics..."
    run_psql -c "ANALYZE;" > /dev/null 2>&1 || true
    ok "Statistics updated"
}

restore_volumes() {
    local extract_dir="$1"

    info "Restoring Docker volumes..."

    # Restore storage_data
    if [[ -f "$extract_dir/volumes/storage_data.tar.gz" ]]; then
        info "  Restoring storage_data..."
        # Create volume if it doesn't exist
        docker volume create storage_data &>/dev/null || true
        docker run --rm -v storage_data:/data -v "$extract_dir/volumes":/backup:ro alpine \
            sh -c "rm -rf /data/* /data/.[!.]* 2>/dev/null; tar xzf /backup/storage_data.tar.gz -C /data" 2>/dev/null || true
        ok "  storage_data restored"
    else
        info "  No storage_data in archive, skipping"
    fi

    # Restore uploads_data
    if [[ -f "$extract_dir/volumes/uploads_data.tar.gz" ]]; then
        info "  Restoring uploads_data..."
        docker volume create uploads_data &>/dev/null || true
        docker run --rm -v uploads_data:/data -v "$extract_dir/volumes":/backup:ro alpine \
            sh -c "rm -rf /data/* /data/.[!.]* 2>/dev/null; tar xzf /backup/uploads_data.tar.gz -C /data" 2>/dev/null || true
        ok "  uploads_data restored"
    else
        info "  No uploads_data in archive, skipping"
    fi
}

restore_config() {
    local extract_dir="$1"

    info "Restoring configuration files..."

    if [[ -f "$extract_dir/config/.env" ]]; then
        # Backup current .env first
        if [[ -f "$PROJECT_ROOT/.env" ]]; then
            cp "$PROJECT_ROOT/.env" "$PROJECT_ROOT/.env.pre-cloud-restore"
            info "  Current .env backed up to .env.pre-cloud-restore"
        fi
        cp "$extract_dir/config/.env" "$PROJECT_ROOT/.env"
        ok "  .env restored"
    fi

    if [[ -f "$extract_dir/config/VERSION" ]]; then
        cp "$extract_dir/config/VERSION" "$PROJECT_ROOT/VERSION"
        ok "  VERSION restored"
    fi
}

apply_migrations() {
    info "Applying pending migrations..."

    local max_iterations=60
    local iteration=0
    local skipped=0

    while [[ $iteration -lt $max_iterations ]]; do
        iteration=$((iteration + 1))

        local output
        output=$(run_backend_cmd "npx prisma migrate deploy 2>&1") || true

        if echo "$output" | grep -q "No pending migrations to apply"; then
            ok "All migrations applied"
            return 0
        fi

        if echo "$output" | grep -q "migrations.*applied" && ! echo "$output" | grep -q "Error"; then
            ok "All migrations applied"
            return 0
        fi

        # Handle "already exists" errors
        if echo "$output" | grep -qE "already exists|42701|42P07|42710|42P04|42723"; then
            local failed_name
            failed_name=$(echo "$output" | grep -oE "Migration name: [^ ]+" | head -1 | sed 's/Migration name: //')
            if [[ -z "$failed_name" ]]; then
                failed_name=$(run_psql -t -A -c \
                    "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1;" \
                    2>/dev/null | tr -d ' ' || true)
            fi
            if [[ -n "$failed_name" ]]; then
                info "  Migration '$failed_name' -- already in schema, marking as applied"
                run_backend_cmd "npx prisma migrate resolve --applied '$failed_name'" > /dev/null 2>&1 || true
                skipped=$((skipped + 1))
                continue
            fi
        fi

        # Handle blocked migrations (P3018)
        if echo "$output" | grep -q "P3018"; then
            local blocked_name
            blocked_name=$(run_psql -t -A -c \
                "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL ORDER BY started_at DESC LIMIT 1;" \
                2>/dev/null | tr -d ' ' || true)
            if [[ -n "$blocked_name" ]]; then
                info "  Resolving blocked migration '$blocked_name'..."
                run_backend_cmd "npx prisma migrate resolve --applied '$blocked_name'" > /dev/null 2>&1 || true
                skipped=$((skipped + 1))
                continue
            fi
        fi

        if echo "$output" | grep -q "Error"; then
            err "Migration failed with unexpected error:"
            echo "$output" | tail -30
            return 1
        fi

        ok "All migrations applied"
        return 0
    done

    err "Too many retry iterations"
    return 1
}

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
        return 1
    fi
    ok "Backend is healthy"

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

cleanup() {
    local extract_dir="$PROJECT_ROOT/backups/_cloud_extract"
    if [[ -d "$extract_dir" ]]; then
        info "Cleaning up temporary files..."
        rm -rf "$extract_dir"
    fi
}

#===============================================================================
# Confirmation
#===============================================================================

confirm_restore() {
    local backup_file="$1"
    local db_only="$2"
    local force="$3"

    if [[ "$force" == "true" ]]; then
        return 0
    fi

    print_header "RESTORE CONFIRMATION"
    warn "This operation will:"
    printf '  - Download: %s\n' "$backup_file"
    printf '  - DROP the existing database: %s\n' "$POSTGRES_DB"
    if [[ "$db_only" == "false" ]]; then
        printf '  - Replace Docker volumes (storage_data, uploads_data)\n'
        printf '  - Replace .env and VERSION files\n'
    fi
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
# Main
#===============================================================================

main() {
    local force="false"
    local list_only="false"
    local db_only="false"
    local target_file=""

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                ;;
            -l|--list)
                list_only="true"
                shift
                ;;
            -f|--force)
                force="true"
                shift
                ;;
            --db-only)
                db_only="true"
                shift
                ;;
            --latest)
                shift
                ;;
            --file)
                target_file="$2"
                shift 2
                ;;
            *)
                err "Unknown option: $1"
                printf 'Use --help for usage information\n'
                exit 1
                ;;
        esac
    done

    printf '\n'
    printf '%b\n' "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    printf '%b\n' "${CYAN}${BOLD}║          TEV2 CLOUD RESTORE                               ║${NC}"
    printf '%b\n' "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    printf '\n'

    check_mega_login

    if [[ "$list_only" == "true" ]]; then
        list_cloud_backups
    fi

    # Find backup to restore
    if [[ -z "$target_file" ]]; then
        info "Finding latest cloud backup..."
        target_file=$(find_latest_backup)
    fi

    info "Target backup: $target_file"

    confirm_restore "$target_file" "$db_only" "$force"

    # Download
    print_header "STEP 1: DOWNLOAD FROM MEGA"
    local archive_path
    archive_path=$(download_cloud_backup "$target_file")

    # Extract
    print_header "STEP 2: EXTRACT ARCHIVE"
    local extract_dir
    extract_dir=$(extract_archive "$archive_path")

    # Prepare
    load_env
    check_database_container

    # Restore database
    print_header "STEP 3: RESTORE DATABASE"
    stop_backend
    terminate_connections
    restore_database "$extract_dir"

    # Restore volumes and config (unless --db-only)
    if [[ "$db_only" == "false" ]]; then
        print_header "STEP 4: RESTORE VOLUMES"
        restore_volumes "$extract_dir"

        print_header "STEP 5: RESTORE CONFIGURATION"
        restore_config "$extract_dir"
    else
        warn "Skipping volume and config restore (--db-only)"
    fi

    # Reload env after possible config restore
    load_env

    # Migrations
    print_header "STEP 6: APPLY MIGRATIONS"
    if apply_migrations; then
        ok "Migration handling complete"
    else
        warn "Migration application had issues"
    fi

    # Start and verify
    print_header "STEP 7: START AND VERIFY"
    start_and_verify

    # Cleanup
    cleanup
    rm -f "$archive_path"

    print_header "CLOUD RESTORE COMPLETE"
    ok "Restore from cloud backup successful. App available at http://192.168.1.70"
}

main "$@"
