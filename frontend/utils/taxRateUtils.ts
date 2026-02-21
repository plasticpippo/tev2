import { TaxRate } from '../../shared/types';

/**
 * Resolves the effective tax rate for a variant
 * Priority: variant.taxRate → settings.defaultTaxRate → 0
 */
export function getEffectiveTaxRate(
  variantTaxRate: TaxRate | null | undefined,
  defaultTaxRate: TaxRate | null | undefined
): number {
  if (variantTaxRate) {
    return variantTaxRate.rate;
  }
  if (defaultTaxRate) {
    return defaultTaxRate.rate;
  }
  return 0;
}

/**
 * Formats a decimal tax rate to percentage display
 * @param rate - Decimal value (0-1)
 * @returns Formatted percentage string (e.g., "19%")
 */
export function formatTaxRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * Generates a display label for a tax rate
 * @param taxRate - TaxRate object
 * @returns Label string (e.g., "VAT Standard (19%)")
 */
export function getTaxRateLabel(taxRate: TaxRate): string {
  const percentage = Math.round(taxRate.rate * 100);
  return `${taxRate.name} (${percentage}%)`;
}
