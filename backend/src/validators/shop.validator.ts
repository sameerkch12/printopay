import { z } from 'zod';

export const createShopSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2),
    address: z.string().trim().min(5),
    phone: z.string().trim().min(8),
    qrCode: z.string().trim().min(3),
    approvalStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    printRates: z.object({
      bwPerPage: z.coerce.number().min(0).max(1000),
      colorPerPage: z.coerce.number().min(0).max(1000),
    }).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getShopSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const getShopByQrSchema = z.object({
  params: z.object({
    code: z.string().min(1),
  }),
});

export const updateShopApprovalSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    approvalStatus: z.enum(['pending', 'approved', 'rejected']),
  }),
});

export const updateMyShopSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).optional(),
    address: z.string().trim().min(5).optional(),
    phone: z.string().trim().min(8).optional(),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
    bwPerPage: z.coerce.number().min(0).max(1000).optional(),
    colorPerPage: z.coerce.number().min(0).max(1000).optional(),
  }),
});
