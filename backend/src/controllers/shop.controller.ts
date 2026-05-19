import { Request, Response } from 'express';
import { Shop } from '../models/Shop';
import { uploadShopPhotoToCloudinary } from '../services/cloudinary.service';
import { emitRealtime } from '../services/realtime.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const createShop = asyncHandler(async (req: Request, res: Response) => {
  const approvalStatus = req.body.approvalStatus ?? (req.body.isActive ? 'approved' : 'pending');
  const shop = await Shop.create({
    ...req.body,
    isActive: approvalStatus === 'approved',
    approvalStatus,
  });
  emitRealtime('shops:changed', { shopId: String(shop._id), reason: 'created' });
  return sendSuccess(res, shop, 201);
});

function distanceKm(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }) {
  const radiusKm = 6371;
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLng = ((to.longitude - from.longitude) * Math.PI) / 180;
  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const listShops = asyncHandler(async (req: Request, res: Response) => {
  const shops = await Shop.find({ isActive: true, approvalStatus: 'approved' }).sort({ createdAt: -1 });
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lng);

  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    const current = { latitude, longitude };
    const withDistance = shops
      .map((shop) => {
        const item = shop.toObject();
        const shopLatitude = item.latitude;
        const shopLongitude = item.longitude;
        const hasLocation = typeof shopLatitude === 'number' && typeof shopLongitude === 'number';
        return {
          ...item,
          distanceKm: hasLocation ? distanceKm(current, { latitude: shopLatitude, longitude: shopLongitude }) : undefined,
        };
      })
      .sort((a, b) => (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY));

    return sendSuccess(res, withDistance);
  }

  return sendSuccess(res, shops);
});

export const getShop = asyncHandler(async (req: Request, res: Response) => {
  const shop = await Shop.findById(req.params.id);

  if (!shop || !shop.isActive || shop.approvalStatus !== 'approved') {
    throw new ApiError(404, 'Shop not found');
  }

  return sendSuccess(res, shop);
});

export const getShopByQrCode = asyncHandler(async (req: Request, res: Response) => {
  const code = decodeURIComponent(String(req.params.code));
  const shop = await Shop.findOne({
    $or: [
      { qrCode: code },
      { qrCode: `printtary://shop/${code}` },
    ],
    isActive: true,
    approvalStatus: 'approved',
  });

  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  return sendSuccess(res, shop);
});

export const updateMyShop = asyncHandler(async (req: Request, res: Response) => {
  if (!req.auth?.shopId) {
    throw new ApiError(403, 'Shop access required');
  }

  const shop = await Shop.findById(req.auth.shopId);
  if (!shop) {
    throw new ApiError(404, 'Shop not found');
  }

  const { name, address, phone, latitude, longitude, bwPerPage, colorPerPage } = req.body;
  if (typeof name === 'string') shop.name = name;
  if (typeof address === 'string') shop.address = address;
  if (typeof phone === 'string') shop.phone = phone;
  if (typeof latitude === 'number') shop.latitude = latitude;
  if (typeof longitude === 'number') shop.longitude = longitude;
  if (typeof bwPerPage === 'number' || typeof colorPerPage === 'number') {
    shop.printRates = {
      bwPerPage: bwPerPage ?? shop.printRates?.bwPerPage ?? 2,
      colorPerPage: colorPerPage ?? shop.printRates?.colorPerPage ?? 10,
    };
  }

  if (req.file) {
    const photo = await uploadShopPhotoToCloudinary(req.file, String(shop._id));
    shop.photoUrl = photo.secure_url;
    shop.photoPublicId = photo.public_id;
  }

  await shop.save();
  emitRealtime('shops:changed', { shopId: String(shop._id), reason: 'profile-updated' });

  return sendSuccess(res, shop);
});
