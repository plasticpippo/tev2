# Backend Container Configuration for Bar POS System

## Overview
This document describes the backend container configuration for the Bar POS system using Docker and Docker Compose.

## Services Configuration

### Database Service (PostgreSQL)
- **Image**: postgres:15
- **Container Name**: bar_pos_backend_db
- **Environment Variables**:
  - `POSTGRES_USER`: ${POSTGRES_USER:-totalevo_user}
  - `POSTGRES_PASSWORD`: ${POSTGRES_PASSWORD:-totalevo_password}
  - `POSTGRES_DB`: ${POSTGRES_DB:-bar_pos}
- **Volumes**: Persistent storage for database data
- **Health Check**: Uses `pg_isready` to verify database readiness
- **Network**: Internal `pos_network` (not exposed externally)

### Backend Service
- **Build Context**: ./backend
- **Dockerfile**: ./backend/Dockerfile
- **Container Name**: bar_pos_backend
- **Environment Variables**:
  - `DATABASE_URL`: PostgreSQL connection string to the db service
 - `PORT`: ${BACKEND_PORT:-3001}
  - `HOST`: 0.0.0 (to allow external connections)
  - `NODE_ENV`: ${NODE_ENV:-development}
  - `CORS_ORIGIN`: Whitelist of allowed origins
- **Dependencies**: Waits for database service to be healthy
- **Ports**: Exposes port 3001 for LAN access
- **Health Check**: HTTP check on /health endpoint
- **Network**: `pos_network` for internal communication

### Frontend Service
- **Build Context**: ./frontend
- **Dockerfile**: ./frontend/Dockerfile
- **Container Name**: bar_pos_frontend
- **Environment Variables**: API URL pointing to backend
- **Ports**: Exposes port 3000 for external access
- **Dependencies**: Waits for backend service to be healthy
- **Network**: `pos_network` for internal communication

## Network Configuration
- **Internal Network**: `pos_network` using bridge driver
- Enables communication between services while keeping them isolated
- Database is only accessible internally by the backend service

## Volume Configuration
- **postgres_data**: Named volume for persistent PostgreSQL data storage
- Ensures data persistence across container restarts

## Health Checks
- **Database**: Uses `pg_isready` command to verify PostgreSQL readiness
- **Backend**: HTTP GET request to /health endpoint
- **Frontend**: HTTP GET request to /health endpoint
- All services wait for dependencies to be healthy before starting

## CORS Configuration
- Configured to allow multiple origins for LAN access
- Includes frontend service, localhost, and IP-based access

## Environment Variables
The configuration uses environment variables with sensible defaults:
- `BACKEND_PORT`: 3001
- `BACKEND_EXTERNAL_PORT`: 3001 (for LAN access)
- `FRONTEND_PORT`: 3000
- `FRONTEND_EXTERNAL_PORT`: 3000
- Database credentials with default values

## LAN Access
- Backend service is configured to allow LAN access by:
  - Binding to 0.0.0.0 instead of localhost
  - Exposing port 3001 to the host
  - Including LAN addresses in CORS configuration

## Build and Deployment
To start the services:
```bash
docker-compose up --build -d
```

To stop the services:
```bash
docker-compose down
```

## Security Considerations
- Database is not exposed externally
- CORS configuration limits which origins can access the API
- Environment variables keep sensitive information out of the code
- Services run in isolated network