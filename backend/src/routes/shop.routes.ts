import { Router } from 'express';
import { createShop, getShop, getShopByQrCode, listShops, updateMyShop } from '../controllers/shop.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { uploadShopPhoto } from '../middleware/uploadPdf';
import { validate } from '../middleware/validate';
import { createShopSchema, getShopByQrSchema, getShopSchema, updateMyShopSchema } from '../validators/shop.validator';

export const shopRouter = Router();

shopRouter.get('/', listShops);
shopRouter.post('/', requireAuth, requireRole('admin'), validate(createShopSchema), createShop);
shopRouter.patch('/mine', requireAuth, requireRole('shop_owner'), uploadShopPhoto.single('photo'), validate(updateMyShopSchema), updateMyShop);
shopRouter.get('/qr/:code', validate(getShopByQrSchema), getShopByQrCode);
shopRouter.get('/:id', validate(getShopSchema), getShop);
