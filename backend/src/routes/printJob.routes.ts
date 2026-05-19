import { Router } from 'express';
import {
  createPrintJob,
  getPrintableDocument,
  getPublicPrintJobStatus,
  getPrintJob,
  listShopPrintJobs,
  updatePrintJobStatus,
  verifyPrintJobOtp,
  verifyShopPrintOtp,
} from '../controllers/printJob.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createPrintJobSchema,
  getPrintJobSchema,
  updatePrintJobStatusSchema,
  verifyPrintJobOtpSchema,
  verifyShopOtpSchema,
} from '../validators/printJob.validator';

export const printJobRouter = Router();

printJobRouter.post('/', validate(createPrintJobSchema), createPrintJob);
printJobRouter.get('/shop/mine', requireAuth, requireRole('shop_owner'), listShopPrintJobs);
printJobRouter.post('/verify-otp', requireAuth, requireRole('shop_owner'), validate(verifyShopOtpSchema), verifyShopPrintOtp);
printJobRouter.get('/:id/status', validate(getPrintJobSchema), getPublicPrintJobStatus);
printJobRouter.get('/:id/print-document', validate(getPrintJobSchema), getPrintableDocument);
printJobRouter.get('/:id', requireAuth, validate(getPrintJobSchema), getPrintJob);
printJobRouter.post('/:id/verify-otp', requireAuth, requireRole('shop_owner'), validate(verifyPrintJobOtpSchema), verifyPrintJobOtp);
printJobRouter.patch('/:id/status', requireAuth, requireRole('shop_owner', 'admin'), validate(updatePrintJobStatusSchema), updatePrintJobStatus);
