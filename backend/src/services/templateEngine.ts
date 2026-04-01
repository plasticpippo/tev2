import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import i18next from '../i18n';

const TEMPLATES_DIR = process.env.PDF_TEMPLATE_PATH || path.join(__dirname, '../../templates/receipts');
const templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
const partialCache: Map<string, string> = new Map();
const partialsLoaded = new Set<string>();

const ALL_PARTIALS = [
  'header',
  'footer',
  'items',
  'totals',
  'receipt-info',
  'customer',
  'line-items',
  'tax-breakdown',
];

function getLocaleFromData(data: unknown): string {
  const root = (data as { root?: { locale?: string } } | undefined)?.root;
  return root?.locale || 'en';
}

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

function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(num);
}

function truncate(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

function registerHelpers(): void {
  Handlebars.registerHelper('formatCurrency', (amount: number, currency?: unknown) => {
    // Handle Handlebars passing options object as last argument
    const currencyCode = typeof currency === 'string' ? currency : 'EUR';
    return formatCurrency(amount, currencyCode);
  });

  Handlebars.registerHelper('formatDate', (date: string | Date, format?: unknown) => {
    const formatStr = typeof format === 'string' ? format : 'short';
    return formatDate(date, formatStr);
  });

  Handlebars.registerHelper('formatTime', (date: string | Date) => {
    return formatTime(date);
  });

  Handlebars.registerHelper('formatNumber', (num: number) => {
    return formatNumber(num);
  });

  Handlebars.registerHelper('truncate', (str: string, maxLength: number) => {
    return truncate(str, maxLength);
  });

  // Block helpers for conditionals
  Handlebars.registerHelper('eq', function(this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    if (arguments.length < 3) {
      // Used as inline helper
      return a === b;
    }
    // Used as block helper
    if (a === b) {
      return options.fn(this);
    }
    return options.inverse ? options.inverse(this) : '';
  });

  Handlebars.registerHelper('ne', function(this: unknown, a: unknown, b: unknown, options: Handlebars.HelperOptions) {
    if (arguments.length < 3) {
      return a !== b;
    }
    if (a !== b) {
      return options.fn(this);
    }
    return options.inverse ? options.inverse(this) : '';
  });

  Handlebars.registerHelper('gt', function(this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
    if (arguments.length < 3) {
      return a > b;
    }
    if (a > b) {
      return options.fn(this);
    }
    return options.inverse ? options.inverse(this) : '';
  });

  Handlebars.registerHelper('lt', function(this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
    if (arguments.length < 3) {
      return a < b;
    }
    if (a < b) {
      return options.fn(this);
    }
    return options.inverse ? options.inverse(this) : '';
  });

  Handlebars.registerHelper('gte', function(this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
    if (arguments.length < 3) {
      return a >= b;
    }
    if (a >= b) {
      return options.fn(this);
    }
    return options.inverse ? options.inverse(this) : '';
  });

  Handlebars.registerHelper('lte', function(this: unknown, a: number, b: number, options: Handlebars.HelperOptions) {
    if (arguments.length < 3) {
      return a <= b;
    }
    if (a <= b) {
      return options.fn(this);
    }
    return options.inverse ? options.inverse(this) : '';
  });

  Handlebars.registerHelper('t', (key: string, options?: Handlebars.HelperOptions) => {
    const locale = getLocaleFromData(options?.data);
    // If key starts with 'receipt.', strip it since we're using the 'receipt' namespace
    const translationKey = key.startsWith('receipt.') ? key.substring(8) : key;
    return i18next.t(translationKey, { lng: locale, ns: 'receipt' });
  });

  Handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
  Handlebars.registerHelper('add', (a: number, b: number) => a + b);
  Handlebars.registerHelper('subtract', (a: number, b: number) => a - b);

  Handlebars.registerHelper('and', (a: unknown, b: unknown) => Boolean(a) && Boolean(b));
  Handlebars.registerHelper('or', (a: unknown, b: unknown) => Boolean(a) || Boolean(b));
  Handlebars.registerHelper('not', (a: unknown) => !a);

  Handlebars.registerHelper('isNull', (a: unknown) => a === null || a === undefined);
  Handlebars.registerHelper('isNotNull', (a: unknown) => a !== null && a !== undefined);
}

async function loadPartial(name: string): Promise<string> {
  if (partialCache.has(name)) {
    if (!partialsLoaded.has(name)) {
      Handlebars.registerPartial(name, partialCache.get(name)!);
      partialsLoaded.add(name);
    }
    return partialCache.get(name)!;
  }

  const partialPath = path.join(TEMPLATES_DIR, 'partials', `${name}.html.hbs`);
  const content = await fs.readFile(partialPath, 'utf-8');
  partialCache.set(name, content);
  Handlebars.registerPartial(name, content);
  partialsLoaded.add(name);
  return content;
}

async function loadAllPartials(): Promise<void> {
  await Promise.all(ALL_PARTIALS.map(name => loadPartial(name)));
}

export async function loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
  const cacheKey = templateName;

  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!;
  }

  await loadAllPartials();

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

export { formatCurrency, formatDate, formatTime, formatNumber, truncate };
