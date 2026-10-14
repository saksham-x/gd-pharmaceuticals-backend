import { Router } from 'express';
import { panelAccount } from '../../middleware/auth.js';
import { documentUpload, imageUpload, uploadDocument, uploadImage } from './upload.controller.js';

export const uploadRouter = Router();

// Any staff portal account: every page that edits content may need an upload.
uploadRouter.post('/', panelAccount, imageUpload, uploadImage);
uploadRouter.post('/document', panelAccount, documentUpload, uploadDocument);
