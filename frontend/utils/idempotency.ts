/**
 * Generates a RFC 4122 compliant UUID v4
 * Used as fallback when crypto.randomUUID is not available (e.g., non-HTTPS contexts)
 */
function generateUUIDv4(): string {
  // Use crypto.getRandomValues if available (supported in all modern browsers)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    
    // Set version (4) and variant bits per RFC 4122
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // Version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 1
    
    // Convert to hex string format
    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  
  // Fallback for very old browsers (unlikely to be needed)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generates a unique idempotency key for payment requests
 * Format: {timestamp}-{uuid}-{itemsHash}
 * This ensures uniqueness per payment attempt while being deterministic
 */
export function generateIdempotencyKey(items: Array<{ id: number | string; quantity: number }>): string {
  const timestamp = Date.now().toString(36);
  // Use crypto.randomUUID if available (HTTPS context), otherwise use our fallback
  const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : generateUUIDv4()
  ).split('-')[0]; // First segment only for brevity
  const itemsHash = items
    .map(i => `${i.id}:${i.quantity}`)
    .sort()
    .join('_')
    .split('')
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
    .toString(36);
  return `${timestamp}-${uuid}-${itemsHash}`;
}
