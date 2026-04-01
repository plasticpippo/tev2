import fs from 'fs/promises';
import path from 'path';
import Handlebars from 'handlebars';

describe('emailTemplateService - Email Templates', () => {
  const EMAIL_TEMPLATES_DIR = path.join(__dirname, '../../templates/emails');

  describe('Template Files', () => {
    it('should have receipt-email.html.hbs template file', async () => {
      const templatePath = path.join(EMAIL_TEMPLATES_DIR, 'receipt-email.html.hbs');
      const exists = await fs.access(templatePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should have receipt-email.txt.hbs template file', async () => {
      const templatePath = path.join(EMAIL_TEMPLATES_DIR, 'receipt-email.txt.hbs');
      const exists = await fs.access(templatePath).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should have valid HTML template syntax', async () => {
      const templatePath = path.join(EMAIL_TEMPLATES_DIR, 'receipt-email.html.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      expect(() => Handlebars.compile(templateContent)).not.toThrow();
    });

    it('should have valid text template syntax', async () => {
      const templatePath = path.join(EMAIL_TEMPLATES_DIR, 'receipt-email.txt.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      expect(() => Handlebars.compile(templateContent)).not.toThrow();
    });
  });

  describe('HTML Template Rendering', () => {
    it('should render business name in HTML template', async () => {
      const templatePath = path.join(EMAIL_TEMPLATES_DIR, 'receipt-email.html.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);

      const result = template({
        t: (key: string) => key,
        business: { name: 'Test Business' },
        customer: { name: 'John' },
        receipt: { number: 'R001', date: '2026-04-01', total: 'EUR 100', itemsCount: 3 },
        locale: 'en'
      });

      expect(result).toContain('Test Business');
    });

    it('should render receipt number in HTML template', async () => {
      const templatePath = path.join(EMAIL_TEMPLATES_DIR, 'receipt-email.html.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);

      const result = template({
        t: (key: string) => key,
        business: { name: 'Test' },
        customer: { name: 'John' },
        receipt: { number: 'R000123', date: '2026-04-01', total: 'EUR 100', itemsCount: 3 },
        locale: 'en'
      });

      expect(result).toContain('R000123');
    });

    it('should render total amount in HTML template', async () => {
      const templatePath = path.join(EMAIL_TEMPLATES_DIR, 'receipt-email.html.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);

      const result = template({
        t: (key: string) => key,
        business: { name: 'Test' },
        customer: { name: 'John' },
        receipt: { number: 'R001', date: '2026-04-01', total: 'EUR 250.50', itemsCount: 3 },
        locale: 'en'
      });

      expect(result).toContain('EUR 250.50');
    });

    it('should include email client compatible styles', async () => {
      const templatePath = path.join(EMAIL_TEMPLATES_DIR, 'receipt-email.html.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');

      // Check for inline styles (email clients need inline styles)
      expect(templateContent).toMatch(/style="[^"]*"/);
      // Check for table-based layout (email client compatible)
      expect(templateContent).toContain('<table');
    });

    it('should handle conditional business fields', async () => {
      const templatePath = path.join(EMAIL_TEMPLATES_DIR, 'receipt-email.html.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);

      // Test with all fields
      const resultWithFields = template({
        t: (key: string) => key,
        business: { 
          name: 'Test', 
          address: '123 Main St',
          phone: '+39123456789',
          email: 'test@example.com',
          vatNumber: 'IT123'
        },
        customer: { name: 'John' },
        receipt: { number: 'R001', date: '2026-04-01', total: 'EUR 100', itemsCount: 3 },
        locale: 'en'
      });

      expect(resultWithFields).toContain('123 Main St');
      expect(resultWithFields).toContain('+39123456789');
      expect(resultWithFields).toContain('test@example.com');
      expect(resultWithFields).toContain('IT123');

      // Test without optional fields
      const resultMinimal = template({
        t: (key: string) => key,
        business: { name: 'Test' },
        customer: { name: 'John' },
        receipt: { number: 'R001', date: '2026-04-01', total: 'EUR 100', itemsCount: 3 },
        locale: 'en'
      });

      expect(resultMinimal).toContain('Test');
    });
  });

  describe('Text Template Rendering', () => {
    it('should render plain text template', async () => {
      const templatePath = path.join(EMAIL_TEMPLATES_DIR, 'receipt-email.txt.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = Handlebars.compile(templateContent);

      const result = template({
        t: (key: string) => key,
        business: { name: 'Test Business' },
        customer: { name: 'John' },
        receipt: { number: 'R001', date: '2026-04-01', total: 'EUR 100', itemsCount: 3 },
        locale: 'en'
      });

      expect(result).toContain('Test Business');
      expect(result).toContain('R001');
      expect(result).toContain('EUR 100');
      // Should not contain HTML tags
      expect(result).not.toMatch(/<[^>]+>/);
    });

    it('should have proper formatting in text template', async () => {
      const templatePath = path.join(EMAIL_TEMPLATES_DIR, 'receipt-email.txt.hbs');
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      
      // Should have separators for readability
      expect(templateContent).toContain('---');
    });
  });

  describe('Localization Files', () => {
    it('should have English email translations', async () => {
      const enPath = path.join(__dirname, '../../locales/en/email.json');
      const content = await fs.readFile(enPath, 'utf-8');
      const translations = JSON.parse(content);

      expect(translations.receipt).toBeDefined();
      expect(translations.receipt.subject).toBeDefined();
      expect(translations.receipt.greeting).toBeDefined();
      expect(translations.receipt.body).toBeDefined();
    });

    it('should have Italian email translations', async () => {
      const itPath = path.join(__dirname, '../../locales/it/email.json');
      const content = await fs.readFile(itPath, 'utf-8');
      const translations = JSON.parse(content);

      expect(translations.receipt).toBeDefined();
      expect(translations.receipt.subject).toBeDefined();
      expect(translations.receipt.greeting).toBeDefined();
      expect(translations.receipt.body).toBeDefined();
    });

    it('should have all required translation keys', async () => {
      const requiredKeys = [
        'subject', 'greeting', 'body', 'receiptNumber', 'date',
        'itemsCount', 'total', 'thankYou', 'phone', 'email',
        'vatNumber', 'footer', 'disclaimer'
      ];

      const enPath = path.join(__dirname, '../../locales/en/email.json');
      const enContent = await fs.readFile(enPath, 'utf-8');
      const enTranslations = JSON.parse(enContent);

      requiredKeys.forEach(key => {
        expect(enTranslations.receipt[key]).toBeDefined();
      });
    });
  });
});
