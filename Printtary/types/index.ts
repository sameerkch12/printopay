export type PrintColor = 'bw' | 'color';
export type PrintOrientation = 'portrait' | 'landscape';
export type PrintSides = 'single' | 'double';
export type PaperSize = 'A4' | 'A3' | 'Letter' | 'Legal';
export type PrintStatus = 'pending' | 'processing' | 'printing' | 'completed' | 'failed' | 'expired';

export interface PrintSettings {
  color: PrintColor;
  copies: number;
  pageRange: string;
  orientation: PrintOrientation;
  sides: PrintSides;
  paperSize: PaperSize;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uri: string;
  pages?: number;
  uploadedAt: Date;
  cloudinaryUrl?: string;
  expiresAt?: Date;
}

export interface PrintJob {
  id: string;
  jobNumber: string;
  shopId: string;
  shopName: string;
  shopAddress?: string;
  file: UploadedFile;
  settings: PrintSettings;
  otp: string;
  status: PrintStatus;
  createdAt: Date;
  updatedAt: Date;
  estimatedPages: number;
  estimatedPrice?: number;
  statusHistory: StatusEvent[];
}

export interface StatusEvent {
  status: PrintStatus;
  timestamp: Date;
  message: string;
}

export interface Shop {
  id: string;
  name: string;
  address: string;
  phone: string;
  photoUrl?: string;
  isActive: boolean;
  qrData: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  printRates?: {
    bwPerPage: number;
    colorPerPage: number;
  };
}

export interface UploadStep {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
}
