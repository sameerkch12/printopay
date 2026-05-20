import { Request } from 'express';
import { ErrorLog } from '../models/ErrorLog';
import { User } from '../models/User';

type ErrorSource = 'backend' | 'customer_app' | 'shop_dashboard';
type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

type ClientUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  shopId?: string;
};

type ErrorLogInput = {
  source: ErrorSource;
  severity?: ErrorSeverity;
  message: string;
  stack?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  metadata?: unknown;
  user?: ClientUser;
};

async function getRequestUser(req?: Request) {
  if (!req?.auth?.userId) return undefined;

  try {
    const user = await User.findById(req.auth.userId).select('name email role shop');
    if (!user) return undefined;

    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      shopId: user.shop?.toString(),
    };
  } catch {
    return {
      id: req.auth.userId,
      role: req.auth.role,
      shopId: req.auth.shopId,
    };
  }
}

export async function saveErrorLog(input: ErrorLogInput, req?: Request) {
  const requestUser = await getRequestUser(req);
  const user = requestUser ?? input.user;

  await ErrorLog.create({
    source: input.source,
    severity: input.severity ?? 'error',
    message: input.message.slice(0, 2000),
    stack: input.stack?.slice(0, 8000),
    path: input.path ?? req?.originalUrl,
    method: input.method ?? req?.method,
    statusCode: input.statusCode,
    userAgent: req?.get('user-agent'),
    ip: req?.ip,
    userId: user?.id,
    userName: user?.name,
    userEmail: user?.email,
    userRole: user?.role,
    shopId: user?.shopId,
    metadata: input.metadata,
  });
}

export function saveErrorLogSafe(input: ErrorLogInput, req?: Request) {
  saveErrorLog(input, req).catch((error) => {
    console.error('Failed to save error log', error);
  });
}
