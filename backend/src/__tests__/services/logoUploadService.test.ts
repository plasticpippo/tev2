import {
  validateLogo,
  generateLogoFilename,
  processLogo,
  deleteLogo,
  getLogoUrl,
  LOGO_ERROR_CODES,
  UploadedFile,
} from '../../services/logoUploadService';
import fs from 'fs/promises';
import path from 'path';

jest.mock('fs/promises');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('logoUploadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateLogo', () => {
    const createMockFile = (mimetype: string, size: number): UploadedFile => ({
      fieldname: 'logo',
      originalname: 'test.png',
      encoding: '7bit',
      mimetype,
      buffer: Buffer.from('test'),
      size,
    });

    it('should validate PNG files', () => {
      const file = createMockFile('image/png', 1024);
      const result = validateLogo(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate JPEG files', () => {
      const file = createMockFile('image/jpeg', 1024);
      const result = validateLogo(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate SVG files', () => {
      const file = createMockFile('image/svg+xml', 1024);
      const result = validateLogo(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid MIME types', () => {
      const file = createMockFile('image/gif', 1024);
      const result = validateLogo(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe(LOGO_ERROR_CODES.INVALID_FILE_TYPE);
    });

    it('should reject files larger than 2MB', () => {
      const file = createMockFile('image/png', 3 * 1024 * 1024);
      const result = validateLogo(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe(LOGO_ERROR_CODES.FILE_TOO_LARGE);
    });

    it('should accept files at exactly 2MB', () => {
      const file = createMockFile('image/png', 2 * 1024 * 1024);
      const result = validateLogo(file);
      expect(result.valid).toBe(true);
    });

    it('should reject files just over 2MB', () => {
      const file = createMockFile('image/png', 2 * 1024 * 1024 + 1);
      const result = validateLogo(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe(LOGO_ERROR_CODES.FILE_TOO_LARGE);
    });

    it('should reject application/octet-stream MIME type', () => {
      const file = createMockFile('application/octet-stream', 1024);
      const result = validateLogo(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe(LOGO_ERROR_CODES.INVALID_FILE_TYPE);
    });
  });

  describe('generateLogoFilename', () => {
    it('should generate PNG filename with correct extension', () => {
      const filename = generateLogoFilename('image/png');
      expect(filename).toMatch(/^logo-\d+-[a-f0-9]+\.png$/);
    });

    it('should generate JPEG filename with correct extension', () => {
      const filename = generateLogoFilename('image/jpeg');
      expect(filename).toMatch(/^logo-\d+-[a-f0-9]+\.jpg$/);
    });

    it('should generate SVG filename with correct extension', () => {
      const filename = generateLogoFilename('image/svg+xml');
      expect(filename).toMatch(/^logo-\d+-[a-f0-9]+\.svg$/);
    });

    it('should generate unique filenames', () => {
      const filename1 = generateLogoFilename('image/png');
      const filename2 = generateLogoFilename('image/png');
      expect(filename1).not.toBe(filename2);
    });

    it('should include timestamp in filename', () => {
      const before = Date.now();
      const filename = generateLogoFilename('image/png');
      const after = Date.now();
      const timestampMatch = filename.match(/logo-(\d+)-/);
      expect(timestampMatch).not.toBeNull();
      const timestamp = parseInt(timestampMatch![1], 10);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('processLogo', () => {
    const createMockFile = (mimetype: string, size: number): UploadedFile => ({
      fieldname: 'logo',
      originalname: 'test.png',
      encoding: '7bit',
      mimetype,
      buffer: Buffer.from('test image content'),
      size,
    });

    beforeEach(() => {
      mockedFs.mkdir.mockResolvedValue(undefined);
      mockedFs.writeFile.mockResolvedValue(undefined);
    });

    it('should successfully process a valid PNG file', async () => {
      const file = createMockFile('image/png', 1024);
      const result = await processLogo(file);

      expect(result.success).toBe(true);
      expect(result.path).toMatch(/^\/uploads\/logos\/logo-\d+-[a-f0-9]+\.png$/);
      expect(mockedFs.mkdir).toHaveBeenCalled();
      expect(mockedFs.writeFile).toHaveBeenCalled();
    });

    it('should successfully process a valid JPEG file', async () => {
      const file = createMockFile('image/jpeg', 1024);
      const result = await processLogo(file);

      expect(result.success).toBe(true);
      expect(result.path).toMatch(/^\/uploads\/logos\/logo-\d+-[a-f0-9]+\.jpg$/);
    });

    it('should successfully process a valid SVG file', async () => {
      const file = createMockFile('image/svg+xml', 1024);
      const result = await processLogo(file);

      expect(result.success).toBe(true);
      expect(result.path).toMatch(/^\/uploads\/logos\/logo-\d+-[a-f0-9]+\.svg$/);
    });

    it('should return INVALID_FILE_TYPE error for unsupported MIME type', async () => {
      const file = createMockFile('image/gif', 1024);
      const result = await processLogo(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe(LOGO_ERROR_CODES.INVALID_FILE_TYPE);
      expect(mockedFs.writeFile).not.toHaveBeenCalled();
    });

    it('should return FILE_TOO_LARGE error for oversized files', async () => {
      const file = createMockFile('image/png', 3 * 1024 * 1024);
      const result = await processLogo(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe(LOGO_ERROR_CODES.FILE_TOO_LARGE);
      expect(mockedFs.writeFile).not.toHaveBeenCalled();
    });

    it('should return STORAGE_ERROR when write fails', async () => {
      mockedFs.writeFile.mockRejectedValue(new Error('Disk full'));
      const file = createMockFile('image/png', 1024);
      const result = await processLogo(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe(LOGO_ERROR_CODES.STORAGE_ERROR);
    });

    it('should return STORAGE_ERROR when mkdir fails', async () => {
      mockedFs.mkdir.mockRejectedValue(new Error('Permission denied'));
      const file = createMockFile('image/png', 1024);
      const result = await processLogo(file);

      expect(result.success).toBe(false);
      expect(result.error).toBe(LOGO_ERROR_CODES.STORAGE_ERROR);
    });
  });

  describe('deleteLogo', () => {
    beforeEach(() => {
      mockedFs.unlink.mockResolvedValue(undefined);
    });

    it('should successfully delete a logo file', async () => {
      const result = await deleteLogo('/uploads/logos/logo-123.png');
      expect(result).toBe(true);
      expect(mockedFs.unlink).toHaveBeenCalled();
    });

    it('should return false when path is empty', async () => {
      const result = await deleteLogo('');
      expect(result).toBe(false);
      expect(mockedFs.unlink).not.toHaveBeenCalled();
    });

    it('should return false when path is null/undefined', async () => {
      const result = await deleteLogo(null as unknown as string);
      expect(result).toBe(false);
      expect(mockedFs.unlink).not.toHaveBeenCalled();
    });

    it('should return false when file does not exist', async () => {
      mockedFs.unlink.mockRejectedValue(new Error('ENOENT'));
      const result = await deleteLogo('/uploads/logos/nonexistent.png');
      expect(result).toBe(false);
    });

    it('should handle deletion errors gracefully', async () => {
      mockedFs.unlink.mockRejectedValue(new Error('Permission denied'));
      const result = await deleteLogo('/uploads/logos/logo-123.png');
      expect(result).toBe(false);
    });

    it('should extract filename from full path', async () => {
      await deleteLogo('/uploads/logos/logo-123.png');
      const call = mockedFs.unlink.mock.calls[0];
      expect(call[0]).toContain('logo-123.png');
    });
  });

  describe('getLogoUrl', () => {
    it('should return path as-is if it starts with /uploads/', () => {
      const result = getLogoUrl('/uploads/logos/logo-123.png');
      expect(result).toBe('/uploads/logos/logo-123.png');
    });

    it('should return empty string for null/undefined path', () => {
      expect(getLogoUrl('')).toBe('');
      expect(getLogoUrl(null as unknown as string)).toBe('');
    });

    it('should construct URL from filename', () => {
      const result = getLogoUrl('logo-123.png');
      expect(result).toBe('/uploads/logos/logo-123.png');
    });

    it('should handle paths without leading slash', () => {
      const result = getLogoUrl('uploads/logos/logo-123.png');
      expect(result).toBe('/uploads/logos/logo-123.png');
    });
  });
});
