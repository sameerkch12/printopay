import { Router } from 'express';
import { login, me, registerShopOwner, setupAdmin } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema, registerShopOwnerSchema, setupAdminSchema } from '../validators/auth.validator';

export const authRouter = Router();

authRouter.post('/shop-owner/register', validate(registerShopOwnerSchema), registerShopOwner);
authRouter.post('/login', validate(loginSchema), login);
authRouter.get('/me', requireAuth, me);
authRouter.post('/admin/setup', validate(setupAdminSchema), setupAdmin);
