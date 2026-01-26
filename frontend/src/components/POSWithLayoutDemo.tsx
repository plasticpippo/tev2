import React, { useState } from 'react';
import { LayoutProvider } from '../contexts/LayoutContext';
import { LayoutIntegrationWrapper } from './layout/LayoutIntegrationWrapper';
import { EditModeOverlay } from './EditModeOverlay';
import { EditLayoutButton } from './EditLayoutButton';
import { useLayout } from '../contexts/LayoutContext';
import type { Product, ProductVariant, Category } from '@shared/types';

// Inner component that uses LayoutContext
const POSContent: React.FC = () => {
  const { setCurrentCategory, currentCategoryId } = useLayout();

  // Define mock categories with numeric IDs to match new structure
  const mockCategories: Category[] = [
    { id: 1, name: 'Favourites', visibleTillIds: [] },
    { id: 2, name: 'Drinks', visibleTillIds: [] },
    { id: 3, name: 'Food', visibleTillIds: [] },
    { id: 4, name: 'Others', visibleTillIds: [] }
  ];

  // Mock products with variants
  const mockProducts: Product[] = [
    {
      id: 1,
      name: 'Espresso',
      categoryId: 2,
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
      categoryId: 2,
      variants: [
        {
          id: 2,
          productId: 2,
          name: 'Regular',
          price: 3.20,
          isFavourite: true,
          stockConsumption: [],
          backgroundColor: 'bg-amber-700',
          textColor: 'text-white'
        }
      ]
    },
    {
      id: 3,
      name: 'Latte',
      categoryId: 2,
      variants: [
        {
          id: 3,
          productId: 3,
          name: 'Regular',
          price: 3.80,
          isFavourite: false,
          stockConsumption: [],
          backgroundColor: 'bg-amber-200',
          textColor: 'text-gray-900'
        }
      ]
    },
    {
      id: 4,
      name: 'Cheeseburger',
      categoryId: 3,
      variants: [
        {
          id: 4,
          productId: 4,
          name: 'Beef',
          price: 8.50,
          isFavourite: true,
          stockConsumption: [],
          backgroundColor: 'bg-amber-900',
          textColor: 'text-white'
        },
        {
          id: 5,
          productId: 4,
          name: 'Chicken',
          price: 8.00,
          isFavourite: false,
          stockConsumption: [],
          backgroundColor: 'bg-amber-800',
          textColor: 'text-white'
        }
      ]
    }
  ];

  const [selectedFilter, setSelectedFilter] = useState<number | 'favourites' | 'all'>('favourites');

  const handleAddToCart = (variant: ProductVariant, product: Product) => {
    console.log('Adding to cart:', { variant, product });
    // Mock implementation
  };

  const assignedTillId = 1;
  const makableVariantIds = new Set([1, 2, 3, 4, 5]); // All variants are makable for demo

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Left side - Products */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-slate-800 p-4 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-4">Products</h1>
          
          {/* Category Tabs */}
          <div className="flex gap-2 flex-wrap">
            {mockCategories.map(category => (
              <button
                key={category.id}
                onClick={() => {
                  setCurrentCategory(category.id);
                  setSelectedFilter(category.id);
                }}
                className={`
                  px-4 py-2 rounded-lg font-semibold transition-colors
                  ${currentCategoryId === category.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }
                `}
              >
                {category.id === 1 && '⭐ '}
                {category.name}
              </button>
            ))}
            
            {/* All button */}
            <button
              onClick={() => {
                setCurrentCategory('all');
                setSelectedFilter('all');
              }}
              className={`
                px-4 py-2 rounded-lg font-semibold transition-colors
                ${currentCategoryId === 'all'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }
              `}
            >
              All
            </button>
            
            {/* Favourites button */}
            <button
              onClick={() => {
                setCurrentCategory('favourites');
                setSelectedFilter('favourites');
              }}
              className={`
                px-4 py-2 rounded-lg font-semibold transition-colors
                ${currentCategoryId === 'favourites'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }
              `}
            >
              ⭐ Favourites
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto bg-slate-900">
          <LayoutIntegrationWrapper
            products={mockProducts}
            categories={mockCategories}
            onAddToCart={handleAddToCart}
            makableVariantIds={makableVariantIds}
            assignedTillId={assignedTillId}
            currentCategoryId={selectedFilter}
          />
        </div>
      </div>

      {/* Right side - Current Order Panel with Edit Overlay */}
      <div className="w-96 bg-slate-800 border-l border-slate-700 relative flex flex-col">
        {/* User Info Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-sm">Logged in as:</p>
            <p className="text-white font-semibold">Admin User <span className="text-purple-400 text-xs">(Admin)</span></p>
          </div>
          <div className="flex flex-col gap-2">
            <button className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs">
              Admin Panel
            </button>
            <button className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs">
              Logout
            </button>
          </div>
        </div>

        {/* Current Order Content */}
        <div className="flex-1 p-4 relative">
          {/* Normal Order Panel */}
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-yellow-500 mb-4">Current Order</h2>
            <div className="text-center text-gray-500 mt-20">
              Select products to add them here.
            </div>
          </div>

          {/* Edit Mode Overlay - covers this panel when active */}
          <EditModeOverlay />
        </div>

        {/* Edit Layout Button - in Current Order panel */}
        <div className="p-4 border-t border-slate-700">
          <EditLayoutButton userRole="admin" />
        </div>

        {/* Bottom Action Buttons */}
        <div className="p-4 border-t border-slate-700">
          <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold">
            View Open Tabs
          </button>
        </div>
      </div>
    </div>
  );
};

// Main component with Provider
export const POSWithLayoutDemo: React.FC = () => {
  // Using a mock tillId for demonstration purposes
  const assignedTillId = 1;

  return (
    <LayoutProvider tillId={assignedTillId} initialCategoryId={'favourites'}>
      <POSContent />
    </LayoutProvider>
  );
};