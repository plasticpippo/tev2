import { loadTemplate } from './templateEngine';
import { generatePDF, savePDFToStorage, STORAGE_PATH } from './pdfService';
import {
  ReceiptTemplateData,
  prepareReceiptTemplateData,
  ReceiptPDFOptions,
  ReceiptPDFResult,
} from '../types/receipt-template';
import path from 'path';
import crypto from 'crypto';

const DEFAULT_PDF_OPTIONS: ReceiptPDFOptions = {
  format: 'A4',
  printBackground: true,
  margin: {
    top: '15mm',
    right: '15mm',
    bottom: '15mm',
    left: '15mm',
  },
};

const RECEIPT_PDF_OPTIONS: ReceiptPDFOptions = {
  format: 'A4',
  printBackground: true,
  margin: {
    top: '10mm',
    right: '10mm',
    bottom: '10mm',
    left: '10mm',
  },
};

export async function renderReceiptHTML(
  templateData: ReceiptTemplateData,
  templateName: string = 'receipt-main'
): Promise<string> {
  const template = await loadTemplate(templateName);
  return template(templateData);
}

export async function renderReceiptPDF(
  templateData: ReceiptTemplateData,
  options: ReceiptPDFOptions = RECEIPT_PDF_OPTIONS,
  templateName: string = 'receipt-main'
): Promise<ReceiptPDFResult> {
  const htmlContent = await renderReceiptHTML(templateData, templateName);
  
  const pdfBuffer = await generatePDF(htmlContent, {
    format: options.format || 'A4',
    printBackground: options.printBackground ?? true,
    margin: options.margin || RECEIPT_PDF_OPTIONS.margin,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const filename = `receipt-${templateData.receipt.receiptNumber}-${timestamp}.pdf`;

  return {
    buffer: pdfBuffer,
    filename,
    generatedAt: new Date(),
    sizeBytes: pdfBuffer.length,
  };
}

export async function renderDraftReceiptPDF(
  templateData: ReceiptTemplateData
): Promise<ReceiptPDFResult> {
  return renderReceiptPDF(templateData, RECEIPT_PDF_OPTIONS, 'receipt-main');
}

export async function renderVoidedReceiptPDF(
  templateData: ReceiptTemplateData
): Promise<ReceiptPDFResult> {
  return renderReceiptPDF(templateData, RECEIPT_PDF_OPTIONS, 'receipt-main');
}

export {
  prepareReceiptTemplateData,
  RECEIPT_PDF_OPTIONS,
  DEFAULT_PDF_OPTIONS,
};
