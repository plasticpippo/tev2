/**
 * Storage configuration for the application.
 * 
 * Provides centralized configuration for file storage paths, primarily
 * for PDF receipts and other generated files.
 */

/**
 * Base path for PDF storage.
 * 
 * Defaults to /app/storage/receipts, but can be overridden via the
 * PDF_STORAGE_PATH environment variable.
 * 
 * This path is mounted as a Docker volume (storage_data) to ensure
 * persistence across container restarts.
 */
export const STORAGE_PATH = process.env.PDF_STORAGE_PATH || '/app/storage/receipts';
