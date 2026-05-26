#!/usr/bin/env bash

#===============================================================================
# AssoPOS Database Backup Script
# 
# This script creates backups of the PostgreSQL database running in Docker.
# It supports both plain SQL and compressed (gzip) backup formats.
# With --cloud, it also archives Docker volumes and uploads to MEGA.
#
# Usage: ./scripts/backup.sh [OPTIONS]
# Options:
#   -h, --help      Show this help message
#   -c, --compress  Compress the backup with gzip
#   --cloud         Upload full backup archive to MEGA (DB + volumes + config)
#
# Examples:
#   ./scripts/backup.sh              # Create plain SQL backup
#   ./scripts/backup.sh --compress   # Create compressed backup
#   ./scripts/backup.sh --cloud -c   # Compressed backup + upload to MEGA
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
AssoPOS Database Backup Script

Usage: ./scripts/backup.sh [OPTIONS]

Description:
    Creates a backup of the PostgreSQL database running in Docker Compose.
    Backups are stored in the ./backups/ directory with timestamp-based naming.
    With --cloud, also archives Docker volumes and config files, then uploads
    to MEGA cloud storage.

Options:
    -h, --help      Show this help message and exit
    -c, --compress  Compress the backup file with gzip
    --cloud         Create full archive and upload to MEGA
                    Includes: DB dump, storage_data, uploads_data, .env, VERSION

Environment Variables:
    The script reads database credentials from the .env file:
    - POSTGRES_USER     Database username (default: assopos_user)
    - POSTGRES_PASSWORD Database password (default: assopos_password)
    - POSTGRES_DB       Database name (default: assopos)

Output:
    - Local backup: ./backups/db_backup_YYYYMMDD_HHMMSS.sql[.gz]
    - Cloud archive (with --cloud): ./backups/assopos_full_YYYYMMDD_HHMMSS.tar.gz
    - Last backup reference: ./backups/.last_backup
    - Cloud retention: 30 backups (oldest auto-deleted)

Examples:
    ./scripts/backup.sh              # Create plain SQL backup
    ./scripts/backup.sh --compress   # Create compressed gzip backup
    ./scripts/backup.sh -c           # Same as above (short form)
    ./scripts/backup.sh --cloud -c   # Full backup + upload to MEGA

Exit Codes:
    0 - Success
    1 - General error (backup failed, validation failed, etc.)
    2 - Database container not running
    3 - Environment file not found

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
POSTGRES_USER="${POSTGRES_USER:-assopos_user}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-assopos_password}"
POSTGRES_DB="${POSTGRES_DB:-assopos}"

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
        POSTGRES_USER="${POSTGRES_USER:-assopos_user}"
        POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-assopos_password}"
        POSTGRES_DB="${POSTGRES_DB:-assopos}"
        
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

#===============================================================================
# BACKUP FUNCTIONS
#===============================================================================

# Create the backup directory if it doesn't exist
create_backup_dir() {
    local backup_dir="$PROJECT_ROOT/backups"
    
    if [[ ! -d "$backup_dir" ]]; then
        print_info "Creating backups directory: $backup_dir"
        mkdir -p "$backup_dir"
        print_success "Backups directory created"
    else
        print_info "Using existing backups directory: $backup_dir"
    fi
}

#===============================================================================
# CLOUD BACKUP FUNCTIONS
#===============================================================================

readonly MEGA_REMOTE_FOLDER="/AssoPOS/backups"
readonly CLOUD_RETENTION=30

# Create a full backup archive with DB dump + Docker volumes + config
create_cloud_archive() {
    local db_backup_file="$1"
    local backup_dir="$2"
    local timestamp="$3"
    local archive_name="assopos_full_${timestamp}.tar.gz"
    local archive_path="${backup_dir}/${archive_name}"
    local staging_dir="${backup_dir}/_cloud_staging"

    print_info "Preparing cloud backup archive..."

    # Create staging directory
    rm -rf "$staging_dir"
    mkdir -p "$staging_dir"

    # 1. Copy database dump
    print_info "  Adding database dump..."
    mkdir -p "$staging_dir/database"
    cp "$db_backup_file" "$staging_dir/database/"

    # 2. Export Docker volumes
    print_info "  Exporting Docker volumes..."

    # Export storage_data volume
    mkdir -p "$staging_dir/volumes"
    if docker volume inspect storage_data &>/dev/null; then
        print_info "  Exporting storage_data..."
        docker run --rm -v storage_data:/data:ro -v "$staging_dir/volumes":/output alpine \
            tar czf /output/storage_data.tar.gz -C /data . 2>/dev/null || true
        if [[ -f "$staging_dir/volumes/storage_data.tar.gz" ]]; then
            local storage_size
            storage_size=$(du -h "$staging_dir/volumes/storage_data.tar.gz" | cut -f1)
            print_success "  storage_data exported ($storage_size)"
        else
            print_warning "  storage_data is empty or not accessible"
        fi
    else
        print_warning "  storage_data volume not found"
    fi

    # Export uploads_data volume
    if docker volume inspect uploads_data &>/dev/null; then
        print_info "  Exporting uploads_data..."
        docker run --rm -v uploads_data:/data:ro -v "$staging_dir/volumes":/output alpine \
            tar czf /output/uploads_data.tar.gz -C /data . 2>/dev/null || true
        if [[ -f "$staging_dir/volumes/uploads_data.tar.gz" ]]; then
            local uploads_size
            uploads_size=$(du -h "$staging_dir/volumes/uploads_data.tar.gz" | cut -f1)
            print_success "  uploads_data exported ($uploads_size)"
        else
            print_warning "  uploads_data is empty or not accessible"
        fi
    else
        print_warning "  uploads_data volume not found"
    fi

    # 3. Copy config files
    print_info "  Adding configuration files..."
    mkdir -p "$staging_dir/config"
    [[ -f "$PROJECT_ROOT/.env" ]] && cp "$PROJECT_ROOT/.env" "$staging_dir/config/"
    [[ -f "$PROJECT_ROOT/VERSION" ]] && cp "$PROJECT_ROOT/VERSION" "$staging_dir/config/"

    # 4. Write manifest
    cat > "$staging_dir/MANIFEST.txt" << MANIFEST
AssoPOS Cloud Backup Archive
Created: $(date -Iseconds)
App Version: $(grep '^VERSION=' "$PROJECT_ROOT/VERSION" 2>/dev/null | cut -d'=' -f2 || echo "unknown")
Database: $POSTGRES_DB
DB Backup: $(basename "$db_backup_file")
Contents:
  database/   - PostgreSQL dump file
  volumes/    - Docker volume exports (storage_data, uploads_data)
  config/     - .env and VERSION files
MANIFEST

    # 5. Create tar.gz archive
    print_info "  Creating archive: $archive_name"
    tar czf "$archive_path" -C "$staging_dir" . 

    # Clean up staging
    rm -rf "$staging_dir"

    local archive_size
    archive_size=$(du -h "$archive_path" | cut -f1)
    print_success "Cloud archive created: $archive_path ($archive_size)"

    echo "$archive_path"
}

# Upload archive to MEGA and rotate old backups
upload_to_mega() {
    local archive_path="$1"

    print_info "Checking MEGA login..."
    if ! mega-whoami 2>&1 | grep -q "@"; then
        print_error "Not logged into MEGA. Run: ./scripts/setup-cloud-backup.sh"
        return 1
    fi

    # Ensure remote folder exists
    mega-mkdir /AssoPOS 2>/dev/null || true
    mega-mkdir "$MEGA_REMOTE_FOLDER" 2>/dev/null || true

    print_info "Uploading to MEGA: $MEGA_REMOTE_FOLDER/$(basename "$archive_path")"
    if mega-put "$archive_path" "$MEGA_REMOTE_FOLDER/" 2>&1; then
        print_success "Upload complete"
    else
        print_error "Upload failed"
        return 1
    fi

    # Rotate old backups
    print_info "Rotating cloud backups (keeping last $CLOUD_RETENTION)..."
    local backups
    backups=$(mega-find "$MEGA_REMOTE_FOLDER" --pattern="assopos_full_*.tar.gz" --time-format="%s" 2>/dev/null | sort -n || true)

    local count
    count=$(echo "$backups" | grep -c "assopos_full_" || true)
    
    if [[ "$count" -gt "$CLOUD_RETENTION" ]]; then
        local to_delete=$((count - CLOUD_RETENTION))
        print_info "  Removing $to_delete old backup(s)..."
        echo "$backups" | head -n "$to_delete" | while IFS= read -r old_backup; do
            local backup_name
            backup_name=$(echo "$old_backup" | awk '{print $NF}' | xargs basename 2>/dev/null || echo "")
            if [[ -n "$backup_name" ]]; then
                print_info "  Deleting: $backup_name"
                mega-rm "${MEGA_REMOTE_FOLDER}/${backup_name}" 2>/dev/null || true
            fi
        done
        print_success "Rotation complete ($count -> $CLOUD_RETENTION)"
    else
        print_info "  $count/$CLOUD_RETENTION backups stored, no rotation needed"
    fi

    return 0
}

#===============================================================================
# MAIN EXECUTION
#===============================================================================

main() {
    # Parse command line arguments
    local compress="false"
    local cloud="false"
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                ;;
            -c|--compress)
                compress="true"
                shift
                ;;
            --cloud)
                cloud="true"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                printf 'Use --help for usage information\n'
                exit 1
                ;;
        esac
    done
    
    # Print banner
    printf '\n'
    printf '%b\n' "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    printf '%b\n' "${CYAN}${BOLD}║              AssoPOS DATABASE BACKUP                          ║${NC}"
    printf '%b\n' "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    printf '\n'
    
    # Execute backup steps
    load_env_file
    check_database_container
    check_database_ready
    create_backup_dir
    
    # Track timestamp for consistent naming
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)

    # Perform the database backup (override timestamp to use ours)
    local backup_dir="$PROJECT_ROOT/backups"
    local backup_file="${backup_dir}/db_backup_${timestamp}.sql"
    
    print_header "STARTING DATABASE BACKUP"
    print_info "Database: $POSTGRES_DB"
    print_info "User: $POSTGRES_USER"
    print_info "Timestamp: $timestamp"
    if [[ "$cloud" == "true" ]]; then
        print_info "Cloud upload: enabled"
    fi
    
    # Read app version for metadata
    local app_version="unknown"
    if [[ -f "$PROJECT_ROOT/VERSION" ]]; then
        app_version=$(grep '^VERSION=' "$PROJECT_ROOT/VERSION" | cut -d'=' -f2)
    fi
    
    # Run pg_dump inside the database container
    print_info "Creating database dump..."
    
    # Write backup metadata header
    {
        echo "-- AssoPOS Database Backup"
        echo "-- App Version: $app_version"
        echo "-- Timestamp: $(date -Iseconds)"
        echo "-- Database: $POSTGRES_DB"
        echo ""
    } > "$backup_file"
    
    if ! docker compose exec -T db pg_dump --no-owner --no-acl -U "$POSTGRES_USER" "$POSTGRES_DB" >> "$backup_file" 2>/dev/null; then
        print_error "Database backup failed!"
        print_info "Check if the database container is running and credentials are correct"
        [[ -f "$backup_file" ]] && rm -f "$backup_file"
        print_header "BACKUP FAILED"
        exit 1
    fi

    # Validate the backup file
    if ! validate_backup "$backup_file"; then
        print_header "BACKUP FAILED"
        exit 1
    fi
    
    # Compress if requested
    if [[ "$compress" == "true" ]]; then
        print_info "Compressing backup file..."
        if gzip -f "$backup_file"; then
            backup_file="${backup_file}.gz"
            print_success "Backup compressed successfully"
        else
            print_error "Failed to compress backup file"
            rm -f "$backup_file"
            print_header "BACKUP FAILED"
            exit 1
        fi
    fi
    
    # Report file size
    local file_size
    file_size=$(du -h "$backup_file" | cut -f1)
    print_success "Backup created: $backup_file"
    print_info "File size: $file_size"
    
    # Store the backup path in .last_backup file
    echo "$backup_file" > "${backup_dir}/.last_backup"
    print_info "Backup path stored in: ${backup_dir}/.last_backup"

    # Cloud upload if requested
    if [[ "$cloud" == "true" ]]; then
        print_header "CLOUD BACKUP"

        local archive_path
        archive_path=$(create_cloud_archive "$backup_file" "$backup_dir" "$timestamp")

        if [[ -n "$archive_path" ]] && [[ -f "$archive_path" ]]; then
            if command -v mega-put &>/dev/null; then
                if upload_to_mega "$archive_path"; then
                    rm -f "$archive_path"
                    print_success "Local cloud archive cleaned up (DB dump preserved)"
                else
                    print_warning "Cloud upload failed. Archive kept locally: $archive_path"
                fi
            else
                print_info "MEGA CMD not available locally. Archive ready for upload: $archive_path"
                print_info "ARCHIVE_PATH=$archive_path"
            fi
        fi
    fi

    print_header "BACKUP COMPLETE"
}

# Run main function
main "$@"
