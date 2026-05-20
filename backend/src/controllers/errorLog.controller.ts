import { Request, Response } from 'express';
import { saveErrorLog } from '../services/errorLog.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const reportClientError = asyncHandler(async (req: Request, res: Response) => {
  await saveErrorLog(
    {
      source: req.body.source,
      severity: req.body.severity ?? 'error',
      message: req.body.message,
      stack: req.body.stack,
      path: req.body.path,
      metadata: req.body.metadata,
      user: req.body.user,
    },
    req
  );

  return sendSuccess(res, { logged: true }, 201);
});
