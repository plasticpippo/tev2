import nodemailer from 'nodemailer';
import { prisma } from '../prisma';
import { logError, logInfo, logDebug } from '../utils/logger';

export interface EmailConfig {
  host: string | null;
  port: number;
  user: string | null;
  password: string | null;
  fromAddress: string | null;
  fromName: string | null;
  secure: boolean;
  enabled: boolean;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

export type SmtpTestResult = {
  success: boolean;
  message: string;
  details?: {
    host: string;
    port: number;
    secure: boolean;
    responseTime?: number;
  };
  error?: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;
let lastConfigChecksum: string | null = null;

function getConfigChecksum(config: EmailConfig): string {
  return `${config.host}:${config.port}:${config.user}:${config.secure}`;
}

export async function getEmailConfig(): Promise<EmailConfig> {
  const settings = await prisma.settings.findFirst();

  if (!settings) {
    return {
      host: null,
      port: 587,
      user: null,
      password: null,
      fromAddress: null,
      fromName: null,
      secure: false,
      enabled: false,
    };
  }

  return {
    host: settings.emailSmtpHost,
    port: settings.emailSmtpPort ?? 587,
    user: settings.emailSmtpUser,
    password: settings.emailSmtpPassword,
    fromAddress: settings.emailFromAddress,
    fromName: settings.emailFromName,
    secure: settings.emailSmtpSecure ?? false,
    enabled: settings.emailEnabled ?? false,
  };
}

function validateSmtpConfig(config: EmailConfig): { valid: boolean; error?: string; errorCode?: string } {
  if (!config.host) {
    return { valid: false, error: 'SMTP host is not configured', errorCode: 'SMTP_HOST_REQUIRED' };
  }

  if (!config.user) {
    return { valid: false, error: 'SMTP user is not configured', errorCode: 'SMTP_USER_REQUIRED' };
  }

  if (!config.password) {
    return { valid: false, error: 'SMTP password is not configured', errorCode: 'SMTP_PASSWORD_REQUIRED' };
  }

  if (!config.fromAddress) {
    return { valid: false, error: 'From address is not configured', errorCode: 'FROM_ADDRESS_REQUIRED' };
  }

  const hostRegex = /^[a-zA-Z0-9.-]+$/;
  if (!hostRegex.test(config.host)) {
    return { valid: false, error: 'Invalid SMTP host format', errorCode: 'INVALID_SMTP_HOST' };
  }

  if (config.port < 1 || config.port > 65535) {
    return { valid: false, error: 'Invalid SMTP port', errorCode: 'INVALID_SMTP_PORT' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(config.fromAddress)) {
    return { valid: false, error: 'Invalid from address format', errorCode: 'INVALID_FROM_ADDRESS' };
  }

  return { valid: true };
}

function createTransporter(config: EmailConfig): nodemailer.Transporter {
  return nodemailer.createTransport({
    pool: true,
    host: config.host!,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user!,
      pass: config.password!,
    },
    tls: {
      rejectUnauthorized: true,
      minVersion: 'TLSv1.2',
    },
    connectionTimeout: 10000,
    socketTimeout: 10000,
  } as any);
}

async function getTransporter(config: EmailConfig): Promise<nodemailer.Transporter> {
  const checksum = getConfigChecksum(config);

  if (cachedTransporter && lastConfigChecksum === checksum) {
    return cachedTransporter;
  }

  if (cachedTransporter) {
    cachedTransporter.close();
    cachedTransporter = null;
  }

  const transporter = createTransporter(config);
  cachedTransporter = transporter;
  lastConfigChecksum = checksum;

  return transporter;
}

export async function testSmtpConnection(testRecipient?: string): Promise<SmtpTestResult> {
  const startTime = Date.now();

  try {
    const config = await getEmailConfig();

    const validation = validateSmtpConfig(config);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.error || 'Invalid SMTP configuration',
        error: validation.errorCode,
      };
    }

    const transporter = createTransporter(config);

    logInfo('Testing SMTP connection', {
      host: config.host,
      port: config.port,
      secure: config.secure,
    });

    await transporter.verify();

    const responseTime = Date.now() - startTime;

    if (testRecipient) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testRecipient)) {
        transporter.close();
        return {
          success: false,
          message: 'Invalid test recipient email address',
          error: 'INVALID_TEST_RECIPIENT',
        };
      }

      const testSubject = 'SMTP Configuration Test';
      const testHtml = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #28a745;">SMTP Configuration Test Successful</h2>
          <p>This is a test email to verify your SMTP configuration.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            Sent at: ${new Date().toISOString()}<br>
            Response time: ${responseTime}ms
          </p>
        </div>
      `;
      const testText = `SMTP Configuration Test Successful\n\nThis is a test email to verify your SMTP configuration.\n\nSent at: ${new Date().toISOString()}\nResponse time: ${responseTime}ms`;

const testFromAddress = config.fromName
? `"${config.fromName}" <${config.fromAddress}>`
: config.fromAddress!;

await transporter.sendMail({
from: testFromAddress,
to: testRecipient,
subject: testSubject,
html: testHtml,
text: testText,
});

      transporter.close();

      return {
        success: true,
        message: 'SMTP connection successful and test email sent',
        details: {
          host: config.host!,
          port: config.port,
          secure: config.secure,
          responseTime,
        },
      };
    }

    transporter.close();

    return {
      success: true,
      message: 'SMTP connection successful',
      details: {
        host: config.host!,
        port: config.port,
        secure: config.secure,
        responseTime,
      },
    };
  } catch (error) {
    const errorCode = mapErrorToCode(error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    logError('SMTP connection test failed', {
      error: errorMessage,
      errorCode,
    });

    logDebug('SMTP test error details', {
      error: error instanceof Error ? error.stack : error,
    });

    return {
      success: false,
      message: getSafeErrorMessage(errorCode),
      error: errorCode,
    };
  }
}

function mapErrorToCode(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'UNKNOWN_ERROR';
  }

  const message = error.message.toLowerCase();
  const code = (error as any).code;

  if (code === 'EAUTH' || message.includes('auth') || message.includes('credentials')) {
    return 'SMTP_AUTH_FAILED';
  }
  if (code === 'ECONNECTION' || message.includes('connect') || message.includes('network')) {
    return 'SMTP_CONNECTION_FAILED';
  }
  if (code === 'ETIMEDOUT' || message.includes('timeout')) {
    return 'SMTP_TIMEOUT';
  }
  if (code === 'ESSL' || message.includes('ssl') || message.includes('tls')) {
    return 'SMTP_SSL_ERROR';
  }
  if (code === 'EMESSAGE' || message.includes('message') || message.includes('invalid')) {
    return 'SMTP_INVALID_MESSAGE';
  }
  if (code === 'EENVELOPE' || message.includes('recipient') || message.includes('sender')) {
    return 'SMTP_INVALID_RECIPIENT';
  }
  if (code === 'EDNS' || message.includes('dns') || message.includes('resolve')) {
    return 'SMTP_DNS_ERROR';
  }
  if (message.includes('rate') || message.includes('limit')) {
    return 'SMTP_RATE_LIMITED';
  }
  if (message.includes('blocked') || message.includes('blacklisted')) {
    return 'SMTP_BLOCKED';
  }

  return 'SMTP_ERROR';
}

function getSafeErrorMessage(errorCode: string): string {
  const messages: Record<string, string> = {
    SMTP_AUTH_FAILED: 'Authentication failed. Please check your SMTP credentials.',
    SMTP_CONNECTION_FAILED: 'Could not connect to the SMTP server. Please check the host and port.',
    SMTP_TIMEOUT: 'Connection timed out. The SMTP server may be slow or unreachable.',
    SMTP_SSL_ERROR: 'SSL/TLS error. Please check your security settings.',
    SMTP_INVALID_MESSAGE: 'Invalid email message format.',
    SMTP_INVALID_RECIPIENT: 'Invalid recipient email address.',
    SMTP_DNS_ERROR: 'Could not resolve SMTP server hostname.',
    SMTP_RATE_LIMITED: 'Rate limit exceeded. Please try again later.',
    SMTP_BLOCKED: 'Connection was blocked by the SMTP server.',
    SMTP_ERROR: 'An error occurred while sending the email.',
    UNKNOWN_ERROR: 'An unexpected error occurred.',
    EMAIL_SERVICE_DISABLED: 'Email service is disabled in settings.',
    SMTP_HOST_REQUIRED: 'SMTP host is required.',
    SMTP_USER_REQUIRED: 'SMTP user is required.',
    SMTP_PASSWORD_REQUIRED: 'SMTP password is required.',
    FROM_ADDRESS_REQUIRED: 'From address is required.',
    INVALID_SMTP_HOST: 'Invalid SMTP host format.',
    INVALID_SMTP_PORT: 'Invalid SMTP port number.',
    INVALID_FROM_ADDRESS: 'Invalid from address format.',
    INVALID_RECIPIENT: 'Invalid recipient email address.',
    INVALID_TEST_RECIPIENT: 'Invalid test recipient email address.',
  };

  return messages[errorCode] || 'An error occurred.';
}

export default {
  testSmtpConnection,
  getEmailConfig,
};
