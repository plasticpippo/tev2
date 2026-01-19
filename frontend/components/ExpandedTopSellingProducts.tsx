import React from 'react';
import type { Transaction, Product, Category } from '../shared/types';
import { TopPerformers } from './analytics/TopPerformers';

interface ExpandedTopSellingProductsProps {
  transactions: Transaction[];
  products: Product[];
  categories: Category[];
}

export const ExpandedTopSellingProducts: React.FC<ExpandedTopSellingProductsProps> = ({
  transactions,
  products,
  categories
}) => {
  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold text-slate-300 mb-6">Detailed Product Performance</h2>
      <TopPerformers 
        transactions={transactions} 
        products={products} 
        categories={categories} 
        includeAllProducts={true} 
      />
    </div>
  );
};