#!/bin/sh
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo "${RED}[ERROR]${NC} $1"; }

# Function to run migrations with proper error handling
run_migrations() {
    log "Running database migrations..."
    
    # Run migrations
    npx prisma migrate deploy 2>&1
    
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "Migration failed with exit code: $exit_code"
        return $exit_code
    fi
    
    log "Migrations completed successfully"
    return 0
}

# Main entrypoint logic
log "Starting backend container..."

# Wait for database to be ready
log "Waiting for database..."
max_attempts=60
attempt=0
while [[ $attempt -lt $max_attempts ]]; do
    if echo "SELECT 1" | npx prisma db execute --stdin > /dev/null 2>&1; then
        log "Database is ready"
        break
    fi
    attempt=$((attempt + 1))
    log "Database not ready, waiting... (attempt $attempt/$max_attempts)"
    sleep 2
done

if [[ $attempt -ge $max_attempts ]]; then
    log_error "Database did not become ready in time"
    exit 1
fi

# Run migrations
if ! run_migrations; then
    log_error "Migration failed! Container will not start."
    log_error "Please check the logs and restore from backup if needed."
    exit 1
fi

# Start the application
log "Starting application..."
exec node dist/index.js
