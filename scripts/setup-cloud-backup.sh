#!/usr/bin/env bash

#===============================================================================
# TEV2 Cloud Backup Setup Script
#
# First-time setup for MEGA cloud backup. Handles:
#   - MEGA CMD installation
#   - MEGA account login
#   - Remote folder creation
#   - Cron job scheduling
#
# Usage: ./scripts/setup-cloud-backup.sh [OPTIONS]
# Options:
#   -h, --help       Show this help message
#   --uninstall      Remove cron job and logout from MEGA
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
TEV2 Cloud Backup Setup Script

Usage: ./scripts/setup-cloud-backup.sh [OPTIONS]

Description:
    First-time setup for MEGA cloud backup.
    Installs MEGA CMD, logs into your MEGA account, creates remote folders,
    and optionally configures a daily cron job for automatic backups.

Options:
    -h, --help       Show this help message and exit
    --uninstall      Remove cron job and logout from MEGA

Steps performed:
    1. Detect OS and install MEGA CMD
    2. Login to MEGA account (interactive)
    3. Create remote folder /TEV2/backups
    4. Configure cron job for daily backups (optional)

Requirements:
    - Internet connection
    - MEGA account (email + password)
    - sudo access (for package installation)

Examples:
    ./scripts/setup-cloud-backup.sh           # Interactive setup
    ./scripts/setup-cloud-backup.sh --uninstall  # Remove cron and logout

EOF
    exit 0
}

#===============================================================================
# Environment setup
#===============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

MEGA_REMOTE_FOLDER="/TEV2/backups"
MEGA_RETENTION=30

#===============================================================================
# Step 1: Install MEGA CMD
#===============================================================================

install_megacmd() {
    print_header "STEP 1: INSTALL MEGA CMD"

    # Check if already installed
    if command -v mega-cmd &>/dev/null || command -v mega-put &>/dev/null; then
        ok "MEGA CMD is already installed"
        local ver
        ver=$(mega-version 2>/dev/null | head -1 || echo "unknown")
        info "Version: $ver"
        return 0
    fi

    info "Detecting operating system..."
    if [[ ! -f /etc/os-release ]]; then
        err "Cannot detect OS (/etc/os-release not found)"
        err "Install MEGA CMD manually from: https://mega.io/cmd"
        exit 1
    fi

    source /etc/os-release

    info "OS: $PRETTY_NAME"

    local pkg_url=""
    local pkg_file=""
    local install_cmd=""

    case "$ID" in
        debian)
            # Debian 12 and 13 both use the Debian 12 package
            pkg_url="https://mega.nz/linux/repo/Debian_12/amd64/megacmd-Debian_12_amd64.deb"
            pkg_file="/tmp/megacmd.deb"
            install_cmd="sudo apt install -y $pkg_file"
            ;;
        ubuntu|linuxmint|pop)
            case "$VERSION_ID" in
                22.04)
                    pkg_url="https://mega.nz/linux/repo/xUbuntu_22.04/amd64/megacmd-xUbuntu_22.04_amd64.deb"
                    ;;
                24.04|25.*|26.*)
                    pkg_url="https://mega.nz/linux/repo/xUbuntu_24.04/amd64/megacmd-xUbuntu_24.04_amd64.deb"
                    ;;
                *)
                    # Default to 24.04 for newer versions
                    pkg_url="https://mega.nz/linux/repo/xUbuntu_24.04/amd64/megacmd-xUbuntu_24.04_amd64.deb"
                    ;;
            esac
            pkg_file="/tmp/megacmd.deb"
            install_cmd="sudo apt install -y $pkg_file"
            ;;
        fedora|centos|rhel|almalinux|rocky)
            local arch="x86_64"
            if [[ "$(uname -m)" == "aarch64" ]]; then
                arch="aarch64"
            fi
            # Default to Fedora 42 repo as a reasonable default
            pkg_url="https://mega.nz/linux/repo/Fedora_42/${arch}/megacmd-Fedora_42.${arch}.rpm"
            pkg_file="/tmp/megacmd.rpm"
            install_cmd="sudo dnf install -y $pkg_file"
            ;;
        arch|manjaro)
            pkg_url="https://mega.nz/linux/repo/Arch_Extra/x86_64/megacmd-x86_64.pkg.tar.zst"
            pkg_file="/tmp/megacmd.pkg.tar.zst"
            install_cmd="sudo pacman -U --noconfirm $pkg_file"
            ;;
        *)
            err "Unsupported distribution: $ID"
            err "Install MEGA CMD manually from: https://mega.io/cmd"
            exit 1
            ;;
    esac

    info "Downloading MEGA CMD..."
    wget -q --show-progress -O "$pkg_file" "$pkg_url"

    info "Installing MEGA CMD..."
    if $install_cmd; then
        ok "MEGA CMD installed successfully"
    else
        err "Installation failed. Try installing manually:"
        err "  wget $pkg_url"
        err "  sudo apt install $pkg_file  (or dnf/pacman equivalent)"
        rm -f "$pkg_file"
        exit 1
    fi

    rm -f "$pkg_file"

    # Verify installation
    if command -v mega-version &>/dev/null; then
        local ver
        ver=$(mega-version 2>/dev/null | head -1 || echo "unknown")
        ok "MEGA CMD version: $ver"
    else
        err "MEGA CMD installed but commands not found in PATH"
        err "You may need to restart your shell or add MEGA CMD to your PATH"
        exit 1
    fi
}

#===============================================================================
# Step 2: Login to MEGA
#===============================================================================

login_mega() {
    print_header "STEP 2: LOGIN TO MEGA"

    # Check if already logged in
    local whoami_output
    whoami_output=$(mega-whoami 2>&1) || true

    if echo "$whoami_output" | grep -q "@"; then
        local email
        email=$(echo "$whoami_output" | grep -oE '[^ ]+@[^ ]+' | head -1)
        ok "Already logged in as: $email"
        return 0
    fi

    info "You need to login to your MEGA account"
    printf '\n'

    read -p "MEGA email: " -r mega_email
    if [[ -z "$mega_email" ]]; then
        err "Email cannot be empty"
        exit 1
    fi

    read -p "MEGA password: " -r -s mega_password
    printf '\n'
    if [[ -z "$mega_password" ]]; then
        err "Password cannot be empty"
        exit 1
    fi

    info "Logging in..."
    if mega-login "$mega_email" "$mega_password" 2>&1; then
        ok "Logged in successfully as: $mega_email"
    else
        err "Login failed. Check your email and password"
        exit 1
    fi

    # Clear password from memory
    mega_password=""
}

#===============================================================================
# Step 3: Create remote folder structure
#===============================================================================

create_remote_folders() {
    print_header "STEP 3: CREATE REMOTE FOLDERS"

    info "Creating /TEV2 folder..."
    mega-mkdir /TEV2 2>/dev/null || true

    info "Creating /TEV2/backups folder..."
    mega-mkdir /TEV2/backups 2>/dev/null || true

    ok "Remote folder structure created"

    info "Verifying..."
    mega-ls /TEV2 2>&1 || true
    ok "Remote folder /TEV2/backups is ready"
}

#===============================================================================
# Step 4: Configure cron job
#===============================================================================

setup_cron() {
    print_header "STEP 4: SCHEDULE AUTOMATIC BACKUPS"

    printf '%b\n' "${WHITE}Automatic daily backups can be scheduled via cron.${NC}"
    printf '%b\n' "${WHITE}The backup will run at the specified time each day and:${NC}"
    printf '  - Dump the database\n'
    printf '  - Archive Docker volumes (storage, uploads)\n'
    printf '  - Bundle config files (.env, VERSION)\n'
    printf '  - Upload to MEGA: %s\n' "$MEGA_REMOTE_FOLDER"
    printf '  - Keep the last %s backups\n' "$MEGA_RETENTION"
    printf '\n'

    read -p "Set up daily automatic backups? (y/n): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Skipping cron setup. To run backups manually:"
        info "  cd $PROJECT_ROOT && ./scripts/backup.sh --cloud --compress"
        return 0
    fi

    read -p "Backup hour (0-23, default 4): " -r cron_hour
    cron_hour="${cron_hour:-4}"

    if ! [[ "$cron_hour" =~ ^[0-9]+$ ]] || [[ "$cron_hour" -lt 0 ]] || [[ "$cron_hour" -gt 23 ]]; then
        err "Invalid hour: $cron_hour. Must be 0-23."
        return 1
    fi

    local backup_cmd="$PROJECT_ROOT/scripts/backup.sh --cloud --compress"
    local log_file="$PROJECT_ROOT/backups/cloud-backup.log"
    local cron_entry="0 $cron_hour * * * $backup_cmd >> $log_file 2>&1 # TEV2-cloud-backup"

    # Check if cron entry already exists
    local existing
    existing=$(crontab -l 2>/dev/null | grep "TEV2-cloud-backup" || true)
    if [[ -n "$existing" ]]; then
        warn "Cron job already exists. Updating..."
        # Remove old entry
        crontab -l 2>/dev/null | grep -v "TEV2-cloud-backup" | crontab - 2>/dev/null || true
    fi

    # Add new entry
    (crontab -l 2>/dev/null; echo "$cron_entry") | crontab -

    ok "Cron job configured"
    info "Schedule: Daily at $cron_hour:00"
    info "Command: $backup_cmd"
    info "Log file: $log_file"

    printf '\n'
    info "Current crontab:"
    crontab -l 2>/dev/null | grep "TEV2-cloud-backup" || true
}

#===============================================================================
# Uninstall
#===============================================================================

do_uninstall() {
    print_header "UNINSTALL CLOUD BACKUP"

    warn "This will:"
    printf '  - Remove the cron job for TEV2 cloud backup\n'
    printf '  - Logout from MEGA (local session only)\n'
    printf '\n'
    printf '  Your backups on MEGA will NOT be deleted.\n'
    printf '\n'

    read -p "Continue? (y/n): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Cancelled"
        exit 0
    fi

    # Remove cron job
    if crontab -l 2>/dev/null | grep -q "TEV2-cloud-backup"; then
        info "Removing cron job..."
        crontab -l 2>/dev/null | grep -v "TEV2-cloud-backup" | crontab -
        ok "Cron job removed"
    else
        info "No cron job found"
    fi

    # Logout from MEGA
    local whoami_output
    whoami_output=$(mega-whoami 2>&1) || true
    if echo "$whoami_output" | grep -q "@"; then
        info "Logging out of MEGA..."
        mega-logout 2>&1 || true
        ok "Logged out of MEGA"
    else
        info "Not logged into MEGA"
    fi

    print_header "UNINSTALL COMPLETE"
    info "Cloud backup cron job removed"
    info "MEGA backups still exist at: $MEGA_REMOTE_FOLDER"
    info "To reinstall: ./scripts/setup-cloud-backup.sh"
}

#===============================================================================
# Summary
#===============================================================================

print_summary() {
    print_header "SETUP COMPLETE"

    local mega_email
    mega_email=$(mega-whoami 2>&1 | grep -oE '[^ ]+@[^ ]+' | head -1 || echo "unknown")

    printf '%b\n' "${WHITE}Cloud Backup Configuration:${NC}"
    printf '  MEGA account:    %s\n' "$mega_email"
    printf '  Remote folder:   %s\n' "$MEGA_REMOTE_FOLDER"
    printf '  Retention:       %s backups\n' "$MEGA_RETENTION"
    printf '\n'
    printf '%b\n' "${WHITE}Commands:${NC}"
    printf '  Manual backup:   ./scripts/backup.sh --cloud --compress\n'
    printf '  Cloud restore:   ./scripts/restore-cloud.sh --list\n'
    printf '  View cloud backups: mega-ls %s\n' "$MEGA_REMOTE_FOLDER"
    printf '\n'
    printf '%b\n' "${WHITE}First backup:${NC}"
    info "Run your first backup now:"
    printf '  cd %s\n' "$PROJECT_ROOT"
    printf '  ./scripts/backup.sh --cloud --compress\n'
}

#===============================================================================
# Main
#===============================================================================

main() {
    local uninstall="false"

    while [[ $# -gt 0 ]]; do
        case "$1" in
            -h|--help)
                show_help
                ;;
            --uninstall)
                uninstall="true"
                shift
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
    printf '%b\n' "${CYAN}${BOLD}║          TEV2 CLOUD BACKUP SETUP                          ║${NC}"
    printf '%b\n' "${CYAN}${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    printf '\n'

    if [[ "$uninstall" == "true" ]]; then
        do_uninstall
        exit 0
    fi

    install_megacmd
    login_mega
    create_remote_folders
    setup_cron
    print_summary
}

main "$@"
