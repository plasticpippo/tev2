import {
  formatCurrency,
  formatDate,
  formatNumber,
  loadInvoiceTemplate,
  clearTemplateCache,
} from '../services/templateEngine';
import { initI18n, getI18n } from '../i18n';

describe('invoiceTemplateEngine', () => {
  beforeAll(async () => {
    await initI18n();
  });

  beforeEach(() => {
    clearTemplateCache();
  });

  describe('i18n initialization', () => {
    it('should have loaded invoice namespace', () => {
      const i18n = getI18n();
      const hasInvoiceNs = i18n.hasLoadedNamespace('invoice');
      expect(hasInvoiceNs).toBe(true);
    });

    it('should have Italian invoice status translations', () => {
      const i18n = getI18n();
      const draftIt = i18n.t('status.draft', { lng: 'it', ns: 'invoice' });
      expect(draftIt).toBe('BOZZA');
    });

    it('should have English invoice translations', () => {
      const i18n = getI18n();
      const titleEn = i18n.t('title', { lng: 'en', ns: 'invoice' });
      expect(titleEn).toBe('Invoice');
    });
  });

  describe('loadInvoiceTemplate', () => {
    it('should load invoice-main template', async () => {
      const template = await loadInvoiceTemplate('invoice-main');
      expect(template).toBeDefined();
      expect(typeof template).toBe('function');
    });

    it('should render invoice template with business data', async () => {
      const template = await loadInvoiceTemplate('invoice-main');
      const invoiceData = {
        locale: 'en',
        invoice: {
          invoiceNumber: 'INV-001',
          issueDate: '2026-04-06',
          dueDate: '2026-05-06',
          status: 'sent',
          business: {
            name: 'Test Business',
            address: '123 Test Street',
            city: 'Test City',
            postalCode: '12345',
            country: 'Test Country',
            phone: '+1234567890',
            email: 'test@example.com',
            vatNumber: 'VAT123',
            logoPath: null,
          },
          customer: {
            name: 'Test Customer',
            email: 'customer@example.com',
            phone: '+0987654321',
            vatNumber: 'CUSTVAT',
            address: '456 Customer Ave',
            city: 'Customer City',
            postalCode: '67890',
            country: 'Customer Country',
          },
          items: [
            {
              name: 'Test Item',
              quantity: 2,
              price: 100,
              total: 200,
              taxRateName: 'Standard',
              taxRatePercent: 22,
            },
          ],
          subtotal: 200,
          tax: 44,
          taxBreakdown: [
            {
              rateName: 'Standard',
              ratePercent: 22,
              taxableAmount: 200,
              taxAmount: 44,
            },
          ],
          discount: 0,
          discountReason: null,
          total: 244,
          paymentMethod: 'Bank Transfer',
          notes: 'Thank you for your business',
          legalText: 'This is a valid invoice.',
          paymentInstructions: 'Please pay within 30 days.',
        },
      };

      const result = template(invoiceData);
      expect(result).toContain('Test Business');
      expect(result).toContain('INV-001');
      expect(result).toContain('Test Customer');
      expect(result).toContain('Test Item');
      expect(result).toContain('200');
    });

    it('should render invoice header with logo when provided', async () => {
      const template = await loadInvoiceTemplate('invoice-main');
      const invoiceData = {
        locale: 'en',
        invoice: {
          invoiceNumber: 'INV-002',
          issueDate: '2026-04-06',
          dueDate: null,
          status: 'draft',
          business: {
            name: 'Logo Business',
            address: null,
            city: null,
            postalCode: null,
            country: null,
            phone: null,
            email: null,
            vatNumber: null,
            logoPath: '/uploads/logo.png',
          },
          customer: null,
          items: [],
          subtotal: 0,
          tax: 0,
          taxBreakdown: null,
          discount: 0,
          discountReason: null,
          total: 0,
          paymentMethod: 'Cash',
          notes: null,
          legalText: null,
          paymentInstructions: null,
        },
      };

      const result = template(invoiceData);
      expect(result).toContain('/uploads/logo.png');
      expect(result).toContain('Logo Business');
    });

    it('should render invoice footer with legal text', async () => {
      const template = await loadInvoiceTemplate('invoice-main');
      const invoiceData = {
        locale: 'en',
        invoice: {
          invoiceNumber: 'INV-003',
          issueDate: '2026-04-06',
          dueDate: null,
          status: 'paid',
          business: {
            name: 'Test Business',
            address: null,
            city: null,
            postalCode: null,
            country: null,
            phone: null,
            email: null,
            vatNumber: null,
            logoPath: null,
          },
          customer: null,
          items: [],
          subtotal: 0,
          tax: 0,
          taxBreakdown: null,
          discount: 0,
          discountReason: null,
          total: 0,
          paymentMethod: 'Cash',
          notes: null,
          legalText: 'Custom legal disclaimer',
          paymentInstructions: null,
        },
      };

      const result = template(invoiceData);
      expect(result).toContain('Custom legal disclaimer');
    });

    it('should use Italian translations for Italian locale', async () => {
      const template = await loadInvoiceTemplate('invoice-main');
      const invoiceData = {
        locale: 'it',
        invoice: {
          invoiceNumber: 'INV-004',
          issueDate: '2026-04-06',
          dueDate: null,
          status: 'draft',
          business: {
            name: 'Azienda Test',
            address: null,
            city: null,
            postalCode: null,
            country: null,
            phone: null,
            email: null,
            vatNumber: null,
            logoPath: null,
          },
          customer: null,
          items: [],
          subtotal: 0,
          tax: 0,
          taxBreakdown: null,
          discount: 0,
          discountReason: null,
          total: 0,
          paymentMethod: 'Contanti',
          notes: null,
          legalText: null,
          paymentInstructions: null,
        },
      };

      const result = template(invoiceData);
      expect(result).toContain('Fattura');
    });
  });

  describe('header consistency', () => {
    it('should use same CSS classes as receipt header', async () => {
      const template = await loadInvoiceTemplate('invoice-main');
      const invoiceData = {
        locale: 'en',
        invoice: {
          invoiceNumber: 'INV-005',
          issueDate: '2026-04-06',
          dueDate: null,
          status: 'sent',
          business: {
            name: 'Test Business',
            address: '123 Test St',
            city: 'Test City',
            postalCode: '12345',
            country: 'USA',
            phone: '+1234567890',
            email: 'test@test.com',
            vatNumber: 'VAT123',
            logoPath: '/uploads/test-logo.png',
          },
          customer: null,
          items: [],
          subtotal: 0,
          tax: 0,
          taxBreakdown: null,
          discount: 0,
          discountReason: null,
          total: 0,
          paymentMethod: 'Cash',
          notes: null,
          legalText: null,
          paymentInstructions: null,
        },
      };

      const result = template(invoiceData);
      expect(result).toContain('class="receipt-header"');
      expect(result).toContain('class="business-name"');
      expect(result).toContain('class="business-details"');
      expect(result).toContain('class="business-logo"');
    });
  });
});
