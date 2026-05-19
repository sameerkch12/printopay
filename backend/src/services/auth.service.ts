import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Types } from 'mongoose';
import { env } from '../config/env';
import { AuthRole } from '../types/express';

export function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: Types.ObjectId | string; role: AuthRole; shopId?: Types.ObjectId | string }) {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };

  return jwt.sign(
    {
      sub: payload.userId.toString(),
      role: payload.role,
      shopId: payload.shopId?.toString(),
    },
    env.JWT_SECRET,
    options
  );
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as {
    sub: string;
    role: AuthRole;
    shopId?: string;
  };
}

export function signPrintAccessToken(payload: { jobId: string; shopId: string }) {
  return jwt.sign(
    {
      purpose: 'print-document',
      jobId: payload.jobId,
      shopId: payload.shopId,
    },
    env.JWT_SECRET,
    { expiresIn: '10m' }
  );
}

export function verifyPrintAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as {
    purpose: 'print-document';
    jobId: string;
    shopId: string;
  };
}
