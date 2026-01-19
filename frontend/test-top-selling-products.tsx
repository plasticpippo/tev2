import React, { useState, useEffect } from 'react';
import { TopPerformers } from './components/analytics/TopPerformers';
import { AdvancedFilter } from './components/analytics/AdvancedFilter';
import { ProductPerformanceTable } from './components/analytics/ProductPerformanceTable';
import { PaginationControls } from './components/analytics/PaginationControls';
import type { Transaction, Product, Category } from './shared/types';
import { fetchProductPerformance, fetchTopPerformers } from './services/analyticsService';

// Mock data for testing
const mockTransactions: Transaction[] = [
  {
    id: 1,
    items: [
      {
        id: '1',
        variantId: 1,
        productId: 1,
        name: 'Coffee',
        price: 3.50,
        quantity: 2,
        effectiveTaxRate: 0.1
      },
      {
        id: '2',
        variantId: 2,
        productId: 2,
        name: 'Tea',
        price: 2.50,
        quantity: 1,
        effectiveTaxRate: 0.1
      }
    ],
    subtotal: 9.50,
    tax: 0.95,
    tip: 1.00,
    total: 11.45,
    paymentMethod: 'cash',
    userId: 1,
    userName: 'John Doe',
    tillId: 1,
    tillName: 'Main Till',
    createdAt: '2023-01-01T10:00:00Z'
  },
  {
    id: 2,
    items: [
      {
        id: '3',
        variantId: 1,
        productId: 1,
        name: 'Coffee',
        price: 3.50,
        quantity: 1,
        effectiveTaxRate: 0.1
      }
    ],
    subtotal: 3.50,
    tax: 0.35,
    tip: 0.50,
    total: 4.35,
    paymentMethod: 'card',
    userId: 2,
    userName: 'Jane Smith',
    tillId: 1,
    tillName: 'Main Till',
    createdAt: '2023-01-01T11:00:00Z'
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
        price: 3.50,
        stockConsumption: [],
        backgroundColor: '#6f4e37',
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
        id: 2,
        productId: 2,
        name: 'Green Tea',
        price: 2.50,
        stockConsumption: [],
        backgroundColor: '#3cb371',
        textColor: '#ffffff'
      }
    ]
  },
  {
    id: 3,
    name: 'Sandwich',
    categoryId: 2,
    variants: [
      {
        id: 3,
        productId: 3,
        name: 'Ham Sandwich',
        price: 5.00,
        stockConsumption: [],
        backgroundColor: '#d2b48c',
        textColor: '#000000'
      }
    ]
  }
];

const mockCategories: Category[] = [
  {
    id: 1,
    name: 'Drinks',
    visibleTillIds: []
  },
  {
    id: 2,
    name: 'Food',
    visibleTillIds: []
  }
];

// Test component to demonstrate the new functionality
const TopSellingProductsTest: React.FC = () => {
  const [showExpanded, setShowExpanded] = useState(false);
  
  return (
    <div className="p-6 bg-slate-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6">Top Selling Products - Testing Interface</h1>
      
      <div className="mb-6">
        <button
          onClick={() => setShowExpanded(!showExpanded)}
          className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600"
        >
          {showExpanded ? 'Show Basic View' : 'Show Expanded View'}
        </button>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Using TopPerformers Component</h2>
        <TopPerformers 
          transactions={mockTransactions} 
          products={mockProducts} 
          categories={mockCategories} 
          includeAllProducts={showExpanded}
        />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Testing Individual Components</h2>
        <AdvancedFilter
          categories={mockCategories}
          products={mockProducts}
          onFilterChange={(filters) => console.log('Filters changed:', filters)}
        />
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Sample Product Performance Table</h2>
        <ProductPerformanceTable 
          products={[
            {
              id: 1,
              name: 'Coffee',
              categoryId: 1,
              categoryName: 'Drinks',
              totalQuantity: 10,
              totalRevenue: 35.00,
              averagePrice: 3.50,
              transactionCount: 5
            },
            {
              id: 2,
              name: 'Tea',
              categoryId: 1,
              categoryName: 'Drinks',
              totalQuantity: 7,
              totalRevenue: 17.50,
              averagePrice: 2.50,
              transactionCount: 3
            },
            {
              id: 3,
              name: 'Sandwich',
              categoryId: 2,
              categoryName: 'Food',
              totalQuantity: 4,
              totalRevenue: 20.00,
              averagePrice: 5.00,
              transactionCount: 2
            }
          ]}
        />
      </div>
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Testing API Integration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={async () => {
              try {
                const result = await fetchProductPerformance({ limit: 5 });
                console.log('Product Performance Result:', result);
                alert('Check console for API result');
              } catch (error) {
                console.error('Error:', error);
                alert('Error fetching data');
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Fetch Product Performance
          </button>
          
          <button
            onClick={async () => {
              try {
                const result = await fetchTopPerformers();
                console.log('Top Performers Result:', result);
                alert('Check console for API result');
              } catch (error) {
                console.error('Error:', error);
                alert('Error fetching data');
              }
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Fetch Top Performers (Legacy)
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopSellingProductsTest;