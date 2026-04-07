import puppeteer, { Browser, Page, PDFOptions as PuppeteerPDFOptions } from 'puppeteer';
import { loadTemplate } from './templateEngine';
import { loadInvoiceTemplate } from './templateEngine';
import {
  PDFOptions,
  ReceiptTemplateData,
  PDFGenerationResult,
  PDFCacheEntry,
  ReceiptTemplateData as ReceiptData,
  InvoiceTemplateData,
  INVOICE_PDF_OPTIONS,
} from '../types/pdf';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const STORAGE_PATH = process.env.PDF_STORAGE_PATH || path.join(__dirname, '../../storage/receipts');
const CACHE_ENABLED = process.env.PDF_CACHE_ENABLED !== 'false';
const CACHE_TTL = parseInt(process.env.PDF_CACHE_TTL || '3600', 10);

const pdfCache: Map<string, PDFCacheEntry> = new Map();
let browserInstance: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  browserLaunchPromise = puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-software-rasterizer',
      '--disable-extensions',
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });

  browserInstance = await browserLaunchPromise;
  browserLaunchPromise = null;

  return browserInstance!;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

function mapToPuppeteerOptions(options: PDFOptions): PuppeteerPDFOptions {
  const puppeteerOpts: PuppeteerPDFOptions = {
    printBackground: options.printBackground ?? true,
  };

  if (options.format === 'Receipt') {
    puppeteerOpts.width = options.width || '80mm';
  } else if (options.format) {
    puppeteerOpts.format = options.format;
  }

  if (options.margin) {
    puppeteerOpts.margin = {
      top: options.margin.top || '20mm',
      right: options.margin.right || '15mm',
      bottom: options.margin.bottom || '20mm',
      left: options.margin.left || '15mm',
    };
  }

  return puppeteerOpts;
}

export function getCacheKey(templateName: string, data: object): string {
  const dataHash = JSON.stringify(data);
  return `${templateName}:${dataHash}`;
}

function isCacheValid(entry: PDFCacheEntry): boolean {
  return new Date() < entry.expiresAt;
}

export function clearCache(): void {
  pdfCache.clear();
}

export function clearExpiredCache(): void {
  for (const [key, entry] of pdfCache.entries()) {
    if (!isCacheValid(entry)) {
      pdfCache.delete(key);
    }
  }
}

export async function generatePDF(
  htmlContent: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  const browser = await getBrowser();
  let page: Page | null = null;

  try {
    page = await browser.newPage();

    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0',
      timeout: 10000,
    });

    const puppeteerOpts = mapToPuppeteerOptions(options);
    const pdfArrayBuffer = await page.pdf(puppeteerOpts);
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    return pdfBuffer;
  } finally {
    if (page) {
      await page.close();
    }
  }
}

export async function renderTemplate(
  templateName: string,
  data: object
): Promise<string> {
  const template = await loadTemplate(templateName);
  return template(data);
}

export async function generatePDFWithTemplate(
  templateName: string,
  data: object,
  options: PDFOptions = {},
  useCache: boolean = true
): Promise<Buffer> {
  const cacheKey = getCacheKey(templateName, data);

  if (useCache && CACHE_ENABLED) {
    const cached = pdfCache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      cached.hitCount++;
      return cached.buffer;
    }
  }

  const htmlContent = await renderTemplate(templateName, data);
  const pdfBuffer = await generatePDF(htmlContent, options);

  if (useCache && CACHE_ENABLED) {
    const entry: PDFCacheEntry = {
      buffer: pdfBuffer,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + CACHE_TTL * 1000),
      hitCount: 0,
    };
    pdfCache.set(cacheKey, entry);
  }

  return pdfBuffer;
}

export async function generateReceiptPDF(receipt: ReceiptData): Promise<PDFGenerationResult> {
  const pdfBuffer = await generatePDFWithTemplate(
    'receipt-standard',
    receipt as unknown as object,
    {
      format: 'Receipt',
      printBackground: true,
      width: '80mm',
      margin: {
        top: '5mm',
        right: '5mm',
        bottom: '5mm',
        left: '5mm',
      },
    },
    false
  );

  const filename = `receipt-${receipt.receipt.receiptNumber}-${crypto.randomUUID()}.pdf`;

  await fs.mkdir(STORAGE_PATH, { recursive: true });
  const filePath = path.join(STORAGE_PATH, filename);
  await fs.writeFile(filePath, pdfBuffer);

  return {
    buffer: pdfBuffer,
    filename,
    generatedAt: new Date(),
    sizeBytes: pdfBuffer.length,
  };
}

export async function generateInvoicePDF(invoice: InvoiceTemplateData): Promise<PDFGenerationResult> {
  const invoiceStoragePath = process.env.INVOICE_STORAGE_PATH || path.join(__dirname, '../../storage/invoices');
  
  const template = await loadInvoiceTemplate('invoice-main');
  const htmlContent = template(invoice as unknown as object);
  
  const pdfBuffer = await generatePDF(htmlContent, INVOICE_PDF_OPTIONS);

  const filename = `invoice-${invoice.invoice.invoiceNumber}-${crypto.randomUUID()}.pdf`;

  await fs.mkdir(invoiceStoragePath, { recursive: true });
  const filePath = path.join(invoiceStoragePath, filename);
  await fs.writeFile(filePath, pdfBuffer);

  return {
    buffer: pdfBuffer,
    filename,
    generatedAt: new Date(),
    sizeBytes: pdfBuffer.length,
  };
}

export async function savePDFToStorage(
  buffer: Buffer,
  filename: string
): Promise<string> {
  await fs.mkdir(STORAGE_PATH, { recursive: true });
  const filePath = path.join(STORAGE_PATH, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function getPDFPath(filename: string): Promise<string> {
  return path.join(STORAGE_PATH, filename);
}

export async function deletePDFFromStorage(filename: string): Promise<void> {
  const filePath = path.join(STORAGE_PATH, filename);
  try {
    await fs.unlink(filePath);
  } catch {
    // File doesn't exist, ignore
  }
}

export { STORAGE_PATH };
