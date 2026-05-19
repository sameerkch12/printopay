import { UploadApiResponse } from 'cloudinary';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { cloudinary } from '../config/cloudinary';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const uploadTimeoutMs = 120_000;
const localUploadDir = path.resolve(process.cwd(), 'uploads', 'documents');
const localPublicIdPrefix = 'local/';

function toUploadError(error: unknown, fallback: string) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'TimeoutError'
  ) {
    return new ApiError(504, 'Upload timed out. Please try again on a stronger network or with a smaller file.');
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(fallback);
}

function uploadToCloudinary(file: Express.Multer.File): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: env.CLOUDINARY_UPLOAD_FOLDER,
        resource_type: 'raw',
        type: 'authenticated',
        use_filename: true,
        unique_filename: true,
        overwrite: false,
        timeout: uploadTimeoutMs,
      },
      (error, result) => {
        if (error || !result) {
          reject(toUploadError(error, 'Cloudinary upload failed'));
          return;
        }

        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
}

function extensionFromFile(file: Express.Multer.File) {
  const fromName = path.extname(file.originalname).replace('.', '').toLowerCase();
  if (fromName) return fromName;

  const fromMime = file.mimetype.split('/')[1]?.toLowerCase();
  return fromMime || 'file';
}

async function saveLocalDocument(file: Express.Multer.File): Promise<UploadApiResponse> {
  await fs.mkdir(localUploadDir, { recursive: true });
  const extension = extensionFromFile(file);
  const fileName = `${crypto.randomUUID()}.${extension}`;
  const publicId = `${localPublicIdPrefix}${fileName}`;
  const filePath = path.join(localUploadDir, fileName);

  await fs.writeFile(filePath, file.buffer);

  return {
    public_id: publicId,
    asset_id: `local-${fileName}`,
    secure_url: `/api/v1/documents/local/${encodeURIComponent(fileName)}`,
    resource_type: 'raw',
    format: extension,
    bytes: file.size,
  } as unknown as UploadApiResponse;
}

export function isLocalDocumentPublicId(publicId: string) {
  return publicId.startsWith(localPublicIdPrefix);
}

export async function readLocalDocument(publicId: string) {
  if (!isLocalDocumentPublicId(publicId)) {
    throw new ApiError(404, 'Local document not found');
  }

  const fileName = publicId.slice(localPublicIdPrefix.length);
  const filePath = path.resolve(localUploadDir, fileName);
  if (!filePath.startsWith(localUploadDir + path.sep)) {
    throw new ApiError(400, 'Invalid local document path');
  }

  return fs.readFile(filePath);
}

export async function uploadPdfToCloudinary(file: Express.Multer.File): Promise<UploadApiResponse> {
  try {
    return await uploadToCloudinary(file);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 504 && env.NODE_ENV !== 'production') {
      console.warn('Cloudinary upload timed out; using local development file storage fallback.');
      return saveLocalDocument(file);
    }

    throw error;
  }
}

export function uploadShopPhotoToCloudinary(file: Express.Multer.File, shopId: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'printtary/shops',
        public_id: shopId,
        resource_type: 'image',
        overwrite: true,
        unique_filename: false,
        timeout: uploadTimeoutMs,
      },
      (error, result) => {
        if (error || !result) {
          reject(toUploadError(error, 'Cloudinary shop photo upload failed'));
          return;
        }

        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
}

export function buildSignedDocumentUrl(publicId: string, expiresInSeconds = env.SIGNED_URL_EXPIRES_SECONDS) {
  if (isLocalDocumentPublicId(publicId)) {
    const fileName = publicId.slice(localPublicIdPrefix.length);
    return `/api/v1/documents/local/${encodeURIComponent(fileName)}`;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'authenticated',
    sign_url: true,
    expires_at: expiresAt,
  });
}
