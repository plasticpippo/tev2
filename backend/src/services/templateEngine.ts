import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import i18next from '../i18n';

const TEMPLATES_DIR = process.env.PDF_TEMPLATE_PATH || path.join(__dirname, '../../templates/receipts');
const templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
const partialCache: Map<string, string> = new Map();

function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | Date, format: string = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatOpts: Intl.DateTimeFormatOptions = format === 'long'
    ? { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: '2-digit', day: '2-digit' };
  return d.toLocaleDateString('it-IT', formatOpts);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function registerHelpers(): void {
  Handlebars.registerHelper('formatCurrency', (amount: number, currency?: string) => {
    return formatCurrency(amount, currency || 'EUR');
  });

  Handlebars.registerHelper('formatDate', (date: string | Date, format?: string) => {
    return formatDate(date, format || 'short');
  });

  Handlebars.registerHelper('formatNumber', (num: number) => {
    return formatNumber(num);
  });

  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);
  Handlebars.registerHelper('gt', (a: number, b: number) => a > b);
  Handlebars.registerHelper('lt', (a: number, b: number) => a < b);
  Handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
  Handlebars.registerHelper('lte', (a: number, b: number) => a <= b);

  Handlebars.registerHelper('t', (key: string, options?: Handlebars.HelperOptions) => {
    const locale = (options?.data as { root?: { locale?: string } } | undefined)?.root?.locale || 'en';
    return i18next.t(key, { lng: locale, ns: 'receipt' });
  });

  Handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
  Handlebars.registerHelper('add', (a: number, b: number) => a + b);
  Handlebars.registerHelper('subtract', (a: number, b: number) => a - b);
}

async function loadPartial(name: string): Promise<string> {
  if (partialCache.has(name)) {
    return partialCache.get(name)!;
  }

  const partialPath = path.join(TEMPLATES_DIR, 'partials', `${name}.html.hbs`);
  const content = await fs.readFile(partialPath, 'utf-8');
  partialCache.set(name, content);
  Handlebars.registerPartial(name, content);
  return content;
}

export async function loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
  const cacheKey = templateName;

  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  await loadPartial('header');
  await loadPartial('footer');
  await loadPartial('items');
  await loadPartial('totals');

  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.html.hbs`);
  const templateContent = await fs.readFile(templatePath, 'utf-8');
  const template = Handlebars.compile(templateContent);

  templateCache.set(cacheKey, template);
  return template;
}

export function clearTemplateCache(): void {
  templateCache.clear();
  partialCache.clear();
}

export function clearTemplateFromCache(templateName: string): void {
  templateCache.delete(templateName);
}

registerHelpers();

export { formatCurrency, formatDate, formatNumber };
