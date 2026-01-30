// This file is now mainly for reference/testing
// Real data comes from API via productService and layoutService

import type { Category } from '@shared/types';

// Categories are still useful for demo
export const mockCategories: Category[] = [
  { id: 1, name: 'Favourites', visibleTillIds: [] },
  { id: 2, name: 'Drinks', visibleTillIds: [] },
  { id: 3, name: 'Food', visibleTillIds: [] },
  { id: 4, name: 'Others', visibleTillIds: [] }
];

// Note: Products and variants should now come from the API
// Use getProducts() from productService instead of this mock data