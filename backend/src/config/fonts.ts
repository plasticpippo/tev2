import path from 'path';

export const FONTS_DIR = process.env.PDF_FONT_PATH || path.join(__dirname, '../../assets/fonts');

export const fontConfigs: Record<string, FontConfig> = {
  inter: {
    regular: {
      path: path.join(FONTS_DIR, 'Inter-Regular.ttf'),
      family: 'Inter',
      weight: 400,
    },
    bold: {
      path: path.join(FONTS_DIR, 'Inter-Bold.ttf'),
      family: 'Inter',
      weight: 700,
    },
  },
  roboto: {
    regular: {
      path: path.join(FONTS_DIR, 'Roboto-Regular.ttf'),
      family: 'Roboto',
      weight: 400,
    },
    bold: {
      path: path.join(FONTS_DIR, 'Roboto-Bold.ttf'),
      family: 'Roboto',
      weight: 700,
    },
  },
};

export const DEFAULT_FONT_FAMILY = process.env.PDF_DEFAULT_FONT || 'inter';

export function getDefaultFontConfig(): FontConfig {
  return fontConfigs[DEFAULT_FONT_FAMILY] || fontConfigs.inter;
}

export function getFontPaths(): string[] {
  const defaultFont = getDefaultFontConfig();
  return [defaultFont.regular.path, defaultFont.bold.path];
}

import type { FontConfig } from '../types/pdf';
