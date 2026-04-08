import {
  convertToBaseUnit,
  calculateCostPerBaseUnit,
  parsePurchasingUnits,
  getServingCost,
  getConversionFactorFromConfig,
  isConversionPossible,
  getUnitDescription,
  COMMON_CONVERSIONS,
  PurchasingUnitsJson,
} from '../utils/costConversion';

describe('costConversion utilities', () => {
  describe('convertToBaseUnit', () => {
    describe('volume conversions (ml->L)', () => {
      it('should convert ml to L correctly', () => {
        expect(convertToBaseUnit(1000, 'ml', 'L')).toBe(1);
        expect(convertToBaseUnit(500, 'ml', 'L')).toBe(0.5);
        expect(convertToBaseUnit(2500, 'ml', 'L')).toBe(2.5);
      });

      it('should convert L to ml correctly', () => {
        expect(convertToBaseUnit(1, 'L', 'ml')).toBe(1000);
        expect(convertToBaseUnit(2.5, 'L', 'ml')).toBe(2500);
        expect(convertToBaseUnit(0.5, 'L', 'ml')).toBe(500);
      });

      it('should handle liter/litre aliases', () => {
        expect(convertToBaseUnit(1, 'liter', 'ml')).toBe(1000);
        expect(convertToBaseUnit(1, 'litre', 'ml')).toBe(1000);
      });

      it('should handle cl and dl conversions', () => {
        expect(convertToBaseUnit(1, 'cl', 'ml')).toBe(10);
        expect(convertToBaseUnit(1, 'dl', 'ml')).toBe(100);
      });
    });

    describe('weight conversions (g->kg)', () => {
      it('should convert g to kg correctly', () => {
        expect(convertToBaseUnit(1000, 'g', 'kg')).toBe(1);
        expect(convertToBaseUnit(500, 'g', 'kg')).toBe(0.5);
        expect(convertToBaseUnit(2500, 'g', 'kg')).toBe(2.5);
      });

      it('should convert kg to g correctly', () => {
        expect(convertToBaseUnit(1, 'kg', 'g')).toBe(1000);
        expect(convertToBaseUnit(2.5, 'kg', 'g')).toBe(2500);
      });

      it('should handle mg conversions', () => {
        expect(convertToBaseUnit(1000, 'mg', 'g')).toBe(1);
        expect(convertToBaseUnit(500, 'mg', 'g')).toBe(0.5);
      });

      it('should handle pound conversions', () => {
        expect(convertToBaseUnit(1, 'lb', 'g')).toBeCloseTo(453.59, 1);
        expect(convertToBaseUnit(1, 'pound', 'g')).toBeCloseTo(453.59, 1);
        expect(convertToBaseUnit(1, 'lbs', 'g')).toBeCloseTo(453.59, 1);
      });
    });

    describe('count conversions (case->unit)', () => {
      it('should convert case to unit correctly (24 units per case)', () => {
        expect(convertToBaseUnit(1, 'case', 'unit')).toBe(24);
        expect(convertToBaseUnit(2, 'case', 'unit')).toBe(48);
        expect(convertToBaseUnit(0.5, 'case', 'unit')).toBe(12);
      });

      it('should convert cs (case alias) to unit', () => {
        expect(convertToBaseUnit(1, 'cs', 'unit')).toBe(24);
      });

      it('should convert pack to unit (6 units per pack)', () => {
        expect(convertToBaseUnit(1, 'pack', 'unit')).toBe(6);
        expect(convertToBaseUnit(2, 'pack', 'unit')).toBe(12);
      });

      it('should handle unit aliases', () => {
        expect(convertToBaseUnit(10, 'piece', 'unit')).toBe(10);
        expect(convertToBaseUnit(10, 'pc', 'unit')).toBe(10);
        expect(convertToBaseUnit(10, 'each', 'unit')).toBe(10);
        expect(convertToBaseUnit(10, 'ea', 'unit')).toBe(10);
        expect(convertToBaseUnit(10, 'bottle', 'unit')).toBe(10);
        expect(convertToBaseUnit(10, 'btl', 'unit')).toBe(10);
        expect(convertToBaseUnit(10, 'can', 'unit')).toBe(10);
      });
    });

    describe('imperial volume conversions', () => {
      it('should convert gallons to ml', () => {
        expect(convertToBaseUnit(1, 'gal', 'ml')).toBeCloseTo(3785.41, 0);
        expect(convertToBaseUnit(1, 'gallon', 'ml')).toBeCloseTo(3785.41, 0);
      });

      it('should convert quarts to ml', () => {
        expect(convertToBaseUnit(1, 'qt', 'ml')).toBeCloseTo(946.35, 0);
        expect(convertToBaseUnit(1, 'quart', 'ml')).toBeCloseTo(946.35, 0);
      });

      it('should convert pints to ml', () => {
        expect(convertToBaseUnit(1, 'pt', 'ml')).toBeCloseTo(473.18, 0);
        expect(convertToBaseUnit(1, 'pint', 'ml')).toBeCloseTo(473.18, 0);
      });

      it('should convert fl oz to ml', () => {
        expect(convertToBaseUnit(1, 'fl oz', 'ml')).toBeCloseTo(29.57, 1);
        expect(convertToBaseUnit(1, 'floz', 'ml')).toBeCloseTo(29.57, 1);
      });
    });

    describe('serving size conversions', () => {
      it('should convert shots to ml (44ml per shot)', () => {
        expect(convertToBaseUnit(1, 'shot', 'ml')).toBe(44);
        expect(convertToBaseUnit(2, 'shot', 'ml')).toBe(88);
      });

      it('should convert glasses to ml (150ml per glass)', () => {
        expect(convertToBaseUnit(1, 'glass', 'ml')).toBe(150);
        expect(convertToBaseUnit(2, 'glass', 'ml')).toBe(300);
      });

      it('should convert cups to ml', () => {
        expect(convertToBaseUnit(1, 'cup', 'ml')).toBeCloseTo(236.59, 0);
      });

      it('should convert tablespoons to ml', () => {
        expect(convertToBaseUnit(1, 'tbsp', 'ml')).toBeCloseTo(14.79, 1);
      });

      it('should convert teaspoons to ml', () => {
        expect(convertToBaseUnit(1, 'tsp', 'ml')).toBeCloseTo(4.93, 1);
      });
    });

    describe('same unit conversions', () => {
      it('should return same quantity for same units', () => {
        expect(convertToBaseUnit(100, 'ml', 'ml')).toBe(100);
        expect(convertToBaseUnit(100, 'g', 'g')).toBe(100);
        expect(convertToBaseUnit(100, 'unit', 'unit')).toBe(100);
        expect(convertToBaseUnit(100, 'L', 'L')).toBe(100);
        expect(convertToBaseUnit(100, 'kg', 'kg')).toBe(100);
      });
    });

    describe('custom conversion factor', () => {
      it('should use custom conversion factor when provided', () => {
        expect(convertToBaseUnit(1, 'custom', 'unit', 12)).toBe(12);
        expect(convertToBaseUnit(2, 'custom', 'unit', 12)).toBe(24);
        expect(convertToBaseUnit(1, 'box', 'unit', 6)).toBe(6);
      });

      it('should ignore custom factor if zero or negative', () => {
        expect(convertToBaseUnit(10, 'ml', 'ml', 0)).toBe(10);
        expect(convertToBaseUnit(10, 'ml', 'ml', -5)).toBe(10);
      });
    });

    describe('edge cases', () => {
      it('should return null for negative quantities', () => {
        expect(convertToBaseUnit(-10, 'ml', 'L')).toBeNull();
        expect(convertToBaseUnit(-1, 'case', 'unit')).toBeNull();
      });

      it('should return null for zero quantity', () => {
        expect(convertToBaseUnit(0, 'ml', 'L')).toBe(0);
        expect(convertToBaseUnit(0, 'case', 'unit')).toBe(0);
      });

      it('should return null for empty or null units', () => {
        expect(convertToBaseUnit(10, '', 'ml')).toBeNull();
        expect(convertToBaseUnit(10, 'ml', '')).toBeNull();
        expect(convertToBaseUnit(10, null as unknown as string, 'ml')).toBeNull();
        expect(convertToBaseUnit(10, 'ml', null as unknown as string)).toBeNull();
      });

      it('should return null for incompatible unit categories', () => {
        expect(convertToBaseUnit(10, 'ml', 'g')).toBeNull();
        expect(convertToBaseUnit(10, 'kg', 'unit')).toBeNull();
        expect(convertToBaseUnit(10, 'L', 'lb')).toBeNull();
      });

      it('should return null for unknown units', () => {
        expect(convertToBaseUnit(10, 'unknown', 'ml')).toBeNull();
        expect(convertToBaseUnit(10, 'ml', 'unknown')).toBeNull();
      });

    it('should handle case insensitivity', () => {
      expect(convertToBaseUnit(1000, 'ML', 'l')).toBe(1);
      expect(convertToBaseUnit(1, 'Liter', 'ml')).toBe(1000);
      expect(convertToBaseUnit(1, 'CASE', 'unit')).toBe(24);
      expect(convertToBaseUnit(1, 'Kg', 'g')).toBe(1000);
    });

      it('should handle whitespace in units', () => {
        expect(convertToBaseUnit(1, ' L ', 'ml')).toBe(1000);
        expect(convertToBaseUnit(1, '  kg  ', 'g')).toBe(1000);
      });

      it('should handle keg and barrel conversions', () => {
        expect(convertToBaseUnit(1, 'keg', 'ml')).toBeCloseTo(58673.9, 0);
        expect(convertToBaseUnit(1, 'barrel', 'ml')).toBeCloseTo(117347, 0);
      });
    });
  });

  describe('calculateCostPerBaseUnit', () => {
    it('should calculate cost per liter from ml pricing', () => {
      const result = calculateCostPerBaseUnit(10, 1000, 'ml', 'L');
      expect(result).toBe(10);
    });

    it('should calculate cost per gram from kg pricing', () => {
      const result = calculateCostPerBaseUnit(20, 1, 'kg', 'g');
      expect(result).toBe(0.02);
    });

    it('should calculate cost per unit from case pricing', () => {
      const result = calculateCostPerBaseUnit(24, 1, 'case', 'unit');
      expect(result).toBe(1);
    });

    it('should handle pack pricing', () => {
      const result = calculateCostPerBaseUnit(12, 2, 'pack', 'unit');
      expect(result).toBe(1);
    });

    it('should use custom conversion factor', () => {
      const result = calculateCostPerBaseUnit(100, 1, 'custom', 'unit', 10);
      expect(result).toBe(10);
    });

    it('should return null for negative price', () => {
      expect(calculateCostPerBaseUnit(-10, 100, 'ml', 'L')).toBeNull();
    });

    it('should return null for zero quantity', () => {
      expect(calculateCostPerBaseUnit(10, 0, 'ml', 'L')).toBeNull();
    });

    it('should return null for negative quantity', () => {
      expect(calculateCostPerBaseUnit(10, -100, 'ml', 'L')).toBeNull();
    });

    it('should return null for incompatible units', () => {
      expect(calculateCostPerBaseUnit(10, 100, 'ml', 'kg')).toBeNull();
    });

    it('should handle zero price', () => {
      const result = calculateCostPerBaseUnit(0, 100, 'ml', 'L');
      expect(result).toBe(0);
    });

    it('should calculate correctly for beverage servings', () => {
      const result = calculateCostPerBaseUnit(50, 1, 'shot', 'ml');
      expect(result).toBeCloseTo(50 / 44, 4);
    });
  });

  describe('parsePurchasingUnits', () => {
    it('should parse valid purchasing units JSON', () => {
      const input = {
        defaultPurchaseUnit: 'case',
        units: [
          { unit: 'case', conversionFactor: 24, displayName: 'Case of 24' },
          { unit: 'unit', conversionFactor: 1 },
        ],
      };
      const result = parsePurchasingUnits(input);
      expect(result).toEqual({
        defaultPurchaseUnit: 'case',
        units: [
          { unit: 'case', conversionFactor: 24, displayName: 'Case of 24' },
          { unit: 'unit', conversionFactor: 1 },
        ],
      });
    });

    it('should parse JSON without defaultPurchaseUnit', () => {
      const input = {
        units: [{ unit: 'case', conversionFactor: 24 }],
      };
      const result = parsePurchasingUnits(input);
      expect(result).toEqual({
        units: [{ unit: 'case', conversionFactor: 24 }],
      });
    });

    it('should parse JSON without units array', () => {
      const input = { defaultPurchaseUnit: 'ml' };
      const result = parsePurchasingUnits(input);
      expect(result).toEqual({ defaultPurchaseUnit: 'ml' });
    });

    it('should return null for null input', () => {
      expect(parsePurchasingUnits(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(parsePurchasingUnits(undefined)).toBeNull();
    });

    it('should return null for array input', () => {
      expect(parsePurchasingUnits([{ unit: 'case', conversionFactor: 24 }])).toBeNull();
    });

    it('should return null for non-object input', () => {
      expect(parsePurchasingUnits('string')).toBeNull();
      expect(parsePurchasingUnits(123)).toBeNull();
      expect(parsePurchasingUnits(true)).toBeNull();
    });

    it('should filter out invalid unit configs', () => {
      const input = {
        units: [
          { unit: 'case', conversionFactor: 24 },
          { unit: 'invalid', conversionFactor: -1 },
          { unit: 123, conversionFactor: 1 },
          { conversionFactor: 1 },
          { unit: 'valid', conversionFactor: 1 },
        ],
      };
      const result = parsePurchasingUnits(input);
      expect(result?.units).toHaveLength(2);
      expect(result?.units?.[0].unit).toBe('case');
      expect(result?.units?.[1].unit).toBe('valid');
    });

    it('should ignore invalid defaultPurchaseUnit', () => {
      const input = {
        defaultPurchaseUnit: 123,
        units: [{ unit: 'case', conversionFactor: 24 }],
      };
      const result = parsePurchasingUnits(input);
      expect(result?.defaultPurchaseUnit).toBeUndefined();
      expect(result?.units).toHaveLength(1);
    });

    it('should handle empty object', () => {
      const result = parsePurchasingUnits({});
      expect(result).toEqual({});
    });

    it('should filter units with zero conversion factor', () => {
      const input = {
        units: [
          { unit: 'case', conversionFactor: 24 },
          { unit: 'invalid', conversionFactor: 0 },
        ],
      };
      const result = parsePurchasingUnits(input);
      expect(result?.units).toHaveLength(1);
    });
  });

  describe('getServingCost', () => {
    it('should calculate serving cost for shots', () => {
      const result = getServingCost(0.5, 44, 'ml', 'ml');
      expect(result).toBe(22);
    });

    it('should calculate serving cost for glasses', () => {
      const result = getServingCost(0.1, 150, 'ml', 'ml');
      expect(result).toBe(15);
    });

    it('should handle unit-based servings', () => {
      const result = getServingCost(2, 1, 'unit', 'unit');
      expect(result).toBe(2);
    });

    it('should convert serving size to base unit', () => {
      const result = getServingCost(1, 1000, 'ml', 'L');
      expect(result).toBe(1);
    });

    it('should return null for negative base cost', () => {
      expect(getServingCost(-1, 100, 'ml', 'ml')).toBeNull();
    });

    it('should return null for zero serving size', () => {
      expect(getServingCost(1, 0, 'ml', 'ml')).toBeNull();
    });

    it('should return null for negative serving size', () => {
      expect(getServingCost(1, -100, 'ml', 'ml')).toBeNull();
    });

    it('should return null for incompatible units', () => {
      expect(getServingCost(1, 100, 'ml', 'kg')).toBeNull();
    });

    it('should handle zero base cost', () => {
      const result = getServingCost(0, 100, 'ml', 'ml');
      expect(result).toBe(0);
    });

    it('should calculate shot-based cost correctly', () => {
      const baseCostPerMl = 0.02;
      const shotSize = 44;
      const result = getServingCost(baseCostPerMl, 1, 'shot', 'ml');
      expect(result).toBeCloseTo(0.88, 2);
    });
  });

  describe('getConversionFactorFromConfig', () => {
    it('should return conversion factor for matching unit', () => {
      const config: PurchasingUnitsJson = {
        units: [
          { unit: 'case', conversionFactor: 24 },
          { unit: 'pack', conversionFactor: 6 },
        ],
      };
      expect(getConversionFactorFromConfig(config, 'case')).toBe(24);
      expect(getConversionFactorFromConfig(config, 'pack')).toBe(6);
    });

    it('should return undefined for null config', () => {
      expect(getConversionFactorFromConfig(null, 'case')).toBeUndefined();
    });

    it('should return undefined for config without units', () => {
      expect(getConversionFactorFromConfig({}, 'case')).toBeUndefined();
      expect(getConversionFactorFromConfig({ defaultPurchaseUnit: 'ml' }, 'case')).toBeUndefined();
    });

    it('should return undefined for non-existent unit', () => {
      const config: PurchasingUnitsJson = {
        units: [{ unit: 'case', conversionFactor: 24 }],
      };
      expect(getConversionFactorFromConfig(config, 'bottle')).toBeUndefined();
    });

    it('should be case insensitive', () => {
      const config: PurchasingUnitsJson = {
        units: [{ unit: 'Case', conversionFactor: 24 }],
      };
      expect(getConversionFactorFromConfig(config, 'case')).toBe(24);
      expect(getConversionFactorFromConfig(config, 'CASE')).toBe(24);
    });
  });

  describe('isConversionPossible', () => {
    it('should return true for same units', () => {
      expect(isConversionPossible('ml', 'ml')).toBe(true);
      expect(isConversionPossible('kg', 'kg')).toBe(true);
      expect(isConversionPossible('unit', 'unit')).toBe(true);
    });

    it('should return true for known conversions', () => {
      expect(isConversionPossible('ml', 'L')).toBe(true);
      expect(isConversionPossible('kg', 'g')).toBe(true);
      expect(isConversionPossible('case', 'unit')).toBe(true);
      expect(isConversionPossible('shot', 'ml')).toBe(true);
    });

    it('should return false for empty units', () => {
      expect(isConversionPossible('', 'ml')).toBe(false);
      expect(isConversionPossible('ml', '')).toBe(false);
    });

    it('should return false for incompatible categories', () => {
      expect(isConversionPossible('ml', 'kg')).toBe(false);
      expect(isConversionPossible('g', 'unit')).toBe(false);
    });

    it('should return true for same category units', () => {
      expect(isConversionPossible('ml', 'cl')).toBe(true);
      expect(isConversionPossible('g', 'mg')).toBe(true);
      expect(isConversionPossible('unit', 'bottle')).toBe(true);
    });

    it('should handle null/undefined gracefully', () => {
      expect(isConversionPossible(null as unknown as string, 'ml')).toBe(false);
      expect(isConversionPossible('ml', null as unknown as string)).toBe(false);
    });
  });

  describe('getUnitDescription', () => {
    it('should return correct descriptions for common units', () => {
      expect(getUnitDescription('ml')).toBe('milliliters');
      expect(getUnitDescription('l')).toBe('liters');
      expect(getUnitDescription('L')).toBe('liters');
      expect(getUnitDescription('g')).toBe('grams');
      expect(getUnitDescription('kg')).toBe('kilograms');
      expect(getUnitDescription('lb')).toBe('pounds');
      expect(getUnitDescription('unit')).toBe('units/pieces');
      expect(getUnitDescription('btl')).toBe('bottles');
      expect(getUnitDescription('cs')).toBe('cases (24 units)');
      expect(getUnitDescription('can')).toBe('cans');
      expect(getUnitDescription('pack')).toBe('packs (6 units)');
      expect(getUnitDescription('shot')).toBe('shots (44ml)');
      expect(getUnitDescription('glass')).toBe('glasses (150ml)');
      expect(getUnitDescription('cup')).toBe('cups (237ml)');
    });

    it('should return original unit for unknown units', () => {
      expect(getUnitDescription('unknown')).toBe('unknown');
      expect(getUnitDescription('custom')).toBe('custom');
    });

    it('should normalize unit before lookup', () => {
      expect(getUnitDescription('Liter')).toBe('liters');
      expect(getUnitDescription('KILOGRAM')).toBe('kilograms');
      expect(getUnitDescription('  ml  ')).toBe('milliliters');
    });
  });

  describe('COMMON_CONVERSIONS', () => {
    it('should contain essential conversions', () => {
      expect(COMMON_CONVERSIONS.some(c => c.fromUnit === 'L' && c.toUnit === 'ml')).toBe(true);
      expect(COMMON_CONVERSIONS.some(c => c.fromUnit === 'kg' && c.toUnit === 'g')).toBe(true);
      expect(COMMON_CONVERSIONS.some(c => c.fromUnit === 'case' && c.toUnit === 'unit')).toBe(true);
    });

    it('should have valid conversion factors', () => {
      for (const conversion of COMMON_CONVERSIONS) {
        expect(conversion.factor).toBeGreaterThan(0);
        expect(typeof conversion.fromUnit).toBe('string');
        expect(typeof conversion.toUnit).toBe('string');
        expect(conversion.fromUnit.length).toBeGreaterThan(0);
        expect(conversion.toUnit.length).toBeGreaterThan(0);
      }
    });
  });
});
