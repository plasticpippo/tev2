import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
// Ensure Handlebars helpers are registered (formatCurrency, t, eq, etc.)
import './templateEngine';

const EMAIL_TEMPLATES_DIR = process.env.EMAIL_TEMPLATE_PATH || path.join(__dirname, '../../templates/emails');

interface EmailTemplateData {
  business: {
    name: string;
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
    phone?: string | null;
    email?: string | null;
    vatNumber?: string | null;
    logoPath?: string | null;
  };
  customer: {
    name: string;
    email?: string | null;
  };
  receipt: {
    number: string;
    date: string;
    itemsCount: number;
    total: string;
    transactionId?: number;
    paymentMethod?: string;
    subtotal?: string;
    tax?: string;
    taxBreakdown?: Array<{ rateName: string; ratePercent: number; taxableAmount: string; taxAmount: string }>;
    discount?: string;
    discountReason?: string | null;
    tip?: string;
    items?: Array<{ name: string; quantity: number; price: string; total: string }>;
  };
  customMessage?: string;
  locale?: string;
}

const templateCache = new Map<string, Handlebars.TemplateDelegate>();

async function loadEmailTemplate(templateName: string): Promise<Handlebars.TemplateDelegate> {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  const templatePath = path.join(EMAIL_TEMPLATES_DIR, `${templateName}`);
  const content = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(content);
  templateCache.set(templateName, template);
  return template;
}

export async function renderEmailHtml(data: EmailTemplateData): Promise<string> {
  const template = await loadEmailTemplate('receipt-email.html.hbs');
  return template(data);
}

export async function renderEmailText(data: EmailTemplateData): Promise<string> {
  const template = await loadEmailTemplate('receipt-email.txt.hbs');
  return template(data);
}

export function clearEmailTemplateCache(): void {
  templateCache.clear();
}

export type { EmailTemplateData };
