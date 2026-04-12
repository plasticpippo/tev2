import express, { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { updateVariantTheoreticalCost, getVariantCostBreakdown, recalculateAllVariantCosts } from '../services/costCalculationService';
import { updateIngredientCost, getCostHistory, getRecentCostChanges } from '../services/costHistoryService';
import { generateVarianceReport, getVarianceReport, getVarianceReports, updateVarianceReportStatus } from '../services/varianceService';
import { logError } from '../utils/logger';
import i18n from '../i18n';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import { decimalToNumber } from '../utils/money';

export const costManagementRouter = express.Router();

function getCostStatus(standardCost: Prisma.Decimal, lastCostUpdate: Date): string {
  if (decimalToNumber(standardCost) === 0) return 'pending';
  const now = new Date();
  const diffMs = now.getTime() - new Date(lastCostUpdate).getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 30) return 'current';
  if (diffDays <= 90) return 'stale';
  return 'outdated';
}

// GET /api/cost-management/ingredients - List all ingredients with cost info
costManagementRouter.get('/ingredients', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { search, category } = req.query;

    const where: any = {};
    if (search && typeof search === 'string') {
      where.name = { contains: search, mode: 'insensitive' };
    }
    if (category && typeof category === 'string') {
      where.type = category;
    }

    const items = await prisma.stockItem.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const result = items.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      baseUnit: item.baseUnit,
      standardCost: decimalToNumber(item.standardCost),
      costPerUnit: decimalToNumber(item.costPerUnit),
      lastCostUpdate: item.lastCostUpdate,
      costUpdateReason: item.costUpdateReason,
      costStatus: getCostStatus(item.standardCost, item.lastCostUpdate),
    }));

    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching ingredients cost info', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.ingredients.fetchFailed') });
  }
});

// GET /api/cost-management/ingredients/:id - Get single ingredient with cost details
costManagementRouter.get('/ingredients/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await prisma.stockItem.findUnique({
      where: { id },
      include: {
        costHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    if (!item) {
      res.status(404).json({ error: i18n.t('errors.costManagement.ingredients.notFound') });
      return;
    }

    const result = {
      id: item.id,
      name: item.name,
      type: item.type,
      baseUnit: item.baseUnit,
      standardCost: decimalToNumber(item.standardCost),
      costPerUnit: decimalToNumber(item.costPerUnit),
      lastCostUpdate: item.lastCostUpdate,
      costUpdateReason: item.costUpdateReason,
      costStatus: getCostStatus(item.standardCost, item.lastCostUpdate),
      recentHistory: item.costHistory.map((h) => ({
        id: h.id,
        previousCost: decimalToNumber(h.previousCost),
        newCost: decimalToNumber(h.newCost),
        changePercent: decimalToNumber(h.changePercent),
        reason: h.reason,
        effectiveFrom: h.effectiveFrom,
        createdBy: h.createdBy,
        createdByName: h.user?.name ?? '',
        createdAt: h.createdAt,
      })),
    };

    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching ingredient cost details', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.ingredients.fetchFailed') });
  }
});

// POST /api/cost-management/ingredients/:id/cost - Update ingredient standard cost
costManagementRouter.post('/ingredients/:id/cost', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cost, reason, effectiveDate, notes } = req.body;
    const userId = (req as any).user?.id;

    if (!cost || typeof cost !== 'number' || cost <= 0) {
      res.status(400).json({ error: i18n.t('errors.costManagement.ingredients.invalidCost') });
      return;
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      res.status(400).json({ error: i18n.t('errors.costManagement.ingredients.reasonRequired') });
      return;
    }

    const stockItem = await prisma.stockItem.findUnique({ where: { id } });
    if (!stockItem) {
      res.status(404).json({ error: i18n.t('errors.costManagement.ingredients.notFound') });
      return;
    }

    const effectiveFrom = effectiveDate ? new Date(effectiveDate) : undefined;

    const result = await updateIngredientCost(id, cost, reason.trim(), userId, effectiveFrom);
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating ingredient cost', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.ingredients.updateFailed') });
  }
});

// GET /api/cost-management/ingredients/:id/history - Get full cost history for ingredient
costManagementRouter.get('/ingredients/:id/history', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const stockItem = await prisma.stockItem.findUnique({ where: { id } });
    if (!stockItem) {
      res.status(404).json({ error: i18n.t('errors.costManagement.ingredients.notFound') });
      return;
    }

    const history = await getCostHistory(id);
    res.json(history);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching ingredient cost history', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.ingredients.historyFetchFailed') });
  }
});

// GET /api/cost-management/recent-changes - Get recent cost changes
costManagementRouter.get('/recent-changes', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    if (isNaN(limit) || limit < 1 || limit > 100) {
      res.status(400).json({ error: i18n.t('errors.costManagement.recentChanges.invalidLimit') });
      return;
    }

    const changes = await getRecentCostChanges(limit);
    res.json(changes);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching recent cost changes', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.recentChanges.fetchFailed') });
  }
});

// GET /api/cost-management/variants/:id/cost - Get variant cost breakdown
costManagementRouter.get('/variants/:id/cost', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const variantId = parseInt(req.params.id, 10);

    if (isNaN(variantId)) {
      res.status(400).json({ error: i18n.t('errors.costManagement.variants.invalidId') });
      return;
    }

    const breakdown = await getVariantCostBreakdown(variantId);
    if (!breakdown) {
      res.status(404).json({ error: i18n.t('errors.costManagement.variants.notFound') });
      return;
    }

    res.json(breakdown);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching variant cost breakdown', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.variants.costFetchFailed') });
  }
});

// POST /api/cost-management/variants/:id/recalculate - Recalculate variant cost
costManagementRouter.post('/variants/:id/recalculate', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const variantId = parseInt(req.params.id, 10);

    if (isNaN(variantId)) {
      res.status(400).json({ error: i18n.t('errors.costManagement.variants.invalidId') });
      return;
    }

    const result = await updateVariantTheoreticalCost(variantId);
    if (!result) {
      res.status(404).json({ error: i18n.t('errors.costManagement.variants.notFound') });
      return;
    }

    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error recalculating variant cost', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.variants.recalculateFailed') });
  }
});

// GET /api/cost-management/variants/cost-summary - Get all variants with cost info
costManagementRouter.get('/variants/cost-summary', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, productId } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.costStatus = status;
    }
    if (productId && typeof productId === 'string') {
      where.productId = parseInt(productId, 10);
    }

    const variants = await prisma.productVariant.findMany({
      where,
      include: {
        product: {
          include: {
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const result = variants.map((v) => ({
      id: v.id,
      name: v.name,
      price: decimalToNumber(v.price),
      theoreticalCost: v.theoreticalCost !== null ? decimalToNumber(v.theoreticalCost) : null,
      currentMargin: v.currentMargin !== null ? decimalToNumber(v.currentMargin) : null,
      costStatus: v.costStatus,
      lastCostCalc: v.lastCostCalc,
      productId: v.productId,
      productName: v.product.name,
      categoryName: v.product.category?.name ?? null,
    }));

    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching variant cost summary', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.variants.summaryFetchFailed') });
  }
});

// POST /api/cost-management/bulk-recalculate - Recalculate all variant costs
costManagementRouter.post('/bulk-recalculate', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await recalculateAllVariantCosts();
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error bulk recalculating variant costs', {
      correlationId: (_req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.variants.bulkRecalculateFailed') });
  }
});

// GET /api/cost-management/inventory-counts - List inventory counts
costManagementRouter.get('/inventory-counts', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, fromDate, toDate } = req.query;

    const where: any = {};
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (fromDate || toDate) {
      where.countDate = {};
      if (fromDate && typeof fromDate === 'string') {
        where.countDate.gte = new Date(fromDate);
      }
      if (toDate && typeof toDate === 'string') {
        where.countDate.lte = new Date(toDate);
      }
    }

    const counts = await prisma.inventoryCount.findMany({
      where,
      include: {
        user: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { countDate: 'desc' },
    });

    const result = counts.map((c) => ({
      id: c.id,
      countDate: c.countDate,
      countType: c.countType,
      status: c.status,
      submittedAt: c.submittedAt,
      approvedAt: c.approvedAt,
      notes: c.notes,
      createdBy: c.createdBy,
      createdByName: c.user?.name ?? '',
      createdAt: c.createdAt,
      itemCount: c._count.items,
    }));

    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching inventory counts', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.inventoryCounts.fetchFailed') });
  }
});

// POST /api/cost-management/inventory-counts - Create inventory count
costManagementRouter.post('/inventory-counts', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { countDate, countType, notes, items } = req.body;
    const userId = (req as any).user?.id;

    if (!countDate || typeof countDate !== 'string') {
      res.status(400).json({ error: i18n.t('errors.costManagement.inventoryCounts.dateRequired') });
      return;
    }

    const validCountTypes = ['full', 'partial', 'spot'];
    if (!countType || !validCountTypes.includes(countType)) {
      res.status(400).json({ error: i18n.t('errors.costManagement.inventoryCounts.invalidCountType') });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: i18n.t('errors.costManagement.inventoryCounts.itemsRequired') });
      return;
    }

    for (const item of items) {
      if (!item.stockItemId || typeof item.stockItemId !== 'string') {
        res.status(400).json({ error: i18n.t('errors.costManagement.inventoryCounts.invalidItemStockId') });
        return;
      }
      if (typeof item.quantity !== 'number' || item.quantity < 0) {
        res.status(400).json({ error: i18n.t('errors.costManagement.inventoryCounts.invalidItemQuantity') });
        return;
      }
    }

    const stockItemIds = items.map((item: any) => item.stockItemId);
    const stockItems = await prisma.stockItem.findMany({
      where: { id: { in: stockItemIds } },
    });

    const stockItemMap = new Map(stockItems.map((si) => [si.id, si]));

    for (const id of stockItemIds) {
      if (!stockItemMap.has(id)) {
        res.status(404).json({ error: `Stock item ${id} not found` });
        return;
      }
    }

    const inventoryCount = await prisma.inventoryCount.create({
      data: {
        countDate: new Date(countDate),
        countType,
        notes: notes || null,
        createdBy: userId,
        items: {
          create: items.map((item: any) => {
            const stockItem = stockItemMap.get(item.stockItemId)!;
            const unitCost = decimalToNumber(stockItem.standardCost);
            const extendedValue = item.quantity * unitCost;
            return {
              stockItemId: item.stockItemId,
              quantity: item.quantity,
              unitCost: unitCost,
              extendedValue: extendedValue,
              notes: item.notes || null,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            stockItem: { select: { name: true } },
          },
        },
      },
    });

    res.status(201).json(inventoryCount);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error creating inventory count', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.inventoryCounts.createFailed') });
  }
});

// GET /api/cost-management/inventory-counts/:id - Get single inventory count
costManagementRouter.get('/inventory-counts/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: i18n.t('errors.costManagement.inventoryCounts.invalidId') });
      return;
    }

    const count = await prisma.inventoryCount.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            stockItem: { select: { name: true, type: true, baseUnit: true } },
          },
        },
        user: { select: { name: true } },
        approver: { select: { name: true } },
      },
    });

    if (!count) {
      res.status(404).json({ error: i18n.t('errors.costManagement.inventoryCounts.notFound') });
      return;
    }

    res.json(count);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching inventory count', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.inventoryCounts.fetchFailed') });
  }
});

// POST /api/cost-management/inventory-counts/:id/submit - Submit inventory count
costManagementRouter.post('/inventory-counts/:id/submit', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: i18n.t('errors.costManagement.inventoryCounts.invalidId') });
      return;
    }

    const existing = await prisma.inventoryCount.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: i18n.t('errors.costManagement.inventoryCounts.notFound') });
      return;
    }

    if (existing.status !== 'draft') {
      res.status(400).json({ error: i18n.t('errors.costManagement.inventoryCounts.notDraft') });
      return;
    }

    const updated = await prisma.inventoryCount.update({
      where: { id },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error submitting inventory count', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.inventoryCounts.submitFailed') });
  }
});

// POST /api/cost-management/inventory-counts/:id/approve - Approve inventory count
costManagementRouter.post('/inventory-counts/:id/approve', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = (req as any).user?.id;

    if (isNaN(id)) {
      res.status(400).json({ error: i18n.t('errors.costManagement.inventoryCounts.invalidId') });
      return;
    }

    const existing = await prisma.inventoryCount.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: i18n.t('errors.costManagement.inventoryCounts.notFound') });
      return;
    }

    if (existing.status !== 'submitted') {
      res.status(400).json({ error: i18n.t('errors.costManagement.inventoryCounts.notSubmitted') });
      return;
    }

    const updated = await prisma.inventoryCount.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        approvedBy: userId,
      },
    });

    res.json(updated);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error approving inventory count', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.inventoryCounts.approveFailed') });
  }
});

// GET /api/cost-management/variance-reports - List variance reports
costManagementRouter.get('/variance-reports', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    if (isNaN(page) || page < 1) {
      res.status(400).json({ error: i18n.t('errors.costManagement.varianceReports.invalidPage') });
      return;
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      res.status(400).json({ error: i18n.t('errors.costManagement.varianceReports.invalidLimit') });
      return;
    }

    const result = await getVarianceReports(page, limit);
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching variance reports', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.varianceReports.fetchFailed') });
  }
});

// GET /api/cost-management/variance-reports/:id - Get single variance report
costManagementRouter.get('/variance-reports/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: i18n.t('errors.costManagement.varianceReports.invalidId') });
      return;
    }

    const report = await getVarianceReport(id);
    if (!report) {
      res.status(404).json({ error: i18n.t('errors.costManagement.varianceReports.notFound') });
      return;
    }

    res.json(report);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching variance report', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.varianceReports.fetchFailed') });
  }
});

// POST /api/cost-management/variance-reports/generate - Generate variance report
costManagementRouter.post('/variance-reports/generate', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { periodStart, periodEnd, beginningCountId, endingCountId } = req.body;
    const userId = (req as any).user?.id;

    if (!periodStart || typeof periodStart !== 'string') {
      res.status(400).json({ error: i18n.t('errors.costManagement.varianceReports.periodStartRequired') });
      return;
    }

    if (!periodEnd || typeof periodEnd !== 'string') {
      res.status(400).json({ error: i18n.t('errors.costManagement.varianceReports.periodEndRequired') });
      return;
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (isNaN(startDate.getTime())) {
      res.status(400).json({ error: i18n.t('errors.costManagement.varianceReports.invalidPeriodStart') });
      return;
    }

    if (isNaN(endDate.getTime())) {
      res.status(400).json({ error: i18n.t('errors.costManagement.varianceReports.invalidPeriodEnd') });
      return;
    }

    if (startDate >= endDate) {
      res.status(400).json({ error: i18n.t('errors.costManagement.varianceReports.invalidPeriodRange') });
      return;
    }

    const report = await generateVarianceReport(
      startDate,
      endDate,
      userId,
      beginningCountId,
      endingCountId,
    );

    res.status(201).json(report);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error generating variance report', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.varianceReports.generateFailed') });
  }
});

// PATCH /api/cost-management/variance-reports/:id/status - Update variance report status
costManagementRouter.patch('/variance-reports/:id/status', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;
    const userId = (req as any).user?.id;

    if (isNaN(id)) {
      res.status(400).json({ error: i18n.t('errors.costManagement.varianceReports.invalidId') });
      return;
    }

    const validStatuses = ['draft', 'reviewed', 'final'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: i18n.t('errors.costManagement.varianceReports.invalidStatus') });
      return;
    }

    const result = await updateVarianceReportStatus(id, status, userId);
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error updating variance report status', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('errors.costManagement.varianceReports.statusUpdateFailed') });
  }
});
