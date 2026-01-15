import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LayoutSelectionDropdown } from '../frontend/components/LayoutSelectionDropdown';
import { ProductGridLayoutData } from '../frontend/services/apiBase';

// Mock the gridLayoutService
jest.mock('./frontend/services/gridLayoutService', () => ({
  getLayoutsByFilterType: jest.fn(),
}));

describe('LayoutSelectionDropdown', () => {
  const mockLayouts: ProductGridLayoutData[] = [
    {
      id: 1,
      name: 'Default Layout',
      tillId: 1,
      layout: {
        columns: 4,
        gridItems: [],
        version: '1.0'
      },
      isDefault: true,
      filterType: 'all'
    },
    {
      id: 2,
      name: 'Custom Layout',
      tillId: 1,
      layout: {
        columns: 6,
        gridItems: [],
        version: '1.0'
      },
      isDefault: false,
      filterType: 'all'
    }
  ];

  const defaultProps = {
    tillId: 1,
    filterType: 'all' as const,
    categoryId: null,
    currentLayoutId: 1,
    onLayoutChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dropdown with available layouts', async () => {
    const { getLayoutsByFilterType } = require('./frontend/services/gridLayoutService');
    getLayoutsByFilterType.mockResolvedValue(mockLayouts);

    render(<LayoutSelectionDropdown {...defaultProps} />);

    // Wait for the layouts to load
    await waitFor(() => {
      expect(screen.getByText('Layout for All Products:')).toBeInTheDocument();
    });

    // Check that the options are rendered
    expect(screen.getByRole('option', { name: 'Default Layout (Default)' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Custom Layout' })).toBeInTheDocument();
  });

  it('calls onLayoutChange when a layout is selected', async () => {
    const { getLayoutsByFilterType } = require('./frontend/services/gridLayoutService');
    getLayoutsByFilterType.mockResolvedValue(mockLayouts);

    const onLayoutChange = jest.fn();
    render(<LayoutSelectionDropdown {...defaultProps} onLayoutChange={onLayoutChange} />);

    // Wait for the layouts to load
    await waitFor(() => {
      expect(screen.getByText('Layout for All Products:')).toBeInTheDocument();
    });

    // Select the second layout
    const selectElement = screen.getByRole('combobox');
    fireEvent.change(selectElement, { target: { value: '2' } });

    // Verify the callback was called with the correct layout
    await waitFor(() => {
      expect(onLayoutChange).toHaveBeenCalledWith(mockLayouts[1]);
    });
  });

  it('handles category filter type correctly', async () => {
    const { getLayoutsByFilterType } = require('./frontend/services/gridLayoutService');
    getLayoutsByFilterType.mockResolvedValue(mockLayouts);

    render(
      <LayoutSelectionDropdown
        {...defaultProps}
        filterType="category"
        categoryId={5}
      />
    );

    // Wait for the layouts to load
    await waitFor(() => {
      expect(screen.getByText('Layout for Category: Category 5:')).toBeInTheDocument();
    });
 });

  it('shows loading state', async () => {
    const { getLayoutsByFilterType } = require('./frontend/services/gridLayoutService');
    getLayoutsByFilterType.mockReturnValue(new Promise(() => {})); // Never resolves to simulate loading

    render(<LayoutSelectionDropdown {...defaultProps} />);

    expect(screen.getByText('Loading layouts...')).toBeInTheDocument();
  });
});