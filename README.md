# This app is 100% vibe coded and has many vulnerabilities.
# USE AT YOUR OWN RISK

# Bar POS

Point-of-sale system for bars and restaurants

## Features

- **Product Management** - Products with variants, colors, favorites, per-variant tax rates
- **Order Processing** - Transactions with discounts, tips, multiple payment methods
- **Table/Floor Management** - Rooms, tables with drag-drop positioning, status tracking, capacity
- **Inventory/Stock** - Automatic consumption tracking, manual adjustments, consumption reports
- **Daily Closings** - End-of-day financial summaries
- **Analytics** - Product performance, top sellers, hourly breakdown
- **Multi-Tax Rates** - Inclusive/exclusive/none modes, per-product assignment
- **Custom Layouts** - Customizable product grids per till, shared layouts
- **Business Hours** - Configurable start time, midnight-crossing, auto-close
- **Security** - JWT auth, role-based access, token blacklisting
- **Internationalization** - English and Italian

## Installation

### Prerequisites

- Docker 20.10+
- Docker Compose v2.0+
- Linux

### Quick Setup

```bash
cp .env.example .env
openssl rand -hex 64  # generate JWT_SECRET
# edit .env with your JWT_SECRET
docker compose up -d --build
```

### Automated

```bash
sudo ./install.sh
```

### Access

- URL: http://localhost
- Admin credentials: admin / admin123

## Managing

- **Start**: `docker compose up -d`
- **Stop**: `docker compose down`
- **Logs**: `docker compose logs -f`
- **Reset**: `docker compose down -v && docker compose up -d --build`

## Architecture

- **PostgreSQL** - Database
- **Express** - Backend API
- **React/Vite** - Frontend
- **Nginx** - Reverse proxy

```
Internet -> Nginx -> Backend -> Database
```

## Configuration

Key environment variables (see `.env.example` for full list):

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for JWT tokens (generate with `openssl rand -hex 64`) |
| `POSTGRES_USER` | Database username |
| `POSTGRES_PASSWORD` | Database password |
| `POSTGRES_DB` | Database name |
| `PORT` | Backend port (default: 3000) |
| `FRONTEND_URL` | Frontend URL for CORS |

## Troubleshooting

```bash
# View logs
docker compose logs -f

# Restart a service
docker compose restart backend

# Check running containers
docker compose ps

# Access database
docker exec -it bar-pos-db-1 psql -U totalevo_user -d bar_pos

# Rebuild after changes
docker compose up -d --build
```
