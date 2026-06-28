export const CONSUMED_TRANSACTION_STATUSES: readonly ['completed', 'complimentary'] = ['completed', 'complimentary'];
export const CONSUMED_TRANSACTION_STATUSES_MUTABLE: string[] = ['completed', 'complimentary'];
export type ConsumedTransactionStatus = typeof CONSUMED_TRANSACTION_STATUSES[number];

export function isConsumedTransactionStatus(status: string): status is ConsumedTransactionStatus {
  return CONSUMED_TRANSACTION_STATUSES.includes(status as ConsumedTransactionStatus);
}