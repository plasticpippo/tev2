import { Decimal } from '@prisma/client/runtime/library';

export interface IngredientCostDetail {
  stockItemId: string;
  stockItemName: string;
  quantity: number;
  /** @precision 6 decimal places */
  standardCost: number;
  /** @precision 6 decimal places */
  ingredientCost: number;
}

export interface CostBreakdown {
  variantId: number;
  variantName: string;
  productId: number;
  productName: string;
  ingredientCosts: IngredientCostDetail[];
  /** @precision 6 decimal places */
  totalCost: number | null;
  hasValidCosts: boolean;
}

export interface TransactionItemInput {
  variantId: number;
  quantity: number;
}

export interface TransactionItemCostResult {
  variantId: number;
  quantity: number;
  /** @precision 6 decimal places */
  unitCost: number | null;
  /** @precision 6 decimal places */
  totalCost: number | null;
}

export interface TransactionCostResult {
  items: TransactionItemCostResult[];
  /** @precision 6 decimal places */
  totalCost: number | null;
  hasAllCosts: boolean;
}

export interface RecipeCostInput {
  variantId: number;
  includeDetails?: boolean;
}

export interface VariantCostUpdate {
  variantId: number;
  /** @precision 6 decimal places */
  theoreticalCost: number | null;
  currentMargin: number | null;
  costStatus: string;
  lastCostCalc: Date;
}

export function toCostBreakdownDTO(data: any): CostBreakdown {
  return {
    variantId: data.variantId,
    variantName: data.variantName,
    productId: data.productId,
    productName: data.productName,
    ingredientCosts: data.ingredientCosts || [],
    totalCost: data.totalCost,
    hasValidCosts: data.hasValidCosts ?? false,
  };
}

export function toTransactionCostResultDTO(data: any): TransactionCostResult {
  return {
    items: data.items || [],
    totalCost: data.totalCost,
    hasAllCosts: data.hasAllCosts ?? false,
  };
}

export function toTransactionItemCostResultDTO(data: any): TransactionItemCostResult {
    return {
        variantId: data.variantId,
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost: data.totalCost,
    };
}

export interface CostHistoryInput {
    stockItemId: string;
    /** @precision 6 decimal places */
    newCost: number;
    reason: string;
    effectiveFrom?: Date;
    notes?: string;
}

export interface CostHistoryDTO {
    id: number;
    stockItemId: string;
    /** @precision 6 decimal places */
    previousCost: number;
    /** @precision 6 decimal places */
    newCost: number;
    changePercent: number;
    reason: string;
    effectiveFrom: Date;
    notes: string | null;
    createdBy: number;
    createdAt: Date;
}

export interface CostHistoryWithDetailsDTO extends CostHistoryDTO {
    stockItemName: string;
    createdByName: string;
}

export function toCostHistoryDTO(data: any): CostHistoryDTO {
    return {
        id: data.id,
        stockItemId: data.stockItemId,
        previousCost: data.previousCost,
        newCost: data.newCost,
        changePercent: data.changePercent,
        reason: data.reason,
        effectiveFrom: data.effectiveFrom,
        notes: data.notes ?? null,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
    };
}

export function toCostHistoryWithDetailsDTO(data: any): CostHistoryWithDetailsDTO {
    return {
        id: data.id,
        stockItemId: data.stockItemId,
        previousCost: data.previousCost,
        newCost: data.newCost,
        changePercent: data.changePercent,
        reason: data.reason,
        effectiveFrom: data.effectiveFrom,
        notes: data.notes ?? null,
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        stockItemName: data.stockItem?.name ?? '',
        createdByName: data.user?.name ?? '',
    };
}
