import { Router } from 'express';
import { reportClientError } from '../controllers/errorLog.controller';
import { optionalAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { clientErrorLogSchema } from '../validators/errorLog.validator';

export const errorLogRouter = Router();

errorLogRouter.post('/client', optionalAuth, validate(clientErrorLogSchema), reportClientError);
