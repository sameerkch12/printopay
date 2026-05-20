import { DocumentPrintSettings, PrintJob, PrintSettings, UploadedFile, Shop, PrintStatus } from '@/types';
import { APP_CONFIG } from '@/constants/config';
import { getApiBaseUrl } from './apiConfig';
// Print-ready conversion is intentionally disabled for now.
// Customer uploads the original file, and the shop owner sees the requested settings before printing.
// import { preparePrintReadyDocument } from './printReadyDocument';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

type BackendShop = {
  _id: string;
  name: string;
  address: string;
  phone: string;
  photoUrl?: string;
  isActive: boolean;
  qrCode: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  printRates?: {
    bwPerPage: number;
    colorPerPage: number;
  };
};

type BackendDocument = {
  _id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  secureUrl: string;
  expiresAt: string;
};

type BackendPrintJob = {
  _id: string;
  jobNumber: string;
  status: PrintStatus;
  document?: BackendDocument;
  documents?: BackendDocument[];
  shop?: BackendShop;
  settings?: PrintSettings;
  documentSettings?: DocumentPrintSettings[];
  usedDefaultSettings?: boolean;
  estimatedPrice?: number;
  estimatedPages: number;
  createdAt: string;
  updatedAt: string;
  otpExpiresAt: string;
  statusHistory?: Array<{
    status: PrintStatus;
    message: string;
    at: string;
  }>;
};

async function request<T>(path: string, init?: RequestInit) {
  const res = await fetch(`${getApiBaseUrl()}${path}`, init);
  const payload = (await res.json()) as ApiResponse<T>;

  if (!res.ok || !payload.success) {
    throw new Error(payload.message ?? 'Request failed');
  }

  return payload.data;
}

function normalizeShop(shop: BackendShop): Shop {
  return {
    id: shop._id,
    name: shop.name,
    address: shop.address,
    phone: shop.phone,
    photoUrl: shop.photoUrl,
    isActive: shop.isActive,
    qrData: shop.qrCode,
    latitude: shop.latitude,
    longitude: shop.longitude,
    distanceKm: shop.distanceKm,
    printRates: shop.printRates ?? DEFAULT_PRINT_RATES,
  };
}

export const DEFAULT_PRINT_RATES = {
  bwPerPage: 2,
  colorPerPage: 10,
};

const maxUploadBytes = APP_CONFIG.maxFileSizeMB * 1024 * 1024;

export function getShopPrintRate(shop: Shop | null | undefined, color: PrintSettings['color']) {
  const rates = shop?.printRates ?? DEFAULT_PRINT_RATES;
  return color === 'color' ? rates.colorPerPage : rates.bwPerPage;
}

export function calculatePrintPrice(shop: Shop | null | undefined, settings: PrintSettings, chargeablePages: number) {
  return Math.max(0, chargeablePages * getShopPrintRate(shop, settings.color));
}

function pageCountForSettings(settings: PrintSettings, pages: number) {
  return Math.max(1, Math.ceil(pages * settings.copies * (settings.sides === 'double' ? 0.5 : 1)));
}

function estimatePrintPrice(shop: Shop | null | undefined, settings: PrintSettings, pages: number, documentSettings?: DocumentPrintSettings[]) {
  if (!documentSettings?.length) {
    return calculatePrintPrice(shop, settings, pages);
  }

  return documentSettings.reduce((total, item) => {
    const itemPages = item.chargeablePages ?? pageCountForSettings(item.settings, item.pages ?? 1);
    return total + calculatePrintPrice(shop, item.settings, itemPages);
  }, 0);
}

function normalizePrintJob(job: BackendPrintJob, fallback?: {
  file?: UploadedFile;
  files?: UploadedFile[];
  settings?: PrintSettings;
  documentSettings?: DocumentPrintSettings[];
  usedDefaultSettings?: boolean;
  shopId?: string;
  shop?: Shop | null;
  otp?: string;
}): PrintJob {
  const document = job.document;
  const documents = job.documents?.length ? job.documents : document ? [document] : [];
  const shop = job.shop ? normalizeShop(job.shop) : fallback?.shop;
  const settings = job.settings ?? fallback?.settings;

  if (!settings) {
    throw new Error('Print job settings are missing');
  }

  return {
    id: job._id,
    jobNumber: job.jobNumber,
    shopId: shop?.id ?? fallback?.shopId ?? '',
    shopName: shop?.name ?? 'Selected Shop',
    shopAddress: shop?.address,
    file: {
      ...(fallback?.file ?? {
        id: document?._id ?? '',
        name: document?.originalName ?? 'Document',
        size: document?.sizeBytes ?? 0,
        type: document?.mimeType ?? 'application/pdf',
        uri: '',
        uploadedAt: new Date(job.createdAt),
      }),
      id: document?._id ?? fallback?.file?.id ?? '',
      name: document?.originalName ?? fallback?.file?.name ?? 'Document',
      size: document?.sizeBytes ?? fallback?.file?.size ?? 0,
      type: document?.mimeType ?? fallback?.file?.type ?? 'application/pdf',
      cloudinaryUrl: fallback?.file?.cloudinaryUrl,
      uploadedAt: new Date(job.createdAt),
      expiresAt: document?.expiresAt ? new Date(document.expiresAt) : fallback?.file?.expiresAt,
    },
    files: documents.length
      ? documents.map((item) => ({
        ...(fallback?.files?.find((file) => file.id === item._id || file.name === item.originalName) ?? {
          id: item._id,
          name: item.originalName,
          size: item.sizeBytes,
          type: item.mimeType,
          uri: '',
          uploadedAt: new Date(job.createdAt),
        }),
        id: item._id,
        name: item.originalName,
        size: item.sizeBytes,
        type: item.mimeType,
        uploadedAt: new Date(job.createdAt),
        expiresAt: item.expiresAt ? new Date(item.expiresAt) : undefined,
      }))
      : fallback?.files,
    settings,
    documentSettings: job.documentSettings ?? fallback?.documentSettings,
    usedDefaultSettings: job.usedDefaultSettings ?? fallback?.usedDefaultSettings ?? false,
    otp: fallback?.otp ?? '',
    status: job.status,
    createdAt: new Date(job.createdAt),
    updatedAt: new Date(job.updatedAt),
    estimatedPages: job.estimatedPages,
    estimatedPrice: typeof job.estimatedPrice === 'number'
      ? job.estimatedPrice
      : shop && settings
        ? estimatePrintPrice(shop, settings, job.estimatedPages, job.documentSettings ?? fallback?.documentSettings)
        : undefined,
    statusHistory: (job.statusHistory?.length ? job.statusHistory : [
      {
        status: job.status,
        message: 'Status updated',
        at: job.updatedAt,
      },
    ]).map((event) => ({
      status: event.status,
      timestamp: new Date(event.at),
      message: event.message,
    })),
  };
}

export async function fetchShopDetails(shopCode: string): Promise<Shop | null> {
  try {
    const code = extractShopCode(shopCode);
    const isShopId = /^[a-f\d]{24}$/i.test(code);
    const path = isShopId ? `/shops/${code}` : `/shops/qr/${encodeURIComponent(code)}`;
    const shop = await request<BackendShop>(path);
    return normalizeShop(shop);
  } catch {
    return null;
  }
}

function extractShopCode(input: string): string {
  const code = input.trim();

  try {
    const url = new URL(code);
    const shopFromQuery = url.searchParams.get('shop') ?? url.searchParams.get('shopId');
    if (shopFromQuery) return shopFromQuery.trim();

    const parts = url.pathname.split('/').filter(Boolean);
    const shopIndex = parts.findIndex((part) => part === 'shop' || part === 'shops');
    if (shopIndex >= 0 && parts[shopIndex + 1]) {
      return parts[shopIndex + 1].trim();
    }
  } catch {
    // Not a URL; fall through to scheme/string cleanup.
  }

  return code
    .replace(/^printopay:\/\/shop\//i, '')
    .replace(/^printsecure:\/\/shop\//i, '')
    .replace(/^printtary:\/\/shop\//i, '')
    .replace(/^\/?shop\//i, '')
    .trim();
}

export async function fetchAllShops(location?: { latitude: number; longitude: number }): Promise<Shop[]> {
  const query = location ? `?lat=${encodeURIComponent(location.latitude)}&lng=${encodeURIComponent(location.longitude)}` : '';
  const shops = await request<BackendShop[]>(`/shops${query}`);
  return shops.map(normalizeShop);
}

async function createUploadForm(file: UploadedFile) {
  const form = new FormData();
  const isWebBlob = file.uri.startsWith('blob:') || file.uri.startsWith('data:') || file.uri.startsWith('http');

  if (isWebBlob) {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    const uploadBlob = blob.type ? blob : blob.slice(0, blob.size, file.type || 'application/pdf');
    form.append('file', uploadBlob, file.name);
  } else {
    form.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type || 'application/pdf',
    } as unknown as Blob);
  }

  return form;
}

export async function uploadDocument(
  file: UploadedFile | UploadedFile[],
  settings: PrintSettings,
  shopId: string,
  usedDefaultSettings = false,
  documentSettings?: DocumentPrintSettings[],
  onProgress?: (progress: number) => void
): Promise<PrintJob> {
  onProgress?.(10);
  const uploadFiles = Array.isArray(file) ? file : [file];
  if (uploadFiles.length > 10) {
    throw new Error('You can upload up to 10 files in one print job.');
  }
  // const uploadFile = await preparePrintReadyDocument(file, settings);
  if (uploadFiles.some((uploadFile) => uploadFile.size > maxUploadBytes)) {
    throw new Error(`File must be ${APP_CONFIG.maxFileSizeMB}MB or smaller.`);
  }
  onProgress?.(35);

  const uploadedDocuments: BackendDocument[] = [];
  for (const [index, uploadFile] of uploadFiles.entries()) {
    const uploadData = await request<{ document: BackendDocument }>('/documents/upload', {
      method: 'POST',
      body: await createUploadForm(uploadFile),
    });
    uploadedDocuments.push(uploadData.document);
    onProgress?.(35 + Math.round(((index + 1) / uploadFiles.length) * 25));
  }
  onProgress?.(60);

  const estimatedPages = Math.max(
    1,
    Math.ceil(uploadFiles.reduce((total, uploadFile, index) => {
      const fileSettings = documentSettings?.[index]?.settings ?? settings;
      return total + pageCountForSettings(fileSettings, uploadFile.pages || 1);
    }, 0))
  );
  const uploadedDocumentSettings = uploadedDocuments.map((document, index) => ({
    documentId: document._id,
    fileId: uploadFiles[index]?.id,
    fileName: document.originalName,
    pages: documentSettings?.[index]?.pages ?? uploadFiles[index]?.pages ?? 1,
    chargeablePages: documentSettings?.[index]?.chargeablePages,
    estimatedPrice: documentSettings?.[index]?.estimatedPrice,
    settings: documentSettings?.[index]?.settings ?? settings,
  }));

  const jobData = await request<{ printJob: BackendPrintJob; otp: string; otpExpiresAt: string }>('/print-jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentIds: uploadedDocuments.map((document) => document._id),
      shopId,
      settings,
      documentSettings: uploadedDocumentSettings,
      usedDefaultSettings,
      estimatedPages,
    }),
  });

  onProgress?.(100);

  const shop = await fetchShopDetails(shopId);

  return normalizePrintJob(jobData.printJob, {
    shopId,
    shop,
    settings,
    documentSettings: uploadedDocumentSettings,
    usedDefaultSettings,
    otp: jobData.otp,
    files: uploadedDocuments.map((document, index) => ({
      ...uploadFiles[index],
      id: document._id,
      name: document.originalName,
      size: document.sizeBytes,
      type: document.mimeType,
      uploadedAt: new Date(jobData.printJob.createdAt),
      expiresAt: new Date(document.expiresAt),
    })),
    file: {
      ...uploadFiles[0],
      id: uploadedDocuments[0]._id,
      name: uploadFiles.length > 1 ? `${uploadFiles.length} files` : uploadedDocuments[0].originalName,
      size: uploadedDocuments.reduce((total, document) => total + document.sizeBytes, 0),
      type: uploadFiles.length > 1 ? 'multiple/files' : uploadedDocuments[0].mimeType,
      uploadedAt: new Date(jobData.printJob.createdAt),
      expiresAt: new Date(uploadedDocuments[0].expiresAt),
    },
  });
}

export async function fetchJobStatus(jobId: string): Promise<PrintJob | null> {
  try {
    const job = await request<BackendPrintJob>(`/print-jobs/${jobId}/status`);
    return normalizePrintJob(job);
  } catch {
    return null;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTimeLeft(expiresAt: Date): string {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function getStatusColor(status: string): string {
  return status === 'pending' ? '#f59e0b' : '#22c55e';
}

export function getStatusLabel(status: string): string {
  return status === 'pending' ? 'Pending' : 'Successful Print';
}
