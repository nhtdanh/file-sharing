import express from 'express';
import { z } from 'zod';
import * as fileController from '../controllers/fileController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

const uploadSchema = z.object({
  encryptedBlob: z.string().min(1),
  iv: z.string().min(1),
  authTag: z.string().min(1),
  encryptedAesKey: z.string().min(1),
  fileName: z.string().max(255).optional().nullable(),
  fileSize: z.string().or(z.number()).refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num > 0;
  }, { message: 'File size phải là số dương' }),
  mimeType: z.string().max(100).min(1)
});

router.post('/upload', authenticate, validate(uploadSchema), fileController.upload);
router.get('/', authenticate, fileController.list);
router.get('/:id', authenticate, fileController.getById);
router.delete('/:id', authenticate, fileController.deleteFile);

export default router;

