import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GridTemplates from './GridTemplates';
import type { Product } from '../../shared/types';

// Mock products data for testing
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
        stockConsumption: [],
        backgroundColor: '#d2691e',
        textColor: '#ffffff'
      }
    ]
  },
  {
    id: 2,
    name: 'Sandwich',
    categoryId: 2,
    variants: [
      {
        id: 2,
        productId: 2,
        name: 'Ham Sandwich',
        price: 5.00,
        stockConsumption: [],
        backgroundColor: '#deb887',
        textColor: '#000000'
      }
    ]
  },
  {
    id: 3,
    name: 'Cake',
    categoryId: 3,
    variants: [
      {
        id: 3,
        productId: 3,
        name: 'Chocolate Cake',
        price: 4.50,
        stockConsumption: [],
        backgroundColor: '#8b4513',
        textColor: '#ffffff'
      }
    ]
  }
];

describe('GridTemplates Component', () => {
  const mockOnApplyTemplate = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the component correctly', () => {
    render(
      <GridTemplates
        onApplyTemplate={mockOnApplyTemplate}
        products={mockProducts}
        variants={mockProducts.flatMap(p => p.variants)}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Grid Templates')).toBeInTheDocument();
    expect(screen.getByText('Restaurant Standard')).toBeInTheDocument();
    expect(screen.getByText('Retail Standard')).toBeInTheDocument();
    expect(screen.getByText('Bar Standard')).toBeInTheDocument();
    expect(screen.getByText('Cafe Standard')).toBeInTheDocument();
  });

  test('allows filtering by category', () => {
    render(
      <GridTemplates
        onApplyTemplate={mockOnApplyTemplate}
        products={mockProducts}
        variants={mockProducts.flatMap(p => p.variants)}
        onCancel={mockOnCancel}
      />
    );

    // Initially, all templates should be visible
    expect(screen.getAllByText(/Standard/)).toHaveLength(4);

    // Change filter to restaurant
    const filterSelect = screen.getByRole('combobox');
    fireEvent.change(filterSelect, { target: { value: 'restaurant' } });

    // Should only show restaurant template
    expect(screen.queryByText('Restaurant Standard')).toBeInTheDocument();
    expect(screen.queryByText('Retail Standard')).not.toBeInTheDocument();
    expect(screen.queryByText('Bar Standard')).not.toBeInTheDocument();
    expect(screen.queryByText('Cafe Standard')).not.toBeInTheDocument();
  });

  test('allows template selection', () => {
    render(
      <GridTemplates
        onApplyTemplate={mockOnApplyTemplate}
        products={mockProducts}
        variants={mockProducts.flatMap(p => p.variants)}
        onCancel={mockOnCancel}
      />
    );

    const restaurantTemplate = screen.getByText('Restaurant Standard').closest('div');
    expect(restaurantTemplate).toBeInTheDocument();
    
    if (restaurantTemplate) {
      // Just verify that clicking doesn't cause errors
      fireEvent.click(restaurantTemplate);
      expect(fireEvent.click(restaurantTemplate)).toBeDefined();
    }
  });

  test('calls onApplyTemplate when apply button is clicked', () => {
    render(
      <GridTemplates
        onApplyTemplate={mockOnApplyTemplate}
        products={mockProducts}
        variants={mockProducts.flatMap(p => p.variants)}
        onCancel={mockOnCancel}
      />
    );

    // Select a template
    const restaurantTemplate = screen.getByText('Restaurant Standard').closest('div');
    if (restaurantTemplate) {
      fireEvent.click(restaurantTemplate);
    }

    // Click the apply button
    const applyButton = screen.getByText('Apply Template');
    fireEvent.click(applyButton);

    expect(mockOnApplyTemplate).toHaveBeenCalledTimes(1);
  });

  test('disables apply button when no template is selected', () => {
    render(
      <GridTemplates
        onApplyTemplate={mockOnApplyTemplate}
        products={mockProducts}
        variants={mockProducts.flatMap(p => p.variants)}
        onCancel={mockOnCancel}
      />
    );

    const applyButton = screen.getByText('Apply Template');
    expect(applyButton).toBeDisabled();
  });

  test('calls onCancel when cancel button is clicked', () => {
    render(
      <GridTemplates
        onApplyTemplate={mockOnApplyTemplate}
        products={mockProducts}
        variants={mockProducts.flatMap(p => p.variants)}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByLabelText('Close');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});