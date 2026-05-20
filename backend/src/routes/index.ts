import { Router } from 'express';
import { adminRouter } from './admin.routes';
import { authRouter } from './auth.routes';
import { documentRouter } from './document.routes';
import { errorLogRouter } from './errorLog.routes';
import { healthRouter } from './health.routes';
import { printJobRouter } from './printJob.routes';
import { shopRouter } from './shop.routes';

export const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/admin', adminRouter);
router.use('/documents', documentRouter);
router.use('/errors', errorLogRouter);
router.use('/print-jobs', printJobRouter);
router.use('/shops', shopRouter);
