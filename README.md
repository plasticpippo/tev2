# This app is 100% vibe coded and has many vulnerabilities. USE AT YOUR OWN RISK


# Bar POS System - Docker Deployment

This project uses Docker Compose to deploy the Bar POS system with three containers:
- Frontend (exposed to external network)
- Backend/API (internal only)
- Database (internal only)

## Prerequisites

- Docker Engine
- Docker Compose

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Modify the `.env` file to match your requirements (optional, defaults will be used if not provided)

3. Start the services:
   ```bash
   docker-compose up -d
   ```

4. Access the application at `http://localhost:3000`

## Upgrading

The [`install.sh`](install.sh) script provides comprehensive upgrade handling with automatic version detection, database backups, and environment variable merging.

### Installation Types

The installer supports two installation types:

- **Fresh Installation**: When no previous version is detected (no `.version` file exists), the script performs a complete new installation.
- **Upgrade**: When an existing installation is detected, the script performs an upgrade with data preservation.

### Upgrade Process

When an upgrade is detected, the following workflow is executed:

1. **Version Detection**: The script reads the existing `.version` file to determine the current installed version.
2. **Database Backup**: A backup of the database is created automatically before any changes are made.
3. **Environment Variable Merging**: New environment variables from `.env.example` are automatically added to your existing `.env` file while preserving your custom values.
4. **Container Rebuild**: Docker containers are rebuilt with the new code.
5. **Database Migration**: Prisma migrations are applied to update the database schema.
6. **Post-Upgrade Validation**: The system verifies that all services are running correctly.

### Version File

The installation tracks version information in the `.version` file:

```
# TEV2 Application Version
VERSION=1.0.0
BUILD_DATE=2026-02-16
```

This file is automatically created during installation and updated during upgrades.

### Backup and Restore

#### Automatic Backups

- Backups are stored in the `./backups/` directory
- Backup file naming format: `db_backup_YYYYMMDD_HHMMSS.sql`
- A backup is automatically created before every upgrade

#### Restoring from Backup

To restore from the most recent backup:

```bash
./install.sh --restore-backup
```

To restore from a specific backup file:

```bash
./install.sh --restore-backup ./backups/db_backup_20260216_120000.sql
```

### Environment Variable Merging

During upgrades, new environment variables from [`.env.example`](.env.example) are automatically merged into your existing `.env` file:

- Existing values are **preserved** (never overwritten)
- New variables are **appended** with their default values
- Comments from the example file are included for context

This ensures you don't miss new configuration options when upgrading.

### Upgrade Commands

```bash
# Standard upgrade (automatic detection)
./install.sh

# Force rebuild without version change
docker compose up -d --build

# Restore from last backup
./install.sh --restore-backup

# View current version
cat .version
```

### Troubleshooting Upgrades

#### Migration Failures

If database migrations fail during upgrade:

1. Check the backend logs:
   ```bash
   docker compose logs backend
   ```

2. Restore from backup if needed:
   ```bash
   ./install.sh --restore-backup
   ```

3. Review the migration error and resolve manually if the issue persists.

#### Container Won't Start

If containers fail to start after upgrade:

```bash
# Check container status
docker compose ps

# View detailed logs
docker compose logs backend

# Restart services
docker compose restart
```

#### Database Connection Issues

If the backend cannot connect to the database:

1. Verify the database container is healthy:
   ```bash
   docker compose ps db
   ```

2. Check database logs:
   ```bash
   docker compose logs db
   ```

3. Ensure the database credentials in `.env` match the expected values.

## Configuration

The system can be configured using environment variables in a `.env` file:

### Database Configuration
- `POSTGRES_USER`: Database user (default: totalevo_user)
- `POSTGRES_PASSWORD`: Database password (default: totalevo_password)
- `POSTGRES_DB`: Database name (default: bar_pos)

### Backend Configuration
- `BACKEND_PORT`: Port for the backend service (default: 3001)
- `NODE_ENV`: Environment (default: development)
- `BACKEND_CORS_ORIGIN`: Comma-separated list of allowed origins (default: http://frontend:3000,http://localhost:3000,http://127.0.0.1:3000)

### Frontend Configuration
- `FRONTEND_PORT`: Internal port for the frontend (default: 3000)
- `FRONTEND_EXTERNAL_PORT`: External port for the frontend (default: 3000)
- `FRONTEND_API_URL`: URL for the backend API (default: http://backend:3001)

## Architecture

```
Internet
  |
  | (port 300)
  |
Frontend Container (nginx)
  |
  | (internal network)
  |
  +---> Backend/API Container (Express)
  |     |
  |     | (internal network)
  |     |
  |     +---> Database Container (PostgreSQL)
  |
  +---> Other services...
```

## Services

### Frontend
- Built with React and Vite
- Served by nginx
- Exposed to external network on port 3000
- Connects to backend via internal network

### Backend/API
- Built with Express.js
- Runs on port 3001 internally
- Connects to database via internal network
- Not exposed to external network

### Database
- PostgreSQL database
- Only accessible by backend service
- Not exposed to external network
- Persistent data stored in named volume

## Running in Different Environments

### Development
```bash
docker-compose up -d
```

### Production (with custom environment variables)
```bash
POSTGRES_PASSWORD=securepassword FRONTEND_EXTERNAL_PORT=80 docker-compose up -d
```

## Health Checks

Each service includes health checks:
- Database: Checks PostgreSQL connectivity
- Backend: Checks `/health` endpoint
- Frontend: Simple HTTP response

## Troubleshooting

1. Check service status:
   ```bash
   docker-compose ps
   ```

2. View logs:
   ```bash
   docker-compose logs -f
   ```

3. If the database migration fails, you might need to run:
   ```bash
   docker-compose exec backend npx prisma migrate dev
   ```

## Stopping the Services

```bash
docker-compose down
```

To remove containers, networks, and volumes:
```bash
docker-compose down -v
