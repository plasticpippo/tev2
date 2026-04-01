import {
  formatCurrency,
  formatDate,
  formatTime,
  formatNumber,
  truncate,
  loadTemplate,
  clearTemplateCache,
} from '../services/templateEngine';
import { initI18n, getI18n } from '../i18n';

describe('templateEngine', () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    clearTemplateCache();
  });

  describe('i18n initialization', () => {
    it('should have loaded receipt namespace', () => {
      const i18n = getI18n();
      const hasReceiptNs = i18n.hasLoadedNamespace('receipt');
      expect(hasReceiptNs).toBe(true);
    });

    it('should have Italian status translations', () => {
      const i18n = getI18n();
      const draftIt = i18n.t('status.draft', { lng: 'it', ns: 'receipt' });
      expect(draftIt).toBe('BOZZA');
    });
  });

  describe('formatCurrency', () => {
    it('should format number as EUR currency', () => {
      const result = formatCurrency(100);
      expect(result).toContain('100');
      expect(result).toMatch(/€|EUR/);
    });

    it('should format with 2 decimal places', () => {
      const result = formatCurrency(10.5);
      expect(result).toContain('10,50');
    });

    it('should handle zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0,00');
    });

    it('should handle negative values', () => {
      const result = formatCurrency(-50.25);
      expect(result).toContain('50,25');
    });

    it('should handle large values', () => {
      const result = formatCurrency(1000000.99);
      expect(result).toContain('1.000.000,99');
    });
  });

  describe('formatDate', () => {
    it('should format date in short format by default', () => {
      const date = new Date('2026-04-01T12:00:00Z');
      const result = formatDate(date);
      expect(result).toMatch(/2026/);
      expect(result).toMatch(/04/);
      expect(result).toMatch(/01/);
    });

    it('should format date in long format', () => {
      const date = new Date('2026-04-01T12:00:00Z');
      const result = formatDate(date, 'long');
      expect(result).toMatch(/2026/);
      expect(result).toMatch(/aprile|April/i);
    });

    it('should handle string date input', () => {
      const result = formatDate('2026-04-01');
      expect(result).toMatch(/2026/);
    });
  });

  describe('formatTime', () => {
    it('should format time with hours and minutes', () => {
      const date = new Date('2026-04-01T14:30:00Z');
      const result = formatTime(date);
      expect(result).toMatch(/\d{2}:\d{2}/);
    });

    it('should handle string date input', () => {
      const result = formatTime('2026-04-01T14:30:00Z');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('formatNumber', () => {
    it('should format integer numbers', () => {
      const result = formatNumber(1000);
      expect(result).toBe('1.000');
    });

    it('should format decimal numbers', () => {
      const result = formatNumber(1000.5);
      expect(result).toBe('1.000,5');
    });

    it('should handle zero', () => {
      const result = formatNumber(0);
      expect(result).toBe('0');
    });

    it('should limit to 2 decimal places', () => {
      const result = formatNumber(10.555);
      expect(result).toBe('10,56');
    });
  });

  describe('truncate', () => {
    it('should not truncate short strings', () => {
      const result = truncate('Hello', 10);
      expect(result).toBe('Hello');
    });

    it('should truncate long strings', () => {
      const result = truncate('This is a very long string', 10);
      expect(result).toBe('This is...');
      expect(result.length).toBe(10);
    });

    it('should handle empty string', () => {
      const result = truncate('', 10);
      expect(result).toBe('');
    });

    it('should handle exact length strings', () => {
      const result = truncate('Exactly10', 10);
      expect(result).toBe('Exactly10');
    });
  });

  describe('loadTemplate', () => {
    it('should load receipt-main template', async () => {
      const template = await loadTemplate('receipt-main');
      expect(template).toBeDefined();
      expect(typeof template).toBe('function');
    });

    it('should load receipt-standard template', async () => {
      const template = await loadTemplate('receipt-standard');
      expect(template).toBeDefined();
      expect(typeof template).toBe('function');
    });

    it('should cache templates', async () => {
      const template1 = await loadTemplate('receipt-main');
      const template2 = await loadTemplate('receipt-main');
      expect(template1).toBe(template2);
    });

    it('should throw for non-existent template', async () => {
      await expect(loadTemplate('non-existent')).rejects.toThrow();
    });
  });

  describe('template rendering', () => {
    it('should render receipt-main with basic data', async () => {
      const template = await loadTemplate('receipt-main');
      const data = {
        receipt: {
          receiptNumber: 'R000001',
          status: 'issued',
          issuedAt: new Date('2026-04-01T12:00:00Z'),
          business: {
            name: 'Test Cafe',
            address: 'Via Test 1',
            city: 'Milano',
            postalCode: '20100',
            country: 'IT',
            phone: '+39 02 1234567',
            email: 'test@cafe.it',
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
          notes: null,
        },
        locale: 'it',
        currency: 'EUR',
      };

      const html = template(data);

      expect(html).toContain('Test Cafe');
      expect(html).toContain('R000001');
      expect(html).toContain('Espresso');
      expect(html).toContain('Cappuccino');
      expect(html).toContain('6,10');
    });

    it('should render with customer information', async () => {
      const template = await loadTemplate('receipt-main');
      const data = {
        receipt: {
          receiptNumber: 'R000002',
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
          customer: {
            name: 'Mario Rossi',
            email: 'mario@example.com',
            phone: null,
            vatNumber: 'IT98765432101',
            address: 'Via Customer 10',
            city: 'Roma',
            postalCode: '00100',
            country: 'IT',
          },
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

      const html = template(data);

      expect(html).toContain('Mario Rossi');
      expect(html).toContain('IT98765432101');
      expect(html).toContain('Via Customer 10');
    });

    it('should show draft watermark', async () => {
      const template = await loadTemplate('receipt-main');
      const data = {
        receipt: {
          receiptNumber: 'R-DRAFT',
          status: 'draft',
          issuedAt: new Date(),
          business: {
            name: 'Test Cafe',
            address: null,
            city: null,
            postalCode: null,
            country: null,
            phone: null,
            email: null,
            vatNumber: null,
          },
          customer: null,
          items: [],
          subtotal: 0,
          tax: 0,
          taxBreakdown: null,
          discount: 0,
          discountReason: null,
          tip: 0,
          total: 0,
          paymentMethod: 'cash',
          notes: null,
        },
        locale: 'en',
        currency: 'EUR',
      };

      const html = template(data);

      expect(html).toContain('watermark');
      expect(html).toContain('BOZZA');
    });

    it('should show voided stamp', async () => {
      const template = await loadTemplate('receipt-main');
      const data = {
        receipt: {
          receiptNumber: 'R000003',
          status: 'voided',
          issuedAt: new Date(),
          business: {
            name: 'Test Cafe',
            address: null,
            city: null,
            postalCode: null,
            country: null,
            phone: null,
            email: null,
            vatNumber: null,
          },
          customer: null,
          items: [],
          subtotal: 0,
          tax: 0,
          taxBreakdown: null,
          discount: 0,
          discountReason: null,
          tip: 0,
          total: 0,
          paymentMethod: 'cash',
          notes: null,
        },
        locale: 'en',
        currency: 'EUR',
      };

      const html = template(data);

      expect(html).toContain('stamp-overlay');
      expect(html).toContain('ANNULLATA');
    });

    it('should render tax breakdown', async () => {
      const template = await loadTemplate('receipt-main');
      const data = {
        receipt: {
          receiptNumber: 'R000004',
          status: 'issued',
          issuedAt: new Date(),
          business: {
            name: 'Test Cafe',
            address: null,
            city: null,
            postalCode: null,
            country: null,
            phone: null,
            email: null,
            vatNumber: null,
          },
          customer: null,
          items: [],
          subtotal: 100,
          tax: 22,
          taxBreakdown: [
            { rateName: 'Standard', ratePercent: 22, taxableAmount: 100, taxAmount: 22 },
          ],
          discount: 0,
          discountReason: null,
          tip: 0,
          total: 122,
          paymentMethod: 'card',
          notes: null,
        },
        locale: 'it',
        currency: 'EUR',
      };

      const html = template(data);

      expect(html).toContain('Dettaglio IVA');
      expect(html).toContain('Standard');
      expect(html).toContain('22%');
    });

    it('should render discount', async () => {
      const template = await loadTemplate('receipt-main');
      const data = {
        receipt: {
          receiptNumber: 'R000005',
          status: 'issued',
          issuedAt: new Date(),
          business: {
            name: 'Test Cafe',
            address: null,
            city: null,
            postalCode: null,
            country: null,
            phone: null,
            email: null,
            vatNumber: null,
          },
          customer: null,
          items: [],
          subtotal: 100,
          tax: 22,
          taxBreakdown: null,
          discount: 10,
          discountReason: 'Loyalty discount',
          tip: 0,
          total: 112,
          paymentMethod: 'card',
          notes: null,
        },
        locale: 'en',
        currency: 'EUR',
      };

      const html = template(data);

      expect(html).toContain('Discount');
      expect(html).toContain('Loyalty discount');
    });

    it('should render tip', async () => {
      const template = await loadTemplate('receipt-main');
      const data = {
        receipt: {
          receiptNumber: 'R000006',
          status: 'issued',
          issuedAt: new Date(),
          business: {
            name: 'Test Cafe',
            address: null,
            city: null,
            postalCode: null,
            country: null,
            phone: null,
            email: null,
            vatNumber: null,
          },
          customer: null,
          items: [],
          subtotal: 100,
          tax: 22,
          taxBreakdown: null,
          discount: 0,
          discountReason: null,
          tip: 5,
          total: 127,
          paymentMethod: 'cash',
          notes: null,
        },
        locale: 'en',
        currency: 'EUR',
      };

      const html = template(data);

      expect(html).toContain('Tip');
    });
  });

  describe('i18n integration', () => {
    it('should render Italian labels', async () => {
      const template = await loadTemplate('receipt-main');
      const data = {
        receipt: {
          receiptNumber: 'R000001',
          status: 'issued',
          issuedAt: new Date(),
          business: {
            name: 'Test',
            address: null,
            city: null,
            postalCode: null,
            country: null,
            phone: null,
            email: null,
            vatNumber: null,
          },
          customer: null,
          items: [],
          subtotal: 0,
          tax: 0,
          taxBreakdown: null,
          discount: 0,
          discountReason: null,
          tip: 0,
          total: 0,
          paymentMethod: 'cash',
          notes: null,
        },
        locale: 'it',
        currency: 'EUR',
      };

      const html = template(data);

      expect(html).toContain('Ricevuta');
      expect(html).toContain('Grazie');
    });

    it('should render English labels', async () => {
      const template = await loadTemplate('receipt-main');
      const data = {
        receipt: {
          receiptNumber: 'R000001',
          status: 'issued',
          issuedAt: new Date(),
          business: {
            name: 'Test',
            address: null,
            city: null,
            postalCode: null,
            country: null,
            phone: null,
            email: null,
            vatNumber: null,
          },
          customer: null,
          items: [],
          subtotal: 0,
          tax: 0,
          taxBreakdown: null,
          discount: 0,
          discountReason: null,
          tip: 0,
          total: 0,
          paymentMethod: 'cash',
          notes: null,
        },
        locale: 'en',
        currency: 'EUR',
      };

      const html = template(data);

      expect(html).toContain('Receipt');
      expect(html).toContain('Thank you');
    });
  });
});
