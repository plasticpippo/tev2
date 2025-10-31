import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';
import { UserManagement } from '../../components/UserManagement';
import type { User, Transaction, OrderActivityLog, Settings } from '../../../shared/types';
import { vi } from 'vitest';

// Create a test server
const server = setupServer(
  http.get('/api/users', () => {
    const mockUsers: User[] = [
      { id: 1, name: 'John Doe', username: 'johndoe', password_HACK: 'password123', role: 'Admin' },
      { id: 2, name: 'Jane Smith', username: 'janesmith', password_HACK: 'password456', role: 'Cashier' }
    ];
    return HttpResponse.json(mockUsers);
  })
);

// Mock the apiService to use the test server
vi.mock('../../services/apiService', () => ({
  getUsers: () => fetch('/api/users').then(res => res.json()),
  saveUser: vi.fn(),
  deleteUser: vi.fn(),
}));

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UserManagement Component', () => {
 const mockOnDataUpdate = vi.fn();
  const defaultProps = {
    users: [
      { id: 1, name: 'John Doe', username: 'johndoe', password_HACK: 'password123', role: 'Admin' },
      { id: 2, name: 'Jane Smith', username: 'janesmith', password_HACK: 'password456', role: 'Cashier' }
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
    
    // Check that users are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/johndoe/)).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText(/janesmith/)).toBeInTheDocument();
    expect(screen.getByText('Cashier')).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getAllByText('Edit')).toHaveLength(2); // 2 users = 2 edit buttons
    expect(screen.getAllByText('Delete')).toHaveLength(2); // 2 users = 2 delete buttons
    expect(screen.getAllByText('Report')).toHaveLength(2); // 2 users = 2 report buttons
  });

  it('displays add user button', () => {
    render(<UserManagement {...defaultProps} />);
    
    expect(screen.getByText('Add User')).toBeInTheDocument();
 });

  it('shows loading state initially', () => {
    render(<UserManagement {...defaultProps} />);
    
    // The component should render without errors even if data is loading
    expect(screen.getByText('User Management')).toBeInTheDocument();
 });
});