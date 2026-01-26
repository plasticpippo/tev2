// Test component to verify all layout components work together
import React from 'react';
import { LayoutIntegrationWrapper } from './LayoutIntegrationWrapper';
import { EditModeOverlay } from '../EditModeOverlay';
import type { Product, ProductVariant, Category } from '../../../shared/types';

export const TestLayoutComponents: React.FC = () => {
  // Mock data for testing
  const mockCategories: Category[] = [
    { id: 1, name: 'Drinks', visibleTillIds: [] },
    { id: 2, name: 'Food', visibleTillIds: [] },
    { id: 3, name: 'Desserts', visibleTillIds: [] }
  ];

  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Espresso',
      categoryId: 1,
      variants: [
        {
          id: 1,
          productId: 1,
          name: 'Regular',
          price: 2.50,
          isFavourite: true,
          stockConsumption: [],
          backgroundColor: 'bg-amber-800',
          textColor: 'text-white'
        }
      ]
    },
    {
      id: 2,
      name: 'Cappuccino',
      categoryId: 1,
      variants: [
        {
          id: 2,
          productId: 2,
          name: 'Regular',
          price: 3.20,
          isFavourite: false,
          stockConsumption: [],
          backgroundColor: 'bg-amber-700',
          textColor: 'text-white'
        }
      ]
    }
  ];

  const handleAddToCart = (variant: ProductVariant, product: Product) => {
    console.log('Adding to cart:', { variant, product });
  };

  const assignedTillId = 1;
  const makableVariantIds = new Set([1, 2]); // Both variants are makable for demo

  return (
    <div className="relative w-full h-screen bg-gray-100">
      <h1 className="p-4 text-xl font-bold">Test Layout Components</h1>
      <div className="h-[calc(100vh-100px)]">
        <LayoutIntegrationWrapper
          products={mockProducts}
          categories={mockCategories}
          onAddToCart={handleAddToCart}
          makableVariantIds={makableVariantIds}
          assignedTillId={assignedTillId}
          currentCategoryId={1}
        />
      </div>
      <EditModeOverlay />
    </div>
  );
};