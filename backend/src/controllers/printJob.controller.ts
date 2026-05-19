import crypto from 'crypto';
import { Request, Response } from 'express';
import { HydratedDocument, InferSchemaType } from 'mongoose';
import { DocumentAsset } from '../models/DocumentAsset';
import { PrintJob } from '../models/PrintJob';
import { Shop } from '../models/Shop';
import { signPrintAccessToken, verifyPrintAccessToken } from '../services/auth.service';
import { buildSignedDocumentUrl, isLocalDocumentPublicId, readLocalDocument } from '../services/cloudinary.service';
import { emitRealtime } from '../services/realtime.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { generateJobNumber, generateOtp } from '../utils/otp';

function hashOtp(otp: string) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

type PrintJobModelDocument = HydratedDocument<InferSchemaType<typeof PrintJob.schema>>;

function getStatusMessage(status: string) {
  const messages: Record<string, string> = {
    processing: 'OTP verified, preparing document',
    printing: 'Printing started',
    completed: 'Print completed',
    failed: 'Print job failed',
    expired: 'Print job expired',
  };

  return messages[status] ?? 'Status updated';
}

function getShopId(printJob: { shop: unknown }) {
  const shop = printJob.shop as { _id?: unknown } | string;
  return String(typeof shop === 'object' && shop !== null && '_id' in shop ? shop._id : shop);
}

function withoutOtpHash(printJob: { toObject: () => Record<string, unknown> }) {
  const safePrintJob = printJob.toObject();
  delete safePrintJob.otpHash;
  return safePrintJob;
}

function buildPrintDocumentUrl(req: Request, jobId: string, shopId: string) {
  const token = signPrintAccessToken({ jobId, shopId });
  const origin = `${req.protocol}://${req.get('host')}`;
  return `${origin}${req.baseUrl}/${jobId}/print-document?token=${encodeURIComponent(token)}`;
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^\w.\- ()]/g, '_');
}

async function completePrintJobWithOtp(req: Request, printJob: PrintJobModelDocument | null, otp: string) {
  if (!printJob) {
    throw new ApiError(404, 'No pending document found for this OTP');
  }

  if (!req.auth?.shopId || getShopId(printJob) !== req.auth.shopId) {
    throw new ApiError(404, 'No pending document found for this OTP');
  }

  const document = printJob.document as unknown as { expiresAt?: Date };
  const expiresAt = document.expiresAt ?? printJob.otpExpiresAt;

  if (expiresAt.getTime() <= Date.now()) {
    printJob.status = 'expired';
    printJob.statusHistory.push({
      status: 'expired',
      message: 'Document expired before verification',
      at: new Date(),
    });
    await printJob.save();
    throw new ApiError(410, 'Document has expired');
  }

  if (printJob.otpHash !== hashOtp(otp)) {
    throw new ApiError(401, 'Invalid OTP');
  }

  if (printJob.status === 'pending') {
    printJob.status = 'processing';
    printJob.statusHistory.push({
      status: 'processing',
      message: 'OTP verified, preparing document',
      at: new Date(),
    });
    await printJob.save();
    emitRealtime('print-jobs:changed', {
      jobId: String(printJob._id),
      shopId: getShopId(printJob),
      status: printJob.status,
      reason: 'otp-verified',
    });
  }

  return printJob;
}

export const createPrintJob = asyncHandler(async (req: Request, res: Response) => {
  const { documentId, shopId, userId, settings, estimatedPages } = req.body;

  const [document, shop] = await Promise.all([
    DocumentAsset.findById(documentId),
    Shop.findById(shopId),
  ]);

  if (!document || document.deletedAt) {
    throw new ApiError(404, 'Document not found');
  }

  if (document.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(410, 'Document has expired');
  }

  if (!shop || !shop.isActive || shop.approvalStatus !== 'approved') {
    throw new ApiError(404, 'Active shop not found');
  }

  const otp = generateOtp();
  const otpExpiresAt = document.expiresAt;

  const printJob = await PrintJob.create({
    jobNumber: generateJobNumber(),
    document: document._id,
    shop: shop._id,
    userId,
    settings,
    otpHash: hashOtp(otp),
    otpExpiresAt,
    estimatedPages: estimatedPages ?? 1,
    statusHistory: [
      {
        status: 'pending',
        message: 'Upload received, awaiting OTP verification at shop',
      },
    ],
  });
  emitRealtime('print-jobs:changed', {
    jobId: String(printJob._id),
    shopId: String(shop._id),
    status: printJob.status,
    reason: 'created',
  });

  return sendSuccess(
    res,
    {
      printJob: withoutOtpHash(printJob),
      otp,
      otpExpiresAt,
    },
    201
  );
});

export const listShopPrintJobs = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth?.shopId) {
    throw new ApiError(403, 'Shop access required');
  }

  const jobs = await PrintJob.find({ shop: req.auth.shopId })
    .select('-otpHash')
    .populate('document')
    .populate('shop')
    .sort({ createdAt: -1 })
    .limit(100);

  return sendSuccess(res, jobs);
});

export const getPrintJob = asyncHandler(async (req: Request, res: Response) => {
  const printJob = await PrintJob.findById(req.params.id)
    .select('-otpHash')
    .populate('document')
    .populate('shop');

  if (!printJob) {
    throw new ApiError(404, 'Print job not found');
  }

  if (req.auth?.role === 'shop_owner' && getShopId(printJob) !== req.auth.shopId) {
    throw new ApiError(404, 'Print job not found');
  }

  return sendSuccess(res, printJob);
});

export const getPublicPrintJobStatus = asyncHandler(async (req: Request, res: Response) => {
  const printJob = await PrintJob.findById(req.params.id)
    .select('-otpHash')
    .populate('document')
    .populate('shop');

  if (!printJob) {
    throw new ApiError(404, 'Print job not found');
  }

  const document = printJob.document as unknown as {
    _id: unknown;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    expiresAt: Date;
  };
  const shop = printJob.shop as unknown as {
    _id: unknown;
    name: string;
    address: string;
    phone: string;
    qrCode: string;
    isActive: boolean;
  };

  return sendSuccess(res, {
    _id: printJob._id,
    jobNumber: printJob.jobNumber,
    status: printJob.status,
    settings: printJob.settings,
    estimatedPages: printJob.estimatedPages,
    otpExpiresAt: printJob.otpExpiresAt,
    createdAt: printJob.createdAt,
    updatedAt: printJob.updatedAt,
    statusHistory: printJob.statusHistory,
    document: {
      _id: document._id,
      originalName: document.originalName,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      expiresAt: document.expiresAt,
    },
    shop: {
      _id: shop._id,
      name: shop.name,
      address: shop.address,
      phone: shop.phone,
      qrCode: shop.qrCode,
      isActive: shop.isActive,
    },
  });
});

export const verifyPrintJobOtp = asyncHandler(async (req: Request, res: Response) => {
  const printJob = await PrintJob.findById(req.params.id).select('+otpHash').populate('document');
  const completedJob = await completePrintJobWithOtp(req, printJob, req.body.otp);

  const document = completedJob.document as unknown as { publicId: string };

  return sendSuccess(res, {
    printJob: completedJob,
    signedUrl: buildSignedDocumentUrl(document.publicId),
    printUrl: buildPrintDocumentUrl(req, String(completedJob._id), req.auth?.shopId ?? ''),
  });
});

export const verifyShopPrintOtp = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth?.shopId) {
    throw new ApiError(403, 'Shop access required');
  }

  const otpHash = hashOtp(req.body.otp);
  const printJob = await PrintJob.findOne({
    shop: req.auth.shopId,
    status: { $in: ['pending', 'processing', 'printing', 'completed'] },
    otpHash,
  })
    .select('+otpHash')
    .populate('document');

  const completedJob = await completePrintJobWithOtp(req, printJob, req.body.otp);
  const document = completedJob.document as unknown as { publicId: string };

  return sendSuccess(res, {
    printJob: completedJob,
    signedUrl: buildSignedDocumentUrl(document.publicId),
    printUrl: buildPrintDocumentUrl(req, String(completedJob._id), req.auth.shopId),
  });
});

export const getPrintableDocument = asyncHandler(async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!token) {
    throw new ApiError(401, 'Print token required');
  }

  const payload = verifyPrintAccessToken(token);
  if (payload.purpose !== 'print-document' || payload.jobId !== req.params.id) {
    throw new ApiError(401, 'Invalid print token');
  }

  const printJob = await PrintJob.findById(req.params.id).select('-otpHash').populate('document');
  if (!printJob || getShopId(printJob) !== payload.shopId || printJob.status === 'pending') {
    throw new ApiError(404, 'Print document not found');
  }

  const document = printJob.document as unknown as {
    publicId: string;
    mimeType: string;
    originalName: string;
    expiresAt: Date;
  };

  if (document.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(410, 'Document has expired');
  }

  const buffer = isLocalDocumentPublicId(document.publicId)
    ? await readLocalDocument(document.publicId)
    : Buffer.from(await (async () => {
      const signedUrl = buildSignedDocumentUrl(document.publicId);
      const upstream = await fetch(signedUrl);
      if (!upstream.ok) {
        throw new ApiError(502, 'Could not load printable document');
      }
      return upstream.arrayBuffer();
    })());

  res.removeHeader('Content-Security-Policy');
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('Content-Length', buffer.length);
  res.setHeader('Content-Disposition', `inline; filename="${safeFileName(document.originalName)}"`);
  res.setHeader('Cache-Control', 'no-store');

  return res.send(buffer);
});

export const updatePrintJobStatus = asyncHandler(async (req: Request, res: Response) => {
  const query: Record<string, string> = { _id: String(req.params.id) };
  if (req.auth?.role === 'shop_owner') {
    if (!req.auth.shopId) {
      throw new ApiError(403, 'Shop access required');
    }
    query.shop = req.auth.shopId;
  }

  const printJob = await PrintJob.findOne(query).select('-otpHash');

  if (!printJob) {
    throw new ApiError(404, 'Print job not found');
  }

  const status = String(req.body.status);
  const message = typeof req.body.message === 'string' ? req.body.message : undefined;

  printJob.status = status as typeof printJob.status;
  printJob.statusHistory.push({
    status: status as typeof printJob.status,
    message: message ?? getStatusMessage(status),
    at: new Date(),
  });

  await printJob.save();
  emitRealtime('print-jobs:changed', {
    jobId: String(printJob._id),
    shopId: getShopId(printJob),
    status: printJob.status,
    reason: 'status-updated',
  });

  return sendSuccess(res, printJob);
});
