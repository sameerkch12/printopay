import { ErrorRequestHandler } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { saveErrorLogSafe } from '../services/errorLog.service';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    saveErrorLogSafe({
      source: 'backend',
      severity: err.statusCode >= 500 ? 'error' : 'warning',
      message: err.message,
      stack: err.stack,
      statusCode: err.statusCode,
      metadata: err.details,
    }, req);

    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof ZodError) {
    saveErrorLogSafe({
      source: 'backend',
      severity: 'warning',
      message: 'Validation failed',
      stack: err.stack,
      statusCode: 400,
      metadata: err.flatten(),
    }, req);

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      details: err.flatten(),
    });
  }

  if (err instanceof multer.MulterError) {
    saveErrorLogSafe({
      source: 'backend',
      severity: 'warning',
      message: err.message,
      stack: err.stack,
      statusCode: err.code === 'LIMIT_FILE_SIZE' ? 413 : 400,
      metadata: { code: err.code },
    }, req);

    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: `File must be ${env.MAX_UPLOAD_MB}MB or smaller`,
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  console.error(err);
  saveErrorLogSafe({
    source: 'backend',
    severity: 'error',
    message: err instanceof Error ? err.message : 'Unknown server error',
    stack: err instanceof Error ? err.stack : undefined,
    statusCode: 500,
  }, req);

  return res.status(500).json({
    success: false,
    message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
