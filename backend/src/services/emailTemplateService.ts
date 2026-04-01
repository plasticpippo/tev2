import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import i18next from 'i18next';

const EMAIL_TEMPLATES_DIR = path.join(__dirname, '../../templates/emails');

interface EmailTemplateData {
  business: {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    phone?: string;
    email?: string;
    vatNumber?: string;
  };
  customer: {
    name: string;
    email: string;
  };
  receipt: {
    number: string;
    date: string;
    total: string;
    itemsCount: number;
  };
  locale: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

async function loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
  const cached = templateCache.get(templateName);
  if (cached) return cached;

  const templatePath = path.join(EMAIL_TEMPLATES_DIR, `${templateName}.hbs`);
  const templateSource = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(templateSource);
  
  templateCache.set(templateName, template);
  return template;
}

function getTranslator(locale: string) {
  return i18next.getFixedT(locale);
}

export async function renderEmailTemplate(
  data: EmailTemplateData
): Promise<EmailContent> {
  const { locale, business, customer, receipt } = data;
  
  const t = getTranslator(locale);
  
  // Load HTML and text templates
  const htmlTemplate = await loadTemplate('receipt-email.html');
  const textTemplate = await loadTemplate('receipt-email.txt');
  
  // Prepare template data with translation function
  const templateData = {
    t: (key: string, options?: Record<string, unknown>) => t(key, options),
    business: {
      name: business.name || '',
      address: business.address,
      city: business.city,
      country: business.country,
      phone: business.phone,
      email: business.email,
      vatNumber: business.vatNumber,
    },
    customer: {
      name: customer.name,
    },
    receipt: {
      number: receipt.number,
      date: receipt.date,
      total: receipt.total,
      itemsCount: receipt.itemsCount,
    },
    locale,
  };
  
  // Render templates
  const html = htmlTemplate(templateData);
  const text = textTemplate(templateData);
  
  // Get localized subject
  const subject = t('email:receipt.subject', {
    receiptNumber: receipt.number,
    businessName: business.name,
  });
  
  return {
    subject,
    html,
    text,
  };
}

export function clearEmailTemplateCache(): void {
  templateCache.clear();
}
