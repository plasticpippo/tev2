import {
  renderReceiptHTML,
  renderReceiptPDF,
  renderDraftReceiptPDF,
  renderVoidedReceiptPDF,
  prepareReceiptTemplateData,
} from '../services/receiptTemplateService';
import { initI18n } from '../i18n';

describe('receiptTemplateService', () => {
  beforeAll(async () => {
    await initI18n();
  });

  describe('prepareReceiptTemplateData', () => {
    it('should prepare template data from receipt record', () => {
      const receipt = {
        receiptNumber: 'R000001',
        status: 'issued' as const,
        issuedAt: new Date('2026-04-01T12:00:00Z'),
        businessSnapshot: {
          name: 'Test Cafe',
          address: 'Via Test 1',
          city: 'Milano',
          postalCode: '20100',
          country: 'IT',
          phone: '+39 02 1234567',
          email: 'test@cafe.it',
          vatNumber: 'IT12345678901',
        },
        customerSnapshot: {
          name: 'Mario Rossi',
          email: 'mario@example.com',
          phone: '+39 333 1234567',
          vatNumber: 'IT98765432101',
          address: 'Via Customer 10',
          city: 'Roma',
          postalCode: '00100',
          country: 'IT',
        },
        itemsSnapshot: [
          { name: 'Espresso', quantity: 2, price: 1.5, taxRateId: 1, taxRateName: 'Standard', taxRatePercent: 22 },
          { name: 'Cappuccino', quantity: 1, price: 2, taxRateId: 1, taxRateName: 'Standard', taxRatePercent: 22 },
        ],
        subtotal: 5,
        tax: 1.1,
        taxBreakdown: [
          { rateName: 'Standard', ratePercent: 22, taxableAmount: 5, taxAmount: 1.1 },
        ],
        discount: 0,
        discountReason: null,
        tip: 0,
        total: 6.1,
        paymentMethod: 'card',
        notes: 'Thank you!',
      };

      const result = prepareReceiptTemplateData(receipt, 'it', 'EUR');

      expect(result.receipt.receiptNumber).toBe('R000001');
      expect(result.receipt.status).toBe('issued');
      expect(result.receipt.business.name).toBe('Test Cafe');
      expect(result.receipt.customer).toBeDefined();
      expect(result.receipt.customer?.name).toBe('Mario Rossi');
      expect(result.receipt.items).toHaveLength(2);
      expect(result.receipt.items[0].name).toBe('Espresso');
      expect(result.receipt.items[0].total).toBe(3); // 1.5 * 2
      expect(result.receipt.subtotal).toBe(5);
      expect(result.receipt.tax).toBe(1.1);
      expect(result.receipt.total).toBe(6.1);
      expect(result.locale).toBe('it');
      expect(result.currency).toBe('EUR');
    });

    it('should handle receipt without customer', () => {
      const receipt = {
        receiptNumber: 'R000002',
        status: 'issued' as const,
        issuedAt: new Date('2026-04-01T12:00:00Z'),
        businessSnapshot: {
          name: 'Test Cafe',
          address: null,
          city: null,
          postalCode: null,
          country: null,
          phone: null,
          email: null,
          vatNumber: null,
        },
        customerSnapshot: null,
        itemsSnapshot: [{ name: 'Coffee', quantity: 1, price: 1.5 }],
        subtotal: 1.5,
        tax: 0.33,
        taxBreakdown: null,
        discount: 0,
        discountReason: null,
        tip: 0,
        total: 1.83,
        paymentMethod: 'cash',
        notes: null,
      };

      const result = prepareReceiptTemplateData(receipt, 'en', 'EUR');

      expect(result.receipt.customer).toBeNull();
      expect(result.receipt.items).toHaveLength(1);
    });

    it('should handle discount', () => {
      const receipt = {
        receiptNumber: 'R000003',
        status: 'issued' as const,
        issuedAt: new Date(),
        businessSnapshot: {
          name: 'Test',
          address: null,
          city: null,
          postalCode: null,
          country: null,
          phone: null,
          email: null,
          vatNumber: null,
        },
        customerSnapshot: null,
        itemsSnapshot: [],
        subtotal: 100,
        tax: 22,
        taxBreakdown: null,
        discount: 10,
        discountReason: 'Loyalty discount',
        tip: 0,
        total: 112,
        paymentMethod: 'card',
        notes: null,
      };

      const result = prepareReceiptTemplateData(receipt);

      expect(result.receipt.discount).toBe(10);
      expect(result.receipt.discountReason).toBe('Loyalty discount');
    });

    it('should handle tip', () => {
      const receipt = {
        receiptNumber: 'R000004',
        status: 'issued' as const,
        issuedAt: new Date(),
        businessSnapshot: {
          name: 'Test',
          address: null,
          city: null,
          postalCode: null,
          country: null,
          phone: null,
          email: null,
          vatNumber: null,
        },
        customerSnapshot: null,
        itemsSnapshot: [],
        subtotal: 100,
        tax: 22,
        taxBreakdown: null,
        discount: 0,
        discountReason: null,
        tip: 5,
        total: 127,
        paymentMethod: 'cash',
        notes: null,
      };

      const result = prepareReceiptTemplateData(receipt);

      expect(result.receipt.tip).toBe(5);
    });

    it('should handle draft status', () => {
      const receipt = {
        receiptNumber: 'R-DRAFT',
        status: 'draft' as const,
        issuedAt: null,
        businessSnapshot: {
          name: 'Test',
          address: null,
          city: null,
          postalCode: null,
          country: null,
          phone: null,
          email: null,
          vatNumber: null,
        },
        customerSnapshot: null,
        itemsSnapshot: [],
        subtotal: 0,
        tax: 0,
        taxBreakdown: null,
        discount: 0,
        discountReason: null,
        tip: 0,
        total: 0,
        paymentMethod: 'cash',
        notes: null,
      };

      const result = prepareReceiptTemplateData(receipt);

      expect(result.receipt.status).toBe('draft');
      expect(result.receipt.issuedAt).toBeDefined(); // Should default to current date
    });

    it('should handle voided status', () => {
      const receipt = {
        receiptNumber: 'R000005',
        status: 'voided' as const,
        issuedAt: new Date(),
        businessSnapshot: {
          name: 'Test',
          address: null,
          city: null,
          postalCode: null,
          country: null,
          phone: null,
          email: null,
          vatNumber: null,
        },
        customerSnapshot: null,
        itemsSnapshot: [],
        subtotal: 100,
        tax: 22,
        taxBreakdown: null,
        discount: 0,
        discountReason: null,
        tip: 0,
        total: 122,
        paymentMethod: 'card',
        notes: null,
      };

      const result = prepareReceiptTemplateData(receipt);

      expect(result.receipt.status).toBe('voided');
    });

    it('should handle tax breakdown', () => {
      const receipt = {
        receiptNumber: 'R000006',
        status: 'issued' as const,
        issuedAt: new Date(),
        businessSnapshot: {
          name: 'Test',
          address: null,
          city: null,
          postalCode: null,
          country: null,
          phone: null,
          email: null,
          vatNumber: null,
        },
        customerSnapshot: null,
        itemsSnapshot: [],
        subtotal: 100,
        tax: 27,
        taxBreakdown: [
          { rateName: 'Standard', ratePercent: 22, taxableAmount: 100, taxAmount: 22 },
          { rateName: 'Reduced', ratePercent: 10, taxableAmount: 50, taxAmount: 5 },
        ],
        discount: 0,
        discountReason: null,
        tip: 0,
        total: 127,
        paymentMethod: 'card',
        notes: null,
      };

      const result = prepareReceiptTemplateData(receipt);

      expect(result.receipt.taxBreakdown).toHaveLength(2);
      expect(result.receipt.taxBreakdown?.[0].rateName).toBe('Standard');
      expect(result.receipt.taxBreakdown?.[1].ratePercent).toBe(10);
    });
  });

  describe('renderReceiptHTML', () => {
    it('should render HTML from template data', async () => {
      const templateData = prepareReceiptTemplateData({
        receiptNumber: 'R000001',
        status: 'issued',
        issuedAt: new Date('2026-04-01T12:00:00Z'),
        businessSnapshot: {
          name: 'Test Cafe',
          address: 'Via Test 1',
          city: 'Milano',
          postalCode: '20100',
          country: 'IT',
          phone: '+39 02 1234567',
          email: 'test@cafe.it',
          vatNumber: 'IT12345678901',
        },
        customerSnapshot: null,
        itemsSnapshot: [
          { name: 'Espresso', quantity: 2, price: 1.5 },
          { name: 'Cappuccino', quantity: 1, price: 2 },
        ],
        subtotal: 5,
        tax: 1.1,
        taxBreakdown: null,
        discount: 0,
        discountReason: null,
        tip: 0,
        total: 6.1,
        paymentMethod: 'card',
        notes: null,
      });

      const html = await renderReceiptHTML(templateData);

      expect(html).toContain('Test Cafe');
      expect(html).toContain('R000001');
      expect(html).toContain('Espresso');
      expect(html).toContain('<!DOCTYPE html>');
    }, 30000);

    it('should use custom template name', async () => {
      const templateData = prepareReceiptTemplateData({
        receiptNumber: 'R000002',
        status: 'issued',
        issuedAt: new Date(),
        businessSnapshot: {
          name: 'Test',
          address: null,
          city: null,
          postalCode: null,
          country: null,
          phone: null,
          email: null,
          vatNumber: null,
        },
        customerSnapshot: null,
        itemsSnapshot: [],
        subtotal: 0,
        tax: 0,
        taxBreakdown: null,
        discount: 0,
        discountReason: null,
        tip: 0,
        total: 0,
        paymentMethod: 'cash',
        notes: null,
      });

      const html = await renderReceiptHTML(templateData, 'receipt-standard');

      expect(html).toContain('Test');
      expect(html).toContain('<!DOCTYPE html>');
    }, 30000);
  });

  describe('renderReceiptPDF', () => {
    it('should generate PDF buffer', async () => {
      const templateData = prepareReceiptTemplateData({
        receiptNumber: 'R-PDF-001',
        status: 'issued',
        issuedAt: new Date('2026-04-01T12:00:00Z'),
        businessSnapshot: {
          name: 'Test Cafe',
          address: 'Via Test 1',
          city: 'Milano',
          postalCode: '20100',
          country: 'IT',
          phone: '+39 02 1234567',
          email: 'test@cafe.it',
          vatNumber: 'IT12345678901',
        },
        customerSnapshot: null,
        itemsSnapshot: [
          { name: 'Espresso', quantity: 2, price: 1.5 },
        ],
        subtotal: 3,
        tax: 0.66,
        taxBreakdown: null,
        discount: 0,
        discountReason: null,
        tip: 0,
        total: 3.66,
        paymentMethod: 'card',
        notes: null,
      });

      const result = await renderReceiptPDF(templateData);

      expect(result.buffer).toBeDefined();
      expect(Buffer.isBuffer(result.buffer)).toBe(true);
      expect(result.filename).toContain('R-PDF-001');
      expect(result.filename).toMatch(/\.pdf$/);
      expect(result.sizeBytes).toBeGreaterThan(0);
      expect(result.generatedAt).toBeInstanceOf(Date);
    }, 30000);
  });

  describe('renderDraftReceiptPDF', () => {
    it('should render draft receipt with watermark', async () => {
      const templateData = prepareReceiptTemplateData({
        receiptNumber: 'R-DRAFT',
        status: 'draft',
        issuedAt: null,
        businessSnapshot: {
          name: 'Test',
          address: null,
          city: null,
          postalCode: null,
          country: null,
          phone: null,
          email: null,
          vatNumber: null,
        },
        customerSnapshot: null,
        itemsSnapshot: [],
        subtotal: 0,
        tax: 0,
        taxBreakdown: null,
        discount: 0,
        discountReason: null,
        tip: 0,
        total: 0,
        paymentMethod: 'cash',
        notes: null,
      });

      const result = await renderDraftReceiptPDF(templateData);

      expect(result.buffer).toBeDefined();
      expect(result.sizeBytes).toBeGreaterThan(0);
    }, 30000);
  });

  describe('renderVoidedReceiptPDF', () => {
    it('should render voided receipt with stamp', async () => {
      const templateData = prepareReceiptTemplateData({
        receiptNumber: 'R-VOIDED',
        status: 'voided',
        issuedAt: new Date(),
        businessSnapshot: {
          name: 'Test',
          address: null,
          city: null,
          postalCode: null,
          country: null,
          phone: null,
          email: null,
          vatNumber: null,
        },
        customerSnapshot: null,
        itemsSnapshot: [],
        subtotal: 100,
        tax: 22,
        taxBreakdown: null,
        discount: 0,
        discountReason: null,
        tip: 0,
        total: 122,
        paymentMethod: 'card',
        notes: null,
      });

      const result = await renderVoidedReceiptPDF(templateData);

      expect(result.buffer).toBeDefined();
      expect(result.sizeBytes).toBeGreaterThan(0);
    }, 30000);
  });
});
