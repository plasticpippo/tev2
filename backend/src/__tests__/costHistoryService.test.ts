import {
  updateIngredientCost,
  getCostHistory,
  getCostHistoryById,
  getRecentCostChanges,
  revertCostChange,
} from '../services/costHistoryService';
import { prisma } from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { updateVariantTheoreticalCost } from '../services/costCalculationService';

jest.mock('../prisma', () => ({
  prisma: {
    $transaction: jest.fn(),
    stockItem: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    costHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    stockConsumption: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../services/costCalculationService', () => ({
  updateVariantTheoreticalCost: jest.fn(),
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;
const mockedUpdateVariantCost = updateVariantTheoreticalCost as jest.MockedFunction<typeof updateVariantTheoreticalCost>;

describe('costHistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateIngredientCost', () => {
    it('should update ingredient cost and create history record', async () => {
      const mockStockItem = {
        id: 'stock-1',
        name: 'Test Ingredient',
        standardCost: new Decimal(10),
      };

      const mockCostHistory = {
        id: 1,
        stockItemId: 'stock-1',
        previousCost: 10,
        newCost: 12,
        changePercent: 20,
        reason: 'Supplier price increase',
        effectiveFrom: new Date(),
        notes: null,
        createdBy: 1,
        createdAt: new Date(),
        stockItem: mockStockItem,
        user: { id: 1, name: 'Admin' },
      };

      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          stockItem: {
            findUnique: jest.fn().mockResolvedValue(mockStockItem),
            update: jest.fn().mockResolvedValue(mockStockItem),
          },
          costHistory: {
            create: jest.fn().mockResolvedValue(mockCostHistory),
          },
        });
      });

      (mockedPrisma.$transaction as jest.Mock) = mockTransaction;
      (mockedPrisma.stockConsumption.findMany as jest.Mock).mockResolvedValue([]);
      mockedUpdateVariantCost.mockResolvedValue(null);

      const result = await updateIngredientCost('stock-1', 12, 'Supplier price increase', 1);

      expect(result.stockItemId).toBe('stock-1');
      expect(result.previousCost).toBe(10);
      expect(result.newCost).toBe(12);
      expect(result.stockItemName).toBe('Test Ingredient');
    });

    it('should throw error for negative cost', async () => {
      await expect(
        updateIngredientCost('stock-1', -5, 'Test', 1)
      ).rejects.toThrow('Cost must be a positive number');
    });

    it('should throw error for empty reason', async () => {
      await expect(
        updateIngredientCost('stock-1', 10, '', 1)
      ).rejects.toThrow('Reason is required for cost updates');

      await expect(
        updateIngredientCost('stock-1', 10, '   ', 1)
      ).rejects.toThrow('Reason is required for cost updates');
    });

    it('should throw error for non-existent stock item', async () => {
      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          stockItem: {
            findUnique: jest.fn().mockResolvedValue(null),
          },
          costHistory: {
            create: jest.fn(),
          },
        });
      });

      (mockedPrisma.$transaction as jest.Mock) = mockTransaction;

      await expect(
        updateIngredientCost('non-existent', 10, 'Test', 1)
      ).rejects.toThrow('StockItem with id non-existent not found');
    });

    it('should handle cost decrease correctly', async () => {
      const mockStockItem = {
        id: 'stock-1',
        name: 'Test',
        standardCost: new Decimal(20),
      };

      const mockCostHistory = {
        id: 1,
        stockItemId: 'stock-1',
        previousCost: 20,
        newCost: 15,
        changePercent: -25,
        reason: 'Bulk discount',
        effectiveFrom: new Date(),
        notes: null,
        createdBy: 1,
        createdAt: new Date(),
        stockItem: mockStockItem,
        user: { id: 1, name: 'Admin' },
      };

      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          stockItem: {
            findUnique: jest.fn().mockResolvedValue(mockStockItem),
            update: jest.fn().mockResolvedValue(mockStockItem),
          },
          costHistory: {
            create: jest.fn().mockResolvedValue(mockCostHistory),
          },
        });
      });

      (mockedPrisma.$transaction as jest.Mock) = mockTransaction;
      (mockedPrisma.stockConsumption.findMany as jest.Mock).mockResolvedValue([]);
      mockedUpdateVariantCost.mockResolvedValue(null);

      const result = await updateIngredientCost('stock-1', 15, 'Bulk discount', 1);

      expect(result.newCost).toBe(15);
    });

    it('should handle zero previous cost (new item)', async () => {
      const mockStockItem = {
        id: 'stock-1',
        name: 'New Item',
        standardCost: null,
      };

      const mockCostHistory = {
        id: 1,
        stockItemId: 'stock-1',
        previousCost: 0,
        newCost: 10,
        changePercent: 100,
        reason: 'Initial cost',
        effectiveFrom: new Date(),
        notes: null,
        createdBy: 1,
        createdAt: new Date(),
        stockItem: mockStockItem,
        user: { id: 1, name: 'Admin' },
      };

      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          stockItem: {
            findUnique: jest.fn().mockResolvedValue(mockStockItem),
            update: jest.fn().mockResolvedValue(mockStockItem),
          },
          costHistory: {
            create: jest.fn().mockResolvedValue(mockCostHistory),
          },
        });
      });

      (mockedPrisma.$transaction as jest.Mock) = mockTransaction;
      (mockedPrisma.stockConsumption.findMany as jest.Mock).mockResolvedValue([]);
      mockedUpdateVariantCost.mockResolvedValue(null);

      const result = await updateIngredientCost('stock-1', 10, 'Initial cost', 1);

      expect(result.changePercent).toBe(100);
    });

    it('should update variants using the ingredient', async () => {
      const mockStockItem = {
        id: 'stock-1',
        name: 'Test',
        standardCost: new Decimal(10),
      };

      const mockCostHistory = {
        id: 1,
        stockItemId: 'stock-1',
        previousCost: new Decimal(10),
        newCost: new Decimal(12),
        changePercent: new Decimal(20),
        reason: 'Test',
        effectiveFrom: new Date(),
        createdBy: 1,
        stockItem: mockStockItem,
        user: { id: 1, name: 'Admin' },
      };

      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          stockItem: {
            findUnique: jest.fn().mockResolvedValue(mockStockItem),
            update: jest.fn().mockResolvedValue(mockStockItem),
          },
          costHistory: {
            create: jest.fn().mockResolvedValue(mockCostHistory),
          },
        });
      });

      (mockedPrisma.$transaction as jest.Mock) = mockTransaction;
      (mockedPrisma.stockConsumption.findMany as jest.Mock).mockResolvedValue([
        { variantId: 1 },
        { variantId: 2 },
        { variantId: 1 },
      ]);
      mockedUpdateVariantCost.mockResolvedValue(null);

      await updateIngredientCost('stock-1', 12, 'Test', 1);

      expect(mockedUpdateVariantCost).toHaveBeenCalledTimes(2);
      expect(mockedUpdateVariantCost).toHaveBeenCalledWith(1);
      expect(mockedUpdateVariantCost).toHaveBeenCalledWith(2);
    });

    it('should handle variant update errors gracefully', async () => {
      const mockStockItem = {
        id: 'stock-1',
        name: 'Test',
        standardCost: new Decimal(10),
      };

      const mockCostHistory = {
        id: 1,
        stockItemId: 'stock-1',
        previousCost: new Decimal(10),
        newCost: new Decimal(12),
        changePercent: new Decimal(20),
        reason: 'Test',
        effectiveFrom: new Date(),
        createdBy: 1,
        stockItem: mockStockItem,
        user: { id: 1, name: 'Admin' },
      };

      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          stockItem: {
            findUnique: jest.fn().mockResolvedValue(mockStockItem),
            update: jest.fn().mockResolvedValue(mockStockItem),
          },
          costHistory: {
            create: jest.fn().mockResolvedValue(mockCostHistory),
          },
        });
      });

      (mockedPrisma.$transaction as jest.Mock) = mockTransaction;
      (mockedPrisma.stockConsumption.findMany as jest.Mock).mockResolvedValue([
        { variantId: 1 },
      ]);
      mockedUpdateVariantCost.mockRejectedValue(new Error('Update failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await updateIngredientCost('stock-1', 12, 'Test', 1);

      expect(result).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getCostHistory', () => {
    it('should return cost history for a stock item', async () => {
      const mockHistory = [
        {
          id: 2,
          stockItemId: 'stock-1',
          previousCost: new Decimal(10),
          newCost: new Decimal(12),
          changePercent: new Decimal(20),
          reason: 'Price increase',
          effectiveFrom: new Date('2024-01-02'),
          createdBy: 1,
          createdAt: new Date('2024-01-02'),
          stockItem: { id: 'stock-1', name: 'Test' },
          user: { id: 1, name: 'Admin' },
        },
        {
          id: 1,
          stockItemId: 'stock-1',
          previousCost: new Decimal(8),
          newCost: new Decimal(10),
          changePercent: new Decimal(25),
          reason: 'Initial price',
          effectiveFrom: new Date('2024-01-01'),
          createdBy: 1,
          createdAt: new Date('2024-01-01'),
          stockItem: { id: 'stock-1', name: 'Test' },
          user: { id: 1, name: 'Admin' },
        },
      ];

      (mockedPrisma.costHistory.findMany as jest.Mock).mockResolvedValue(mockHistory);

      const result = await getCostHistory('stock-1');

      expect(result).toHaveLength(2);
      expect(result[0].stockItemId).toBe('stock-1');
      expect(mockedPrisma.costHistory.findMany).toHaveBeenCalledWith({
        where: { stockItemId: 'stock-1' },
        include: {
          stockItem: true,
          user: true,
        },
        orderBy: { effectiveFrom: 'desc' },
      });
    });

    it('should return empty array for no history', async () => {
      (mockedPrisma.costHistory.findMany as jest.Mock).mockResolvedValue([]);

      const result = await getCostHistory('stock-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getCostHistoryById', () => {
    it('should return single cost history record', async () => {
      const mockHistory = {
        id: 1,
        stockItemId: 'stock-1',
        previousCost: new Decimal(10),
        newCost: new Decimal(12),
        changePercent: new Decimal(20),
        reason: 'Test',
        effectiveFrom: new Date(),
        createdBy: 1,
        createdAt: new Date(),
        stockItem: { id: 'stock-1', name: 'Test' },
        user: { id: 1, name: 'Admin' },
      };

      (mockedPrisma.costHistory.findUnique as jest.Mock).mockResolvedValue(mockHistory);

      const result = await getCostHistoryById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.stockItemName).toBe('Test');
      expect(result?.createdByName).toBe('Admin');
    });

    it('should return null for non-existent history', async () => {
      (mockedPrisma.costHistory.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getCostHistoryById(999);

      expect(result).toBeNull();
    });
  });

  describe('getRecentCostChanges', () => {
    it('should return recent cost changes', async () => {
      const mockChanges = [
        {
          id: 1,
          stockItemId: 'stock-1',
          previousCost: new Decimal(10),
          newCost: new Decimal(12),
          changePercent: new Decimal(20),
          reason: 'Test',
          effectiveFrom: new Date(),
          createdBy: 1,
          createdAt: new Date(),
          stockItem: { id: 'stock-1', name: 'Item 1' },
          user: { id: 1, name: 'Admin' },
        },
      ];

      (mockedPrisma.costHistory.findMany as jest.Mock).mockResolvedValue(mockChanges);

      const result = await getRecentCostChanges(10);

      expect(result).toHaveLength(1);
      expect(mockedPrisma.costHistory.findMany).toHaveBeenCalledWith({
        take: 10,
        include: {
          stockItem: true,
          user: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should use default limit of 20', async () => {
      (mockedPrisma.costHistory.findMany as jest.Mock).mockResolvedValue([]);

      await getRecentCostChanges();

      expect(mockedPrisma.costHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20 })
      );
    });

    it('should handle custom limit', async () => {
      (mockedPrisma.costHistory.findMany as jest.Mock).mockResolvedValue([]);

      await getRecentCostChanges(5);

      expect(mockedPrisma.costHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 })
      );
    });
  });

  describe('revertCostChange', () => {
    it('should revert a cost change', async () => {
      const originalHistory = {
        id: 1,
        stockItemId: 'stock-1',
        previousCost: new Decimal(10),
        newCost: new Decimal(12),
        changePercent: new Decimal(20),
        reason: 'Price increase',
        stockItem: { id: 'stock-1', name: 'Test' },
      };

      const mockStockItem = {
        id: 'stock-1',
        name: 'Test',
        standardCost: new Decimal(12),
      };

      const mockNewHistory = {
        id: 2,
        stockItemId: 'stock-1',
        previousCost: 12,
        newCost: 10,
        changePercent: -16.67,
        reason: 'Revert: Price increase',
        effectiveFrom: new Date(),
        notes: null,
        createdBy: 1,
        createdAt: new Date(),
        stockItem: mockStockItem,
        user: { id: 1, name: 'Admin' },
      };

      (mockedPrisma.costHistory.findUnique as jest.Mock).mockResolvedValue(originalHistory);

      const mockTransaction = jest.fn(async (callback) => {
        return callback({
          stockItem: {
            findUnique: jest.fn().mockResolvedValue(mockStockItem),
            update: jest.fn().mockResolvedValue(mockStockItem),
          },
          costHistory: {
            create: jest.fn().mockResolvedValue(mockNewHistory),
          },
        });
      });

      (mockedPrisma.$transaction as jest.Mock) = mockTransaction;
      (mockedPrisma.stockConsumption.findMany as jest.Mock).mockResolvedValue([]);
      mockedUpdateVariantCost.mockResolvedValue(null);

      const result = await revertCostChange(1, 1);

      expect(result.previousCost).toBe(12);
      expect(result.newCost).toBe(10);
      expect(result.reason).toContain('Revert:');
    });

    it('should throw error for non-existent history', async () => {
      (mockedPrisma.costHistory.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(revertCostChange(999, 1)).rejects.toThrow(
        'CostHistory with id 999 not found'
      );
    });
  });
});
