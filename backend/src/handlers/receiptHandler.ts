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

export const receiptsRouter = express.Router();

receiptsRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      search,
      receiptNumber,
      transactionId,
      customerId,
      status,
      emailStatus,
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

    const filters: ReceiptFilters = {
      ...(search && { search: String(search) }),
      ...(receiptNumber && { receiptNumber: String(receiptNumber) }),
      ...(transactionId && { transactionId: Number(transactionId) }),
      ...(customerId && { customerId: Number(customerId) }),
      ...(statusArray && { status: statusArray }),
      ...(emailStatus && { emailStatus: String(emailStatus) as any }),
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

    res.json(receipt);
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

    res.json(receipt);
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

    res.json(receipt);
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

    logDataAccess('receipt', receipt.id, 'CREATE', userId, req.user?.username);

    res.status(201).json(receipt);
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

    const receipt = await receiptService.issueDraftReceipt(Number(id), userId, input);

    logDataAccess('receipt', receipt.id, 'UPDATE', userId, req.user?.username);

    res.json(receipt);
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

    const receipt = await receiptService.voidReceipt(Number(id), userId, input);

    logDataAccess('receipt', receipt.id, 'DELETE', userId, req.user?.username);

    res.json(receipt);
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

    const receipt = await receiptService.updateDraftReceipt(Number(id), input);

    logDataAccess('receipt', receipt.id, 'UPDATE', userId, req.user?.username);

    res.json(receipt);
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

    // Send the PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${receipt.receiptNumber}.pdf"`);
    
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
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

export default receiptsRouter;
