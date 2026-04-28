import { STORAGE_PATH } from '../config/storage';
import { prisma } from '../prisma';
import fs from 'fs/promises';
import path from 'path';
import { logInfo, logError } from '../utils/logger';


/**
 * Recovers missing PDF files for issued receipts.
 *
 * Iterates through receipts with pdf_path set but no corresponding file on disk,
 * regenerates the PDF, and updates the database.
 *
 * @param limit - Maximum number of receipts to process (default: 50)
 * @returns Summary of recovery results with counts of recovered, failed, and skipped receipts
 */

export async function recoverMissingPDFs(limit: number = 50): Promise<{
  recovered: number;
  failed: number;
  skipped: number;
}> {
  logInfo('Starting PDF recovery process');

  const receiptsWithPDF = await prisma.receipt.findMany({
    where: {
      status: 'issued',
      pdfPath: { not: null },
      pdfGeneratedAt: { not: null },
    },
    select: {
      id: true,
      receiptNumber: true,
      pdfPath: true,
      issuedAt: true,
    },
    orderBy: { issuedAt: 'desc' },
    take: limit,
  });

  let recovered = 0;
  let failed = 0;
  let skipped = 0;

  for (const receipt of receiptsWithPDF) {
    const fullPath = path.join(STORAGE_PATH, receipt.pdfPath || '');

    try {
      await fs.access(fullPath, fs.constants.R_OK);

      skipped++;
      continue;
    } catch {
      logInfo(`PDF file missing for receipt ${receipt.receiptNumber}, regenerating...`, {
        receiptId: receipt.id,
        receiptNumber: receipt.receiptNumber,
        missingPath: fullPath,
      });

      try {
        const fullReceipt = await prisma.receipt.findUnique({
          where: { id: receipt.id },
          select: {
            id: true,
            receiptNumber: true,
            transactionId: true,
            customerId: true,
            status: true,
            subtotal: true,
            tax: true,
            tip: true,
            total: true,
            discount: true,
            discountReason: true,
            paymentMethod: true,
            itemsSnapshot: true,
            taxBreakdown: true,
            notes: true,
            internalNotes: true,
            pdfPath: true,
            pdfGeneratedAt: true,
            issuedAt: true,
            issuedBy: true,
            businessSnapshot: true,
            customerSnapshot: true,
          },
        });

        if (!fullReceipt) {
          logError(`Receipt not found during recovery: ${receipt.id}`);
          failed++;
          continue;
        }

        const { renderReceiptPDF } = await import('./receiptTemplateService');
        const { savePDFToStorage } = await import('./pdfService');
        const { prepareReceiptTemplateData } = await import('../types/receipt-template');
        const { toReceiptDTO } = await import('../types/receipt');

        const receiptDTO = toReceiptDTO(fullReceipt);
        const templateData = prepareReceiptTemplateData(receiptDTO);

        const pdfResult = await renderReceiptPDF(templateData);

        await savePDFToStorage(pdfResult.buffer, pdfResult.filename);

        await prisma.receipt.update({
          where: { id: receipt.id },
          data: {
            pdfGeneratedAt: pdfResult.generatedAt,
            version: { increment: 1 },
          },
        });

        recovered++;
        logInfo(`Successfully recovered PDF for receipt ${receipt.receiptNumber}`, {
          receiptId: receipt.id,
          receiptNumber: receipt.receiptNumber,
        });
      } catch (recoveryError) {
        logError(`Failed to recover PDF for receipt ${receipt.receiptNumber}`, {
          receiptId: receipt.id,
          receiptNumber: receipt.receiptNumber,
          error: recoveryError instanceof Error ? recoveryError.message : 'Unknown error',
        });
        failed++;
      }
    }
  }

  const summary = { recovered, failed, skipped };
  logInfo('PDF recovery completed', summary);

  return summary;
}

/**
 * Runs a one-time recovery operation to restore all missing PDF files.
 *
 * Continues processing in batches until no more missing PDFs are found.
 * Useful for recovering from bulk data loss scenarios (e.g., container restart before volume mount).
 *
 * @returns Promise that resolves when recovery is complete
 */

export async function runOneTimeRecovery(): Promise<void> {
  logInfo('Running one-time PDF recovery...');

  let totalRecovered = 0;
  let totalFailed = 0;
  let totalSkipped = 0;
  let hasMore = true;

  while (hasMore) {
    const result = await recoverMissingPDFs(100);

    totalRecovered += result.recovered;
    totalFailed += result.failed;
    totalSkipped += result.skipped;

    hasMore = result.recovered + result.failed > 0;

    if (result.recovered + result.failed === 0) {
      break;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  logInfo('One-time PDF recovery completed', {
    totalRecovered,
    totalFailed,
    totalSkipped,
  });
}
