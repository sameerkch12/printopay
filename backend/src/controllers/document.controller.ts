import { Request, Response } from 'express';
import { env } from '../config/env';
import { DocumentAsset } from '../models/DocumentAsset';
import { uploadPdfToCloudinary, buildSignedDocumentUrl, readLocalDocument } from '../services/cloudinary.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

const fileExpiryMs = 24 * 60 * 60 * 1000;

function absoluteUrl(req: Request, value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `${req.protocol}://${req.get('host')}${value}`;
}

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new ApiError(400, 'Document or image file is required. Use multipart field name "file".');
  }

  const result = await uploadPdfToCloudinary(req.file);
  const expiresAt = new Date(Date.now() + fileExpiryMs);

  const document = await DocumentAsset.create({
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    sizeBytes: req.file.size,
    publicId: result.public_id,
    cloudinaryAssetId: result.asset_id,
    secureUrl: result.secure_url,
    resourceType: result.resource_type,
    format: result.format ?? req.file.originalname.split('.').pop()?.toLowerCase() ?? 'file',
    uploadedBy: typeof req.body.uploadedBy === 'string' ? req.body.uploadedBy : undefined,
    expiresAt,
  });

  const signedUrl = absoluteUrl(req, buildSignedDocumentUrl(document.publicId));

  return sendSuccess(
    res,
    {
      document,
      signedUrl,
    },
    201
  );
});

export const getSignedDocumentUrl = asyncHandler(async (req: Request, res: Response) => {
  const document = await DocumentAsset.findById(req.params.id);

  if (!document || document.deletedAt) {
    throw new ApiError(404, 'Document not found');
  }

  if (document.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(410, 'Document has expired');
  }

  return sendSuccess(res, {
    signedUrl: absoluteUrl(req, buildSignedDocumentUrl(document.publicId)),
    expiresInSeconds: env.SIGNED_URL_EXPIRES_SECONDS,
  });
});

export const getLocalDocument = asyncHandler(async (req: Request, res: Response) => {
  const fileName = req.params.fileName;
  const document = await DocumentAsset.findOne({ publicId: `local/${fileName}` });

  if (!document || document.deletedAt) {
    throw new ApiError(404, 'Document not found');
  }

  if (document.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(410, 'Document has expired');
  }

  const buffer = await readLocalDocument(document.publicId);
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Content-Disposition', `inline; filename="${document.originalName.replace(/[^\w.\- ()]/g, '_')}"`);
  res.setHeader('Cache-Control', 'no-store');

  return res.send(buffer);
});
