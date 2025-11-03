import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';
import { TillManagement } from '../../components/TillManagement';
import { VirtualKeyboardProvider } from '../../components/VirtualKeyboardContext';
import type { Till } from '../../../shared/types';
import { vi } from 'vitest';

// Create a test server
const server = setupServer();

// Mock the apiService to use the test server
vi.mock('../../services/apiService', async () => {
  const actual = await vi.importActual('../../services/apiService');
  return {
    ...actual,
    saveTill: vi.fn(),
    deleteTill: vi.fn(),
  };
});

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Wrap the component with VirtualKeyboardProvider
const renderWithProvider = (ui: React.ReactElement, options?: any) => {
  return render(
    <VirtualKeyboardProvider>
      {ui}
    </VirtualKeyboardProvider>,
    options
  );
};

describe('TillManagement Component', () => {
  const mockOnDataUpdate = vi.fn();
  const mockOnAssignDevice = vi.fn();
  
  const mockTills: Till[] = [
    { id: 1, name: 'Till 1' },
    { id: 2, name: 'Till 2' },
    { id: 3, name: 'Till 3' }
  ];

  const defaultProps = {
    tills: mockTills,
    onDataUpdate: mockOnDataUpdate,
    assignedTillId: 1,
    onAssignDevice: mockOnAssignDevice
  };

  it('renders till list correctly', () => {
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    // Check that tills are displayed - using more specific selectors to avoid ambiguity
    expect(screen.getByText('Till 1', { selector: 'p.font-semibold' })).toBeInTheDocument();
    expect(screen.getByText('Till 2', { selector: 'p.font-semibold' })).toBeInTheDocument();
    expect(screen.getByText('Till 3', { selector: 'p.font-semibold' })).toBeInTheDocument();
    
    // Check that the currently assigned till is marked
    expect(screen.getByText('Currently Assigned')).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getAllByText('Edit')).toHaveLength(3); // 3 tills = 3 edit buttons
    expect(screen.getAllByText('Delete')).toHaveLength(3); // 3 tills = 3 delete buttons
  });

  it('displays add till button', () => {
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    expect(screen.getByText('Add Till')).toBeInTheDocument();
  });

  it('shows current assignment information', () => {
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    expect(screen.getByText('This device is currently assigned as:')).toBeInTheDocument();
    expect(screen.getByText('Till 1', { selector: 'span.font-bold.text-lg' })).toBeInTheDocument();
  });

  it('opens till modal when Add Till button is clicked', async () => {
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    const addTillButton = screen.getByRole('button', { name: /Add Till/ });
    fireEvent.click(addTillButton);
    
    // Modal should be rendered
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add Till/ })).toBeInTheDocument();
    });
    
    // Check that the modal contains form fields
    expect(screen.getByText('Till Name')).toBeInTheDocument();
    
    // Check that the name input field is present
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('opens till modal when Edit button is clicked', async () => {
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]); // Edit the first till
    
    // Modal should be rendered with edit title
    await waitFor(() => {
      expect(screen.getByText('Edit Till')).toBeInTheDocument();
    });
    
    // Check that the modal contains form fields
    expect(screen.getByText('Till Name')).toBeInTheDocument();
    
    // Check that the till name is pre-filled
    const nameInput = screen.getByRole('textbox');
    expect(nameInput).toHaveValue('Till 1');
  });

  it('shows delete confirmation modal when Delete button is clicked', async () => {
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]); // Delete the first till
    
    // Confirmation modal should appear
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete the till "Till 1"? Any device assigned to this till will need to be reconfigured.')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('handles adding a new till', async () => {
    const { saveTill } = await import('../../services/apiService');
    
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    // Click add till button
    const addTillButton = screen.getByRole('button', { name: /Add Till/ });
    fireEvent.click(addTillButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add Till/ })).toBeInTheDocument();
    });
    
    // Fill in the till name
    const nameInput = screen.getByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'New Till' } });
    
    // Click save till
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // Check that saveTill was called with correct data
    await waitFor(() => {
      expect(saveTill).toHaveBeenCalledWith({
        name: 'New Till'
      });
    });
    
    // Check that onDataUpdate was called
    expect(mockOnDataUpdate).toHaveBeenCalled();
  });

  it('handles editing an existing till', async () => {
    const { saveTill } = await import('../../services/apiService');
    
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    // Click edit button for the first till
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Edit Till/ })).toBeInTheDocument();
    });
    
    // Change the till name
    const nameInput = screen.getByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'Updated Till 1' }}); // Fixed syntax
    
    // Click save till
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // Check that saveTill was called with correct data
    await waitFor(() => {
      expect(saveTill).toHaveBeenCalledWith({
        id: 1,
        name: 'Updated Till 1'
      });
    });
    
    // Check that onDataUpdate was called
    expect(mockOnDataUpdate).toHaveBeenCalled();
  });

  it('handles deleting a till', async () => {
    const { deleteTill } = await import('../../services/apiService');
    
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    // Click delete button for the first till
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Wait for confirmation modal
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete the till "Till 1"? Any device assigned to this till will need to be reconfigured.')).toBeInTheDocument();
    });
    
    // Click confirm
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    // Check that deleteTill was called
    await waitFor(() => {
      expect(deleteTill).toHaveBeenCalledWith(1);
    });
    
    // Check that onDataUpdate was called
    expect(mockOnDataUpdate).toHaveBeenCalled();
  });

  it('validates required fields in till form', async () => {
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    // Click add till button
    const addTillButton = screen.getByRole('button', { name: /Add Till/ });
    fireEvent.click(addTillButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add Till/ })).toBeInTheDocument();
    });
    
    // Try to submit without filling in required fields
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // The form should not submit since required fields are empty
    expect(screen.getByRole('heading', { name: /Add Till/ })).toBeInTheDocument();
  });

  it('closes modal when cancel button is clicked', async () => {
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    // Click add till button
    const addTillButton = screen.getByRole('button', { name: /Add Till/ });
    fireEvent.click(addTillButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add Till/ })).toBeInTheDocument();
    });
    
    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Modal should be closed
    expect(screen.queryByRole('heading', { name: /Add Till/ })).not.toBeInTheDocument();
  });

  it('closes delete confirmation modal when cancel button is clicked', async () => {
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    // Click delete button for the first till
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Wait for confirmation modal
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete the till "Till 1"? Any device assigned to this till will need to be reconfigured.')).toBeInTheDocument();
    });
    
    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Confirmation modal should be closed
    expect(screen.queryByText('Are you sure you want to delete the till "Till 1"? Any device assigned to this till will need to be reconfigured.')).not.toBeInTheDocument();
  });

 it('allows reassigning the device to a different till', async () => {
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    // Click the "Assign This Device" button for Till 2 (not currently assigned)
    const assignButtons = screen.getAllByText('Assign This Device');
    fireEvent.click(assignButtons[0]); // This should be for Till 2
    
    // Confirmation modal should appear
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to re-assign this terminal to "Till 2"? The application will restart to apply the change.')).toBeInTheDocument();
    });
    
    // Click confirm
    const confirmButton = screen.getByText('Confirm & Restart');
    fireEvent.click(confirmButton);
    
    // Check that onAssignDevice was called with the correct till ID
    expect(mockOnAssignDevice).toHaveBeenCalledWith(2);
  });

  it('does not show "Assign This Device" button for the currently assigned till', () => {
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    // Find the container for the currently assigned till by looking for the "Currently Assigned" text
    const currentlyAssignedElement = screen.getByText('Currently Assigned');
    const assignedTillContainer = currentlyAssignedElement.closest('div.bg-slate-800.p-4.rounded-md.flex.justify-between.items-center.min-h-\\[76px\\]');
    
    // Verify that assignedTillContainer is not null
    expect(assignedTillContainer).not.toBeNull();
    
    // The assigned till should show "Currently Assigned" instead of "Assign This Device"
    expect(assignedTillContainer).toContainElement(currentlyAssignedElement);
    // Check that the assigned till container does not contain the "Assign This Device" button
    const assignDeviceButtons = assignedTillContainer!.querySelectorAll('button');
    const assignDeviceButton = Array.from(assignDeviceButtons).find(btn => btn.textContent?.includes('Assign This Device'));
    expect(assignDeviceButton).toBeUndefined();
  });

  it('shows "Assign This Device" button for tills that are not currently assigned', () => {
    renderWithProvider(<TillManagement {...defaultProps} />);
    
    // Find the container for Till 2 using a more specific selector
    const till2Element = screen.getByText('Till 2', { selector: 'p.font-semibold' });
    const till2Container = till2Element.closest('div.bg-slate-800.p-4.rounded-md.flex.justify-between.items-center.min-h-\\[76px\\]');
    
    // Verify that till2Container is not null
    expect(till2Container).not.toBeNull();
    
    // Find the container for Till 3 using a more specific selector
    const till3Element = screen.getByText('Till 3', { selector: 'p.font-semibold' });
    const till3Container = till3Element.closest('div.bg-slate-800.p-4.rounded-md.flex.justify-between.items-center.min-h-\\[76px\\]');
    
    // Verify that till3Container is not null
    expect(till3Container).not.toBeNull();
    
    // Get all "Assign This Device" buttons and check that one is in the Till 2 container
    const assignDeviceButtons = screen.getAllByText('Assign This Device');
    const till2AssignButton = assignDeviceButtons.find(button => till2Container!.contains(button));
    expect(till2AssignButton).toBeInTheDocument();
    
    // Get all "Assign This Device" buttons and check that one is in the Till 3 container
    const till3AssignButton = assignDeviceButtons.find(button => till3Container!.contains(button));
    expect(till3AssignButton).toBeInTheDocument();
  });

  it('shows "Unassigned" when no till is assigned', () => {
    const unassignedProps = {
      ...defaultProps,
      assignedTillId: null
    };
    
    renderWithProvider(<TillManagement {...unassignedProps} />);
    
    expect(screen.getByText('This device is currently assigned as:')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });
});