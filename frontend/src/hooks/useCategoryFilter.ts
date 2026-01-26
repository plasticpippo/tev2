import { useMemo } from 'react';

// Updated to work with the new structure - this would normally fetch from a real API
export const useCategoryFilter = (categoryId: string | number): any[] => {
  // Mock products for demonstration purposes
  const mockProducts: any[] = [
    { id: '1', name: 'Espresso', price: 2.50, color: '#D2691E', categoryId: '1' },
    { id: '2', name: 'Cappuccino', price: 3.20, color: '#DEB887', categoryId: '1' },
    { id: '3', name: 'Latte', price: 3.80, color: '#F5DEB3', categoryId: '1' },
    { id: '4', name: 'Cola', price: 2.00, color: '#3B2F2F', categoryId: '2' },
    { id: '5', name: 'Orange Juice', price: 2.80, color: '#FFA500', categoryId: '2' },
    { id: '6', name: 'Water', price: 1.50, color: '#ADD8E6', categoryId: '2' },
    { id: '7', name: 'Green Tea', price: 2.60, color: '#90EE90', categoryId: '2' },
    { id: '8', name: 'Cheeseburger', price: 8.50, color: '#CD853F', categoryId: '3' },
    { id: '9', name: 'Caesar Salad', price: 7.20, color: '#9ACD32', categoryId: '3' },
    { id: '10', name: 'Ice Cream', price: 4.50, color: '#FFB6C1', categoryId: '4' }
  ];

  return useMemo(() => {
    if (categoryId === 'all') {
      return mockProducts;
    }
    if (typeof categoryId === 'string') {
      return mockProducts.filter(p => p.categoryId === categoryId);
    } else {
      // For numeric category IDs, convert to string for comparison
      return mockProducts.filter(p => p.categoryId === String(categoryId));
    }
  }, [categoryId]);
};