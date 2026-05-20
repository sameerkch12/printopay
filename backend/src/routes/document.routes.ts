import { Router } from 'express';
import { getLocalDocument, uploadDocument } from '../controllers/document.controller';
import { uploadPdf } from '../middleware/uploadPdf';

export const documentRouter = Router();

documentRouter.post('/upload', uploadPdf.single('file'), uploadDocument);
documentRouter.get('/local/:fileName', getLocalDocument);
