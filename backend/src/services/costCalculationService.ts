import { prisma } from '../prisma';
import { Decimal } from '@prisma/client/runtime/library';
import { decimalToNumber, roundMoney, multiplyMoney, subtractMoney, divideMoney } from '../utils/money';
import {
  CostBreakdown,
  TransactionItemInput,
  TransactionItemCostResult,
  TransactionCostResult,
  RecipeCostInput,
  VariantCostUpdate,
  IngredientCostDetail,
} from '../types/cost';

export async function calculateVariantCost(variantId: number): Promise<number | null> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      stockConsumption: {
        include: {
          stockItem: true,
        },
      },
    },
  });

  if (!variant || !variant.stockConsumption || variant.stockConsumption.length === 0) {
    return null;
  }

  let totalCost = 0;
  let hasValidCosts = false;

  for (const consumption of variant.stockConsumption) {
    const standardCost = decimalToNumber(consumption.stockItem.standardCost);
    const quantity = consumption.quantity;

    if (standardCost > 0 && quantity > 0) {
      const ingredientCost = multiplyMoney(standardCost, quantity);
      totalCost = roundMoney(totalCost + ingredientCost);
      hasValidCosts = true;
    }
  }

  return hasValidCosts ? roundMoney(totalCost) : null;
}

export async function calculateTransactionItemCost(
  variantId: number,
  quantity: number
): Promise<TransactionItemCostResult> {
  const unitCost = await calculateVariantCost(variantId);

  if (unitCost === null || quantity <= 0) {
    return {
      variantId,
      quantity,
      unitCost: null,
      totalCost: null,
    };
  }

  const totalCost = multiplyMoney(unitCost, quantity);

  return {
    variantId,
    quantity,
    unitCost: roundMoney(unitCost),
    totalCost: roundMoney(totalCost),
  };
}

export async function calculateTransactionCost(
  items: TransactionItemInput[]
): Promise<TransactionCostResult> {
  if (!items || items.length === 0) {
    return {
      items: [],
      totalCost: null,
      hasAllCosts: false,
    };
  }

  const itemResults: TransactionItemCostResult[] = [];
  let totalCost = 0;
  let hasAllCosts = true;

  for (const item of items) {
    const itemCost = await calculateTransactionItemCost(item.variantId, item.quantity);
    itemResults.push(itemCost);

    if (itemCost.totalCost !== null) {
      totalCost = roundMoney(totalCost + itemCost.totalCost);
    } else {
      hasAllCosts = false;
    }
  }

  return {
    items: itemResults,
    totalCost: hasAllCosts ? roundMoney(totalCost) : null,
    hasAllCosts,
  };
}

export async function updateVariantTheoreticalCost(variantId: number): Promise<VariantCostUpdate | null> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: true,
    },
  });

  if (!variant) {
    return null;
  }

  const theoreticalCost = await calculateVariantCost(variantId);
  const price = decimalToNumber(variant.price);

  let currentMargin: number | null = null;
  if (theoreticalCost !== null && theoreticalCost > 0 && price > 0) {
    const marginValue = subtractMoney(price, theoreticalCost);
    currentMargin = roundMoney(divideMoney(marginValue, price) * 100);
  }

  const costStatus = theoreticalCost !== null ? 'current' : 'pending';

  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      theoreticalCost: theoreticalCost !== null ? new Decimal(theoreticalCost) : null,
      currentMargin: currentMargin !== null ? new Decimal(currentMargin) : null,
      lastCostCalc: new Date(),
      costStatus,
    },
  });

  return {
    variantId,
    theoreticalCost,
    currentMargin,
    costStatus,
    lastCostCalc: new Date(),
  };
}

export async function getVariantCostBreakdown(variantId: number): Promise<CostBreakdown | null> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: true,
      stockConsumption: {
        include: {
          stockItem: true,
        },
      },
    },
  });

  if (!variant) {
    return null;
  }

  const ingredientCosts: IngredientCostDetail[] = [];
  let totalCost = 0;
  let hasValidCosts = false;

  for (const consumption of variant.stockConsumption) {
    const standardCost = decimalToNumber(consumption.stockItem.standardCost);
    const quantity = consumption.quantity;
    const ingredientCost = standardCost > 0 ? multiplyMoney(standardCost, quantity) : 0;

    ingredientCosts.push({
      stockItemId: consumption.stockItemId,
      stockItemName: consumption.stockItem.name,
      quantity,
      standardCost: roundMoney(standardCost),
      ingredientCost: roundMoney(ingredientCost),
    });

    if (standardCost > 0 && quantity > 0) {
      totalCost = roundMoney(totalCost + ingredientCost);
      hasValidCosts = true;
    }
  }

  return {
    variantId: variant.id,
    variantName: variant.name,
    productId: variant.productId,
    productName: variant.product.name,
    ingredientCosts,
    totalCost: hasValidCosts ? roundMoney(totalCost) : null,
    hasValidCosts,
  };
}

export async function getMultipleVariantCosts(variantIds: number[]): Promise<Map<number, number | null>> {
  const costMap = new Map<number, number | null>();

  for (const variantId of variantIds) {
    const cost = await calculateVariantCost(variantId);
    costMap.set(variantId, cost);
  }

  return costMap;
}

export async function recalculateAllVariantCosts(): Promise<{
  updated: number;
  failed: number;
  skipped: number;
}> {
  const variants = await prisma.productVariant.findMany({
    select: { id: true },
  });

  let updated = 0;
  let failed = 0;
  let skipped = 0;

  for (const variant of variants) {
    try {
      const result = await updateVariantTheoreticalCost(variant.id);
      if (result) {
        if (result.theoreticalCost !== null) {
          updated++;
        } else {
          skipped++;
        }
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
      console.error(`Error updating cost for variant ${variant.id}:`, error);
    }
  }

  return { updated, failed, skipped };
}
