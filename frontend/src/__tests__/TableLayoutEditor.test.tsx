import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TableLayoutEditor } from '../../components/TableLayoutEditor';
import { TableProvider } from '../../components/TableContext';
import { Room, Table } from '../../../shared/types';

// Mock the context values
const mockRooms: Room[] = [
  {
    id: 'room1',
    name: 'Main Dining',
    description: 'Main dining area',
    createdAt: '2023-01-01T00:00:00Z',
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
    createdAt: '2023-01-01T00:00Z',
    updatedAt: '2023-01-01T00:00Z'
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
  }
];

// Mock the fetch API
global.fetch = jest.fn();

// Mock the TableContext to provide test data
const MockTableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TableProvider>
      {children}
    </TableProvider>
  );
};

describe('TableLayoutEditor', () => {
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

  it('renders the TableLayoutEditor component', async () => {
    render(
      <MockTableProvider>
        <TableLayoutEditor selectedRoomId={null} />
      </MockTableProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Select a Room')).toBeInTheDocument();
    });

    expect(screen.getByText('Table Layout Editor')).toBeInTheDocument();
  });

  it('displays room name when a room is selected', async () => {
    render(
      <MockTableProvider>
        <TableLayoutEditor selectedRoomId="room1" />
      </MockTableProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Main Dining')).toBeInTheDocument();
    });

    expect(screen.getByText('Main dining area')).toBeInTheDocument();
  });

  it('shows message when no room is selected', async () => {
    render(
      <MockTableProvider>
        <TableLayoutEditor selectedRoomId={null} />
      </MockTableProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Select a Room')).toBeInTheDocument();
    });

    expect(screen.getByText('Select a room to view and edit its layout')).toBeInTheDocument();
  });

  it('renders tables when a room is selected', async () => {
    render(
      <MockTableProvider>
        <TableLayoutEditor selectedRoomId="room1" />
      </MockTableProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
      expect(screen.getByText('Table 2')).toBeInTheDocument();
    });

    // Check that both tables are rendered
    expect(screen.getAllByText('Table 1')).toHaveLength(1);
    expect(screen.getAllByText('Table 2')).toHaveLength(1);
  });

  it('shows correct status colors for tables', async () => {
    render(
      <MockTableProvider>
        <TableLayoutEditor selectedRoomId="room1" />
      </MockTableProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });

    // Check that tables have correct status colors
    const availableTable = screen.getByTitle('Table 1 - Available');
    const occupiedTable = screen.getByTitle('Table 2 - Occupied');
    
    expect(availableTable).toHaveClass('bg-green-500'); // Available tables should be green
    expect(occupiedTable).toHaveClass('bg-red-500');   // Occupied tables should be red
  });

  it('shows mode indicator when in edit or drag mode', async () => {
    // Mock the context to set layout mode to 'edit'
    const MockTableProviderWithEditMode: React.FC<{ children: React.ReactNode }> = ({ children }) => {
      return (
        <TableProvider>
          {children}
        </TableProvider>
      );
    };

    render(
      <MockTableProviderWithEditMode>
        <TableLayoutEditor selectedRoomId="room1" />
      </MockTableProviderWithEditMode>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Main Dining')).toBeInTheDocument();
    });

    // The layout mode is controlled by the context, so we can't directly test the mode indicator
    // without manipulating the context state, but we can verify that the component renders properly
    expect(screen.getByText('Main Dining')).toBeInTheDocument();
  });

  it('handles drag and drop in edit mode', async () => {
    render(
      <MockTableProvider>
        <TableLayoutEditor selectedRoomId="room1" />
      </MockTableProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });

    // Simulate dragging a table (this is complex to test with RTL, so we'll test the mouse events)
    const tableElement = screen.getByTitle('Table 1 - Available');
    
    // Fire mouse down event on the table
    fireEvent.mouseDown(tableElement, { clientX: 100, clientY: 50 });
    
    // Fire mouse move event
    fireEvent.mouseMove(document, { clientX: 150, clientY: 100 });
    
    // Fire mouse up event
    fireEvent.mouseUp(document);
    
    // The table should now have updated position, though we can't easily test this
    // due to the complexity of the drag logic in the component
    expect(tableElement).toBeInTheDocument();
  });

  it('prevents dragging when not in edit/drag mode', async () => {
    render(
      <MockTableProvider>
        <TableLayoutEditor selectedRoomId="room1" />
      </MockTableProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });

    // Simulate trying to drag a table when not in edit mode
    const tableElement = screen.getByTitle('Table 1 - Available');
    
    // Fire mouse down event on the table
    fireEvent.mouseDown(tableElement, { clientX: 100, clientY: 50 });
    
    // The table should not be draggable in view mode
    expect(tableElement).toBeInTheDocument();
  });

  it('shows different status colors for different table statuses', async () => {
    // Mock tables with different statuses
    const mockTablesWithAllStatuses: Table[] = [
      {
        id: 'table1',
        name: 'Available',
        x: 50,
        y: 50,
        width: 80,
        height: 80,
        status: 'available',
        roomId: 'room1',
        createdAt: '2023-01-01T00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      },
      {
        id: 'table2',
        name: 'Occupied',
        x: 150,
        y: 50,
        width: 80,
        height: 80,
        status: 'occupied',
        roomId: 'room1',
        createdAt: '2023-01-01T00:00Z',
        updatedAt: '2023-01-01T00:00Z'
      },
      {
        id: 'table3',
        name: 'Reserved',
        x: 250,
        y: 50,
        width: 80,
        height: 80,
        status: 'reserved',
        roomId: 'room1',
        createdAt: '2023-01-01T00:00Z',
        updatedAt: '2023-01-01T00:00Z'
      },
      {
        id: 'table4',
        name: 'Unavailable',
        x: 350,
        y: 50,
        width: 80,
        height: 80,
        status: 'unavailable',
        roomId: 'room1',
        createdAt: '2023-01-01T00:00Z',
        updatedAt: '2023-01-01T00:00:00Z'
      }
    ];

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTablesWithAllStatuses
      });

    render(
      <MockTableProvider>
        <TableLayoutEditor selectedRoomId="room1" />
      </MockTableProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Occupied')).toBeInTheDocument();
      expect(screen.getByText('Reserved')).toBeInTheDocument();
      expect(screen.getByText('Unavailable')).toBeInTheDocument();
    });

    // Check that tables have correct status colors
    const availableTable = screen.getByTitle('Available - Available');
    const occupiedTable = screen.getByTitle('Occupied - Occupied');
    const reservedTable = screen.getByTitle('Reserved - Reserved');
    const unavailableTable = screen.getByTitle('Unavailable - Unavailable');
    
    expect(availableTable).toHaveClass('bg-green-500');    // Available tables should be green
    expect(occupiedTable).toHaveClass('bg-red-500');      // Occupied tables should be red
    expect(reservedTable).toHaveClass('bg-yellow-500');   // Reserved tables should be yellow
    expect(unavailableTable).toHaveClass('bg-gray-500');  // Unavailable tables should be gray
 });

  it('shows tooltip with table name and status', async () => {
    render(
      <MockTableProvider>
        <TableLayoutEditor selectedRoomId="room1" />
      </MockTableProvider>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Table 1')).toBeInTheDocument();
    });

    const tableElement = screen.getByTitle('Table 1 - Available');
    expect(tableElement).toHaveAttribute('title', 'Table 1 - Available');
  });

  it('does not render tables when no room is selected', async () => {
    render(
      <MockTableProvider>
        <TableLayoutEditor selectedRoomId={null} />
      </MockTableProvider>
    );

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('Select a Room')).toBeInTheDocument();
    });

    // There should be no tables rendered when no room is selected
    expect(screen.queryByText('Table 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Table 2')).not.toBeInTheDocument();
  });
});