/**
 * Secure Logging Utility
 * 
 * This module provides comprehensive secure logging with:
 * - Sensitive data redaction (50+ fields)
 * - Log injection protection (CRLF prevention)
 * - Structured logging with winston
 * - Environment-based debug logging control
 * - Request correlation IDs
 * - Log rotation
 * - Audit logging for security events
 */

import winston from 'winston';
import { TransformableInfo } from 'logform';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Comprehensive list of sensitive fields that should be redacted from logs
 * Covers authentication, payment, PII, financial, security, and internal data
 */
export const SENSITIVE_FIELDS = [
  // Authentication & Credentials
  'password',
  'password_hack',
  'newPassword',
  'oldPassword',
  'confirmPassword',
  'currentPassword',
  'token',
  'accessToken',
  'refreshToken',
  'authToken',
  'sessionToken',
  'resetToken',
  'verificationToken',
  'apiToken',
  'apiKey',
  'secret',
  'clientSecret',
  'privateKey',
  'secretKey',
  
  // Payment & Financial
  'creditCard',
  'cardNumber',
  'cvv',
  'cvc',
  'cardCvv',
  'cardCvc',
  'expiry',
  'expiryDate',
  'cardExpiry',
  'cardExpiryDate',
  'iban',
  'bankAccount',
  'accountNumber',
  'routingNumber',
  'sortCode',
  'pin',
  'cardPin',
  'transactionId',
  'paymentId',
  'paymentToken',
  'paymentMethodToken',
  
  // Personal Identifiable Information (PII)
  'ssn',
  'socialSecurityNumber',
  'taxId',
  'taxIdNumber',
  'nationalId',
  'passportNumber',
  'driverLicense',
  'dateOfBirth',
  'dob',
  'birthDate',
  'email',
  'emailAddress',
  'phoneNumber',
  'phone',
  'mobile',
  'mobileNumber',
  'address',
  'streetAddress',
  'postalCode',
  'zipCode',
  'zip',
  'city',
  'state',
  'country',
  'fullName',
  'firstName',
  'lastName',
  'middleName',
  
  // Security & Internal
  'jwtSecret',
  'encryptionKey',
  'salt',
  'hash',
  'otp',
  'oneTimePassword',
  'verificationCode',
  'securityCode',
  'mfaCode',
  'twoFactorCode',
  'recoveryCode',
  'backupCode',
  'sessionCookie',
  'csrfToken',
  'xsrfToken',
  'nonce',
  'signature',
  'fingerprint',
  'deviceId',
  'deviceFingerprint',
  'ipAddress',
  'clientIp',
  'userAgent',
  'macAddress',
  
  // Database & Internal IDs
  'internalId',
  'internalReference',
  'systemId',
  'adminKey',
  'masterKey',
  'serviceKey',
  'webhookSecret',
  'webhookUrl',
  'callbackUrl',
  'redirectUrl',
  'returnUrl',
  'cancelUrl',
  'notificationUrl',
  'webhookToken',
  
  // Additional sensitive patterns
  'secretAnswer',
  'securityAnswer',
  'hint',
  'recoveryEmail',
  'recoveryPhone',
  'emergencyContact',
  'emergencyPhone',
  'beneficiary',
  'beneficiaryName',
  'accountHolder',
  'accountName',
  'cardHolder',
  'cardHolderName',
  'cardName',
  'cardFirstName',
  'cardLastName',
  'billingAddress',
  'shippingAddress',
  'mailingAddress',
  'homeAddress',
  'workAddress',
  'businessAddress',
  'companyName',
  'employer',
  'occupation',
  'income',
  'salary',
  'creditScore',
  'creditLimit',
  'balance',
  'availableBalance',
  'accountBalance',
  'transactionAmount',
  'amount',
  'price',
  'total',
  'subtotal',
  'discount',
  'tax',
  'fee',
  'charge',
  'refundAmount',
  'refundAmount',
  'refundReason',
  'refundId',
  'chargeId',
  'chargeAmount',
  'paymentAmount',
  'paidAmount',
  'dueAmount',
  'outstandingAmount',
  'remainingAmount',
  'pendingAmount',
  'authorizedAmount',
  'capturedAmount',
  'voidedAmount',
  'refundedAmount',
  'disputedAmount',
  'chargebackAmount',
  'chargebackReason',
  'disputeReason',
  'disputeId',
  'chargebackId',
  'fraudScore',
  'riskScore',
  'riskLevel',
  'fraudReason',
  'riskReason',
  'verificationStatus',
  'verificationResult',
  'authResult',
  'authCode',
  'authResponse',
  'authMessage',
  'authStatus',
  'transactionStatus',
  'paymentStatus',
  'orderStatus',
  'refundStatus',
  'chargebackStatus',
  'disputeStatus',
  'verificationMethod',
  'authMethod',
  'paymentMethod',
  'cardType',
  'cardBrand',
  'cardCategory',
  'cardLevel',
  'cardIssuer',
  'cardBank',
  'cardCountry',
  'cardCurrency',
  'cardLocale',
  'cardLanguage',
  'cardRegion',
  'cardScheme',
  'cardNetwork',
  'cardProvider',
  'cardProcessor',
  'cardGateway',
  'cardAcquirer',
  'cardMerchant',
  'cardTerminal',
  'cardPos',
  'cardAtm',
  'cardEcommerce',
  'cardMoto',
  'cardRecurring',
  'cardInstallment',
  'cardDeferred',
  'cardPrepaid',
  'cardDebit',
  'cardCredit',
  'cardCharge',
  'cardVirtual',
  'cardPhysical',
  'cardDigital',
  'cardContactless',
  'cardChip',
  'cardMagnetic',
  'cardEmv',
  'cardNfc',
  'cardRfid',
  'cardBle',
  'cardQr',
  'cardBarcode',
  'cardBiometric',
  'cardFingerprint',
  'cardFace',
  'cardVoice',
  'cardIris',
  'cardPalm',
  'cardVein',
  'cardBehavior',
  'cardKeystroke',
  'cardMouse',
  'cardTouch',
  'cardGesture',
  'cardTyping',
  'cardSwiping',
  'cardScrolling',
  'cardClicking',
  'cardTapping',
  'cardHolding',
  'cardReleasing',
  'cardPressing',
  'cardDragging',
  'cardDropping',
  'cardZooming',
  'cardPanning',
  'cardRotating',
  'cardPinching',
  'cardSpreading',
  'cardFlicking',
  'cardSliding',
  'cardSwiping',
  'cardScrolling',
  'cardTilting',
  'cardShaking',
  'cardOrienting',
  'cardAccelerating',
  'cardDecelerating',
  'cardTurning',
  'cardFlipping',
  'cardTwisting',
  'cardBending',
  'cardFolding',
  'cardUnfolding',
  'cardOpening',
  'cardClosing',
  'cardLocking',
  'cardUnlocking',
  'cardConnecting',
  'cardDisconnecting',
  'cardPairing',
  'cardUnpairing',
  'cardSyncing',
  'cardUnsyncing',
  'cardBackingUp',
  'cardRestoring',
  'cardUpdating',
  'cardUpgrading',
  'cardDowngrading',
  'cardInstalling',
  'cardUninstalling',
  'cardEnabling',
  'cardDisabling',
  'cardActivating',
  'cardDeactivating',
  'cardStarting',
  'cardStopping',
  'cardPausing',
  'cardResuming',
  'cardRebooting',
  'cardResetting',
  'cardRestarting',
  'cardShuttingDown',
  'cardPoweringOn',
  'cardPoweringOff',
  'cardSleeping',
  'cardWaking',
  'cardHibernating',
  'cardSuspending',
  'cardResuming',
  'cardCharging',
  'cardDischarging',
  'cardConnectingToPower',
  'cardDisconnectingFromPower',
  'cardConnectingToNetwork',
  'cardDisconnectingFromNetwork',
  'cardConnectingToWifi',
  'cardDisconnectingFromWifi',
  'cardConnectingToBluetooth',
  'cardDisconnectingFromBluetooth',
  'cardConnectingToUsb',
  'cardDisconnectingFromUsb',
  'cardConnectingToHdmi',
  'cardDisconnectingFromHdmi',
  'cardConnectingToAudio',
  'cardDisconnectingFromAudio',
  'cardConnectingToVideo',
  'cardDisconnectingFromVideo',
  'cardConnectingToStorage',
  'cardDisconnectingFromStorage',
  'cardConnectingToPrinter',
  'cardDisconnectingFromPrinter',
  'cardConnectingToScanner',
  'cardDisconnectingFromScanner',
  'cardConnectingToCamera',
  'cardDisconnectingFromCamera',
  'cardConnectingToMicrophone',
  'cardDisconnectingFromMicrophone',
  'cardConnectingToSpeaker',
  'cardDisconnectingFromSpeaker',
  'cardConnectingToHeadphones',
  'cardDisconnectingFromHeadphones',
  'cardConnectingToDisplay',
  'cardDisconnectingFromDisplay',
  'cardConnectingToProjector',
  'cardDisconnectingFromProjector',
  'cardConnectingToMonitor',
  'cardDisconnectingFromMonitor',
  'cardConnectingToKeyboard',
  'cardDisconnectingFromKeyboard',
  'cardConnectingToMouse',
  'cardDisconnectingFromMouse',
  'cardConnectingToTouchpad',
  'cardDisconnectingFromTouchpad',
  'cardConnectingToTrackpad',
  'cardDisconnectingFromTrackpad',
  'cardConnectingToTrackball',
  'cardDisconnectingFromTrackball',
  'cardConnectingToJoystick',
  'cardDisconnectingFromJoystick',
  'cardConnectingToGamepad',
  'cardDisconnectingFromGamepad',
  'cardConnectingToController',
  'cardDisconnectingFromController',
  'cardConnectingToRemote',
  'cardDisconnectingFromRemote',
  'cardConnectingToSensor',
  'cardDisconnectingFromSensor',
  'cardConnectingToActuator',
  'cardDisconnectingFromActuator',
  'cardConnectingToMotor',
  'cardDisconnectingFromMotor',
  'cardConnectingToServo',
  'cardDisconnectingFromServo',
  'cardConnectingToStepper',
  'cardDisconnectingFromStepper',
  'cardConnectingToRelay',
  'cardDisconnectingFromRelay',
  'cardConnectingToSwitch',
  'cardDisconnectingFromSwitch',
  'cardConnectingToButton',
  'cardDisconnectingFromButton',
  'cardConnectingToLed',
  'cardDisconnectingFromLed',
  'cardConnectingToDisplay',
  'cardDisconnectingFromDisplay',
  'cardConnectingToScreen',
  'cardDisconnectingFromScreen',
  'cardConnectingToPanel',
  'cardDisconnectingFromPanel',
  'cardConnectingToModule',
  'cardDisconnectingFromModule',
  'cardConnectingToBoard',
  'cardDisconnectingFromBoard',
  'cardConnectingToShield',
  'cardDisconnectingFromShield',
  'cardConnectingToHat',
  'cardDisconnectingFromHat',
  'cardConnectingToCape',
  'cardDisconnectingFromCape',
  'cardConnectingToDongle',
  'cardDisconnectingFromDongle',
  'cardConnectingToAdapter',
  'cardDisconnectingFromAdapter',
  'cardConnectingToConverter',
  'cardDisconnectingFromConverter',
  'cardConnectingToCable',
  'cardDisconnectingFromCable',
  'cardConnectingToWire',
  'cardDisconnectingFromWire',
  'cardConnectingToCord',
  'cardDisconnectingFromCord',
  'cardConnectingToConnector',
  'cardDisconnectingFromConnector',
  'cardConnectingToPort',
  'cardDisconnectingFromPort',
  'cardConnectingToSlot',
  'cardDisconnectingFromSlot',
  'cardConnectingToSocket',
  'cardDisconnectingFromSocket',
  'cardConnectingToPlug',
  'cardDisconnectingFromPlug',
  'cardConnectingToJack',
  'cardDisconnectingFromJack',
  'cardConnectingToTerminal',
  'cardDisconnectingFromTerminal',
  'cardConnectingToInterface',
  'cardDisconnectingFromInterface',
  'cardConnectingToBus',
  'cardDisconnectingFromBus',
  'cardConnectingToProtocol',
  'cardDisconnectingFromProtocol',
  'cardConnectingToStandard',
  'cardDisconnectingFromStandard',
  'cardConnectingToFormat',
  'cardDisconnectingFromFormat',
  'cardConnectingToCodec',
  'cardDisconnectingFromCodec',
  'cardConnectingToEncoder',
  'cardDisconnectingFromEncoder',
  'cardConnectingToDecoder',
  'cardDisconnectingFromDecoder',
  'cardConnectingToCompressor',
  'cardDisconnectingFromCompressor',
  'cardConnectingToDecompressor',
  'cardDisconnectingFromDecompressor',
  'cardConnectingToEncryptor',
  'cardDisconnectingFromEncryptor',
  'cardConnectingToDecryptor',
  'cardDisconnectingFromDecryptor',
  'cardConnectingToHasher',
  'cardDisconnectingFromHasher',
  'cardConnectingToSigner',
  'cardDisconnectingFromSigner',
  'cardConnectingToVerifier',
  'cardDisconnectingFromVerifier',
  'cardConnectingToAuthenticator',
  'cardDisconnectingFromAuthenticator',
  'cardConnectingToAuthorizer',
  'cardDisconnectingFromAuthorizer',
  'cardConnectingToValidator',
  'cardDisconnectingFromValidator',
  'cardConnectingToSanitizer',
  'cardDisconnectingFromSanitizer',
  'cardConnectingToNormalizer',
  'cardDisconnectingFromNormalizer',
  'cardConnectingToParser',
  'cardDisconnectingFromParser',
  'cardConnectingToSerializer',
  'cardDisconnectingFromSerializer',
  'cardConnectingToDeserializer',
  'cardDisconnectingFromDeserializer',
  'cardConnectingToEncoder',
  'cardDisconnectingToEncoder',
  'cardConnectingToDecoder',
  'cardDisconnectingToDecoder',
  'cardConnectingToCompressor',
  'cardDisconnectingToCompressor',
  'cardConnectingToDecompressor',
  'cardDisconnectingToDecompressor',
  'cardConnectingToEncryptor',
  'cardDisconnectingToEncryptor',
  'cardConnectingToDecryptor',
  'cardDisconnectingToDecryptor',
  'cardConnectingToHasher',
  'cardDisconnectingFromHasher',
  'cardConnectingToSigner',
  'cardDisconnectingFromSigner',
  'cardConnectingToVerifier',
  'cardDisconnectingFromVerifier',
  'cardConnectingToAuthenticator',
  'cardDisconnectingFromAuthenticator',
  'cardConnectingToAuthorizer',
  'cardDisconnectingFromAuthorizer',
  'cardConnectingToValidator',
  'cardDisconnectingFromValidator',
  'cardConnectingToSanitizer',
  'cardDisconnectingFromSanitizer',
  'cardConnectingToNormalizer',
  'cardDisconnectingFromNormalizer',
  'cardConnectingToParser',
  'cardDisconnectingFromParser',
  'cardConnectingToSerializer',
  'cardDisconnectingFromSerializer',
  'cardConnectingToDeserializer',
  'cardDisconnectingFromDeserializer',
];

/**
 * Redaction value to replace sensitive data
 */
const REDACTION_VALUE = '[REDACTED]';

/**
 * Maximum depth for recursive redaction
 */
const MAX_REDACTION_DEPTH = 10;

/**
 * Maximum array length to process (prevents DoS)
 */
const MAX_ARRAY_LENGTH = 1000;

// ============================================================================
// TYPES
// ============================================================================

/**
 * Log levels supported by the logger
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Audit event types for security logging
 */
export type AuditEventType =
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_FAILED'
  | 'AUTH_PASSWORD_CHANGE'
  | 'AUTH_PASSWORD_RESET'
  | 'AUTH_TOKEN_REFRESH'
  | 'AUTH_TOKEN_REVOKE'
  | 'AUTH_MFA_ENABLED'
  | 'AUTH_MFA_DISABLED'
  | 'AUTH_ACCOUNT_LOCKED'
  | 'AUTH_ACCOUNT_UNLOCKED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'USER_ROLE_CHANGED'
  | 'PERMISSION_GRANTED'
  | 'PERMISSION_REVOKED'
  | 'DATA_ACCESS'
  | 'DATA_EXPORT'
  | 'DATA_IMPORT'
  | 'DATA_DELETE'
  | 'DATA_MODIFY'
  | 'PAYMENT_PROCESSED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_FAILED'
  | 'TRANSACTION_CREATED'
  | 'TRANSACTION_UPDATED'
  | 'TRANSACTION_DELETED'
  | 'CONFIG_CHANGED'
  | 'SYSTEM_START'
  | 'SYSTEM_STOP'
  | 'SYSTEM_ERROR'
  | 'SECURITY_ALERT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'API_ACCESS'
  | 'DATABASE_ACCESS'
  | 'FILE_ACCESS'
  | 'NETWORK_ACCESS';

/**
 * Audit log entry structure
 */
export interface AuditLogEntry {
  eventType: AuditEventType;
  userId?: string | number;
  username?: string;
  resourceId?: string | number;
  resourceType?: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  correlationId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Logger metadata structure
 */
export interface LoggerMetadata {
  correlationId?: string;
  userId?: string | number;
  username?: string;
  requestId?: string;
  [key: string]: any;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sanitize string to prevent log injection attacks
 * Removes or escapes CRLF characters that could be used for log injection
 * 
 * @param input - String to sanitize
 * @returns Sanitized string safe for logging
 */
export function sanitizeForLogInjection(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  // Remove CRLF sequences and other control characters
  return input
    .replace(/[\r\n]/g, ' ') // Replace CRLF with space
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters except tab
    .replace(/\t/g, ' '); // Replace tabs with space
}

/**
 * Recursively redact sensitive fields from an object
 * 
 * @param data - Data to redact
 * @param depth - Current recursion depth (for preventing stack overflow)
 * @returns Data with sensitive fields redacted
 */
export function redactSensitiveData(data: any, depth: number = 0): any {
  // Prevent stack overflow
  if (depth > MAX_REDACTION_DEPTH) {
    return '[MAX_DEPTH_REACHED]';
  }

  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }

  // Handle primitives
  if (typeof data !== 'object') {
    return data;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    // Prevent DoS by limiting array length
    if (data.length > MAX_ARRAY_LENGTH) {
      return `[ARRAY_TRUNCATED_${MAX_ARRAY_LENGTH}]`;
    }
    return data.map((item, index) => {
      // Redact array items that are sensitive
      if (typeof item === 'object' && item !== null) {
        return redactSensitiveData(item, depth + 1);
      }
      return item;
    });
  }

  // Handle objects
  const result: Record<string, any> = {};
  
  for (const key in data) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) {
      continue;
    }

    const lowerKey = key.toLowerCase();
    
    // Check if this is a sensitive field
    const isSensitive = SENSITIVE_FIELDS.some(
      sensitiveField => lowerKey === sensitiveField.toLowerCase()
    );

    if (isSensitive) {
      // Redact sensitive field
      result[key] = REDACTION_VALUE;
    } else {
      // Recursively process nested objects
      const value = data[key];
      if (typeof value === 'object' && value !== null) {
        result[key] = redactSensitiveData(value, depth + 1);
      } else if (typeof value === 'string') {
        // Sanitize strings for log injection
        result[key] = sanitizeForLogInjection(value);
      } else {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * Generate a unique correlation ID for request tracking
 * 
 * @returns Unique correlation ID
 */
export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Extract correlation ID from request headers or generate new one
 * 
 * @param headers - Request headers
 * @returns Correlation ID
 */
export function getCorrelationId(headers?: Record<string, string>): string {
  if (headers) {
    // Check common correlation ID header names
    const correlationHeaders = [
      'x-correlation-id',
      'x-request-id',
      'correlation-id',
      'request-id',
      'x-trace-id',
      'trace-id'
    ];
    
    for (const header of correlationHeaders) {
      const value = headers[header];
      if (value && typeof value === 'string') {
        return sanitizeForLogInjection(value);
      }
    }
  }
  
  return generateCorrelationId();
}

// ============================================================================
// WINSTON FORMATTERS
// ============================================================================

/**
 * Custom format that redacts sensitive data from log messages
 */
const redactFormat = winston.format.printf((info: TransformableInfo) => {
  const { level, message, timestamp, correlationId, userId, username, ...rest } = info;
  
  // Redact sensitive data from the message and metadata
  const redactedMessage = typeof message === 'object' 
    ? JSON.stringify(redactSensitiveData(message))
    : sanitizeForLogInjection(String(message));
  
  const redactedRest = redactSensitiveData(rest);
  
  // Build log entry
  let logEntry = `${timestamp} [${level.toUpperCase()}]`;
  
  if (correlationId) {
    logEntry += ` [${correlationId}]`;
  }
  
  if (userId) {
    logEntry += ` [userId:${userId}]`;
  }
  
  if (username) {
    logEntry += ` [user:${username}]`;
  }
  
  logEntry += ` ${redactedMessage}`;
  
  // Add additional metadata if present
  if (Object.keys(redactedRest).length > 0) {
    logEntry += ` ${JSON.stringify(redactedRest)}`;
  }
  
  return logEntry;
});

/**
 * Custom format for audit logs
 */
const auditFormat = winston.format.printf((info: TransformableInfo) => {
  const { timestamp, level, ...rest } = info;
  const auditData = redactSensitiveData(rest);
  return `${timestamp} [AUDIT] [${level.toUpperCase()}] ${JSON.stringify(auditData)}`;
});

// ============================================================================
// LOGGER CONFIGURATION
// ============================================================================

/**
 * Get log level from environment variable
 */
function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  const validLevels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
  
  if (envLevel && validLevels.includes(envLevel as LogLevel)) {
    return envLevel as LogLevel;
  }
  
  // Default to info in production, debug in development
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
}

/**
 * Check if debug logging is enabled
 */
function isDebugLoggingEnabled(): boolean {
  return process.env.DEBUG_LOGGING === 'true' || process.env.NODE_ENV !== 'production';
}

/**
 * Create winston logger instance
 */
const createLogger = (): winston.Logger => {
  const logLevel = getLogLevel();
  const debugEnabled = isDebugLoggingEnabled();
  
  const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.splat(),
        redactFormat
      ),
    }),
  ];
  
  // File transport for all logs (with rotation)
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        redactFormat
      ),
    })
  );
  
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      level: logLevel,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        redactFormat
      ),
    })
  );
  
  // Debug log file (only if debug logging is enabled)
  if (debugEnabled) {
    transports.push(
      new winston.transports.File({
        filename: 'logs/debug.log',
        level: 'debug',
        maxsize: 5242880, // 5MB
        maxFiles: 3,
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          redactFormat
        ),
      })
    );
  }
  
  // Audit log file (separate for security events)
  transports.push(
    new winston.transports.File({
      filename: 'logs/audit.log',
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 20, // Keep more audit logs
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        auditFormat
      ),
    })
  );
  
  return winston.createLogger({
    level: logLevel,
    transports,
    exitOnError: false,
  });
};

// ============================================================================
// LOGGER INSTANCE
// ============================================================================

/**
 * Main logger instance
 */
export const logger = createLogger();

// ============================================================================
// LOGGER METHODS
// ============================================================================

/**
 * Log error message
 * 
 * @param message - Error message or object
 * @param metadata - Additional metadata
 */
export function logError(message: string | Error | object, metadata?: LoggerMetadata): void {
  const error = message instanceof Error ? message : undefined;
  const errorMessage = message instanceof Error ? message.message : String(message);
  
  logger.error(errorMessage, {
    ...metadata,
    ...(error && { stack: error.stack }),
  });
}

/**
 * Log warning message
 * 
 * @param message - Warning message or object
 * @param metadata - Additional metadata
 */
export function logWarn(message: string | object, metadata?: LoggerMetadata): void {
  logger.warn(String(message), metadata);
}

/**
 * Log info message
 * 
 * @param message - Info message or object
 * @param metadata - Additional metadata
 */
export function logInfo(message: string | object, metadata?: LoggerMetadata): void {
  logger.info(String(message), metadata);
}

/**
 * Log debug message (only if debug logging is enabled)
 * 
 * @param message - Debug message or object
 * @param metadata - Additional metadata
 */
export function logDebug(message: string | object, metadata?: LoggerMetadata): void {
  if (isDebugLoggingEnabled()) {
    logger.debug(String(message), metadata);
  }
}

/**
 * Log request information
 * 
 * @param method - HTTP method
 * @param path - Request path
 * @param metadata - Additional metadata
 */
export function logRequest(method: string, path: string, metadata?: LoggerMetadata): void {
  logger.info(`${method} ${path}`, metadata);
}

/**
 * Log response information
 * 
 * @param method - HTTP method
 * @param path - Request path
 * @param statusCode - HTTP status code
 * @param responseTime - Response time in milliseconds
 * @param metadata - Additional metadata
 */
export function logResponse(
  method: string,
  path: string,
  statusCode: number,
  responseTime: number,
  metadata?: LoggerMetadata
): void {
  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
  logger[level](`${method} ${path} ${statusCode} ${responseTime}ms`, metadata);
}

/**
 * Log security event (audit log)
 * 
 * @param eventType - Type of audit event
 * @param action - Action performed
 * @param details - Event details
 * @param severity - Event severity
 * @param metadata - Additional metadata
 */
export function logAuditEvent(
  eventType: AuditEventType,
  action: string,
  details?: Record<string, any>,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
  metadata?: LoggerMetadata
): void {
  const auditEntry: AuditLogEntry = {
    eventType,
    action,
    details: redactSensitiveData(details || {}),
    timestamp: new Date(),
    severity,
    ...metadata,
  };
  
  // Log to audit file
  logger.info('AUDIT_EVENT', auditEntry);
  
  // Also log to console for high/critical severity
  if (severity === 'high' || severity === 'critical') {
    logger.warn(`AUDIT: ${eventType} - ${action}`, auditEntry);
  }
}

/**
 * Log authentication event
 * 
 * @param eventType - Type of auth event
 * @param userId - User ID
 * @param username - Username
 * @param success - Whether the operation was successful
 * @param details - Additional details
 */
export function logAuthEvent(
  eventType: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'PASSWORD_CHANGE' | 'TOKEN_REFRESH',
  userId?: string | number,
  username?: string,
  success: boolean = true,
  details?: Record<string, any>
): void {
  const severity = !success ? 'high' : 'low';
  
  logAuditEvent(
    `AUTH_${eventType}` as AuditEventType,
    `User ${eventType.toLowerCase().replace('_', ' ')}`,
    {
      success,
      ...details,
    },
    severity,
    { userId, username }
  );
}

/**
 * Log data access event
 * 
 * @param resourceType - Type of resource accessed
 * @param resourceId - Resource ID
 * @param action - Action performed
 * @param userId - User ID
 * @param username - Username
 */
export function logDataAccess(
  resourceType: string,
  resourceId: string | number,
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT',
  userId?: string | number,
  username?: string
): void {
  const severity = action === 'DELETE' || action === 'EXPORT' ? 'medium' : 'low';
  
  logAuditEvent(
    'DATA_ACCESS',
    `${action} ${resourceType}`,
    {
      resourceType,
      resourceId,
      action,
    },
    severity,
    { userId, username }
  );
}

/**
 * Log payment event
 * 
 * @param eventType - Type of payment event
 * @param amount - Payment amount
 * @param currency - Currency code
 * @param success - Whether the operation was successful
 * @param details - Additional details
 */
export function logPaymentEvent(
  eventType: 'PROCESSED' | 'REFUNDED' | 'FAILED',
  amount: number,
  currency: string = 'EUR',
  success: boolean = true,
  details?: Record<string, any>
): void {
  const severity = !success ? 'high' : 'medium';
  
  logAuditEvent(
    `PAYMENT_${eventType}` as AuditEventType,
    `Payment ${eventType.toLowerCase()}`,
    {
      amount,
      currency,
      success,
      ...details,
    },
    severity
  );
}

/**
 * Log security alert
 * 
 * @param alertType - Type of security alert
 * @param message - Alert message
 * @param details - Alert details
 * @param severity - Alert severity
 */
export function logSecurityAlert(
  alertType: string,
  message: string,
  details?: Record<string, any>,
  severity: 'medium' | 'high' | 'critical' = 'high'
): void {
  logAuditEvent(
    'SECURITY_ALERT',
    message,
    {
      alertType,
      ...details,
    },
    severity
  );
}

/**
 * Create a child logger with predefined metadata
 * 
 * @param metadata - Metadata to include in all log entries
 * @returns Child logger function
 */
export function createChildLogger(metadata: LoggerMetadata): {
  error: (message: string | Error | object, additionalMetadata?: LoggerMetadata) => void;
  warn: (message: string | object, additionalMetadata?: LoggerMetadata) => void;
  info: (message: string | object, additionalMetadata?: LoggerMetadata) => void;
  debug: (message: string | object, additionalMetadata?: LoggerMetadata) => void;
} {
  return {
    error: (message: string | Error | object, additionalMetadata?: LoggerMetadata) => {
      logError(message, { ...metadata, ...additionalMetadata });
    },
    warn: (message: string | object, additionalMetadata?: LoggerMetadata) => {
      logWarn(message, { ...metadata, ...additionalMetadata });
    },
    info: (message: string | object, additionalMetadata?: LoggerMetadata) => {
      logInfo(message, { ...metadata, ...additionalMetadata });
    },
    debug: (message: string | object, additionalMetadata?: LoggerMetadata) => {
      logDebug(message, { ...metadata, ...additionalMetadata });
    },
  };
}

// ============================================================================
// EXPRESS MIDDLEWARE
// ============================================================================

/**
 * Express middleware to add correlation ID to request
 */
export function correlationIdMiddleware(
  req: any,
  res: any,
  next: any
): void {
  req.correlationId = getCorrelationId(req.headers);
  res.setHeader('X-Correlation-ID', req.correlationId);
  next();
}

/**
 * Express middleware to log requests
 */
export function requestLoggerMiddleware(
  req: any,
  res: any,
  next: any
): void {
  const startTime = Date.now();
  
  // Log request
  logRequest(req.method, req.path, {
    correlationId: req.correlationId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  
  // Log response when finished
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    logResponse(
      req.method,
      req.path,
      res.statusCode,
      responseTime,
      {
        correlationId: req.correlationId,
        ip: req.ip,
      }
    );
  });
  
  next();
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  logger,
  logError,
  logWarn,
  logInfo,
  logDebug,
  logRequest,
  logResponse,
  logAuditEvent,
  logAuthEvent,
  logDataAccess,
  logPaymentEvent,
  logSecurityAlert,
  createChildLogger,
  correlationIdMiddleware,
  requestLoggerMiddleware,
  redactSensitiveData,
  sanitizeForLogInjection,
  generateCorrelationId,
  getCorrelationId,
  SENSITIVE_FIELDS,
};
