import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TableManagement } from '../../components/TableManagement';
import { TableProvider } from '../../components/TableContext';
import { Room, Table } from '../../../shared/types';

// Mock the context values
const mockRooms: Room[] = [
  {
    id: 'room1',
    name: 'Main Dining',
    description: 'Main dining area',
    createdAt: '2023-01-01T0:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'room2',
    name: 'Bar Area',
    description: 'Bar and lounge area',
    createdAt: '2023-01-01T00:00:00Z',
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
    createdAt: '2023-01T0:00:00Z',
    updatedAt: '2023-01-01T00:00Z'
  }
];

// Mock the TableContext to provide test data
const MockTableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TableProvider>
      {children}
    </TableProvider>
 );
};

// Mock the fetch API
global.fetch = jest.fn();

describe('TableManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    
    // Mock successful API responses for initial data load
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTables
      });
  });

  it('renders the TableManagement component with layout tab as default', async () => {
    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Table Layout Editor')).toBeInTheDocument();
    });

    // Check that the layout tab is active
    expect(screen.getByText('Layout')).toHaveClass('text-amber-400');
    expect(screen.getByText('Rooms')).toHaveClass('text-slate-400');
    expect(screen.getByText('Tables')).toHaveClass('text-slate-400');
  });

  it('switches between tabs correctly', async () => {
    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Table Layout Editor')).toBeInTheDocument();
    });

    // Click on Rooms tab
    fireEvent.click(screen.getByText('Rooms'));
    await waitFor(() => {
      expect(screen.getByText('Room Management')).toBeInTheDocument();
    });

    // Click on Tables tab
    fireEvent.click(screen.getByText('Tables'));
    await waitFor(() => {
      expect(screen.getByText('Table Management')).toBeInTheDocument();
    });

    // Click back to Layout tab
    fireEvent.click(screen.getByText('Layout'));
    await waitFor(() => {
      expect(screen.getByText('Table Layout Editor')).toBeInTheDocument();
    });
  });

  it('displays rooms in rooms tab', async () => {
    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Switch to rooms tab
    fireEvent.click(screen.getByText('Rooms'));
    
    await waitFor(() => {
      expect(screen.getByText('Main Dining')).toBeInTheDocument();
      expect(screen.getByText('Bar Area')).toBeInTheDocument();
    });

    expect(screen.getByText('Main dining area')).toBeInTheDocument();
    expect(screen.getByText('Bar and lounge area')).toBeInTheDocument();
  });

 it('displays tables in tables tab', async () => {
    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Switch to tables tab
    fireEvent.click(screen.getByText('Tables'));
    
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
      expect(screen.getByText('Table 2')).toBeInTheDocument();
    });

    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Occupied')).toBeInTheDocument();
 });

  it('shows add room modal when Add Room button is clicked', async () => {
    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Switch to rooms tab
    fireEvent.click(screen.getByText('Rooms'));
    
    await waitFor(() => {
      expect(screen.getByText('Room Management')).toBeInTheDocument();
    });

    // Click Add Room button
    fireEvent.click(screen.getByText('Add Room'));
    
    // Check that the modal is displayed
    await waitFor(() => {
      expect(screen.getByText('Add Room')).toBeInTheDocument();
    });
  });

  it('shows add table modal when Add Table button is clicked', async () => {
    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Switch to tables tab
    fireEvent.click(screen.getByText('Tables'));
    
    await waitFor(() => {
      expect(screen.getByText('Table Management')).toBeInTheDocument();
    });

    // Click Add Table button
    fireEvent.click(screen.getByText('Add Table'));
    
    // Check that the modal is displayed
    await waitFor(() => {
      expect(screen.getByText('Add Table')).toBeInTheDocument();
    });
  });

  it('shows edit room modal when Edit button is clicked', async () => {
    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Switch to rooms tab
    fireEvent.click(screen.getByText('Rooms'));
    
    await waitFor(() => {
      expect(screen.getByText('Room Management')).toBeInTheDocument();
    });

    // Click Edit button for the first room
    fireEvent.click(screen.getAllByText('Edit')[0]);
    
    // Check that the modal is displayed with Edit title
    await waitFor(() => {
      expect(screen.getByText('Edit Room')).toBeInTheDocument();
    });
  });

  it('shows edit table modal when Edit button is clicked', async () => {
    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Switch to tables tab
    fireEvent.click(screen.getByText('Tables'));
    
    await waitFor(() => {
      expect(screen.getByText('Table Management')).toBeInTheDocument();
    });

    // Click Edit button for the first table
    fireEvent.click(screen.getAllByText('Edit')[0]);
    
    // Check that the modal is displayed with Edit title
    await waitFor(() => {
      expect(screen.getByText('Edit Table')).toBeInTheDocument();
    });
  });

  it('shows confirmation modal when Delete Room button is clicked', async () => {
    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Switch to rooms tab
    fireEvent.click(screen.getByText('Rooms'));
    
    await waitFor(() => {
      expect(screen.getByText('Room Management')).toBeInTheDocument();
    });

    // Click Delete button for the first room
    fireEvent.click(screen.getAllByText('Delete')[0]);
    
    // Check that the confirmation modal is displayed
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to delete the room/)).toBeInTheDocument();
    });
  });

  it('shows confirmation modal when Delete Table button is clicked', async () => {
    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Switch to tables tab
    fireEvent.click(screen.getByText('Tables'));
    
    await waitFor(() => {
      expect(screen.getByText('Table Management')).toBeInTheDocument();
    });

    // Click Delete button for the first table
    fireEvent.click(screen.getAllByText('Delete')[0]);
    
    // Check that the confirmation modal is displayed
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to delete the table/)).toBeInTheDocument();
    });
  });

  it('filters tables by room when in tables tab', async () => {
    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Switch to tables tab
    fireEvent.click(screen.getByText('Tables'));
    
    await waitFor(() => {
      expect(screen.getByText('Table Management')).toBeInTheDocument();
    });

    // Select a specific room from the dropdown
    const roomSelect = screen.getByRole('combobox');
    fireEvent.change(roomSelect, { target: { value: 'room1' } });
    
    // Check that tables are filtered by the selected room
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
      expect(screen.getByText('Table 2')).toBeInTheDocument();
    });
  });

 it('updates layout mode when mode is changed', async () => {
    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Table Layout Editor')).toBeInTheDocument();
    });

    // Change layout mode
    const modeSelect = screen.getByRole('combobox', { name: '' });
    fireEvent.change(modeSelect, { target: { value: 'edit' } });
    
    // Check that the mode has changed
    expect(modeSelect).toHaveValue('edit');
  });

  it('selects a room in layout editor', async () => {
    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Table Layout Editor')).toBeInTheDocument();
    });

    // Select a room from the dropdown
    const roomSelect = screen.getByRole('combobox', { name: '' });
    fireEvent.change(roomSelect, { target: { value: 'room1' } });
    
    // Check that the room has been selected
    expect(roomSelect).toHaveValue('room1');
    expect(screen.getByText('Main Dining')).toBeInTheDocument();
  });

  it('displays error message when context has error', async () => {
    // Mock an error in the API response
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to fetch rooms' })
      });

    render(
      <MockTableProvider>
        <TableManagement />
      </MockTableProvider>
    );

    // Check that the error message is displayed
    await waitFor(() => {
      expect(screen.getByText('Failed to fetch rooms')).toBeInTheDocument();
    });
  });
});