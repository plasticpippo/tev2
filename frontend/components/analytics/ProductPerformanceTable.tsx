import React from 'react';
import { formatCurrency } from '../../utils/formatting';

interface ProductPerformance {
  id: number;
  name: string;
  categoryId: number;
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
  transactionCount: number;
}

interface ProductPerformanceTableProps {
  products: ProductPerformance[];
  loading?: boolean;
}

export const ProductPerformanceTable: React.FC<ProductPerformanceTableProps> = ({ 
  products, 
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-slate-300 mb-4">Product Performance</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-slate-700 rounded w-1/3"></div>
                <div className="h-4 bg-slate-700 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-slate-800 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-slate-300 mb-4">Product Performance</h3>
        <p className="text-slate-400">No products found for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-lg overflow-x-auto">
      <h3 className="text-xl font-bold text-slate-300 mb-4">Product Performance</h3>
      <table className="min-w-full divide-y divide-slate-700">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Product</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Category</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Quantity Sold</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Average Price</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Transactions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-slate-750">
              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-300">{product.name}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400">{product.categoryName}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{product.totalQuantity}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{formatCurrency(product.averagePrice)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300 font-semibold">{formatCurrency(product.totalRevenue)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">{product.transactionCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};