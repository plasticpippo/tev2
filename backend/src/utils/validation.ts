import type { Product, ProductVariant } from '../types';
import type { Request } from 'express';
import { logWarn } from './logger';

/**
 * Translation helper type for i18n
 */
type TranslateFunction = (key: string, options?: any) => string;

/**
 * Get translation function from request or return a fallback
 */
const getTranslator = (req?: Request): TranslateFunction => {
  if (req && typeof (req as any).t === 'function') {
    return (key: string, options?: any) => (req as any).t(key, options) || key;
  }
  // Fallback: return the key's last segment as a simple message
  return (key: string, options?: any) => {
    const parts = key.split('.');
    return parts[parts.length - 1] || key;
  };
};

// Product validation functions
export const validateProductName = (name: string, t?: TranslateFunction): string | null => {
  const translate = t || ((key: string) => key.split('.').pop() || key);
  
  if (!name || typeof name !== 'string') {
    return translate('errors:validation.required');
  }
  
  if (name.trim().length === 0) {
    return translate('errors:validation.required');
  }
  
  if (name.length > 255) {
    return translate('errors:validation.outOfRange');
  }
  
  return null;
};

export const validateCategoryId = (categoryId: number, t?: TranslateFunction): string | null => {
  const translate = t || ((key: string) => key.split('.').pop() || key);
  
  if (typeof categoryId !== 'number') {
    return translate('errors:validation.invalidValue');
  }
  
  if (categoryId <= 0) {
    return translate('errors:validation.invalidValue');
  }
  
  return null;
};

export const validateProductPrice = (price: number, t?: TranslateFunction): string | null => {
  const translate = t || ((key: string) => key.split('.').pop() || key);
  
  if (typeof price !== 'number') {
    return translate('errors:products.invalidPrice');
  }
  
  if (price < 0) {
    return translate('errors:products.invalidPrice');
  }
  
  if (price > 999999) {
    return translate('errors:products.invalidPrice');
  }
  
  return null;
};

export const validateProductVariant = (variant: ProductVariant, t?: TranslateFunction): string | null => {
  const translate = t || ((key: string) => key.split('.').pop() || key);
  
  if (!variant.name || typeof variant.name !== 'string') {
    return translate('errors:validation.required');
  }
  
  if (variant.name.trim().length === 0) {
    return translate('errors:validation.required');
  }
  
  if (variant.name.length > 255) {
    return translate('errors:validation.outOfRange');
  }
  
  const priceError = validateProductPrice(variant.price, t);
  if (priceError) {
    return priceError;
  }
  
  return null;
};

export const validateProduct = (product: any, t?: TranslateFunction): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const nameError = validateProductName(product.name, t);
  if (nameError) {
    errors.push(nameError);
  }
  
  const categoryIdError = validateCategoryId(product.categoryId, t);
  if (categoryIdError) {
    errors.push(categoryIdError);
  }
  
  if (product.variants && Array.isArray(product.variants)) {
    for (let i = 0; i < product.variants.length; i++) {
      const variant = product.variants[i];
      const variantError = validateProductVariant(variant, t);
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
export const validateTillName = (name: string, t?: TranslateFunction): string | null => {
  const translate = t || ((key: string) => key.split('.').pop() || key);
  
  if (!name || typeof name !== 'string') {
    return translate('errors:validation.required');
  }
  
  if (name.trim().length === 0) {
    return translate('errors:validation.required');
  }
  
  if (name.length > 100) {
    return translate('errors:validation.outOfRange');
  }
  
  return null;
};

export const validateTill = (till: any, t?: TranslateFunction): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const nameError = validateTillName(till.name, t);
  if (nameError) {
    errors.push(nameError);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Category validation functions
export const validateCategoryName = (name: string, t?: TranslateFunction): string | null => {
  const translate = t || ((key: string) => key.split('.').pop() || key);
  
  if (!name || typeof name !== 'string') {
    return translate('errors:validation.required');
  }
  
  if (name.trim().length === 0) {
    return translate('errors:validation.required');
  }
  
  if (name.length > 255) {
    return translate('errors:validation.outOfRange');
  }
  
  return null;
};

export const validateCategory = (category: any, t?: TranslateFunction): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const nameError = validateCategoryName(category.name, t);
  if (nameError) {
    errors.push(nameError);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Stock Item validation functions
export const validateStockItemName = (name: string, t?: TranslateFunction): string | null => {
  const translate = t || ((key: string) => key.split('.').pop() || key);
  
  if (!name || typeof name !== 'string') {
    return translate('errors:validation.required');
  }
  
  if (name.trim().length === 0) {
    return translate('errors:validation.required');
  }
  
  if (name.length > 255) {
    return translate('errors:validation.outOfRange');
  }
  
  return null;
};

export const validateStockItemQuantity = (quantity: number, t?: TranslateFunction): string | null => {
  const translate = t || ((key: string) => key.split('.').pop() || key);
  
  if (typeof quantity !== 'number') {
    return translate('errors:stockItems.invalidQuantity');
  }
  
  if (quantity < 0) {
    return translate('errors:stockItems.invalidQuantity');
  }
  
  return null;
};

export const validateStockItemBaseUnit = (baseUnit: string, t?: TranslateFunction): string | null => {
  const translate = t || ((key: string) => key.split('.').pop() || key);
  
  if (!baseUnit || typeof baseUnit !== 'string') {
    return translate('errors:validation.required');
  }
  
  if (baseUnit.trim().length === 0) {
    return translate('errors:validation.required');
  }
  
  if (baseUnit.length > 50) {
    return translate('errors:validation.outOfRange');
  }
  
  return null;
};

export const validatePurchasingUnit = (unit: any, t?: TranslateFunction): string | null => {
  const translate = t || ((key: string) => key.split('.').pop() || key);
  
  if (!unit.name || typeof unit.name !== 'string') {
    return translate('errors:validation.required');
  }
  
  if (unit.name.trim().length === 0) {
    return translate('errors:validation.required');
  }
  
  if (unit.name.length > 50) {
    return translate('errors:validation.outOfRange');
  }
  
  if (typeof unit.multiplier !== 'number' || unit.multiplier <= 0) {
    return translate('errors:validation.invalidValue');
  }
  
  return null;
};

export const validateStockItem = (stockItem: any, t?: TranslateFunction): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const nameError = validateStockItemName(stockItem.name, t);
  if (nameError) {
    errors.push(nameError);
  }
  
  const quantityError = validateStockItemQuantity(stockItem.quantity, t);
  if (quantityError) {
    errors.push(quantityError);
  }
  
  const baseUnitError = validateStockItemBaseUnit(stockItem.baseUnit, t);
  if (baseUnitError) {
    errors.push(baseUnitError);
  }
  
  if (stockItem.purchasingUnits && Array.isArray(stockItem.purchasingUnits)) {
    for (let i = 0; i < stockItem.purchasingUnits.length; i++) {
      const unit = stockItem.purchasingUnits[i];
      const unitError = validatePurchasingUnit(unit, t);
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

// Analytics validation functions
export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  productId?: number;
  categoryId?: number;
  sortBy?: 'revenue' | 'quantity' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  includeAllProducts?: boolean;
}

// Room validation functions
export const validateRoomName = (name: string, existingNames: string[] = [], t?: TranslateFunction): string | null => {
  const translate = t || ((key: string) => key.split('.').pop() || key);
  
  if (!name || typeof name !== 'string') {
    return translate('errors:validation.required');
  }

  if (name.trim().length === 0) {
    return translate('errors:validation.required');
  }

  if (name.length > 100) {
    return translate('errors:validation.outOfRange');
  }

  if (existingNames.some(n => n.toLowerCase() === name.trim().toLowerCase() && n !== name)) {
    return translate('errors:validation.duplicate');
  }

  // Check for special characters that might cause issues
  if (!/^[a-zA-Z0-9\s\-_(),.'&]+$/.test(name)) {
    return translate('errors:validation.invalidFormat');
  }

  return null;
};

export const validateRoomDescription = (description: string, t?: TranslateFunction): string | null => {
  const translate = t || ((key: string) => key.split('.').pop() || key);
  
  if (description && description.length > 500) {
    return translate('errors:validation.outOfRange');
  }

  return null;
};

export const validateRoom = (room: any, allRooms: any[] = [], t?: TranslateFunction): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  const nameError = validateRoomName(room.name, allRooms.filter(r => r.id !== room.id).map(r => r.name), t);
  if (nameError) {
    errors.push(nameError);
  }

  const descriptionError = validateRoomDescription(room.description || '', t);
  if (descriptionError) {
    errors.push(descriptionError);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate datetime format YYYY-MM-DDTHH:MM
export const isValidDateTime = (value: string): boolean => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  // Accept both datetime format (YYYY-MM-DDTHH:MM) and date-only format (YYYY-MM-DD)
  const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
  
  if (!dateTimeRegex.test(value) && !dateOnlyRegex.test(value)) {
    return false;
  }
  
  // If it's a full datetime, validate the date and time components
  if (dateTimeRegex.test(value)) {
    const [datePart, timePart] = value.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    
    // Check date validity
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      return false;
    }
    
    // Check time validity (24-hour format)
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return false;
    }
  }
  
  return true;
};

// Validate time format HH:MM (24-hour)
export const isValidTime = (value: string): boolean => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  
  const timeRegex = /^\d{2}:\d{2}$/;
  if (!timeRegex.test(value)) {
    return false;
  }
  
  const [hours, minutes] = value.split(':').map(Number);
  
  // Check time validity (24-hour format)
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return false;
  }
  
  return true;
};

export const validateAnalyticsParams = (query: any): AnalyticsParams => {
  const params: AnalyticsParams = {};

  // Validate date parameters
  if (query.startDate) {
    const startDate = new Date(query.startDate);
    if (!isNaN(startDate.getTime())) {
      params.startDate = query.startDate;
    }
  }

  if (query.endDate) {
    const endDate = new Date(query.endDate);
    if (!isNaN(endDate.getTime())) {
      params.endDate = query.endDate;
    }
  }

  // Validate time parameters (datetime format YYYY-MM-DDTHH:MM)
  if (query.startTime) {
    if (isValidDateTime(query.startTime)) {
      params.startTime = query.startTime;
    }
  }

  if (query.endTime) {
    if (isValidDateTime(query.endTime)) {
      params.endTime = query.endTime;
    }
  }

    // Validate that endTime is after startTime if both are provided
  if (params.startTime && params.endTime) {
    const startDateTime = new Date(params.startTime.replace('T', ' '));
    const endDateTime = new Date(params.endTime.replace('T', ' '));
    
    // If both are date-only, append time for proper comparison
    if (!params.startTime.includes('T') && !params.endTime.includes('T')) {
      // Both are date-only, which is valid for date filtering
    } else if (endDateTime <= startDateTime) {
      // Clear both if endTime is not after startTime (for datetime comparisons)
      logWarn('Analytics time filter validation: endTime is not after startTime, clearing time filters', {
        startTime: params.startTime,
        endTime: params.endTime
      });
      delete params.startTime;
      delete params.endTime;
    }
  }

  // Validate numeric parameters
  if (query.productId) {
    const productId = parseInt(query.productId, 10);
    if (!isNaN(productId) && productId > 0) {
      params.productId = productId;
    }
  }

  if (query.categoryId) {
    const categoryId = parseInt(query.categoryId, 10);
    if (!isNaN(categoryId) && categoryId > 0) {
      params.categoryId = categoryId;
    }
  }

  // Validate sorting parameters
  if (query.sortBy && ['revenue', 'quantity', 'name'].includes(query.sortBy)) {
    params.sortBy = query.sortBy;
  }

  if (query.sortOrder && ['asc', 'desc'].includes(query.sortOrder)) {
    params.sortOrder = query.sortOrder;
  }

  // Validate pagination parameters
  if (query.page) {
    const page = parseInt(query.page, 10);
    if (!isNaN(page) && page > 0) {
      params.page = page;
    }
  }

  if (query.limit) {
    const limit = parseInt(query.limit, 10);
    if (!isNaN(limit) && limit > 0 && limit <= 100) {
      params.limit = limit;
    }
  }

  // Validate boolean parameters
  if (query.includeAllProducts !== undefined) {
    params.includeAllProducts = query.includeAllProducts === 'true' || query.includeAllProducts === true;
  }

  return params;
};