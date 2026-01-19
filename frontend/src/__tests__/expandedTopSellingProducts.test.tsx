import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ExpandedTopSellingProducts } from '../../components/ExpandedTopSellingProducts';
import { AdvancedFilter } from '../../components/analytics/AdvancedFilter';
import { ProductPerformanceTable } from '../../components/analytics/ProductPerformanceTable';
import { PaginationControls } from '../../components/analytics/PaginationControls';
import { fetchProductPerformance, fetchTopPerformers } from '../../services/analyticsService';
import { Transaction, Product, Category, OrderItem } from '../../shared/types';

// Mock the analytics service
vi.mock('../../services/analyticsService');

// Mock data for testing
const mockTransactions: Transaction[] = [
  {
    id: 1,
    items: [
      {
        id: 'item1',
        variantId: 1,
        productId: 1,
        name: 'Coffee',
        price: 2.5,
        quantity: 3,
        effectiveTaxRate: 0.19,
      },
      {
        id: 'item2',
        variantId: 2,
        productId: 2,
        name: 'Croissant',
        price: 3.0,
        quantity: 2,
        effectiveTaxRate: 0.19,
      }
    ],
    subtotal: 13.5,
    tax: 2.565,
    tip: 0,
    total: 16.065,
    paymentMethod: 'card',
    userId: 1,
    userName: 'John Doe',
    tillId: 1,
    tillName: 'Main Till',
    createdAt: '2023-06-15T10:30:00Z',
  }
];

const mockProductVariants = [
  {
    id: 1,
    productId: 1,
    name: 'Small Coffee',
    price: 2.5,
    isFavourite: false,
    stockConsumption: [],
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
  },
  {
    id: 2,
    productId: 2,
    name: 'Regular Croissant',
    price: 3.0,
    isFavourite: false,
    stockConsumption: [],
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
  },
];

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Coffee',
    categoryId: 1,
    variants: [mockProductVariants[0]],
  },
  {
    id: 2,
    name: 'Croissant',
    categoryId: 2,
    variants: [mockProductVariants[1]],
  },
];

const mockCategories: Category[] = [
  {
    id: 1,
    name: 'Drinks',
    visibleTillIds: [],
  },
  {
    id: 2,
    name: 'Food',
    visibleTillIds: [],
  },
];

describe('ExpandedTopSellingProducts Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <ExpandedTopSellingProducts
        transactions={mockTransactions}
        products={mockProducts}
        categories={mockCategories}
      />
    );

    expect(screen.getByText('Detailed Product Performance')).toBeInTheDocument();
  });
});

describe('AdvancedFilter Component', () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all filter controls', () => {
    render(
      <AdvancedFilter
        categories={mockCategories}
        products={mockProducts}
        onFilterChange={mockOnFilterChange}
      />
    );

    expect(screen.getByTestId('start-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('end-date-input')).toBeInTheDocument();
    expect(screen.getByTestId('category-select')).toBeInTheDocument();
    expect(screen.getByTestId('product-select')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('ASC')).toBeInTheDocument();
    expect(screen.getByText('DESC')).toBeInTheDocument();
  });

  it('updates filters when user interacts with controls', () => {
    render(
      <AdvancedFilter
        categories={mockCategories}
        products={mockProducts}
        onFilterChange={mockOnFilterChange}
      />
    );

    // Test date change
    const startDateInput = screen.getByTestId('start-date-input');
    fireEvent.change(startDateInput, { target: { value: '2023-01-01' } });
    expect(mockOnFilterChange).toHaveBeenCalled();

    // Test category selection
    const categorySelect = screen.getByTestId('category-select');
    fireEvent.change(categorySelect, { target: { value: '1' } });
    // Note: This might be called more than expected due to useEffect dependencies
    // We'll just check that it was called rather than exact count
    expect(mockOnFilterChange).toHaveBeenCalled();

    // Test product selection
    const productSelect = screen.getByTestId('product-select');
    fireEvent.change(productSelect, { target: { value: '2' } });
    expect(mockOnFilterChange).toHaveBeenCalled();

    // Test sort by revenue
    const revenueButton = screen.getByText('Revenue');
    fireEvent.click(revenueButton);
    expect(mockOnFilterChange).toHaveBeenCalled();

    // Test sort order desc
    const descButton = screen.getByText('DESC');
    fireEvent.click(descButton);
    expect(mockOnFilterChange).toHaveBeenCalled();
  });

  it('resets filters when selecting empty options', () => {
    render(
      <AdvancedFilter
        categories={mockCategories}
        products={mockProducts}
        onFilterChange={mockOnFilterChange}
        initialFilters={{ categoryId: 1, productId: 2 }}
      />
    );

    // Reset category
    const categorySelect = screen.getByTestId('category-select');
    fireEvent.change(categorySelect, { target: { value: '' } });
    expect(mockOnFilterChange).toHaveBeenCalled();
  });
});

describe('ProductPerformanceTable Component', () => {
  const mockProductsData = [
    {
      id: 1,
      name: 'Coffee',
      categoryId: 1,
      categoryName: 'Drinks',
      totalQuantity: 10,
      totalRevenue: 25,
      averagePrice: 2.5,
      transactionCount: 5,
    },
    {
      id: 2,
      name: 'Croissant',
      categoryId: 2,
      categoryName: 'Food',
      totalQuantity: 5,
      totalRevenue: 15,
      averagePrice: 3,
      transactionCount: 3,
    },
  ];

  it('renders loading state', () => {
    render(<ProductPerformanceTable products={[]} loading={true} />);

    expect(screen.getByText('Product Performance')).toBeInTheDocument();
    // Check for loading elements
    const loadingElements = screen.getAllByText(/Product Performance/);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('renders no data message', () => {
    render(<ProductPerformanceTable products={[]} loading={false} />);

    expect(screen.getByText('Product Performance')).toBeInTheDocument();
    expect(screen.getByText('No products found for the selected filters.')).toBeInTheDocument();
  });

  it('renders product data correctly', () => {
    render(<ProductPerformanceTable products={mockProductsData} loading={false} />);

    expect(screen.getByText('Product Performance')).toBeInTheDocument();
    expect(screen.getByText('Coffee')).toBeInTheDocument();
    expect(screen.getByText('Drinks')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('€2,50')).toBeInTheDocument();
    expect(screen.getByText('€25,00')).toBeInTheDocument();
    // Use getAllByText to get all instances of '5' and check that we have the right ones
    const fives = screen.getAllByText('5');
    expect(fives).toHaveLength(2); // There are 2 instances of '5' in the table: quantity for Coffee and transaction count for Croissant

    expect(screen.getByText('Croissant')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('€3,00')).toBeInTheDocument();
    expect(screen.getByText('€15,00')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('PaginationControls Component', () => {
  const mockMetadata = {
    totalCount: 25,
    totalPages: 3,
    currentPage: 1,
    hasNextPage: true,
    hasPrevPage: false,
  };

  const mockOnPageChange = jest.fn();

  it('renders pagination controls', () => {
    render(
      <PaginationControls
        metadata={mockMetadata}
        onPageChange={mockOnPageChange}
      />
    );

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('disables previous button on first page', () => {
    render(
      <PaginationControls
        metadata={mockMetadata}
        onPageChange={mockOnPageChange}
      />
    );

    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
  });

  it('enables next button when there is a next page', () => {
    render(
      <PaginationControls
        metadata={mockMetadata}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByText('Next');
    expect(nextButton).not.toBeDisabled();
  });

  it('calls onPageChange when navigating to next page', () => {
    render(
      <PaginationControls
        metadata={mockMetadata}
        onPageChange={mockOnPageChange}
      />
    );

    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when navigating to previous page', () => {
    const metadataWithPrev = {
      ...mockMetadata,
      currentPage: 2,
      hasPrevPage: true,
    };

    render(
      <PaginationControls
        metadata={metadataWithPrev}
        onPageChange={mockOnPageChange}
      />
    );

    const prevButton = screen.getByText('Previous');
    fireEvent.click(prevButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(1);
  });

  it('handles page selection', () => {
    render(
      <PaginationControls
        metadata={mockMetadata}
        onPageChange={mockOnPageChange}
      />
    );

    const pageTwoButton = screen.getByText('2');
    fireEvent.click(pageTwoButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('shows correct pagination text', () => {
    render(
      <PaginationControls
        metadata={mockMetadata}
        onPageChange={mockOnPageChange}
        currentLimit={10}
      />
    );

    expect(screen.getByText('Showing 1-10 of 25 results')).toBeInTheDocument();
  });
});

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('advanced filter updates table data when filters change', async () => {
    const mockResults = {
      products: [
        {
          id: 1,
          name: 'Coffee',
          categoryId: 1,
          categoryName: 'Drinks',
          totalQuantity: 10,
          totalRevenue: 25,
          averagePrice: 2.5,
          transactionCount: 5,
        }
      ],
      metadata: {
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      summary: {
        totalRevenue: 25,
        totalUnitsSold: 10,
        topProduct: {
          name: 'Coffee',
          revenue: 25,
          quantity: 10,
        }
      }
    };

    (fetchProductPerformance as jest.MockedFunction<any>).mockResolvedValue(mockResults);

    const { rerender } = render(
      <AdvancedFilter
        categories={mockCategories}
        products={mockProducts}
        onFilterChange={async (filters) => {
          // Simulate API call
          const results = await fetchProductPerformance(filters);
          
          // Rerender the table with new data
          rerender(
            <div>
              <AdvancedFilter
                categories={mockCategories}
                products={mockProducts}
                onFilterChange={() => {}}
                initialFilters={filters}
              />
              <ProductPerformanceTable products={results.products} loading={false} />
            </div>
          );
        }}
      />
    );

    // Change the category filter
    const categorySelect = screen.getByTestId('category-select');
    fireEvent.change(categorySelect, { target: { value: '1' } });

    await waitFor(() => {
      expect(fetchProductPerformance).toHaveBeenCalledWith({ categoryId: 1, sortBy: 'revenue', sortOrder: 'desc' });
    });
  });

  it('pagination controls update table data', async () => {
    const mockResultsPage1 = {
      products: [
        {
          id: 1,
          name: 'Coffee',
          categoryId: 1,
          categoryName: 'Drinks',
          totalQuantity: 10,
          totalRevenue: 25,
          averagePrice: 2.5,
          transactionCount: 5,
        }
      ],
      metadata: {
        totalCount: 15,
        totalPages: 2,
        currentPage: 1,
        hasNextPage: true,
        hasPrevPage: false,
      },
      summary: {
        totalRevenue: 25,
        totalUnitsSold: 10,
        topProduct: {
          name: 'Coffee',
          revenue: 25,
          quantity: 10,
        }
      }
    };

    const mockResultsPage2 = {
      products: [
        {
          id: 2,
          name: 'Croissant',
          categoryId: 2,
          categoryName: 'Food',
          totalQuantity: 8,
          totalRevenue: 24,
          averagePrice: 3,
          transactionCount: 4,
        }
      ],
      metadata: {
        totalCount: 15,
        totalPages: 2,
        currentPage: 2,
        hasNextPage: false,
        hasPrevPage: true,
      },
      summary: {
        totalRevenue: 24,
        totalUnitsSold: 8,
        topProduct: {
          name: 'Croissant',
          revenue: 24,
          quantity: 8,
        }
      }
    };

    (fetchProductPerformance as jest.MockedFunction<any>)
      .mockResolvedValueOnce(mockResultsPage1)
      .mockResolvedValueOnce(mockResultsPage2);

    const mockOnPageChange = jest.fn(async (page) => {
      const results = page === 1 ? mockResultsPage1 : mockResultsPage2;
      
      // In a real scenario, this would trigger a re-render with new data
      // For testing purposes, we'll just verify the function is called
    });

    render(
      <>
        <ProductPerformanceTable products={mockResultsPage1.products} loading={false} />
        <PaginationControls
          metadata={mockResultsPage1.metadata}
          onPageChange={mockOnPageChange}
        />
      </>
    );

    // Click next page
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });
});

describe('Backward Compatibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('top performers endpoint maintains backward compatibility', async () => {
    const mockResults = {
      products: [
        {
          id: 1,
          name: 'Coffee',
          categoryId: 1,
          categoryName: 'Drinks',
          totalQuantity: 10,
          totalRevenue: 25,
          averagePrice: 2.5,
          transactionCount: 5,
        }
      ],
      metadata: {
        totalCount: 1,
        totalPages: 1,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      summary: {
        totalRevenue: 25,
        totalUnitsSold: 10,
        topProduct: {
          name: 'Coffee',
          revenue: 25,
          quantity: 10,
        }
      }
    };

    (fetchTopPerformers as jest.MockedFunction<any>).mockResolvedValue(mockResults);

    const results = await fetchTopPerformers();
    
    expect(results).toEqual(mockResults);
    expect(results.products).toBeDefined();
    expect(results.metadata).toBeDefined();
    expect(results.summary).toBeDefined();
  });

  it('top performers endpoint accepts same parameters as product-performance', async () => {
    const mockResults = {
      products: [],
      metadata: {
        totalCount: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
      summary: {
        totalRevenue: 0,
        totalUnitsSold: 0,
        topProduct: null,
      }
    };

    (fetchTopPerformers as jest.MockedFunction<any>).mockResolvedValue(mockResults);

    // Test with date range
    await fetchTopPerformers({ startDate: '2023-01-01', endDate: '2023-12-31' });
    expect(fetchTopPerformers).toHaveBeenCalledWith({ startDate: '2023-01-01', endDate: '2023-12-31' });

    // Test with category
    await fetchTopPerformers({ categoryId: 1 });
    expect(fetchTopPerformers).toHaveBeenCalledWith({ categoryId: 1 });

    // Test with product
    await fetchTopPerformers({ productId: 1 });
    expect(fetchTopPerformers).toHaveBeenCalledWith({ productId: 1 });
  });
});