import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const STORAGE_PATH = process.env.LOGO_STORAGE_PATH || path.join(__dirname, '../../uploads/logos');
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];
const ALLOWED_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/svg+xml': 'svg',
};

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface LogoUploadResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface LogoUploadService {
  processLogo(file: UploadedFile): Promise<LogoUploadResult>;
  deleteLogo(logoPath: string): Promise<boolean>;
  getLogoUrl(logoPath: string): string;
}

export const LOGO_ERROR_CODES = {
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  STORAGE_ERROR: 'STORAGE_ERROR',
} as const;

export async function ensureUploadsDirectory(): Promise<void> {
  await fs.mkdir(STORAGE_PATH, { recursive: true });
}

export function validateLogo(file: UploadedFile): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: LOGO_ERROR_CODES.INVALID_FILE_TYPE,
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: LOGO_ERROR_CODES.FILE_TOO_LARGE,
    };
  }

  return { valid: true };
}

export function generateLogoFilename(mimetype: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const extension = ALLOWED_EXTENSIONS[mimetype] || 'bin';
  return `logo-${timestamp}-${random}.${extension}`;
}

export async function processLogo(file: UploadedFile): Promise<LogoUploadResult> {
  const validation = validateLogo(file);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  try {
    await ensureUploadsDirectory();

    const filename = generateLogoFilename(file.mimetype);
    const filePath = path.join(STORAGE_PATH, filename);

    await fs.writeFile(filePath, file.buffer);

    const relativePath = `/uploads/logos/${filename}`;

    return {
      success: true,
      path: relativePath,
    };
  } catch (error) {
    return {
      success: false,
      error: LOGO_ERROR_CODES.STORAGE_ERROR,
    };
  }
}

export async function deleteLogo(logoPath: string): Promise<boolean> {
  if (!logoPath) {
    return false;
  }

  try {
    const filename = path.basename(logoPath);
    const filePath = path.join(STORAGE_PATH, filename);

    await fs.unlink(filePath);
    return true;
  } catch {
    return false;
  }
}

export function getLogoUrl(logoPath: string): string {
  if (!logoPath) {
    return '';
  }

  if (logoPath.startsWith('/uploads/')) {
    return logoPath;
  }

  return `/uploads/logos/${path.basename(logoPath)}`;
}

export { STORAGE_PATH };
