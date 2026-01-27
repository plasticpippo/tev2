import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { TableAssignmentProvider, useTableAssignmentContext } from '../frontend/contexts/TableAssignmentContext';
import { SessionProvider } from '../frontend/contexts/SessionContext';
import { OrderProvider } from '../frontend/contexts/OrderContext';
import { GlobalDataProvider } from '../frontend/contexts/GlobalDataContext';
import { UIStateProvider } from '../frontend/contexts/UIStateContext';
import * as apiService from '../frontend/services/apiService';

// Mock the API service
jest.mock('../frontend/services/apiService', () => ({
  saveTab: jest.fn(),
}));

// Mock the contexts that TableAssignmentContext depends on
const mockAppData = {
  tables: [
    { id: 'table1', name: 'Table 1', x: 0, y: 0, width: 100, height: 100, status: 'available', roomId: 'room1', createdAt: '', updatedAt: '', room: { id: 'room1', name: 'Room 1', tables: [] } },
    { id: 'table2', name: 'Table 2', x: 100, y: 0, width: 100, height: 100, status: 'available', roomId: 'room1', createdAt: '', updatedAt: '', room: { id: 'room1', name: 'Room 1', tables: [] } },
  ],
  tabs: [],
};

const mockActiveTab = {
  id: 1,
  name: 'Test Tab',
  items: [],
  createdAt: new Date().toISOString(),
  tillId: 1,
  tillName: 'Test Till',
};

const mockAssignedTillId = 1;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GlobalDataProvider value={{ appData: mockAppData, currentTillName: 'Test Till' }}>
    <SessionProvider value={{ currentUser: { id: 1, name: 'Test User', username: 'test', password_HACK: 'pass', role: 'Admin' }, assignedTillId: mockAssignedTillId }}>
      <OrderProvider value={{
        orderItems: [],
        setOrderItems: jest.fn(),
        isLoadingOrderSession: false,
        setIsLoadingOrderSession: jest.fn(),
        activeTab: mockActiveTab,
        setActiveTab: jest.fn(),
        handleAddToCart: jest.fn(),
        handleUpdateQuantity: jest.fn(),
        clearOrder: jest.fn(),
      }}>
        <UIStateProvider value={{
          isTableAssignmentModalOpen: false,
          setIsTableAssignmentModalOpen: jest.fn(),
          isPaymentModalOpen: false,
          setIsPaymentModalOpen: jest.fn(),
          isTabsModalOpen: false,
          setIsTabsModalOpen: jest.fn(),
          transferSourceTab: null,
          setTransferSourceTab: jest.fn(),
          isTransferModalOpen: false,
          setIsTransferModalOpen: jest.fn(),
        }}>
          <TableAssignmentProvider>
            {children}
          </TableAssignmentProvider>
        </UIStateProvider>
      </OrderProvider>
    </SessionProvider>
  </GlobalDataProvider>
);

describe('TableAssignmentContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should assign a table and update the active tab', async () => {
    const { result } = renderHook(() => useTableAssignmentContext(), { wrapper });

    await act(async () => {
      await result.current.handleTableAssign('table1');
    });

    expect(result.current.assignedTable?.id).toBe('table1');
    expect(apiService.saveTab).toHaveBeenCalledWith({
      ...mockActiveTab,
      tableId: 'table1',
    });
  });

  it('should unassign a table and update the active tab', async () => {
    const { result } = renderHook(() => useTableAssignmentContext(), { wrapper });

    // First assign a table
    await act(async () => {
      await result.current.handleTableAssign('table1');
    });

    // Then unassign it
    await act(async () => {
      await result.current.handleTableUnassign();
    });

    expect(result.current.assignedTable).toBeNull();
    expect(apiService.saveTab).toHaveBeenCalledWith({
      ...mockActiveTab,
      tableId: undefined,
    });
  });

  it('should sync table with active tab', async () => {
    const { result } = renderHook(() => useTableAssignmentContext(), { wrapper });

    await act(async () => {
      await result.current.syncTableWithActiveTab('table2');
    });

    expect(apiService.saveTab).toHaveBeenCalledWith({
      ...mockActiveTab,
      tableId: 'table2',
    });
  });

  it('should handle error when assigning a non-existent table', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useTableAssignmentContext(), { wrapper });

    await act(async () => {
      await result.current.handleTableAssign('non-existent-table');
    });

    expect(result.current.assignedTable).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Table with ID non-existent-table not found');

    consoleSpy.mockRestore();
  });
});