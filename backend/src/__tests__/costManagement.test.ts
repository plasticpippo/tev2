import request from 'supertest';
import express from 'express';
import { costManagementRouter } from '../handlers/costManagement';

// Mock services
jest.mock('../services/costCalculationService', () => ({
  updateVariantTheoreticalCost: jest.fn(),
  getVariantCostBreakdown: jest.fn(),
  recalculateAllVariantCosts: jest.fn(),
}));

jest.mock('../services/costHistoryService', () => ({
  updateIngredientCost: jest.fn(),
  getCostHistory: jest.fn(),
  getRecentCostChanges: jest.fn(),
}));

jest.mock('../services/varianceService', () => ({
  generateVarianceReport: jest.fn(),
  getVarianceReport: jest.fn(),
  getVarianceReports: jest.fn(),
  updateVarianceReportStatus: jest.fn(),
}));

jest.mock('../prisma', () => ({
  prisma: {
    stockItem: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    productVariant: {
      findMany: jest.fn(),
    },
    inventoryCount: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock auth middleware to always inject admin user
jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, _res: any, next: any) => {
    req.user = { id: 1, username: 'admin', role: 'Admin' };
    next();
  },
}));

jest.mock('../middleware/authorization', () => ({
  requireAdmin: (_req: any, _res: any, next: any) => {
    next();
  },
}));

jest.mock('../utils/logger', () => ({
  logError: jest.fn(),
  logInfo: jest.fn(),
  logDebug: jest.fn(),
}));

jest.mock('../i18n', () => ({
  __esModule: true,
  default: {
    t: (key: string) => key,
  },
}));

import { updateIngredientCost, getCostHistory, getRecentCostChanges } from '../services/costHistoryService';
import { updateVariantTheoreticalCost, getVariantCostBreakdown, recalculateAllVariantCosts } from '../services/costCalculationService';
import { getVarianceReports, getVarianceReport, generateVarianceReport, updateVarianceReportStatus } from '../services/varianceService';

const mockPrisma = require('../prisma').prisma;
const mockedUpdateIngredientCost = updateIngredientCost as jest.MockedFunction<typeof updateIngredientCost>;
const mockedGetCostHistory = getCostHistory as jest.MockedFunction<typeof getCostHistory>;
const mockedGetRecentCostChanges = getRecentCostChanges as jest.MockedFunction<typeof getRecentCostChanges>;
const mockedUpdateVariantCost = updateVariantTheoreticalCost as jest.MockedFunction<typeof updateVariantTheoreticalCost>;
const mockedGetVariantCostBreakdown = getVariantCostBreakdown as jest.MockedFunction<typeof getVariantCostBreakdown>;
const mockedRecalculateAll = recalculateAllVariantCosts as jest.MockedFunction<typeof recalculateAllVariantCosts>;
const mockedGetVarianceReports = getVarianceReports as jest.MockedFunction<typeof getVarianceReports>;
const mockedGetVarianceReport = getVarianceReport as jest.MockedFunction<typeof getVarianceReport>;
const mockedGenerateVarianceReport = generateVarianceReport as jest.MockedFunction<typeof generateVarianceReport>;
const mockedUpdateVarianceReportStatus = updateVarianceReportStatus as jest.MockedFunction<typeof updateVarianceReportStatus>;

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/cost-management', costManagementRouter);
  return app;
}

describe('costManagement routes', () => {
  let app: express.Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  // ========================================
  // GET /ingredients
  // ========================================
  describe('GET /api/cost-management/ingredients', () => {
    it('should return ingredients with cost info', async () => {
      mockPrisma.stockItem.findMany.mockResolvedValue([
        {
          id: 'uuid-1',
          name: 'Vodka',
          type: 'Spirits',
          baseUnit: 'ml',
          standardCost: { toNumber: () => 18.5 } as any,
          costPerUnit: { toNumber: () => 18.5 } as any,
          lastCostUpdate: new Date('2026-04-01'),
          costUpdateReason: 'Initial',
        },
      ] as any);

      const res = await request(app).get('/api/cost-management/ingredients');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Vodka');
      expect(res.body[0].costStatus).toBeDefined();
    });

    it('should filter by search term', async () => {
      mockPrisma.stockItem.findMany.mockResolvedValue([]);

      const res = await request(app).get('/api/cost-management/ingredients?search=Vodka');

      expect(res.status).toBe(200);
      expect(mockPrisma.stockItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.objectContaining({ contains: 'Vodka' }),
          }),
        })
      );
    });
  });

  // ========================================
  // GET /ingredients/:id
  // ========================================
  describe('GET /api/cost-management/ingredients/:id', () => {
    it('should return 404 for missing ingredient', async () => {
      mockPrisma.stockItem.findUnique.mockResolvedValue(null);

      const res = await request(app).get('/api/cost-management/ingredients/uuid-missing');

      expect(res.status).toBe(404);
    });

    it('should return ingredient with history', async () => {
      mockPrisma.stockItem.findUnique.mockResolvedValue({
        id: 'uuid-1',
        name: 'Vodka',
        type: 'Spirits',
        baseUnit: 'ml',
        standardCost: { toNumber: () => 18.5 } as any,
        costPerUnit: { toNumber: () => 18.5 } as any,
        lastCostUpdate: new Date('2026-04-01'),
        costUpdateReason: 'Initial',
        costHistory: [],
      } as any);

      const res = await request(app).get('/api/cost-management/ingredients/uuid-1');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Vodka');
    });
  });

  // ========================================
  // POST /ingredients/:id/cost
  // ========================================
  describe('POST /api/cost-management/ingredients/:id/cost', () => {
    it('should reject invalid cost (zero)', async () => {
      const res = await request(app)
        .post('/api/cost-management/ingredients/uuid-1/cost')
        .send({ cost: 0, reason: 'Test' });

      expect(res.status).toBe(400);
    });

    it('should reject missing reason', async () => {
      const res = await request(app)
        .post('/api/cost-management/ingredients/uuid-1/cost')
        .send({ cost: 15 });

      expect(res.status).toBe(400);
    });

    it('should reject non-existent stock item', async () => {
      mockPrisma.stockItem.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/cost-management/ingredients/uuid-missing/cost')
        .send({ cost: 15, reason: 'Update' });

      expect(res.status).toBe(404);
    });

    it('should update cost successfully', async () => {
      mockPrisma.stockItem.findUnique.mockResolvedValue({
        id: 'uuid-1',
        name: 'Vodka',
      } as any);
      mockedUpdateIngredientCost.mockResolvedValue({
        id: 1,
        stockItemId: 'uuid-1',
        previousCost: 17.5,
        newCost: 18.5,
        changePercent: 5.71,
        reason: 'Update',
        effectiveFrom: new Date(),
        notes: null,
        createdBy: 1,
        createdAt: new Date(),
        stockItemName: 'Vodka',
        createdByName: 'Admin',
      });

      const res = await request(app)
        .post('/api/cost-management/ingredients/uuid-1/cost')
        .send({ cost: 18.5, reason: 'Supplier price increase', notes: 'New contract' });

      expect(res.status).toBe(200);
      expect(res.body.newCost).toBe(18.5);
    });
  });

  // ========================================
  // GET /recent-changes
  // ========================================
  describe('GET /api/cost-management/recent-changes', () => {
    it('should return recent changes with default limit', async () => {
      mockedGetRecentCostChanges.mockResolvedValue([]);

      const res = await request(app).get('/api/cost-management/recent-changes');

      expect(res.status).toBe(200);
      expect(mockedGetRecentCostChanges).toHaveBeenCalledWith(20);
    });

    it('should reject invalid limit', async () => {
      const res = await request(app).get('/api/cost-management/recent-changes?limit=0');

      expect(res.status).toBe(400);
    });

    it('should reject limit over 100', async () => {
      const res = await request(app).get('/api/cost-management/recent-changes?limit=200');

      expect(res.status).toBe(400);
    });
  });

  // ========================================
  // GET /variants/cost-summary
  // ========================================
  describe('GET /api/cost-management/variants/cost-summary', () => {
    it('should return variant cost summary', async () => {
      mockPrisma.productVariant.findMany.mockResolvedValue([
        {
          id: 1,
          name: 'Mojito',
          price: { toNumber: () => 12 } as any,
          theoreticalCost: { toNumber: () => 3.25 } as any,
          currentMargin: { toNumber: () => 72.92 } as any,
          costStatus: 'current',
          lastCostCalc: new Date(),
          productId: 1,
          product: {
            name: 'Mojito',
            category: { name: 'Cocktails' },
          },
        },
      ] as any);

      const res = await request(app).get('/api/cost-management/variants/cost-summary');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Mojito');
    });
  });

  // ========================================
  // POST /bulk-recalculate
  // ========================================
  describe('POST /api/cost-management/bulk-recalculate', () => {
    it('should recalculate all variants', async () => {
      mockedRecalculateAll.mockResolvedValue({ updated: 35, failed: 0, skipped: 4 });

      const res = await request(app).post('/api/cost-management/bulk-recalculate');

      expect(res.status).toBe(200);
      expect(res.body.updated).toBe(35);
    });
  });

  // ========================================
  // Inventory Counts
  // ========================================
  describe('POST /api/cost-management/inventory-counts', () => {
    it('should reject missing countDate', async () => {
      const res = await request(app)
        .post('/api/cost-management/inventory-counts')
        .send({ countType: 'full', items: [{ stockItemId: 'uuid-1', quantity: 10 }] });

      expect(res.status).toBe(400);
    });

    it('should reject invalid countType', async () => {
      const res = await request(app)
        .post('/api/cost-management/inventory-counts')
        .send({ countDate: '2026-04-10', countType: 'annual', items: [{ stockItemId: 'uuid-1', quantity: 10 }] });

      expect(res.status).toBe(400);
    });

    it('should reject empty items', async () => {
      const res = await request(app)
        .post('/api/cost-management/inventory-counts')
        .send({ countDate: '2026-04-10', countType: 'full', items: [] });

      expect(res.status).toBe(400);
    });

    it('should create inventory count with auto-calculated costs', async () => {
      mockPrisma.stockItem.findMany.mockResolvedValue([
        {
          id: 'uuid-1',
          name: 'Vodka',
          standardCost: { toNumber: () => 18.5 } as any,
        },
      ] as any);
      mockPrisma.inventoryCount.create.mockResolvedValue({
        id: 1,
        countDate: new Date('2026-04-10'),
        countType: 'full',
        status: 'draft',
        notes: null,
        createdBy: 1,
        createdAt: new Date(),
        submittedAt: null,
        approvedAt: null,
        approvedBy: null,
        items: [
          {
            id: 1,
            stockItemId: 'uuid-1',
            quantity: 10,
            unitCost: 18.5,
            extendedValue: 185,
            notes: null,
            stockItem: { name: 'Vodka' },
          },
        ],
      } as any);

      const res = await request(app)
        .post('/api/cost-management/inventory-counts')
        .send({
          countDate: '2026-04-10',
          countType: 'full',
          items: [{ stockItemId: 'uuid-1', quantity: 10 }],
        });

      expect(res.status).toBe(201);
    });
  });

  // ========================================
  // Variance Reports
  // ========================================
  describe('POST /api/cost-management/variance-reports/generate', () => {
    it('should reject missing periodStart', async () => {
      const res = await request(app)
        .post('/api/cost-management/variance-reports/generate')
        .send({ periodEnd: '2026-04-10' });

      expect(res.status).toBe(400);
    });

    it('should reject invalid period range', async () => {
      const res = await request(app)
        .post('/api/cost-management/variance-reports/generate')
        .send({ periodStart: '2026-04-10', periodEnd: '2026-04-01' });

      expect(res.status).toBe(400);
    });

    it('should generate a variance report', async () => {
      mockedGenerateVarianceReport.mockResolvedValue({
        id: 1,
        periodStart: new Date('2026-04-01'),
        periodEnd: new Date('2026-04-07'),
        status: 'draft',
        theoreticalCost: 100,
        actualCost: 105,
        varianceValue: 5,
        variancePercent: 5,
        createdBy: 1,
        createdByName: 'Admin',
        createdAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        reviewedByName: null,
        itemCount: 3,
        items: [],
        beginningCount: null,
        endingCount: null,
      });

      const res = await request(app)
        .post('/api/cost-management/variance-reports/generate')
        .send({ periodStart: '2026-04-01', periodEnd: '2026-04-07' });

      expect(res.status).toBe(201);
      expect(res.body.theoreticalCost).toBe(100);
    });
  });

  describe('PATCH /api/cost-management/variance-reports/:id/status', () => {
    it('should reject invalid status', async () => {
      const res = await request(app)
        .patch('/api/cost-management/variance-reports/1/status')
        .send({ status: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('should update status to reviewed', async () => {
      mockedUpdateVarianceReportStatus.mockResolvedValue({
        id: 1,
        periodStart: new Date('2026-04-01'),
        periodEnd: new Date('2026-04-07'),
        status: 'reviewed',
        theoreticalCost: 100,
        actualCost: 105,
        varianceValue: 5,
        variancePercent: 5,
        createdBy: 1,
        createdByName: 'Admin',
        createdAt: new Date(),
        reviewedAt: new Date(),
        reviewedBy: 1,
        reviewedByName: 'Admin',
        itemCount: 3,
      });

      const res = await request(app)
        .patch('/api/cost-management/variance-reports/1/status')
        .send({ status: 'reviewed' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('reviewed');
    });
  });
});
