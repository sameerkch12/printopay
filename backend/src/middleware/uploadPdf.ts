import multer from 'multer';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const allowedExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);

function hasAllowedExtension(fileName: string) {
  const lower = fileName.toLowerCase();
  return Array.from(allowedExtensions).some((extension) => lower.endsWith(extension));
}

export const uploadPdf = multer({
  storage,
  limits: {
    fileSize: env.MAX_UPLOAD_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const isAllowed = allowedMimeTypes.has(file.mimetype) || hasAllowedExtension(file.originalname);
    if (!isAllowed) {
      cb(new ApiError(415, 'Only PDF, JPG, PNG, WEBP, HEIC, and HEIF uploads are supported'));
      return;
    }

    cb(null, true);
  },
});

export const uploadShopPhoto = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new ApiError(415, 'Only image uploads are supported for shop photos'));
      return;
    }

    cb(null, true);
  },
});
