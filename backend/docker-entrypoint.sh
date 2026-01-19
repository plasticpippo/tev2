#!/bin/sh
set -e

# Run pending migrations only once
echo "Checking for pending database migrations..."
npx prisma migrate deploy || echo "Migration completed or failed (this is expected if migrations have already been applied)"

# Seed the database with default data
echo "Seeding the database with default data..."
npx prisma db seed || echo "Database seeding completed or failed (this is expected if seed data already exists)"

# Start the application
echo "Starting the application..."
exec npm start