export const validateTableData = (data: {
  name?: string;
  roomId?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  status?: string;
  capacity?: number;
}) => {
  const errors: string[] = [];

  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.push('Table name must be a non-empty string');
    }
  }

  if (data.x !== undefined) {
    const x = parseFloat(data.x.toString());
    if (isNaN(x) || x < 0) {
      errors.push('x position must be a non-negative number');
    }
  }

  if (data.y !== undefined) {
    const y = parseFloat(data.y.toString());
    if (isNaN(y) || y < 0) {
      errors.push('y position must be a non-negative number');
    }
  }

  if (data.width !== undefined) {
    const width = parseFloat(data.width.toString());
    if (isNaN(width) || width <= 0) {
      errors.push('width must be a positive number');
    }
  }

  if (data.height !== undefined) {
    const height = parseFloat(data.height.toString());
    if (isNaN(height) || height <= 0) {
      errors.push('height must be a positive number');
    }
  }

  if (data.status !== undefined) {
    const validStatuses = ['available', 'occupied', 'reserved', 'unavailable', 'bill_requested'];
    if (!validStatuses.includes(data.status)) {
      errors.push(`status must be one of: ${validStatuses.join(', ')}`);
    }
  }

  if (data.capacity !== undefined) {
    const capacity = parseInt(data.capacity.toString(), 10);
    if (isNaN(capacity) || capacity <= 0) {
      errors.push('capacity must be a positive integer');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Valid table status transitions
export const TABLE_STATUS_TRANSITIONS: Record<string, string[]> = {
  'available': ['occupied', 'reserved', 'unavailable'],
  'occupied': ['available', 'bill_requested'],
  'bill_requested': ['available', 'occupied'],
  'reserved': ['occupied', 'available'],
  'unavailable': ['available']
};

export function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const allowedTransitions = TABLE_STATUS_TRANSITIONS[currentStatus];
  return allowedTransitions?.includes(newStatus) ?? false;
}

export function validateTableStatusUpdate(
  currentStatus: string,
  newStatus: string
): { isValid: boolean; error?: string } {
  if (currentStatus === newStatus) {
    return { isValid: true }; // No change needed
  }
  
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    return {
      isValid: false,
      error: `Invalid status transition from '${currentStatus}' to '${newStatus}'`
    };
  }
  
  return { isValid: true };
}