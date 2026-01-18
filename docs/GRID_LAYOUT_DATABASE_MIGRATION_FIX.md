# Grid Layout Database Migration Fix

## Issue Description
The backend server was returning 500 Internal Server Errors for grid layout API calls due to a missing `shared` column in the `product_grid_layouts` table. The Prisma schema defined the `shared` column, but the database migration to add this column was missing from the migration history.

## Root Cause
- The Prisma schema included a `shared` boolean field in the `ProductGridLayout` model
- The corresponding database migration to add the `shared` column to the `product_grid_layouts` table was not applied
- When the backend tried to query the `shared` column, PostgreSQL threw an error: `column "product_grid_layouts.shared" does not exist`

## Solution Implemented

### 1. Added Missing Migration
Created a new migration file to add the missing `shared` column:
- File: `backend/prisma/migrations/20260117215000_add_shared_column_to_grid_layouts/migration.sql`
- Added `shared` column with BOOLEAN type and DEFAULT FALSE
- Added an index for the `shared` column for better query performance

### 2. Updated Docker Setup
Modified the Docker configuration to ensure migrations run automatically:
- Created `backend/docker-entrypoint.sh` script to handle migrations on startup
- Updated `backend/Dockerfile` to use the entrypoint script
- The script runs `npx prisma migrate deploy` before starting the application

### 3. Migration Handling
The entrypoint script handles migration errors gracefully:
- If migrations have already been applied, it continues without blocking
- If migrations are pending, they are applied before the application starts
- The application continues to start even if migration fails (for already applied migrations)

## API Endpoints Verified
- `GET /api/grid-layouts/tills/:tillId/grid-layouts` - Returns layouts for a specific till
- `GET /api/grid-layouts/tills/:tillId/layouts-by-filter/:filterType` - Returns layouts by filter type
- `GET /api/grid-layouts/tills/:tillId/current-layout` - Returns the current/default layout
- `GET /api/grid-layouts/shared` - Returns shared layouts
- All endpoints now return proper responses instead of 500 errors

## Testing Results
- Before fix: API endpoints returned 500 Internal Server Error with "Failed to fetch layouts"
- After fix: API endpoints return proper JSON responses (empty arrays or default objects when no data exists)

## Impact
- Fixes grid layout functionality in the frontend
- Enables shared layouts feature to work properly
- Resolves 500 errors that were preventing grid customization
- Ensures fresh installations will have the correct database schema

## Future Considerations
- All new installations will automatically apply this migration
- Existing installations that were experiencing the error will have the migration applied on next deployment
- The Docker setup now properly handles database migrations for future schema changes