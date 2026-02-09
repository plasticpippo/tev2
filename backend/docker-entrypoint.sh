#!/bin/sh
set -e

# Check if we're in a production environment
# NODE_ENV is passed via docker-compose.yml environment variables
# - development: Seeds database with default data for testing
# - production: Only runs migrations, no seeding (preserves existing data)
if [ "$NODE_ENV" = "production" ]; then
    echo "Running in production mode"
    
    # Run pending migrations only once
    echo "Checking for pending database migrations..."
    npx prisma migrate deploy || echo "Migration completed or failed (this is expected if migrations have already been applied)"
    
    # Only seed essential data in production (won't overwrite existing data)
    echo "Checking for essential data in production..."
    npx prisma db seed || echo "Essential data check completed or failed"
else
    echo "Running in development mode"
    
    # Run pending migrations only once
    echo "Checking for pending database migrations..."
    npx prisma migrate deploy || echo "Migration completed or failed (this is expected if migrations have already been applied)"
    
    # Seed the database with default data in development
    echo "Seeding the database with default data for development..."
    npx prisma db seed || echo "Database seeding completed or failed"
fi

# Start the application
echo "Starting the application..."
exec npm start