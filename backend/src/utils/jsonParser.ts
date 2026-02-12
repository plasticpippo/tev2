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
