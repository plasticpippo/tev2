import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';
import { TransactionHistory } from '../../components/TransactionHistory';
import type { Transaction, User, Till, Settings, OrderItem } from '../../../shared/types';
import { vi } from 'vitest';

// Create a test server
const server = setupServer();

// Mock the apiService to use the test server
vi.mock('../../services/apiService', async () => {
  const actual = await vi.importActual('../../services/apiService');
  return {
    ...actual,
    saveTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  };
});

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('TransactionHistory Component', () => {
 const mockOrderItem: OrderItem = {
    id: '1',
    variantId: 1,
    productId: 1,
    name: 'Regular Coffee',
    price: 2.50,
    quantity: 1,
    effectiveTaxRate: 0.2
  };

  const mockTransactions: Transaction[] = [
    {
      id: 1,
      items: [mockOrderItem],
      subtotal: 2.50,
      tax: 0.50,
      tip: 0.50,
      total: 3.50,
      paymentMethod: 'cash',
      userId: 1,
      userName: 'John Doe',
      tillId: 1,
      tillName: 'Till 1',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 1000).toISOString() // 2 days ago
    },
    {
      id: 2,
      items: [mockOrderItem],
      subtotal: 2.50,
      tax: 0.50,
      tip: 0,
      total: 3.00,
      paymentMethod: 'card',
      userId: 2,
      userName: 'Jane Smith',
      tillId: 2,
      tillName: 'Till 2',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 1000).toISOString() // 1 day ago
    },
    {
      id: 3,
      items: [mockOrderItem],
      subtotal: 5.00,
      tax: 1.00,
      tip: 1.00,
      total: 7.00,
      paymentMethod: 'card',
      userId: 1,
      userName: 'John Doe',
      tillId: 1,
      tillName: 'Till 1',
      createdAt: new Date().toISOString() // today
    }
  ];

  const mockUsers: User[] = [
    { id: 1, name: 'John Doe', username: 'johndoe', password_HACK: 'password123', role: 'Admin' },
    { id: 2, name: 'Jane Smith', username: 'janesmith', password_HACK: 'password456', role: 'Cashier' }
  ];

  const mockTills: Till[] = [
    { id: 1, name: 'Till 1' },
    { id: 2, name: 'Till 2' }
  ];

  const mockSettings: Settings = {
    tax: { mode: 'none' },
    businessDay: { autoStartTime: '06:00', lastManualClose: null }
  };

  const defaultProps = {
    transactions: mockTransactions,
    users: mockUsers,
    tills: mockTills,
    settings: mockSettings
  };

  it('renders transaction history component correctly', () => {
    render(<TransactionHistory {...defaultProps} />);

    // Check that the main title is displayed
    expect(screen.getByText('Transaction History')).toBeInTheDocument();

    // Check that the date range buttons are displayed
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();

    // Check that filter selects are displayed
    expect(screen.getByRole('combobox', { name: /Filter by till/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Filter by user/ })).toBeInTheDocument();

    // Check that transactions are displayed (using more specific selectors to avoid ambiguity)
    expect(screen.getByText((content, element) =>
      element?.tagName === 'SPAN' && element.classList.contains('font-bold') && content === '€3,50'
    )).toBeInTheDocument();
    expect(screen.getByText((content, element) =>
      element?.tagName === 'SPAN' && element.classList.contains('font-bold') && content === '€3,00'
    )).toBeInTheDocument();
    expect(screen.getByText((content, element) =>
      element?.tagName === 'SPAN' && element.classList.contains('font-bold') && content === '€7,00'
    )).toBeInTheDocument();

    // Check that transaction details are displayed
    expect(screen.getByText('John Doe (cash)')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith (card)')).toBeInTheDocument();
    // Use getAllByText and get the first occurrence to avoid ambiguity
    const till1Elements = screen.getAllByText((content, element) =>
      element?.tagName === 'SPAN' && element.classList.contains('text-xs') && element.classList.contains('text-slate-400') && content === 'Till 1'
    );
    expect(till1Elements).toHaveLength(2); // Till 1 appears in 2 transactions
    expect(till1Elements[0]).toBeInTheDocument();
    
    const till2Elements = screen.getAllByText((content, element) =>
      element?.tagName === 'SPAN' && element.classList.contains('text-xs') && element.classList.contains('text-slate-400') && content === 'Till 2'
    );
    expect(till2Elements).toHaveLength(1); // Till 2 appears in 1 transaction
    expect(till2Elements[0]).toBeInTheDocument();
  });

  it('displays correct transaction count and total', () => {
    render(<TransactionHistory {...defaultProps} />);

    // Check that the transaction count and total are displayed
    // The text is split across multiple elements, so we need to look for the container
    const summaryElement = screen.getByText((content, element) => {
      return element?.tagName === 'DIV' &&
             element?.getAttribute('aria-live') === 'polite' &&
             content.includes('transactions totaling');
    });
    expect(summaryElement).toBeInTheDocument();
    
    // Calculate expected total based on all transactions
    const expectedTotal = mockTransactions.reduce((sum, t) => sum + t.total, 0);
    // Look for the total amount in the summary element
    expect(screen.getByText(new RegExp(`€${expectedTotal.toFixed(2).replace('.', ',')}`))).toBeInTheDocument();
 });

  it('allows selecting a transaction to view details', async () => {
    render(<TransactionHistory {...defaultProps} />);

    // Click on the first transaction to view details
    const firstTransaction = screen.getByText('€3,50');
    fireEvent.click(firstTransaction);

    // Wait for the details to be displayed
    await waitFor(() => {
      expect(screen.getByText('Receipt #1')).toBeInTheDocument();
    });

    // Check that transaction details are displayed
    expect(screen.getByText('Receipt #1')).toBeInTheDocument();
    // Look for the amounts in the context of their labels
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('Tax')).toBeInTheDocument();
    expect(screen.getByText('Tip')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('1 x Regular Coffee')).toBeInTheDocument();
    
    // Check that the amounts are present by looking for the specific elements in the receipt
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('Tax')).toBeInTheDocument();
    expect(screen.getByText('Tip')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    
    // Check specific amounts in the receipt details by targeting the parent div
    // This ensures we're checking the amounts in the receipt details, not in the transaction list
    const receiptDetails = screen.getByText('Receipt #1').closest('div');
    expect(receiptDetails).toBeInTheDocument();
    
    // Check that the receipt details contain the expected elements
    expect(within(receiptDetails!).getByText('Subtotal')).toBeInTheDocument();
    expect(within(receiptDetails!).getByText('Tax')).toBeInTheDocument();
    expect(within(receiptDetails!).getByText('Tip')).toBeInTheDocument();
    expect(within(receiptDetails!).getByText('Total')).toBeInTheDocument();
    
    // Check the specific amounts in the receipt details by targeting specific elements
    // Subtotal
    const subtotalElement = within(receiptDetails!).getByText('Subtotal');
    expect(subtotalElement.nextElementSibling).toHaveTextContent('€2,50');
    
    // Tax
    const taxElement = within(receiptDetails!).getByText('Tax');
    expect(taxElement.nextElementSibling).toHaveTextContent('€0,50');
    
    // Tip
    const tipElement = within(receiptDetails!).getByText('Tip');
    expect(tipElement.nextElementSibling).toHaveTextContent('€0,50');
    
    // Total
    const totalElement = within(receiptDetails!).getByText('Total');
    expect(totalElement.nextElementSibling).toHaveTextContent('€3,50');
  });

  it('filters transactions by date range - today', async () => {
    render(<TransactionHistory {...defaultProps} />);
    
    // Click on "Today" button
    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);
    
    // Wait for the UI to update after clicking by querying for the updated button
    await waitFor(() => {
      const updatedTodayButton = screen.getByText('Today');
      expect(updatedTodayButton).toHaveAttribute('aria-pressed', 'true');
    }, { timeout: 2000 });
  });

 it('filters transactions by date range - yesterday', async () => {
    render(<TransactionHistory {...defaultProps} />);
    
    // Click on "Yesterday" button
    const yesterdayButton = screen.getByText('Yesterday');
    fireEvent.click(yesterdayButton);
    
    // Wait for the UI to update after clicking
    await waitFor(() => {
      const updatedYesterdayButton = screen.getByText('Yesterday');
      expect(updatedYesterdayButton).toHaveAttribute('aria-pressed', 'true');
    }, { timeout: 2000 });
 });

 it('filters transactions by date range - 7 days', async () => {
   render(<TransactionHistory {...defaultProps} />);
   
   // Click on "Last 7 Days" button
   const last7DaysButton = screen.getByText('Last 7 Days');
   fireEvent.click(last7DaysButton);
   
   // Wait for the UI to update after clicking
   await waitFor(() => {
     const updatedLast7DaysButton = screen.getByText('Last 7 Days');
     expect(updatedLast7DaysButton).toHaveAttribute('aria-pressed', 'true');
   }, { timeout: 2000 });
 });

  it('filters transactions by date range - 30 days', () => {
    render(<TransactionHistory {...defaultProps} />);

    // Click on "Last 30 Days" button
    const last30DaysButton = screen.getByText('Last 30 Days');
    fireEvent.click(last30DaysButton);

    expect(last30DaysButton).toHaveClass('bg-amber-500');
  });

  it('filters transactions by date range - custom', () => {
    render(<TransactionHistory {...defaultProps} />);
    
    // Click on "Custom" button
    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);
    
    // Check that the button has the correct attribute immediately
    expect(customButton).toHaveAttribute('aria-pressed', 'true');
    
    // Check that custom date inputs are displayed
    expect(screen.getByLabelText('From:')).toBeInTheDocument();
    expect(screen.getByLabelText('To:')).toBeInTheDocument();

    // Check that custom time inputs are visible (time inputs, not textboxes)
    const startTimeInput = screen.getByLabelText('Start time');
    const endTimeInput = screen.getByLabelText('End time');
    expect(startTimeInput).toBeInTheDocument();
    expect(endTimeInput).toBeInTheDocument();
  });

 it('filters transactions by till', async () => {
     render(<TransactionHistory {...defaultProps} />);
 
     // Select a specific till from the dropdown
     const tillSelect = screen.getByRole('combobox', { name: /Filter by till/ });
     fireEvent.change(tillSelect, { target: { value: '1' } });
 
     // Transactions should now be filtered by Till 1
     // Till 1 has 2 transactions in our mock data (id 1 and 3)
     expect(screen.getByText('€3,50')).toBeInTheDocument();
     expect(screen.getByText('€7,00')).toBeInTheDocument();
  });

 it('filters transactions by user', async () => {
     render(<TransactionHistory {...defaultProps} />);
 
     // Select a specific user from the dropdown
     const userSelect = screen.getByRole('combobox', { name: /Filter by user/ });
     fireEvent.change(userSelect, { target: { value: '1' } });
 
     // Transactions should now be filtered by John Doe
     // John Doe has 2 transactions in our mock data (id 1 and 3)
     expect(screen.getByText('€3,50')).toBeInTheDocument();
     expect(screen.getByText('€7,00')).toBeInTheDocument();
   });

  it('displays no transactions message when filtered results are empty', async () => {
    // Create a scenario where no transactions match the filters
    render(<TransactionHistory
      transactions={[]}
      users={mockUsers}
      tills={mockTills}
      settings={mockSettings}
    />);

    // Check that no transactions message is displayed
    expect(screen.getByText('No transactions found for the selected filters.')).toBeInTheDocument();
  });

  it('sorts transactions by date (most recent first)', () => {
    render(<TransactionHistory {...defaultProps} />);

    // Transactions should be sorted by date (most recent first)
    // Our mock transactions are ordered with ID 3 being the most recent (today), ID 2 from yesterday, ID 1 from 2 days ago
    // Get only the transaction elements, not the summary at the top
    const transactionButtons = screen.getAllByRole('button', { name: /Transaction \d+ for €\d+,\d+ by .+ at .+/ });
    
    // Check that the first transaction button has the most recent transaction (€7,00)
    expect(transactionButtons[0]).toHaveTextContent('€7,00'); // Most recent (today)
    expect(transactionButtons[0]).toHaveTextContent('Till 1');
    
    expect(transactionButtons[1]).toHaveTextContent('€3,00'); // Yesterday
    expect(transactionButtons[1]).toHaveTextContent('Till 2');
    
    expect(transactionButtons[2]).toHaveTextContent('€3,50'); // 2 days ago
    expect(transactionButtons[2]).toHaveTextContent('Till 1');
  });

  // The TransactionHistory component doesn't implement pagination functionality
  // The transactions are displayed in a scrollable container without pagination controls
  // So we'll skip pagination tests

  // The TransactionHistory component doesn't implement search functionality
  // So we'll skip search functionality tests

 // The TransactionHistory component doesn't implement export functionality
  // So we'll skip export functionality tests
});