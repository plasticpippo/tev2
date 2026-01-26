// Type definitions for layout customization feature

export interface ButtonPosition {
  variantId: number;     // Changed from productId
  gridColumn: number;    // 1-4 (for 4-column grid)
  gridRow: number;       // 1-based row number
}

export interface CategoryLayout {
  categoryId: number;
  positions: ButtonPosition[];
}

export interface TillLayout {
  tillId: number;
  layouts: CategoryLayout[]; // One layout per category
}

export interface LayoutState {
  isEditMode: boolean;
  currentCategoryId: number | 'favourites' | 'all';
  currentTillLayout: TillLayout;
  isDirty: boolean; // Has unsaved changes
}

// Re-export service types for convenience
export type { 
  VariantLayout, 
  SharedLayout, 
  SharedLayoutPosition,
  VariantLayoutPosition 
} from '../../services/layoutService';