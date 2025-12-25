# Environment Variable Configuration for Bar POS System

This document outlines the environment variable configuration for different deployment scenarios in the Bar POS system.

## Overview

The Bar POS system supports flexible configuration through environment variables to accommodate different deployment scenarios including local development, LAN deployment, and production environments.

## Environment Variables

### Database Configuration
- `POSTGRES_USER`: PostgreSQL username (default: `totalevo_user`)
- `POSTGRES_PASSWORD`: PostgreSQL password (default: `totalevo_password`)
- `POSTGRES_DB`: PostgreSQL database name (default: `bar_pos`)
- `DB_HOST`: Database host address (default: `localhost`)
- `DB_PORT`: Database port (default: `5432`)

### Backend Configuration
- `BACKEND_PORT`: Backend server port (default: `3001`)
- `BACKEND_EXTERNAL_PORT`: External port for backend (default: `3001`)
- `NODE_ENV`: Environment mode (default: `development`)
- `BACKEND_CORS_ORIGIN`: Comma-separated list of allowed origins for CORS (default: `http://frontend:3000,http://localhost:3000,http://127.0.1:3000`)

### Frontend Configuration
- `FRONTEND_PORT`: Frontend server port (default: `3000`)
- `FRONTEND_EXTERNAL_PORT`: External port for frontend (default: `3000`)
- `FRONTEND_API_URL`: Backend API URL (default: `http://backend:3001`)

### Frontend Vite Configuration
- `VITE_API_URL`: API URL for Vite proxy (default: `http://192.168.1.241:3001`)
- `VITE_HOST`: Host address for Vite server (default: `0.0.0.0`)
- `VITE_PORT`: Port for Vite server (default: `3000`)

## Deployment Scenarios

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
BACKEND_EXTERNAL_PORT=3001
NODE_ENV=development
BACKEND_CORS_ORIGIN=http://frontend:3000,http://localhost:3000,http://127.0.1:3000

# Frontend Configuration
FRONTEND_PORT=3000
FRONTEND_EXTERNAL_PORT=3000
FRONTEND_API_URL=http://backend:3001
```

### LAN Deployment
For LAN deployment, update the relevant environment variables to match your network configuration:

```env
# Database Configuration
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_DB=your_db
DB_HOST=your_database_server_ip
DB_PORT=5432

# Backend Configuration
BACKEND_PORT=3001
BACKEND_EXTERNAL_PORT=3001
NODE_ENV=production
BACKEND_CORS_ORIGIN=http://your_frontend_ip:3000,http://192.168.1.241:3000

# Frontend Configuration
FRONTEND_PORT=3000
FRONTEND_EXTERNAL_PORT=3000
FRONTEND_API_URL=http://your_backend_ip:3001
VITE_API_URL=http://your_backend_ip:3001
VITE_HOST=0.0.0.0
VITE_PORT=3000
```

### Production Deployment
For production deployment, ensure secure values for all environment variables:

```env
# Database Configuration
POSTGRES_USER=production_user
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=production_db
DB_HOST=production_database_host
DB_PORT=5432

# Backend Configuration
BACKEND_PORT=3001
BACKEND_EXTERNAL_PORT=3001
NODE_ENV=production
BACKEND_CORS_ORIGIN=https://yourdomain.com

# Frontend Configuration
FRONTEND_PORT=3000
FRONTEND_EXTERNAL_PORT=3000
FRONTEND_API_URL=https://api.yourdomain.com
VITE_API_URL=https://api.yourdomain.com
VITE_HOST=0.0.0.0
VITE_PORT=3000
```

## Docker Compose Configuration

The docker-compose.yml file uses these environment variables to configure the services:

```yaml
version: '3.8'
services:
  db:
    image: postgres:13
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-totalevo_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-totalevo_password}
      POSTGRES_DB: ${POSTGRES_DB:-bar_pos}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

 backend:
    build: ./backend
    ports:
      - "${BACKEND_EXTERNAL_PORT:-3001}:${BACKEND_PORT:-3001}"
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER:-totalevo_user}:${POSTGRES_PASSWORD:-totalevo_password}@db:5432/${POSTGRES_DB:-bar_pos}
      - PORT=${BACKEND_PORT:-3001}
      - NODE_ENV=${NODE_ENV:-development}
      - CORS_ORIGIN=${BACKEND_CORS_ORIGIN:-http://frontend:3000,http://localhost:3000,http://127.0.0.1:3000}
    depends_on:
      - db
    restart: always

  frontend:
    build: ./frontend
    ports:
      - "${FRONTEND_EXTERNAL_PORT:-3000}:${FRONTEND_PORT:-3000}"
    environment:
      - VITE_API_URL=${FRONTEND_API_URL:-http://backend:3001}
    depends_on:
      - backend
    restart: always

volumes:
  postgres_data:
```

## Environment Variable Flexibility in Node.js

When using environment variables in Node.js with the dotenv package, note that bash-style parameter expansion (e.g., `${VAR:-default}`) is not supported by default. To maintain flexibility across different deployment scenarios, you can:

1. Use default values in your application code:
   ```javascript
   const port = process.env.PORT || 3001;
   const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/bar_pos';
   ```

2. Provide multiple environment files for different scenarios:
   - `.env.local` for local development
   - `.env.production` for production
   - `.env.staging` for staging environments

3. Use runtime configuration based on NODE_ENV:
   ```javascript
   const config = {
     development: {
       port: 3001,
       cors: ['http://localhost:3000', 'http://localhost:5173']
     },
     production: {
       port: 80,
       cors: ['https://yourdomain.com']
     }
   };
   
   const currentConfig = config[process.env.NODE_ENV] || config.development;
   ```

## Configuration Best Practices

1. Always use environment variables for configuration that might change between environments
2. When using the dotenv package in Node.js, use simple key-value pairs in your .env files (e.g., `PORT=3001` instead of `PORT=${PORT:-3001}`)
3. Use default values in your application code rather than in the .env files for flexibility
4. Never commit sensitive information like passwords to version control
5. Use different environment files for different deployment scenarios (e.g., `.env.local`, `.env.production`)
6. Ensure CORS settings are appropriate for each deployment environment
7. Use secure, non-default passwords in production environments
8. Use Docker's environment variable substitution in docker-compose.yml files (which does support `${VAR:-default}` syntax)