/**
 * Receipt Audit Logging Service
 * 
 * This service provides comprehensive audit logging for all receipt operations.
 * It creates immutable audit log entries for:
 * - Receipt creation
 * - Receipt issuance
 * - Email sending and retries
 * - Receipt voiding
 * - PDF regeneration
 * - Receipt updates
 * 
 * All timestamps are stored in UTC for consistency.
 */

import { prisma } from '../prisma';
import { ReceiptAuditAction } from '@prisma/client';
import { logAuditEvent } from '../utils/logger';

/**
 * Context information for audit logging
 */
export interface AuditContext {
  userId: number;
  userName: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

/**
 * Data to be captured in audit log
 */
export interface AuditData {
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
}

/**
 * Creates an audit log entry for a receipt operation
 * 
 * @param receiptId - The ID of the receipt
 * @param action - The action being performed
 * @param context - Context information (user, IP, etc.)
 * @param data - Optional old/new values for the operation
 * @returns The created audit log entry
 */
export async function logReceiptAudit(
  receiptId: number,
  action: ReceiptAuditAction,
  context: AuditContext,
  data?: AuditData
): Promise<void> {
  try {
    // Create the audit log entry in the database
    await prisma.receiptAuditLog.create({
      data: {
        receiptId,
        action,
        oldValues: data?.oldValues ?? undefined,
        newValues: data?.newValues ?? undefined,
        userId: context.userId,
        userName: context.userName,
        ipAddress: context.ipAddress ?? null,
        userAgent: context.userAgent ?? null,
      },
    });

    // Also log to the application audit log
    const severity = getActionSeverity(action);
    logAuditEvent(
      'DATA_ACCESS',
      `Receipt ${action}`,
      {
        receiptId,
        action,
        ...(data?.newValues && { changes: Object.keys(data.newValues) }),
      },
      severity,
      {
        userId: context.userId,
        username: context.userName,
        correlationId: context.correlationId,
      }
    );
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    // But log the error for investigation
    console.error('Failed to create receipt audit log:', error);
  }
}

/**
 * Get audit logs for a specific receipt
 * 
 * @param receiptId - The ID of the receipt
 * @param options - Pagination options
 * @returns List of audit log entries
 */
export async function getReceiptAuditLogs(
  receiptId: number,
  options: {
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  logs: Array<{
    id: number;
    action: string;
    oldValues: any;
    newValues: any;
    userId: number;
    userName: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}> {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  const [logs, totalCount] = await Promise.all([
    prisma.receiptAuditLog.findMany({
      where: { receiptId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.receiptAuditLog.count({ where: { receiptId } }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    logs: logs.map((log) => ({
      id: log.id,
      action: log.action,
      oldValues: log.oldValues,
      newValues: log.newValues,
      userId: log.userId,
      userName: log.userName,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Get audit logs across all receipts with filtering
 * 
 * @param filters - Filter options
 * @param options - Pagination options
 * @returns List of audit log entries
 */
export async function listAuditLogs(
  filters: {
    receiptId?: number;
    action?: ReceiptAuditAction | ReceiptAuditAction[];
    userId?: number;
    dateFrom?: Date;
    dateTo?: Date;
  } = {},
  options: {
    page?: number;
    limit?: number;
  } = {}
): Promise<{
  logs: Array<{
    id: number;
    receiptId: number;
    action: string;
    oldValues: any;
    newValues: any;
    userId: number;
    userName: string;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}> {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  const where: any = {};

  if (filters.receiptId) {
    where.receiptId = filters.receiptId;
  }

  if (filters.action) {
    if (Array.isArray(filters.action)) {
      where.action = { in: filters.action };
    } else {
      where.action = filters.action;
    }
  }

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) {
      where.createdAt.gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      where.createdAt.lte = filters.dateTo;
    }
  }

  const [logs, totalCount] = await Promise.all([
    prisma.receiptAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    }),
    prisma.receiptAuditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    logs: logs.map((log) => ({
      id: log.id,
      receiptId: log.receiptId,
      action: log.action,
      oldValues: log.oldValues,
      newValues: log.newValues,
      userId: log.userId,
      userName: log.userName,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    })),
    pagination: {
      page,
      limit,
      totalCount,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Get action severity for logging purposes
 */
function getActionSeverity(
  action: ReceiptAuditAction
): 'low' | 'medium' | 'high' | 'critical' {
  switch (action) {
    case 'void':
      return 'high';
    case 'email':
    case 'email_retry':
      return 'medium';
    case 'create':
    case 'issue':
    case 'regenerate_pdf':
      return 'low';
    case 'update':
      return 'low';
    default:
      return 'low';
  }
}

/**
 * Helper function to extract request context from Express request
 */
export function extractAuditContext(req: any): AuditContext {
  return {
    userId: req.user?.id,
    userName: req.user?.username || 'Unknown',
    ipAddress: req.ip || req.headers?.['x-forwarded-for'] || null,
    userAgent: req.headers?.['user-agent'] || null,
    correlationId: req.correlationId,
  };
}

/**
 * Helper function to capture receipt state for audit logging
 */
export function captureReceiptState(receipt: any): Record<string, any> {
  return {
    receiptNumber: receipt.receiptNumber,
    status: receipt.status,
    customerId: receipt.customerId,
    total: receipt.total?.toString?.() || receipt.total,
    paymentMethod: receipt.paymentMethod,
    notes: receipt.notes,
    internalNotes: receipt.internalNotes,
    pdfPath: receipt.pdfPath,
    issuedAt: receipt.issuedAt,
    voidedAt: receipt.voidedAt,
    voidReason: receipt.voidReason,
    emailedAt: receipt.emailedAt,
    emailRecipient: receipt.emailRecipient,
    emailStatus: receipt.emailStatus,
  };
}
