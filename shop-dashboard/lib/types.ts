export type PrintStatus = 'pending' | 'processing' | 'printing' | 'completed' | 'failed' | 'expired';

export type PrintJob = {
  id: string;
  jobNumber: string;
  customerName: string;
  fileName: string;
  fileSize: string;
  pages: number;
  copies: number;
  color: 'bw' | 'color';
  paperSize: string;
  sides: 'single' | 'double';
  status: PrintStatus;
  createdAt: string;
  otpExpiresAt: string;
};

export type ShopProfile = {
  name: string;
  address: string;
  phone: string;
  qrCode: string;
};
