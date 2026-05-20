import { z } from 'zod';

const printSettingsSchema = z.object({
  color: z.enum(['bw', 'color']),
  copies: z.number().int().min(1).max(50),
  pageRange: z.string().trim().default('All'),
  orientation: z.enum(['portrait', 'landscape']),
  sides: z.enum(['single', 'double']),
  paperSize: z.enum(['A4', 'A3', 'Letter', 'Legal']),
});

export const createPrintJobSchema = z.object({
  body: z.object({
    documentId: z.string().min(1).optional(),
    documentIds: z.array(z.string().min(1)).min(1).max(10).optional(),
    shopId: z.string().min(1),
    userId: z.string().trim().optional(),
    settings: printSettingsSchema,
    documentSettings: z.array(z.object({
      documentId: z.string().min(1),
      fileId: z.string().trim().optional(),
      fileName: z.string().trim().optional(),
      pages: z.number().int().min(1).optional(),
      chargeablePages: z.number().int().min(1).optional(),
      estimatedPrice: z.number().min(0).optional(),
      settings: printSettingsSchema,
    })).max(10).optional(),
    usedDefaultSettings: z.boolean().optional().default(false),
    estimatedPages: z.number().int().min(1).optional(),
  }).refine((body) => Boolean(body.documentId || body.documentIds?.length), {
    message: 'At least one document is required',
    path: ['documentIds'],
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
    otp: z.string().regex(/^\d{4}$/, 'Print code must be 4 digits'),
  }),
});

export const verifyShopOtpSchema = z.object({
  body: z.object({
    otp: z.string().regex(/^\d{4}$/, 'Print code must be 4 digits'),
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
