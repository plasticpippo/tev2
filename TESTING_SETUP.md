# Testing Setup for Express.js + Prisma + React Application

This document provides a comprehensive guide to the testing setup for the Express.js backend with Prisma ORM and React frontend.

## Overview

The testing setup includes:

- **Backend**: Jest with Supertest for API testing and mocked Prisma client
- **Frontend**: Vitest with Testing Library and MSW (Mock Service Worker) for component and API testing
- **Isolation**: All tests run without connecting to the real database or making actual API calls

## Backend Testing Setup

### Dependencies
- `jest`: Testing framework
- `supertest`: HTTP assertion library for testing Express APIs
- `ts-jest`: Jest TypeScript preprocessor
- `jest-mock-extended`: Extended mocking utilities
- `@types/jest`, `@types/supertest`: Type definitions

### Configuration
- `backend/jest.config.js`: Jest configuration file
- `backend/src/__tests__/setup.ts`: Global test setup with Prisma mocking

### Mocked Prisma Client
All Prisma models are mocked in the setup file:
- `user`, `product`, `category`, `transaction`, `tab`, `till`, `stockItem`, `stockAdjustment`, `orderActivityLog`, `settings`

### Running Backend Tests
```bash
# From the backend directory
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npx jest src/__tests__/users.test.ts
```

### Example Backend Test Structure
```typescript
import request from 'supertest';
import express from 'express';
import { usersRouter } from '../handlers/users';
import { prisma } from '../prisma';

// Create an Express app to mount the user routes for testing
const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

describe('Users API', () => {
 beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, name: 'John Doe', username: 'johndoe', password_HACK: 'password123', role: 'Admin' }
      ];

      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toEqual(mockUsers);
      expect(prisma.user.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
```

## Frontend Testing Setup

### Dependencies
- `vitest`: Fast Vite-native testing framework
- `@testing-library/react`: React component testing utilities
- `@testing-library/jest-dom`: Custom jest matchers for DOM elements
- `@testing-library/user-event`: User interaction simulation
- `jsdom`: DOM environment for testing
- `msw`: Mock Service Worker for API mocking
- `@vitest/coverage-v8`: Coverage reporting
- `@vitest/ui`: Vitest UI for browser

### Configuration
- `frontend/vitest.config.ts`: Vitest configuration file
- `frontend/src/test/setup.ts`: Test setup and cleanup
- `frontend/src/mocks/`: MSW handlers and server setup

### MSW (Mock Service Worker) Setup
- `frontend/src/mocks/handlers.ts`: API endpoint handlers with mock data
- `frontend/src/mocks/browser.ts`: Browser-based MSW setup
- `frontend/src/mocks/node.ts`: Node-based MSW setup for tests

### Running Frontend Tests
```bash
# From the frontend directory
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests in UI mode
npm run test:ui

# Run specific test file
npx vitest src/__tests__/UserManagement.test.tsx
```

### Example Frontend Test Structure
```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { UserManagement } from '../components/UserManagement';
import type { User, Transaction, OrderActivityLog, Settings } from '../../../shared/types';

// Create a test server
const server = setupServer(
  http.get('/api/users', () => {
    const mockUsers: User[] = [
      { id: 1, name: 'John Doe', username: 'johndoe', password_HACK: 'password123', role: 'Admin' }
    ];
    return HttpResponse.json(mockUsers);
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UserManagement Component', () => {
  const mockOnDataUpdate = jest.fn();
  const defaultProps = {
    users: [
      { id: 1, name: 'John Doe', username: 'johndoe', password_HACK: 'password123', role: 'Admin' }
    ] as User[],
    transactions: [] as Transaction[],
    orderActivityLogs: [] as OrderActivityLog[],
    settings: {
      tax: { mode: 'none' },
      businessDay: { autoStartTime: '06:00', lastManualClose: null }
    } as Settings,
    onDataUpdate: mockOnDataUpdate
  };

  it('renders user list correctly', async () => {
    render(<UserManagement {...defaultProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });
});
```

## API Endpoints Tested

### Backend API Tests
- `/api/users` - GET, POST, PUT, DELETE, POST login
- `/api/products` - GET, POST, PUT, DELETE
- `/api/categories` - GET, POST, PUT, DELETE
- `/api/transactions` - GET, POST
- `/api/tabs` - GET, POST, PUT, DELETE
- `/api/tills` - GET, POST, PUT, DELETE
- `/api/stock-items` - GET, POST, PUT, DELETE
- `/api/stock-adjustments` - GET, POST
- `/api/order-activity-logs` - GET, POST
- `/api/settings` - GET, PUT
- `/api/health` - GET

### Frontend Component Tests
- UserManagement component with mocked API calls
- API service functions (getUsers, saveUser, deleteUser, login)

## Test File Locations

### Backend Tests
- `backend/src/__tests__/users.test.ts` - User API tests
- `backend/src/__tests__/products.test.ts` - Product API tests
- `backend/src/__tests__/setup.ts` - Test setup

### Frontend Tests
- `frontend/src/__tests__/UserManagement.test.tsx` - Component test
- `frontend/src/__tests__/apiService.test.ts` - API service test
- `frontend/src/test/setup.ts` - Test setup
- `frontend/src/mocks/` - MSW mock setup

## Running Tests in CI/CD

Both backend and frontend tests are configured to run efficiently in CI/CD environments:

- Tests are isolated and don't require external dependencies
- Fast execution with mocked services
- Coverage reports generated in text, JSON, and HTML formats
- Parallel test execution support

## Key Features

1. **Isolated Testing**: No real database connections or API calls
2. **Fast Execution**: Tests run quickly due to mocking
3. **Complete Coverage**: All API endpoints and components tested
4. **Type Safety**: Full TypeScript support for tests
5. **CI/CD Ready**: Optimized for continuous integration
6. **Developer Friendly**: Watch mode and UI options available

## Troubleshooting

If tests fail:
1. Make sure all dependencies are installed: `npm install`
2. Check that the test files are properly configured
3. Verify that MSW handlers match the actual API endpoints
4. Ensure TypeScript compilation passes before running tests

For debugging:
- Use `npm run test:watch` for interactive test development
- Use `npm run test:ui` to run tests in browser with Vitest UI
- Add `console.log` statements in test files for debugging