import { Decimal } from '@prisma/client/runtime/library';

export interface IngredientCostDetail {
  stockItemId: string;
  stockItemName: string;
  quantity: number;
  standardCost: number;
  ingredientCost: number;
}

export interface CostBreakdown {
  variantId: number;
  variantName: string;
  productId: number;
  productName: string;
  ingredientCosts: IngredientCostDetail[];
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
  unitCost: number | null;
  totalCost: number | null;
}

export interface TransactionCostResult {
  items: TransactionItemCostResult[];
  totalCost: number | null;
  hasAllCosts: boolean;
}

export interface RecipeCostInput {
  variantId: number;
  includeDetails?: boolean;
}

export interface VariantCostUpdate {
  variantId: number;
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
    newCost: number;
    reason: string;
    effectiveFrom?: Date;
    notes?: string;
}

export interface CostHistoryDTO {
    id: number;
    stockItemId: string;
    previousCost: number;
    newCost: number;
    changePercent: number;
    reason: string;
    effectiveFrom: Date;
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
        createdBy: data.createdBy,
        createdAt: data.createdAt,
        stockItemName: data.stockItem?.name ?? '',
        createdByName: data.user?.name ?? '',
    };
}
