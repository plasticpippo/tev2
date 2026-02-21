#!/usr/bin/env bash

#===============================================================================
# TEV2 Installation Script
# 
# This script automates the installation of the TEV2 application including:
# - Linux distribution detection
# - Docker and Docker Compose installation
# - Interactive environment configuration
# - Container build and deployment
#
# Usage: ./install.sh [OPTIONS]
# Options:
#   -h, --help          Show this help message
#   -n, --non-interactive  Run in non-interactive mode with defaults
#   --skip-docker       Skip Docker installation
#===============================================================================

# Strict mode for better error handling
set -euo pipefail

# Enable error tracing (defined after print_error function)
# trap will be set up after function definitions

#===============================================================================
# COLOR DEFINITIONS
#===============================================================================
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly MAGENTA='\033[0;35m'
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

print_step() {
    printf '%b\n' "${MAGENTA}[STEP]${NC} ${BOLD}$1${NC}"
}

print_progress() {
    local current=$1
    local total=$2
    local message=$3
    printf '%b\n' "${BLUE}[$current/$total]${NC} $message"
}

print_config_summary() {
    printf '\n'
    printf '%b\n' "${WHITE}${BOLD}Configuration Summary:${NC}"
    printf '%b\n' "${WHITE}----------------------------------------${NC}"
    while IFS='=' read -r key value; do
        printf "  ${CYAN}%-25s${NC} %s\n" "$key" "$value"
    done < <(printf '%s\n' "$1" | grep -v '^$')
    printf '%b\n' "${WHITE}----------------------------------------${NC}"
    printf '\n'
}

show_spinner() {
    local pid=$1
    local message=$2
    local spin='-\|/'
    local i=0
    
    while kill -0 "$pid" 2>/dev/null; do
        i=$(( (i+1) % 4 ))
        printf '\r%b [%c] %s' "${BLUE}" "${spin:$i:1}" "$message"
        sleep 0.1
    done
    printf '\r'
}

confirm() {
    local prompt=$1
    local default=${2:-n}
    local response
    
    if [[ "$NON_INTERACTIVE" == "true" ]]; then
        echo "$default"
        return
    fi
    
    if [[ "$default" == "y" ]]; then
        prompt="$prompt [Y/n]: "
    else
        prompt="$prompt [y/N]: "
    fi
    
    read -r -p "$prompt" response
    response=${response:-$default}
    
    [[ "$response" =~ ^[Yy]$ ]]
}

prompt_input() {
    local prompt=$1
    local default=$2
    local is_password=${3:-false}
    local response
    
    if [[ "$NON_INTERACTIVE" == "true" ]]; then
        echo "$default"
        return
    fi
    
    if [[ "$is_password" == "true" ]]; then
        read -r -s -p "$prompt [$default]: " response
        echo ""
        response=${response:-$default}
    else
        read -r -p "$prompt [$default]: " response
        response=${response:-$default}
    fi
    
    echo "$response"
}

validate_port() {
    local port=$1
    if [[ "$port" =~ ^[0-9]+$ ]] && [ "$port" -ge 1 ] && [ "$port" -le 65535 ]; then
        return 0
    else
        return 1
    fi
}

validate_url() {
    local url=$1
    if [[ "$url" =~ ^https?:// ]]; then
        return 0
    else
        return 1
    fi
}

generate_secure_password() {
    openssl rand -base64 24 | tr -d '/+=' | head -c 32
}

generate_jwt_secret() {
    openssl rand -hex 64
}

#===============================================================================
# VERSION TRACKING FUNCTIONS
#===============================================================================

# Get current installed version
get_installed_version() {
    if [[ -f ".version" ]]; then
        grep "VERSION=" .version | cut -d'=' -f2
    else
        echo "0.0.0"
    fi
}

# Get new version from VERSION file
get_new_version() {
    if [[ -f "VERSION" ]]; then
        grep "VERSION=" VERSION | cut -d'=' -f2
    else
        echo "unknown"
    fi
}

# Compare versions (returns 0 if upgrade needed, 1 if same or newer installed)
compare_versions() {
    local current="$1"
    local new="$2"
    
    # If current is 0.0.0, this is a fresh install
    if [[ "$current" == "0.0.0" ]]; then
        return 0
    fi
    
    # Simple version comparison
    if [[ "$(printf '%s\n' "$current" "$new" | sort -V | head -n1)" != "$new" ]]; then
        return 0  # Upgrade needed
    fi
    return 1  # Same or newer installed
}

# Save installed version
save_installed_version() {
    local version="$1"
    echo "VERSION=$version" > .version
    echo "INSTALL_DATE=$(date -I)" >> .version
    echo "INSTALL_TYPE=upgrade" >> .version
}

#===============================================================================
# DATABASE BACKUP FUNCTIONS
#===============================================================================

# Backup database before upgrade
backup_database() {
    local backup_dir="./backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_dir}/db_backup_${timestamp}.sql"
    
    mkdir -p "$backup_dir"
    
    print_info "Creating database backup..."
    
    # Run pg_dump inside the database container
    if docker compose exec -T db pg_dump -U totalevo_user bar_pos > "$backup_file" 2>/dev/null; then
        # Verify backup file was created and is not empty
        if [[ ! -f "$backup_file" ]]; then
            print_error "Backup file was not created!"
            return 1
        fi
        
        local backup_size
        backup_size=$(wc -c < "$backup_file")
        if [[ "$backup_size" -eq 0 ]]; then
            print_error "Backup file is empty!"
            rm -f "$backup_file"
            return 1
        fi
        
        local size=$(du -h "$backup_file" | cut -f1)
        print_success "Database backup created: $backup_file ($size)"
        echo "$backup_file" > "${backup_dir}/.last_backup"
        return 0
    else
        print_error "Database backup failed!"
        return 1
    fi
}

# Restore database from backup
restore_database() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        print_error "Backup file not found: $backup_file"
        return 1
    fi
    
    print_info "Restoring database from: $backup_file"
    
    # Drop existing connections and restore
    docker compose exec -T db psql -U totalevo_user -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'bar_pos' AND pid <> pg_backend_pid();" 2>/dev/null
    docker compose exec -T db psql -U totalevo_user -d postgres -c "DROP DATABASE IF EXISTS bar_pos;" 2>/dev/null
    docker compose exec -T db psql -U totalevo_user -d postgres -c "CREATE DATABASE bar_pos;" 2>/dev/null
    
    if cat "$backup_file" | docker compose exec -T db psql -U totalevo_user bar_pos > /dev/null 2>&1; then
        print_success "Database restored successfully"
        return 0
    else
        print_error "Database restore failed!"
        return 1
    fi
}

# Get last backup file
get_last_backup() {
    if [[ -f "./backups/.last_backup" ]]; then
        cat "./backups/.last_backup"
    else
        echo ""
    fi
}

#===============================================================================
# ENVIRONMENT VARIABLE MERGE FUNCTIONS
#===============================================================================

# Merge new environment variables from .env.example
merge_env_variables() {
    local env_file=".env"
    local example_file=".env.example"
    
    if [[ ! -f "$example_file" ]]; then
        print_info "No .env.example found, skipping env merge"
        return 0
    fi
    
    if [[ ! -f "$env_file" ]]; then
        print_info "No existing .env found, copying from example"
        cp "$example_file" "$env_file"
        return 0
    fi
    
    print_info "Checking for new environment variables..."
    
    local new_vars=0
    local temp_file=$(mktemp)
    
    # Read existing variables
    declare -A existing_vars
    while IFS='=' read -r key value; do
        [[ -z "$key" || "$key" =~ ^# ]] && continue
        existing_vars["$key"]=1
    done < "$env_file"
    
    # Check for new variables in example
    while IFS='=' read -r key value; do
        [[ -z "$key" || "$key" =~ ^# ]] && continue
        if [[ -z "${existing_vars[$key]}" ]]; then
            echo "$key=$value" >> "$temp_file"
            print_info "  Adding new variable: $key"
            ((new_vars++))
        fi
    done < "$example_file"
    
    if [[ $new_vars -gt 0 ]]; then
        echo "" >> "$env_file"
        echo "# === Added during upgrade ($(date -I)) ===" >> "$env_file"
        cat "$temp_file" >> "$env_file"
        print_success "Added $new_vars new environment variables to .env"
    else
        print_info "No new environment variables to add"
    fi
    
    rm -f "$temp_file"
    return 0
}

#===============================================================================
# POST-UPGRADE VALIDATION FUNCTIONS
#===============================================================================

# Validate upgrade was successful
validate_upgrade() {
    print_info "Validating upgrade..."
    local errors=0
    
    # Check if containers are running
    if ! docker compose ps | grep -q "backend.*running"; then
        print_error "Backend container is not running"
        ((errors++))
    fi
    
    if ! docker compose ps | grep -q "frontend.*running"; then
        print_error "Frontend container is not running"
        ((errors++))
    fi
    
    if ! docker compose ps | grep -q "db.*running"; then
        print_error "Database container is not running"
        ((errors++))
    fi
    
    # Check database connectivity
    if ! docker compose exec -T db pg_isready -U totalevo_user > /dev/null 2>&1; then
        print_error "Database is not ready"
        ((errors++))
    fi
    
    # Check backend health endpoint
    if command -v curl &> /dev/null; then
        if ! curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
            print_warning "Backend health check failed (may still be starting)"
        fi
    fi
    
    if [[ $errors -eq 0 ]]; then
        print_success "Upgrade validation passed"
        return 0
    else
        print_error "Upgrade validation failed with $errors errors"
        return 1
    fi
}

#===============================================================================
# MIGRATION VERIFICATION FUNCTIONS
#===============================================================================

# Resolve failed migrations in the database
resolve_failed_migrations() {
    print_info "Checking for failed migrations..."
    
    # Check if the database container is running
    if ! docker compose ps | grep -q "db.*running"; then
        print_warning "Database container is not running, skipping migration check"
        return 0
    fi
    
    # Check for failed migrations in _prisma_migrations table
    local failed_count
    failed_count=$(docker compose exec -T db psql -U totalevo_user -d bar_pos -t -c \
        "SELECT COUNT(*) FROM _prisma_migrations WHERE finished_at IS NULL AND started_at IS NOT NULL;" 2>/dev/null | tr -d ' ')
    
    if [[ -z "$failed_count" ]]; then
        # Table might not exist yet (fresh install)
        print_info "Migration table not found (likely fresh install)"
        return 0
    fi
    
    if [[ "$failed_count" -gt 0 ]]; then
        print_warning "Found $failed_count failed migration(s)"
        
        # Get list of failed migrations
        print_info "Failed migrations:"
        docker compose exec -T db psql -U totalevo_user -d bar_pos -c \
            "SELECT migration_name, started_at FROM _prisma_migrations WHERE finished_at IS NULL AND started_at IS NOT NULL;" 2>/dev/null
        
        # Delete failed migration records to allow retry
        print_info "Marking failed migrations as rolled back..."
        docker compose exec -T db psql -U totalevo_user -d bar_pos -c \
            "DELETE FROM _prisma_migrations WHERE finished_at IS NULL AND started_at IS NOT NULL;" 2>/dev/null
        
        print_success "Failed migrations have been cleared"
    else
        print_info "No failed migrations found"
    fi
    
    return 0
}

# Verify database migrations are applied correctly
verify_migrations() {
    local max_attempts=30
    local attempt=0
    
    print_info "Verifying database migrations..."
    
    # Wait for backend to be ready
    while [[ $attempt -lt $max_attempts ]]; do
        if docker compose exec -T backend pg_isready -h db -U totalevo_user > /dev/null 2>&1; then
            break
        fi
        attempt=$((attempt + 1))
        sleep 1
    done
    
    if [[ $attempt -ge $max_attempts ]]; then
        print_warning "Backend not ready after ${max_attempts}s, skipping migration verification"
        return 0  # Don't fail, migrations may still be running
    fi
    
    # Run prisma migrate status inside backend container
    local migrate_status
    migrate_status=$(docker compose exec -T backend npx prisma migrate status 2>&1)
    local status_code=$?
    
    if [[ $status_code -eq 0 ]]; then
        print_success "Database migrations verified successfully"
        echo "$migrate_status" | grep -E "Database schema is up to date|already in sync" > /dev/null 2>&1 && \
            print_info "All migrations are applied"
        return 0
    else
        # Check if it's just a warning or actual error
        if echo "$migrate_status" | grep -qE "error|Error|ERROR"; then
            print_error "Migration verification failed"
            print_info "Migration status output:"
            echo "$migrate_status"
            return 1
        else
            print_warning "Migration verification returned warnings"
            return 0
        fi
    fi
}

#===============================================================================
# UPGRADE FLOW FUNCTIONS
#===============================================================================

# Main upgrade function
perform_upgrade() {
    local current_version=$(get_installed_version)
    local new_version=$(get_new_version)
    
    print_header "UPGRADE MODE"
    print_info "Current version: $current_version"
    print_info "New version: $new_version"
    
    # 1. Backup database
    if ! backup_database; then
        print_error "Database backup failed. Aborting upgrade."
        return 1
    fi
    
    # 2. Stop containers
    print_info "Stopping containers..."
    docker compose down
    
    # 3. Merge environment variables
    merge_env_variables
    
    # 4. Pull new images / rebuild
    print_info "Building new containers..."
    docker compose build --no-cache
    
    # 5. Start database container first
    print_info "Starting database container..."
    docker compose up -d db
    
    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    local db_attempts=0
    while [[ $db_attempts -lt 30 ]]; do
        if docker compose exec -T db pg_isready -U totalevo_user > /dev/null 2>&1; then
            print_success "Database is ready"
            break
        fi
        db_attempts=$((db_attempts + 1))
        sleep 1
    done
    
    if [[ $db_attempts -ge 30 ]]; then
        print_error "Database failed to start"
        return 1
    fi
    
    # 6. Resolve any failed migrations before starting backend
    resolve_failed_migrations
    
    # 7. Start remaining containers (migrations run automatically)
    print_info "Starting containers..."
    docker compose up -d
    
    # 8. Wait for containers to be ready
    print_info "Waiting for containers to start..."
    sleep 10
    
    # 9. Verify migrations
    verify_migrations
    
    # 10. Validate upgrade
    if validate_upgrade; then
        save_installed_version "$new_version"
        print_success "=========================================="
        print_success "UPGRADE COMPLETE: $current_version -> $new_version"
        print_success "=========================================="
        print_info ""
        print_info "Upgrade Summary:"
        print_info "  - Database backup created in ./backups/"
        print_info "  - Containers rebuilt with new version"
        print_info "  - Database migrations applied automatically"
        if [[ "$new_version" =~ "2026.02.20" ]] || [[ "$new_version" > "2026.02.19" ]]; then
            print_info "  - Payment method normalization migration applied (if applicable)"
        fi
        return 0
    else
        print_error "=========================================="
        print_error "UPGRADE VALIDATION FAILED"
        print_error "=========================================="
        print_info "To rollback, run: ./install.sh --restore-backup"
        return 1
    fi
}

# Restore from backup option
restore_from_backup() {
    local backup_file=$(get_last_backup)
    
    if [[ -z "$backup_file" ]]; then
        print_error "No backup found to restore"
        return 1
    fi
    
    print_info "This will restore the database from: $backup_file"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Restore cancelled"
        return 1
    fi
    
    docker compose up -d db
    sleep 5
    restore_database "$backup_file"
}

# Set up error trap after functions are defined
trap 'print_error "Error on line $LINENO. Command: $BASH_COMMAND"' ERR

#===============================================================================
# HELP FUNCTION
#===============================================================================

show_help() {
    cat << 'EOF'
TEV2 Installation Script

Usage: ./install.sh [OPTIONS]

Options:
  -h, --help            Show this help message and exit
  -n, --non-interactive Run in non-interactive mode with default values
  --skip-docker         Skip Docker installation (use if Docker is already installed)
  --reset-db            Reset the database volume (WARNING: deletes all data!)
  --url URL             Set application URL (for non-interactive mode)
  --nginx-port PORT     Set Nginx port (for non-interactive mode)
  --db-user USER        Set database username (for non-interactive mode)
  --db-password PASS    Set database password (for non-interactive mode)
  --db-name NAME        Set database name (for non-interactive mode)
  --env ENV             Set environment (development/production)

Examples:
  ./install.sh                    # Interactive installation
  ./install.sh --non-interactive  # Non-interactive with defaults
  ./install.sh --skip-docker      # Skip Docker installation
  ./install.sh --url http://192.168.1.100 --nginx-port 8080
  ./install.sh --reset-db         # Reset database and start fresh

EOF
    exit 0
}

#===============================================================================
# PREREQUISITE CHECKS
#===============================================================================

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if running on Linux
    if [[ "$(uname -s)" != "Linux" ]]; then
        print_error "This script is designed for Linux systems only."
        exit 1
    fi
    print_success "Running on Linux"
    
    # Check for root/sudo access
    if [[ $EUID -ne 0 ]]; then
        if ! command -v sudo &> /dev/null; then
            print_error "This script requires root privileges or sudo access."
            exit 1
        fi
        SUDO="sudo"
        print_info "Will use sudo for privileged operations"
    else
        SUDO=""
        print_success "Running as root"
    fi
    
    # Check for required commands
    local required_commands=("curl" "wget" "openssl" "gawk" "hostname")
    local missing_commands=()
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_commands+=("$cmd")
        fi
    done
    
    if [[ ${#missing_commands[@]} -gt 0 ]]; then
        print_warning "Missing required commands: ${missing_commands[*]}"
        print_info "Attempting to install missing commands..."
        install_basic_tools
    fi
    
    print_success "All prerequisites met"
}

install_basic_tools() {
    # Call detect_distro if not already detected
    if [[ -z "$DISTRO_FAMILY" ]]; then
        detect_distro
    fi
    
    print_info "Installing basic tools (curl, wget, openssl, gawk, hostname)..."
    
    case "$DISTRO_FAMILY" in
        debian)
            $SUDO apt-get update -qq
            DEBIAN_FRONTEND=noninteractive $SUDO apt-get install -y -qq curl wget openssl gawk hostname
            ;;
        redhat)
            $SUDO dnf install -y -q curl wget openssl gawk hostname 2>/dev/null || $SUDO yum install -y -q curl wget openssl gawk hostname
            ;;
        arch)
            $SUDO pacman -S --noconfirm --needed curl wget openssl gawk inetutils
            ;;
        suse)
            $SUDO zypper --non-interactive install -y curl wget openssl gawk hostname
            ;;
        alpine)
            $SUDO apk add --no-cache curl wget openssl gawk hostname
            ;;
    esac
    
    # Verify installation
    local failed=()
    for cmd in curl wget openssl gawk hostname; do
        if ! command -v "$cmd" &> /dev/null; then
            failed+=("$cmd")
        fi
    done
    
    if [[ ${#failed[@]} -gt 0 ]]; then
        print_error "Failed to install the following tools: ${failed[*]}"
        return 1
    fi
    
    print_success "Basic tools installed successfully"
}

#===============================================================================
# DISTRIBUTION DETECTION
#===============================================================================

detect_distro() {
    print_step "Detecting Linux distribution..."
    
    DISTRO=""
    DISTRO_FAMILY=""
    DISTRO_VERSION=""
    
    # Check /etc/os-release first
    if [[ -f /etc/os-release ]]; then
        # shellcheck source=/dev/null
        source /etc/os-release
        DISTRO="${ID}"
        # shellcheck disable=SC2034 # DISTRO_VERSION is used for display/logging
        DISTRO_VERSION="${VERSION_ID:-unknown}"
        
        # Determine distro family
        case "$ID" in
            ubuntu|debian|linuxmint|pop|elementary|kali|mx)
                DISTRO_FAMILY="debian"
                ;;
            fedora|rhel|centos|almalinux|rocky|ol|scientific)
                DISTRO_FAMILY="redhat"
                ;;
            arch|manjaro|endeavouros|garuda|arco)
                DISTRO_FAMILY="arch"
                ;;
            opensuse*|sles|sled)
                DISTRO_FAMILY="suse"
                ;;
            alpine)
                DISTRO_FAMILY="alpine"
                ;;
            *)
                # Check ID_LIKE for derivative distributions
                case "${ID_LIKE:-}" in
                    *debian*|*ubuntu*)
                        DISTRO_FAMILY="debian"
                        ;;
                    *rhel*|*fedora*|*centos*)
                        DISTRO_FAMILY="redhat"
                        ;;
                    *arch*)
                        DISTRO_FAMILY="arch"
                        ;;
                    *suse*)
                        DISTRO_FAMILY="suse"
                        ;;
                    *)
                        print_error "Unsupported distribution: $ID"
                        print_info "Supported distributions: Ubuntu/Debian, Fedora/RHEL/CentOS, Arch/Manjaro, openSUSE, Alpine"
                        exit 1
                        ;;
                esac
                ;;
        esac
    else
        # Fallback detection methods
        if [[ -f /etc/debian_version ]]; then
            DISTRO_FAMILY="debian"
            DISTRO="debian"
        elif [[ -f /etc/redhat-release ]]; then
            DISTRO_FAMILY="redhat"
            DISTRO="rhel"
        elif [[ -f /etc/arch-release ]]; then
            DISTRO_FAMILY="arch"
            DISTRO="arch"
        elif [[ -f /etc/SuSE-release ]]; then
            DISTRO_FAMILY="suse"
            DISTRO="suse"
        elif [[ -f /etc/alpine-release ]]; then
            DISTRO_FAMILY="alpine"
            DISTRO="alpine"
        else
            print_error "Could not detect Linux distribution"
            exit 1
        fi
    fi
    
    print_success "Detected: ${PRETTY_NAME:-$DISTRO} ($DISTRO_FAMILY family)"
}

#===============================================================================
# DOCKER INSTALLATION FUNCTIONS
#===============================================================================

check_docker_installed() {
    if command -v docker &> /dev/null && docker --version &> /dev/null; then
        # shellcheck disable=SC2034 # DOCKER_INSTALLED is used for external state tracking
        DOCKER_INSTALLED=true
        print_success "Docker is already installed: $(docker --version)"
        return 0
    fi
    # shellcheck disable=SC2034 # DOCKER_INSTALLED is used for external state tracking
    DOCKER_INSTALLED=false
    return 1
}

check_docker_compose_installed() {
    if docker compose version &> /dev/null 2>&1; then
        # shellcheck disable=SC2034 # DOCKER_COMPOSE_INSTALLED is used for external state tracking
        DOCKER_COMPOSE_INSTALLED=true
        print_success "Docker Compose is already installed: $(docker compose version)"
        return 0
    elif command -v docker-compose &> /dev/null; then
        # shellcheck disable=SC2034 # DOCKER_COMPOSE_INSTALLED is used for external state tracking
        DOCKER_COMPOSE_INSTALLED=true
        print_success "Docker Compose is already installed: $(docker-compose --version)"
        return 0
    fi
    # shellcheck disable=SC2034 # DOCKER_COMPOSE_INSTALLED is used for external state tracking
    DOCKER_COMPOSE_INSTALLED=false
    return 1
}

install_docker_debian() {
    print_info "Installing Docker for Debian/Ubuntu..."
    
    # Remove old versions
    $SUDO apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Update package index
    $SUDO apt-get update -qq
    
    # Install dependencies
    $SUDO apt-get install -y -qq \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    local keyring_dir="/usr/share/keyrings"
    $SUDO mkdir -p "$keyring_dir"
    
    # Determine the actual distro for Docker repo (map derivatives to their parent)
    local docker_distro="$DISTRO"
    case "$DISTRO" in
        linuxmint|pop|elementary|kali|mx)
            # These are Ubuntu/Debian derivatives - try Ubuntu first, then Debian
            if curl -fsSL "https://download.docker.com/linux/ubuntu/dists/$(. /etc/os-release && echo "$VERSION_CODENAME")/" &>/dev/null; then
                docker_distro="ubuntu"
            else
                docker_distro="debian"
            fi
            ;;
    esac
    
    # Add Docker's official GPG key with proper error handling
    if ! curl -fsSL "https://download.docker.com/linux/${docker_distro}/gpg" | $SUDO gpg --dearmor -o "$keyring_dir/docker.gpg" 2>&1; then
        print_error "Failed to import Docker GPG key"
        print_info "This could be a network issue or the keyring directory is not accessible"
        exit 1
    fi
    
    # Set up repository
    local arch
    local codename
    arch=$(dpkg --print-architecture)
    codename=$(. /etc/os-release && echo "$VERSION_CODENAME")
    
    # Fallback if VERSION_CODENAME is empty (minimal/custom Debian builds)
    if [[ -z "$codename" ]]; then
        codename=$(lsb_release -cs 2>/dev/null || grep -oP 'VERSION_CODENAME=\K\w+' /etc/os-release 2>/dev/null || true)
    fi
    
    # Handle derivatives that might not have a Docker repo
    if [[ -z "$codename" ]] || ! curl -fsSL "https://download.docker.com/linux/$docker_distro/dists/$codename/" &>/dev/null; then
        # Try to detect Ubuntu version from ID_LIKE or default to a known stable version
        if [[ "$docker_distro" == "ubuntu" ]]; then
            codename="jammy"  # Ubuntu 22.04 LTS (most compatible)
        else
            codename="bookworm"  # Debian 12
        fi
    fi
    
    echo "deb [arch=$arch signed-by=$keyring_dir/docker.gpg] https://download.docker.com/linux/$docker_distro $codename stable" | \
        $SUDO tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    $SUDO apt-get update -qq
    $SUDO apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    print_success "Docker installed successfully"
}

install_docker_redhat() {
    print_info "Installing Docker for RHEL/Fedora/CentOS..."
    
    # Remove old versions (ignore errors if packages don't exist)
    $SUDO dnf remove -y docker docker-client docker-client-latest docker-common \
        docker-latest docker-latest-logrotate docker-logrotate docker-selinux \
        docker-engine-selinux docker-engine 2>/dev/null || true
    
    # Install dnf-plugins-core if needed
    $SUDO dnf install -y -q dnf-plugins-core 2>/dev/null || $SUDO yum install -y -q yum-utils 2>/dev/null || true
    
    # Detect if we're using dnf5 (Fedora 41+) by checking the major version
    local is_dnf5=false
    if command -v dnf &> /dev/null; then
        local dnf_major
        # Extract first number from version (compatible with both GNU and BSD grep)
        dnf_major=$(dnf --version 2>/dev/null | head -1 | grep -o '[0-9]*' | head -1)
        dnf_major=${dnf_major:-4}  # Default to 4 if detection fails
        if [[ "$dnf_major" -ge 5 ]]; then
            is_dnf5=true
            print_info "Detected dnf5 (version $dnf_major)"
        fi
    fi
    
    # Add Docker repository
    local repo_url
    if [[ "$DISTRO" == "fedora" ]]; then
        repo_url="https://download.docker.com/linux/fedora/docker-ce.repo"
    else
        repo_url="https://download.docker.com/linux/centos/docker-ce.repo"
    fi
    
    # Try different methods to add the repository
    local repo_added=false
    
    # Method 1: dnf5 syntax (Fedora 41+)
    if [[ "$is_dnf5" == "true" ]]; then
        print_info "Trying dnf5 syntax to add repository..."
        if $SUDO dnf config-manager addrepo --from-repofile="$repo_url" 2>&1; then
            print_info "Added Docker repository using dnf5 syntax"
            repo_added=true
        fi
    fi
    
    # Method 2: dnf4 syntax (older Fedora/RHEL)
    if [[ "$repo_added" == "false" ]] && [[ "$is_dnf5" == "false" ]]; then
        print_info "Trying dnf4 syntax to add repository..."
        if $SUDO dnf config-manager --add-repo "$repo_url" 2>&1; then
            print_info "Added Docker repository using dnf4 syntax"
            repo_added=true
        fi
    fi
    
    # Method 3: yum-config-manager (RHEL/CentOS fallback)
    if [[ "$repo_added" == "false" ]]; then
        print_info "Trying yum-config-manager to add repository..."
        if $SUDO yum-config-manager --add-repo "$repo_url" 2>&1; then
            print_info "Added Docker repository using yum-config-manager"
            repo_added=true
        fi
    fi
    
    # Method 4: Direct download (most reliable fallback)
    if [[ "$repo_added" == "false" ]]; then
        print_info "Adding Docker repository by direct download..."
        if command -v curl &> /dev/null; then
            if $SUDO curl -fsSL "$repo_url" -o /etc/yum.repos.d/docker-ce.repo 2>&1; then
                print_info "Downloaded Docker repository file"
                repo_added=true
            fi
        elif command -v wget &> /dev/null; then
            if $SUDO wget -q "$repo_url" -O /etc/yum.repos.d/docker-ce.repo 2>&1; then
                print_info "Downloaded Docker repository file"
                repo_added=true
            fi
        fi
    fi
    
    if [[ "$repo_added" == "false" ]]; then
        print_error "Failed to add Docker repository"
        exit 1
    fi
    
    # Install Docker
    print_info "Installing Docker packages..."
    if ! $SUDO dnf install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null; then
        if ! $SUDO yum install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null; then
            print_error "Failed to install Docker packages"
            exit 1
        fi
    fi
    
    print_success "Docker installed successfully"
}

install_docker_arch() {
    print_info "Installing Docker for Arch Linux/Manjaro..."
    
    # Update package database
    $SUDO pacman -Sy
    
    # Install Docker
    $SUDO pacman -S --noconfirm --needed docker
    
    # Check if docker compose plugin is included
    # In Arch, docker-compose is available as a separate package
    # The docker package may or may not include the compose plugin
    if ! docker compose version &>/dev/null 2>&1; then
        # Install docker-compose as standalone package
        print_info "Installing docker-compose..."
        $SUDO pacman -S --noconfirm --needed docker-compose 2>/dev/null || true
    fi
    
    print_success "Docker installed successfully"
}

install_docker_suse() {
    print_info "Installing Docker for openSUSE..."
    
    # openSUSE has Docker in its official repositories
    # Docker Inc. doesn't provide official repos for openSUSE
    
    # Refresh repositories
    $SUDO zypper refresh
    
    # Install Docker from openSUSE official repos
    # Package names in openSUSE: docker and docker-compose or docker-compose-plugin
    $SUDO zypper --gpg-auto-import-keys --non-interactive install -y docker
    
    # Check if docker-compose-plugin is available, otherwise install docker-compose
    if zypper search -x docker-compose-plugin &>/dev/null; then
        $SUDO zypper --gpg-auto-import-keys --non-interactive install -y docker-compose-plugin || \
        $SUDO zypper --gpg-auto-import-keys --non-interactive install -y docker-compose
    else
        $SUDO zypper --gpg-auto-import-keys --non-interactive install -y docker-compose
    fi
    
    # Enable docker service
    $SUDO systemctl enable docker
    
    print_success "Docker installed successfully"
}

install_docker_alpine() {
    print_info "Installing Docker for Alpine Linux..."
    
    # Enable community repository if not enabled
    if ! grep -q "community" /etc/apk/repositories; then
        local alpine_version
        alpine_version=$(cut -d'.' -f1-2 < /etc/alpine-release)
        echo "http://dl-cdn.alpinelinux.org/alpine/${alpine_version}/community" | \
            $SUDO tee -a /etc/apk/repositories
        $SUDO apk update
    fi
    
    # Install Docker
    # Note: docker-cli-compose is the correct package name for docker compose in Alpine
    $SUDO apk add docker docker-cli-compose
    
    # Enable docker service at boot
    $SUDO rc-update add docker boot 2>/dev/null || true
    
    print_success "Docker installed successfully"
}

install_docker() {
    print_header "Installing Docker"
    
    if check_docker_installed && check_docker_compose_installed; then
        if confirm "Docker and Docker Compose are already installed. Reinstall?" "n"; then
            print_info "Proceeding with reinstallation..."
        else
            print_info "Skipping Docker installation"
            return 0
        fi
    fi
    
    case "$DISTRO_FAMILY" in
        debian)
            install_docker_debian
            ;;
        redhat)
            install_docker_redhat
            ;;
        arch)
            install_docker_arch
            ;;
        suse)
            install_docker_suse
            ;;
        alpine)
            install_docker_alpine
            ;;
    esac
    
    # Add user to docker group
    local current_user=${SUDO_USER:-$USER}
    if [[ -n "$current_user" ]] && [[ "$current_user" != "root" ]]; then
        if ! groups "$current_user" | grep -q docker; then
            print_info "Adding user '$current_user' to docker group..."
            $SUDO usermod -aG docker "$current_user"
            print_warning "User added to docker group, but group membership requires re-login to take effect."
            print_info "The script will use sudo for docker commands for the remainder of this session."
            print_info "After logging out and back in, docker commands will work without sudo."
        fi
    fi
    
    # Start Docker service
    if confirm "Start Docker service now?" "y"; then
        start_docker_service
    fi
}

start_docker_service() {
    print_info "Starting Docker service..."
    
    if command -v systemctl &> /dev/null; then
        $SUDO systemctl enable docker
        $SUDO systemctl start docker
        print_success "Docker service started and enabled"
    elif command -v service &> /dev/null; then
        $SUDO service docker start
        $SUDO rc-update add docker default 2>/dev/null || true
        print_success "Docker service started"
    else
        # Fallback: start dockerd directly in background
        print_info "Starting dockerd directly (no systemctl/service available)..."
        $SUDO dockerd &
        local dockerd_pid=$!
        sleep 2  # Give dockerd a moment to start
        
        # Verify dockerd is running
        if ! kill -0 "$dockerd_pid" 2>/dev/null; then
            print_error "Docker daemon failed to start"
            print_info "Try running 'dockerd' manually to see error messages"
            exit 1
        fi
        print_success "Docker daemon started (PID: $dockerd_pid)"
    fi
    
    # Wait for Docker to be ready
    print_info "Waiting for Docker to be ready..."
    local max_attempts=30
    local attempt=0
    while true; do
        # Try with sudo first (in case user isn't in docker group yet)
        if $SUDO docker info &> /dev/null 2>&1; then
            print_success "Docker is ready"
            return 0
        fi
        # Also try without sudo (in case user is in docker group)
        if docker info &> /dev/null 2>&1; then
            print_success "Docker is ready"
            return 0
        fi
        attempt=$((attempt + 1))
        if [[ $attempt -ge $max_attempts ]]; then
            print_error "Docker failed to start"
            print_info "Check Docker status with: systemctl status docker"
            print_info "Check Docker logs with: journalctl -xeu docker"
            exit 1
        fi
        sleep 1
    done
}

#===============================================================================
# ENVIRONMENT CONFIGURATION
#===============================================================================

configure_environment() {
    print_header "Environment Configuration"
    
    # Check if .env files already exist
    local reconfigure=false
    if [[ -f ".env" ]]; then
        print_warning "An .env file already exists"
        if confirm "Do you want to reconfigure?" "n"; then
            reconfigure=true
            # Backup existing .env
            cp ".env" ".env.backup.$(date +%Y%m%d%H%M%S)"
            print_info "Existing .env backed up"
        fi
    fi
    
    if [[ "$reconfigure" == "false" ]] && [[ -f ".env" ]]; then
        print_info "Using existing .env configuration"
        return 0
    fi
    
    print_info "Let's configure your application. Press Enter to accept defaults."
    printf '\n'
    
    #===========================================================================
    # Root .env Configuration
    #===========================================================================
    print_step "Configuring root environment variables..."
    
    # URL Configuration
    printf '\n'
    print_info "Application URL Configuration:"
    printf '  1) localhost - Use http://localhost (for local development)\n'
    printf '  2) LAN IP    - Use your local network IP (for LAN access)\n'
    printf '  3) Custom    - Enter a custom URL\n'
    printf '\n'
    
    local url_choice
    if [[ "$NON_INTERACTIVE" == "true" ]]; then
        url_choice="1"
    else
        read -r -p "Select URL type [1-3] (default: 1): " url_choice
        url_choice=${url_choice:-1}
    fi
    
    case "$url_choice" in
        1)
            URL="${CLI_URL:-http://localhost}"
            ;;
        2)
            local lan_ip
            lan_ip=$(hostname -I | awk '{print $1}')
            URL="${CLI_URL:-http://${lan_ip}}"
            ;;
        3)
            URL=$(prompt_input "Enter custom URL" "${CLI_URL:-http://localhost}")
            ;;
        *)
            URL="${CLI_URL:-http://localhost}"
            ;;
    esac
    
    # Validate URL
    while ! validate_url "$URL"; do
        print_warning "Invalid URL format. URL must start with http:// or https://"
        URL=$(prompt_input "Enter valid URL" "http://localhost")
    done
    
    # Nginx Port
    printf '\n'
    print_info "Nginx Port: The port where the application will be accessible."
    NGINX_PORT=$(prompt_input "Nginx port" "${CLI_NGINX_PORT:-80}")
    while ! validate_port "$NGINX_PORT"; do
        print_warning "Invalid port number. Must be between 1 and 65535"
        NGINX_PORT=$(prompt_input "Nginx port" "80")
    done
    
    # Expose DB Port
    printf '\n'
    print_info "Expose Database Port: If true, the PostgreSQL port (5432) will be accessible"
    print_info "from the host machine. This is useful for development but should be"
    print_info "disabled in production for security."
    if confirm "Expose database port?" "${CLI_EXPOSE_DB:-true}"; then
        EXPOSE_DB_PORT="true"
    else
        EXPOSE_DB_PORT="false"
    fi
    
    # Expose Frontend Port
    printf '\n'
    print_info "Expose Frontend Port: If true, the frontend development server port (3000)"
    print_info "will be accessible from the host. Useful for development with hot-reload."
    if confirm "Expose frontend port?" "${CLI_EXPOSE_FRONTEND:-true}"; then
        EXPOSE_FRONTEND_PORT="true"
    else
        EXPOSE_FRONTEND_PORT="false"
    fi
    
    # Database Configuration
    print_step "Configuring database settings..."
    
    POSTGRES_USER=$(prompt_input "Database username" "${CLI_DB_USER:-totalevo_user}")
    
    printf '\n'
    print_info "Database Password: A secure password is recommended for production."
    if confirm "Generate a secure password automatically?" "y"; then
        POSTGRES_PASSWORD=$(generate_secure_password)
        print_success "Generated secure password"
    else
        POSTGRES_PASSWORD=$(prompt_input "Database password" "${CLI_DB_PASSWORD:-totalevo_password}" "true")
    fi
    
    POSTGRES_DB=$(prompt_input "Database name" "${CLI_DB_NAME:-bar_pos}")
    
    # JWT Secret
    printf '\n'
    print_info "JWT Secret: A secret key used to sign authentication tokens."
    print_info "This should be a long, random string (64+ characters)."
    JWT_SECRET=$(generate_jwt_secret)
    print_success "Generated secure JWT secret (128 characters)"
    
    # Node Environment
    printf '\n'
    print_info "Environment Mode:"
    printf '  - development: Enables debug features, detailed error messages\n'
    printf '  - production:  Optimized for production, minimal error exposure\n'
    printf '\n'
    if confirm "Run in production mode?" "n"; then
        NODE_ENV="production"
    else
        NODE_ENV="development"
    fi
    
    #===========================================================================
    # Backend .env Configuration
    #===========================================================================
    print_step "Configuring backend environment variables..."
    
    # Backend Port
    BACKEND_PORT=$(prompt_input "Backend API port" "3001")
    while ! validate_port "$BACKEND_PORT"; do
        print_warning "Invalid port number. Must be between 1 and 65535"
        BACKEND_PORT=$(prompt_input "Backend API port" "3001")
    done
    
    # Log Level
    printf '\n'
    print_info "Log Level: Controls the verbosity of application logs."
    printf '  - error: Only errors\n'
    printf '  - warn:  Warnings and errors\n'
    printf '  - info:  General information, warnings, and errors (recommended)\n'
    printf '  - debug: Detailed debugging information\n'
    printf '\n'
    LOG_LEVEL=$(prompt_input "Log level" "info")
    
    # Debug Logging
    if confirm "Enable debug logging?" "false"; then
        DEBUG_LOGGING="true"
    else
        DEBUG_LOGGING="false"
    fi
    
    #===========================================================================
    # Write .env files
    #===========================================================================
    write_env_files
}

write_env_files() {
    print_step "Writing environment files..."
    
    # Construct DATABASE_URL
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?schema=public"
    
    # Write root .env
    cat > .env << EOF
#===============================================================================
# TEV2 Application Configuration
# Generated by install.sh on $(date)
#===============================================================================

# Application URL
URL=${URL}

# Nginx Configuration
NGINX_PORT=${NGINX_PORT}

# Port Exposure (true/false)
EXPOSE_DB_PORT=${EXPOSE_DB_PORT}
EXPOSE_FRONTEND_PORT=${EXPOSE_FRONTEND_PORT}

# Database Configuration
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${POSTGRES_DB}

# Security
JWT_SECRET=${JWT_SECRET}

# Environment
NODE_ENV=${NODE_ENV}
EOF

    # Write backend .env
    cat > backend/.env << EOF
#===============================================================================
# TEV2 Backend Configuration
# Generated by install.sh on $(date)
#===============================================================================

# Database Connection (auto-constructed)
DATABASE_URL=${DATABASE_URL}

# Server Configuration
PORT=${BACKEND_PORT}

# Environment
NODE_ENV=${NODE_ENV}

# Security (must match root JWT_SECRET)
JWT_SECRET=${JWT_SECRET}

# Logging
LOG_LEVEL=${LOG_LEVEL}
DEBUG_LOGGING=${DEBUG_LOGGING}
EOF

    print_success "Environment files created successfully"
    
    # Display summary
    local summary="
URL=${URL}
NGINX_PORT=${NGINX_PORT}
EXPOSE_DB_PORT=${EXPOSE_DB_PORT}
EXPOSE_FRONTEND_PORT=${EXPOSE_FRONTEND_PORT}
POSTGRES_USER=${POSTGRES_USER}
POSTGRES_DB=${POSTGRES_DB}
NODE_ENV=${NODE_ENV}
BACKEND_PORT=${BACKEND_PORT}
LOG_LEVEL=${LOG_LEVEL}
DEBUG_LOGGING=${DEBUG_LOGGING}
"
    print_config_summary "$summary"
}

#===============================================================================
# CONTAINER BUILD AND RUN
#===============================================================================

build_and_run() {
    print_header "Building and Starting Containers"
    
    # Determine if we need to use sudo for docker commands
    # Check if user can run docker without sudo
    DOCKER_CMD="docker"
    if ! docker info &> /dev/null 2>&1; then
        if $SUDO docker info &> /dev/null 2>&1; then
            DOCKER_CMD="$SUDO docker"
            print_info "Using sudo for docker commands (user not in docker group yet)"
        else
            print_error "Docker is not running. Please start Docker first."
            if confirm "Start Docker now?" "y"; then
                start_docker_service
                # Check again
                if ! docker info &> /dev/null 2>&1; then
                    if $SUDO docker info &> /dev/null 2>&1; then
                        DOCKER_CMD="$SUDO docker"
                    else
                        print_error "Docker still not accessible"
                        exit 1
                    fi
                fi
            else
                exit 1
            fi
        fi
    fi
    
    # Handle database reset if requested
    if [[ "$RESET_DB" == "true" ]]; then
        print_warning "Database reset requested - this will DELETE ALL DATA!"
        if confirm "Are you sure you want to reset the database?" "n"; then
            print_info "Stopping containers and removing volumes..."
            $DOCKER_CMD compose down -v
            print_success "Database volume removed"
        else
            print_info "Database reset cancelled"
            RESET_DB="false"
        fi
    fi
    
    # Stop existing containers if running (but preserve volumes unless reset requested)
    if $DOCKER_CMD compose ps -q 2>/dev/null | grep -q .; then
        print_info "Stopping existing containers..."
        $DOCKER_CMD compose down
    fi
    
    # Start database container first to resolve any failed migrations
    print_info "Starting database container..."
    $DOCKER_CMD compose up -d db
    
    # Wait for database to be ready
    print_info "Waiting for database to be ready..."
    local db_attempts=0
    while [[ $db_attempts -lt 30 ]]; do
        if $DOCKER_CMD compose exec -T db pg_isready -U totalevo_user > /dev/null 2>&1; then
            print_success "Database is ready"
            break
        fi
        db_attempts=$((db_attempts + 1))
        sleep 1
    done
    
    if [[ $db_attempts -ge 30 ]]; then
        print_error "Database failed to start"
        exit 1
    fi
    
    # Resolve any failed migrations before starting backend
    resolve_failed_migrations
    
    # Build and start remaining containers
    print_step "Building containers (this may take a few minutes)..."
    
    if $DOCKER_CMD compose up -d --build 2>&1 | tee /tmp/docker-build.log; then
        print_success "Containers built successfully"
    else
        print_error "Container build failed. Check /tmp/docker-build.log for details"
        exit 1
    fi
    
    # Wait for services to be healthy
    print_step "Waiting for services to be healthy..."
    wait_for_healthy_services
    
    # Verify migrations for fresh install
    print_step "Verifying database migrations..."
    verify_migrations
    
    # Show status
    print_step "Container status:"
    $DOCKER_CMD compose ps
    
    # Display success message
    display_success_message
}

wait_for_healthy_services() {
    local max_wait=180  # 3 minutes
    local interval=5
    local elapsed=0
    
    # Use the global DOCKER_CMD set in build_and_run
    local docker_cmd="${DOCKER_CMD:-docker}"
    
    while [[ $elapsed -lt $max_wait ]]; do
        # Check if all services are running
        # Note: grep -c returns exit code 1 when no matches, but still outputs "0"
        # Use || true to prevent set -e from exiting, then sanitize output
        local unhealthy
        local starting
        unhealthy=$($docker_cmd compose ps --format json 2>/dev/null | \
            grep -c '"Health":"unhealthy"' 2>/dev/null) || unhealthy=0
        starting=$($docker_cmd compose ps --format json 2>/dev/null | \
            grep -c '"Health":"starting"' 2>/dev/null) || starting=0
        
        # Sanitize variables to ensure they contain only digits
        unhealthy=$(printf '%s' "$unhealthy" | tr -cd '0-9')
        starting=$(printf '%s' "$starting" | tr -cd '0-9')
        
        # Default to 0 if empty
        unhealthy=${unhealthy:-0}
        starting=${starting:-0}
        
        if [[ "$unhealthy" -eq 0 ]] && [[ "$starting" -eq 0 ]]; then
            # Check if all services are running
            local running
            local expected
            running=$($docker_cmd compose ps -q 2>/dev/null | wc -l)
            # Sanitize: remove whitespace
            running=$(printf '%s' "$running" | tr -cd '0-9')
            running=${running:-0}
            
            expected=$($docker_cmd compose config --services 2>/dev/null | wc -l)
            expected=$(printf '%s' "$expected" | tr -cd '0-9')
            expected=${expected:-3}
            
            if [[ "$running" -ge "$expected" ]]; then
                print_success "All services are healthy"
                return 0
            fi
        fi
        
        printf "\r${BLUE}[WAITING]${NC} Elapsed: %ds / %ds   " "$elapsed" "$max_wait"
        sleep "$interval"
        elapsed=$((elapsed + interval))
    done
    
    print_warning "Some services may still be starting. Check status with: $docker_cmd compose ps"
}

display_success_message() {
    local app_url="${URL}:${NGINX_PORT}"
    
    printf '\n'
    printf '%b\n' "${GREEN}${BOLD}========================================${NC}"
    printf '%b\n' "${GREEN}${BOLD}       INSTALLATION COMPLETE!          ${NC}"
    printf '%b\n' "${GREEN}${BOLD}========================================${NC}"
    printf '\n'
    printf '  %b  %b%s%b\n' "${CYAN}Application URL:${NC}" "${BOLD}" "${app_url}" "${NC}"
    printf '  %b  %b%s%b\n' "${CYAN}API URL:${NC}" "${BOLD}" "${app_url}/api" "${NC}"
    printf '\n'
    printf '  %b\n' "${WHITE}Default Credentials:${NC}"
    printf '    Username: %badmin%b\n' "${BOLD}" "${NC}"
    printf '    Password: %badmin123%b\n' "${BOLD}" "${NC}"
    printf '\n'
    printf '  %b\n' "${YELLOW}Important:${NC}"
    printf '    - Change the default password after first login\n'
    printf '    - Your JWT secret and database password are stored in .env files\n'
    printf '    - Keep these files secure and do not commit them to version control\n'
    printf '\n'
    printf '  %b\n' "${WHITE}Useful Commands:${NC}"
    printf '    View logs:     %bdocker compose logs -f%b\n' "${BOLD}" "${NC}"
    printf '    Stop services: %bdocker compose down%b\n' "${BOLD}" "${NC}"
    printf '    Restart:       %bdocker compose restart%b\n' "${BOLD}" "${NC}"
    printf '\n'
}

#===============================================================================
# MAIN EXECUTION
#===============================================================================

main() {
    # Parse command line arguments
    NON_INTERACTIVE=false
    SKIP_DOCKER=false
    RESTORE_MODE=false
    RESET_DB=false
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                ;;
            -n|--non-interactive)
                NON_INTERACTIVE=true
                shift
                ;;
            --skip-docker)
                SKIP_DOCKER=true
                shift
                ;;
            --reset-db)
                RESET_DB=true
                shift
                ;;
            --restore-backup)
                RESTORE_MODE=true
                shift
                ;;
            --url)
                CLI_URL="$2"
                shift 2
                ;;
            --nginx-port)
                CLI_NGINX_PORT="$2"
                shift 2
                ;;
            --db-user)
                CLI_DB_USER="$2"
                shift 2
                ;;
            --db-password)
                CLI_DB_PASSWORD="$2"
                shift 2
                ;;
            --db-name)
                CLI_DB_NAME="$2"
                shift 2
                ;;
            --env)
                # shellcheck disable=SC2034 # CLI_ENV is reserved for future use
                CLI_ENV="$2"
                shift 2
                ;;
            *)
                print_error "Unknown option: $1"
                printf 'Use --help for usage information\n'
                exit 1
                ;;
        esac
    done
    
    # Handle restore mode
    if [[ "$RESTORE_MODE" == "true" ]]; then
        restore_from_backup
        exit $?
    fi
    
    # Print banner
    printf '\n'
    printf '%b\n' "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    printf '%b\n' "${CYAN}${BOLD}║                    TEV2 INSTALLER                          ║${NC}"
    printf '%b\n' "${CYAN}${BOLD}║              Total Evolution POS System                    ║${NC}"
    printf '%b\n' "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    printf '\n'
    
    if [[ "$NON_INTERACTIVE" == "true" ]]; then
        print_info "Running in non-interactive mode"
    fi
    
    # Detect if this is an upgrade or fresh install
    local current_version=$(get_installed_version)
    local new_version=$(get_new_version)
    
    if [[ "$current_version" != "0.0.0" ]]; then
        # Existing installation detected
        if compare_versions "$current_version" "$new_version"; then
            print_info "Existing installation detected (version: $current_version)"
            print_info "New version available: $new_version"
            if confirm "Do you want to upgrade?" "y"; then
                perform_upgrade
                exit $?
            else
                print_info "Upgrade cancelled. Use 'docker compose up -d --build' to rebuild without version change"
                exit 0
            fi
        else
            print_info "Installed version ($current_version) is same or newer than target ($new_version)"
            print_info "Use 'docker compose up -d --build' to rebuild without version change"
            exit 0
        fi
    fi
    
    # Fresh installation
    print_info "Performing fresh installation..."
    
    # Execute installation steps
    check_prerequisites
    
    if [[ "$SKIP_DOCKER" == "true" ]]; then
        print_info "Skipping Docker installation (--skip-docker)"
    else
        detect_distro
        install_docker
    fi
    
    configure_environment
    build_and_run
    
    # Save installed version after successful installation
    save_installed_version "$new_version"
    
    print_success "Installation completed successfully!"
}

# Run main function
main "$@"
