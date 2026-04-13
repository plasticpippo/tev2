import {
  getProfitSummary,
  getProfitComparison,
  getMarginByCategory,
  getMarginByProduct,
  getMarginTrend,
} from '../services/analyticsService';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('../prisma', () => ({
  prisma: {
    transaction: {
      findMany: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = require('../prisma').prisma;

function makeTransaction(overrides: {
  id?: number;
  subtotal?: number;
  totalCost?: number | null;
  status?: string;
  createdAt?: Date;
  items?: any[];
}) {
  return {
    id: overrides.id ?? 1,
    items: overrides.items ?? [],
    subtotal: new Decimal(overrides.subtotal ?? 100),
    tax: new Decimal(10),
    tip: new Decimal(0),
    total: new Decimal(110),
    discount: new Decimal(0),
    discountReason: null,
    status: overrides.status ?? 'completed',
    paymentMethod: 'cash',
    userId: 1,
    userName: 'admin',
    tillId: 1,
    tillName: 'Till 1',
    createdAt: overrides.createdAt ?? new Date('2026-04-10T12:00:00'),
    version: 0,
    idempotencyKey: null,
    idempotencyCreatedAt: null,
    totalCost: overrides.totalCost !== undefined && overrides.totalCost !== null
      ? new Decimal(overrides.totalCost)
      : null,
    costCalculatedAt: overrides.totalCost ? new Date() : null,
    grossMargin: overrides.totalCost !== undefined && overrides.totalCost !== null
      ? new Decimal((overrides.subtotal ?? 100) - overrides.totalCost)
      : null,
    marginPercent: overrides.totalCost !== undefined && overrides.totalCost !== null
      ? new Decimal(((overrides.subtotal ?? 100) - overrides.totalCost) / (overrides.subtotal ?? 100) * 100)
      : null,
    voidedAt: null,
    voidReason: null,
    voidedBy: null,
  } as any;
}

describe('analyticsService - Profit Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // getProfitSummary
  // ========================================
  describe('getProfitSummary', () => {
    it('should return correct summary for transactions with cost data', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        makeTransaction({ id: 1, subtotal: 200, totalCost: 60 }),
        makeTransaction({ id: 2, subtotal: 150, totalCost: 45 }),
        makeTransaction({ id: 3, subtotal: 100, totalCost: null }),
      ]);

      const result = await getProfitSummary('2026-04-01', '2026-04-10');

      expect(result.period).toEqual({ start: '2026-04-01', end: '2026-04-10' });
      expect(result.revenue).toBe(450);
      expect(result.cogs).toBe(105);
      expect(result.grossProfit).toBe(345);
      expect(result.transactionCount).toBe(3);
      expect(result.transactionsWithCosts).toBe(2);
      expect(result.costCoveragePercent).toBeGreaterThan(60);
      expect(result.costCoveragePercent).toBeLessThan(70);
    });

    it('should return zeros when no transactions exist', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      const result = await getProfitSummary('2026-04-01', '2026-04-10');

      expect(result.revenue).toBe(0);
      expect(result.cogs).toBe(0);
      expect(result.grossProfit).toBe(0);
      expect(result.transactionCount).toBe(0);
      expect(result.marginPercent).toBe(0);
      expect(result.averageTransaction).toBe(0);
      expect(result.transactionsWithCosts).toBe(0);
      expect(result.costCoveragePercent).toBe(0);
    });

    it('should handle transactions where all have cost data', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        makeTransaction({ id: 1, subtotal: 100, totalCost: 30 }),
      ]);

      const result = await getProfitSummary('2026-04-01', '2026-04-10');

      expect(result.transactionsWithCosts).toBe(1);
      expect(result.costCoveragePercent).toBe(100);
      expect(result.averageMargin).toBeGreaterThan(0);
    });

    it('should calculate margin percent correctly', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        makeTransaction({ id: 1, subtotal: 100, totalCost: 25 }),
      ]);

      const result = await getProfitSummary('2026-04-01', '2026-04-10');

      expect(result.marginPercent).toBe(75);
    });
  });

  // ========================================
  // getProfitComparison
  // ========================================
  describe('getProfitComparison', () => {
    it('should compare current vs previous period', async () => {
      // First call: current period, Second call: previous period
      mockPrisma.transaction.findMany
        .mockResolvedValueOnce([
          makeTransaction({ id: 1, subtotal: 200, totalCost: 60 }),
        ])
        .mockResolvedValueOnce([
          makeTransaction({ id: 2, subtotal: 150, totalCost: 50 }),
        ]);

      const result = await getProfitComparison('2026-04-08', '2026-04-10');

      expect(result.current.revenue).toBe(200);
      expect(result.previous.revenue).toBe(150);
      expect(result.changes.revenueChange).toBe(50);
      expect(result.changes.revenueChangePercent).toBeGreaterThan(0);
    });

    it('should handle previous period with no transactions', async () => {
      mockPrisma.transaction.findMany
        .mockResolvedValueOnce([
          makeTransaction({ id: 1, subtotal: 100, totalCost: 30 }),
        ])
        .mockResolvedValueOnce([]);

      const result = await getProfitComparison('2026-04-08', '2026-04-10');

      expect(result.current.revenue).toBe(100);
      expect(result.previous.revenue).toBe(0);
      expect(result.changes.revenueChange).toBe(100);
    });
  });

  // ========================================
  // getMarginByCategory
  // ========================================
  describe('getMarginByCategory', () => {
    it('should aggregate margins by category', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        makeTransaction({
          id: 1,
          subtotal: 100,
          totalCost: 30,
          items: [
            { productId: 1, variantId: 1, quantity: 2, price: 50 },
          ],
        }),
      ]);

      mockPrisma.product.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Test Product',
          categoryId: 1,
          category: { id: 1, name: 'Spirits', visibleTillIds: null },
          variants: [],
        } as any,
      ]);

      const result = await getMarginByCategory('2026-04-01', '2026-04-10');

      expect(result).toHaveLength(1);
      expect(result[0].categoryName).toBe('Spirits');
      expect(result[0].revenue).toBe(100);
      expect(result[0].cogs).toBe(30);
      expect(result[0].itemsSold).toBe(2);
    });

    it('should return empty array when no transactions', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.product.findMany.mockResolvedValue([]);

      const result = await getMarginByCategory('2026-04-01', '2026-04-10');

      expect(result).toEqual([]);
    });
  });

  // ========================================
  // getMarginByProduct
  // ========================================
  describe('getMarginByProduct', () => {
    it('should calculate per-product margins using theoreticalCost', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        makeTransaction({
          id: 1,
          subtotal: 100,
          totalCost: 30,
          items: [
            { productId: 1, variantId: 10, quantity: 2, price: 50 },
          ],
        }),
      ]);

      mockPrisma.productVariant.findMany.mockResolvedValue([
        {
          id: 10,
          productId: 1,
          name: 'Mojito',
          price: new Decimal(50),
          isFavourite: false,
          themeColor: 'slate',
          taxRateId: null,
          theoreticalCost: new Decimal(15),
          currentMargin: new Decimal(70),
          lastCostCalc: new Date(),
          costStatus: 'current',
          product: {
            id: 1,
            name: 'Mojito',
            categoryId: 1,
            category: { id: 1, name: 'Cocktails', visibleTillIds: null },
            variants: [],
          },
        } as any,
      ]);

      const result = await getMarginByProduct('2026-04-01', '2026-04-10');

      expect(result.length).toBeGreaterThan(0);
      const mojito = result.find(r => r.variantId === 10);
      expect(mojito).toBeDefined();
      expect(mojito!.revenue).toBe(100);
      expect(mojito!.cogs).toBe(30);
      expect(mojito!.quantitySold).toBe(2);
      expect(mojito!.hasCostData).toBe(true);
    });

    it('should apply limit parameter', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.productVariant.findMany.mockResolvedValue([]);

      const result = await getMarginByProduct('2026-04-01', '2026-04-10', 5);

      expect(result).toEqual([]);
    });
  });

  // ========================================
  // getMarginTrend
  // ========================================
  describe('getMarginTrend', () => {
    it('should return daily trend data from a single query', async () => {
      // Use UTC dates to avoid timezone issues with toISOString()
      const apr1 = new Date('2026-04-01T12:00:00Z');
      const apr1b = new Date('2026-04-01T18:00:00Z');
      const apr2 = new Date('2026-04-02T14:00:00Z');

      mockPrisma.transaction.findMany.mockResolvedValue([
        makeTransaction({
          id: 1,
          subtotal: 200,
          totalCost: 60,
          createdAt: apr1,
        }),
        makeTransaction({
          id: 2,
          subtotal: 100,
          totalCost: 30,
          createdAt: apr1b,
        }),
        makeTransaction({
          id: 3,
          subtotal: 150,
          totalCost: 40,
          createdAt: apr2,
        }),
      ]);

      const result = await getMarginTrend('2026-04-01', '2026-04-02');

      expect(result).toHaveLength(2);

      // Group by UTC date to avoid timezone issues
      const day1 = result.find(r => r.date === '2026-04-01');
      const day2 = result.find(r => r.date === '2026-04-02');

      expect(day1).toBeDefined();
      expect(day1!.revenue).toBe(300);
      expect(day1!.cogs).toBe(90);
      expect(day1!.transactionCount).toBe(2);

      expect(day2).toBeDefined();
      expect(day2!.revenue).toBe(150);
      expect(day2!.cogs).toBe(40);
      expect(day2!.transactionCount).toBe(1);
    });

    it('should return zero-revenue days when no transactions exist', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      const result = await getMarginTrend('2026-04-01', '2026-04-03');

      expect(result).toHaveLength(3);
      result.forEach(point => {
        expect(point.revenue).toBe(0);
        expect(point.cogs).toBe(0);
        expect(point.transactionCount).toBe(0);
        expect(point.marginPercent).toBe(0);
      });
    });

    it('should handle transactions without cost data', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([
        makeTransaction({
          id: 1,
          subtotal: 100,
          totalCost: null,
          createdAt: new Date('2026-04-01T12:00:00'),
        }),
      ]);

      const result = await getMarginTrend('2026-04-01', '2026-04-01');

      expect(result).toHaveLength(1);
      expect(result[0].revenue).toBe(100);
      expect(result[0].cogs).toBe(0);
      expect(result[0].grossProfit).toBe(100);
      expect(result[0].marginPercent).toBe(100);
    });

    it('should use a single database query regardless of date range', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);

      await getMarginTrend('2026-04-01', '2026-04-30');

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledTimes(1);
    });
  });
});
