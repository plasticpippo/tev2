import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TableAssignmentModal } from '../../components/TableAssignmentModal';
import { Room, Table } from '../../../shared/types';

// Mock data
const mockRooms: Room[] = [
  {
    id: 'room1',
    name: 'Main Dining',
    description: 'Main dining area',
    createdAt: '2023-01-01T00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'room2',
    name: 'Bar Area',
    description: 'Bar and lounge area',
    createdAt: '2023-01-01T00:00Z',
    updatedAt: '2023-01-01T00:00Z'
  }
];

const mockTables: Table[] = [
 {
    id: 'table1',
    name: 'Table 1',
    x: 100,
    y: 50,
    width: 80,
    height: 80,
    status: 'available',
    roomId: 'room1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'table2',
    name: 'Table 2',
    x: 200,
    y: 150,
    width: 80,
    height: 80,
    status: 'occupied',
    roomId: 'room1',
    createdAt: '2023-01-01T00:00Z',
    updatedAt: '2023-01-01T00:00Z'
  },
  {
    id: 'table3',
    name: 'Table 3',
    x: 300,
    y: 250,
    width: 80,
    height: 80,
    status: 'reserved',
    roomId: 'room2',
    createdAt: '2023-01-01T00:00Z',
    updatedAt: '2023-01-01T00:00Z'
  }
];

describe('TableAssignmentModal', () => {
  const mockOnTableAssign = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal when isOpen is true', () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    expect(screen.getByText('Assign Table')).toBeInTheDocument();
    expect(screen.getByText('Table 1')).toBeInTheDocument();
    expect(screen.getByText('Table 2')).toBeInTheDocument();
    expect(screen.getByText('Table 3')).toBeInTheDocument();
  });

 it('does not render the modal when isOpen is false', () => {
    render(
      <TableAssignmentModal
        isOpen={false}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    expect(screen.queryByText('Assign Table')).not.toBeInTheDocument();
  });

 it('closes the modal when close button is clicked', () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('selects a table when clicked', () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    const tableButton = screen.getByText('Table 1').closest('button');
    fireEvent.click(tableButton!);

    expect(tableButton).toHaveClass('border-amber-400');
    expect(tableButton).toHaveClass('bg-amber-900');
  });

  it('confirms table assignment', async () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    // Select a table
    const tableButton = screen.getByText('Table 1').closest('button');
    fireEvent.click(tableButton!);

    // Click confirm button
    const confirmButton = screen.getByText('Confirm Assignment');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnTableAssign).toHaveBeenCalledWith('table1');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('clears table assignment', async () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    // Click clear table button
    const clearButton = screen.getByText('Clear Table');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(mockOnTableAssign).toHaveBeenCalledWith('');
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('filters tables by room', () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    // Initially all tables should be visible
    expect(screen.getByText('Table 1')).toBeInTheDocument();
    expect(screen.getByText('Table 2')).toBeInTheDocument();
    expect(screen.getByText('Table 3')).toBeInTheDocument();

    // Filter by room1
    const roomSelect = screen.getByRole('combobox');
    fireEvent.change(roomSelect, { target: { value: 'room1' } });

    // Only tables from room1 should be visible
    expect(screen.getByText('Table 1')).toBeInTheDocument();
    expect(screen.getByText('Table 2')).toBeInTheDocument();
    expect(screen.queryByText('Table 3')).not.toBeInTheDocument();

    // Filter by room2
    fireEvent.change(roomSelect, { target: { value: 'room2' } });

    // Only tables from room2 should be visible
    expect(screen.queryByText('Table 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Table 2')).not.toBeInTheDocument();
    expect(screen.getByText('Table 3')).toBeInTheDocument();
  });

 it('filters tables by search term', () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    // Initially all tables should be visible
    expect(screen.getByText('Table 1')).toBeInTheDocument();
    expect(screen.getByText('Table 2')).toBeInTheDocument();
    expect(screen.getByText('Table 3')).toBeInTheDocument();

    // Search for "Table 1"
    const searchInput = screen.getByPlaceholderText('Search tables...');
    fireEvent.change(searchInput, { target: { value: 'Table 1' } });

    // Only Table 1 should be visible
    expect(screen.getByText('Table 1')).toBeInTheDocument();
    expect(screen.queryByText('Table 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Table 3')).not.toBeInTheDocument();

    // Search for "2"
    fireEvent.change(searchInput, { target: { value: '2' } });

    // Only Table 2 should be visible
    expect(screen.queryByText('Table 1')).not.toBeInTheDocument();
    expect(screen.getByText('Table 2')).toBeInTheDocument();
    expect(screen.queryByText('Table 3')).not.toBeInTheDocument();
  });

 it('shows different status colors for tables', () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    // Check that tables have correct status colors
    const availableTable = screen.getByText('Table 1').closest('button');
    const occupiedTable = screen.getByText('Table 2').closest('button');
    const reservedTable = screen.getByText('Table 3').closest('button');
    
    expect(availableTable).toBeInTheDocument();
    expect(occupiedTable).toBeInTheDocument();
    expect(reservedTable).toBeInTheDocument();
  });

  it('shows occupied tables with opacity', () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    // Find the occupied table button
    const occupiedTableButton = screen.getByText('Table 2').closest('button');
    
    // Occupied tables should have reduced opacity
    expect(occupiedTableButton).toHaveClass('opacity-70');
  });

  it('disables confirm button when no table is selected', () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    const confirmButton = screen.getByText('Confirm Assignment');
    expect(confirmButton).toBeDisabled();
  });

  it('enables confirm button when a table is selected', () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    // Select a table
    const tableButton = screen.getByText('Table 1').closest('button');
    fireEvent.click(tableButton!);

    const confirmButton = screen.getByText('Confirm Assignment');
    expect(confirmButton).not.toBeDisabled();
  });

 it('shows room name for each table', () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    // Each table should show its room name
    expect(screen.getByText('Main Dining')).toBeInTheDocument(); // For Table 1 and Table 2
    expect(screen.getByText('Bar Area')).toBeInTheDocument();    // For Table 3
  });

  it('shows correct status text for each table', () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    expect(screen.getByText('Available')).toBeInTheDocument(); // For Table 1
    expect(screen.getByText('Occupied')).toBeInTheDocument();  // For Table 2
    expect(screen.getByText('Reserved')).toBeInTheDocument();  // For Table 3
  });

  it('shows "No tables found" message when filtered results are empty', () => {
    render(
      <TableAssignmentModal
        isOpen={true}
        onClose={mockOnClose}
        tables={mockTables}
        rooms={mockRooms}
        onTableAssign={mockOnTableAssign}
      />
    );

    // Search for a non-existent table
    const searchInput = screen.getByPlaceholderText('Search tables...');
    fireEvent.change(searchInput, { target: { value: 'NonExistentTable' } });

    expect(screen.getByText('No tables found')).toBeInTheDocument();
  });
});