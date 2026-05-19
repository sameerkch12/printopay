import { Router } from 'express';
import { getLocalDocument, getSignedDocumentUrl, uploadDocument } from '../controllers/document.controller';
import { uploadPdf } from '../middleware/uploadPdf';
import { validate } from '../middleware/validate';
import { signedDocumentUrlSchema } from '../validators/document.validator';

export const documentRouter = Router();

documentRouter.post('/upload', uploadPdf.single('file'), uploadDocument);
documentRouter.get('/local/:fileName', getLocalDocument);
documentRouter.get('/:id/signed-url', validate(signedDocumentUrlSchema), getSignedDocumentUrl);
