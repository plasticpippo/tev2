// Validation functions for room and table data

export interface ValidationError {
  field: string;
  message: string;
}

// Room validation functions
export const validateRoomName = (name: string, existingNames: string[] = []): string | null => {
  if (!name || typeof name !== 'string') {
    return 'Room name is required';
  }

  if (name.trim().length === 0) {
    return 'Room name cannot be empty';
  }

  if (name.length > 100) {
    return 'Room name must be 100 characters or less';
  }

  if (existingNames.some(n => n.toLowerCase() === name.trim().toLowerCase() && n !== name)) {
    return 'A room with this name already exists';
  }

  // Check for special characters that might cause issues
  if (!/^[a-zA-Z0-9\s\-_(),.'&]+$/.test(name)) {
    return 'Room name contains invalid characters';
  }

  return null;
};

export const validateRoomDescription = (description: string): string | null => {
  if (description && description.length > 500) {
    return 'Description must be 500 characters or less';
  }

  return null;
};

export const validateRoom = (room: any, allRooms: any[] = []): { isValid: boolean; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];

  const nameError = validateRoomName(room.name, allRooms.filter(r => r.id !== room.id).map(r => r.name));
  if (nameError) {
    errors.push({ field: 'name', message: nameError });
  }

  const descriptionError = validateRoomDescription(room.description || '');
  if (descriptionError) {
    errors.push({ field: 'description', message: descriptionError });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Table validation functions
export const validateTableName = (name: string, existingNames: string[] = []): string | null => {
  if (!name || typeof name !== 'string') {
    return 'Table name is required';
  }

  if (name.trim().length === 0) {
    return 'Table name cannot be empty';
  }

  if (name.length > 50) {
    return 'Table name must be 50 characters or less';
  }

  if (existingNames.some(n => n.toLowerCase() === name.trim().toLowerCase() && n !== name)) {
    return 'A table with this name already exists in the selected room';
  }

  // Check for special characters that might cause issues
  if (!/^[a-zA-Z0-9\s\-_(),.'&]+$/.test(name)) {
    return 'Table name contains invalid characters';
  }

  return null;
};

export const validateTableRoomId = (roomId: string, allRoomIds: string[]): string | null => {
  if (!roomId || typeof roomId !== 'string') {
    return 'Room selection is required';
  }

  if (!allRoomIds.includes(roomId)) {
    return 'Selected room does not exist';
  }

  return null;
};

export const validateTablePosition = (x: number, y: number): string | null => {
  if (typeof x !== 'number' || isNaN(x)) {
    return 'X position must be a valid number';
  }

  if (typeof y !== 'number' || isNaN(y)) {
    return 'Y position must be a valid number';
  }

  if (x < 0 || x > 10000) {
    return 'X position must be between 0 and 10000';
  }

  if (y < 0 || y > 10000) {
    return 'Y position must be between 0 and 10000';
  }

  return null;
};

export const validateTableSize = (width: number, height: number): string | null => {
  if (typeof width !== 'number' || isNaN(width)) {
    return 'Width must be a valid number';
  }

  if (typeof height !== 'number' || isNaN(height)) {
    return 'Height must be a valid number';
  }

  if (width < 20 || width > 500) {
    return 'Width must be between 20 and 500 pixels';
  }

  if (height < 20 || height > 500) {
    return 'Height must be between 20 and 500 pixels';
  }

  return null;
};

export const validateTableStatus = (status: string): string | null => {
  const validStatuses = ['available', 'occupied', 'reserved', 'unavailable'];
  if (!validStatuses.includes(status)) {
    return 'Invalid table status';
  }

  return null;
};

export const validateTable = (table: any, allRooms: any[], allTables: any[] = []): { isValid: boolean; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];

  const nameError = validateTableName(table.name, 
    allTables
      .filter(t => t.roomId === table.roomId && t.id !== table.id) // Only check tables in the same room
      .map(t => t.name)
  );
  if (nameError) {
    errors.push({ field: 'name', message: nameError });
  }

  const roomIdError = validateTableRoomId(table.roomId, allRooms.map(r => r.id));
  if (roomIdError) {
    errors.push({ field: 'roomId', message: roomIdError });
  }

  const positionError = validateTablePosition(parseFloat(table.x), parseFloat(table.y));
  if (positionError) {
    errors.push({ field: 'position', message: positionError });
  }

  const sizeError = validateTableSize(parseFloat(table.width), parseFloat(table.height));
  if (sizeError) {
    errors.push({ field: 'size', message: sizeError });
  }

  const statusError = validateTableStatus(table.status);
  if (statusError) {
    errors.push({ field: 'status', message: statusError });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};