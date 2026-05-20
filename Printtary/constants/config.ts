export const APP_CONFIG = {
  name: 'PrintoPay',
  tagline: 'Print Without Sharing on WhatsApp',
  version: '1.0.0',
  otpExpiry: 15, // minutes
  fileExpiry: 24, // hours
  maxFileSizeMB: 50,
  supportedFormats: ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'],
};

export const PRINT_CONFIG = {
  paperSizes: ['A4', 'A3', 'Letter', 'Legal'],
  defaultPaperSize: 'A4',
  maxCopies: 50,
  defaultCopies: 1,
  defaultSettings: {
    color: 'color',
    copies: 1,
    pageRange: 'All',
    orientation: 'portrait',
    sides: 'single',
    paperSize: 'A4',
  },
};

export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    pages: 1000,
    color: '#6366f1',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    pages: 1000,
    color: '#a855f7',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 199,
    pages: 2000,
    color: '#f59e0b',
  },
];
