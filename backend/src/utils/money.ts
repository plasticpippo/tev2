import currency = require('currency.js');

/**
 * Default currency configuration
 */
const DEFAULT_CURRENCY = {
  symbol: '€',
  decimal: '.',
  separator: ',',
  precision: 2,
};

/**
 * Creates a currency.js instance with default settings
 */
function createMoney(value: number): currency {
  return currency(value, DEFAULT_CURRENCY);
}

/**
 * Checks if a value is a valid monetary number
 * @param value - The value to validate
 * @returns True if the value is a valid number (not NaN, Infinity, null, or undefined)
 */
export function isMoneyValid(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  const num = Number(value);
  return !isNaN(num) && isFinite(num);
}

/**
 * Rounds a monetary value to 2 decimal places
 * @param value - The value to round
 * @returns The rounded value to 2 decimal places
 * @throws Error if value is not a valid monetary number
 */
export function roundMoney(value: number): number {
  if (!isMoneyValid(value)) {
    throw new Error('Invalid monetary value');
  }
  return createMoney(value).value;
}

/**
 * Adds two monetary values safely, avoiding floating-point errors
 * @param a - First monetary value
 * @param b - Second monetary value
 * @returns The sum of the two values
 * @throws Error if either value is not a valid monetary number
 */
export function addMoney(a: number, b: number): number {
  if (!isMoneyValid(a)) {
    throw new Error('Invalid first monetary value');
  }
  if (!isMoneyValid(b)) {
    throw new Error('Invalid second monetary value');
  }
  return createMoney(a).add(b).value;
}

/**
 * Subtracts one monetary value from another safely, avoiding floating-point errors
 * @param a - First monetary value (minuend)
 * @param b - Second monetary value (subtrahend)
 * @returns The difference of the two values
 * @throws Error if either value is not a valid monetary number
 */
export function subtractMoney(a: number, b: number): number {
  if (!isMoneyValid(a)) {
    throw new Error('Invalid first monetary value');
  }
  if (!isMoneyValid(b)) {
    throw new Error('Invalid second monetary value');
  }
  return createMoney(a).subtract(b).value;
}

/**
 * Multiplies a monetary value by a multiplier safely
 * @param value - The monetary value to multiply
 * @param multiplier - The multiplier
 * @returns The product of the multiplication
 * @throws Error if either value is not a valid monetary number
 */
export function multiplyMoney(value: number, multiplier: number): number {
  if (!isMoneyValid(value)) {
    throw new Error('Invalid monetary value');
  }
  if (!isMoneyValid(multiplier)) {
    throw new Error('Invalid multiplier');
  }
  return createMoney(value).multiply(multiplier).value;
}

/**
 * Divides a monetary value by a divisor safely
 * @param value - The monetary value to divide
 * @param divisor - The divisor
 * @returns The quotient of the division
 * @throws Error if either value is not a valid monetary number or if divisor is zero
 */
export function divideMoney(value: number, divisor: number): number {
  if (!isMoneyValid(value)) {
    throw new Error('Invalid monetary value');
  }
  if (!isMoneyValid(divisor)) {
    throw new Error('Invalid divisor');
  }
  if (divisor === 0) {
    throw new Error('Division by zero is not allowed');
  }
  return createMoney(value).divide(divisor).value;
}

/**
 * Formats a monetary value as a currency string
 * @param value - The monetary value to format
 * @param locale - Optional locale string (defaults to 'en-US')
 * @returns The formatted currency string
 * @throws Error if value is not a valid monetary number
 */
export function formatMoney(value: number, locale?: string): string {
  if (!isMoneyValid(value)) {
    throw new Error('Invalid monetary value');
  }
  
  const safeLocale = locale || 'en-US';
  
  // Use Intl.NumberFormat for locale-aware formatting with Euro symbol
  const formatter = new Intl.NumberFormat(safeLocale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return formatter.format(value);
}

/**
 * Converts a Prisma Decimal value to a JavaScript number
 * Handles various Decimal representations from Prisma queries
 * @param value - The value to convert (can be Decimal object, number, null, or undefined)
 * @returns The numeric value, or 0 for null/undefined
 */
export function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  // Handle Prisma Decimal object with 'value' property
  if (typeof value === 'object' && value !== null && 'value' in value) {
    return Number((value as { value: unknown }).value);
  }
  // Handle Decimal objects with toNumber method
  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}

/**
 * Distributes a monetary value into equal parts (useful for split payments)
 * Distributes the remainder to ensure the total equals the original value
 * @param value - The total monetary value to distribute
 * @param parts - The number of parts to split into
 * @returns An array of values that sum up to the original value
 * @throws Error if value is not a valid monetary number or parts is invalid
 */
export function distributeMoney(value: number, parts: number): number[] {
  if (!isMoneyValid(value)) {
    throw new Error('Invalid monetary value');
  }
  if (!Number.isInteger(parts) || parts <= 0) {
    throw new Error('Parts must be a positive integer');
  }
  
  // Use currency.js to handle the distribution with proper precision
  const total = createMoney(value);
  const partValue = total.divide(parts);
  const result: number[] = [];
  
  // Calculate the base value and remainder
  const baseValue = partValue.value;
  const remainder = createMoney(value).subtract(createMoney(baseValue).multiply(parts)).value;
  
  // Distribute values, giving the remainder to the first parts
  for (let i = 0; i < parts; i++) {
    // Add 0.01 to each of the first 'remainder / 0.01' parts to account for rounding
    if (i < Math.round(remainder / 0.01)) {
      result.push(createMoney(baseValue).add(0.01).value);
    } else {
      result.push(baseValue);
    }
  }
  
  // Verify the sum matches the original value
  const sum = result.reduce((acc, val) => createMoney(acc).add(val).value, 0);
  if (createMoney(sum).subtract(value).value !== 0) {
    // If there's still a rounding discrepancy, adjust the first element
    result[0] = createMoney(result[0]).add(createMoney(value).subtract(sum).value).value;
  }
  
  return result;
}

// ==================================================================
// HIGH-PRECISION COST CALCULATION UTILITIES
// Precision: 6 decimal places for unit costs and intermediate values
// ==================================================================

const COST_PRECISION = 6;
const COST_CURRENCY_CONFIG: Parameters<typeof currency>[1] = {
  symbol: '',
  decimal: '.',
  separator: ',',
  precision: COST_PRECISION,
};

/**
 * Creates a currency.js instance configured for 6dp cost calculations
 */
function createCostMoney(value: number): currency {
  return currency(value, COST_CURRENCY_CONFIG);
}

/**
 * Rounds a number to 6 decimal places for cost calculations
 * @param value - The value to round
 * @returns The rounded value to 6 decimal places, or 0 if invalid
 */
export function roundCost(value: number): number {
  if (!isMoneyValid(value)) return 0;
  return createCostMoney(value).value;
}

/**
 * Multiplies two numbers with 6 decimal precision
 * @param value - The cost value to multiply
 * @param multiplier - The multiplier
 * @returns The product rounded to 6 decimal places, or 0 if either input is invalid
 */
export function multiplyCost(value: number, multiplier: number): number {
  if (!isMoneyValid(value) || !isMoneyValid(multiplier)) return 0;
  return createCostMoney(value).multiply(multiplier).value;
}

/**
 * Adds two numbers with 6 decimal precision
 * @param a - First cost value
 * @param b - Second cost value
 * @returns The sum rounded to 6 decimal places, or 0 if either input is invalid
 */
export function addCost(a: number, b: number): number {
  if (!isMoneyValid(a) || !isMoneyValid(b)) return 0;
  return createCostMoney(a).add(b).value;
}

/**
 * Subtracts two numbers with 6 decimal precision
 * @param a - First cost value (minuend)
 * @param b - Second cost value (subtrahend)
 * @returns The difference rounded to 6 decimal places, or 0 if either input is invalid
 */
export function subtractCost(a: number, b: number): number {
  if (!isMoneyValid(a) || !isMoneyValid(b)) return 0;
  return createCostMoney(a).subtract(b).value;
}

/**
 * Divides two numbers with 6 decimal precision
 * @param value - The cost value to divide
 * @param divisor - The divisor
 * @returns The quotient rounded to 6 decimal places, or 0 if either input is invalid or divisor is zero
 */
export function divideCost(value: number, divisor: number): number {
  if (!isMoneyValid(value) || !isMoneyValid(divisor) || divisor === 0) return 0;
  return createCostMoney(value).divide(divisor).value;
}

/**
 * Formats a cost value with specified decimal places (default 6)
 * Returns a plain number string without currency symbol
 * @param value - The cost value to format
 * @param decimals - Number of decimal places (default 6)
 * @returns The formatted string, e.g. "0.123456"
 */
export function formatCost(value: number, decimals: number = 6): string {
  if (!isMoneyValid(value)) return '0.' + '0'.repeat(decimals);
  return value.toFixed(decimals);
}
