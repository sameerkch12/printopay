import { z } from 'zod';

export const clientErrorLogSchema = z.object({
  body: z.object({
    source: z.enum(['customer_app', 'shop_dashboard']),
    severity: z.enum(['info', 'warning', 'error', 'fatal']).optional(),
    message: z.string().trim().min(1).max(2000),
    stack: z.string().max(8000).optional(),
    path: z.string().trim().max(1000).optional(),
    metadata: z.unknown().optional(),
    user: z.object({
      id: z.string().trim().max(200).optional(),
      name: z.string().trim().max(200).optional(),
      email: z.string().trim().email().max(320).optional(),
      role: z.string().trim().max(80).optional(),
      shopId: z.string().trim().max(200).optional(),
    }).optional(),
  }),
});
