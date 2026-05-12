import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPEG, and SVG are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

const backupFileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname?.toLowerCase() || '');
  const validExts = ['.sql', '.gz', '.tar.gz'];
  const isValid = validExts.some(e => file.originalname?.toLowerCase().endsWith(e))
                  || ext === '.sql';
  if (isValid) cb(null, true);
  else cb(new Error('Invalid file type. Only .sql, .sql.gz, and .tar.gz files are allowed.'));
};

export const backupUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: backupFileFilter,
  limits: { fileSize: 500 * 1024 * 1024 },
});
