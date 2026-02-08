/**
 * JWT Secret Validation Utility
 * 
 * This module provides validation for the JWT_SECRET environment variable
 * to ensure it meets security requirements before the application starts.
 */

/**
 * List of common default/placeholder values that should not be used as JWT secrets
 */
const FORBIDDEN_DEFAULT_VALUES = [
  'your-secret-key',
  'your-secret-key-for-development-only',
  'secret',
  'dev-secret',
  'jwt-secret',
  'change-me',
  'changeme',
  'default-secret',
  'test-secret',
  'development-secret',
  'production-secret',
];

/**
 * Minimum required length for JWT secret (in characters)
 */
const MIN_SECRET_LENGTH = 64;

/**
 * Validates the JWT_SECRET environment variable
 * 
 * @throws {Error} If validation fails with a descriptive error message
 */
export function validateJwtSecret(): void {
  const jwtSecret = process.env.JWT_SECRET;

  // Check if JWT_SECRET is set
  if (!jwtSecret) {
    throw new Error(
      'JWT_SECRET environment variable is not set. ' +
      'Please set a secure JWT_SECRET in your environment variables. ' +
      'Generate one using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }

  // Check if it's a forbidden default value
  const normalizedSecret = jwtSecret.toLowerCase().trim();
  if (FORBIDDEN_DEFAULT_VALUES.some(forbidden => normalizedSecret === forbidden.toLowerCase())) {
    throw new Error(
      'JWT_SECRET cannot be a default or placeholder value. ' +
      'The current value is a known insecure default. ' +
      'Please generate a secure secret using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }

  // Check minimum length requirement
  if (jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long. ` +
      `Current length: ${jwtSecret.length} characters. ` +
      'Generate a secure secret using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }

  // Check for common weak patterns
  if (/^[a-zA-Z]+$/.test(jwtSecret)) {
    throw new Error(
      'JWT_SECRET should contain a mix of characters (letters, numbers, and special characters). ' +
      'The current value appears to be only alphabetic characters. ' +
      'Generate a secure secret using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }

  if (/^[0-9]+$/.test(jwtSecret)) {
    throw new Error(
      'JWT_SECRET should contain a mix of characters (letters, numbers, and special characters). ' +
      'The current value appears to be only numeric characters. ' +
      'Generate a secure secret using: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
  }
}
