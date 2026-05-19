import { z } from 'zod';

export const createPrintJobSchema = z.object({
  body: z.object({
    documentId: z.string().min(1),
    shopId: z.string().min(1),
    userId: z.string().trim().optional(),
    settings: z.object({
      color: z.enum(['bw', 'color']),
      copies: z.number().int().min(1).max(50),
      pageRange: z.string().trim().default('All'),
      orientation: z.enum(['portrait', 'landscape']),
      sides: z.enum(['single', 'double']),
      paperSize: z.enum(['A4', 'A3', 'Letter', 'Legal']),
    }),
    estimatedPages: z.number().int().min(1).optional(),
  }),
});

export const getPrintJobSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const verifyPrintJobOtpSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    otp: z.string().regex(/^\d{4}$/, 'OTP must be 4 digits'),
  }),
});

export const verifyShopOtpSchema = z.object({
  body: z.object({
    otp: z.string().regex(/^\d{4}$/, 'OTP must be 4 digits'),
  }),
});

export const updatePrintJobStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(['processing', 'printing', 'completed', 'failed', 'expired']),
    message: z.string().trim().min(2).max(240).optional(),
  }),
});
