<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Bar POS Pro - Point of Sale System

A comprehensive point of sale system with separate frontend and backend, featuring inventory management, user roles, analytics, and real-time data synchronization.

## Project Structure

- `frontend/` - React-based user interface
- `backend/` - Express.js API server with database integration
- `shared/` - Shared types and constants between frontend and backend

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database

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
- Set the `GEMINI_API_KEY` in `backend/.env` to your Gemini API key
- Configure database connection in `backend/.env`

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

## Features

- Real-time POS system with multiple tills
- Inventory management with stock tracking
- User management with role-based access (Admin/Cashier)
- Transaction history and reporting
- Analytics dashboard
- Tax configuration
- Tab management for ongoing orders
- Offline capability with local storage fallback
