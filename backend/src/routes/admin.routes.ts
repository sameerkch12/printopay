import { Router } from 'express';
import { getAdminOverview, listAdminPrintJobs, listAdminShops, listAdminUsers, updateShopApproval } from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateShopApprovalSchema } from '../validators/shop.validator';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));
adminRouter.get('/overview', getAdminOverview);
adminRouter.get('/shops', listAdminShops);
adminRouter.patch('/shops/:id/approval', validate(updateShopApprovalSchema), updateShopApproval);
adminRouter.get('/print-jobs', listAdminPrintJobs);
adminRouter.get('/users', listAdminUsers);
