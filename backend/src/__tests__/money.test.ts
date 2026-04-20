import {
  isMoneyValid,
  roundMoney,
  addMoney,
  subtractMoney,
  multiplyMoney,
  divideMoney,
  formatMoney,
} from '../utils/money';

describe('money utilities', () => {
  describe('isMoneyValid', () => {
    it('should return true for valid numbers', () => {
      expect(isMoneyValid(0)).toBe(true);
      expect(isMoneyValid(1)).toBe(true);
      expect(isMoneyValid(100.5)).toBe(true);
      expect(isMoneyValid(-50)).toBe(true);
      expect(isMoneyValid(0.01)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isMoneyValid(NaN)).toBe(false);
    });

    it('should return false for Infinity', () => {
      expect(isMoneyValid(Infinity)).toBe(false);
      expect(isMoneyValid(-Infinity)).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isMoneyValid(null)).toBe(false);
      expect(isMoneyValid(undefined)).toBe(false);
    });

    it('should return false for non-numbers', () => {
      // Note: Number() converts many values to valid numbers:
      // - numeric strings like '100' -> 100
      // - empty string '' -> 0
      // - boolean true -> 1, false -> 0
      // - empty array [] -> 0
      // We test values that actually return NaN
      expect(isMoneyValid('abc')).toBe(false);
      expect(isMoneyValid('hello')).toBe(false);
      expect(isMoneyValid({})).toBe(false);
      expect(isMoneyValid({ a: 1 })).toBe(false);
      expect(isMoneyValid([1, 2])).toBe(false);
      expect(isMoneyValid(() => {})).toBe(false);
    });
  });

  describe('roundMoney', () => {
    it('should round to 2 decimal places', () => {
      expect(roundMoney(10.256)).toBe(10.26);
      expect(roundMoney(10.254)).toBe(10.25);
      expect(roundMoney(10.2)).toBe(10.2);
      expect(roundMoney(10.005)).toBe(10.01);
    });

    it('should handle edge cases', () => {
      expect(roundMoney(0)).toBe(0);
      expect(roundMoney(-10.256)).toBe(-10.26);
      expect(roundMoney(-10.254)).toBe(-10.25);
    });

    it('should throw on invalid input', () => {
      expect(() => roundMoney(NaN as unknown as number)).toThrow('Invalid monetary value');
      expect(() => roundMoney(Infinity as unknown as number)).toThrow('Invalid monetary value');
      expect(() => roundMoney(null as unknown as number)).toThrow('Invalid monetary value');
    });
  });

  describe('addMoney', () => {
    it('should add correctly', () => {
      // This is the classic floating-point issue: 0.1 + 0.2 should equal 0.3, not 0.30000000000000004
      expect(addMoney(0.1, 0.2)).toBe(0.3);
      expect(addMoney(10.5, 20.3)).toBe(30.8);
      expect(addMoney(100, 200)).toBe(300);
    });

    it('should handle edge cases', () => {
      expect(addMoney(0, 0)).toBe(0);
      expect(addMoney(0, 100)).toBe(100);
      expect(addMoney(100, 0)).toBe(100);
      expect(addMoney(-50, 25)).toBe(-25);
      expect(addMoney(-50, -25)).toBe(-75);
    });

    it('should throw on invalid input', () => {
      expect(() => addMoney(NaN as unknown as number, 10)).toThrow('Invalid first monetary value');
      expect(() => addMoney(10, NaN as unknown as number)).toThrow('Invalid second monetary value');
      expect(() => addMoney(null as unknown as number, 10)).toThrow('Invalid first monetary value');
      expect(() => addMoney(10, null as unknown as number)).toThrow('Invalid second monetary value');
    });
  });

  describe('subtractMoney', () => {
    it('should subtract correctly', () => {
      expect(subtractMoney(10.3, 5.1)).toBe(5.2);
      expect(subtractMoney(100, 50)).toBe(50);
      expect(subtractMoney(0.3, 0.1)).toBe(0.2);
    });

    it('should handle edge cases', () => {
      expect(subtractMoney(0, 0)).toBe(0);
      expect(subtractMoney(100, 0)).toBe(100);
      expect(subtractMoney(0, 100)).toBe(-100);
      expect(subtractMoney(-50, 25)).toBe(-75);
      expect(subtractMoney(-50, -25)).toBe(-25);
    });

    it('should throw on invalid input', () => {
      expect(() => subtractMoney(NaN as unknown as number, 10)).toThrow('Invalid first monetary value');
      expect(() => subtractMoney(10, NaN as unknown as number)).toThrow('Invalid second monetary value');
    });
  });

  describe('multiplyMoney', () => {
    it('should multiply correctly', () => {
      expect(multiplyMoney(10, 2)).toBe(20);
      expect(multiplyMoney(10.5, 2)).toBe(21);
      expect(multiplyMoney(0.1, 0.2)).toBe(0.02);
    });

    it('should handle edge cases', () => {
      expect(multiplyMoney(0, 100)).toBe(0);
      expect(multiplyMoney(100, 0)).toBe(0);
      expect(multiplyMoney(100, 1)).toBe(100);
      expect(multiplyMoney(-50, 2)).toBe(-100);
      expect(multiplyMoney(50, -2)).toBe(-100);
      expect(multiplyMoney(-50, -2)).toBe(100);
    });

    it('should throw on invalid input', () => {
      expect(() => multiplyMoney(NaN as unknown as number, 10)).toThrow('Invalid monetary value');
      expect(() => multiplyMoney(10, NaN as unknown as number)).toThrow('Invalid multiplier');
    });
  });

  describe('divideMoney', () => {
    it('should divide correctly', () => {
      expect(divideMoney(10, 2)).toBe(5);
      expect(divideMoney(10.5, 2)).toBe(5.25);
      expect(divideMoney(0.3, 0.1)).toBe(3);
    });

    it('should handle edge cases', () => {
      expect(divideMoney(0, 100)).toBe(0);
      expect(divideMoney(-100, 2)).toBe(-50);
      expect(divideMoney(-100, -2)).toBe(50);
    });

    it('should throw on division by zero', () => {
      expect(() => divideMoney(10, 0)).toThrow('Division by zero is not allowed');
    });

    it('should throw on invalid input', () => {
      expect(() => divideMoney(NaN as unknown as number, 10)).toThrow('Invalid monetary value');
      expect(() => divideMoney(10, NaN as unknown as number)).toThrow('Invalid divisor');
    });
  });

  describe('formatMoney', () => {
    it('should format as currency string', () => {
      const formatted = formatMoney(10.5);
      expect(formatted).toContain('10.50');
      expect(formatted).toContain('€');
    });

    it('should handle different values', () => {
      expect(formatMoney(0)).toContain('0.00');
      expect(formatMoney(100)).toContain('100.00');
      expect(formatMoney(-50)).toContain('50.00');
    });

    it('should throw on invalid input', () => {
      expect(() => formatMoney(NaN as unknown as number)).toThrow('Invalid monetary value');
      expect(() => formatMoney(Infinity as unknown as number)).toThrow('Invalid monetary value');
    });
  });
});
