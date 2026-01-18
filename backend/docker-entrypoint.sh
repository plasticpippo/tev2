#!/bin/sh
set -e

# Run pending migrations only once
echo "Checking for pending database migrations..."
npx prisma migrate deploy || echo "Migration completed or failed (this is expected if migrations have already been applied)"

# Start the application
echo "Starting the application..."
exec npm start