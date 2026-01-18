import { OrderItem } from '../types';

/**
 * Validates an order item based on business rules and data integrity checks
 * @param orderItem - The order item to validate
 * @returns Object containing validity status and array of error messages
 */
export const validateOrderItem = (orderItem: Partial<OrderItem>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check required fields according to the OrderItem interface
  if (orderItem.id === undefined || orderItem.id === null) {
    errors.push('ID is required');
  }

  if (orderItem.variantId === undefined || orderItem.variantId === null || orderItem.variantId < 0) {
    errors.push('Variant ID is required and must be a non-negative number');
  }

  if (orderItem.productId === undefined || orderItem.productId === null || orderItem.productId < 0) {
    errors.push('Product ID is required and must be a non-negative number');
  }

  if (!orderItem.name || typeof orderItem.name !== 'string' || orderItem.name.trim() === '') {
    errors.push('Name is required and must be a non-empty string');
  }

  if (orderItem.price === undefined || orderItem.price === null || orderItem.price < 0) {
    errors.push('Price is required and must be a non-negative number');
  }

  if (orderItem.quantity === undefined || orderItem.quantity === null || orderItem.quantity <= 0) {
    errors.push('Quantity is required and must be a positive number greater than 0');
  }

  if (orderItem.effectiveTaxRate === undefined || orderItem.effectiveTaxRate === null || 
      orderItem.effectiveTaxRate < 0 || orderItem.effectiveTaxRate > 1) {
    errors.push('Effective tax rate is required and must be between 0 and 1 (e.g., 0.19 for 19%)');
  }

  // Validate numeric fields are finite
  if (orderItem.price !== undefined && !isFinite(orderItem.price)) {
    errors.push('Price must be a finite number');
  }

  if (orderItem.quantity !== undefined && !isFinite(orderItem.quantity)) {
    errors.push('Quantity must be a finite number');
  }

  if (orderItem.effectiveTaxRate !== undefined && !isFinite(orderItem.effectiveTaxRate)) {
    errors.push('Effective tax rate must be a finite number');
  }

  // Validate quantity precision (should not have excessive decimal places)
  if (orderItem.quantity !== undefined && Number.isFinite(orderItem.quantity)) {
    const quantityStr = orderItem.quantity.toString();
    const decimalPlaces = quantityStr.includes('.') ? quantityStr.split('.')[1].length : 0;
    
    // Allow up to 3 decimal places for quantities (for items that can be measured precisely)
    if (decimalPlaces > 3) {
      errors.push('Quantity cannot have more than 3 decimal places');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validates multiple order items in an order
 * @param orderItems - Array of order items to validate
 * @returns Object containing validity status and array of error messages
 */
export const validateOrderItems = (orderItems: Partial<OrderItem>[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!Array.isArray(orderItems)) {
    return {
      isValid: false,
      errors: ['Order items must be an array']
    };
  }

  if (orderItems.length === 0) {
    return {
      isValid: false,
      errors: ['Order must contain at least one item']
    };
  }

  for (let i = 0; i < orderItems.length; i++) {
    const itemValidation = validateOrderItem(orderItems[i]);
    
    if (!itemValidation.isValid) {
      // Prefix errors with item index for clarity
      const itemErrors = itemValidation.errors.map(error => `Item ${i + 1}: ${error}`);
      errors.push(...itemErrors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};