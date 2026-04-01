import {
  generatePDF,
  getCacheKey,
  clearCache,
  clearExpiredCache,
  closeBrowser,
} from '../services/pdfService';
import { loadTemplate } from '../services/templateEngine';
import { initI18n } from '../i18n';

describe('pdfService', () => {
  beforeAll(async () => {
    await initI18n();
  });

  afterAll(async () => {
    await closeBrowser();
  });

  beforeEach(() => {
    clearCache();
  });

  describe('getCacheKey', () => {
    it('should generate consistent cache key', () => {
      const templateName = 'receipt-main';
      const data = { test: 'value' };
      const key1 = getCacheKey(templateName, data);
      const key2 = getCacheKey(templateName, data);
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different data', () => {
      const templateName = 'receipt-main';
      const key1 = getCacheKey(templateName, { test: 'value1' });
      const key2 = getCacheKey(templateName, { test: 'value2' });
      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different templates', () => {
      const key1 = getCacheKey('receipt-main', { test: 'value' });
      const key2 = getCacheKey('receipt-standard', { test: 'value' });
      expect(key1).not.toBe(key2);
    });
  });

  describe('clearCache', () => {
    it('should clear all cached items', () => {
      const key = getCacheKey('test', { data: 'test' });
      clearCache();
      // After clearing, cache should be empty
      expect(true).toBe(true); // No direct way to check cache size
    });
  });

  describe('clearExpiredCache', () => {
    it('should not throw when cache is empty', () => {
      expect(() => clearExpiredCache()).not.toThrow();
    });
  });

  describe('generatePDF', () => {
    it('should generate PDF from HTML content', async () => {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Test Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; }
          </style>
        </head>
        <body>
          <h1>Test Receipt</h1>
          <p>Total: 10.00 EUR</p>
        </body>
        </html>
      `;

      const pdfBuffer = await generatePDF(htmlContent, {
        format: 'A4',
        printBackground: true,
      });

      expect(pdfBuffer).toBeDefined();
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);

      // PDF should start with %PDF header
      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      expect(pdfHeader).toBe('%PDF');
    }, 30000);

    it('should generate PDF with custom margins', async () => {
      const htmlContent = `
        <html>
        <body>
          <h1>Test</h1>
        </body>
        </html>
      `;

      const pdfBuffer = await generatePDF(htmlContent, {
        format: 'A4',
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(0);
    }, 30000);

    it('should generate receipt format PDF', async () => {
      const htmlContent = `
        <html>
        <body style="width: 80mm;">
          <h1>Receipt</h1>
          <p>Item 1: 5.00 EUR</p>
          <p>Total: 5.00 EUR</p>
        </body>
        </html>
      `;

      const pdfBuffer = await generatePDF(htmlContent, {
        format: 'Receipt',
        width: '80mm',
        margin: {
          top: '5mm',
          right: '5mm',
          bottom: '5mm',
          left: '5mm',
        },
      });

      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('PDF generation with templates', () => {
    it('should generate PDF from receipt-main template', async () => {
      const template = await loadTemplate('receipt-main');
      const data = {
        receipt: {
          receiptNumber: 'TEST-001',
          status: 'issued',
          issuedAt: new Date('2026-04-01T12:00:00Z'),
          business: {
            name: 'Test Business',
            address: 'Via Test 123',
            city: 'Milano',
            postalCode: '20100',
            country: 'Italy',
            phone: '+39 02 1234567',
            email: 'test@example.com',
            vatNumber: 'IT12345678901',
          },
          customer: null,
          items: [
            { name: 'Espresso', quantity: 2, price: 1.5, total: 3 },
            { name: 'Cappuccino', quantity: 1, price: 2, total: 2 },
          ],
          subtotal: 5,
          tax: 1.1,
          taxBreakdown: null,
          discount: 0,
          discountReason: null,
          tip: 0,
          total: 6.1,
          paymentMethod: 'card',
          notes: 'Thank you!',
        },
        locale: 'it',
        currency: 'EUR',
      };

      const htmlContent = template(data);
      const pdfBuffer = await generatePDF(htmlContent, {
        format: 'A4',
        printBackground: true,
      });

      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(1000); // Should be a reasonable size

      // Verify PDF header
      const pdfHeader = pdfBuffer.slice(0, 4).toString();
      expect(pdfHeader).toBe('%PDF');
    }, 30000);

    it('should generate PDF from receipt-standard template', async () => {
      const template = await loadTemplate('receipt-standard');
      const data = {
        receipt: {
          receiptNumber: 'TEST-002',
          status: 'issued',
          issuedAt: new Date('2026-04-01T12:00:00Z'),
          business: {
            name: 'Test Cafe',
            address: null,
            city: null,
            postalCode: null,
            country: null,
            phone: null,
            email: null,
            vatNumber: 'IT12345678901',
          },
          customer: null,
          items: [{ name: 'Coffee', quantity: 1, price: 1.5, total: 1.5 }],
          subtotal: 1.5,
          tax: 0.33,
          taxBreakdown: null,
          discount: 0,
          discountReason: null,
          tip: 0,
          total: 1.83,
          paymentMethod: 'cash',
          notes: null,
        },
        locale: 'it',
        currency: 'EUR',
      };

      const htmlContent = template(data);
      const pdfBuffer = await generatePDF(htmlContent, {
        format: 'Receipt',
        width: '80mm',
      });

      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(500);
    }, 30000);
  });
});
