# Database Container Configuration for Bar POS System

## Overview
This document describes the database container configuration for the Bar POS system using Docker and Docker Compose.

## Database Service Configuration

### PostgreSQL Container
- **Image**: postgres:15
- **Container Name**: bar_pos_backend_db
- **Environment Variables**:
  - `POSTGRES_USER`: totalevo_user
  - `POSTGRES_PASSWORD`: totalevo_password
  - `POSTGRES_DB`: bar_pos
- **Volumes**: Persistent storage for database data using named volume `postgres_data`
- **Health Check**: Uses `pg_isready` to verify database readiness
- **Network**: Internal `pos_network` (not exposed externally)

## Network Configuration
- **Internal Network**: `pos_network` using bridge driver
- Enables communication between services while keeping them isolated
- Database is only accessible internally by the backend service

## Volume Configuration
- **postgres_data**: Named volume for persistent PostgreSQL data storage
- Ensures data persistence across container restarts
- Data is stored outside the container for durability

## Health Checks
- **Database**: Uses `pg_isready` command to verify PostgreSQL readiness
- **Backend**: HTTP GET request to /health endpoint
- **Frontend**: HTTP GET request to /health endpoint
- All services wait for dependencies to be healthy before starting

## Environment Variables
The configuration uses environment variables with sensible defaults:
- `POSTGRES_USER`: totalevo_user
- `POSTGRES_PASSWORD`: totalevo_password
- `POSTGRES_DB`: bar_pos

## Security Considerations
- Database is not exposed externally
- Environment variables keep sensitive information out of the code
- Services run in isolated network
- Database credentials are managed through environment variables

## Docker Compose Integration
The database service is defined in `docker-compose.yml` and:
- Starts before the backend service
- Backend service depends on database being healthy
- Uses internal networking for communication
- Shares the same network with other services

## Prisma Integration
- Prisma schema is configured to connect to the PostgreSQL database
- Prisma client is generated during the build process
- Connection string uses the internal service name for database access

## Build and Deployment
The database container is built and deployed as part of the full system:
```bash
docker compose up --build -d
```

## Troubleshooting
- If the database fails to start, check the logs with `docker logs bar_pos_backend_db`
- Ensure the database service is healthy before starting dependent services
- Verify environment variables are properly set
- Check network connectivity between services

## Data Persistence
- Database data persists across container restarts
- Named volumes ensure data durability
- Backup strategies should be implemented for production environments