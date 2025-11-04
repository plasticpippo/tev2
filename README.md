# DISCLAIMER: THIS APP HAS BEEN DEVELOPED WITH AI 
# USE AT YOUR OWN RISK

# Bar POS Pro - Point of Sale System

A comprehensive point of sale system with separate frontend and backend, featuring inventory management, user roles, analytics, and real-time data synchronization. Designed for bars, restaurants, and retail businesses with multiple tills and advanced inventory tracking capabilities.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [LAN Access](#lan-access)
- [Default Credentials](#default-credentials)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Features

### Core POS Functionality
- **Multi-Till Support**: Manage multiple tills simultaneously with individual tracking
- **Product Management**: Create and manage products with multiple variants and pricing
- **Real-time Transactions**: Process sales with multiple payment methods (Cash, Card, Other)
- **Tab Management**: Open, save, and manage customer tabs for ongoing orders
- **Table Management**: Visual layout editor for room and table management with drag-and-drop functionality
- **Order History**: Complete transaction history with detailed item breakdowns

### Inventory Management
- **Stock Tracking**: Monitor inventory levels in real-time with automatic consumption tracking
- **Stock Adjustments**: Manual stock adjustments with reason tracking and audit trail
- **Ingredient Consumption**: Track ingredient usage per product variant
- **Multiple Units**: Support for different purchasing units with conversion multipliers
- **Stock Alerts**: Monitor low inventory levels and consumption patterns

### User Management & Roles
- **Role-based Access**: Admin and Cashier roles with different permission levels
- **User Authentication**: Secure login with password protection
- **Activity Logging**: Track all user actions including item removals and order clearing
- **Performance Reports**: Detailed user performance analytics and sales tracking

### Analytics & Reporting
- **Sales Analytics**: Visual charts for hourly sales, trends, and top performers
- **Transaction Reports**: Filterable transaction history by date, till, and user
- **Business Day Management**: Automatic business day start and manual close functionality
- **Tax Reporting**: Configurable tax settings with inclusive, exclusive, or no tax modes

### Advanced Features
- **AI Assistant**: Integrated Gemini AI for business insights and recommendations
- **Offline Capability**: Local storage fallback for continued operation during network issues
- **Virtual Keyboard**: On-screen keyboard for touch-screen terminals
- **Tax Configuration**: Flexible tax settings for different jurisdictions
- **Category Management**: Organize products by categories with till-specific visibility
- **Table Management**: Complete restaurant floor management with visual layout editor and table assignment

## Project Structure

```
├── frontend/                 # React-based user interface
│   ├── components/          # React components for UI
│   ├── services/            # API service and AI integration
│   ├── utils/               # Helper functions
│   └── src/                 # Core frontend files
├── backend/                 # Express.js API server with database integration
│   ├── src/
│   │   ├── handlers/        # API route handlers
│   │   ├── __tests__/       # Unit and integration tests
│   │   └── types.ts         # Backend type definitions
│   └── prisma/              # Database schema and migrations
├── shared/                  # Shared types and constants between frontend and backend
├── docs/                    # Documentation files
└── docker-compose.yml       # Docker configuration for PostgreSQL
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database (via Docker or local installation)
- npm or yarn package manager

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Backend

- Navigate to the `backend` directory
- Set up your database connection in `.env` file
- Run database migrations:
```bash
cd backend
npm run migrate
npm run db:seed
```

### 3. Configure Environment Variables

- Set the `GEMINI_API_KEY` in `backend/.env` to your Gemini API key (for AI features)
- Configure database connection in `backend/.env`:
  ```
  POSTGRES_USER=totalevo_user
  POSTGRES_PASSWORD=totalevo_password
  POSTGRES_DB=bar_pos
  ```

### 4. Run the Application

To run both frontend and backend simultaneously:
```bash
npm run dev
```

To run individually:
```bash
# Run frontend only
npm run dev:frontend

# Run backend only
npm run dev:backend
```

## Usage

### Getting Started
1. Start the application using `npm run dev`
2. Open your browser to `http://localhost:3000`
3. Log in with default credentials (see below)
4. Set up tills, categories, products, and stock items as needed

### Main Workflows
- **Processing a Sale**: Select products from the grid, adjust quantities, choose payment method, and complete the transaction
- **Managing Tabs**: Create tabs for ongoing orders, add items, transfer items between tabs, and settle when ready
- **Managing Tables**: Create and organize rooms, design table layouts visually, assign customers to tables, and track table status
- **Inventory Management**: Monitor stock levels, create stock adjustments, and track ingredient consumption
- **Reporting**: Access transaction history, sales analytics, and user performance reports

## LAN Access

The application can be configured to be accessible from other devices on your local network:

1. Configure the backend to listen on all interfaces in `backend/.env`:
   ```
   HOST=0.0.0
   PORT=3001
   ```

2. Configure the frontend to point to your machine's IP address in `frontend/.env`:
   ```
   VITE_API_URL=http://[YOUR_IP_ADDRESS]:3001
   VITE_HOST=0.0.0.0
   VITE_PORT=3000
   ```

3. Access from other devices at `http://[YOUR_IP_ADDRESS]:3000`

For detailed instructions, see [docs/LAN_ACCESS_SETUP.md](docs/LAN_ACCESS_SETUP.md).

## Default Credentials

- **Admin User**: 
  - Username: `admin`
  - Password: `admin123`
  - Role: Admin

- **Cashier User**: 
  - Username: `cashier`
  - Password: `cashier123`
  - Role: Cashier

## API Documentation

The backend provides a comprehensive REST API for all system functions:

### Main Endpoints
- `/api/products` - Product management (CRUD operations)
- `/api/categories` - Category management
- `/api/users` - User management and authentication
- `/api/tills` - Till management
- `/api/transactions` - Transaction history and processing
- `/api/tabs` - Tab management
- `/api/rooms` - Room management for table organization
- `/api/tables` - Table management with position and status tracking
- `/api/stock-items` - Inventory management
- `/api/stock-adjustments` - Stock adjustment tracking
- `/api/order-activity-logs` - Activity logging
- `/api/settings` - System settings management

### Authentication
Most endpoints require authentication. Use the `/api/users/login` endpoint to obtain a session.

## Troubleshooting

### Common Issues
1. **Database Connection**: Ensure PostgreSQL is running and credentials are correct in `.env`
2. **Port Conflicts**: Make sure ports 3000 (frontend) and 3001 (backend) are available
3. **CORS Issues**: When accessing from LAN, ensure API URL is correctly configured
4. **Migration Issues**: Run `npm run migrate` in the backend directory if database schema is outdated

### Development Mode
- The application runs in development mode by default with hot reloading
- API calls are logged for debugging purposes
- Error boundaries catch and display errors in the UI

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Maintain consistent code style with Prettier
- Update documentation as needed
