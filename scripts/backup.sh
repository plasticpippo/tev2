#!/usr/bin/env bash

#===============================================================================
# TEV2 Database Backup Script
# 
# This script creates backups of the PostgreSQL database running in Docker.
# It supports both plain SQL and compressed (gzip) backup formats.
#
# Usage: ./scripts/backup.sh [OPTIONS]
# Options:
#   -h, --help      Show this help message
#   -c, --compress  Compress the backup with gzip
#
# Examples:
#   ./scripts/backup.sh              # Create plain SQL backup
#   ./scripts/backup.sh --compress   # Create compressed backup
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
TEV2 Database Backup Script

Usage: ./scripts/backup.sh [OPTIONS]

Description:
    Creates a backup of the PostgreSQL database running in Docker Compose.
    Backups are stored in the ./backups/ directory with timestamp-based naming.

Options:
    -h, --help      Show this help message and exit
    -c, --compress  Compress the backup file with gzip

Environment Variables:
    The script reads database credentials from the .env file:
    - POSTGRES_USER     Database username (default: totalevo_user)
    - POSTGRES_PASSWORD Database password (default: totalevo_password)
    - POSTGRES_DB       Database name (default: bar_pos)

Output:
    - Backup file: ./backups/db_backup_YYYYMMDD_HHMMSS.sql[.gz]
    - Last backup reference: ./backups/.last_backup

Examples:
    ./scripts/backup.sh              # Create plain SQL backup
    ./scripts/backup.sh --compress   # Create compressed gzip backup
    ./scripts/backup.sh -c           # Same as above (short form)

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

# Perform the database backup
perform_backup() {
    local compress="$1"
    local backup_dir="$PROJECT_ROOT/backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_dir}/db_backup_${timestamp}.sql"
    
    print_header "STARTING DATABASE BACKUP"
    print_info "Database: $POSTGRES_DB"
    print_info "User: $POSTGRES_USER"
    print_info "Timestamp: $timestamp"
    
    # Run pg_dump inside the database container
    print_info "Creating database dump..."
    
    if docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$backup_file" 2>/dev/null; then
        # Validate the backup file
        if ! validate_backup "$backup_file"; then
            return 1
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
                return 1
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
        
        return 0
    else
        print_error "Database backup failed!"
        print_info "Check if the database container is running and credentials are correct"
        
        # Clean up partial backup file if it exists
        [[ -f "$backup_file" ]] && rm -f "$backup_file"
        
        return 1
    fi
}

# Validate the backup file
validate_backup() {
    local backup_file="$1"
    
    print_info "Validating backup file..."
    
    # Check if file exists
    if [[ ! -f "$backup_file" ]]; then
        print_error "Backup file was not created!"
        return 1
    fi
    
    # Check if file is not empty
    local file_size
    file_size=$(wc -c < "$backup_file")
    
    if [[ "$file_size" -eq 0 ]]; then
        print_error "Backup file is empty!"
        rm -f "$backup_file"
        return 1
    fi
    
    # Check if file contains valid PostgreSQL content
    # A valid dump should contain at least some SQL commands
    if ! grep -qE "(CREATE|INSERT|COPY|PostgreSQL database dump)" "$backup_file" 2>/dev/null; then
        print_warning "Backup file may not contain valid PostgreSQL dump content"
        print_info "First few lines of backup file:"
        head -n 5 "$backup_file"
    fi
    
    print_success "Backup file validated ($file_size bytes)"
    return 0
}

#===============================================================================
# MAIN EXECUTION
#===============================================================================

main() {
    # Parse command line arguments
    local compress="false"
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                ;;
            -c|--compress)
                compress="true"
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
    printf '%b\n' "${CYAN}${BOLD}║              TEV2 DATABASE BACKUP                          ║${NC}"
    printf '%b\n' "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    printf '\n'
    
    # Execute backup steps
    load_env_file
    check_database_container
    check_database_ready
    create_backup_dir
    
    if perform_backup "$compress"; then
        print_header "BACKUP COMPLETE"
        exit 0
    else
        print_header "BACKUP FAILED"
        exit 1
    fi
}

# Run main function
main "$@"
