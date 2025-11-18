import express from 'express';
import { z } from 'zod';
import * as authController from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

//validate schemas
const registerSchema = z.object({
  username: z.string().min(6).max(16),
  publicKey: z.string().min(100),
  encryptedPrivateKey: z.string().min(100),
  salt: z.string().length(64)
});

const loginSchema = z.object({
  username: z.string().min(1)
});

// Routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/public-key/:username', authController.getPublicKey);

export default router;

