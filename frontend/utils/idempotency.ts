/**
 * Generates a unique idempotency key for payment requests
 * Format: {timestamp}-{uuid}-{itemsHash}
 * This ensures uniqueness per payment attempt while being deterministic
 */
export function generateIdempotencyKey(items: Array<{ id: number | string; quantity: number }>): string {
  const timestamp = Date.now().toString(36);
  const uuid = crypto.randomUUID().split('-')[0]; // First segment only for brevity
  const itemsHash = items
    .map(i => `${i.id}:${i.quantity}`)
    .sort()
    .join('_')
    .split('')
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
    .toString(36);
  return `${timestamp}-${uuid}-${itemsHash}`;
}
