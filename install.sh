#!/bin/bash

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

set -e

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
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}========================================${NC}"
    echo -e "${CYAN}${BOLD} $1 ${NC}"
    echo -e "${CYAN}${BOLD}========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${MAGENTA}[STEP]${NC} ${BOLD}$1${NC}"
}

print_progress() {
    local current=$1
    local total=$2
    local message=$3
    echo -e "${BLUE}[$current/$total]${NC} $message"
}

print_config_summary() {
    echo ""
    echo -e "${WHITE}${BOLD}Configuration Summary:${NC}"
    echo -e "${WHITE}----------------------------------------${NC}"
    while IFS='=' read -r key value; do
        printf "  ${CYAN}%-25s${NC} %s\n" "$key" "$value"
    done < <(echo "$1" | grep -v '^$')
    echo -e "${WHITE}----------------------------------------${NC}"
    echo ""
}

show_spinner() {
    local pid=$1
    local message=$2
    local spin='-\|/'
    local i=0
    
    while kill -0 $pid 2>/dev/null; do
        i=$(( (i+1) % 4 ))
        printf "\r${BLUE}[%c]${NC} %s" "${spin:$i:1}" "$message"
        sleep 0.1
    done
    printf "\r"
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
# HELP FUNCTION
#===============================================================================

show_help() {
    cat << EOF
${BOLD}TEV2 Installation Script${NC}

Usage: ./install.sh [OPTIONS]

Options:
  -h, --help            Show this help message and exit
  -n, --non-interactive Run in non-interactive mode with default values
  --skip-docker         Skip Docker installation (use if Docker is already installed)
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
    local required_commands=("curl" "wget")
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
    detect_distro
    
    case "$DISTRO_FAMILY" in
        debian)
            $SUDO apt-get update -qq
            $SUDO apt-get install -y -qq curl wget
            ;;
        redhat)
            $SUDO dnf install -y -q curl wget 2>/dev/null || $SUDO yum install -y -q curl wget
            ;;
        arch)
            $SUDO pacman -S --noconfirm --quiet curl wget
            ;;
        suse)
            $SUDO zypper -q install -y curl wget
            ;;
        alpine)
            $SUDO apk add --quiet curl wget
            ;;
    esac
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
        source /etc/os-release
        DISTRO="${ID}"
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
        DOCKER_INSTALLED=true
        print_success "Docker is already installed: $(docker --version)"
        return 0
    fi
    DOCKER_INSTALLED=false
    return 1
}

check_docker_compose_installed() {
    if docker compose version &> /dev/null 2>&1; then
        DOCKER_COMPOSE_INSTALLED=true
        print_success "Docker Compose is already installed: $(docker compose version)"
        return 0
    elif command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_INSTALLED=true
        print_success "Docker Compose is already installed: $(docker-compose --version)"
        return 0
    fi
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
    curl -fsSL https://download.docker.com/linux/$DISTRO/gpg | $SUDO gpg --dearmor -o "$keyring_dir/docker.gpg" 2>/dev/null
    
    # Set up repository
    local arch=$(dpkg --print-architecture)
    local codename=$(. /etc/os-release && echo "$VERSION_CODENAME")
    
    # Handle Ubuntu derivatives that might not have a Docker repo
    if [[ -z "$codename" ]] || ! curl -fsSL "https://download.docker.com/linux/$DISTRO/dists/$codename/" &>/dev/null; then
        codename="focal"  # Fallback to Ubuntu 20.04
        DISTRO="ubuntu"
    fi
    
    echo "deb [arch=$arch signed-by=$keyring_dir/docker.gpg] https://download.docker.com/linux/$DISTRO $codename stable" | \
        $SUDO tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    $SUDO apt-get update -qq
    $SUDO apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    print_success "Docker installed successfully"
}

install_docker_redhat() {
    print_info "Installing Docker for RHEL/Fedora/CentOS..."
    
    # Remove old versions
    $SUDO dnf remove -y docker docker-client docker-client-latest docker-common \
        docker-latest docker-latest-logrotate docker-logrotate docker-selinux \
        docker-engine-selinux docker-engine 2>/dev/null || true
    
    # Install dnf-plugins-core if needed
    $SUDO dnf install -y -q dnf-plugins-core 2>/dev/null || $SUDO yum install -y -q yum-utils
    
    # Add Docker repository
    if [[ "$DISTRO" == "fedora" ]]; then
        $SUDO dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
    else
        $SUDO dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo 2>/dev/null || \
        $SUDO yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
    fi
    
    # Install Docker
    $SUDO dnf install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin 2>/dev/null || \
    $SUDO yum install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    print_success "Docker installed successfully"
}

install_docker_arch() {
    print_info "Installing Docker for Arch Linux/Manjaro..."
    
    # Install Docker
    $SUDO pacman -S --noconfirm --needed docker docker-compose
    
    print_success "Docker installed successfully"
}

install_docker_suse() {
    print_info "Installing Docker for openSUSE..."
    
    # Add Docker repository
    $SUDO zypper addrepo https://download.docker.com/linux/suse/docker-ce.repo 2>/dev/null || \
    $SUDO zypper ar https://download.docker.com/linux/opensuse/docker-ce.repo
    
    # Install Docker
    $SUDO zypper --gpg-auto-import-keys install -y docker docker-compose
    
    print_success "Docker installed successfully"
}

install_docker_alpine() {
    print_info "Installing Docker for Alpine Linux..."
    
    # Enable community repository if not enabled
    if ! grep -q "community" /etc/apk/repositories; then
        echo "http://dl-cdn.alpinelinux.org/alpine/$(cat /etc/alpine-release | cut -d'.' -f1-2)/community" | \
            $SUDO tee -a /etc/apk/repositories
        $SUDO apk update
    fi
    
    # Install Docker
    $SUDO apk add docker docker-cli-compose
    
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
            print_warning "You may need to log out and log back in for group changes to take effect"
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
        $SUDO dockerd &
        print_success "Docker daemon started"
    fi
    
    # Wait for Docker to be ready
    print_info "Waiting for Docker to be ready..."
    local max_attempts=30
    local attempt=0
    while ! docker info &> /dev/null; do
        attempt=$((attempt + 1))
        if [[ $attempt -ge $max_attempts ]]; then
            print_error "Docker failed to start"
            exit 1
        fi
        sleep 1
    done
    print_success "Docker is ready"
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
    echo ""
    
    #===========================================================================
    # Root .env Configuration
    #===========================================================================
    print_step "Configuring root environment variables..."
    
    # URL Configuration
    echo ""
    print_info "Application URL Configuration:"
    echo "  1) localhost - Use http://localhost (for local development)"
    echo "  2) LAN IP    - Use your local network IP (for LAN access)"
    echo "  3) Custom    - Enter a custom URL"
    echo ""
    
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
            local lan_ip=$(hostname -I | awk '{print $1}')
            URL="${CLI_URL:-http://$lan_ip}"
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
    echo ""
    print_info "Nginx Port: The port where the application will be accessible."
    NGINX_PORT=$(prompt_input "Nginx port" "${CLI_NGINX_PORT:-80}")
    while ! validate_port "$NGINX_PORT"; do
        print_warning "Invalid port number. Must be between 1 and 65535"
        NGINX_PORT=$(prompt_input "Nginx port" "80")
    done
    
    # Expose DB Port
    echo ""
    print_info "Expose Database Port: If true, the PostgreSQL port (5432) will be accessible"
    print_info "from the host machine. This is useful for development but should be"
    print_info "disabled in production for security."
    if confirm "Expose database port?" "${CLI_EXPOSE_DB:-true}"; then
        EXPOSE_DB_PORT="true"
    else
        EXPOSE_DB_PORT="false"
    fi
    
    # Expose Frontend Port
    echo ""
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
    
    echo ""
    print_info "Database Password: A secure password is recommended for production."
    if confirm "Generate a secure password automatically?" "y"; then
        POSTGRES_PASSWORD=$(generate_secure_password)
        print_success "Generated secure password"
    else
        POSTGRES_PASSWORD=$(prompt_input "Database password" "${CLI_DB_PASSWORD:-totalevo_password}" "true")
    fi
    
    POSTGRES_DB=$(prompt_input "Database name" "${CLI_DB_NAME:-bar_pos}")
    
    # JWT Secret
    echo ""
    print_info "JWT Secret: A secret key used to sign authentication tokens."
    print_info "This should be a long, random string (64+ characters)."
    JWT_SECRET=$(generate_jwt_secret)
    print_success "Generated secure JWT secret (128 characters)"
    
    # Node Environment
    echo ""
    print_info "Environment Mode:"
    echo "  - development: Enables debug features, detailed error messages"
    echo "  - production:  Optimized for production, minimal error exposure"
    echo ""
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
    echo ""
    print_info "Log Level: Controls the verbosity of application logs."
    echo "  - error: Only errors"
    echo "  - warn:  Warnings and errors"
    echo "  - info:  General information, warnings, and errors (recommended)"
    echo "  - debug: Detailed debugging information"
    echo ""
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
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        if confirm "Start Docker now?" "y"; then
            start_docker_service
        else
            exit 1
        fi
    fi
    
    # Stop existing containers if running
    if docker compose ps -q 2>/dev/null | grep -q .; then
        print_info "Stopping existing containers..."
        docker compose down
    fi
    
    # Build and start containers
    print_step "Building containers (this may take a few minutes)..."
    
    if docker compose up -d --build 2>&1 | tee /tmp/docker-build.log; then
        print_success "Containers built successfully"
    else
        print_error "Container build failed. Check /tmp/docker-build.log for details"
        exit 1
    fi
    
    # Wait for services to be healthy
    print_step "Waiting for services to be healthy..."
    wait_for_healthy_services
    
    # Show status
    print_step "Container status:"
    docker compose ps
    
    # Display success message
    display_success_message
}

wait_for_healthy_services() {
    local max_wait=180  # 3 minutes
    local interval=5
    local elapsed=0
    
    while [[ $elapsed -lt $max_wait ]]; do
        # Check if all services are running
        local unhealthy=$(docker compose ps --format json 2>/dev/null | \
            grep -c '"Health":"unhealthy"' || echo "0")
        local starting=$(docker compose ps --format json 2>/dev/null | \
            grep -c '"Health":"starting"' || echo "0")
        
        if [[ "$unhealthy" -eq 0 ]] && [[ "$starting" -eq 0 ]]; then
            # Check if all services are running
            local running=$(docker compose ps -q | wc -l)
            local expected=$(grep -c "^\s*[a-z]" docker-compose.yml || echo "3")
            
            if [[ "$running" -ge "$expected" ]]; then
                print_success "All services are healthy"
                return 0
            fi
        fi
        
        printf "\r${BLUE}[WAITING]${NC} Elapsed: ${elapsed}s / ${max_wait}s   "
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    print_warning "Some services may still be starting. Check status with: docker compose ps"
}

display_success_message() {
    local app_url="${URL}:${NGINX_PORT}"
    
    echo ""
    echo -e "${GREEN}${BOLD}========================================${NC}"
    echo -e "${GREEN}${BOLD}       INSTALLATION COMPLETE!          ${NC}"
    echo -e "${GREEN}${BOLD}========================================${NC}"
    echo ""
    echo -e "  ${CYAN}Application URL:${NC}  ${BOLD}${app_url}${NC}"
    echo -e "  ${CYAN}API URL:${NC}          ${BOLD}${app_url}/api${NC}"
    echo ""
    echo -e "  ${WHITE}Default Credentials:${NC}"
    echo -e "    Username: ${BOLD}admin${NC}"
    echo -e "    Password: ${BOLD}admin123${NC}"
    echo ""
    echo -e "  ${YELLOW}Important:${NC}"
    echo -e "    - Change the default password after first login"
    echo -e "    - Your JWT secret and database password are stored in .env files"
    echo -e "    - Keep these files secure and do not commit them to version control"
    echo ""
    echo -e "  ${WHITE}Useful Commands:${NC}"
    echo -e "    View logs:     ${BOLD}docker compose logs -f${NC}"
    echo -e "    Stop services: ${BOLD}docker compose down${NC}"
    echo -e "    Restart:       ${BOLD}docker compose restart${NC}"
    echo ""
}

#===============================================================================
# MAIN EXECUTION
#===============================================================================

main() {
    # Parse command line arguments
    NON_INTERACTIVE=false
    SKIP_DOCKER=false
    
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
                CLI_ENV="$2"
                shift 2
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Print banner
    echo ""
    echo -e "${CYAN}${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}${BOLD}║                    TEV2 INSTALLER                          ║${NC}"
    echo -e "${CYAN}${BOLD}║              Total Evolution POS System                    ║${NC}"
    echo -e "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    if [[ "$NON_INTERACTIVE" == "true" ]]; then
        print_info "Running in non-interactive mode"
    fi
    
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
    
    print_success "Installation completed successfully!"
}

# Run main function
main "$@"
