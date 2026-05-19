> **This app is 100% vibe coded and has many vulnerabilities.**
> **USE AT YOUR OWN RISK**

# Bar POS

Point-of-sale system for bars and restaurants. Built as a containerised full-stack application with a React frontend, Express API backend, and PostgreSQL database.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Overview](#api-overview)
- [Project Structure](#project-structure)
- [Development](#development)
- [Upgrading](#upgrading)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

### Point of Sale

- **Product grid** with category tabs, favourites, and colour-coded buttons
- **Drag-and-drop layout editor** for arranging product buttons per till, with shared layout templates
- **Order panel** with quantity adjustment, tax calculation, tips, and discounts
- **Multiple payment methods** (cash, card)
- **Idempotent payment processing** with atomic stock decrement and session cleanup

### Tab and Table Management

- **Open tabs** -- create, load, save, close, and transfer items between tabs
- **Rooms and tables** -- visual drag-drop table layout editor with status tracking and capacity

### Inventory and Stock

- **Stock items** with purchasing units, standard cost tracking, and precision to 6 decimal places
- **Consumption recipes** linking product variants to stock ingredients
- **Manual adjustments** with reason tracking
- **Itemised consumption reports** and stock summary reports

### Receipts and Fiscal Compliance

- **Full receipt lifecycle**: draft, issued, voided, emailed
- **Sequential receipt numbering** with configurable prefix and year-based sequences
- **PDF generation** via headless Chromium with Handlebars templates
- **Email delivery** with queued processing, retry logic, and status tracking
- **Complete audit trail** for every receipt action

### Profitability Analytics

- **Cost management** -- ingredient cost tracking with history
- **Margin analysis** by category, product, and daily trend
- **Variance reports** comparing theoretical vs. actual cost
- **Inventory counts** with full, partial, and spot count support
- **Profit dashboard** with KPIs, comparison, and period analysis

### Business Operations

- **Daily closings** with end-of-day financial summaries (manual or automatic)
- **Business hours** -- configurable start time, midnight-crossing support, auto-close via cron
- **Customer management** with name, email, VAT number, and address book
- **Database backup** via `pg_dump` from the admin panel

### Analytics

- **Sales trends** with hourly breakdown and date comparison
- **Top performers** and product performance metrics
- **Dashboard** with live sales feed, till status, and total sales ticker

### Security

- JWT authentication with token blacklisting and CSRF double-submit cookies
- Role-based access control (Admin / Cashier)
- Helmet security headers, rate limiting, and OWASP-compliant error handling
- Input validation with Zod, sanitisation with DOMPurify, bcrypt password hashing
- Correlation IDs on every request, structured logging with Winston

### Internationalisation

- English and Italian translations
- Auto-detection from browser language with manual switcher

### Additional

- **Virtual on-screen keyboard** for touchscreen devices
- **Fullscreen mode** for kiosk deployments
- **Legacy browser support** (Chrome 77+, Firefox 68+, Android 10+)

---

## Architecture

```
Client Browser
       |
       v
   Nginx (reverse proxy, port 80)
      / \
     v   v
 Frontend   /api/* --> Backend (Express, port 3001)
 (React)                   |
   :3000                   v
                      PostgreSQL (port 5432)
```

All services run in Docker containers connected via an internal bridge network. Only the Nginx container is exposed to the host. A development override file can optionally expose the database and frontend ports directly.

### Container Names

| Container | Image | Purpose |
|-----------|-------|---------|
| `bar_pos_nginx` | `nginx:alpine` | Reverse proxy, static assets, security headers, rate limiting |
| `bar_pos_frontend` | Custom build | React SPA served by Nginx |
| `bar_pos_backend` | Custom build | Express REST API with Prisma ORM |
| `bar_pos_backend_db` | `postgres:15` | PostgreSQL database |
| `bar_pos_mailhog` | `mailhog/mailhog:v1.0.1` | Mock SMTP for development (internal only) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite 6, Tailwind CSS 3 |
| **Backend** | Express 4, TypeScript, Prisma 5, Node.js 20 |
| **Database** | PostgreSQL 15 |
| **PDF Generation** | Puppeteer (system Chromium in Alpine) |
| **Email** | Nodemailer |
| **Reverse Proxy** | Nginx (Alpine) |
| **State Management** | React Context API |
| **i18n** | i18next with lazy-loaded JSON namespaces |
| **Containerisation** | Docker Compose |

---

## Prerequisites

- **Linux** (tested on Debian/Ubuntu; installer supports Fedora, Arch, openSUSE, Alpine)
- **Docker** 20.10+
- **Docker Compose** v2.0+
- **10 GB** minimum free disk space

---

## Installation

### Option 1: Automated Installer

```bash
sudo ./install.sh
```

The installer detects the Linux distribution, installs Docker if needed, generates secrets interactively, and deploys the containers.

Non-interactive mode (uses defaults):

```bash
sudo ./install.sh --non-interactive
```

Additional options:

```bash
./install.sh --help                # Show all options
./install.sh --skip-docker         # Skip Docker installation
./install.sh --verbose             # Detailed logging
./install.sh --url http://192.168.1.100 --nginx-port 8080
```

### Option 2: Manual Setup

```bash
# 1. Copy and edit the environment file
cp .env.example .env

# 2. Generate a JWT secret (at least 64 characters)
openssl rand -hex 64

# 3. Edit .env -- set JWT_SECRET, URL, and NGINX_PORT at minimum
#    See the Configuration section below for all variables.

# 4. Build and start
docker compose up -d --build
```

### First Access

- **URL**: `http://<YOUR_HOST_IP>` (or `http://localhost` if running locally)
- **Default admin credentials**: `admin` / `admin123`
- Change the admin password immediately after first login.

---

## Configuration

All configuration is managed through a single `.env` file in the project root. Copy `.env.example` to get started.

### Core Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `URL` | `http://localhost` | Application URL (LAN IP, domain, or localhost) |
| `NGINX_PORT` | `80` | Port exposed by Nginx |
| `POSTGRES_USER` | `totalevo_user` | Database username |
| `POSTGRES_PASSWORD` | `totalevo_password` | Database password |
| `POSTGRES_DB` | `bar_pos` | Database name |
| `JWT_SECRET` | -- | Secret for JWT signing (generate with `openssl rand -hex 64`) |
| `NODE_ENV` | `development` | `development` (detailed errors) or `production` (generic errors) |

### Application Settings (Admin Panel)

The following are configured from the **Settings** page inside the application, not from `.env`:

| Setting | Description |
|---------|-------------|
| Tax mode | Inclusive, exclusive, or none |
| Default tax rate | Applied to new products |
| Business day end hour | When the business day rolls over (default 06:00) |
| Auto-close | Automatically close the business day at the configured hour |
| Receipt prefix and numbering | Customisable receipt number format |
| Email (SMTP) | SMTP host, port, credentials, from address |
| Business information | Name, address, VAT number, logo |

### Development Port Exposure

By default, Docker Compose auto-merges `docker-compose.override.yml` if it exists, exposing additional ports for development. To disable development port exposure in production:

```bash
# Option 1: Remove the override file
rm docker-compose.override.yml

# Option 2: Explicitly use only the base file
docker compose -f docker-compose.yml up -d
```

---

## Usage

### Daily Operations

1. **Log in** at the application URL with your credentials.
2. **Select a till** (terminal) if prompted.
3. **Take orders** by tapping product buttons on the grid, adjusting quantities in the order panel.
4. **Open a tab** to hold an order for later, or assign it to a table.
5. **Process payment** with cash or card. Optionally issue a receipt.
6. **End the day** by running a daily closing from the admin panel.

### Admin Panel

Admin users can toggle the admin panel from the main POS screen. It provides access to:

- Dashboard with live sales
- Product, category, and stock item management
- User and till management
- Transaction history with void capability
- Receipt management and email queue
- Analytics and profit reports
- Cost management, inventory counts, and variance reports
- Daily closing summaries
- Customer management
- Business settings (tax, hours, receipts, email, business info)
- Database backup download

---

## API Overview

All API routes are served under `/api` and require JWT authentication unless noted.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/users/login` | Public | Login, returns JWT |
| `POST` | `/api/users/auth/logout` | Token | Logout, revokes token |
| `POST` | `/api/users/auth/revoke-all` | Admin | Revoke all tokens for a user |

### Core Resources

| Resource | Endpoints | Description |
|----------|-----------|-------------|
| Products | `GET/POST /api/products`, `GET/PUT/DELETE /api/products/:id` | Product catalogue with variants |
| Categories | `GET/POST /api/categories`, `GET/PUT/DELETE /api/categories/:id` | Product categories |
| Transactions | `POST /api/transactions/process-payment`, `GET /api/transactions`, `POST /:id/void` | Atomic payment processing |
| Tabs | `CRUD /api/tabs` | Open tab management |
| Tills | `CRUD /api/tills` | POS terminal management |
| Tables | `CRUD /api/tables`, `CRUD /api/rooms` | Room and table management |
| Users | `CRUD /api/users` | User management (Admin for create/delete) |

### Inventory and Stock

| Resource | Endpoints | Description |
|----------|-----------|-------------|
| Stock Items | `CRUD /api/stock-items` | Inventory items and ingredients |
| Stock Adjustments | `GET/POST /api/stock-adjustments` | Manual stock adjustments |
| Consumption Reports | `GET /api/consumption-reports/itemised`, `GET .../stock-summary` | Consumption analytics |

### Receipts

| Resource | Endpoints | Description |
|----------|-----------|-------------|
| Receipts | `CRUD /api/receipts`, `POST /:id/issue`, `POST /:id/void` | Full receipt lifecycle |
| PDF | `GET /api/receipts/:id/pdf`, `GET .../download` | PDF generation and download |
| Email | `POST /api/receipts/:id/email`, `POST .../resend-email` | Email delivery |
| Audit | `GET /api/receipts/audit`, `GET /api/receipts/:id/audit` | Audit trail |

### Analytics and Profitability

| Resource | Endpoints | Description |
|----------|-----------|-------------|
| Analytics | `GET /api/analytics/product-performance`, `hourly-sales`, `top-performers`, `compare`, `profit-dashboard` | Sales analytics |
| Cost Management | `GET/POST /api/cost-management/ingredients`, `variants/:id/cost-breakdown`, `variance-reports` | Cost tracking and variance |
| Daily Closings | `GET/POST /api/daily-closings` | End-of-day summaries |

### Settings and Configuration

| Resource | Endpoints | Description |
|----------|-----------|-------------|
| Tax Rates | `CRUD /api/tax-rates` | Configurable tax rates |
| Customers | `CRUD /api/customers` | Customer management |
| Layouts | `GET/PUT /api/layouts/till/:tillId/category/:categoryId`, `CRUD /api/layouts/shared` | Per-till and shared layouts |
| Settings | `GET/PUT /api/settings` | Application settings |

### Health and Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Full health check (server + database + memory) |
| `GET` | `/api/health` | API health check |
| `GET` | `/api/version` | Version information |

---

## Project Structure

```
tev2/
├── backend/                    # Express API server
│   ├── Dockerfile              # Multi-stage build (Node 20 Alpine + Chromium)
│   ├── docker-entrypoint.sh    # DB wait, migrations, seed, start
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema (30 models)
│   │   ├── seed.ts             # Initial data seeding
│   │   └── migrations/         # Prisma migration files
│   ├── src/
│   │   ├── index.ts            # Express app bootstrap
│   │   ├── routes/             # 22 route modules
│   │   ├── middleware/         # Auth, CSRF, rate limiting, validation, logging
│   │   ├── services/           # Business logic services
│   │   ├── utils/              # Helpers and utilities
│   │   └── types/              # TypeScript type definitions
│   ├── templates/              # Handlebars receipt/email templates
│   ├── locales/                # Backend i18n translation files
│   └── assets/fonts/           # Fonts for PDF generation
│
├── frontend/                   # React single-page application
│   ├── Dockerfile              # Multi-stage build (Node 20 -> Nginx Alpine)
│   ├── index.tsx               # Entry point with i18n bootstrap
│   ├── App.tsx                 # Root component with providers
│   ├── contexts/               # React Context state management
│   │   ├── AppContext.tsx       # Facade combining all contexts
│   │   ├── SessionContext.tsx   # Auth state, login/logout
│   │   ├── GlobalDataContext.tsx # Products, categories, settings, etc.
│   │   ├── OrderContext.tsx     # Cart/order items
│   │   ├── PaymentContext.tsx   # Payment processing
│   │   ├── UIStateContext.tsx   # Modal state
│   │   ├── TabManagementContext.tsx # Tab operations
│   │   └── ...                 # Toast, table assignment, etc.
│   ├── components/             # ~90 React components
│   │   ├── LoginScreen.tsx     # Login with virtual keyboard
│   │   ├── MainPOSInterface.tsx # Main POS screen
│   │   ├── AdminPanel.tsx      # Admin sidebar with 20 sub-views
│   │   ├── PaymentModal.tsx    # Payment processing
│   │   └── ...                 # Product grid, tabs, tables, analytics, etc.
│   ├── services/               # API service layer (one module per resource)
│   ├── src/                    # Layout customization feature module
│   │   ├── components/layout/  # Grid layout components with react-dnd
│   │   ├── contexts/           # Layout state, edit mode, dirty tracking
│   │   └── hooks/              # useLayout, useAutosave, useCategoryFilter
│   └── public/locales/         # Translation JSON files (en/, it/)
│       ├── en/                 # English (common, admin, pos, auth, errors, validation)
│       └── it/                 # Italian (same structure)
│
├── shared/                     # Shared TypeScript types and constants
│   ├── types.ts                # Data models used by both frontend and backend
│   └── constants.ts            # Shared constants
│
├── nginx/                      # Nginx configuration
│   ├── nginx.conf              # Reverse proxy, CORS, security headers, rate limiting
│   └── docker-entrypoint.sh    # Template variable substitution on startup
│
├── scripts/                    # Utility scripts
│   ├── backup.sh               # Database backup
│   ├── restore.sh              # Database restore
│   ├── safe_restore.sh         # Safe restore with validation
│   └── fix_migrations.sh       # Migration repair utility
│
├── docs/                       # Project documentation
├── docker-compose.yml          # Base service definitions
├── docker-compose.override.yml # Development port overrides (auto-merged)
├── .env.example                # Environment variable template
├── install.sh                  # Automated installation and upgrade script
├── VERSION                     # Current version (1.1.0)
└── package.json                # Monorepo root with workspace config
```

---

## Development

### Running Locally with Docker

```bash
# Start all services
docker compose up -d --build

# Follow logs
docker compose logs -f

# Rebuild a single service
docker compose up -d --build backend
```

### Database Migrations

Schema changes use Prisma migrations exclusively. Never use `db push` or manual SQL.

```bash
# Create a migration (after modifying prisma/schema.prisma)
cd backend
npx prisma migrate dev --name your_migration_name

# Deploy migrations (used in production/Docker)
npx prisma migrate deploy
```

### Accessing the Database

```bash
# From the host (if DB port is exposed via docker-compose.override.yml)
docker exec -it bar_pos_backend_db psql -U totalevo_user -d bar_pos

# One-off query
docker exec -it bar_pos_backend_db psql -U totalevo_user -d bar_pos -c "SELECT * FROM users;"
```

### Useful Commands

```bash
# Stop all services
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v && docker compose up -d --build

# Check container status
docker compose ps

# View backend logs
docker compose logs -f backend

# Restart a single service
docker compose restart backend
```

---

## Upgrading

The `install.sh` script handles upgrades automatically:

```bash
sudo ./install.sh
```

Upgrade process:

1. Detects previous installation (even pre-versioning)
2. Creates a database backup
3. Stops containers
4. Merges new environment variables while preserving existing secrets
5. Rebuilds containers
6. Applies database migrations
7. Validates the upgrade

To restore from the last backup if something goes wrong:

```bash
sudo ./install.sh --restore-backup
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Containers won't start | `docker compose logs <service>` to check logs |
| Database migration errors | `docker compose exec backend npx prisma migrate status` |
| Blank page on load | Check `URL` and `NGINX_PORT` in `.env` match your access URL |
| CORS errors | Ensure `URL` in `.env` matches the browser address exactly |
| PDF generation fails | Check backend logs; Chromium must be available in the container |
| Port already in use | Change `NGINX_PORT` in `.env` or stop the conflicting service |
| Cannot connect to DB | Verify `db` container is healthy: `docker compose ps` |

### Fresh Install Reset

```bash
docker compose down -v    # Remove all containers and volumes
docker compose up -d --build  # Rebuild from scratch
```

---

## License

Licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
