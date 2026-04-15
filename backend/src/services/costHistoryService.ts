import { prisma } from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { decimalToNumber, roundMoney, divideMoney, subtractMoney, subtractCost, divideCost, roundCost } from '../utils/money';
import {
    CostHistoryDTO,
    CostHistoryWithDetailsDTO,
    toCostHistoryDTO,
    toCostHistoryWithDetailsDTO,
} from '../types/cost';
import { updateVariantTheoreticalCost } from './costCalculationService';

export async function updateIngredientCost(
    stockItemId: string,
    newCost: number,
    reason: string,
    userId: number,
    effectiveFrom?: Date,
    notes?: string
): Promise<CostHistoryWithDetailsDTO> {
    if (newCost < 0) {
        throw new Error('Cost must be a positive number');
    }

    if (!reason || reason.trim() === '') {
        throw new Error('Reason is required for cost updates');
    }

    const result = await prisma.$transaction(async (tx) => {
        const stockItem = await tx.stockItem.findUnique({
            where: { id: stockItemId },
        });

        if (!stockItem) {
            throw new Error(`StockItem with id ${stockItemId} not found`);
        }

        const previousCost = decimalToNumber(stockItem.standardCost);
        let changePercent = 0;

        if (previousCost > 0) {
            const change = subtractCost(newCost, previousCost);
            changePercent = roundMoney(divideCost(change, previousCost) * 100);
        } else if (newCost > 0) {
            changePercent = 100;
        }

        const effectiveDate = effectiveFrom ?? new Date();

        const costHistory = await tx.costHistory.create({
            data: {
                stockItemId,
                previousCost: new Decimal(roundCost(previousCost)),
                newCost: new Decimal(roundCost(newCost)),
                changePercent: new Decimal(changePercent),
                reason: reason.trim(),
                effectiveFrom: effectiveDate,
                notes: notes || null,
                createdBy: userId,
            },
            include: {
                stockItem: true,
                user: true,
            },
        });

        await tx.stockItem.update({
            where: { id: stockItemId },
            data: {
                standardCost: new Decimal(roundCost(newCost)),
                lastCostUpdate: new Date(),
                costUpdateReason: reason.trim(),
            },
        });

        return costHistory;
    });

    const variantsUsingIngredient = await prisma.stockConsumption.findMany({
        where: { stockItemId },
        select: { variantId: true },
    });

    const uniqueVariantIds = [...new Set(variantsUsingIngredient.map((v) => v.variantId))];

    for (const variantId of uniqueVariantIds) {
        try {
            await updateVariantTheoreticalCost(variantId);
        } catch (error) {
            console.error(`Failed to update cost for variant ${variantId}:`, error);
        }
    }

    return toCostHistoryWithDetailsDTO(result);
}

export async function getCostHistory(stockItemId: string): Promise<CostHistoryWithDetailsDTO[]> {
    const history = await prisma.costHistory.findMany({
        where: { stockItemId },
        include: {
            stockItem: true,
            user: true,
        },
        orderBy: { effectiveFrom: 'desc' },
    });

    return history.map(toCostHistoryWithDetailsDTO);
}

export async function getCostHistoryById(id: number): Promise<CostHistoryWithDetailsDTO | null> {
    const history = await prisma.costHistory.findUnique({
        where: { id },
        include: {
            stockItem: true,
            user: true,
        },
    });

    if (!history) {
        return null;
    }

    return toCostHistoryWithDetailsDTO(history);
}

export async function getRecentCostChanges(limit: number = 20): Promise<CostHistoryWithDetailsDTO[]> {
    const history = await prisma.costHistory.findMany({
        take: limit,
        include: {
            stockItem: true,
            user: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    return history.map(toCostHistoryWithDetailsDTO);
}

export async function revertCostChange(
    historyId: number,
    userId: number
): Promise<CostHistoryWithDetailsDTO> {
    const originalHistory = await prisma.costHistory.findUnique({
        where: { id: historyId },
        include: {
            stockItem: true,
        },
    });

    if (!originalHistory) {
        throw new Error(`CostHistory with id ${historyId} not found`);
    }

    const previousCost = decimalToNumber(originalHistory.previousCost);
    const currentCost = decimalToNumber(originalHistory.newCost);
    const revertReason = `Revert: ${originalHistory.reason}`;

    return updateIngredientCost(
        originalHistory.stockItemId,
        previousCost,
        revertReason,
        userId
    );
}
