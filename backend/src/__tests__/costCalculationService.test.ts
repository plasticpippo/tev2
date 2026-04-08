import {
  calculateVariantCost,
  calculateTransactionItemCost,
  calculateTransactionCost,
  updateVariantTheoreticalCost,
  getVariantCostBreakdown,
  getMultipleVariantCosts,
  recalculateAllVariantCosts,
} from '../services/costCalculationService';
import { prisma } from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('../prisma', () => ({
  prisma: {
    productVariant: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    stockConsumption: {
      findMany: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

describe('costCalculationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateVariantCost', () => {
    it('should calculate cost for variant with single ingredient', async () => {
      const mockVariant = {
        id: 1,
        name: 'Test Drink',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 2,
            stockItem: {
              id: 'stock-1',
              name: 'Ingredient 1',
              standardCost: new Decimal(1.5),
            },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateVariantCost(1);

      expect(result).toBe(3);
      expect(mockedPrisma.productVariant.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          stockConsumption: {
            include: { stockItem: true },
          },
        },
      });
    });

    it('should calculate cost for variant with multiple ingredients', async () => {
      const mockVariant = {
        id: 1,
        name: 'Cocktail',
        productId: 1,
        price: new Decimal(15),
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 2,
            stockItem: {
              id: 'stock-1',
              name: 'Spirit',
              standardCost: new Decimal(2.5),
            },
          },
          {
            stockItemId: 'stock-2',
            quantity: 1,
            stockItem: {
              id: 'stock-2',
              name: 'Mixer',
              standardCost: new Decimal(1),
            },
          },
          {
            stockItemId: 'stock-3',
            quantity: 1,
            stockItem: {
              id: 'stock-3',
              name: 'Garnish',
              standardCost: new Decimal(1),
            },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateVariantCost(1);

      expect(result).toBe(7);
    });

    it('should return null for non-existent variant', async () => {
      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await calculateVariantCost(999);

      expect(result).toBeNull();
    });

    it('should return null for variant without stock consumption', async () => {
      const mockVariant = {
        id: 1,
        name: 'Empty Variant',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateVariantCost(1);

      expect(result).toBeNull();
    });

    it('should return null for variant with null stockConsumption', async () => {
      const mockVariant = {
        id: 1,
        name: 'Null Consumption',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: null,
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateVariantCost(1);

      expect(result).toBeNull();
    });

    it('should skip ingredients with zero cost', async () => {
      const mockVariant = {
        id: 1,
        name: 'Test',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 2,
            stockItem: {
              id: 'stock-1',
              name: 'Free Ingredient',
              standardCost: new Decimal(0),
            },
          },
          {
            stockItemId: 'stock-2',
            quantity: 1,
            stockItem: {
              id: 'stock-2',
              name: 'Paid Ingredient',
              standardCost: new Decimal(5),
            },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateVariantCost(1);

      expect(result).toBe(5);
    });

    it('should skip ingredients with zero quantity', async () => {
      const mockVariant = {
        id: 1,
        name: 'Test',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 0,
            stockItem: {
              id: 'stock-1',
              name: 'Zero Quantity',
              standardCost: new Decimal(10),
            },
          },
          {
            stockItemId: 'stock-2',
            quantity: 1,
            stockItem: {
              id: 'stock-2',
              name: 'Valid',
              standardCost: new Decimal(5),
            },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateVariantCost(1);

      expect(result).toBe(5);
    });

    it('should return null when all ingredients have zero cost', async () => {
      const mockVariant = {
        id: 1,
        name: 'Free Drink',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 2,
            stockItem: {
              id: 'stock-1',
              name: 'Free 1',
              standardCost: new Decimal(0),
            },
          },
          {
            stockItemId: 'stock-2',
            quantity: 1,
            stockItem: {
              id: 'stock-2',
              name: 'Free 2',
              standardCost: null,
            },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateVariantCost(1);

      expect(result).toBeNull();
    });

    it('should handle floating-point precision correctly', async () => {
      const mockVariant = {
        id: 1,
        name: 'Precision Test',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 1.5,
            stockItem: {
              id: 'stock-1',
              name: 'Ingredient',
              standardCost: new Decimal(2.67),
            },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateVariantCost(1);

      expect(result).toBeCloseTo(4.01, 1);
    });
  });

  describe('calculateTransactionItemCost', () => {
    it('should calculate cost for single item', async () => {
      const mockVariant = {
        id: 1,
        name: 'Test Drink',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 1,
            stockItem: {
              id: 'stock-1',
              name: 'Ingredient',
              standardCost: new Decimal(3),
            },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateTransactionItemCost(1, 2);

      expect(result).toEqual({
        variantId: 1,
        quantity: 2,
        unitCost: 3,
        totalCost: 6,
      });
    });

    it('should handle quantity of 1', async () => {
      const mockVariant = {
        id: 1,
        name: 'Test',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 1,
            stockItem: { id: 'stock-1', name: 'Test', standardCost: new Decimal(5) },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateTransactionItemCost(1, 1);

      expect(result.unitCost).toBe(5);
      expect(result.totalCost).toBe(5);
    });

    it('should handle zero quantity', async () => {
      const result = await calculateTransactionItemCost(1, 0);

      expect(result).toEqual({
        variantId: 1,
        quantity: 0,
        unitCost: null,
        totalCost: null,
      });
      expect(mockedPrisma.productVariant.findUnique).not.toHaveBeenCalled();
    });

    it('should handle negative quantity', async () => {
      const result = await calculateTransactionItemCost(1, -1);

      expect(result).toEqual({
        variantId: 1,
        quantity: -1,
        unitCost: null,
        totalCost: null,
      });
    });

    it('should handle variant without cost', async () => {
      const mockVariant = {
        id: 1,
        name: 'No Cost',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateTransactionItemCost(1, 2);

      expect(result).toEqual({
        variantId: 1,
        quantity: 2,
        unitCost: null,
        totalCost: null,
      });
    });

    it('should handle non-existent variant', async () => {
      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await calculateTransactionItemCost(999, 2);

      expect(result).toEqual({
        variantId: 999,
        quantity: 2,
        unitCost: null,
        totalCost: null,
      });
    });

    it('should handle large quantities', async () => {
      const mockVariant = {
        id: 1,
        name: 'Test',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 1,
            stockItem: { id: 'stock-1', name: 'Test', standardCost: new Decimal(2.5) },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateTransactionItemCost(1, 100);

      expect(result.unitCost).toBe(2.5);
      expect(result.totalCost).toBe(250);
    });
  });

  describe('calculateTransactionCost', () => {
    it('should calculate total cost for multiple items', async () => {
      const mockVariant1 = {
        id: 1,
        name: 'Drink 1',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 1,
            stockItem: { id: 'stock-1', name: 'Test', standardCost: new Decimal(2) },
          },
        ],
      };

      const mockVariant2 = {
        id: 2,
        name: 'Drink 2',
        productId: 2,
        price: new Decimal(12),
        stockConsumption: [
          {
            stockItemId: 'stock-2',
            quantity: 1,
            stockItem: { id: 'stock-2', name: 'Test', standardCost: new Decimal(3) },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockVariant1)
        .mockResolvedValueOnce(mockVariant2);

      const result = await calculateTransactionCost([
        { variantId: 1, quantity: 2 },
        { variantId: 2, quantity: 3 },
      ]);

      expect(result.items).toHaveLength(2);
      expect(result.totalCost).toBe(13);
      expect(result.hasAllCosts).toBe(true);
      expect(result.items[0].totalCost).toBe(4);
      expect(result.items[1].totalCost).toBe(9);
    });

    it('should return empty result for empty items array', async () => {
      const result = await calculateTransactionCost([]);

      expect(result).toEqual({
        items: [],
        totalCost: null,
        hasAllCosts: false,
      });
    });

    it('should return empty result for null items', async () => {
      const result = await calculateTransactionCost(null as unknown as []);

      expect(result).toEqual({
        items: [],
        totalCost: null,
        hasAllCosts: false,
      });
    });

    it('should handle partial cost data', async () => {
      const mockVariantWithCost = {
        id: 1,
        name: 'With Cost',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 1,
            stockItem: { id: 'stock-1', name: 'Test', standardCost: new Decimal(5) },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockVariantWithCost)
        .mockResolvedValueOnce(null);

      const result = await calculateTransactionCost([
        { variantId: 1, quantity: 1 },
        { variantId: 2, quantity: 1 },
      ]);

      expect(result.items).toHaveLength(2);
      expect(result.totalCost).toBeNull();
      expect(result.hasAllCosts).toBe(false);
      expect(result.items[0].totalCost).toBe(5);
      expect(result.items[1].totalCost).toBeNull();
    });

    it('should handle all items without cost', async () => {
      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await calculateTransactionCost([
        { variantId: 1, quantity: 1 },
        { variantId: 2, quantity: 2 },
      ]);

      expect(result.totalCost).toBeNull();
      expect(result.hasAllCosts).toBe(false);
      expect(result.items.every((item) => item.totalCost === null)).toBe(true);
    });

    it('should handle zero quantity items', async () => {
      const mockVariant = {
        id: 1,
        name: 'Test',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 1,
            stockItem: { id: 'stock-1', name: 'Test', standardCost: new Decimal(5) },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateTransactionCost([
        { variantId: 1, quantity: 2 },
        { variantId: 2, quantity: 0 },
      ]);

      expect(result.hasAllCosts).toBe(false);
    });

    it('should calculate cost with floating-point precision', async () => {
      const mockVariant = {
        id: 1,
        name: 'Test',
        productId: 1,
        price: new Decimal(10),
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 1,
            stockItem: { id: 'stock-1', name: 'Test', standardCost: new Decimal(3.33) },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await calculateTransactionCost([
        { variantId: 1, quantity: 3 },
      ]);

      expect(result.totalCost).toBeCloseTo(9.99, 1);
    });
  });

  describe('updateVariantTheoreticalCost', () => {
    it('should update variant with calculated cost and margin', async () => {
      const mockVariant = {
        id: 1,
        name: 'Test',
        productId: 1,
        price: new Decimal(10),
        product: { id: 1, name: 'Test Product' },
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 1,
            stockItem: { id: 'stock-1', name: 'Test', standardCost: new Decimal(4) },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);
      (mockedPrisma.productVariant.update as jest.Mock).mockResolvedValue({
        ...mockVariant,
        theoreticalCost: new Decimal(4),
        currentMargin: new Decimal(60),
        lastCostCalc: new Date(),
        costStatus: 'current',
      });

      const result = await updateVariantTheoreticalCost(1);

      expect(result).not.toBeNull();
      expect(result?.theoreticalCost).toBe(4);
      expect(result?.currentMargin).toBe(60);
      expect(result?.costStatus).toBe('current');
      expect(mockedPrisma.productVariant.update).toHaveBeenCalled();
    });

    it('should return null for non-existent variant', async () => {
      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await updateVariantTheoreticalCost(999);

      expect(result).toBeNull();
      expect(mockedPrisma.productVariant.update).not.toHaveBeenCalled();
    });

    it('should handle variant without recipe (pending status)', async () => {
      const mockVariant = {
        id: 1,
        name: 'No Recipe',
        productId: 1,
        price: new Decimal(10),
        product: { id: 1, name: 'Test Product' },
        stockConsumption: [],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);
      (mockedPrisma.productVariant.update as jest.Mock).mockResolvedValue({
        ...mockVariant,
        theoreticalCost: null,
        currentMargin: null,
        lastCostCalc: new Date(),
        costStatus: 'pending',
      });

      const result = await updateVariantTheoreticalCost(1);

      expect(result).not.toBeNull();
      expect(result?.theoreticalCost).toBeNull();
      expect(result?.currentMargin).toBeNull();
      expect(result?.costStatus).toBe('pending');
    });

    it('should calculate margin correctly', async () => {
      const mockVariant = {
        id: 1,
        name: 'Test',
        productId: 1,
        price: new Decimal(20),
        product: { id: 1, name: 'Test Product' },
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 1,
            stockItem: { id: 'stock-1', name: 'Test', standardCost: new Decimal(5) },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);
      (mockedPrisma.productVariant.update as jest.Mock).mockResolvedValue({});

      const result = await updateVariantTheoreticalCost(1);

      expect(result?.currentMargin).toBe(75);
    });

    it('should handle zero price', async () => {
      const mockVariant = {
        id: 1,
        name: 'Free',
        productId: 1,
        price: new Decimal(0),
        product: { id: 1, name: 'Test Product' },
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 1,
            stockItem: { id: 'stock-1', name: 'Test', standardCost: new Decimal(5) },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);
      (mockedPrisma.productVariant.update as jest.Mock).mockResolvedValue({});

      const result = await updateVariantTheoreticalCost(1);

      expect(result?.currentMargin).toBeNull();
    });
  });

  describe('getVariantCostBreakdown', () => {
    it('should return detailed cost breakdown', async () => {
      const mockVariant = {
        id: 1,
        name: 'Cocktail',
        productId: 1,
        price: new Decimal(15),
        product: { id: 1, name: 'Signature Drinks' },
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 2,
            stockItem: { id: 'stock-1', name: 'Vodka', standardCost: new Decimal(3) },
          },
          {
            stockItemId: 'stock-2',
            quantity: 1,
            stockItem: { id: 'stock-2', name: 'Tonic', standardCost: new Decimal(0.5) },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await getVariantCostBreakdown(1);

      expect(result).not.toBeNull();
      expect(result?.variantId).toBe(1);
      expect(result?.variantName).toBe('Cocktail');
      expect(result?.productId).toBe(1);
      expect(result?.productName).toBe('Signature Drinks');
      expect(result?.ingredientCosts).toHaveLength(2);
      expect(result?.totalCost).toBe(6.5);
      expect(result?.hasValidCosts).toBe(true);
      expect(result?.ingredientCosts[0].stockItemName).toBe('Vodka');
      expect(result?.ingredientCosts[0].quantity).toBe(2);
      expect(result?.ingredientCosts[0].standardCost).toBe(3);
      expect(result?.ingredientCosts[0].ingredientCost).toBe(6);
    });

    it('should return null for non-existent variant', async () => {
      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getVariantCostBreakdown(999);

      expect(result).toBeNull();
    });

    it('should handle variant without stock consumption', async () => {
      const mockVariant = {
        id: 1,
        name: 'Empty',
        productId: 1,
        price: new Decimal(10),
        product: { id: 1, name: 'Test' },
        stockConsumption: [],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await getVariantCostBreakdown(1);

      expect(result?.ingredientCosts).toHaveLength(0);
      expect(result?.totalCost).toBeNull();
      expect(result?.hasValidCosts).toBe(false);
    });

    it('should include ingredients with zero cost', async () => {
      const mockVariant = {
        id: 1,
        name: 'Test',
        productId: 1,
        price: new Decimal(10),
        product: { id: 1, name: 'Test' },
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 2,
            stockItem: { id: 'stock-1', name: 'Free', standardCost: new Decimal(0) },
          },
          {
            stockItemId: 'stock-2',
            quantity: 1,
            stockItem: { id: 'stock-2', name: 'Paid', standardCost: new Decimal(5) },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);

      const result = await getVariantCostBreakdown(1);

      expect(result?.ingredientCosts).toHaveLength(2);
      expect(result?.ingredientCosts[0].ingredientCost).toBe(0);
      expect(result?.ingredientCosts[1].ingredientCost).toBe(5);
    });
  });

  describe('getMultipleVariantCosts', () => {
    it('should return cost map for multiple variants', async () => {
      const mockVariant1 = {
        id: 1,
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 1,
            stockItem: { id: 'stock-1', name: 'Test', standardCost: new Decimal(5) },
          },
        ],
      };

      const mockVariant2 = {
        id: 2,
        stockConsumption: [
          {
            stockItemId: 'stock-2',
            quantity: 1,
            stockItem: { id: 'stock-2', name: 'Test', standardCost: new Decimal(3) },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockVariant1)
        .mockResolvedValueOnce(mockVariant2);

      const result = await getMultipleVariantCosts([1, 2]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toBe(5);
      expect(result.get(2)).toBe(3);
    });

    it('should handle empty array', async () => {
      const result = await getMultipleVariantCosts([]);

      expect(result.size).toBe(0);
    });

    it('should handle non-existent variants', async () => {
      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getMultipleVariantCosts([1, 2, 3]);

      expect(result.size).toBe(3);
      expect(result.get(1)).toBeNull();
      expect(result.get(2)).toBeNull();
      expect(result.get(3)).toBeNull();
    });
  });

  describe('recalculateAllVariantCosts', () => {
    it('should recalculate costs for all variants', async () => {
      (mockedPrisma.productVariant.findMany as jest.Mock).mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);

      const mockVariant = {
        id: 1,
        price: new Decimal(10),
        product: { id: 1, name: 'Test' },
        stockConsumption: [
          {
            stockItemId: 'stock-1',
            quantity: 1,
            stockItem: { id: 'stock-1', name: 'Test', standardCost: new Decimal(5) },
          },
        ],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);
      (mockedPrisma.productVariant.update as jest.Mock).mockResolvedValue({});

      const result = await recalculateAllVariantCosts();

      expect(result.updated).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should handle variants without costs (skipped)', async () => {
      (mockedPrisma.productVariant.findMany as jest.Mock).mockResolvedValue([
        { id: 1 },
      ]);

      const mockVariant = {
        id: 1,
        price: new Decimal(10),
        product: { id: 1, name: 'Test' },
        stockConsumption: [],
      };

      (mockedPrisma.productVariant.findUnique as jest.Mock).mockResolvedValue(mockVariant);
      (mockedPrisma.productVariant.update as jest.Mock).mockResolvedValue({});

      const result = await recalculateAllVariantCosts();

      expect(result.skipped).toBe(1);
      expect(result.updated).toBe(0);
    });

    it('should handle errors during recalculation', async () => {
      (mockedPrisma.productVariant.findMany as jest.Mock).mockResolvedValue([
        { id: 1 },
        { id: 2 },
      ]);

      (mockedPrisma.productVariant.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          id: 1,
          price: new Decimal(10),
          product: { id: 1, name: 'Test' },
          stockConsumption: [
            {
              stockItemId: 'stock-1',
              quantity: 1,
              stockItem: { id: 'stock-1', name: 'Test', standardCost: new Decimal(5) },
            },
          ],
        })
        .mockRejectedValueOnce(new Error('Database error'));

      (mockedPrisma.productVariant.update as jest.Mock).mockResolvedValue({});

      const result = await recalculateAllVariantCosts();

      expect(result.failed).toBe(1);
      expect(result.updated).toBe(1);
    });

    it('should handle empty database', async () => {
      (mockedPrisma.productVariant.findMany as jest.Mock).mockResolvedValue([]);

      const result = await recalculateAllVariantCosts();

      expect(result).toEqual({ updated: 0, failed: 0, skipped: 0 });
    });
  });
});
