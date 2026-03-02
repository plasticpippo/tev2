/**
 * Consolidated table status constants and transitions.
 * These definitions should be used throughout the codebase for consistency.
 */

export const TABLE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  UNAVAILABLE: 'unavailable',
  BILL_REQUESTED: 'bill_requested'
} as const;

export type TableStatus = typeof TABLE_STATUS[keyof typeof TABLE_STATUS];

// Valid table status transitions
export const TABLE_STATUS_TRANSITIONS: Record<TableStatus, TableStatus[]> = {
  [TABLE_STATUS.AVAILABLE]: [TABLE_STATUS.OCCUPIED, TABLE_STATUS.RESERVED, TABLE_STATUS.UNAVAILABLE],
  [TABLE_STATUS.OCCUPIED]: [TABLE_STATUS.AVAILABLE, TABLE_STATUS.BILL_REQUESTED],
  [TABLE_STATUS.BILL_REQUESTED]: [TABLE_STATUS.AVAILABLE, TABLE_STATUS.OCCUPIED],
  [TABLE_STATUS.RESERVED]: [TABLE_STATUS.OCCUPIED, TABLE_STATUS.AVAILABLE],
  [TABLE_STATUS.UNAVAILABLE]: [TABLE_STATUS.AVAILABLE]
};

// Helper function to check if a status is valid
export function isValidStatus(status: string): status is TableStatus {
  return Object.values(TABLE_STATUS).includes(status as TableStatus);
}

// Helper function to check if a status transition is valid
export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const allowedTransitions = TABLE_STATUS_TRANSITIONS[currentStatus as TableStatus];
  return allowedTransitions?.includes(newStatus as TableStatus) ?? false;
}
