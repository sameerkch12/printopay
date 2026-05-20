import { Request, Response } from 'express';
import { DocumentAsset } from '../models/DocumentAsset';
import { PrintJob } from '../models/PrintJob';
import { Shop } from '../models/Shop';
import { User } from '../models/User';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { sendSuccess } from '../utils/apiResponse';
import { emitRealtime } from '../services/realtime.service';

export const getAdminOverview = asyncHandler(async (_req: Request, res: Response) => {
  const [shops, users, documents, jobs, pendingJobs, completedJobs] = await Promise.all([
    Shop.countDocuments(),
    User.countDocuments(),
    DocumentAsset.countDocuments(),
    PrintJob.countDocuments(),
    PrintJob.countDocuments({ status: 'pending' }),
    PrintJob.countDocuments({ status: 'completed' }),
  ]);

  return sendSuccess(res, {
    shops,
    users,
    documents,
    jobs,
    pendingJobs,
    completedJobs,
  });
});

export const listAdminShops = asyncHandler(async (_req: Request, res: Response) => {
  const shops = await Shop.find().sort({ createdAt: -1 }).limit(200);
  return sendSuccess(res, shops);
});

export const updateShopApproval = asyncHandler(async (req: Request, res: Response) => {
  const shop = await Shop.findById(req.params.id);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  shop.approvalStatus = req.body.approvalStatus;
  shop.isActive = req.body.approvalStatus === 'approved';
  await shop.save();
  emitRealtime('shops:changed', { shopId: String(shop._id), reason: 'approval-updated' });

  return sendSuccess(res, shop);
});

export const listAdminPrintJobs = asyncHandler(async (_req: Request, res: Response) => {
  const jobs = await PrintJob.find()
    .populate('document')
    .populate('documents')
    .populate('shop')
    .sort({ createdAt: -1 })
    .limit(200);

  return sendSuccess(res, jobs);
});

export const listAdminUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find().select('-passwordHash').populate('shop').sort({ createdAt: -1 }).limit(200);
  return sendSuccess(res, users);
});
