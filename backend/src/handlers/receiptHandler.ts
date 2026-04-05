import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireAdmin } from '../middleware/authorization';
import * as receiptService from '../services/receiptService';
import { getPDFPath, generateReceiptPDF, deletePDFFromStorage } from '../services/pdfService';
import { logError, logDataAccess } from '../utils/logger';
import i18n from '../i18n';
import path from 'path';
import fs from 'fs/promises';
import {
  CreateReceiptInput,
  UpdateReceiptInput,
  IssueReceiptInput,
  VoidReceiptInput,
  ReceiptFilters,
  ReceiptPagination,
  toReceiptDTO,
} from '../types/receipt';
import {
  logReceiptAudit,
  extractAuditContext,
  captureReceiptState,
  getReceiptAuditLogs,
  listAuditLogs,
} from '../services/receiptAuditService';
import * as receiptQueueService from '../services/receiptQueueService';
import { prisma } from '../prisma';

export const receiptsRouter = express.Router();

// GET /api/receipts/pending - Get pending/failed receipts for current user
receiptsRouter.get('/pending', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: i18n.t('auth.userNotFound') });
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';

    const receipts = await prisma.receipt.findMany({
      where: {
        generationStatus: { in: ['pending', 'failed'] },
        ...(isAdmin ? {} : { issuedBy: userId }),
      },
      select: {
        id: true,
        receiptNumber: true,
        total: true,
        status: true,
        generationStatus: true,
        generationError: true,
        createdAt: true,
        issuedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: receipts });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching pending receipts', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('receipts.fetchFailed') });
  }
});

// POST /api/receipts/:id/retry - Retry failed receipt generation
receiptsRouter.post('/:id/retry', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: i18n.t('auth.userNotFound') });
    }

    const isAdmin = userRole === 'ADMIN' || userRole === 'Admin';

    const receipt = await receiptService.getReceiptById(Number(id));

    if (!receipt) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }

    if (!isAdmin && receipt.issuedBy !== userId) {
      return res.status(403).json({ error: i18n.t('auth.accessDenied') });
    }

    if (receipt.generationStatus !== 'failed') {
      return res.status(400).json({ error: i18n.t('receipts.canOnlyRetryFailed') });
    }

    await prisma.receiptGenerationQueue.updateMany({
      where: { receiptId: Number(id) },
      data: {
        status: 'pending',
        nextAttemptAt: new Date(),
      },
    });

    const updatedReceipt = await receiptService.getReceiptById(Number(id));

    const auditContext = extractAuditContext(req);
    await logReceiptAudit(Number(id), 'retry', auditContext, {
      newValues: { generationStatus: 'pending' },
    });

    res.json({ data: updatedReceipt });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error retrying receipt', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('receipts.retryFailed') });
  }
});

receiptsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      search,
      receiptNumber,
      transactionId,
      customerId,
      status,
      emailStatus,
      generationStatus,
      issuedAtFrom,
      issuedAtTo,
      createdAtFrom,
      createdAtTo,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const statusArray = status
      ? String(status)
          .split(',')
          .map((s) => s.trim() as any)
      : undefined;

    const generationStatusArray = generationStatus
      ? String(generationStatus)
          .split(',')
          .map((s) => s.trim() as any)
      : undefined;

    const filters: ReceiptFilters = {
      ...(search && { search: String(search) }),
      ...(receiptNumber && { receiptNumber: String(receiptNumber) }),
      ...(transactionId && { transactionId: Number(transactionId) }),
      ...(customerId && { customerId: Number(customerId) }),
      ...(statusArray && { status: statusArray }),
      ...(emailStatus && { emailStatus: String(emailStatus) as any }),
      ...(generationStatusArray && { generationStatus: generationStatusArray }),
      ...(issuedAtFrom && { issuedAtFrom: new Date(String(issuedAtFrom)) }),
      ...(issuedAtTo && { issuedAtTo: new Date(String(issuedAtTo)) }),
      ...(createdAtFrom && { createdAtFrom: new Date(String(createdAtFrom)) }),
      ...(createdAtTo && { createdAtTo: new Date(String(createdAtTo)) }),
    };

    const pagination: ReceiptPagination = {
      page: parseInt(String(page), 10) || 1,
      limit: parseInt(String(limit), 10) || 20,
      sortBy: ['receiptNumber', 'createdAt', 'issuedAt', 'total', 'status'].includes(String(sortBy))
        ? (String(sortBy) as any)
        : 'createdAt',
      sortOrder: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    const result = await receiptService.listReceipts(filters, pagination);
    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error listing receipts', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('receipts.fetchFailed') });
  }
});

receiptsRouter.get('/number/:number', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { number } = req.params;
    const receipt = await receiptService.getReceiptByNumber(number);

    if (!receipt) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }

    res.json({ data: receipt });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching receipt by number', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('receipts.fetchFailed') });
  }
});

receiptsRouter.get('/transaction/:transactionId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { transactionId } = req.params;
    const receipt = await receiptService.getReceiptByTransactionId(Number(transactionId));

    if (!receipt) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }

    res.json({ data: receipt });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching receipt by transaction', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('receipts.fetchFailed') });
  }
});

receiptsRouter.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const receipt = await receiptService.getReceiptById(Number(id));

    if (!receipt) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }

    res.json({ data: receipt });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching receipt', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('receipts.fetchFailed') });
  }
});

receiptsRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: i18n.t('auth.userNotFound') });
    }

    const { transactionId, customerId, notes, internalNotes } = req.body;

    if (!transactionId || typeof transactionId !== 'number') {
      return res.status(400).json({ error: i18n.t('receipts.transactionIdRequired') });
    }

    const input: CreateReceiptInput = {
      transactionId,
      customerId: customerId ?? null,
      notes: notes?.trim() || null,
      internalNotes: internalNotes?.trim() || null,
    };

    const receipt = await receiptService.createReceiptFromTransaction(transactionId, userId, input);

    // Audit logging
    const auditContext = extractAuditContext(req);
    await logReceiptAudit(receipt.id, 'create', auditContext, {
      newValues: captureReceiptState(receipt),
    });

    logDataAccess('receipt', receipt.id, 'CREATE', userId, req.user?.username);

  res.status(201).json({ data: receipt });
} catch (error) {
    logError(error instanceof Error ? error : 'Error creating receipt', {
      correlationId: (req as any).correlationId,
    });

    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('already exists')) {
      return res.status(409).json({ error: i18n.t('receipts.alreadyExists') });
    }
    if (errorMessage.includes('Transaction not found')) {
      return res.status(404).json({ error: i18n.t('transactions.notFound') });
    }

    res.status(500).json({ error: i18n.t('receipts.createFailed') });
  }
});

receiptsRouter.post('/:id/issue', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: i18n.t('auth.userNotFound') });
    }

    const { customerId, notes } = req.body;

    const input: IssueReceiptInput = {
      customerId: customerId ?? undefined,
      notes: notes?.trim() || undefined,
    };

    // Get old state for audit
    const oldReceipt = await receiptService.getReceiptById(Number(id));
    if (!oldReceipt) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }

    const receipt = await receiptService.issueDraftReceipt(Number(id), userId, input);

    // Audit logging
    const auditContext = extractAuditContext(req);
    await logReceiptAudit(Number(id), 'issue', auditContext, {
      oldValues: captureReceiptState(oldReceipt),
      newValues: captureReceiptState(receipt),
    });

  logDataAccess('receipt', receipt.id, 'UPDATE', userId, req.user?.username);

  res.json({ data: receipt });
} catch (error) {
    logError(error instanceof Error ? error : 'Error issuing receipt', {
      correlationId: (req as any).correlationId,
    });

    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('not found')) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }
    if (errorMessage.includes('Only draft')) {
      return res.status(400).json({ error: i18n.t('receipts.onlyDraftCanBeIssued') });
    }

    res.status(500).json({ error: i18n.t('receipts.issueFailed') });
  }
});

receiptsRouter.post('/:id/void', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: i18n.t('auth.userNotFound') });
    }

    const { reason } = req.body;

    if (!reason || typeof reason !== 'string' || reason.trim() === '') {
      return res.status(400).json({ error: i18n.t('receipts.voidReasonRequired') });
    }

    const input: VoidReceiptInput = {
      reason: reason.trim(),
    };

    // Get old state for audit
    const oldReceipt = await receiptService.getReceiptById(Number(id));
    if (!oldReceipt) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }

    const receipt = await receiptService.voidReceipt(Number(id), userId, input);

    // Audit logging
    const auditContext = extractAuditContext(req);
    await logReceiptAudit(Number(id), 'void', auditContext, {
      oldValues: captureReceiptState(oldReceipt),
      newValues: {
        ...captureReceiptState(receipt),
        voidReason: reason.trim(),
      },
    });

  logDataAccess('receipt', receipt.id, 'DELETE', userId, req.user?.username);

  res.json({ data: receipt });
} catch (error) {
    logError(error instanceof Error ? error : 'Error voiding receipt', {
      correlationId: (req as any).correlationId,
    });

    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('not found')) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }
    if (errorMessage.includes('Only issued')) {
      return res.status(400).json({ error: i18n.t('receipts.onlyIssuedCanBeVoided') });
    }

    res.status(500).json({ error: i18n.t('receipts.voidFailed') });
  }
});

receiptsRouter.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: i18n.t('auth.userNotFound') });
    }

    const { customerId, notes, internalNotes } = req.body;

    const input: UpdateReceiptInput = {
      ...(customerId !== undefined && { customerId: customerId ?? null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(internalNotes !== undefined && { internalNotes: internalNotes?.trim() || null }),
    };

    // Get old state for audit
    const oldReceipt = await receiptService.getReceiptById(Number(id));
    if (!oldReceipt) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }

    const receipt = await receiptService.updateDraftReceipt(Number(id), input);

    // Audit logging
    const auditContext = extractAuditContext(req);
    await logReceiptAudit(Number(id), 'update', auditContext, {
      oldValues: captureReceiptState(oldReceipt),
      newValues: captureReceiptState(receipt),
    });

  logDataAccess('receipt', receipt.id, 'UPDATE', userId, req.user?.username);

  res.json({ data: receipt });
} catch (error) {
    logError(error instanceof Error ? error : 'Error updating receipt', {
      correlationId: (req as any).correlationId,
    });

    const errorMessage = error instanceof Error ? error.message : '';
    if (errorMessage.includes('not found')) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }
    if (errorMessage.includes('Only draft')) {
      return res.status(400).json({ error: i18n.t('receipts.onlyDraftCanBeUpdated') });
    }

    res.status(500).json({ error: i18n.t('receipts.updateFailed') });
  }
});

// GET /api/receipts/:id/pdf - Retrieve PDF file
receiptsRouter.get('/:id/pdf', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const receipt = await receiptService.getReceiptById(Number(id));

    if (!receipt) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }

    // If receipt is voided, don't allow PDF access
    if (receipt.status === 'voided') {
      return res.status(400).json({ error: i18n.t('receipts.cannotViewVoidedPdf') });
    }

    // If PDF already exists and file is accessible, serve it
    if (receipt.pdfPath) {
      const filePath = await getPDFPath(receipt.pdfPath);

      // Check if file exists
      try {
        await fs.access(filePath);
        // Send the existing PDF file
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${receipt.receiptNumber}.pdf"`);
        const fileBuffer = await fs.readFile(filePath);
        return res.send(fileBuffer);
      } catch {
        // File doesn't exist, fall through to regenerate
      }
    }

    // Generate PDF on-the-fly for drafts or issued receipts without PDF
    const { prepareReceiptTemplateData } = await import('../types/receipt-template');
    const { renderReceiptPDF } = await import('../services/receiptTemplateService');
    const { savePDFToStorage } = await import('../services/pdfService');

    const templateData = prepareReceiptTemplateData(receipt);
    const pdfResult = await renderReceiptPDF(templateData);

    // Save the PDF for future use
    await savePDFToStorage(pdfResult.buffer, pdfResult.filename);

    // Update receipt with PDF path
    await receiptService.updateReceiptPdfPath(Number(id), pdfResult.filename, new Date());

    // Send the generated PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${receipt.receiptNumber}.pdf"`);
    return res.send(pdfResult.buffer);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error retrieving PDF', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('receipts.pdfRetrieveFailed') });
  }
});

// GET /api/receipts/:id/download - Download PDF file
receiptsRouter.get('/:id/download', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const receipt = await receiptService.getReceiptById(Number(id));

    if (!receipt) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }

    if (!receipt.pdfPath) {
      return res.status(404).json({ error: i18n.t('receipts.pdfNotGenerated') });
    }

    const filePath = await getPDFPath(receipt.pdfPath);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: i18n.t('receipts.pdfFileNotFound') });
    }

    // Send the PDF file as download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`);
    
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error downloading PDF', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('receipts.pdfDownloadFailed') });
  }
});

// POST /api/receipts/:id/regenerate-pdf - Regenerate PDF file
receiptsRouter.post('/:id/regenerate-pdf', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const receipt = await receiptService.getReceiptById(Number(id));

    if (!receipt) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }

    if (receipt.status === 'voided') {
      return res.status(400).json({ error: i18n.t('receipts.cannotGeneratePdfForVoided') });
    }

    const oldPdfPath = receipt.pdfPath;

    // Delete old PDF if exists
    if (receipt.pdfPath) {
      try {
        await deletePDFFromStorage(receipt.pdfPath);
      } catch {
        // Ignore if old file doesn't exist
      }
    }

    // Generate new PDF - fetch full receipt data with items
    const fullReceipt = await receiptService.getReceiptById(Number(id));
    if (!fullReceipt) {
      throw new Error('Receipt not found');
    }

    // Import the template service and prepare data
    const { renderReceiptPDF, prepareReceiptTemplateData } = await import('../services/receiptTemplateService');

    const templateData = prepareReceiptTemplateData(fullReceipt);
    const pdfResult = await renderReceiptPDF(templateData);

    // Save the new PDF
    const { savePDFToStorage } = await import('../services/pdfService');
    const savedPath = await savePDFToStorage(pdfResult.buffer, pdfResult.filename);

    // Update receipt with new PDF path
    const updatedReceipt = await receiptService.updateReceiptPdfPath(Number(id), pdfResult.filename, new Date());

    // Audit logging
    const auditContext = extractAuditContext(req);
    await logReceiptAudit(Number(id), 'regenerate_pdf', auditContext, {
      oldValues: { pdfPath: oldPdfPath },
      newValues: { pdfPath: pdfResult.filename },
    });

    logDataAccess('receipt', Number(id), 'UPDATE', req.user?.id, req.user?.username);

    res.json({
      message: i18n.t('receipts.pdfRegenerated'),
      pdfPath: pdfResult.filename,
      receipt: updatedReceipt,
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error regenerating PDF', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('receipts.pdfRegenerateFailed') });
  }
});

// POST /api/receipts/:id/email - Send receipt via email
receiptsRouter.post('/:id/email', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: i18n.t('auth.userNotFound') });
    }

    const { email, includePdf = true, message } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: i18n.t('receipts.emailRequired') });
    }

    if (message && typeof message === 'string' && message.length > 1000) {
      return res.status(400).json({ error: i18n.t('receipts.messageTooLong') });
    }

    const input = {
      email: email.trim(),
      includePdf: includePdf === true,
      message: message?.trim() || undefined,
    };

    const result = await receiptService.sendReceiptEmail(Number(id), input, userId);

    // Audit logging
    const auditContext = extractAuditContext(req);
    await logReceiptAudit(Number(id), 'email', auditContext, {
      newValues: {
        recipientEmail: email.trim(),
        includePdf: includePdf === true,
        jobId: result.jobId,
      },
    });

    logDataAccess('receipt', Number(id), 'EXPORT', userId, req.user?.username);

    res.status(202).json({
      message: i18n.t('receipts.emailQueued'),
      job: result,
    });
  } catch (error) {
    logError(error instanceof Error ? error : 'Error sending receipt email', {
      correlationId: (req as any).correlationId,
    });

    const errorMessage = error instanceof Error ? error.message : '';

    if (errorMessage === 'Receipt not found') {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }
    if (errorMessage === 'RECEIPT_NOT_ISSUED') {
      return res.status(400).json({ error: i18n.t('receipts.cannotEmailDraft') });
    }
    if (errorMessage === 'RECEIPT_VOIDED') {
      return res.status(400).json({ error: i18n.t('receipts.cannotEmailVoided') });
    }
    if (errorMessage === 'EMAIL_SERVICE_DISABLED') {
      return res.status(400).json({ error: i18n.t('receipts.emailServiceDisabled') });
    }
    if (errorMessage === 'INVALID_EMAIL') {
      return res.status(400).json({ error: i18n.t('receipts.invalidEmail') });
    }

    res.status(500).json({ error: i18n.t('receipts.emailFailed') });
  }
});

// GET /api/receipts/:id/audit - Get audit logs for a specific receipt
receiptsRouter.get('/:id/audit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    // Verify receipt exists
    const receipt = await receiptService.getReceiptById(Number(id));
    if (!receipt) {
      return res.status(404).json({ error: i18n.t('receipts.notFound') });
    }

    const result = await getReceiptAuditLogs(Number(id), {
      page: parseInt(String(page), 10) || 1,
      limit: parseInt(String(limit), 10) || 50,
    });

    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching receipt audit logs', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('receipts.auditFetchFailed') });
  }
});

// GET /api/receipts/audit - Get audit logs across all receipts (Admin only)
receiptsRouter.get('/audit', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      receiptId,
      action,
      userId,
      dateFrom,
      dateTo,
      page = '1',
      limit = '50',
    } = req.query;

    const filters: any = {};

    if (receiptId) {
      filters.receiptId = Number(receiptId);
    }

    if (action) {
      // Support comma-separated actions
      const actions = String(action).split(',').map((a) => a.trim() as any);
      filters.action = actions.length === 1 ? actions[0] : actions;
    }

    if (userId) {
      filters.userId = Number(userId);
    }

    if (dateFrom) {
      filters.dateFrom = new Date(String(dateFrom));
    }

    if (dateTo) {
      filters.dateTo = new Date(String(dateTo));
    }

    const result = await listAuditLogs(filters, {
      page: parseInt(String(page), 10) || 1,
      limit: Math.min(parseInt(String(limit), 10) || 50, 100), // Max 100
    });

    res.json(result);
  } catch (error) {
    logError(error instanceof Error ? error : 'Error fetching audit logs', {
      correlationId: (req as any).correlationId,
    });
    res.status(500).json({ error: i18n.t('receipts.auditFetchFailed') });
  }
});

export default receiptsRouter;
