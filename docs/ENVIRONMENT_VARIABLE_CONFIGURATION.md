# Environment Variable Configuration for Bar POS System

This document outlines the environment variable configuration for different deployment scenarios in the Bar POS system, specifically focusing on the new architecture where the backend API is not publicly exposed.

## Overview

The Bar POS system supports flexible configuration through environment variables to accommodate different deployment scenarios including local development, LAN deployment, and production environments. The updated architecture ensures that the backend service is only accessible through internal Docker networking for enhanced security.

## Environment Variables

### Database Configuration
- `POSTGRES_USER`: PostgreSQL username (default: `totalevo_user`)
- `POSTGRES_PASSWORD`: PostgreSQL password (default: `totalevo_password`)
- `POSTGRES_DB`: PostgreSQL database name (default: `bar_pos`)
- `DB_HOST`: Database host address (default: `localhost`)
- `DB_PORT`: Database port (default: `5432`)

### Backend Configuration
- `BACKEND_PORT`: Backend server port (default: `3001`)
- `BACKEND_EXTERNAL_PORT`: External port for backend (commented out since backend is not exposed externally)
- `NODE_ENV`: Environment mode (default: `development`)
- `BACKEND_CORS_ORIGIN`: Comma-separated list of allowed origins for CORS (default: `http://frontend:3000,http://localhost:3000,http://127.0.0.1:3000,http://0.0.0.0:3000`)

### Frontend Configuration
- `FRONTEND_PORT`: Frontend server port (default: `3000`)
- `FRONTEND_EXTERNAL_PORT`: External port for frontend (default: `3000`)
- `FRONTEND_API_URL`: Backend API URL (default: `http://backend:3001`) - this ensures frontend communicates with backend through internal Docker network
- `LAN_IP`: Local area network IP address for accessing the frontend from other devices (default: `localhost`)
- `FRONTEND_LAN_URL`: Complete URL to access frontend from LAN (default: `http://${LAN_IP}:3000`)

### Frontend Vite Configuration
- `VITE_API_URL`: API URL for Vite proxy (default: `http://backend:3001`) - configured to use internal container name
- `VITE_HOST`: Host address for Vite server (default: `0.0.0.0`)
- `VITE_PORT`: Port for Vite server (default: `3000`)

## Updated Deployment Architecture

### Internal Communication Pattern
With the updated configuration, the architecture follows this pattern:
- Database service (db) is internal only and not exposed to external networks
- Backend service runs internally on port 3001 within the Docker network and is not exposed externally
- Frontend service accesses backend using the container name: `http://backend:3001`
- Frontend service is exposed to external network for LAN access on port 3000
- Both backend and frontend services are connected via the `pos_network` Docker network

### Security Benefits
- Backend service is no longer exposed to external networks
- Reduces attack surface by limiting access to internal container network only
- Maintains functionality for frontend-backend communication
- Preserves LAN access capability for frontend while securing backend

## Configuration Examples

### Local Development
For local development, use the default values in the `.env` file:

```env
# Database Configuration
POSTGRES_USER=totalevo_user
POSTGRES_PASSWORD=totalevo_password
POSTGRES_DB=bar_pos
DB_HOST=localhost
DB_PORT=5432

# Backend Configuration
BACKEND_PORT=3001
# BACKEND_EXTERNAL_PORT=3001  # Commented out since backend is not exposed externally
NODE_ENV=development
BACKEND_CORS_ORIGIN=http://frontend:3000,http://localhost:3000,http://127.0.0.1:3000,http://0.0.0.0:3000

# Frontend Configuration
FRONTEND_PORT=3000
FRONTEND_EXTERNAL_PORT=3000
FRONTEND_API_URL=http://backend:3001
LAN_IP=${LAN_IP:-localhost}
FRONTEND_LAN_URL=http://${LAN_IP}:3000
```

### LAN Deployment
For LAN deployment, the configuration remains largely the same, but you would update the LAN_IP variable:

```env
# Use your actual LAN IP address
LAN_IP=192.168.1.x
FRONTEND_LAN_URL=http://${LAN_IP}:3000
```

## Docker Compose Configuration

The docker-compose.yml file uses these environment variables to configure the services with the updated security model:

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-totalevo_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-totalevo_password}
      POSTGRES_DB: ${POSTGRES_DB:-bar_pos}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - pos_network

  backend:
    build: ./backend
    # No external ports exposed - backend is internal only
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER:-totalevo_user}:${POSTGRES_PASSWORD:-totalevo_password}@db:5432/${POSTGRES_DB:-bar_pos}
      - PORT=${BACKEND_PORT:-3001}
      - NODE_ENV=${NODE_ENV:-development}
      - CORS_ORIGIN=${BACKEND_CORS_ORIGIN:-http://frontend:3000,http://localhost:3000,http://127.0.0.1:3000}
    depends_on:
      - db
    restart: always
    networks:
      - pos_network

  frontend:
    build: ./frontend
    ports:
      - "${FRONTEND_EXTERNAL_PORT:-3000}:${FRONTEND_PORT:-3000}"
    environment:
      - VITE_API_URL=${FRONTEND_API_URL:-http://backend:3001}
    depends_on:
      - backend
    restart: always
    networks:
      - pos_network

networks:
  pos_network:
    driver: bridge

volumes:
  postgres_data:
```

## Environment Variable Flexibility in Node.js

When using environment variables in Node.js with the dotenv package, note that bash-style parameter expansion (e.g., `${VAR:-default}`) is used in Docker Compose files but should use simple key-value pairs in your .env files for direct Node.js usage (e.g., `PORT=3001`).

## Configuration Best Practices

1. Always use environment variables for configuration that might change between environments
2. When using the dotenv package in Node.js, use simple key-value pairs in your .env files (e.g., `PORT=3001` instead of `PORT=${PORT:-3001}`)
3. Use default values in your application code rather than in the .env files for flexibility
4. Never commit sensitive information like passwords to version control
5. Use different environment files for different deployment scenarios (e.g., `.env.local`, `.env.production`)
6. Ensure CORS settings are appropriate for each deployment environment
7. Use secure, non-default passwords in production environments
8. Use Docker's environment variable substitution in docker-compose.yml files (which does support `${VAR:-default}` syntax)
9. Maintain the security principle of not exposing backend services externally while ensuring internal communication works properly
10. Test internal communication between containers after configuration changes