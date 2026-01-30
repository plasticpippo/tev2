/**
 * Sanitization utility for preventing XSS attacks
 * BUG-011: Stored XSS vulnerability fix
 *
 * This module provides functions to sanitize user input before storage
 * and escape HTML for safe display.
 */

import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Constants for validation
const NAME_MIN_LENGTH = 1;
const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

// Regex for valid name characters (alphanumeric, spaces, hyphens, underscores)
const NAME_REGEX = /^[a-zA-Z0-9\s\-_]+$/;

/**
 * Custom error class for sanitization validation failures
 */
export class SanitizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SanitizationError';
  }
}

/**
 * Removes all HTML tags from input using DOMPurify
 * @param input - The string to sanitize
 * @returns Sanitized string with all HTML tags removed
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // DOMPurify with ALLOWED_TAGS empty to strip all HTML
  const sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  // Return the text content only (DOMPurify returns string in Node.js)
  return sanitized as string;
}

/**
 * Sanitizes entity names (tables, rooms, layouts)
 * - Strips HTML tags
 * - Trims whitespace
 * - Validates length (1-100 chars)
 * - Only allows alphanumeric, spaces, hyphens, underscores
 *
 * @param name - The name to sanitize
 * @returns Sanitized name
 * @throws SanitizationError if validation fails
 */
export function sanitizeName(name: string): string {
  if (typeof name !== 'string') {
    throw new SanitizationError('Name must be a string');
  }

  // Strip HTML tags
  let sanitized = sanitizeHtml(name);

  // Trim whitespace
  sanitized = sanitized.trim();

  // Validate length
  if (sanitized.length < NAME_MIN_LENGTH) {
    throw new SanitizationError(
      `Name must be at least ${NAME_MIN_LENGTH} character${NAME_MIN_LENGTH === 1 ? '' : 's'} long`
    );
  }

  if (sanitized.length > NAME_MAX_LENGTH) {
    throw new SanitizationError(
      `Name must not exceed ${NAME_MAX_LENGTH} characters`
    );
  }

  // Validate allowed characters
  if (!NAME_REGEX.test(sanitized)) {
    throw new SanitizationError(
      'Name can only contain letters, numbers, spaces, hyphens, and underscores'
    );
  }

  return sanitized;
}

/**
 * Sanitizes description fields
 * - Strips HTML tags
 * - Trims whitespace
 * - Max 500 chars
 *
 * @param description - The description to sanitize
 * @returns Sanitized description
 * @throws SanitizationError if validation fails
 */
export function sanitizeDescription(description: string): string {
  if (typeof description !== 'string') {
    throw new SanitizationError('Description must be a string');
  }

  // Strip HTML tags
  let sanitized = sanitizeHtml(description);

  // Trim whitespace
  sanitized = sanitized.trim();

  // Validate max length
  if (sanitized.length > DESCRIPTION_MAX_LENGTH) {
    throw new SanitizationError(
      `Description must not exceed ${DESCRIPTION_MAX_LENGTH} characters`
    );
  }

  return sanitized;
}

/**
 * Escapes HTML entities for safe display
 * Converts special characters to their HTML entity equivalents
 *
 * @param input - The string to escape
 * @returns Escaped string safe for HTML display
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return validator.escape(input);
}

/**
 * Sanitizes a generic string input (for fields that don't need strict validation)
 * - Strips HTML tags
 * - Trims whitespace
 *
 * @param input - The string to sanitize
 * @param maxLength - Optional maximum length (defaults to no limit)
 * @returns Sanitized string
 * @throws SanitizationError if maxLength is exceeded
 */
export function sanitizeString(input: string, maxLength?: number): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Strip HTML tags
  let sanitized = sanitizeHtml(input);

  // Trim whitespace
  sanitized = sanitized.trim();

  // Check max length if specified
  if (maxLength !== undefined && sanitized.length > maxLength) {
    throw new SanitizationError(`Input must not exceed ${maxLength} characters`);
  }

  return sanitized;
}

/**
 * Validates and sanitizes an optional name field
 * Returns null if input is null/undefined/empty string
 *
 * @param name - The optional name to sanitize
 * @returns Sanitized name or null
 * @throws SanitizationError if validation fails
 */
export function sanitizeOptionalName(name: string | null | undefined): string | null {
  if (name === null || name === undefined) {
    return null;
  }

  if (typeof name !== 'string') {
    throw new SanitizationError('Name must be a string');
  }

  const trimmed = name.trim();

  if (trimmed === '') {
    return null;
  }

  return sanitizeName(trimmed);
}

/**
 * Validates and sanitizes an optional description field
 * Returns null if input is null/undefined/empty string
 *
 * @param description - The optional description to sanitize
 * @returns Sanitized description or null
 * @throws SanitizationError if validation fails
 */
export function sanitizeOptionalDescription(
  description: string | null | undefined
): string | null {
  if (description === null || description === undefined) {
    return null;
  }

  if (typeof description !== 'string') {
    throw new SanitizationError('Description must be a string');
  }

  const trimmed = description.trim();

  if (trimmed === '') {
    return null;
  }

  return sanitizeDescription(trimmed);
}
