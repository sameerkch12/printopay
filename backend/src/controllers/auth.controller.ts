import crypto from 'crypto';
import { Request, Response } from 'express';
import { env } from '../config/env';
import { Shop } from '../models/Shop';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { comparePassword, hashPassword, signToken } from '../services/auth.service';
import { emitRealtime } from '../services/realtime.service';

function sanitizeUser(user: {
  _id: unknown;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  shop?: unknown;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role,
    shop: user.shop,
  };
}

export const registerShopOwner = asyncHandler(async (req: Request, res: Response) => {
  const existing = await User.findOne({ email: req.body.email });
  if (existing) {
    throw new ApiError(409, 'Email is already registered');
  }

  const shop = await Shop.create({
    ...req.body.shop,
    qrCode: `printtary://shop/${crypto.randomUUID()}`,
    isActive: false,
    approvalStatus: 'pending',
  });

  const user = await User.create({
    name: req.body.ownerName,
    email: req.body.email,
    phone: req.body.phone,
    passwordHash: await hashPassword(req.body.password),
    role: 'shop_owner',
    shop: shop._id,
  });

  const token = signToken({ userId: user._id, role: 'shop_owner', shopId: shop._id });
  emitRealtime('shops:changed', { shopId: String(shop._id), reason: 'registered' });

  return sendSuccess(res, { token, user: sanitizeUser(user), shop }, 201);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash').populate('shop');

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordOk = await comparePassword(req.body.password, user.passwordHash);
  if (!passwordOk) {
    throw new ApiError(401, 'Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const shopId = user.shop && typeof user.shop === 'object' && '_id' in user.shop ? user.shop._id : user.shop;
  const token = signToken({ userId: user._id, role: user.role as 'shop_owner' | 'admin', shopId: shopId as string | undefined });

  return sendSuccess(res, { token, user: sanitizeUser(user), shop: user.shop });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.auth?.userId).populate('shop');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return sendSuccess(res, { user: sanitizeUser(user), shop: user.shop });
});

export const setupAdmin = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.setupKey !== env.ADMIN_SETUP_KEY) {
    throw new ApiError(403, 'Invalid admin setup key');
  }

  const existing = await User.findOne({ email: req.body.email });
  if (existing) {
    throw new ApiError(409, 'Email is already registered');
  }

  const admin = await User.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    passwordHash: await hashPassword(req.body.password),
    role: 'admin',
  });

  const token = signToken({ userId: admin._id, role: 'admin' });

  return sendSuccess(res, { token, user: sanitizeUser(admin) }, 201);
});
