import { RequestHandler } from 'express';
import { User } from '../models/User';
import { AuthRole } from '../types/express';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { verifyToken } from '../services/auth.service';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  const payload = verifyToken(token);
  const user = await User.findById(payload.sub);

  if (!user || !user.isActive) {
    throw new ApiError(401, 'Invalid session');
  }

  req.auth = {
    userId: user._id.toString(),
    role: user.role as AuthRole,
    shopId: user.shop?.toString(),
  };

  next();
});

export function requireRole(...roles: AuthRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(new ApiError(403, 'Permission denied'));
      return;
    }

    next();
  };
}
