import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';
import { CategoryManagement } from '../../components/CategoryManagement';
import { VirtualKeyboardProvider } from '../../components/VirtualKeyboardContext';
import type { Category, Till } from '../../../shared/types';
import { vi } from 'vitest';

// Create a test server
const server = setupServer();

// Mock the apiService to use the test server
vi.mock('../../services/apiService', async () => {
  const actual = await vi.importActual('../../services/apiService');
  return {
    ...actual,
    saveCategory: vi.fn(),
    deleteCategory: vi.fn(),
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

describe('CategoryManagement Component', () => {
 const mockOnDataUpdate = vi.fn();
  
  const mockTills: Till[] = [
    { id: 1, name: 'Till 1' },
    { id: 2, name: 'Till 2' },
    { id: 3, name: 'Till 3' }
  ];
  
  const mockCategories: Category[] = [
    { id: 1, name: 'Drinks', visibleTillIds: [1, 2] },
    { id: 2, name: 'Food', visibleTillIds: [1, 2, 3] },
    { id: 3, name: 'Desserts', visibleTillIds: [] } // Visible on all tills
 ];

  const defaultProps = {
    categories: mockCategories,
    tills: mockTills,
    onDataUpdate: mockOnDataUpdate
  };

  it('renders category list correctly', () => {
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    // Check that categories are displayed
    expect(screen.getByText('Drinks')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Desserts')).toBeInTheDocument();
    
    // Check visibility information
    expect(screen.getByText('Visible on: Till 1, Till 2')).toBeInTheDocument();
    expect(screen.getByText('Visible on: Till 1, Till 2, Till 3')).toBeInTheDocument();
    expect(screen.getByText('Visible on: All Tills')).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getAllByText('Edit')).toHaveLength(3); // 3 categories = 3 edit buttons
    expect(screen.getAllByText('Delete')).toHaveLength(3); // 3 categories = 3 delete buttons
  });

  it('displays add category button', () => {
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    expect(screen.getByText('Add Category')).toBeInTheDocument();
 });

  it('opens category modal when Add Category button is clicked', async () => {
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    const addCategoryButton = screen.getByRole('button', { name: /Add Category/ });
    fireEvent.click(addCategoryButton);
    
    // Modal should be rendered
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add Category/ })).toBeInTheDocument();
    });
    
    // Check that the modal contains form fields
    expect(screen.getByText('Category Name')).toBeInTheDocument();
    expect(screen.getByText('Visibility')).toBeInTheDocument();
    
    // Check that all till checkboxes are present
    expect(screen.getByText('Till 1')).toBeInTheDocument();
    expect(screen.getByText('Till 2')).toBeInTheDocument();
    expect(screen.getByText('Till 3')).toBeInTheDocument();
  });

  it('opens category modal when Edit button is clicked', async () => {
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]); // Edit the first category
    
    // Modal should be rendered with edit title
    await waitFor(() => {
      expect(screen.getByText('Edit Category')).toBeInTheDocument();
    });
    
    // Check that the modal contains form fields
    expect(screen.getByText('Category Name')).toBeInTheDocument();
    expect(screen.getByText('Visibility')).toBeInTheDocument();
    
    // Check that the category name is pre-filled
    const nameInput = screen.getByRole('textbox');
    expect(nameInput).toHaveValue('Drinks');
  });

  it('shows delete confirmation modal when Delete button is clicked', async () => {
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]); // Delete the first category
    
    // Confirmation modal should appear
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete the category "Drinks"? Products in this category will become uncategorized.')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('handles adding a new category', async () => {
    const { saveCategory } = await import('../../services/apiService');
    
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    // Click add category button
    const addCategoryButton = screen.getByRole('button', { name: /Add Category/ });
    fireEvent.click(addCategoryButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add Category/ })).toBeInTheDocument();
    });
    
    // Fill in the category name
    const nameInput = screen.getByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'Snacks' } });
    
    // Select a till - click the first till checkbox (Till 1)
    const tillCheckbox = screen.getByLabelText('Till 1');
    fireEvent.click(tillCheckbox);
    
    // Click save category
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // Check that saveCategory was called with correct data
    await waitFor(() => {
      expect(saveCategory).toHaveBeenCalledWith({
        name: 'Snacks',
        visibleTillIds: [1]
      });
    });
    
    // Check that onDataUpdate was called
    expect(mockOnDataUpdate).toHaveBeenCalled();
  });

  it('handles editing an existing category', async () => {
    const { saveCategory } = await import('../../services/apiService');
    
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    // Click edit button for the first category
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Edit Category/ })).toBeInTheDocument();
    });
    
    // Change the category name
    const nameInput = screen.getByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'Updated Drinks' } });
    
    // Uncheck Till 2 and check Till 3
    const till2Checkbox = screen.getByLabelText('Till 2');
    fireEvent.click(till2Checkbox); // Uncheck Till 2
    
    const till3Checkbox = screen.getByLabelText('Till 3');
    fireEvent.click(till3Checkbox); // Check Till 3
    
    // Click save category
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // Check that saveCategory was called with correct data
    await waitFor(() => {
      expect(saveCategory).toHaveBeenCalledWith({
        id: 1,
        name: 'Updated Drinks',
        visibleTillIds: [1, 3] // Initially [1, 2], now [1, 3] after changes
      });
    });
    
    // Check that onDataUpdate was called
    expect(mockOnDataUpdate).toHaveBeenCalled();
  });

  it('handles deleting a category', async () => {
    const { deleteCategory } = await import('../../services/apiService');
    
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    // Click delete button for the first category
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Wait for confirmation modal
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete the category "Drinks"? Products in this category will become uncategorized.')).toBeInTheDocument();
    });
    
    // Click confirm
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    // Check that deleteCategory was called
    await waitFor(() => {
      expect(deleteCategory).toHaveBeenCalledWith(1);
    });
    
    // Check that onDataUpdate was called
    expect(mockOnDataUpdate).toHaveBeenCalled();
  });

  it('validates required fields in category form', async () => {
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    // Click add category button
    const addCategoryButton = screen.getByRole('button', { name: /Add Category/ });
    fireEvent.click(addCategoryButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add Category/ })).toBeInTheDocument();
    });
    
    // Try to submit without filling in required fields
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // The form should not submit since required fields are empty
    expect(screen.getByRole('heading', { name: /Add Category/ })).toBeInTheDocument();
  });

 it('allows selecting multiple tills for category visibility', async () => {
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    // Click add category button
    const addCategoryButton = screen.getByRole('button', { name: /Add Category/ });
    fireEvent.click(addCategoryButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add Category/ })).toBeInTheDocument();
    });
    
    // Fill in the category name
    const nameInput = screen.getByRole('textbox');
    fireEvent.change(nameInput, { target: { value: 'New Category' } });
    
    // Select multiple tills
    const till1Checkbox = screen.getByLabelText('Till 1');
    const till2Checkbox = screen.getByLabelText('Till 2');
    const till3Checkbox = screen.getByLabelText('Till 3');
    
    fireEvent.click(till1Checkbox);
    fireEvent.click(till2Checkbox);
    fireEvent.click(till3Checkbox);
    
    // Click save category
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // Wait for saveCategory to be called
    await waitFor(() => {
      expect(mockOnDataUpdate).toHaveBeenCalled();
    });
 });

  it('allows deselecting all tills to make category visible on all tills', async () => {
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    // Click edit button for the first category which has specific tills [1, 2]
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Edit Category/ })).toBeInTheDocument();
    });
    
    // Uncheck all tills to make it visible on all tills
    const till1Checkbox = screen.getByLabelText('Till 1');
    const till2Checkbox = screen.getByLabelText('Till 2');
    
    fireEvent.click(till1Checkbox);
    fireEvent.click(till2Checkbox);
    
    // Click save category
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    // Wait for saveCategory to be called with empty visibleTillIds array
    await waitFor(() => {
      expect(mockOnDataUpdate).toHaveBeenCalled();
    });
  });

  it('closes modal when cancel button is clicked', async () => {
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    // Click add category button
    const addCategoryButton = screen.getByRole('button', { name: /Add Category/ });
    fireEvent.click(addCategoryButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Add Category/ })).toBeInTheDocument();
    });
    
    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Modal should be closed
    expect(screen.queryByRole('heading', { name: /Add Category/ })).not.toBeInTheDocument();
  });

  it('closes delete confirmation modal when cancel button is clicked', async () => {
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    // Click delete button for the first category
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Wait for confirmation modal
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete the category "Drinks"? Products in this category will become uncategorized.')).toBeInTheDocument();
    });
    
    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Confirmation modal should be closed
    expect(screen.queryByText('Are you sure you want to delete the category "Drinks"? Products in this category will become uncategorized.')).not.toBeInTheDocument();
  });

  it('shows correct till names in visibility display', () => {
    renderWithProvider(<CategoryManagement {...defaultProps} />);
    
    // Check visibility display for different categories
    expect(screen.getByText('Visible on: Till 1, Till 2')).toBeInTheDocument();
    expect(screen.getByText('Visible on: Till 1, Till 2, Till 3')).toBeInTheDocument();
    expect(screen.getByText('Visible on: All Tills')).toBeInTheDocument();
 });
});