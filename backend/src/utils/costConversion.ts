/**
 * Unit Conversion Utilities for Cost Calculations
 * Handles conversions between purchasing units and base units for profitability analytics
 */

/**
 * Defines a conversion factor between units
 */
export interface UnitConversion {
  fromUnit: string;
  toUnit: string;
  factor: number;
}

/**
 * Structure for a single purchasing unit configuration
 */
export interface PurchasingUnitConfig {
  unit: string;
  conversionFactor: number;
  displayName?: string;
}

/**
 * Structure for the purchasingUnits JSON field in StockItem
 */
export interface PurchasingUnitsJson {
  defaultPurchaseUnit?: string;
  units?: PurchasingUnitConfig[];
}

/**
 * Common conversion factors for typical units
 * All factors convert TO the base unit (e.g., 1 L = 1000 ml)
 */
export const COMMON_CONVERSIONS: UnitConversion[] = [
  // Volume - metric
  { fromUnit: 'L', toUnit: 'ml', factor: 1000 },
  { fromUnit: 'l', toUnit: 'ml', factor: 1000 },
  { fromUnit: 'liter', toUnit: 'ml', factor: 1000 },
  { fromUnit: 'litre', toUnit: 'ml', factor: 1000 },
  { fromUnit: 'ml', toUnit: 'ml', factor: 1 },
  { fromUnit: 'cl', toUnit: 'ml', factor: 10 },
  { fromUnit: 'dl', toUnit: 'ml', factor: 100 },

  // Volume - imperial
  { fromUnit: 'gal', toUnit: 'ml', factor: 3785.41 },
  { fromUnit: 'gallon', toUnit: 'ml', factor: 3785.41 },
  { fromUnit: 'qt', toUnit: 'ml', factor: 946.35 },
  { fromUnit: 'quart', toUnit: 'ml', factor: 946.35 },
  { fromUnit: 'pt', toUnit: 'ml', factor: 473.18 },
  { fromUnit: 'pint', toUnit: 'ml', factor: 473.18 },
  { fromUnit: 'fl oz', toUnit: 'ml', factor: 29.57 },
  { fromUnit: 'floz', toUnit: 'ml', factor: 29.57 },
  { fromUnit: 'oz', toUnit: 'ml', factor: 29.57 },

  // Weight - metric
  { fromUnit: 'kg', toUnit: 'g', factor: 1000 },
  { fromUnit: 'kilogram', toUnit: 'g', factor: 1000 },
  { fromUnit: 'g', toUnit: 'g', factor: 1 },
  { fromUnit: 'gram', toUnit: 'g', factor: 1 },
  { fromUnit: 'mg', toUnit: 'g', factor: 0.001 },

  // Weight - imperial
  { fromUnit: 'lb', toUnit: 'g', factor: 453.59 },
  { fromUnit: 'pound', toUnit: 'g', factor: 453.59 },
  { fromUnit: 'lbs', toUnit: 'g', factor: 453.59 },
  { fromUnit: 'oz wt', toUnit: 'g', factor: 28.35 },

  // Count units
  { fromUnit: 'unit', toUnit: 'unit', factor: 1 },
  { fromUnit: 'piece', toUnit: 'unit', factor: 1 },
  { fromUnit: 'pc', toUnit: 'unit', factor: 1 },
  { fromUnit: 'each', toUnit: 'unit', factor: 1 },
  { fromUnit: 'ea', toUnit: 'unit', factor: 1 },

  // Beverage industry common units
  { fromUnit: 'bottle', toUnit: 'unit', factor: 1 },
  { fromUnit: 'btl', toUnit: 'unit', factor: 1 },
  { fromUnit: 'can', toUnit: 'unit', factor: 1 },
  { fromUnit: 'case', toUnit: 'unit', factor: 24 },
  { fromUnit: 'cs', toUnit: 'unit', factor: 24 },
  { fromUnit: 'box', toUnit: 'unit', factor: 1 },
  { fromUnit: 'pack', toUnit: 'unit', factor: 6 },
  { fromUnit: 'keg', toUnit: 'ml', factor: 58673.9 },
  { fromUnit: 'barrel', toUnit: 'ml', factor: 117347 },

  // Serving sizes
  { fromUnit: 'serving', toUnit: 'unit', factor: 1 },
  { fromUnit: 'shot', toUnit: 'ml', factor: 44 },
  { fromUnit: 'glass', toUnit: 'ml', factor: 150 },
  { fromUnit: 'cup', toUnit: 'ml', factor: 236.59 },
  { fromUnit: 'tbsp', toUnit: 'ml', factor: 14.79 },
  { fromUnit: 'tsp', toUnit: 'ml', factor: 4.93 },
];

/**
 * Unit categories for determining compatible conversions
 */
const UNIT_CATEGORIES: Record<string, string[]> = {
  volume: ['ml', 'l', 'liter', 'litre', 'cl', 'dl', 'gal', 'gallon', 'qt', 'quart', 'pt', 'pint', 'fl oz', 'floz', 'oz', 'keg', 'barrel', 'shot', 'glass', 'cup', 'tbsp', 'tsp'],
  weight: ['g', 'kg', 'kilogram', 'mg', 'lb', 'pound', 'lbs', 'oz wt'],
  count: ['unit', 'piece', 'pc', 'each', 'ea', 'bottle', 'btl', 'can', 'box', 'serving'],
  packaged: ['case', 'cs', 'pack'],
};

/**
 * Normalizes a unit string to a standard form
 * @param unit - The unit string to normalize
 * @returns The normalized unit string
 */
function normalizeUnit(unit: string): string {
  const normalized = unit.toLowerCase().trim();

  const aliases: Record<string, string> = {
    'liter': 'l',
    'litre': 'l',
    'kilogram': 'kg',
    'gram': 'g',
    'pound': 'lb',
    'pounds': 'lb',
    'gallon': 'gal',
    'quart': 'qt',
    'pint': 'pt',
    'piece': 'unit',
    'pc': 'unit',
    'each': 'unit',
    'ea': 'unit',
    'bottle': 'btl',
    'case': 'cs',
  };

  return aliases[normalized] || normalized;
}

/**
 * Finds the conversion factor between two units
 * @param fromUnit - The source unit
 * @param toUnit - The target unit
 * @returns The conversion factor, or null if not found
 */
function findConversionFactor(fromUnit: string, toUnit: string): number | null {
  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (from === to) return 1;

  const directConversion = COMMON_CONVERSIONS.find(
    (c) => normalizeUnit(c.fromUnit) === from && normalizeUnit(c.toUnit) === to
  );
  if (directConversion) return directConversion.factor;

  const reverseConversion = COMMON_CONVERSIONS.find(
    (c) => normalizeUnit(c.fromUnit) === to && normalizeUnit(c.toUnit) === from
  );
  if (reverseConversion) return 1 / reverseConversion.factor;

  return null;
}

/**
 * Gets the category of a unit
 * @param unit - The unit to categorize
 * @returns The category name or undefined if not found
 */
function getUnitCategory(unit: string): string | undefined {
  const normalized = normalizeUnit(unit);
  for (const [category, units] of Object.entries(UNIT_CATEGORIES)) {
    if (units.some((u) => normalizeUnit(u) === normalized)) {
      return category;
    }
  }
  return undefined;
}

/**
 * Converts a quantity from one unit to another
 * @param quantity - The quantity to convert
 * @param fromUnit - The source unit
 * @param toUnit - The target unit
 * @param conversionFactor - Optional explicit conversion factor (overrides default conversions)
 * @returns The converted quantity, or null if conversion is not possible
 */
export function convertToBaseUnit(
  quantity: number,
  fromUnit: string,
  toUnit: string,
  conversionFactor?: number
): number | null {
  if (quantity < 0) return null;
  if (!fromUnit || !toUnit) return null;

  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (from === to) return quantity;

  if (conversionFactor !== undefined && conversionFactor > 0) {
    return quantity * conversionFactor;
  }

  const factor = findConversionFactor(from, to);
  if (factor !== null) {
    return quantity * factor;
  }

  const fromCategory = getUnitCategory(from);
  const toCategory = getUnitCategory(to);

  if (fromCategory !== toCategory) {
    return null;
  }

  if (to === 'unit' || to === 'ml' || to === 'g') {
    return quantity;
  }

  return null;
}

/**
 * Calculates the cost per base unit from purchase information
 * @param purchasePrice - The total purchase price
 * @param purchaseQuantity - The quantity purchased
 * @param purchaseUnit - The unit of the purchase
 * @param baseUnit - The base unit for tracking
 * @param conversionFactor - Optional explicit conversion factor
 * @returns The cost per base unit, or null if conversion is not possible
 */
export function calculateCostPerBaseUnit(
  purchasePrice: number,
  purchaseQuantity: number,
  purchaseUnit: string,
  baseUnit: string,
  conversionFactor?: number
): number | null {
  if (purchasePrice < 0 || purchaseQuantity <= 0) return null;

  const baseQuantity = convertToBaseUnit(
    purchaseQuantity,
    purchaseUnit,
    baseUnit,
    conversionFactor
  );

  if (baseQuantity === null || baseQuantity <= 0) return null;

  return purchasePrice / baseQuantity;
}

/**
 * Parses and validates the purchasingUnits JSON field
 * @param purchasingUnitsJson - The raw JSON value from the database
 * @returns The validated PurchasingUnitsJson object, or null if invalid
 */
export function parsePurchasingUnits(purchasingUnitsJson: unknown): PurchasingUnitsJson | null {
  if (purchasingUnitsJson === null || purchasingUnitsJson === undefined) {
    return null;
  }

  if (typeof purchasingUnitsJson !== 'object' || Array.isArray(purchasingUnitsJson)) {
    return null;
  }

  const json = purchasingUnitsJson as Record<string, unknown>;

  const result: PurchasingUnitsJson = {};

  if ('defaultPurchaseUnit' in json && typeof json.defaultPurchaseUnit === 'string') {
    result.defaultPurchaseUnit = json.defaultPurchaseUnit;
  }

  if ('units' in json && Array.isArray(json.units)) {
    result.units = [];
    for (const unit of json.units) {
      if (
        typeof unit === 'object' &&
        unit !== null &&
        'unit' in unit &&
        'conversionFactor' in unit &&
        typeof unit.unit === 'string' &&
        typeof unit.conversionFactor === 'number' &&
        unit.conversionFactor > 0
      ) {
        const config: PurchasingUnitConfig = {
          unit: unit.unit,
          conversionFactor: unit.conversionFactor,
        };
        if ('displayName' in unit && typeof unit.displayName === 'string') {
          config.displayName = unit.displayName;
        }
        result.units.push(config);
      }
    }
  }

  return result;
}

/**
 * Calculates the cost per serving
 * @param baseCost - The cost per base unit
 * @param servingSize - The size of a serving
 * @param servingUnit - The unit of the serving size
 * @param baseUnit - The base unit for tracking
 * @returns The cost per serving, or null if conversion is not possible
 */
export function getServingCost(
  baseCost: number,
  servingSize: number,
  servingUnit: string,
  baseUnit: string
): number | null {
  if (baseCost < 0 || servingSize <= 0) return null;

  const servingInBase = convertToBaseUnit(servingSize, servingUnit, baseUnit);

  if (servingInBase === null || servingInBase <= 0) return null;

  return baseCost * servingInBase;
}

/**
 * Gets the conversion factor from a PurchasingUnitsJson for a specific unit
 * @param purchasingUnits - The purchasing units configuration
 * @param unit - The unit to find a conversion for
 * @returns The conversion factor, or undefined if not found
 */
export function getConversionFactorFromConfig(
  purchasingUnits: PurchasingUnitsJson | null,
  unit: string
): number | undefined {
  if (!purchasingUnits?.units) return undefined;

  const normalizedUnit = normalizeUnit(unit);
  const unitConfig = purchasingUnits.units.find(
    (u) => normalizeUnit(u.unit) === normalizedUnit
  );

  return unitConfig?.conversionFactor;
}

/**
 * Validates if a conversion is possible between two units
 * @param fromUnit - The source unit
 * @param toUnit - The target unit
 * @returns True if conversion is possible, false otherwise
 */
export function isConversionPossible(fromUnit: string, toUnit: string): boolean {
  if (!fromUnit || !toUnit) return false;

  const from = normalizeUnit(fromUnit);
  const to = normalizeUnit(toUnit);

  if (from === to) return true;

  const factor = findConversionFactor(from, to);
  if (factor !== null) return true;

  const fromCategory = getUnitCategory(from);
  const toCategory = getUnitCategory(to);

  return fromCategory !== undefined && fromCategory === toCategory;
}

/**
 * Gets a human-readable description of a unit
 * @param unit - The unit to describe
 * @returns A description string
 */
export function getUnitDescription(unit: string): string {
  const normalized = normalizeUnit(unit);
  const descriptions: Record<string, string> = {
    'ml': 'milliliters',
    'l': 'liters',
    'g': 'grams',
    'kg': 'kilograms',
    'lb': 'pounds',
    'unit': 'units/pieces',
    'btl': 'bottles',
    'cs': 'cases (24 units)',
    'can': 'cans',
    'pack': 'packs (6 units)',
    'shot': 'shots (44ml)',
    'glass': 'glasses (150ml)',
    'cup': 'cups (237ml)',
  };

  return descriptions[normalized] || unit;
}
