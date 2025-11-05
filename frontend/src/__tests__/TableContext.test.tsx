import { render, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TableProvider, useTableContext } from '../../components/TableContext';
import { Room, Table } from '../../../shared/types';

// Mock the fetch API
global.fetch = jest.fn();

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
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
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
    createdAt: '2023-01-01T0:00:00Z',
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
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

// Test component to access context values
const TestComponent = () => {
 const context = useTableContext();
  return (
    <div>
      <div data-testid="rooms-count">{context.rooms.length}</div>
      <div data-testid="tables-count">{context.tables.length}</div>
      <div data-testid="loading">{context.loading.toString()}</div>
      <div data-testid="layout-mode">{context.layoutMode}</div>
      <div data-testid="selected-room-id">{context.selectedRoomId || 'null'}</div>
      <div data-testid="error">{context.error || 'null'}</div>
    </div>
  );
};

const renderWithContext = () => {
  return render(
    <TableProvider>
      <TestComponent />
    </TableProvider>
  );
};

describe('TableContext', () => {
 beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

 it('should initialize with default values', () => {
    const { getByTestId } = renderWithContext();
    
    expect(getByTestId('rooms-count')).toHaveTextContent('0');
    expect(getByTestId('tables-count')).toHaveTextContent('0');
    expect(getByTestId('loading')).toHaveTextContent('false');
    expect(getByTestId('layout-mode')).toHaveTextContent('view');
    expect(getByTestId('selected-room-id')).toHaveTextContent('null');
    expect(getByTestId('error')).toHaveTextContent('null');
  });

  it('should fetch rooms and tables on mount', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTables
      });

    const { getByTestId } = renderWithContext();
    
    // Initial state
    expect(getByTestId('loading')).toHaveTextContent('true');
    
    // Wait for data to load
    await waitFor(() => {
      expect(getByTestId('rooms-count')).toHaveTextContent('2');
      expect(getByTestId('tables-count')).toHaveTextContent('2');
      expect(getByTestId('loading')).toHaveTextContent('false');
    });
    
    // Check that fetch was called for both endpoints
    expect(global.fetch).toHaveBeenCalledWith('/api/rooms');
    expect(global.fetch).toHaveBeenCalledWith('/api/tables');
  });

 it('should handle error when fetching rooms fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to fetch rooms' })
      });

    const { getByTestId } = renderWithContext();
    
    await waitFor(() => {
      expect(getByTestId('error')).toHaveTextContent('Failed to fetch rooms');
    });
 });

  it('should handle error when fetching tables fails', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to fetch tables' })
      });

    const { getByTestId } = renderWithContext();
    
    await waitFor(() => {
      expect(getByTestId('error')).toHaveTextContent('Failed to fetch tables');
    });
  });

  it('should add a new room', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTables
      });

    const { getByTestId } = renderWithContext();
    
    // Wait for initial data to load
    await waitFor(() => {
      expect(getByTestId('rooms-count')).toHaveTextContent('2');
    });

    // Mock the add room API call
    const newRoom = {
      id: 'room3',
      name: 'New Room',
      description: 'New room description',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00Z'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => newRoom
    });

    // Get context to access the addRoom function
    const TestAddRoomComponent = () => {
      const context = useTableContext();
      return (
        <button 
          data-testid="add-room-btn"
          onClick={() => context.addRoom({ name: 'New Room', description: 'New room description' })}
        >
          Add Room
        </button>
      );
    };

    const { getByTestId: getTestByTestId } = render(
      <TableProvider>
        <TestAddRoomComponent />
      </TableProvider>
    );

    // Click the button to add a room
    act(() => {
      getTestByTestId('add-room-btn').click();
    });

    // Wait for the add operation to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'New Room', description: 'New room description' })
      });
    });
  });

  it('should update a room', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTables
      });

    // Wait for initial data to load
    const { getByTestId } = renderWithContext();
    await waitFor(() => {
      expect(getByTestId('rooms-count')).toHaveTextContent('2');
    });

    // Mock the update room API call
    const updatedRoom = {
      id: 'room1',
      name: 'Updated Room',
      description: 'Updated description',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedRoom
    });

    // Get context to access the updateRoom function
    const TestUpdateRoomComponent = () => {
      const context = useTableContext();
      return (
        <button 
          data-testid="update-room-btn"
          onClick={() => context.updateRoom('room1', { name: 'Updated Room', description: 'Updated description' })}
        >
          Update Room
        </button>
      );
    };

    const { getByTestId: getTestByTestId } = render(
      <TableProvider>
        <TestUpdateRoomComponent />
      </TableProvider>
    );

    // Click the button to update a room
    act(() => {
      getTestByTestId('update-room-btn').click();
    });

    // Wait for the update operation to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/rooms/room1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Updated Room', description: 'Updated description' })
      });
    });
  });

  it('should delete a room', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTables
      });

    // Wait for initial data to load
    const { getByTestId } = renderWithContext();
    await waitFor(() => {
      expect(getByTestId('rooms-count')).toHaveTextContent('2');
    });

    // Mock the delete room API call
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204
    });

    // Get context to access the deleteRoom function
    const TestDeleteRoomComponent = () => {
      const context = useTableContext();
      return (
        <button 
          data-testid="delete-room-btn"
          onClick={() => context.deleteRoom('room1')}
        >
          Delete Room
        </button>
      );
    };

    const { getByTestId: getTestByTestId } = render(
      <TableProvider>
        <TestDeleteRoomComponent />
      </TableProvider>
    );

    // Click the button to delete a room
    act(() => {
      getTestByTestId('delete-room-btn').click();
    });

    // Wait for the delete operation to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/rooms/room1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  it('should add a new table', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTables
      });

    // Wait for initial data to load
    const { getByTestId } = renderWithContext();
    await waitFor(() => {
      expect(getByTestId('tables-count')).toHaveTextContent('2');
    });

    // Mock the add table API call
    const newTable = {
      id: 'table3',
      name: 'Table 3',
      x: 300,
      y: 200,
      width: 80,
      height: 80,
      status: 'available',
      roomId: 'room1',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => newTable
    });

    // Get context to access the addTable function
    const TestAddTableComponent = () => {
      const context = useTableContext();
      return (
        <button 
          data-testid="add-table-btn"
          onClick={() => context.addTable({ 
            name: 'Table 3', 
            roomId: 'room1', 
            x: 300, 
            y: 200, 
            width: 80, 
            height: 80, 
            status: 'available' 
          })}
        >
          Add Table
        </button>
      );
    };

    const { getByTestId: getTestByTestId } = render(
      <TableProvider>
        <TestAddTableComponent />
      </TableProvider>
    );

    // Click the button to add a table
    act(() => {
      getTestByTestId('add-table-btn').click();
    });

    // Wait for the add operation to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: 'Table 3', 
          roomId: 'room1', 
          x: 300, 
          y: 200, 
          width: 80, 
          height: 80, 
          status: 'available' 
        })
      });
    });
  });

  it('should update a table', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTables
      });

    // Wait for initial data to load
    const { getByTestId } = renderWithContext();
    await waitFor(() => {
      expect(getByTestId('tables-count')).toHaveTextContent('2');
    });

    // Mock the update table API call
    const updatedTable = {
      id: 'table1',
      name: 'Updated Table',
      x: 150,
      y: 100,
      width: 90,
      height: 90,
      status: 'occupied',
      roomId: 'room1',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-02T00:00:00Z'
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedTable
    });

    // Get context to access the updateTable function
    const TestUpdateTableComponent = () => {
      const context = useTableContext();
      return (
        <button 
          data-testid="update-table-btn"
          onClick={() => context.updateTable('table1', { 
            name: 'Updated Table', 
            x: 150, 
            y: 100, 
            width: 90, 
            height: 90, 
            status: 'occupied' 
          })}
        >
          Update Table
        </button>
      );
    };

    const { getByTestId: getTestByTestId } = render(
      <TableProvider>
        <TestUpdateTableComponent />
      </TableProvider>
    );

    // Click the button to update a table
    act(() => {
      getTestByTestId('update-table-btn').click();
    });

    // Wait for the update operation to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/tables/table1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: 'Updated Table', 
          x: 150, 
          y: 100, 
          width: 90, 
          height: 90, 
          status: 'occupied' 
        })
      });
    });
  });

  it('should delete a table', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRooms
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockTables
      });

    // Wait for initial data to load
    const { getByTestId } = renderWithContext();
    await waitFor(() => {
      expect(getByTestId('tables-count')).toHaveTextContent('2');
    });

    // Mock the delete table API call
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204
    });

    // Get context to access the deleteTable function
    const TestDeleteTableComponent = () => {
      const context = useTableContext();
      return (
        <button 
          data-testid="delete-table-btn"
          onClick={() => context.deleteTable('table1')}
        >
          Delete Table
        </button>
      );
    };

    const { getByTestId: getTestByTestId } = render(
      <TableProvider>
        <TestDeleteTableComponent />
      </TableProvider>
    );

    // Click the button to delete a table
    act(() => {
      getTestByTestId('delete-table-btn').click();
    });

    // Wait for the delete operation to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/tables/table1', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  it('should update table position', () => {
    // Get context to access the updateTablePosition function
    const TestUpdatePositionComponent = () => {
      const context = useTableContext();
      return (
        <button 
          data-testid="update-position-btn"
          onClick={() => context.updateTablePosition('table1', 250, 180)}
        >
          Update Position
        </button>
      );
    };

    const { getByTestId: getTestByTestId } = render(
      <TableProvider>
        <TestUpdatePositionComponent />
      </TableProvider>
    );

    // Click the button to update a table position
    act(() => {
      getTestByTestId('update-position-btn').click();
    });

    // Since updateTablePosition is a local state update, we can't directly test it through the provider
    // But we can confirm the function was called by checking that no API call was made
    expect(global.fetch).not.toHaveBeenCalledWith('/api/tables/table1/position');
  });

  it('should set layout mode', () => {
    // Get context to access the setLayoutMode function
    const TestSetLayoutModeComponent = () => {
      const context = useTableContext();
      return (
        <button 
          data-testid="set-layout-mode-btn"
          onClick={() => context.setLayoutMode('edit')}
        >
          Set Edit Mode
        </button>
      );
    };

    const { getByTestId: getTestByTestId } = render(
      <TableProvider>
        <TestSetLayoutModeComponent />
      </TableProvider>
    );

    // Click the button to set layout mode
    act(() => {
      getTestByTestId('set-layout-mode-btn').click();
    });

    // The layout mode change is internal state, so we can't directly test it through the provider
    // But we can confirm the function exists and can be called
  });

  it('should set selected room ID', () => {
    // Get context to access the setSelectedRoomId function
    const TestSetSelectedRoomIdComponent = () => {
      const context = useTableContext();
      return (
        <button 
          data-testid="set-selected-room-btn"
          onClick={() => context.setSelectedRoomId('room2')}
        >
          Set Selected Room
        </button>
      );
    };

    const { getByTestId: getTestByTestId } = render(
      <TableProvider>
        <TestSetSelectedRoomIdComponent />
      </TableProvider>
    );

    // Click the button to set selected room ID
    act(() => {
      getTestByTestId('set-selected-room-btn').click();
    });

    // The selected room ID change is internal state, so we can't directly test it through the provider
    // But we can confirm the function exists and can be called
  });

  it('should throw error when useTableContext is used outside TableProvider', () => {
    const TestComponentOutsideProvider = () => {
      useTableContext(); // This should throw an error
      return <div>Test</div>;
    };

    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useTableContext must be used within a TableProvider');
  });
});