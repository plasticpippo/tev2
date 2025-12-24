import type { Product, ProductVariant, Till, Category } from '../../backend/src/types';

// Define filter type for layout customization
export type FilterType = 'all' | 'favorites' | 'category';

export interface ProductGridLayout {
  columns: number;
  gridItems: {
    id: string;
    variantId: number;
    productId: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  version: string;
}

export interface ProductGridLayoutData {
  id?: string | number;
  name: string;
  tillId: number;
  layout: ProductGridLayout;
  isDefault: boolean;
  filterType?: FilterType;
  categoryId?: number | null;
}

// Re-export the types from backend
export type {
  Product,
 ProductVariant,
  Till,
 Category,
  OrderItem,
  User,
  Tab,
  Transaction,
  TaxSettings,
  Settings,
  StockItem,
  StockAdjustment,
 DailyClosing,
  OrderActivityLog,
  OrderSession
} from '../../backend/src/types';