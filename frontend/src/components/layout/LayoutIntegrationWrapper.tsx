import React from 'react';
import { LayoutProvider } from '../../contexts/LayoutContext';
import { ProductGridLayout } from './ProductGridLayout';
import type { Product, ProductVariant, Category } from '@shared/types';

interface LayoutIntegrationWrapperProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (variant: ProductVariant, product: Product) => void;
  makableVariantIds: Set<number>;
  assignedTillId: number | null;
  currentCategoryId: number | 'favourites' | 'all';
}

/**
 * Wrapper component that provides LayoutProvider and passes data to ProductGridLayout
 * Use this to integrate layout system with existing POS interface
 */
export const LayoutIntegrationWrapper: React.FC<LayoutIntegrationWrapperProps> = ({
  products,
  categories,
  onAddToCart,
  makableVariantIds,
  assignedTillId,
  currentCategoryId
}) => {
  if (!assignedTillId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Please assign a till to use the POS system
      </div>
    );
  }

  return (
    <LayoutProvider tillId={assignedTillId} initialCategoryId={currentCategoryId}>
      <ProductGridLayout
        products={products}
        categories={categories}
        onAddToCart={onAddToCart}
        makableVariantIds={makableVariantIds}
        assignedTillId={assignedTillId}
      />
    </LayoutProvider>
  );
};