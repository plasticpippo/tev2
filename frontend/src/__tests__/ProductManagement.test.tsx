import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import '@testing-library/jest-dom';
import { ProductManagement } from '../../components/ProductManagement';
import type { Product, Category, StockItem, ProductVariant } from '../../../shared/types';
import { vi } from 'vitest';

// Create a test server
const server = setupServer();

// Mock the apiService to use the test server
vi.mock('../../services/apiService', () => ({
  saveProduct: vi.fn(),
  deleteProduct: vi.fn(),
}));

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ProductManagement Component', () => {
  const mockOnDataUpdate = vi.fn();
  
  const mockCategories: Category[] = [
    { id: 1, name: 'Drinks', visibleTillIds: [1, 2] },
    { id: 2, name: 'Food', visibleTillIds: [1, 2] }
  ];
  
  const mockStockItems: StockItem[] = [
    {
      id: 1,
      name: 'Coffee Beans',
      quantity: 100,
      type: 'Ingredient',
      baseUnit: 'kg',
      purchasingUnits: [
        { id: 'kg', name: 'Kilogram', multiplier: 1 },
        { id: 'g', name: 'Gram', multiplier: 1000 }
      ]
    },
    {
      id: 2,
      name: 'Tea Leaves',
      quantity: 50,
      type: 'Ingredient',
      baseUnit: 'kg',
      purchasingUnits: [
        { id: 'kg', name: 'Kilogram', multiplier: 1 },
        { id: 'g', name: 'Gram', multiplier: 1000 }
      ]
    }
  ];
  
  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Coffee',
      categoryId: 1,
      variants: [
        {
          id: 1,
          productId: 1,
          name: 'Regular Coffee',
          price: 2.50,
          isFavourite: true,
          stockConsumption: [
            { stockItemId: 1, quantity: 0.1 }
          ],
          backgroundColor: '#6f4e37',
          textColor: '#ffffff'
        },
        {
          id: 2,
          productId: 1,
          name: 'Large Coffee',
          price: 3.50,
          isFavourite: false,
          stockConsumption: [
            { stockItemId: 1, quantity: 0.2 }
          ],
          backgroundColor: '#8b4513',
          textColor: '#ffffff'
        }
      ]
    },
    {
      id: 2,
      name: 'Tea',
      categoryId: 1,
      variants: [
        {
          id: 3,
          productId: 2,
          name: 'Green Tea',
          price: 2.00,
          isFavourite: false,
          stockConsumption: [
            { stockItemId: 2, quantity: 0.05 }
          ],
          backgroundColor: '#d2b48c',
          textColor: '#000000'
        }
      ]
    }
  ];

  const defaultProps = {
    products: mockProducts,
    categories: mockCategories,
    stockItems: mockStockItems,
    onDataUpdate: mockOnDataUpdate
  };

  it('renders product list correctly', async () => {
    render(<ProductManagement {...defaultProps} />);
    
    // Check that products are displayed
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Drinks')).toBeInTheDocument();
    
    expect(screen.getByText('Tea')).toBeInTheDocument();
    expect(screen.getByText('Drinks')).toBeInTheDocument();
    
    // Check that variants are displayed
    expect(screen.getByText('Regular Coffee')).toBeInTheDocument();
    expect(screen.getByText('Large Coffee')).toBeInTheDocument();
    expect(screen.getByText('Green Tea')).toBeInTheDocument();
    
    // Check that prices are formatted correctly
    expect(screen.getByText('£2.50')).toBeInTheDocument();
    expect(screen.getByText('£3.50')).toBeInTheDocument();
    expect(screen.getByText('£2.00')).toBeInTheDocument();
    
    // Check for action buttons
    expect(screen.getAllByText('Edit')).toHaveLength(2); // 2 products = 2 edit buttons
    expect(screen.getAllByText('Delete')).toHaveLength(2); // 2 products = 2 delete buttons
  });

  it('displays add product button', () => {
    render(<ProductManagement {...defaultProps} />);
    
    expect(screen.getByText('Add Product')).toBeInTheDocument();
  });

  it('shows favourite star for favourite variants', () => {
    render(<ProductManagement {...defaultProps} />);
    
    // The Regular Coffee variant is marked as favourite
    const favouriteStar = screen.getByText('★');
    expect(favouriteStar).toBeInTheDocument();
  });

  it('opens product modal when Add Product button is clicked', async () => {
    render(<ProductManagement {...defaultProps} />);
    
    const addProductButton = screen.getByText('Add Product');
    fireEvent.click(addProductButton);
    
    // Modal should be rendered
    await waitFor(() => {
      expect(screen.getByText('Add Product')).toBeInTheDocument();
    });
    
    // Check that the modal contains form fields
    expect(screen.getByText('Product Name')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Selling Variant')).toBeInTheDocument();
  });

  it('opens product modal when Edit button is clicked', async () => {
    render(<ProductManagement {...defaultProps} />);
    
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]); // Edit the first product
    
    // Modal should be rendered with edit title
    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
    });
    
    // Check that the modal contains form fields
    expect(screen.getByText('Product Name')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Selling Variant')).toBeInTheDocument();
  });

  it('shows delete confirmation modal when Delete button is clicked', async () => {
    render(<ProductManagement {...defaultProps} />);
    
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]); // Delete the first product
    
    // Confirmation modal should appear
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete "Coffee"? This will delete all its variants.')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Confirm')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('handles adding a new product', async () => {
    const { saveProduct } = require('../../services/apiService');
    
    render(<ProductManagement {...defaultProps} />);
    
    // Click add product button
    const addProductButton = screen.getByText('Add Product');
    fireEvent.click(addProductButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Add Product')).toBeInTheDocument();
    });
    
    // Fill in the product name
    const nameInput = screen.getByPlaceholderText('e.g., Merlot');
    fireEvent.change(nameInput, { target: { value: 'New Product' } });
    
    // Select a category
    const categorySelect = screen.getByRole('combobox');
    fireEvent.change(categorySelect, { target: { value: '2' } });
    
    // Fill in variant name
    const variantNameInput = screen.getByPlaceholderText('e.g., Bottle');
    fireEvent.change(variantNameInput, { target: { value: 'Standard' } });
    
    // Fill in variant price
    const variantPriceInput = screen.getByPlaceholderText('e.g., 25.00');
    fireEvent.change(variantPriceInput, { target: { value: '5.99' } });
    
    // Click save product
    const saveButton = screen.getByText('Save Product');
    fireEvent.click(saveButton);
    
    // Check that saveProduct was called
    await waitFor(() => {
      expect(saveProduct).toHaveBeenCalled();
    });
  });

  it('handles editing an existing product', async () => {
    const { saveProduct } = require('../../services/apiService');
    
    render(<ProductManagement {...defaultProps} />);
    
    // Click edit button for the first product
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Edit Product')).toBeInTheDocument();
    });
    
    // Change the product name
    const nameInput = screen.getByPlaceholderText('e.g., Merlot');
    fireEvent.change(nameInput, { target: { value: 'Updated Coffee' } });
    
    // Click save product
    const saveButton = screen.getByText('Save Product');
    fireEvent.click(saveButton);
    
    // Check that saveProduct was called
    await waitFor(() => {
      expect(saveProduct).toHaveBeenCalled();
    });
  });

  it('handles deleting a product', async () => {
    const { deleteProduct } = require('../../services/apiService');
    
    render(<ProductManagement {...defaultProps} />);
    
    // Click delete button for the first product
    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);
    
    // Wait for confirmation modal
    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to delete "Coffee"? This will delete all its variants.')).toBeInTheDocument();
    });
    
    // Click confirm
    const confirmButton = screen.getByText('Confirm');
    fireEvent.click(confirmButton);
    
    // Check that deleteProduct was called
    await waitFor(() => {
      expect(deleteProduct).toHaveBeenCalledWith(1);
    });
  });

  it('validates required fields in product form', async () => {
    render(<ProductManagement {...defaultProps} />);
    
    // Click add product button
    const addProductButton = screen.getByText('Add Product');
    fireEvent.click(addProductButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Add Product')).toBeInTheDocument();
    });
    
    // Try to submit without filling in required fields
    const saveButton = screen.getByText('Save Product');
    fireEvent.click(saveButton);
    
    // The form should not submit since required fields are empty
    expect(screen.getByText('Add Product')).toBeInTheDocument();
  });

  it('allows adding multiple variants to a product', async () => {
    render(<ProductManagement {...defaultProps} />);
    
    // Click add product button
    const addProductButton = screen.getByText('Add Product');
    fireEvent.click(addProductButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Add Product')).toBeInTheDocument();
    });
    
    // Add another variant
    const addVariantButton = screen.getByText('+ Add Selling Variant');
    fireEvent.click(addVariantButton);
    
    // There should now be two variant forms
    expect(screen.getAllByText('Selling Variant')).toHaveLength(2);
  });

  it('allows adding stock consumption to a variant', async () => {
    render(<ProductManagement {...defaultProps} />);
    
    // Click add product button
    const addProductButton = screen.getByText('Add Product');
    fireEvent.click(addProductButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Add Product')).toBeInTheDocument();
    });
    
    // Add stock consumption to the variant
    const addStockConsumptionButton = screen.getByText('+ Add Stock Item to Recipe');
    fireEvent.click(addStockConsumptionButton);
    
    // There should now be a stock consumption form
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('handles form validation for variant fields', async () => {
    render(<ProductManagement {...defaultProps} />);
    
    // Click add product button
    const addProductButton = screen.getByText('Add Product');
    fireEvent.click(addProductButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByText('Add Product')).toBeInTheDocument();
    });
    
    // Try to submit with empty variant name
    const saveButton = screen.getByText('Save Product');
    fireEvent.click(saveButton);
    
    // The form should not submit since variant name is required
    expect(screen.getByText('Add Product')).toBeInTheDocument();
  });

  it('displays loading state when categories are not available', () => {
    const propsWithoutCategories = {
      products: mockProducts,
      categories: [],
      stockItems: mockStockItems,
      onDataUpdate: mockOnDataUpdate
    };
    
    render(<ProductManagement {...propsWithoutCategories} />);
    
    expect(screen.getByText('Loading categories...')).toBeInTheDocument();
  });
});