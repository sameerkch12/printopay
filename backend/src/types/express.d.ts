import { Types } from 'mongoose';

export type AuthRole = 'shop_owner' | 'admin';

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        role: AuthRole;
        shopId?: string;
      };
    }
  }
}

export type MongoId = Types.ObjectId;
