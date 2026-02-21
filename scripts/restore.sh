#!/usr/bin/env bash

#===============================================================================
# TEV2 Database Restore Script
# 
# This script restores the PostgreSQL database from backup files.
# It supports both plain SQL and compressed (gzip) backup formats.
#
# Usage: ./scripts/restore.sh [OPTIONS] [BACKUP_FILE]
# Options:
#   -h, --help      Show this help message
#   -f, --force     Skip confirmation prompt
#   -l, --list      List available backups and exit
#
# Examples:
#   ./scripts/restore.sh                          # Restore from last backup
#   ./scripts/restore.sh backups/db_backup_x.sql  # Restore specific file
#   ./scripts/restore.sh --list                   # List available backups
#   ./scripts/restore.sh --force                  # Restore without confirmation
#===============================================================================

# Strict mode for better error handling
set -euo pipefail

#===============================================================================
# COLOR DEFINITIONS
#===============================================================================
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color
readonly BOLD='\033[1m'

#===============================================================================
# HELPER FUNCTIONS
#===============================================================================

print_info() {
    printf '%b\n' "${BLUE}[INFO]${NC} $1"
}

print_success() {
    printf '%b\n' "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    printf '%b\n' "${RED}[ERROR]${NC} $1" >&2
}

print_warning() {
    printf '%b\n' "${YELLOW}[WARNING]${NC} $1"
}

print_header() {
    printf '\n'
    printf '%b\n' "${CYAN}${BOLD}========================================${NC}"
    printf '%b\n' "${CYAN}${BOLD} $1 ${NC}"
    printf '%b\n' "${CYAN}${BOLD}========================================${NC}"
    printf '\n'
}

#===============================================================================
# HELP FUNCTION
#===============================================================================

show_help() {
    cat << 'EOF'
TEV2 Database Restore Script

Usage: ./scripts/restore.sh [OPTIONS] [BACKUP_FILE]

Description:
    Restores the PostgreSQL database from a backup file.
    If no backup file is specified, restores from the last backup.

Options:
    -h, --help      Show this help message and exit
    -f, --force     Skip confirmation prompt before restore
    -l, --list      List available backups and exit

Arguments:
    BACKUP_FILE     Path to the backup file to restore from
                    Can be absolute or relative to project root
                    If not specified, uses the last backup

Environment Variables:
    The script reads database credentials from the .env file:
    - POSTGRES_USER     Database username (default: totalevo_user)
    - POSTGRES_PASSWORD Database password (default: totalevo_password)
    - POSTGRES_DB       Database name (default: bar_pos)

Backup Files:
    - Location: ./backups/
    - Naming: db_backup_YYYYMMDD_HHMMSS.sql or db_backup_YYYYMMDD_HHMMSS.sql.gz
    - Last backup reference: ./backups/.last_backup

Restore Process:
    1. Terminate all existing database connections
    2. Drop the existing database
    3. Create a fresh database
    4. Restore data from the backup file

Examples:
    ./scripts/restore.sh                              # Restore from last backup
    ./scripts/restore.sh --list                       # List available backups
    ./scripts/restore.sh -l                           # Same as above
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
# ENVIRONMENT SETUP
#===============================================================================

# Get the project root directory (parent of scripts directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Change to project root to ensure docker compose works correctly
cd "$PROJECT_ROOT"

# Default values (can be overridden by .env)
POSTGRES_USER="${POSTGRES_USER:-totalevo_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-totalevo_password}"
POSTGRES_DB="${POSTGRES_DB:-bar_pos}"

# Load environment variables from .env file if it exists
load_env_file() {
    local env_file="$PROJECT_ROOT/.env"
    
    if [[ -f "$env_file" ]]; then
        print_info "Loading environment from .env file..."
        
        # Read and export variables from .env file
        # This handles comments and quoted values properly
        while IFS= read -r line || [[ -n "$line" ]]; do
            # Skip empty lines and comments
            [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
            
            # Extract variable name and value
            if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
                local var_name="${BASH_REMATCH[1]}"
                local var_value="${BASH_REMATCH[2]}"
                
                # Remove surrounding quotes if present
                var_value="${var_value#\"}"
                var_value="${var_value%\"}"
                var_value="${var_value#\'}"
                var_value="${var_value%\'}"
                
                # Export the variable
                export "$var_name"="$var_value"
            fi
        done < "$env_file"
        
        # Update database variables from environment
        POSTGRES_USER="${POSTGRES_USER:-totalevo_user}"
        POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-totalevo_password}"
        POSTGRES_DB="${POSTGRES_DB:-bar_pos}"
        
        print_success "Environment loaded successfully"
    else
        print_warning "No .env file found at $env_file"
        print_info "Using default database credentials"
    fi
}

#===============================================================================
# VALIDATION FUNCTIONS
#===============================================================================

# Check if the database container is running
check_database_container() {
    print_info "Checking database container status..."
    
    if ! docker compose ps db 2>/dev/null | grep -q "running\|Up"; then
        print_error "Database container is not running!"
        print_info "Start the database with: docker compose up -d db"
        exit 2
    fi
    
    print_success "Database container is running"
}

# Check if pg_isready reports the database as ready
check_database_ready() {
    print_info "Checking database connectivity..."
    
    local max_attempts=10
    local attempt=0
    
    while [[ $attempt -lt $max_attempts ]]; do
        if docker compose exec -T db pg_isready -U "$POSTGRES_USER" > /dev/null 2>&1; then
            print_success "Database is ready to accept connections"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 1
    done
    
    print_error "Database is not ready after ${max_attempts} seconds"
    print_info "Check database logs with: docker compose logs db"
    exit 2
}

# Validate the backup file exists and is readable
validate_backup_file() {
    local backup_file="$1"
    
    print_info "Validating backup file..."
    
    # Check if file exists
    if [[ ! -f "$backup_file" ]]; then
        print_error "Backup file not found: $backup_file"
        exit 4
    fi
    
    # Check if file is readable
    if [[ ! -r "$backup_file" ]]; then
        print_error "Backup file is not readable: $backup_file"
        exit 4
    fi
    
    # Check if file is not empty
    local file_size
    file_size=$(wc -c < "$backup_file")
    
    if [[ "$file_size" -eq 0 ]]; then
        print_error "Backup file is empty: $backup_file"
        exit 4
    fi
    
    print_success "Backup file validated ($file_size bytes)"
    return 0
}

#===============================================================================
# BACKUP LISTING FUNCTIONS
#===============================================================================

# List all available backups
list_backups() {
    local backup_dir="$PROJECT_ROOT/backups"
    
    print_header "AVAILABLE BACKUPS"
    
    # Check if backup directory exists
    if [[ ! -d "$backup_dir" ]]; then
        print_warning "No backups directory found at: $backup_dir"
        print_info "Create a backup first with: ./scripts/backup.sh"
        exit 0
    fi
    
    # Find all backup files
    local backups=()
    while IFS= read -r -d '' file; do
        backups+=("$file")
    done < <(find "$backup_dir" -name "db_backup_*.sql*" -type f -print0 2>/dev/null | sort -zr)
    
    # Check if any backups exist
    if [[ ${#backups[@]} -eq 0 ]]; then
        print_warning "No backup files found in: $backup_dir"
        print_info "Create a backup first with: ./scripts/backup.sh"
        exit 0
    fi
    
    # Get the last backup file
    local last_backup=""
    if [[ -f "$backup_dir/.last_backup" ]]; then
        last_backup=$(cat "$backup_dir/.last_backup")
    fi
    
    # Print backup list
    printf '%b\n' "${WHITE}Found ${#backups[@]} backup(s):${NC}"
    printf '\n'
    printf '%-50s %-12s %s\n' "FILE" "SIZE" "DATE"
    printf '%s\n' "$(printf '%.0s-' {1..80})"
    
    for backup in "${backups[@]}"; do
        local filename
        filename=$(basename "$backup")
        local file_size
        file_size=$(du -h "$backup" | cut -f1)
        
        # Extract date from filename (db_backup_YYYYMMDD_HHMMSS.sql)
        local backup_date=""
        if [[ "$filename" =~ db_backup_([0-9]{8})_([0-9]{6}) ]]; then
            local date_part="${BASH_REMATCH[1]}"
            local time_part="${BASH_REMATCH[2]}"
            backup_date="${date_part:0:4}-${date_part:4:2}-${date_part:6:2} ${time_part:0:2}:${time_part:2:2}:${time_part:4:2}"
        fi
        
        # Mark the last backup
        local marker=""
        if [[ "$backup" == "$last_backup" ]]; then
            marker="${GREEN} (latest)${NC}"
        fi
        
        printf '%-50s %-12s %s%b\n' "$filename" "$file_size" "$backup_date" "$marker"
    done
    
    printf '\n'
    exit 0
}

# Get the last backup file
get_last_backup() {
    local backup_dir="$PROJECT_ROOT/backups"
    local last_backup_file="$backup_dir/.last_backup"
    
    if [[ ! -f "$last_backup_file" ]]; then
        print_error "No last backup reference found at: $last_backup_file"
        print_info "Specify a backup file or create a backup first with: ./scripts/backup.sh"
        exit 4
    fi
    
    local backup_file
    backup_file=$(cat "$last_backup_file")
    
    if [[ ! -f "$backup_file" ]]; then
        print_error "Last backup file not found: $backup_file"
        print_info "The backup file may have been moved or deleted"
        exit 4
    fi
    
    echo "$backup_file"
}

#===============================================================================
# RESTORE FUNCTIONS
#===============================================================================

# Terminate all existing database connections
terminate_connections() {
    print_info "Terminating existing database connections..."
    
    if docker compose exec -T db psql -U "$POSTGRES_USER" -d postgres -c \
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid();" \
        > /dev/null 2>&1; then
        print_success "All existing connections terminated"
    else
        print_warning "Could not terminate all connections (may be none active)"
    fi
}

# Drop and recreate the database
recreate_database() {
    print_info "Dropping existing database..."
    
    if docker compose exec -T db psql -U "$POSTGRES_USER" -d postgres -c \
        "DROP DATABASE IF EXISTS $POSTGRES_DB;" \
        > /dev/null 2>&1; then
        print_success "Database dropped successfully"
    else
        print_error "Failed to drop database"
        return 1
    fi
    
    print_info "Creating fresh database..."
    
    if docker compose exec -T db psql -U "$POSTGRES_USER" -d postgres -c \
        "CREATE DATABASE $POSTGRES_DB;" \
        > /dev/null 2>&1; then
        print_success "Database created successfully"
    else
        print_error "Failed to create database"
        return 1
    fi
    
    return 0
}

# Restore the database from backup file
perform_restore() {
    local backup_file="$1"
    
    print_info "Restoring database from: $backup_file"
    
    # Check if the backup is compressed
    if [[ "$backup_file" == *.gz ]]; then
        print_info "Detected compressed backup, decompressing on-the-fly..."
        
        if gunzip -c "$backup_file" | docker compose exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB" 2>&1; then
            print_success "Database restored successfully"
            return 0
        else
            print_error "Database restore failed!"
            return 1
        fi
    else
        # Plain SQL backup
        if cat "$backup_file" | docker compose exec -T db psql -U "$POSTGRES_USER" "$POSTGRES_DB" 2>&1; then
            print_success "Database restored successfully"
            return 0
        else
            print_error "Database restore failed!"
            return 1
        fi
    fi
}

# Show confirmation prompt
confirm_restore() {
    local backup_file="$1"
    local force="$2"
    
    # Skip confirmation if force flag is set
    if [[ "$force" == "true" ]]; then
        return 0
    fi
    
    print_header "RESTORE CONFIRMATION"
    print_warning "This operation will:"
    printf '  - Terminate all active database connections\n'
    printf '  - DROP the existing database: %s\n' "$POSTGRES_DB"
    printf '  - Create a fresh database\n'
    printf '  - Restore data from: %s\n' "$backup_file"
    printf '\n'
    print_warning "ALL EXISTING DATA WILL BE LOST!"
    printf '\n'
    
    # Prompt for confirmation
    read -p "Are you sure you want to continue? (yes/no): " -r
    printf '\n'
    
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        print_info "Restore cancelled by user"
        exit 5
    fi
    
    return 0
}

#===============================================================================
# MAIN EXECUTION
#===============================================================================

main() {
    # Parse command line arguments
    local force="false"
    local list_only="false"
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
            -*)
                print_error "Unknown option: $1"
                printf 'Use --help for usage information\n'
                exit 1
                ;;
            *)
                # Assume it's a backup file path
                backup_file="$1"
                shift
                ;;
        esac
    done
    
    # Print banner
    printf '\n'
    printf '%b\n' "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    printf '%b\n' "${CYAN}${BOLD}║              TEV2 DATABASE RESTORE                         ║${NC}"
    printf '%b\n' "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    printf '\n'
    
    # Load environment
    load_env_file
    
    # List backups if requested
    if [[ "$list_only" == "true" ]]; then
        list_backups
    fi
    
    # Determine backup file to restore
    if [[ -z "$backup_file" ]]; then
        print_info "No backup file specified, using last backup..."
        backup_file=$(get_last_backup)
    fi
    
    # Resolve relative path to absolute path
    if [[ "$backup_file" != /* ]]; then
        # Check if path is relative to project root
        if [[ -f "$PROJECT_ROOT/$backup_file" ]]; then
            backup_file="$PROJECT_ROOT/$backup_file"
        elif [[ ! -f "$backup_file" ]]; then
            # Try as absolute path
            print_error "Backup file not found: $backup_file"
            exit 4
        fi
    fi
    
    # Validate backup file
    validate_backup_file "$backup_file"
    
    # Check database status
    check_database_container
    check_database_ready
    
    # Confirm restore
    confirm_restore "$backup_file" "$force"
    
    # Execute restore steps
    print_header "STARTING DATABASE RESTORE"
    print_info "Database: $POSTGRES_DB"
    print_info "User: $POSTGRES_USER"
    print_info "Backup file: $backup_file"
    
    # Perform restore
    terminate_connections
    
    if ! recreate_database; then
        print_header "RESTORE FAILED"
        exit 1
    fi
    
    if perform_restore "$backup_file"; then
        print_header "RESTORE COMPLETE"
        print_info "Database has been successfully restored from:"
        print_info "  $backup_file"
        exit 0
    else
        print_header "RESTORE FAILED"
        print_error "Database restore failed. Check the error messages above."
        exit 1
    fi
}

# Run main function
main "$@"
