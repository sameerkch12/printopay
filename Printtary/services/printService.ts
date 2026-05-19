import { PrintJob, PrintSettings, UploadedFile, Shop, PrintStatus } from '@/types';
import { APP_CONFIG } from '@/constants/config';
// Print-ready conversion is intentionally disabled for now.
// Customer uploads the original file, and the shop owner sees the requested settings before printing.
// import { preparePrintReadyDocument } from './printReadyDocument';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api/v1';

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
  shop?: BackendShop;
  settings?: PrintSettings;
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
  const res = await fetch(`${API_BASE_URL}${path}`, init);
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

function normalizePrintJob(job: BackendPrintJob, fallback?: {
  file?: UploadedFile;
  settings?: PrintSettings;
  shopId?: string;
  shop?: Shop | null;
  otp?: string;
}): PrintJob {
  const document = job.document;
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
    settings,
    otp: fallback?.otp ?? '',
    status: job.status,
    createdAt: new Date(job.createdAt),
    updatedAt: new Date(job.updatedAt),
    estimatedPages: job.estimatedPages,
    estimatedPrice: fallback?.shop && settings
      ? calculatePrintPrice(fallback.shop, settings, job.estimatedPages)
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
  file: UploadedFile,
  settings: PrintSettings,
  shopId: string,
  onProgress?: (progress: number) => void
): Promise<PrintJob> {
  onProgress?.(10);
  const uploadFile = file;
  // const uploadFile = await preparePrintReadyDocument(file, settings);
  if (uploadFile.size > maxUploadBytes) {
    throw new Error(`File must be ${APP_CONFIG.maxFileSizeMB}MB or smaller.`);
  }
  onProgress?.(35);

  const uploadData = await request<{ document: BackendDocument; signedUrl: string }>('/documents/upload', {
    method: 'POST',
    body: await createUploadForm(uploadFile),
  });
  onProgress?.(60);

  const estimatedPages = Math.max(
    1,
    Math.ceil((file.pages || 1) * settings.copies * (settings.sides === 'double' ? 0.5 : 1))
  );

  const jobData = await request<{ printJob: BackendPrintJob; otp: string; otpExpiresAt: string }>('/print-jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentId: uploadData.document._id,
      shopId,
      settings,
      estimatedPages,
    }),
  });

  onProgress?.(100);

  const shop = await fetchShopDetails(shopId);

  return normalizePrintJob(jobData.printJob, {
    shopId,
    shop,
    settings,
    otp: jobData.otp,
    file: {
      ...uploadFile,
      id: uploadData.document._id,
      name: uploadData.document.originalName,
      size: uploadData.document.sizeBytes,
      type: uploadData.document.mimeType,
      cloudinaryUrl: uploadData.signedUrl,
      uploadedAt: new Date(jobData.printJob.createdAt),
      expiresAt: new Date(uploadData.document.expiresAt),
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
