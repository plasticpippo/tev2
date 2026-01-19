import type { Product, ProductVariant } from '../types';

// Product validation functions
export const validateProductName = (name: string): string | null => {
  if (!name || typeof name !== 'string') {
    return 'Product name is required';
  }
  
  if (name.trim().length === 0) {
    return 'Product name cannot be empty';
  }
  
  if (name.length > 255) {
    return 'Product name must be 255 characters or less';
  }
  
  return null;
};

export const validateCategoryId = (categoryId: number): string | null => {
  if (typeof categoryId !== 'number') {
    return 'Category ID must be a number';
  }
  
  if (categoryId <= 0) {
    return 'Category ID must be greater than 0';
  }
  
  return null;
};

export const validateProductPrice = (price: number): string | null => {
  if (typeof price !== 'number') {
    return 'Price must be a number';
  }
  
  if (price < 0) {
    return 'Price must be 0 or greater';
  }
  
  if (price > 999999) {
    return 'Price must be 999999 or less';
  }
  
  return null;
};

export const validateProductVariant = (variant: ProductVariant): string | null => {
  if (!variant.name || typeof variant.name !== 'string') {
    return 'Variant name is required';
  }
  
  if (variant.name.trim().length === 0) {
    return 'Variant name cannot be empty';
  }
  
  if (variant.name.length > 255) {
    return 'Variant name must be 255 characters or less';
  }
  
  const priceError = validateProductPrice(variant.price);
  if (priceError) {
    return priceError;
  }
  
  return null;
};

export const validateProduct = (product: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const nameError = validateProductName(product.name);
  if (nameError) {
    errors.push(nameError);
  }
  
  const categoryIdError = validateCategoryId(product.categoryId);
  if (categoryIdError) {
    errors.push(categoryIdError);
  }
  
  if (product.variants && Array.isArray(product.variants)) {
    for (let i = 0; i < product.variants.length; i++) {
      const variant = product.variants[i];
      const variantError = validateProductVariant(variant);
      if (variantError) {
        errors.push(`Variant ${i + 1}: ${variantError}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Till validation functions
export const validateTillName = (name: string): string | null => {
  if (!name || typeof name !== 'string') {
    return 'Till name is required';
  }
  
  if (name.trim().length === 0) {
    return 'Till name cannot be empty';
  }
  
  if (name.length > 100) {
    return 'Till name must be 100 characters or less';
  }
  
  return null;
};

export const validateTill = (till: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const nameError = validateTillName(till.name);
  if (nameError) {
    errors.push(nameError);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Category validation functions
export const validateCategoryName = (name: string): string | null => {
  if (!name || typeof name !== 'string') {
    return 'Category name is required';
  }
  
  if (name.trim().length === 0) {
    return 'Category name cannot be empty';
  }
  
  if (name.length > 255) {
    return 'Category name must be 255 characters or less';
  }
  
  return null;
};

export const validateCategory = (category: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const nameError = validateCategoryName(category.name);
  if (nameError) {
    errors.push(nameError);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Stock Item validation functions
export const validateStockItemName = (name: string): string | null => {
  if (!name || typeof name !== 'string') {
    return 'Stock item name is required';
  }
  
  if (name.trim().length === 0) {
    return 'Stock item name cannot be empty';
  }
  
  if (name.length > 255) {
    return 'Stock item name must be 255 characters or less';
  }
  
  return null;
};

export const validateStockItemQuantity = (quantity: number): string | null => {
  if (typeof quantity !== 'number') {
    return 'Quantity must be a number';
  }
  
  if (quantity < 0) {
    return 'Quantity must be 0 or greater';
  }
  
  return null;
};

export const validateStockItemBaseUnit = (baseUnit: string): string | null => {
  if (!baseUnit || typeof baseUnit !== 'string') {
    return 'Base unit is required';
  }
  
  if (baseUnit.trim().length === 0) {
    return 'Base unit cannot be empty';
  }
  
  if (baseUnit.length > 50) {
    return 'Base unit must be 50 characters or less';
  }
  
  return null;
};

export const validatePurchasingUnit = (unit: any): string | null => {
  if (!unit.name || typeof unit.name !== 'string') {
    return 'Purchasing unit name is required';
  }
  
  if (unit.name.trim().length === 0) {
    return 'Purchasing unit name cannot be empty';
  }
  
  if (unit.name.length > 50) {
    return 'Purchasing unit name must be 50 characters or less';
  }
  
  if (typeof unit.multiplier !== 'number' || unit.multiplier <= 0) {
    return 'Multiplier must be a number greater than 0';
  }
  
  return null;
};

export const validateStockItem = (stockItem: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const nameError = validateStockItemName(stockItem.name);
  if (nameError) {
    errors.push(nameError);
  }
  
  const quantityError = validateStockItemQuantity(stockItem.quantity);
  if (quantityError) {
    errors.push(quantityError);
  }
  
  const baseUnitError = validateStockItemBaseUnit(stockItem.baseUnit);
  if (baseUnitError) {
    errors.push(baseUnitError);
  }
  
  if (stockItem.purchasingUnits && Array.isArray(stockItem.purchasingUnits)) {
    for (let i = 0; i < stockItem.purchasingUnits.length; i++) {
      const unit = stockItem.purchasingUnits[i];
      const unitError = validatePurchasingUnit(unit);
      if (unitError) {
        errors.push(`Purchasing Unit ${i + 1}: ${unitError}`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};