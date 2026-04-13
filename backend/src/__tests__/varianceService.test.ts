import {
  generateVarianceReport,
  getVarianceReport,
  getVarianceReports,
  updateVarianceReportStatus,
} from '../services/varianceService';
import { Decimal } from '@prisma/client/runtime/library';

jest.mock('../prisma', () => {
  const mockPrisma = {
    inventoryCount: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    inventoryCountItem: {
      findMany: jest.fn(),
    },
    stockAdjustment: {
      findMany: jest.fn(),
    },
    transaction: {
      findMany: jest.fn(),
    },
    stockConsumption: {
      findMany: jest.fn(),
    },
    stockItem: {
      findMany: jest.fn(),
    },
    varianceReport: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    varianceReportItem: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  return { prisma: mockPrisma };
});

const mockPrisma = require('../prisma').prisma;

function makeVarianceReport(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id ?? 1,
    periodStart: overrides.periodStart ?? new Date('2026-04-01'),
    periodEnd: overrides.periodEnd ?? new Date('2026-04-07'),
    status: overrides.status ?? 'draft',
    theoreticalCost: new Decimal(overrides.theoreticalCost ?? 100),
    actualCost: new Decimal(overrides.actualCost ?? 105),
    varianceValue: new Decimal(overrides.varianceValue ?? 5),
    variancePercent: new Decimal(overrides.variancePercent ?? 5),
    beginningCountId: overrides.beginningCountId ?? null,
    endingCountId: overrides.endingCountId ?? null,
    createdBy: overrides.createdBy ?? 1,
    createdAt: new Date(),
    reviewedAt: overrides.reviewedAt ?? null,
    reviewedBy: overrides.reviewedBy ?? null,
    user: { id: 1, name: 'Admin' },
    reviewer: overrides.reviewer ?? null,
    items: overrides.items ?? [],
  };
}

describe('varianceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ========================================
  // getVarianceReports (list)
  // ========================================
  describe('getVarianceReports', () => {
    it('should return paginated reports', async () => {
      const reports = [
        makeVarianceReport({ id: 1 }),
        makeVarianceReport({ id: 2 }),
      ];

      mockPrisma.varianceReport.findMany.mockResolvedValue(reports as any);
      mockPrisma.varianceReport.count.mockResolvedValue(2);

      const result = await getVarianceReports(1, 20);

      expect(result.reports).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.reports[0].createdByName).toBe('Admin');
    });

    it('should return empty list when no reports exist', async () => {
      mockPrisma.varianceReport.findMany.mockResolvedValue([]);
      mockPrisma.varianceReport.count.mockResolvedValue(0);

      const result = await getVarianceReports(1, 20);

      expect(result.reports).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  // ========================================
  // getVarianceReport (single)
  // ========================================
  describe('getVarianceReport', () => {
    it('should return null when report not found', async () => {
      mockPrisma.varianceReport.findUnique.mockResolvedValue(null);

      const result = await getVarianceReport(999);

      expect(result).toBeNull();
    });

    it('should return detailed report with items', async () => {
      const report = makeVarianceReport({
        id: 1,
        items: [
          {
            id: 1,
            stockItemId: 'uuid-1',
            theoreticalQty: new Decimal(10),
            actualQty: new Decimal(11),
            varianceQty: new Decimal(1),
            unitCost: new Decimal(5),
            varianceValue: new Decimal(5),
            variancePercent: new Decimal(10),
            status: 'warning',
            notes: null,
            stockItem: { id: 'uuid-1', name: 'Vodka' },
          },
        ],
      });

      mockPrisma.varianceReport.findUnique.mockResolvedValue(report as any);
      mockPrisma.inventoryCount.findUnique.mockResolvedValue(null);

      const result = await getVarianceReport(1);

      expect(result).not.toBeNull();
      expect(result!.items).toHaveLength(1);
      expect(result!.items[0].stockItemName).toBe('Vodka');
      expect(result!.items[0].variancePercent).toBe(10);
    });
  });

  // ========================================
  // updateVarianceReportStatus
  // ========================================
  describe('updateVarianceReportStatus', () => {
    it('should allow draft -> reviewed transition', async () => {
      mockPrisma.varianceReport.findUnique.mockResolvedValue(
        makeVarianceReport({ status: 'draft' }) as any
      );
      mockPrisma.varianceReport.update.mockResolvedValue(
        makeVarianceReport({ status: 'reviewed', reviewedAt: new Date(), reviewedBy: 1, reviewer: { id: 1, name: 'Admin' } }) as any
      );

      const result = await updateVarianceReportStatus(1, 'reviewed', 1);

      expect(result.status).toBe('reviewed');
    });

    it('should allow reviewed -> final transition', async () => {
      mockPrisma.varianceReport.findUnique.mockResolvedValue(
        makeVarianceReport({ status: 'reviewed' }) as any
      );
      mockPrisma.varianceReport.update.mockResolvedValue(
        makeVarianceReport({ status: 'final' }) as any
      );

      const result = await updateVarianceReportStatus(1, 'final', 1);

      expect(result.status).toBe('final');
    });

    it('should reject draft -> final direct transition', async () => {
      mockPrisma.varianceReport.findUnique.mockResolvedValue(
        makeVarianceReport({ status: 'draft' }) as any
      );

      await expect(
        updateVarianceReportStatus(1, 'final', 1)
      ).rejects.toThrow('Cannot transition from "draft" to "final"');
    });

    it('should reject reviewed -> draft backwards transition', async () => {
      mockPrisma.varianceReport.findUnique.mockResolvedValue(
        makeVarianceReport({ status: 'reviewed' }) as any
      );

      await expect(
        updateVarianceReportStatus(1, 'draft')
      ).rejects.toThrow('Cannot transition from "reviewed" to "draft"');
    });

    it('should reject final -> any transition', async () => {
      mockPrisma.varianceReport.findUnique.mockResolvedValue(
        makeVarianceReport({ status: 'final' }) as any
      );

      await expect(
        updateVarianceReportStatus(1, 'reviewed', 1)
      ).rejects.toThrow('Cannot transition from "final" to "reviewed"');
    });

    it('should throw when report not found', async () => {
      mockPrisma.varianceReport.findUnique.mockResolvedValue(null);

      await expect(
        updateVarianceReportStatus(999, 'reviewed', 1)
      ).rejects.toThrow('not found');
    });

    it('should require reviewedBy for reviewed status', async () => {
      await expect(
        updateVarianceReportStatus(1, 'reviewed')
      ).rejects.toThrow('reviewedBy is required');
    });

    it('should reject invalid status values', async () => {
      await expect(
        updateVarianceReportStatus(1, 'invalid_status' as any)
      ).rejects.toThrow('Invalid status');
    });
  });

  // ========================================
  // generateVarianceReport
  // ========================================
  describe('generateVarianceReport', () => {
    it('should reject periodStart >= periodEnd', async () => {
      await expect(
        generateVarianceReport(new Date('2026-04-10'), new Date('2026-04-01'), 1)
      ).rejects.toThrow('periodStart must be before periodEnd');
    });

    it('should generate report with theoretical usage from transactions', async () => {
      // No inventory counts
      mockPrisma.inventoryCount.findFirst.mockResolvedValue(null);
      // No stock additions
      mockPrisma.stockAdjustment.findMany.mockResolvedValue([]);
      // Transactions with items
      mockPrisma.transaction.findMany.mockResolvedValue([
        {
          items: [
            { variantId: 1, quantity: 2, productId: 1, price: 10 },
          ],
        },
      ] as any);
      // Recipe for variant
      mockPrisma.stockConsumption.findMany.mockResolvedValue([
        {
          variantId: 1,
          stockItemId: 'uuid-1',
          quantity: 3,
          stockItem: { id: 'uuid-1', name: 'Vodka', standardCost: new Decimal(10) },
        },
      ] as any);
      // Stock item data
      mockPrisma.stockItem.findMany.mockResolvedValue([
        {
          id: 'uuid-1',
          name: 'Vodka',
          standardCost: new Decimal(10),
          quantity: 50,
          type: 'Spirits',
          baseUnit: 'ml',
        } as any,
      ]);

      // Mock $transaction to simulate Prisma interactive transaction
      const mockCreatedReport = {
        id: 1,
        periodStart: new Date('2026-04-01'),
        periodEnd: new Date('2026-04-07'),
        status: 'draft',
        theoreticalCost: new Decimal(60),
        actualCost: new Decimal(0),
        varianceValue: new Decimal(-60),
        variancePercent: new Decimal(100),
        beginningCountId: null,
        endingCountId: null,
        createdBy: 1,
        createdAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        user: { id: 1, name: 'Admin' },
        reviewer: null,
        items: [],
      };

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const reportWithItems = {
          ...mockCreatedReport,
          items: [{
            id: 1,
            varianceReportId: 1,
            stockItemId: 'uuid-1',
            theoreticalQty: new Decimal(6),
            actualQty: new Decimal(0),
            varianceQty: new Decimal(-6),
            unitCost: new Decimal(10),
            varianceValue: new Decimal(-60),
            variancePercent: new Decimal(100),
            status: 'critical',
            notes: 'No inventory count data available',
            stockItem: { id: 'uuid-1', name: 'Vodka' },
          }],
        };

        const mockTx = {
          varianceReport: {
            create: jest.fn().mockResolvedValue(mockCreatedReport),
            findUnique: jest.fn().mockResolvedValue(reportWithItems),
          },
          varianceReportItem: {
            createMany: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      const result = await generateVarianceReport(
        new Date('2026-04-01'),
        new Date('2026-04-07'),
        1
      );

      expect(result).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    });
  });
});
