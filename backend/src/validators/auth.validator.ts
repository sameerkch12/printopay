import { z } from 'zod';

const passwordSchema = z.string().min(8).max(128);

export const registerShopOwnerSchema = z.object({
  body: z.object({
    ownerName: z.string().trim().min(2),
    email: z.string().trim().email().toLowerCase(),
    phone: z.string().trim().min(8),
    password: passwordSchema,
    shop: z.object({
      name: z.string().trim().min(2),
      address: z.string().trim().min(5),
      phone: z.string().trim().min(8),
      latitude: z.coerce.number().min(-90).max(90).optional(),
      longitude: z.coerce.number().min(-180).max(180).optional(),
      printRates: z.object({
        bwPerPage: z.coerce.number().min(0).max(1000),
        colorPerPage: z.coerce.number().min(0).max(1000),
      }).optional(),
    }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email().toLowerCase(),
    password: z.string().min(1),
  }),
});

export const setupAdminSchema = z.object({
  body: z.object({
    setupKey: z.string().min(1),
    name: z.string().trim().min(2),
    email: z.string().trim().email().toLowerCase(),
    phone: z.string().trim().optional(),
    password: passwordSchema,
  }),
});
