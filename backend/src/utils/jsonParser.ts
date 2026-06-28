import { logError } from './logger';
import type { JsonValue } from '@prisma/client/runtime/library';

/**
 * Safely parses a JSON string with error handling and default fallback.
 * Handles Prisma JsonValue types which can be string, number, boolean, object, array, or null.
 */
export function safeJsonParse<T>(
  jsonString: JsonValue | string | null | undefined,
  defaultValue: T,
  context?: { id?: string; field?: string }
): T {
  if (jsonString === null || jsonString === undefined) {
    return defaultValue;
  }
  
  // Already parsed (object or array)
  if (typeof jsonString !== 'string') {
    return jsonString as T;
  }
  
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    logError('Failed to parse JSON', {
      ...context,
      error: error instanceof Error ? error.message : 'Unknown error',
      valuePreview: jsonString.substring(0, 100)
    });
    return defaultValue;
  }
}

/**
 * Parses Transaction.items safely.
 * Handles both string and object formats for backwards compatibility.
 * Due to legacy double-encoding, some rows contain JSON strings, others contain objects.
 */
export function parseTransactionItems<T = any[]>(items: JsonValue | string | null | undefined): T {
  if (!items) {
    return [] as T;
  }
  
  // If it's already an object/array, return it
  if (typeof items !== 'string') {
    return items as T;
  }
  
  try {
    const parsed = JSON.parse(items);
    // If the parsed result is still a string (double-encoded), parse again
    return typeof parsed === 'string' ? JSON.parse(parsed) : parsed;
  } catch (error) {
    logError('Failed to parse transaction items', {
      error: error instanceof Error ? error.message : 'Unknown error',
      itemsPreview: typeof items === 'string' ? items.substring(0, 100) : String(items)
    });
    return [] as T;
  }
}
