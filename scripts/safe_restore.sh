#!/usr/bin/env bash

#===============================================================================
# DEPRECATED - This script has been merged into restore.sh
#
# NOTE: This wrapper will be removed in a future release. Please update your
# scripts and documentation to use ./scripts/restore.sh directly.
#
# Use: ./scripts/restore.sh [OPTIONS] [BACKUP_FILE]
#
# Options:
#   -h, --help           Show help
#   -f, --force          Skip confirmation prompt
#   -l, --list           List available backups
#   --skip-migrations    Skip migration handling
#===============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

printf '\n'
printf '%b\n' "\033[1;33m[DEPRECATED]\033[0m safe_restore.sh has been merged into restore.sh"
printf '%b\n' "\033[1;33m[DEPRECATED]\033[0m This wrapper will be removed in a future release."
printf '%b\n' "\033[1;33m[DEPRECATED]\033[0m Please update to use: restore.sh [OPTIONS] [BACKUP_FILE]"
printf '%b\n' "\033[1;33m[DEPRECATED]\033[0m Redirecting to: restore.sh $*"
printf '\n'

exec "$SCRIPT_DIR/restore.sh" "$@"
