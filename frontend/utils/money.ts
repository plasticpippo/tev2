import currency from 'currency.js';

/**
 * Validates if a value is a valid monetary number
 */
export function isMoneyValid(value: unknown): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Rounds to 2 decimal places
 */
export function roundMoney(value: number): number {
  if (!isMoneyValid(value)) return 0;
  return currency(value).value;
}

/**
 * Adds two monetary values safely (avoids floating-point errors)
 */
export function addMoney(a: number, b: number): number {
  if (!isMoneyValid(a) || !isMoneyValid(b)) return 0;
  return currency(a).add(b).value;
}

/**
 * Subtracts two monetary values safely
 */
export function subtractMoney(a: number, b: number): number {
  if (!isMoneyValid(a) || !isMoneyValid(b)) return 0;
  return currency(a).subtract(b).value;
}

/**
 * Multiplies monetary value by a factor
 */
export function multiplyMoney(value: number, multiplier: number): number {
  if (!isMoneyValid(value) || !isMoneyValid(multiplier)) return 0;
  return currency(value).multiply(multiplier).value;
}

/**
 * Divides monetary value by a divisor
 */
export function divideMoney(value: number, divisor: number): number {
  if (!isMoneyValid(value) || !isMoneyValid(divisor) || divisor === 0) return 0;
  return currency(value).divide(divisor).value;
}

/**
 * Formats a number as currency string
 */
export function formatMoney(value: number, locale: string = 'it-IT', currencyCode: string = 'EUR'): string {
  if (!isMoneyValid(value)) return '€0.00';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
  }).format(value);
}

/**
 * Distributes money into equal parts (for split payments)
 */
export function distributeMoney(value: number, parts: number): number[] {
  if (!isMoneyValid(value) || parts <= 0) return [];
  return currency(value).distribute(parts).map(c => c.value);
}

/**
 * Safe getter for nested object properties with default value
 */
export function getSafe<T>(obj: unknown, path: string, defaultValue: T): T {
  if (!obj || typeof obj !== 'object') return defaultValue;
  
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return defaultValue;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  return current !== undefined && current !== null ? (current as T) : defaultValue;
}
