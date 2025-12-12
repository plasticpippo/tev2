import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, Mock } from 'vitest';
import ProductGridLayoutCustomizer, { ProductGridLayoutData } from '../../components/ProductGridLayoutCustomizer';
import { Product, ProductVariant, Till, Category } from '../../../shared/types';
import { 
  saveGridLayout, 
  getGridLayoutsForTill, 
  deleteGridLayout, 
  setLayoutAsDefault, 
  getLayoutById 
} from '../../services/gridLayoutService';

// Mock the grid layout service functions
vi.mock('../../services/gridLayoutService', () => ({
  saveGridLayout: vi.fn(),
  getGridLayoutsForTill: vi.fn(),
  deleteGridLayout: vi.fn(),
  setLayoutAsDefault: vi.fn(),
  getLayoutById: vi.fn(),
}));

// Define types for the mocks
const mockSaveGridLayout = saveGridLayout as Mock;
const mockGetGridLayoutsForTill = getGridLayoutsForTill as Mock;
const mockDeleteGridLayout = deleteGridLayout as Mock;
const mockSetLayoutAsDefault = setLayoutAsDefault as Mock;
const mockGetLayoutById = getLayoutById as Mock;

// Define mock data
const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Product 1',
    categoryId: 1,
    variants: [
      {
        id: 1,
        name: 'Variant 1',
        price: 100,
        isFavourite: true,
        backgroundColor: '#3b82f6',
        textColor: '#ffffff',
        productId: 1,
        stockConsumption: []
      },
      {
        id: 2,
        name: 'Variant 2',
        price: 1500,
        isFavourite: false,
        backgroundColor: '#ef4444',
        textColor: '#ffffff',
        productId: 1,
        stockConsumption: []
      }
    ]
  },
  {
    id: 2,
    name: 'Product 2',
    categoryId: 2,
    variants: [
      {
        id: 3,
        name: 'Variant 1',
        price: 2000,
        isFavourite: false,
        backgroundColor: '#10b981',
        textColor: '#ffffff',
        productId: 2,
        stockConsumption: []
      }
    ]
  },
  {
    id: 3,
    name: 'Product 3',
    categoryId: 1,
    variants: [
      {
        id: 4,
        name: 'Variant 1',
        price: 2500,
        isFavourite: true,
        backgroundColor: '#8b5cf6',
        textColor: '#ffffff',
        productId: 3,
        stockConsumption: []
      }
    ]
  }
];

const mockCategories: Category[] = [
  {
    id: 1,
    name: 'Category 1',
    visibleTillIds: [1, 2]
  },
  {
    id: 2,
    name: 'Category 2',
    visibleTillIds: [1]
  }
];

const mockTills: Till[] = [
  {
    id: 1,
    name: 'Till 1'
  },
  {
    id: 2,
    name: 'Till 2'
  }
];

const mockLayouts: ProductGridLayoutData[] = [
  {
    id: 1,
    name: 'Layout 1',
    tillId: 1,
    layout: {
      columns: 4,
      gridItems: [],
      version: '1.0'
    },
    isDefault: true,
    filterType: 'all',
    categoryId: null
  },
  {
    id: 2,
    name: 'Layout 2',
    tillId: 1,
    layout: {
      columns: 4,
      gridItems: [],
      version: '1.0'
    },
    isDefault: false,
    filterType: 'favorites',
    categoryId: null
  },
  {
    id: 3,
    name: 'Layout 3',
    tillId: 1,
    layout: {
      columns: 4,
      gridItems: [],
      version: '1.0'
    },
    isDefault: false,
    filterType: 'category',
    categoryId: 1
  }
];

const mockOnSaveLayout = vi.fn();
const mockOnCancel = vi.fn();

describe('ProductGridLayoutCustomizer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful API calls by default
    mockGetGridLayoutsForTill.mockResolvedValue(mockLayouts);
    mockSaveGridLayout.mockResolvedValue(mockLayouts[0]);
    mockDeleteGridLayout.mockResolvedValue(undefined);
    mockSetLayoutAsDefault.mockResolvedValue(mockLayouts[0]);
    mockGetLayoutById.mockResolvedValue(mockLayouts[0]);
  });

  it('renders the component correctly', () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText('Customize Product Grid Layout')).toBeInTheDocument();
    expect(screen.getByText('Layout Settings')).toBeInTheDocument();
    expect(screen.getByText('Available Layouts')).toBeInTheDocument();
    expect(screen.getByText('Available Products')).toBeInTheDocument();
    expect(screen.getByText('Grid Layout')).toBeInTheDocument();
  });

 it('loads layouts when till is selected', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    expect(screen.getByText('Layout 1')).toBeInTheDocument();
    expect(screen.getByText('Layout 2')).toBeInTheDocument();
    expect(screen.getByText('Layout 3')).toBeInTheDocument();
 });

  it('creates a new layout', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Click the "Create New Layout" button
    const createNewButton = screen.getByText('+ Create New Layout');
    fireEvent.click(createNewButton);

    // Verify that the layout is reset
    const layoutNameInput = screen.getByDisplayValue('New Layout');
    expect(layoutNameInput).toBeInTheDocument();
  });

  it('saves a new layout', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Change layout name
    const layoutNameInput = screen.getByDisplayValue('New Layout');
    fireEvent.change(layoutNameInput, { target: { value: 'Test Layout' } });

    // Click save button
    const saveButton = screen.getByText('Save New Layout');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveGridLayout).toHaveBeenCalledWith({
        name: 'Test Layout',
        tillId: 1,
        layout: expect.objectContaining({
          columns: 6,
          version: '1.0'
        }),
        isDefault: false,
        filterType: 'all',
        categoryId: null
      });
    });
    
    // Verify that gridItems are included in the call
    expect(mockSaveGridLayout).toHaveBeenCalledWith(expect.objectContaining({
      layout: expect.objectContaining({
        gridItems: expect.arrayContaining([
          expect.objectContaining({
            variantId: expect.any(Number),
            productId: expect.any(Number),
            x: expect.any(Number),
            y: expect.any(Number),
            width: 1,
            height: 1
          })
        ])
      })
    }));

    expect(mockOnSaveLayout).toHaveBeenCalled();
  });

  it('updates an existing layout', async () => {
    // Mock the response for loading an existing layout
    const existingLayout = {
      id: 1,
      name: 'Existing Layout',
      tillId: 1,
      layout: {
        columns: 4,
        gridItems: [],
        version: '1.0'
      },
      isDefault: true,
      filterType: 'all',
      categoryId: null
    };
    
    mockGetLayoutById.mockResolvedValueOnce(existingLayout);

    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Load an existing layout
    const loadButtons = screen.getAllByText('Load');
    fireEvent.click(loadButtons[0]); // Click the first load button

    await waitFor(() => {
      expect(mockGetLayoutById).toHaveBeenCalledWith('1');
    });

    // Change layout name
    const layoutNameInput = screen.getByDisplayValue('Existing Layout');
    fireEvent.change(layoutNameInput, { target: { value: 'Updated Layout' } });

    // Click update button (which now says "Update Layout" for existing layouts)
    const updateButton = screen.getByText('Update Layout');
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(mockSaveGridLayout).toHaveBeenCalledWith({
        id: 1,
        name: 'Updated Layout',
        tillId: 1,
        layout: expect.objectContaining({
          columns: 6, // Default grid size is 6
          version: '1.0'
        }),
        isDefault: true,
        filterType: 'all',
        categoryId: null
      });
    });

    expect(mockOnSaveLayout).toHaveBeenCalled();
  });

  it('deletes a layout', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Click delete button for the first layout
    const deleteButtons = screen.getAllByText('Del');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion in modal
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(mockDeleteGridLayout).toHaveBeenCalledWith('1');
    });
  });

  it('sets a layout as default', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Click set default button for the second layout
    const setDefaultButtons = screen.getAllByText('Set Default');
    fireEvent.click(setDefaultButtons[0]); // Click the first set default button

    await waitFor(() => {
      expect(mockSetLayoutAsDefault).toHaveBeenCalledWith('2');
    });
  });

  it('loads a layout by ID', async () => {
    const layoutToLoad = {
      id: 2,
      name: 'Test Layout to Load',
      tillId: 1,
      layout: {
        columns: 4,
        gridItems: [
          {
            id: 'item-1-1-0',
            variantId: 1,
            productId: 1,
            x: 0,
            y: 0,
            width: 1,
            height: 1
          }
        ],
        version: '1.0'
      },
      isDefault: false,
      filterType: 'favorites',
      categoryId: null
    };

    mockGetLayoutById.mockResolvedValueOnce(layoutToLoad);

    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Click load button for the second layout
    const loadButtons = screen.getAllByText('Load');
    fireEvent.click(loadButtons[1]); // Click the second load button

    await waitFor(() => {
      expect(mockGetLayoutById).toHaveBeenCalledWith('2');
    });

    // Check that the layout name was updated
    expect(screen.getByDisplayValue('Test Layout to Load')).toBeInTheDocument();
  });

  it('adds a product to the grid', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Find and click on the first product button
    const productButtons = screen.getAllByText('Product 1');
    fireEvent.click(productButtons[0]); // Click the first one (in available products)

    // Verify that the product was added to the grid - check that there are multiple instances
    expect(screen.getAllByText('Product 1')).toHaveLength(5); // Initial grid items + available products + grid item
  });

  it('handles filter type changes', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Click on the "Favourites" button
    const favoritesButton = screen.getByText('★ Favourites OFF');
    fireEvent.click(favoritesButton);

    expect(screen.getByText('★ Favourites ON')).toBeInTheDocument();
  });

  it('handles category filter changes', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Click on the first category button
    const categoryButton = screen.getByText('Category 1');
    fireEvent.click(categoryButton);

    expect(categoryButton).toHaveClass('bg-amber-500'); // Assuming this is the active class
  });

 it('cancels the layout customization', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('closes the modal with the close button', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Click the close button (the X button)
    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

 it('handles API errors gracefully', async () => {
    // Mock an error when saving
    mockSaveGridLayout.mockRejectedValueOnce(new Error('Failed to save layout'));

    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Change layout name
    const layoutNameInput = screen.getByDisplayValue('New Layout');
    fireEvent.change(layoutNameInput, { target: { value: 'Test Layout' } });

    // Click save button
    const saveButton = screen.getByText('Save New Layout');
    fireEvent.click(saveButton);

    // Check that an error alert would be shown (in real app)
    await waitFor(() => {
      expect(mockSaveGridLayout).toHaveBeenCalled();
    });
  });

  it('adds multiple products to the grid', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Add multiple products - use more specific selectors to avoid multiple matches
    const product1Buttons = screen.getAllByText('Product 1');
    fireEvent.click(product1Buttons[0]); // Click the first one (in available products)
    
    const product2Buttons = screen.getAllByText('Product 2');
    fireEvent.click(product2Buttons[0]); // Click the first one (in available products)
    
    const product3Buttons = screen.getAllByText('Product 3');
    fireEvent.click(product3Buttons[0]); // Click the first one (in available products)

    // Verify that all products were added to the grid - check for multiple instances
    expect(screen.getAllByText('Product 1')).toHaveLength(5);
    expect(screen.getAllByText('Product 2')).toHaveLength(3); // Available + grid item + initial grid
    expect(screen.getAllByText('Product 3')).toHaveLength(3); // Available + grid item + initial grid
  });

 it('clears the grid when "Clear Grid" button is clicked', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Add a product to the grid - use a more specific selector to avoid multiple matches
    const productButtons = screen.getAllByText('Product 1');
    fireEvent.click(productButtons[0]); // Click the first one (in available products)
    expect(screen.getAllByText('Product 1')).toHaveLength(5); // Should have 5: available products + grid items + initial grid items

    // Click clear grid button
    const clearGridButton = screen.getByText('Clear Grid');
    fireEvent.click(clearGridButton);

    // Verify that the grid is empty - check within the grid layout container specifically
    const gridContainer = screen.getByText('Drag products here to arrange them on the grid').closest('div');
    expect(within(gridContainer!).queryByText('Product 1')).not.toBeInTheDocument();
  });

  it('saves layout as new', async () => {
    // Mock an existing layout to be loaded first
    const existingLayout = {
      id: 1,
      name: 'Existing Layout',
      tillId: 1,
      layout: {
        columns: 4,
        gridItems: [],
        version: '1.0'
      },
      isDefault: true,
      filterType: 'all',
      categoryId: null
    };
    
    mockGetLayoutById.mockResolvedValueOnce(existingLayout);

    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Load an existing layout
    const loadButtons = screen.getAllByText('Load');
    fireEvent.click(loadButtons[0]);

    await waitFor(() => {
      expect(mockGetLayoutById).toHaveBeenCalledWith('1');
    });

    // Change layout name
    const layoutNameInput = screen.getByDisplayValue('Existing Layout');
    fireEvent.change(layoutNameInput, { target: { value: 'New Copy Layout' } });

    // Click "Save As New" button
    const saveAsNewButton = screen.getByText('Save As New');
    fireEvent.click(saveAsNewButton);

    await waitFor(() => {
      expect(mockSaveGridLayout).toHaveBeenCalledWith({
        name: 'New Copy Layout',
        tillId: 1,
        layout: expect.objectContaining({
          columns: 6, // Default grid size is 6
          version: '1.0'
        }),
        isDefault: false, // Should be false for new layouts
        filterType: 'all',
        categoryId: null
      });
    });

    expect(mockOnSaveLayout).toHaveBeenCalled();
  });

  it('filters layouts by filter type', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Verify all layouts are shown initially
    expect(screen.getByText('Layout 1')).toBeInTheDocument(); // All products
    expect(screen.getByText('Layout 2')).toBeInTheDocument(); // Favorites
    expect(screen.getByText('Layout 3')).toBeInTheDocument(); // Category

    // Filter by favorites - find the select by its label text
    const filterLabel = screen.getByText('Filter');
    const filterSelect = filterLabel.closest('div')?.querySelector('select');
    fireEvent.change(filterSelect!, { target: { value: 'favorites' } });

    // Verify only favorites layout is shown
    expect(screen.getByText('Layout 2')).toBeInTheDocument(); // Favorites
    expect(screen.queryByText('Layout 1')).not.toBeInTheDocument(); // All products
    expect(screen.queryByText('Layout 3')).not.toBeInTheDocument(); // Category
  });

  it('searches layouts by name', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Search for "Layout 1"
    const searchInput = screen.getByPlaceholderText('Search layouts...');
    fireEvent.change(searchInput, { target: { value: 'Layout 1' } });

    // Verify only "Layout 1" is shown
    expect(screen.getByText('Layout 1')).toBeInTheDocument();
    expect(screen.queryByText('Layout 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Layout 3')).not.toBeInTheDocument();
  });

 it('resets layout when creating new', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Add a product to the grid - use a more specific selector to avoid multiple matches
    const productButtons = screen.getAllByText('Product 1');
    fireEvent.click(productButtons[0]); // Click the first one (in available products)
    expect(screen.getAllByText('Product 1')).toHaveLength(5); // Should have 5: available products + grid items + initial grid items

    // Change layout name
    const layoutNameInput = screen.getByDisplayValue('New Layout');
    fireEvent.change(layoutNameInput, { target: { value: 'Test Layout' } });

    // Click "Create New Layout" button
    const createNewButton = screen.getByText('+ Create New Layout');
    fireEvent.click(createNewButton);

    // Verify that layout is reset
    expect(screen.getByDisplayValue('New Layout')).toBeInTheDocument();
    // Verify that layout is reset - check within the grid layout container specifically
    expect(screen.getByDisplayValue('New Layout')).toBeInTheDocument();
    const gridContainer = screen.getByText('Drag products here to arrange them on the grid').closest('div');
    expect(within(gridContainer!).queryByText('Product 1')).not.toBeInTheDocument();
 });

  it('handles loading layout error gracefully', async () => {
    // Mock an error when loading a layout
    mockGetLayoutById.mockRejectedValueOnce(new Error('Failed to load layout'));

    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Click load button for the first layout
    const loadButtons = screen.getAllByText('Load');
    fireEvent.click(loadButtons[0]);

    // Wait for error handling
    await waitFor(() => {
      expect(mockGetLayoutById).toHaveBeenCalledWith('1');
    });

    // Check if an error message is displayed
    expect(screen.getByText(/Failed to load layout/i)).toBeInTheDocument();
  });

 it('handles delete layout error gracefully', async () => {
    // Mock an error when deleting a layout
    mockDeleteGridLayout.mockRejectedValueOnce(new Error('Failed to delete layout'));

    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Click delete button for the first layout
    const deleteButtons = screen.getAllByText('Del');
    fireEvent.click(deleteButtons[0]);

    // Confirm deletion in modal
    const confirmDeleteButton = screen.getByText('Delete');
    fireEvent.click(confirmDeleteButton);

    // Wait for error handling
    await waitFor(() => {
      expect(mockDeleteGridLayout).toHaveBeenCalledWith('1');
    });

    // Check if an error message is displayed
    expect(screen.getByText(/Failed to delete layout/i)).toBeInTheDocument();
  });

 it('handles setting layout as default error gracefully', async () => {
    // Mock an error when setting layout as default
    mockSetLayoutAsDefault.mockRejectedValueOnce(new Error('Failed to set layout as default'));

    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Click set default button for the second layout
    const setDefaultButtons = screen.getAllByText('Set Default');
    fireEvent.click(setDefaultButtons[0]);

    // Wait for error handling
    await waitFor(() => {
      expect(mockSetLayoutAsDefault).toHaveBeenCalledWith('2');
    });

    // Check if an error message is displayed
    expect(screen.getByText(/Failed to set layout as default/i)).toBeInTheDocument();
 });

  it('handles loading layouts error gracefully', async () => {
    // Mock an error when loading layouts
    mockGetGridLayoutsForTill.mockRejectedValueOnce(new Error('Failed to load layouts'));

    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for error handling
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Check if an error message is displayed
    expect(screen.getByText(/Failed to load layouts/i)).toBeInTheDocument();
  });

  it('maintains grid items when loading different layouts', async () => {
    const layoutWithItems = {
      id: 1,
      name: 'Layout With Items',
      tillId: 1,
      layout: {
        columns: 4,
        gridItems: [
          {
            id: 'item-1-1-0',
            variantId: 1,
            productId: 1,
            x: 0,
            y: 0,
            width: 1,
            height: 1
          }
        ],
        version: '1.0'
      },
      isDefault: false,
      filterType: 'all',
      categoryId: null
    };

    mockGetLayoutById.mockResolvedValueOnce(layoutWithItems);

    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Load the layout with items
    const loadButtons = screen.getAllByText('Load');
    fireEvent.click(loadButtons[0]);

    await waitFor(() => {
      expect(mockGetLayoutById).toHaveBeenCalledWith('1');
    });

    // Verify that the grid item is displayed (using getAllByText since there are multiple)
    expect(screen.getAllByText('Product 1')).toHaveLength(3); // One in available products, one in grid, and one in the initial grid items
  });

 it('updates the grid when filter type changes', async () => {
    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Add a product - use a more specific selector to avoid multiple matches
    const productButtons = screen.getAllByText('Product 1');
    fireEvent.click(productButtons[0]); // Click the first one (in available products)
    expect(screen.getAllByText('Product 1')).toHaveLength(5); // Should have 5: available products + grid items + initial grid items

    // Change to favorites filter
    const favoritesButton = screen.getByText('★ Favourites OFF');
    fireEvent.click(favoritesButton);

    // Verify the filter is now active
    expect(screen.getByText('★ Favourites ON')).toBeInTheDocument();

    // Change back to all products - use a more specific selector
    const allButton = screen.getByRole('button', { name: /All/i });
    fireEvent.click(allButton);
    expect(allButton).toHaveClass('bg-amber-500');
  });

  it('shows correct filter type when loading existing layout', async () => {
    const categoryLayout = {
      id: 3,
      name: 'Category Layout',
      tillId: 1,
      layout: {
        columns: 4,
        gridItems: [],
        version: '1.0'
      },
      isDefault: false,
      filterType: 'category',
      categoryId: 1
    };

    mockGetLayoutById.mockResolvedValueOnce(categoryLayout);

    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Load the category layout
    const loadButtons = screen.getAllByText('Load');
    fireEvent.click(loadButtons[2]); // Click the third layout (category layout)

    await waitFor(() => {
      expect(mockGetLayoutById).toHaveBeenCalledWith('3');
    });

    // Check that the correct filter type is shown in the layout settings section
    // Find the div with text "Category: Category 1" that has the specific styling for the active filter type
    // Use getAllByText to handle multiple matches and find the right one
    const elements = screen.getAllByText(/Category: Category 1/);
    // Find the one with the correct styling classes (p-2, rounded, bg-slate-60, text-white)
    const activeFilterTypeDiv = elements.find(el =>
      el.closest('div')?.classList.contains('p-2') &&
      el.closest('div')?.classList.contains('rounded') &&
      el.closest('div')?.classList.contains('bg-slate-60') &&
      el.closest('div')?.classList.contains('text-white')
    );
    expect(activeFilterTypeDiv).toBeInTheDocument();
  });

 it('handles save as new for existing layout', async () => {
    // Mock an existing layout
    const existingLayout = {
      id: 1,
      name: 'Existing Layout',
      tillId: 1,
      layout: {
        columns: 4,
        gridItems: [],
        version: '1.0'
      },
      isDefault: true,
      filterType: 'all',
      categoryId: null
    };
    
    mockGetLayoutById.mockResolvedValueOnce(existingLayout);

    render(
      <ProductGridLayoutCustomizer
        products={mockProducts}
        categories={mockCategories}
        tills={mockTills}
        currentTillId={1}
        onSaveLayout={mockOnSaveLayout}
        onCancel={mockOnCancel}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(mockGetGridLayoutsForTill).toHaveBeenCalledWith(1);
    });

    // Load an existing layout
    const loadButtons = screen.getAllByText('Load');
    fireEvent.click(loadButtons[0]);

    await waitFor(() => {
      expect(mockGetLayoutById).toHaveBeenCalledWith('1');
    });

    // Change layout name
    const layoutNameInput = screen.getByDisplayValue('Existing Layout');
    fireEvent.change(layoutNameInput, { target: { value: 'Saved As New Layout' } });

    // Click "Save As New" button
    const saveAsNewButton = screen.getByText('Save As New');
    fireEvent.click(saveAsNewButton);

    await waitFor(() => {
      expect(mockSaveGridLayout).toHaveBeenCalledWith({
        name: 'Saved As New Layout',
        tillId: 1,
        layout: expect.objectContaining({
          columns: 6, // Default grid size is 6
          version: '1.0'
        }),
        isDefault: false, // Should be false for new layouts
        filterType: 'all',
        categoryId: null
      });
    });

    expect(mockOnSaveLayout).toHaveBeenCalled();
  });
});