import React from 'react';
import ProductGridLayoutCustomizer from './ProductGridLayoutCustomizer';
import type { Product, Till, Category } from '../../shared/types';

// Mock data for testing
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
        price: 250,
        backgroundColor: '#d2691e',
        textColor: '#ffffff',
        isFavourite: true,
        stockConsumption: []
      },
      {
        id: 2,
        productId: 1,
        name: 'Large Coffee',
        price: 300,
        backgroundColor: '#8b4513',
        textColor: '#ffffff',
        isFavourite: false,
        stockConsumption: []
      }
    ]
  },
  {
    id: 2,
    name: 'Sandwich',
    categoryId: 2,
    variants: [
      {
        id: 3,
        productId: 2,
        name: 'Ham Sandwich',
        price: 500,
        backgroundColor: '#deb887',
        textColor: '#000000',
        isFavourite: false,
        stockConsumption: []
      }
    ]
  }
];

const mockCategories: Category[] = [
  { id: 1, name: 'Drinks', visibleTillIds: [] },
  { id: 2, name: 'Food', visibleTillIds: [] }
];

const mockTills = [
  { id: 1, name: 'Main Till', location: 'Counter' },
  { id: 2, name: 'Secondary Till', location: 'Bar' }
];

const TestEnhancedGridIntegration: React.FC = () => {
  const handleSaveLayout = (layoutData: any) => {
    console.log('Layout saved:', layoutData);
    alert(`Layout "${layoutData.name}" saved successfully!`);
  };

  const handleCancel = () => {
    console.log('Layout customization cancelled');
    alert('Customization cancelled');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Enhanced Grid Integration Test</h1>
      <p className="mb-4">Testing the integration of the enhanced grid layout components</p>
      
      <div className="border rounded p-4 bg-gray-100">
        <ProductGridLayoutCustomizer
          products={mockProducts}
          categories={mockCategories}
          tills={mockTills}
          currentTillId={1}
          onSaveLayout={handleSaveLayout}
          onCancel={handleCancel}
          initialFilterType="all"
        />
      </div>
    </div>
  );
};

export default TestEnhancedGridIntegration;