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
