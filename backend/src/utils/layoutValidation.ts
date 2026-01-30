// Validation functions for layout-related entities

export const validateLayoutName = (name: string): string | null => {
  if (!name || typeof name !== 'string') {
    return 'Layout name is required';
  }
  
  if (name.trim().length === 0) {
    return 'Layout name cannot be empty';
  }
  
  if (name.length > 255) {
    return 'Layout name must be 255 characters or less';
  }
  
  return null;
};

export const validateCategoryId = (categoryId: number): string | null => {
  if (typeof categoryId !== 'number') {
    return 'Category ID must be a number';
  }
  
  // Allow -1 for Favourites pseudo-category, and positive values for real categories
  if (categoryId !== -1 && categoryId <= 0) {
    return 'Category ID must be greater than 0 or -1 for Favourites';
  }
  
  return null;
};

export const validateTillId = (tillId: number): string | null => {
  if (typeof tillId !== 'number') {
    return 'Till ID must be a number';
  }
  
  if (tillId <= 0) {
    return 'Till ID must be greater than 0';
  }
  
  return null;
};

export const validateVariantId = (variantId: number): string | null => {
  if (typeof variantId !== 'number') {
    return 'Variant ID must be a number';
  }
  
  if (variantId <= 0) {
    return 'Variant ID must be greater than 0';
  }
  
  return null;
};

export const validateGridColumn = (column: number): string | null => {
  if (typeof column !== 'number') {
    return 'Grid column must be a number';
  }
  
  if (column < 1 || column > 4) {
    return 'Grid column must be between 1 and 4';
  }
  
  return null;
};

export const validateGridRow = (row: number): string | null => {
  if (typeof row !== 'number') {
    return 'Grid row must be a number';
  }
  
  if (row < 1) {
    return 'Grid row must be greater than 0';
  }
  
  return null;
};

export const validateVariantLayout = (layout: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const categoryIdError = validateCategoryId(layout.categoryId);
  if (categoryIdError) {
    errors.push(categoryIdError);
  }
  
  const variantIdError = validateVariantId(layout.variantId);
  if (variantIdError) {
    errors.push(variantIdError);
  }
  
  const gridColumnError = validateGridColumn(layout.gridColumn);
  if (gridColumnError) {
    errors.push(gridColumnError);
  }
  
  const gridRowError = validateGridRow(layout.gridRow);
  if (gridRowError) {
    errors.push(gridRowError);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSharedLayout = (layout: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const nameError = validateLayoutName(layout.name);
  if (nameError) {
    errors.push(nameError);
  }
  
  const categoryIdError = validateCategoryId(layout.categoryId);
  if (categoryIdError) {
    errors.push(categoryIdError);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSharedLayoutPosition = (position: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const variantIdError = validateVariantId(position.variantId);
  if (variantIdError) {
    errors.push(variantIdError);
  }
  
  const gridColumnError = validateGridColumn(position.gridColumn);
  if (gridColumnError) {
    errors.push(gridColumnError);
  }
  
  const gridRowError = validateGridRow(position.gridRow);
  if (gridRowError) {
    errors.push(gridRowError);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};