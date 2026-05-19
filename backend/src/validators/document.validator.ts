import { z } from 'zod';

export const signedDocumentUrlSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
