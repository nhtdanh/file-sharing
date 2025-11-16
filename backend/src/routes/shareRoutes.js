import express from 'express';
import { z } from 'zod';
import * as shareController from '../controllers/shareController.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';

const router = express.Router();

const shareSchema = z.object({
  sharedToUserId: z.string().uuid(),
  encryptedAesKey: z.string().min(1),
  canDownload: z.boolean().optional(),
  canReshare: z.boolean().optional()
});

const unshareSchema = z.object({
  sharedToUserId: z.string().uuid()
});

router.get('/shared', authenticate, shareController.getSharedFiles);
router.post('/:id/share', authenticate, validate(shareSchema), shareController.share);
router.get('/:id/shares', authenticate, shareController.getFileShares);
router.delete('/:id/share', authenticate, validate(unshareSchema), shareController.unshare);

export default router;

