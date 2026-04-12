import { prisma } from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';
import {
  decimalToNumber,
  roundMoney,
  multiplyMoney,
  subtractMoney,
  divideMoney,
  addMoney,
} from '../utils/money';

interface TransactionItem {
  productId?: number;
  variantId: number;
  quantity: number;
  price?: number;
  [key: string]: unknown;
}

interface VarianceReportSummary {
  id: number;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  theoreticalCost: number;
  actualCost: number;
  varianceValue: number;
  variancePercent: number;
  createdBy: number;
  createdByName: string;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: number | null;
  reviewedByName: string | null;
  itemCount: number;
}

interface VarianceReportDetail extends VarianceReportSummary {
  items: VarianceReportItemDetail[];
  beginningCount: { id: number; countDate: Date } | null;
  endingCount: { id: number; countDate: Date } | null;
}

interface VarianceReportItemDetail {
  id: number;
  stockItemId: string;
  stockItemName: string;
  theoreticalQty: number;
  actualQty: number;
  varianceQty: number;
  unitCost: number;
  varianceValue: number;
  variancePercent: number;
  status: string;
  notes: string | null;
}

interface VarianceReportListItem {
  id: number;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  theoreticalCost: number;
  actualCost: number;
  varianceValue: number;
  variancePercent: number;
  createdByName: string;
  createdAt: Date;
}

function getItemStatus(absVariancePercent: number, hasMissingData: boolean): string {
  if (hasMissingData) return 'missing_data';
  if (absVariancePercent < 2) return 'ok';
  if (absVariancePercent <= 5) return 'warning';
  return 'critical';
}

function toReportSummary(raw: {
  id: number;
  periodStart: Date;
  periodEnd: Date;
  status: string;
  theoreticalCost: Decimal;
  actualCost: Decimal;
  varianceValue: Decimal;
  variancePercent: Decimal;
  createdBy: number;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: number | null;
  user: { id: number; name: string };
  reviewer: { id: number; name: string } | null;
  items: unknown[];
}): VarianceReportSummary {
  return {
    id: raw.id,
    periodStart: raw.periodStart,
    periodEnd: raw.periodEnd,
    status: raw.status,
    theoreticalCost: decimalToNumber(raw.theoreticalCost),
    actualCost: decimalToNumber(raw.actualCost),
    varianceValue: decimalToNumber(raw.varianceValue),
    variancePercent: decimalToNumber(raw.variancePercent),
    createdBy: raw.createdBy,
    createdByName: raw.user?.name ?? 'Unknown',
    createdAt: raw.createdAt,
    reviewedAt: raw.reviewedAt,
    reviewedBy: raw.reviewedBy,
    reviewedByName: raw.reviewer?.name ?? null,
    itemCount: raw.items?.length ?? 0,
  };
}

function toItemDetail(raw: {
  id: number;
  stockItemId: string;
  theoreticalQty: Decimal;
  actualQty: Decimal;
  varianceQty: Decimal;
  unitCost: Decimal;
  varianceValue: Decimal;
  variancePercent: Decimal;
  status: string;
  notes: string | null;
  stockItem: { id: string; name: string };
}): VarianceReportItemDetail {
  return {
    id: raw.id,
    stockItemId: raw.stockItemId,
    stockItemName: raw.stockItem?.name ?? 'Unknown',
    theoreticalQty: decimalToNumber(raw.theoreticalQty),
    actualQty: decimalToNumber(raw.actualQty),
    varianceQty: decimalToNumber(raw.varianceQty),
    unitCost: decimalToNumber(raw.unitCost),
    varianceValue: decimalToNumber(raw.varianceValue),
    variancePercent: decimalToNumber(raw.variancePercent),
    status: raw.status,
    notes: raw.notes,
  };
}

export async function generateVarianceReport(
  periodStart: Date,
  periodEnd: Date,
  createdBy: number,
  beginningCountId?: number,
  endingCountId?: number
): Promise<VarianceReportDetail> {
  try {
    if (periodStart >= periodEnd) {
      throw new Error('periodStart must be before periodEnd');
    }

    let beginningCount: { id: number; countDate: Date } | null = null;
    let endingCount: { id: number; countDate: Date } | null = null;

    if (beginningCountId) {
      const bc = await prisma.inventoryCount.findUnique({
        where: { id: beginningCountId },
        select: { id: true, countDate: true },
      });
      if (bc) beginningCount = { id: bc.id, countDate: bc.countDate };
    } else {
      const bc = await prisma.inventoryCount.findFirst({
        where: {
          status: 'approved',
          countDate: { lte: periodStart },
        },
        orderBy: { countDate: 'desc' },
        select: { id: true, countDate: true },
      });
      if (bc) beginningCount = { id: bc.id, countDate: bc.countDate };
    }

    if (endingCountId) {
      const ec = await prisma.inventoryCount.findUnique({
        where: { id: endingCountId },
        select: { id: true, countDate: true },
      });
      if (ec) endingCount = { id: ec.id, countDate: ec.countDate };
    } else {
      const ec = await prisma.inventoryCount.findFirst({
        where: {
          status: 'approved',
          countDate: { gte: periodEnd },
        },
        orderBy: { countDate: 'asc' },
        select: { id: true, countDate: true },
      });
      if (ec) endingCount = { id: ec.id, countDate: ec.countDate };
    }

    const beginningItems = new Map<string, number>();
    const endingItems = new Map<string, number>();

    if (beginningCount) {
      const items = await prisma.inventoryCountItem.findMany({
        where: { inventoryCountId: beginningCount.id },
      });
      for (const item of items) {
        beginningItems.set(item.stockItemId, decimalToNumber(item.quantity));
      }
    }

    if (endingCount) {
      const items = await prisma.inventoryCountItem.findMany({
        where: { inventoryCountId: endingCount.id },
      });
      for (const item of items) {
        endingItems.set(item.stockItemId, decimalToNumber(item.quantity));
      }
    }

    const stockAdditions = new Map<string, number>();
    const adjustments = await prisma.stockAdjustment.findMany({
      where: {
        createdAt: { gte: periodStart, lte: periodEnd },
        quantity: { gt: 0 },
      },
    });
    for (const adj of adjustments) {
      const current = stockAdditions.get(adj.stockItemId) ?? 0;
      stockAdditions.set(adj.stockItemId, current + adj.quantity);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'completed',
        createdAt: { gte: periodStart, lte: periodEnd },
      },
      select: { items: true },
    });

    const theoreticalUsage = new Map<string, number>();
    const allVariantIds = new Set<number>();

    for (const tx of transactions) {
      const txItems = tx.items as TransactionItem[] | null;
      if (!txItems || !Array.isArray(txItems)) continue;
      for (const item of txItems) {
        if (item.variantId != null && item.quantity != null) {
          allVariantIds.add(item.variantId);
        }
      }
    }

    const stockConsumptions = await prisma.stockConsumption.findMany({
      where: { variantId: { in: Array.from(allVariantIds) } },
      include: { stockItem: true },
    });

    const recipeMap = new Map<number, Array<{ stockItemId: string; quantity: number }>>();
    for (const sc of stockConsumptions) {
      const existing = recipeMap.get(sc.variantId) ?? [];
      existing.push({ stockItemId: sc.stockItemId, quantity: sc.quantity });
      recipeMap.set(sc.variantId, existing);
    }

    for (const tx of transactions) {
      const txItems = tx.items as TransactionItem[] | null;
      if (!txItems || !Array.isArray(txItems)) continue;
      for (const item of txItems) {
        if (item.variantId == null || item.quantity == null) continue;
        const recipe = recipeMap.get(item.variantId);
        if (!recipe) continue;
        for (const ingredient of recipe) {
          const usage = multiplyMoney(ingredient.quantity, item.quantity);
          const current = theoreticalUsage.get(ingredient.stockItemId) ?? 0;
          theoreticalUsage.set(ingredient.stockItemId, roundMoney(current + usage));
        }
      }
    }

    const allStockItemIds = new Set<string>();
    theoreticalUsage.forEach((_, id) => allStockItemIds.add(id));
    beginningItems.forEach((_, id) => allStockItemIds.add(id));
    endingItems.forEach((_, id) => allStockItemIds.add(id));
    stockAdditions.forEach((_, id) => allStockItemIds.add(id));

    const allStockItemIdArr = Array.from(allStockItemIds);

    const stockItems = await prisma.stockItem.findMany({
      where: { id: { in: allStockItemIdArr } },
    });
    const stockItemMap = new Map(stockItems.map((si) => [si.id, si]));

    interface VarianceItemCalc {
      stockItemId: string;
      theoreticalQty: number;
      actualQty: number;
      varianceQty: number;
      unitCost: number;
      varianceValue: number;
      variancePercent: number;
      status: string;
      notes: string | null;
    }

    const varianceItems: VarianceItemCalc[] = [];
    let totalTheoretical = 0;
    let totalActual = 0;

    for (const stockItemId of allStockItemIdArr) {
      const stockItem = stockItemMap.get(stockItemId);
      const unitCost = stockItem ? decimalToNumber(stockItem.standardCost) : 0;
      const theoreticalQty = theoreticalUsage.get(stockItemId) ?? 0;

      let actualQty = 0;
      let hasMissingData = false;
      let notes: string | null = null;

      if (beginningItems.size === 0 && endingItems.size === 0) {
        hasMissingData = true;
        notes = 'No inventory count data available';
      } else {
        const begQty = beginningItems.get(stockItemId) ?? 0;
        const endQty = endingItems.get(stockItemId) ?? 0;
        const additions = stockAdditions.get(stockItemId) ?? 0;

        actualQty = roundMoney(subtractMoney(addMoney(begQty, additions), endQty));

        if (!beginningItems.has(stockItemId) && !endingItems.has(stockItemId)) {
          hasMissingData = true;
          notes = 'Item not found in inventory counts';
        }
      }

      const varianceQty = roundMoney(subtractMoney(actualQty, theoreticalQty));
      const varianceValue = roundMoney(multiplyMoney(varianceQty, unitCost));
      let variancePercent = 0;

      if (theoreticalQty > 0) {
        variancePercent = roundMoney(divideMoney(Math.abs(varianceQty), theoreticalQty) * 100);
      } else if (actualQty > 0) {
        variancePercent = 100;
      }

      const status = getItemStatus(variancePercent, hasMissingData);

      if (hasMissingData && !notes) {
        notes = 'Missing inventory data';
      }

      varianceItems.push({
        stockItemId,
        theoreticalQty,
        actualQty,
        varianceQty,
        unitCost,
        varianceValue,
        variancePercent,
        status,
        notes,
      });

      totalTheoretical = roundMoney(
        addMoney(totalTheoretical, multiplyMoney(theoreticalQty, unitCost))
      );
      totalActual = roundMoney(addMoney(totalActual, multiplyMoney(actualQty, unitCost)));
    }

    const totalVarianceValue = roundMoney(subtractMoney(totalActual, totalTheoretical));
    let totalVariancePercent = 0;
    if (totalTheoretical > 0) {
      totalVariancePercent = roundMoney(
        divideMoney(Math.abs(totalVarianceValue), totalTheoretical) * 100
      );
    }

    const report = await prisma.$transaction(async (tx) => {
      const created = await tx.varianceReport.create({
        data: {
          periodStart,
          periodEnd,
          status: 'draft',
          theoreticalCost: new Decimal(totalTheoretical),
          actualCost: new Decimal(totalActual),
          varianceValue: new Decimal(totalVarianceValue),
          variancePercent: new Decimal(totalVariancePercent),
          beginningCountId: beginningCount?.id ?? null,
          endingCountId: endingCount?.id ?? null,
          createdBy,
        },
        include: {
          user: true,
          reviewer: true,
          items: { include: { stockItem: true } },
        },
      });

      if (varianceItems.length > 0) {
        await tx.varianceReportItem.createMany({
          data: varianceItems.map((item) => ({
            varianceReportId: created.id,
            stockItemId: item.stockItemId,
            theoreticalQty: new Decimal(item.theoreticalQty),
            actualQty: new Decimal(item.actualQty),
            varianceQty: new Decimal(item.varianceQty),
            unitCost: new Decimal(item.unitCost),
            varianceValue: new Decimal(item.varianceValue),
            variancePercent: new Decimal(item.variancePercent),
            status: item.status,
            notes: item.notes,
          })),
        });
      }

      return tx.varianceReport.findUnique({
        where: { id: created.id },
        include: {
          user: true,
          reviewer: true,
          items: { include: { stockItem: true } },
        },
      });
    });

    if (!report) {
      throw new Error('Failed to create variance report');
    }

    return {
      ...toReportSummary(report),
      items: report.items.map(toItemDetail),
      beginningCount,
      endingCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate variance report: ${message}`);
  }
}

export async function getVarianceReport(
  reportId: number
): Promise<VarianceReportDetail | null> {
  try {
    const report = await prisma.varianceReport.findUnique({
      where: { id: reportId },
      include: {
        user: true,
        reviewer: true,
        items: {
          include: { stockItem: true },
          orderBy: { varianceValue: 'desc' },
        },
      },
    });

    if (!report) return null;

    let beginningCount: { id: number; countDate: Date } | null = null;
    let endingCount: { id: number; countDate: Date } | null = null;

    if (report.beginningCountId) {
      const bc = await prisma.inventoryCount.findUnique({
        where: { id: report.beginningCountId },
        select: { id: true, countDate: true },
      });
      if (bc) beginningCount = bc;
    }

    if (report.endingCountId) {
      const ec = await prisma.inventoryCount.findUnique({
        where: { id: report.endingCountId },
        select: { id: true, countDate: true },
      });
      if (ec) endingCount = ec;
    }

    return {
      ...toReportSummary(report),
      items: report.items.map(toItemDetail),
      beginningCount,
      endingCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch variance report: ${message}`);
  }
}

export async function getVarianceReports(
  page: number = 1,
  limit: number = 20
): Promise<{ reports: VarianceReportListItem[]; totalCount: number }> {
  try {
    const skip = (page - 1) * limit;

    const [reports, totalCount] = await Promise.all([
      prisma.varianceReport.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          items: true,
        },
      }),
      prisma.varianceReport.count(),
    ]);

    const reportItems: VarianceReportListItem[] = reports.map((r) => ({
      id: r.id,
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      status: r.status,
      theoreticalCost: decimalToNumber(r.theoreticalCost),
      actualCost: decimalToNumber(r.actualCost),
      varianceValue: decimalToNumber(r.varianceValue),
      variancePercent: decimalToNumber(r.variancePercent),
      createdByName: r.user?.name ?? 'Unknown',
      createdAt: r.createdAt,
    }));

    return { reports: reportItems, totalCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to fetch variance reports: ${message}`);
  }
}

export async function updateVarianceReportStatus(
  reportId: number,
  status: string,
  reviewedBy?: number
): Promise<VarianceReportSummary> {
  try {
    const validStatuses = ['draft', 'reviewed', 'final'];
    if (!validStatuses.includes(status)) {
      throw new Error(
        `Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`
      );
    }

    if ((status === 'reviewed' || status === 'final') && !reviewedBy) {
      throw new Error('reviewedBy is required when setting status to reviewed or final');
    }

    const existing = await prisma.varianceReport.findUnique({
      where: { id: reportId },
    });
    if (!existing) {
      throw new Error(`VarianceReport with id ${reportId} not found`);
    }

    const updateData: { status: string; reviewedAt?: Date; reviewedBy?: number } = {
      status,
    };

    if ((status === 'reviewed' || status === 'final') && reviewedBy) {
      updateData.reviewedAt = new Date();
      updateData.reviewedBy = reviewedBy;
    }

    const updated = await prisma.varianceReport.update({
      where: { id: reportId },
      data: updateData,
      include: {
        user: true,
        reviewer: true,
        items: true,
      },
    });

    return toReportSummary(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to update variance report status: ${message}`);
  }
}
