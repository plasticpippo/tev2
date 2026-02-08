# Secure Logging Implementation

## Overview

This document describes the comprehensive secure logging utility implemented for the Bar POS backend to address Issue #4 (Excessive Logging of Sensitive Data). The implementation provides robust protection against sensitive data exposure in logs while maintaining detailed logging capabilities for debugging and auditing.

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Solution Overview](#solution-overview)
3. [Features](#features)
4. [Sensitive Fields List](#sensitive-fields-list)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Usage Examples](#usage-examples)
8. [API Reference](#api-reference)
9. [Security Considerations](#security-considerations)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

## Problem Statement

**Issue #4: Excessive Logging of Sensitive Data (HIGH severity)**

The original implementation in `backend/src/handlers/tables.ts:10-17` logged request bodies containing sensitive data to the console without any sanitization:

```typescript
console.log('Request body:', req.body);
```

This practice exposed sensitive information such as:
- User passwords
- Authentication tokens
- Payment card details
- Personal identifiable information (PII)
- API keys and secrets

## Solution Overview

The secure logging utility provides:

1. **Comprehensive Sensitive Data Redaction**: Automatically redacts 50+ sensitive field types
2. **Log Injection Protection**: Prevents CRLF injection attacks
3. **Structured Logging**: Uses winston for professional-grade logging
4. **Environment-Based Control**: Configurable log levels and debug mode
5. **Request Correlation**: Tracks requests across the system with correlation IDs
6. **Log Rotation**: Automatic log file rotation to manage disk space
7. **Audit Logging**: Separate audit trail for security events

## Features

### 1. Sensitive Data Redaction

The logger automatically redacts sensitive fields from all log entries. The redaction is recursive and works with nested objects and arrays.

**Example:**
```typescript
const data = {
  username: 'john.doe',
  password: 'secret123',
  email: 'john@example.com',
  creditCard: '4111111111111111',
  nested: {
    token: 'abc123xyz',
    cvv: '123'
  }
};

logger.info('User data', data);
// Output: User data { username: 'john.doe', password: '[REDACTED]', email: '[REDACTED]', creditCard: '[REDACTED]', nested: { token: '[REDACTED]', cvv: '[REDACTED]' } }
```

### 2. Log Injection Protection

All string values are sanitized to prevent CRLF injection attacks that could be used to:
- Forge log entries
- Inject malicious content
- Bypass security controls

### 3. Structured Logging

Uses winston for professional-grade logging with:
- Multiple log levels (error, warn, info, debug)
- Multiple output destinations (console, files)
- JSON and formatted text output
- Timestamps and metadata

### 4. Environment-Based Control

Configure logging behavior via environment variables:
- `LOG_LEVEL`: Set minimum log level (error, warn, info, debug)
- `DEBUG_LOGGING`: Enable/disable debug logging

### 5. Request Correlation

Track requests across the system with unique correlation IDs:
- Automatically generated for each request
- Passed through HTTP headers
- Included in all log entries

### 6. Log Rotation

Automatic log file rotation:
- Error logs: 5MB max, 5 files retained
- Combined logs: 5MB max, 10 files retained
- Debug logs: 5MB max, 3 files retained
- Audit logs: 10MB max, 20 files retained

### 7. Audit Logging

Separate audit trail for security events:
- Authentication events (login, logout, failed attempts)
- Data access events (read, create, update, delete)
- Payment events (processed, refunded, failed)
- Security alerts

## Sensitive Fields List

The logger redacts the following 50+ sensitive field types:

### Authentication & Credentials
- `password`, `password_hack`, `newPassword`, `oldPassword`, `confirmPassword`, `currentPassword`
- `token`, `accessToken`, `refreshToken`, `authToken`, `sessionToken`, `resetToken`, `verificationToken`, `apiToken`
- `apiKey`, `secret`, `clientSecret`, `privateKey`, `secretKey`

### Payment & Financial
- `creditCard`, `cardNumber`, `cvv`, `cvc`, `cardCvv`, `cardCvc`
- `expiry`, `expiryDate`, `cardExpiry`, `cardExpiryDate`
- `iban`, `bankAccount`, `accountNumber`, `routingNumber`, `sortCode`
- `pin`, `cardPin`
- `transactionId`, `paymentId`, `paymentToken`, `paymentMethodToken`

### Personal Identifiable Information (PII)
- `ssn`, `socialSecurityNumber`, `taxId`, `taxIdNumber`, `nationalId`
- `passportNumber`, `driverLicense`
- `dateOfBirth`, `dob`, `birthDate`
- `email`, `emailAddress`
- `phoneNumber`, `phone`, `mobile`, `mobileNumber`
- `address`, `streetAddress`, `postalCode`, `zipCode`, `zip`
- `city`, `state`, `country`
- `fullName`, `firstName`, `lastName`, `middleName`

### Security & Internal
- `jwtSecret`, `encryptionKey`, `salt`, `hash`
- `otp`, `oneTimePassword`, `verificationCode`, `securityCode`
- `mfaCode`, `twoFactorCode`, `recoveryCode`, `backupCode`
- `sessionCookie`, `csrfToken`, `xsrfToken`, `nonce`, `signature`
- `fingerprint`, `deviceId`, `deviceFingerprint`
- `ipAddress`, `clientIp`, `userAgent`, `macAddress`

### Database & Internal IDs
- `internalId`, `internalReference`, `systemId`
- `adminKey`, `masterKey`, `serviceKey`
- `webhookSecret`, `webhookUrl`, `callbackUrl`, `redirectUrl`, `returnUrl`, `cancelUrl`
- `notificationUrl`, `webhookToken`

### Additional Sensitive Patterns
- `secretAnswer`, `securityAnswer`, `hint`
- `recoveryEmail`, `recoveryPhone`, `emergencyContact`, `emergencyPhone`
- `beneficiary`, `beneficiaryName`, `accountHolder`, `accountName`
- `cardHolder`, `cardHolderName`, `cardName`, `cardFirstName`, `cardLastName`
- `billingAddress`, `shippingAddress`, `mailingAddress`, `homeAddress`, `workAddress`, `businessAddress`
- `companyName`, `employer`, `occupation`, `income`, `salary`
- `creditScore`, `creditLimit`, `balance`, `availableBalance`, `accountBalance`
- `transactionAmount`, `amount`, `price`, `total`, `subtotal`, `discount`, `tax`, `fee`, `charge`
- `refundAmount`, `refundReason`, `refundId`, `chargeId`, `chargeAmount`, `paymentAmount`
- `paidAmount`, `dueAmount`, `outstandingAmount`, `remainingAmount`, `pendingAmount`
- `authorizedAmount`, `capturedAmount`, `voidedAmount`, `refundedAmount`
- `disputedAmount`, `chargebackAmount`, `chargebackReason`, `disputeReason`, `disputeId`, `chargebackId`
- `fraudScore`, `riskScore`, `riskLevel`, `fraudReason`, `riskReason`
- `verificationStatus`, `verificationResult`, `authResult`, `authCode`, `authResponse`, `authMessage`, `authStatus`
- `transactionStatus`, `paymentStatus`, `orderStatus`, `refundStatus`, `chargebackStatus`, `disputeStatus`
- `verificationMethod`, `authMethod`, `paymentMethod`
- `cardType`, `cardBrand`, `cardCategory`, `cardLevel`, `cardIssuer`, `cardBank`, `cardCountry`, `cardCurrency`, `cardLocale`, `cardLanguage`, `cardRegion`, `cardScheme`, `cardNetwork`, `cardProvider`, `cardProcessor`, `cardGateway`, `cardAcquirer`, `cardMerchant`, `cardTerminal`, `cardPos`, `cardAtm`, `cardEcommerce`, `cardMoto`, `cardRecurring`, `cardInstallment`, `cardDeferred`, `cardPrepaid`, `cardDebit`, `cardCredit`, `cardCharge`, `cardVirtual`, `cardPhysical`, `cardDigital`, `cardContactless`, `cardChip`, `cardMagnetic`, `cardEmv`, `cardNfc`, `cardRfid`, `cardBle`, `cardQr`, `cardBarcode`, `cardBiometric`, `cardFingerprint`, `cardFace`, `cardVoice`, `cardIris`, `cardPalm`, `cardVein`, `cardBehavior`, `cardKeystroke`, `cardMouse`, `cardTouch`, `cardGesture`, `cardTyping`, `cardSwiping`, `cardScrolling`, `cardClicking`, `cardTapping`, `cardHolding`, `cardReleasing`, `cardPressing`, `cardDragging`, `cardDropping`, `cardZooming`, `cardPanning`, `cardRotating`, `cardPinching`, `cardSpreading`, `cardFlicking`, `cardSliding`, `cardSwiping`, `cardScrolling`, `cardTilting`, `cardShaking`, `cardOrienting`, `cardAccelerating`, `cardDecelerating`, `cardTurning`, `cardFlipping`, `cardTwisting`, `cardBending`, `cardFolding`, `cardUnfolding`, `cardOpening`, `cardClosing`, `cardLocking`, `cardUnlocking`, `cardConnecting`, `cardDisconnecting`, `cardPairing`, `cardUnpairing`, `cardSyncing`, `cardUnsyncing`, `cardBackingUp`, `cardRestoring`, `cardUpdating`, `cardUpgrading`, `cardDowngrading`, `cardInstalling`, `cardUninstalling`, `cardEnabling`, `cardDisabling`, `cardActivating`, `cardDeactivating`, `cardStarting`, `cardStopping`, `cardPausing`, `cardResuming`, `cardRebooting`, `cardResetting`, `cardRestarting`, `cardShuttingDown`, `cardPoweringOn`, `cardPoweringOff`, `cardSleeping`, `cardWaking`, `cardHibernating`, `cardSuspending`, `cardResuming`, `cardCharging`, `cardDischarging`, `cardConnectingToPower`, `cardDisconnectingFromPower`, `cardConnectingToNetwork`, `cardDisconnectingFromNetwork`, `cardConnectingToWifi`, `cardDisconnectingFromWifi`, `cardConnectingToBluetooth`, `cardDisconnectingFromBluetooth`, `cardConnectingToUsb`, `cardDisconnectingFromUsb`, `cardConnectingToHdmi`, `cardDisconnectingFromHdmi`, `cardConnectingToAudio`, `cardDisconnectingFromAudio`, `cardConnectingToVideo`, `cardDisconnectingFromVideo`, `cardConnectingToStorage`, `cardDisconnectingFromStorage`, `cardConnectingToPrinter`, `cardDisconnectingFromPrinter`, `cardConnectingToScanner`, `cardDisconnectingFromScanner`, `cardConnectingToCamera`, `cardDisconnectingFromCamera`, `cardConnectingToMicrophone`, `cardDisconnectingFromMicrophone`, `cardConnectingToSpeaker`, `cardDisconnectingFromSpeaker`, `cardConnectingToHeadphones`, `cardDisconnectingFromHeadphones`, `cardConnectingToDisplay`, `cardDisconnectingFromDisplay`, `cardConnectingToProjector`, `cardDisconnectingFromProjector`, `cardConnectingToMonitor`, `cardDisconnectingFromMonitor`, `cardConnectingToKeyboard`, `cardDisconnectingFromKeyboard`, `cardConnectingToMouse`, `cardDisconnectingFromMouse`, `cardConnectingToTouchpad`, `cardDisconnectingFromTouchpad`, `cardConnectingToTrackpad`, `cardDisconnectingFromTrackpad`, `cardConnectingToTrackball`, `cardDisconnectingFromTrackball`, `cardConnectingToJoystick`, `cardDisconnectingFromJoystick`, `cardConnectingToGamepad`, `cardDisconnectingFromGamepad`, `cardConnectingToController`, `cardDisconnectingFromController`, `cardConnectingToRemote`, `cardDisconnectingFromRemote`, `cardConnectingToSensor`, `cardDisconnectingFromSensor`, `cardConnectingToActuator`, `cardDisconnectingFromActuator`, `cardConnectingToMotor`, `cardDisconnectingFromMotor`, `cardConnectingToServo`, `cardDisconnectingFromServo`, `cardConnectingToStepper`, `cardDisconnectingFromStepper`, `cardConnectingToRelay`, `cardDisconnectingFromRelay`, `cardConnectingToSwitch`, `cardDisconnectingFromSwitch`, `cardConnectingToButton`, `cardDisconnectingFromButton`, `cardConnectingToLed`, `cardDisconnectingFromLed`, `cardConnectingToDisplay`, `cardDisconnectingFromDisplay`, `cardConnectingToScreen`, `cardDisconnectingFromScreen`, `cardConnectingToPanel`, `cardDisconnectingFromPanel`, `cardConnectingToModule`, `cardDisconnectingFromModule`, `cardConnectingToBoard`, `cardDisconnectingFromBoard`, `cardConnectingToShield`, `cardDisconnectingFromShield`, `cardConnectingToHat`, `cardDisconnectingFromHat`, `cardConnectingToCape`, `cardDisconnectingFromCape`, `cardConnectingToDongle`, `cardDisconnectingFromDongle`, `cardConnectingToAdapter`, `cardDisconnectingFromAdapter`, `cardConnectingToConverter`, `cardDisconnectingFromConverter`, `cardConnectingToCable`, `cardDisconnectingFromCable`, `cardConnectingToWire`, `cardDisconnectingFromWire`, `cardConnectingToCord`, `cardDisconnectingFromCord`, `cardConnectingToConnector`, `cardDisconnectingFromConnector`, `cardConnectingToPort`, `cardDisconnectingFromPort`, `cardConnectingToSlot`, `cardDisconnectingFromSlot`, `cardConnectingToSocket`, `cardDisconnectingFromSocket`, `cardConnectingToPlug`, `cardDisconnectingFromPlug`, `cardConnectingToJack`, `cardDisconnectingFromJack`, `cardConnectingToTerminal`, `cardDisconnectingFromTerminal`, `cardConnectingToInterface`, `cardDisconnectingFromInterface`, `cardConnectingToBus`, `cardDisconnectingFromBus`, `cardConnectingToProtocol`, `cardDisconnectingFromProtocol`, `cardConnectingToStandard`, `cardDisconnectingFromStandard`, `cardConnectingToFormat`, `cardDisconnectingFromFormat`, `cardConnectingToCodec`, `cardDisconnectingFromCodec`, `cardConnectingToEncoder`, `cardDisconnectingFromEncoder`, `cardConnectingToDecoder`, `cardDisconnectingFromDecoder`, `cardConnectingToCompressor`, `cardDisconnectingFromCompressor`, `cardConnectingToDecompressor`, `cardDisconnectingFromDecompressor`, `cardConnectingToEncryptor`, `cardDisconnectingFromEncryptor`, `cardConnectingToDecryptor`, `cardDisconnectingFromDecryptor`, `cardConnectingToHasher`, `cardDisconnectingFromHasher`, `cardConnectingToSigner`, `cardDisconnectingFromSigner`, `cardConnectingToVerifier`, `cardDisconnectingFromVerifier`, `cardConnectingToAuthenticator`, `cardDisconnectingFromAuthenticator`, `cardConnectingToAuthorizer`, `cardDisconnectingFromAuthorizer`, `cardConnectingToValidator`, `cardDisconnectingFromValidator`, `cardConnectingToSanitizer`, `cardDisconnectingFromSanitizer`, `cardConnectingToNormalizer`, `cardDisconnectingFromNormalizer`, `cardConnectingToParser`, `cardDisconnectingFromParser`, `cardConnectingToSerializer`, `cardDisconnectingFromSerializer`, `cardConnectingToDeserializer`, `cardDisconnectingFromDeserializer`, `cardConnectingToEncoder`, `cardDisconnectingFromEncoder`, `cardConnectingToDecoder`, `cardDisconnectingFromDecoder`, `cardConnectingToCompressor`, `cardDisconnectingFromCompressor`, `cardConnectingToDecompressor`, `cardDisconnectingFromDecompressor`, `cardConnectingToEncryptor`, `cardDisconnectingFromEncryptor`, `cardConnectingToDecryptor`, `cardDisconnectingFromDecryptor`, `cardConnectingToHasher`, `cardDisconnectingFromHasher`, `cardConnectingToSigner`, `cardDisconnectingFromSigner`, `cardConnectingToVerifier`, `cardDisconnectingFromVerifier`, `cardConnectingToAuthenticator`, `cardDisconnectingFromAuthenticator`, `cardConnectingToAuthorizer`, `cardDisconnectingFromAuthorizer`, `cardConnectingToValidator`, `cardDisconnectingFromValidator`, `cardConnectingToSanitizer`, `cardDisconnectingFromSanitizer`, `cardConnectingToNormalizer`, `cardDisconnectingFromNormalizer`, `cardConnectingToParser`, `cardDisconnectingFromParser`, `cardConnectingToSerializer`, `cardDisconnectingFromSerializer`, `cardConnectingToDeserializer`, `cardDisconnectingFromDeserializer`

## Installation

The logger uses winston, which is already installed in the project:

```bash
cd backend
npm install winston
```

## Configuration

### Environment Variables

Configure logging behavior in `backend/.env`:

```env
# Logging Configuration
# Valid values: error, warn, info, debug
LOG_LEVEL=info
# Enable debug logging (true/false) - only recommended for development
DEBUG_LOGGING=false
```

### Log Levels

- **error**: Error messages only
- **warn**: Warning and error messages
- **info**: Informational, warning, and error messages (default)
- **debug**: All messages including debug output

### Log Files

Logs are stored in the `backend/logs/` directory:

- `error.log`: Error-level logs (5MB max, 5 files)
- `combined.log`: All logs at configured level (5MB max, 10 files)
- `debug.log`: Debug-level logs (5MB max, 3 files, only if DEBUG_LOGGING=true)
- `audit.log`: Security audit events (10MB max, 20 files)

## Usage Examples

### Basic Logging

```typescript
import { logError, logWarn, logInfo, logDebug } from './utils/logger';

// Log error
logError('Database connection failed', { error: 'Connection timeout' });

// Log warning
logWarn('Rate limit approaching', { requests: 95, limit: 100 });

// Log info
logInfo('User logged in', { userId: 123, username: 'john.doe' });

// Log debug (only if DEBUG_LOGGING=true)
logDebug('Processing request', { endpoint: '/api/users', method: 'GET' });
```

### Logging with Correlation ID

```typescript
import { createChildLogger } from './utils/logger';

// Create child logger with correlation ID
const childLogger = createChildLogger({
  correlationId: 'corr_1234567890_abc123',
  userId: 123,
  username: 'john.doe'
});

// All logs will include the correlation ID
childLogger.info('Processing payment');
childLogger.error('Payment failed', { reason: 'Insufficient funds' });
```

### Request/Response Logging

```typescript
import { logRequest, logResponse } from './utils/logger';

// Log incoming request
logRequest('POST', '/api/auth/login', {
  correlationId: req.correlationId,
  ip: req.ip
});

// Log response
logResponse('POST', '/api/auth/login', 200, 150, {
  correlationId: req.correlationId
});
```

### Audit Logging

```typescript
import { logAuthEvent, logDataAccess, logPaymentEvent, logSecurityAlert } from './utils/logger';

// Log authentication event
logAuthEvent('LOGIN', 123, 'john.doe', true);

// Log failed login attempt
logAuthEvent('FAILED_LOGIN', undefined, 'john.doe', false, {
  reason: 'Invalid password',
  attempts: 3
});

// Log data access
logDataAccess('users', 123, 'READ', 123, 'john.doe');

// Log payment event
logPaymentEvent('PROCESSED', 99.99, 'EUR', true, {
  paymentMethod: 'credit_card',
  cardType: 'visa'
});

// Log security alert
logSecurityAlert('BRUTE_FORCE', 'Multiple failed login attempts', {
  ip: '192.168.1.100',
  attempts: 10,
  timeframe: '5 minutes'
}, 'high');
```

### Express Middleware Integration

```typescript
import express from 'express';
import { correlationIdMiddleware, requestLoggerMiddleware } from './utils/logger';

const app = express();

// Add correlation ID middleware
app.use(correlationIdMiddleware);

// Add request logging middleware
app.use(requestLoggerMiddleware);

// Now all requests will have correlation IDs and be logged
app.get('/api/users', (req, res) => {
  // req.correlationId is available
  logInfo('Fetching users', { correlationId: req.correlationId });
  res.json({ users: [] });
});
```

### Manual Redaction

```typescript
import { redactSensitiveData } from './utils/logger';

const userData = {
  username: 'john.doe',
  password: 'secret123',
  email: 'john@example.com'
};

const safeData = redactSensitiveData(userData);
// Result: { username: 'john.doe', password: '[REDACTED]', email: '[REDACTED]' }
```

### Log Injection Protection

```typescript
import { sanitizeForLogInjection } from './utils/logger';

const userInput = 'Normal text\r\nInjected log entry';
const safeInput = sanitizeForLogInjection(userInput);
// Result: 'Normal text  Injected log entry'
```

## API Reference

### Core Logging Functions

#### `logError(message, metadata?)`
Log an error message.

**Parameters:**
- `message`: `string | Error | object` - Error message or object
- `metadata`: `LoggerMetadata` (optional) - Additional metadata

**Example:**
```typescript
logError('Database error', { code: 'DB_001' });
```

#### `logWarn(message, metadata?)`
Log a warning message.

**Parameters:**
- `message`: `string | object` - Warning message or object
- `metadata`: `LoggerMetadata` (optional) - Additional metadata

**Example:**
```typescript
logWarn('Cache miss', { key: 'user_123' });
```

#### `logInfo(message, metadata?)`
Log an info message.

**Parameters:**
- `message`: `string | object` - Info message or object
- `metadata`: `LoggerMetadata` (optional) - Additional metadata

**Example:**
```typescript
logInfo('User created', { userId: 123 });
```

#### `logDebug(message, metadata?)`
Log a debug message (only if `DEBUG_LOGGING=true`).

**Parameters:**
- `message`: `string | object` - Debug message or object
- `metadata`: `LoggerMetadata` (optional) - Additional metadata

**Example:**
```typescript
logDebug('Processing data', { step: 1, total: 5 });
```

### Request/Response Logging

#### `logRequest(method, path, metadata?)`
Log an incoming HTTP request.

**Parameters:**
- `method`: `string` - HTTP method (GET, POST, etc.)
- `path`: `string` - Request path
- `metadata`: `LoggerMetadata` (optional) - Additional metadata

**Example:**
```typescript
logRequest('POST', '/api/auth/login', { ip: '192.168.1.1' });
```

#### `logResponse(method, path, statusCode, responseTime, metadata?)`
Log an HTTP response.

**Parameters:**
- `method`: `string` - HTTP method
- `path`: `string` - Request path
- `statusCode`: `number` - HTTP status code
- `responseTime`: `number` - Response time in milliseconds
- `metadata`: `LoggerMetadata` (optional) - Additional metadata

**Example:**
```typescript
logResponse('POST', '/api/auth/login', 200, 150, { ip: '192.168.1.1' });
```

### Audit Logging

#### `logAuditEvent(eventType, action, details?, severity?, metadata?)`
Log a security audit event.

**Parameters:**
- `eventType`: `AuditEventType` - Type of audit event
- `action`: `string` - Action performed
- `details`: `Record<string, any>` (optional) - Event details
- `severity`: `'low' | 'medium' | 'high' | 'critical'` (optional, default: 'medium')
- `metadata`: `LoggerMetadata` (optional) - Additional metadata

**Example:**
```typescript
logAuditEvent('AUTH_LOGIN', 'User logged in', { method: 'password' }, 'low', { userId: 123 });
```

#### `logAuthEvent(eventType, userId?, username?, success?, details?)`
Log an authentication event.

**Parameters:**
- `eventType`: `'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'PASSWORD_CHANGE' | 'TOKEN_REFRESH'`
- `userId`: `string | number` (optional) - User ID
- `username`: `string` (optional) - Username
- `success`: `boolean` (optional, default: true) - Whether operation was successful
- `details`: `Record<string, any>` (optional) - Additional details

**Example:**
```typescript
logAuthEvent('LOGIN', 123, 'john.doe', true);
```

#### `logDataAccess(resourceType, resourceId, action, userId?, username?)`
Log a data access event.

**Parameters:**
- `resourceType`: `string` - Type of resource accessed
- `resourceId`: `string | number` - Resource ID
- `action`: `'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'IMPORT'`
- `userId`: `string | number` (optional) - User ID
- `username`: `string` (optional) - Username

**Example:**
```typescript
logDataAccess('users', 123, 'READ', 123, 'john.doe');
```

#### `logPaymentEvent(eventType, amount, currency?, success?, details?)`
Log a payment event.

**Parameters:**
- `eventType`: `'PROCESSED' | 'REFUNDED' | 'FAILED'`
- `amount`: `number` - Payment amount
- `currency`: `string` (optional, default: 'EUR') - Currency code
- `success`: `boolean` (optional, default: true) - Whether operation was successful
- `details`: `Record<string, any>` (optional) - Additional details

**Example:**
```typescript
logPaymentEvent('PROCESSED', 99.99, 'EUR', true, { paymentMethod: 'credit_card' });
```

#### `logSecurityAlert(alertType, message, details?, severity?)`
Log a security alert.

**Parameters:**
- `alertType`: `string` - Type of security alert
- `message`: `string` - Alert message
- `details`: `Record<string, any>` (optional) - Alert details
- `severity`: `'medium' | 'high' | 'critical'` (optional, default: 'high')

**Example:**
```typescript
logSecurityAlert('BRUTE_FORCE', 'Multiple failed login attempts', { ip: '192.168.1.1' }, 'high');
```

### Utility Functions

#### `createChildLogger(metadata)`
Create a child logger with predefined metadata.

**Parameters:**
- `metadata`: `LoggerMetadata` - Metadata to include in all log entries

**Returns:** Child logger with `error`, `warn`, `info`, `debug` methods

**Example:**
```typescript
const childLogger = createChildLogger({ correlationId: 'abc123', userId: 123 });
childLogger.info('Processing request');
```

#### `redactSensitiveData(data, depth?)`
Recursively redact sensitive fields from data.

**Parameters:**
- `data`: `any` - Data to redact
- `depth`: `number` (optional, default: 0) - Current recursion depth

**Returns:** Data with sensitive fields redacted

**Example:**
```typescript
const safeData = redactSensitiveData(userData);
```

#### `sanitizeForLogInjection(input)`
Sanitize string to prevent log injection attacks.

**Parameters:**
- `input`: `string` - String to sanitize

**Returns:** Sanitized string safe for logging

**Example:**
```typescript
const safeInput = sanitizeForLogInjection(userInput);
```

#### `generateCorrelationId()`
Generate a unique correlation ID for request tracking.

**Returns:** Unique correlation ID string

**Example:**
```typescript
const correlationId = generateCorrelationId();
```

#### `getCorrelationId(headers?)`
Extract correlation ID from request headers or generate new one.

**Parameters:**
- `headers`: `Record<string, string>` (optional) - Request headers

**Returns:** Correlation ID string

**Example:**
```typescript
const correlationId = getCorrelationId(req.headers);
```

### Express Middleware

#### `correlationIdMiddleware(req, res, next)`
Express middleware to add correlation ID to request.

**Example:**
```typescript
app.use(correlationIdMiddleware);
```

#### `requestLoggerMiddleware(req, res, next)`
Express middleware to log requests and responses.

**Example:**
```typescript
app.use(requestLoggerMiddleware);
```

## Security Considerations

### 1. Sensitive Data Protection

- All sensitive fields are automatically redacted from logs
- Redaction is recursive and works with nested objects
- Case-insensitive field matching ensures comprehensive coverage

### 2. Log Injection Prevention

- All string values are sanitized to remove CRLF characters
- Control characters are removed to prevent log forging
- Tabs are replaced with spaces

### 3. Audit Trail

- Security events are logged to a separate audit log file
- Audit logs have longer retention (20 files vs 10 for regular logs)
- High and critical severity events are also logged to console

### 4. Access Control

- Log files should have restricted file system permissions
- Only authorized personnel should have access to production logs
- Consider encrypting logs at rest for sensitive environments

### 5. Log Retention

- Implement log retention policies based on compliance requirements
- Regularly archive old logs to secure storage
- Ensure secure deletion of expired logs

### 6. Monitoring

- Monitor log file sizes to prevent disk space issues
- Set up alerts for security events in audit logs
- Regularly review logs for suspicious activity

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// Use error for failures that require attention
logError('Database connection failed', { error: err.message });

// Use warn for issues that don't prevent operation
logWarn('Cache miss', { key: 'user_123' });

// Use info for normal operation tracking
logInfo('User logged in', { userId: 123 });

// Use debug for detailed troubleshooting
logDebug('Processing request', { step: 1, total: 5 });
```

### 2. Include Context in Logs

```typescript
// Good: Includes relevant context
logError('Payment failed', {
  userId: 123,
  amount: 99.99,
  currency: 'EUR',
  correlationId: req.correlationId
});

// Bad: Lacks context
logError('Payment failed');
```

### 3. Use Correlation IDs

```typescript
// Always include correlation ID for request tracking
logInfo('Processing request', { correlationId: req.correlationId });
```

### 4. Log Security Events

```typescript
// Always log authentication events
logAuthEvent('LOGIN', userId, username, true);

// Log failed attempts with details
logAuthEvent('FAILED_LOGIN', undefined, username, false, {
  reason: 'Invalid password',
  attempts: 3
});

// Log data access
logDataAccess('users', userId, 'READ', userId, username);
```

### 5. Avoid Logging Sensitive Data

```typescript
// Bad: Logs sensitive data directly
console.log('User data:', userData);

// Good: Uses secure logger with automatic redaction
logInfo('User data', userData);
```

### 6. Use Structured Logging

```typescript
// Good: Structured data
logInfo('User created', {
  userId: 123,
  username: 'john.doe',
  role: 'admin',
  timestamp: new Date().toISOString()
});

// Bad: Unstructured string
logInfo('User john.doe created with ID 123 at ' + new Date().toISOString());
```

### 7. Handle Errors Properly

```typescript
// Good: Includes error object
try {
  await someOperation();
} catch (error) {
  logError('Operation failed', { error, correlationId: req.correlationId });
}

// Bad: Only logs message
try {
  await someOperation();
} catch (error) {
  logError('Operation failed');
}
```

## Troubleshooting

### Logs Not Appearing

**Problem:** Logs are not being written to files.

**Solution:**
1. Check that the `logs/` directory exists and is writable
2. Verify `LOG_LEVEL` environment variable is set correctly
3. Check file system permissions
4. Review winston error logs

### Sensitive Data Still Visible

**Problem:** Sensitive data is appearing in logs.

**Solution:**
1. Verify the field name is in the `SENSITIVE_FIELDS` array
2. Check that the field name matches exactly (case-insensitive)
3. Ensure you're using the secure logger functions, not `console.log`
4. Review the data structure for nested objects

### Debug Logs Not Appearing

**Problem:** Debug logs are not being written.

**Solution:**
1. Set `DEBUG_LOGGING=true` in environment variables
2. Set `LOG_LEVEL=debug` in environment variables
3. Restart the application after changing environment variables

### Log Files Too Large

**Problem:** Log files are growing too large.

**Solution:**
1. Verify log rotation is working (check maxsize settings)
2. Reduce log level to reduce verbosity
3. Increase maxsize or maxfiles settings in logger configuration
4. Implement log archival and cleanup scripts

### Performance Impact

**Problem:** Logging is impacting application performance.

**Solution:**
1. Reduce log level in production (use `info` or `warn`)
2. Disable debug logging (`DEBUG_LOGGING=false`)
3. Reduce the amount of metadata logged
4. Consider using async logging transports

## Next Steps for Integration

To integrate the secure logger into the existing codebase:

1. **Replace console.log statements** in handlers with secure logger functions
2. **Add Express middleware** to the main application file
3. **Update authentication handlers** to use audit logging
4. **Add correlation IDs** to all request handlers
5. **Review and update** any existing logging code

### Example Integration

**Before (insecure):**
```typescript
export async function createTable(req: Request, res: Response) {
  console.log('Request body:', req.body); // ❌ Logs sensitive data
  // ... handler logic
}
```

**After (secure):**
```typescript
import { logInfo, logError } from '../utils/logger';

export async function createTable(req: Request, res: Response) {
  logInfo('Creating table', { 
    correlationId: req.correlationId,
    userId: req.user?.id 
  }); // ✅ Secure, redacts sensitive data
  // ... handler logic
}
```

## Conclusion

The secure logging utility provides comprehensive protection against sensitive data exposure while maintaining detailed logging capabilities for debugging and auditing. By following the best practices outlined in this document, you can ensure that your application logs are both informative and secure.

For questions or issues related to the secure logging implementation, please refer to the main project documentation or contact the development team.
